import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './CompassView.css';

export default function CompassView({ onOpenSetup }) {
  const [heading, setHeading] = useState(0);
  const [smoothHeading, setSmoothHeading] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(() => {
    return !(typeof DeviceOrientationEvent !== 'undefined' && 
             typeof DeviceOrientationEvent.requestPermission === 'function');
  });
  const [permissionNeeded, setPermissionNeeded] = useState(
    typeof DeviceOrientationEvent !== 'undefined' && 
    typeof DeviceOrientationEvent.requestPermission === 'function'
  );
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsAltitude, setGpsAltitude] = useState(null);
  const [userPosition, setUserPosition] = useState({ x: 50, y: 50 });
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(0);
  const [showMarkerDetails, setShowMarkerDetails] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [floorPlan, setFloorPlan] = useState(() => localStorage.getItem('floorPlan'));
  const [exits, setExits] = useState(() => {
    const saved = localStorage.getItem('exits');
    return saved ? JSON.parse(saved) : [];
  });
  const [calibration, setCalibration] = useState(() => {
    const saved = localStorage.getItem('gpsCalibration');
    return saved ? JSON.parse(saved) : null;
  });
  
  const watchIdRef = useRef(null);

  // Get selected marker
  const selectedMarker = exits.length > 0 ? exits[selectedMarkerIndex] : null;
  
  // Load floor plan and exits from localStorage (with live updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedExits = localStorage.getItem('exits');
      if (savedExits) {
        setExits(JSON.parse(savedExits));
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes (in case storage event doesn't fire)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Request device orientation permission (iOS)
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          setPermissionNeeded(false);
        }
      } catch (error) {
        console.error('Permission denied:', error);
      }
    } else {
      setPermissionGranted(true);
      setPermissionNeeded(false);
    }
  };

  // Device orientation listener with debouncing
  useEffect(() => {
    if (!permissionGranted) return;

    let lastUpdate = 0;
    const updateThreshold = 100; // Update every 100ms max

    const handleOrientation = (event) => {
      const now = Date.now();
      if (now - lastUpdate < updateThreshold) return;
      lastUpdate = now;

      let alpha = event.alpha;
      
      if (alpha !== null) {
        // iOS uses webkitCompassHeading
        if (event.webkitCompassHeading !== undefined) {
          alpha = event.webkitCompassHeading;
        } else if (event.absolute && event.alpha !== null) {
          // Android: convert alpha to compass heading
          alpha = 360 - alpha;
        }
        
        // Round to reduce micro-changes
        alpha = Math.round(alpha * 10) / 10;
        setHeading(alpha);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permissionGranted]);

  // Smooth heading interpolation with threshold to prevent constant updates
  useEffect(() => {
    const interpolate = () => {
      setSmoothHeading(prev => {
        let diff = heading - prev;
        
        // Handle 360/0 wrap
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        // Only update if difference is significant (reduce re-renders)
        if (Math.abs(diff) < 0.1) return prev;
        
        const newHeading = prev + diff * 0.3;
        return (newHeading + 360) % 360;
      });
    };

    const interval = setInterval(interpolate, 50); // Reduced frequency
    return () => clearInterval(interval);
  }, [heading]);

  // Helper function to convert GPS to floor plan coordinates
  const gpsToFloorPlan = useCallback((gps) => {
    if (!calibration) return { x: 50, y: 50 };
    
    // Simple linear mapping (can be improved with multi-point calibration)
    const latDiff = gps.lat - calibration.gpsLat;
    const lngDiff = gps.lng - calibration.gpsLng;
    
    return {
      x: calibration.floorX + lngDiff * 10000, // Scale factor
      y: calibration.floorY + latDiff * 10000
    };
  }, [calibration]);

  // GPS tracking with debouncing
  useEffect(() => {
    if ('geolocation' in navigator) {
      let lastUpdate = 0;
      const updateThreshold = 1000; // Update position every 1 second max

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastUpdate < updateThreshold) return;
          lastUpdate = now;

          const gps = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setGpsPosition(gps);
          setGpsAccuracy(Math.round(position.coords.accuracy));
          setGpsAltitude(position.coords.altitude !== null ? Math.round(position.coords.altitude) : null);
          
          // Update user position if calibrated
          if (calibration) {
            const floorPos = gpsToFloorPlan(gps);
            // Round to reduce re-renders
            setUserPosition({
              x: Math.round(floorPos.x * 10) / 10,
              y: Math.round(floorPos.y * 10) / 10
            });
          }
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [calibration, gpsToFloorPlan]);

  // Calculate nearest exit using useMemo with stable reference
  const nearestExit = useMemo(() => {
    if (exits.length === 0 || !gpsPosition) return null;

    let nearest = null;
    let minDistance = Infinity;

    exits.forEach(exit => {
      // Calculate distance using Haversine formula (GPS coordinates)
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (gpsPosition.lat * Math.PI) / 180;
      const φ2 = (exit.lat * Math.PI) / 180;
      const Δφ = ((exit.lat - gpsPosition.lat) * Math.PI) / 180;
      const Δλ = ((exit.lng - gpsPosition.lng) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in meters
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...exit, distance };
      }
    });

    if (nearest) {
      // Calculate bearing from current position to exit
      const φ1 = (gpsPosition.lat * Math.PI) / 180;
      const φ2 = (nearest.lat * Math.PI) / 180;
      const Δλ = ((nearest.lng - gpsPosition.lng) * Math.PI) / 180;

      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) -
                Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      let bearing = (Math.atan2(y, x) * 180) / Math.PI;
      bearing = (bearing + 360) % 360;
      
      // Round to reduce re-renders
      nearest.bearing = Math.round(bearing);
      nearest.distance = Math.round(nearest.distance);
    }

    return nearest;
  }, [exits, gpsPosition]);

  const handleFloorPlanClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setUserPosition({ x, y });
    
    // If we have GPS, calibrate it to this position
    if (gpsPosition) {
      const cal = {
        gpsLat: gpsPosition.lat,
        gpsLng: gpsPosition.lng,
        floorX: x,
        floorY: y
      };
      setCalibration(cal);
      localStorage.setItem('gpsCalibration', JSON.stringify(cal));
    }
  };

  const getCardinalDirection = (bearing) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  // Test function to simulate compass rotation
  const testCompass = () => {
    let angle = 0;
    const interval = setInterval(() => {
      angle = (angle + 5) % 360;
      setHeading(angle);
      if (angle === 0) clearInterval(interval);
    }, 50);
  };

  if (permissionNeeded && !permissionGranted) {
    return (
      <div className="permission-screen">
        <h2>Compass Permission Required</h2>
        <p>This app needs access to your device's compass to show directions.</p>
        <button onClick={requestPermission} className="permission-btn">
          Enable Compass
        </button>
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#888' }}>
          Note: Make sure you're using HTTPS and on a mobile device with compass sensor.
        </p>
      </div>
    );
  }

  return (
    <div className="compass-view">
      {/* Compass content centered */}
      <div className="compass-content">
        {/* Degree display at top */}
        <div className="degree-display">
          {Math.round(smoothHeading)}°
        </div>

        <div className="compass-container">
        {/* Rotating compass ring with markers */}
        <div 
          className="compass-ring"
          style={{ transform: `rotate(${-smoothHeading}deg)` }}
        >
          {/* Degree markers every 10 degrees */}
          {Array.from({ length: 36 }, (_, i) => i * 10).map(deg => (
            <div
              key={deg}
              className={`degree-marker ${deg % 30 === 0 ? 'major' : ''}`}
              style={{ transform: `rotate(${deg}deg)` }}
            >
              {deg % 30 === 0 && deg !== 0 && (
                <span className="degree-label" style={{ transform: `rotate(${smoothHeading}deg)` }}>
                  {deg}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Cardinal directions - move around the compass */}
        {[
          { dir: 'N', angle: 0, distance: 115 },
          { dir: 'E', angle: 90, distance: 115 },
          { dir: 'S', angle: 180, distance: 115 },
          { dir: 'W', angle: 270, distance: 115 }
        ].map(({ dir, angle, distance }) => {
          const rotatedAngle = angle - smoothHeading;
          const radians = (rotatedAngle * Math.PI) / 180;
          const x = Math.sin(radians) * distance;
          const y = -Math.cos(radians) * distance;
          
          return (
            <div
              key={dir}
              className="cardinal-direction"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                color: dir === 'N' ? '#ff5252' : '#fff'
              }}
            >
              {dir}
            </div>
          );
        })}

        {/* Floor plan layer (rotates with compass) */}
        <div
          className="floor-plan-layer"
          style={{
            transform: `rotate(${-smoothHeading}deg)`,
            backgroundImage: floorPlan ? `url(${floorPlan})` : 'none'
          }}
          onClick={handleFloorPlanClick}
        >
          {/* Current position marker */}
          <div
            className="position-marker"
            style={{
              left: `${userPosition.x}%`,
              top: `${userPosition.y}%`
            }}
          />
          
          {/* Exit markers */}
          {exits.map((exit, i) => (
            <div
              key={i}
              className="exit-marker"
              style={{ left: `${exit.x}%`, top: `${exit.y}%` }}
            />
          ))}
        </div>

        {/* Center crosshair (fixed) */}
        <div className="crosshair" />

        {/* North indicator (fixed at top) */}
        <div className="north-indicator" />

        {/* Exit direction indicator (rotates to point at exit) */}
        {nearestExit && (
          <div
            className="exit-indicator"
            style={{
              transform: `rotate(${nearestExit.bearing - smoothHeading}deg)`
            }}
          />
        )}
      </div>

      {/* Marker Selector - Horizontal with Distance */}
      {exits.length > 0 && selectedMarker && (
        <div className="marker-selector">
          <div className="marker-info-left">
            {exits.length === 1 ? (
              <div className="marker-single">
                <span className="marker-name">{exits[0].name}</span>
                <button 
                  className="toggle-details-btn"
                  onClick={() => setShowMarkerDetails(true)}
                >
                  ▼
                </button>
              </div>
            ) : (
              <div className="marker-select-wrapper">
                <select 
                  value={selectedMarkerIndex}
                  onChange={(e) => setSelectedMarkerIndex(Number(e.target.value))}
                  className="marker-select"
                >
                  {exits.map((exit, i) => (
                    <option key={i} value={i}>{exit.name}</option>
                  ))}
                </select>
                <button 
                  className="toggle-details-btn"
                  onClick={() => setShowMarkerDetails(true)}
                >
                  ▼
                </button>
              </div>
            )}
          </div>

          {nearestExit && nearestExit.name === selectedMarker.name && (
            <div className="marker-distance">
              <div className="marker-distance-value">{Math.round(nearestExit.distance)}</div>
              <div className="marker-distance-label">meters</div>
            </div>
          )}
        </div>
      )}

      {/* GPS Details Popup */}
      {showMarkerDetails && selectedMarker && (
        <div className="gps-popup-overlay" onClick={() => setShowMarkerDetails(false)}>
          <div className="gps-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="gps-popup-header">
              <div className="gps-popup-title">{selectedMarker.name}</div>
              <button 
                className="gps-popup-close"
                onClick={() => setShowMarkerDetails(false)}
              >
                ✕
              </button>
            </div>

            <div className="gps-popup-body">
              <div className="marker-detail-row">
                <span className="marker-label">Latitude:</span>
                <span className="marker-value">{selectedMarker.lat.toFixed(6)}°</span>
              </div>
              <div className="marker-detail-row">
                <span className="marker-label">Longitude:</span>
                <span className="marker-value">{selectedMarker.lng.toFixed(6)}°</span>
              </div>
              {selectedMarker.altitude !== null && (
                <div className="marker-detail-row">
                  <span className="marker-label">Elevation:</span>
                  <span className="marker-value">{selectedMarker.altitude} m</span>
                </div>
              )}
              <div className="marker-detail-row">
                <span className="marker-label">Accuracy:</span>
                <span className="marker-value">±{selectedMarker.accuracy} m</span>
              </div>
              <div className="marker-detail-row">
                <span className="marker-label">Distance:</span>
                <span className="marker-value">
                  {nearestExit && nearestExit.name === selectedMarker.name 
                    ? `${Math.round(nearestExit.distance)} m` 
                    : 'Calculating...'}
                </span>
              </div>
              <div className="marker-detail-row">
                <span className="marker-label">Direction:</span>
                <span className="marker-value">
                  {nearestExit && nearestExit.name === selectedMarker.name 
                    ? getCardinalDirection(nearestExit.bearing)
                    : '-'}
                </span>
              </div>
              <div className="marker-detail-row">
                <span className="marker-label">Saved:</span>
                <span className="marker-value">
                  {new Date(selectedMarker.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* GPS Information Display */}
      {gpsPosition && (
        <div className="gps-details">
          <div className="gps-detail-item">
            <span className="gps-label">Latitude:</span>
            <span className="gps-value">{gpsPosition.lat.toFixed(6)}°</span>
          </div>
          <div className="gps-detail-item">
            <span className="gps-label">Longitude:</span>
            <span className="gps-value">{gpsPosition.lng.toFixed(6)}°</span>
          </div>
          {gpsAltitude !== null && (
            <div className="gps-detail-item">
              <span className="gps-label">Elevation:</span>
              <span className="gps-value">{gpsAltitude} m</span>
            </div>
          )}
          <div className="gps-detail-item">
            <span className="gps-label">Accuracy:</span>
            <span className="gps-value">±{gpsAccuracy} m</span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="bottom-bar">
        <div className="gps-info">
          {!calibration && (
            <div style={{ color: '#ff9800', fontSize: '0.75rem' }}>
              Tap floor plan to set position
            </div>
          )}
        </div>
        
        <div className="button-group">
          <button onClick={testCompass} className="action-btn test-btn">
            Test Rotation
          </button>
          <button onClick={onOpenSetup} className="action-btn">
            📍 Setup Markers
          </button>
        </div>
      </div>
    </div>
  );
}
