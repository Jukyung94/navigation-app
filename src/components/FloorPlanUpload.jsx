import { useState, useRef, useEffect } from 'react';
import './FloorPlanUpload.css';

export default function FloorPlanUpload({ onClose }) {
  const [floorPlan, setFloorPlan] = useState(() => localStorage.getItem('floorPlan'));
  const [exits, setExits] = useState(() => {
    const saved = localStorage.getItem('exits');
    return saved ? JSON.parse(saved) : [];
  });
  const [exitName, setExitName] = useState('');
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsAltitude, setGpsAltitude] = useState(null);
  const [selectedExit, setSelectedExit] = useState(null);
  const watchIdRef = useRef(null);

  // GPS tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setGpsPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGpsAccuracy(Math.round(position.coords.accuracy));
          setGpsAltitude(position.coords.altitude !== null ? Math.round(position.coords.altitude) : null);
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
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setFloorPlan(imageUrl);
        localStorage.setItem('floorPlan', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save current GPS position as exit marker
  const saveGPSPosition = () => {
    if (!gpsPosition) {
      alert('GPS position not available. Please wait for GPS signal.');
      return;
    }

    const name = exitName || `Exit ${exits.length + 1}`;
    const newExit = {
      lat: gpsPosition.lat,
      lng: gpsPosition.lng,
      altitude: gpsAltitude,
      accuracy: gpsAccuracy,
      name,
      timestamp: new Date().toISOString()
    };
    
    const updatedExits = [...exits, newExit];
    setExits(updatedExits);
    localStorage.setItem('exits', JSON.stringify(updatedExits));
    setExitName('');
    
    alert(`Saved: ${name}\nLat: ${gpsPosition.lat.toFixed(6)}\nLng: ${gpsPosition.lng.toFixed(6)}`);
  };

  const removeExit = (index) => {
    const updatedExits = exits.filter((_, i) => i !== index);
    setExits(updatedExits);
    localStorage.setItem('exits', JSON.stringify(updatedExits));
  };

  const clearAll = () => {
    if (confirm('Clear floor plan and all exits?')) {
      setFloorPlan(null);
      setExits([]);
      localStorage.removeItem('floorPlan');
      localStorage.removeItem('exits');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Setup Exit Markers</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="floor-plan-upload">
            <div className="upload-section">
              <label htmlFor="file-upload" className="upload-btn">
                {floorPlan ? 'Change Floor Plan' : 'Upload Floor Plan'}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {floorPlan && (
              <>
                <div className="instructions">
                  Save your current GPS location as an exit marker
                </div>

          {/* GPS Information Display */}
          {gpsPosition ? (
            <div className="gps-info-card">
              <div className="gps-quality">
                {gpsAccuracy < 5 && <span className="quality-excellent">🟢 Excellent GPS</span>}
                {gpsAccuracy >= 5 && gpsAccuracy < 10 && <span className="quality-good">🟡 Good GPS</span>}
                {gpsAccuracy >= 10 && gpsAccuracy < 20 && <span className="quality-fair">🟠 Fair GPS</span>}
                {gpsAccuracy >= 20 && <span className="quality-poor">🔴 Poor GPS - Move outdoors</span>}
              </div>
              <div className="gps-info-row">
                <span className="label">Latitude:</span>
                <span className="value">{gpsPosition.lat.toFixed(6)}°</span>
              </div>
              <div className="gps-info-row">
                <span className="label">Longitude:</span>
                <span className="value">{gpsPosition.lng.toFixed(6)}°</span>
              </div>
              {gpsAltitude !== null && (
                <div className="gps-info-row">
                  <span className="label">Elevation:</span>
                  <span className="value">{gpsAltitude} m</span>
                </div>
              )}
              <div className="gps-info-row">
                <span className="label">Accuracy:</span>
                <span className="value">±{gpsAccuracy} m</span>
              </div>
            </div>
          ) : (
            <div className="gps-loading">
              Waiting for GPS signal... (Go outdoors for best accuracy)
            </div>
          )}

          <div className="exit-name-input">
            <input
              type="text"
              placeholder="Exit name (optional)"
              value={exitName}
              onChange={(e) => setExitName(e.target.value)}
            />
          </div>

          <button 
            onClick={saveGPSPosition} 
            className="save-gps-btn"
            disabled={!gpsPosition}
          >
            📍 Save Current GPS Position
          </button>

          <div className="exits-list">
            <h3>Saved Exit Markers ({exits.length})</h3>
            {exits.map((exit, i) => (
              <div key={i} className="exit-item">
                <div 
                  className={`exit-info ${selectedExit === i ? 'expanded' : ''}`}
                  onClick={() => setSelectedExit(selectedExit === i ? null : i)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setSelectedExit(selectedExit === i ? null : i);
                  }}
                >
                  <div className="exit-name">{exit.name}</div>
                  {selectedExit === i ? (
                    <div className="exit-details">
                      <div className="detail-row">
                        <span className="detail-label">Latitude:</span>
                        <span className="detail-value">{exit.lat.toFixed(6)}°</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Longitude:</span>
                        <span className="detail-value">{exit.lng.toFixed(6)}°</span>
                      </div>
                      {exit.altitude !== null && (
                        <div className="detail-row">
                          <span className="detail-label">Elevation:</span>
                          <span className="detail-value">{exit.altitude} m</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Accuracy:</span>
                        <span className="detail-value">±{exit.accuracy} m</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Saved:</span>
                        <span className="detail-value">
                          {new Date(exit.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="exit-coords">
                      Tap to view details
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExit(i);
                  }} 
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

                <button onClick={clearAll} className="clear-btn">
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
