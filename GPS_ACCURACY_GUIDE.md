# GPS Accuracy Improvement Guide

## Current Implementation
The app uses the browser's Geolocation API with `enableHighAccuracy: true`, which requests the most accurate position available.

## How to Improve GPS Accuracy

### 1. Hardware & Environment Factors

**Best Practices:**
- **Go outdoors**: GPS works best with clear sky view
- **Avoid buildings**: Tall buildings cause signal reflection (multipath error)
- **Stay away from metal**: Metal structures interfere with GPS signals
- **Wait for signal lock**: Give GPS 30-60 seconds to acquire satellites
- **Check weather**: Heavy clouds and rain reduce accuracy
- **Use newer devices**: Newer phones have better GPS chips

**Typical Accuracy:**
- Outdoors, clear sky: 3-5 meters
- Outdoors, partial obstruction: 5-10 meters
- Near buildings: 10-30 meters
- Indoors: 30-100+ meters (or no signal)

### 2. Software Optimizations (Already Implemented)

```javascript
{
  enableHighAccuracy: true,  // Request best accuracy
  maximumAge: 0,             // Don't use cached positions
  timeout: 10000             // 10 second timeout
}
```

### 3. Additional Improvements You Can Make

#### A. Average Multiple Readings
Instead of saving a single GPS reading, collect multiple readings and average them:

```javascript
// Collect 10 readings over 10 seconds
const readings = [];
for (let i = 0; i < 10; i++) {
  const position = await getCurrentPosition();
  readings.push({
    lat: position.coords.latitude,
    lng: position.coords.longitude
  });
  await sleep(1000); // Wait 1 second
}

// Calculate average
const avgLat = readings.reduce((sum, r) => sum + r.lat, 0) / readings.length;
const avgLng = readings.reduce((sum, r) => sum + r.lng, 0) / readings.length;
```

#### B. Filter by Accuracy Threshold
Only accept readings with good accuracy:

```javascript
if (position.coords.accuracy < 10) { // Only accept if accuracy < 10m
  savePosition(position);
} else {
  showMessage('GPS accuracy too low, please wait...');
}
```

#### C. Use Kalman Filter
Implement a Kalman filter to smooth GPS readings and reduce noise.

#### D. Combine with Other Sensors
- Use device compass for direction
- Use accelerometer for movement detection
- Use WiFi positioning as fallback (less accurate but works indoors)

### 4. Device-Specific Tips

**iOS:**
- Enable "Precise Location" in Settings → Privacy → Location Services
- Make sure app has "While Using" permission
- Calibrate compass by moving phone in figure-8 pattern

**Android:**
- Enable "High Accuracy" mode in Location settings
- Turn on "Google Location Accuracy"
- Make sure GPS is enabled (not just WiFi/Network)
- Some phones have "GPS Test" apps to check satellite count

### 5. When to Save Markers

**Best Time to Save:**
- After GPS accuracy shows < 10 meters
- After staying in same location for 30+ seconds
- When satellite count is high (if available)
- When HDOP (Horizontal Dilution of Precision) is low

**Visual Indicators to Add:**
```javascript
// Show GPS quality indicator
if (accuracy < 5) return '🟢 Excellent';
if (accuracy < 10) return '🟡 Good';
if (accuracy < 20) return '🟠 Fair';
return '🔴 Poor';
```

### 6. Alternative: Assisted GPS (A-GPS)

Modern smartphones use A-GPS which combines:
- GPS satellites
- Cell tower triangulation
- WiFi positioning
- Bluetooth beacons (if available)

This is automatically used by the browser's Geolocation API.

### 7. For Indoor Use

GPS doesn't work well indoors. Consider:
- **WiFi positioning**: Less accurate (10-50m) but works indoors
- **Bluetooth beacons**: Very accurate (1-3m) but requires hardware
- **QR codes**: Place QR codes at exits, scan to mark position
- **Manual marking**: Use floor plan with tap-to-mark

### 8. Recommended Implementation

Add a "GPS Quality" indicator and only allow saving when quality is good:

```javascript
const [gpsQuality, setGpsQuality] = useState('waiting');

useEffect(() => {
  if (!gpsAccuracy) {
    setGpsQuality('waiting');
  } else if (gpsAccuracy < 5) {
    setGpsQuality('excellent');
  } else if (gpsAccuracy < 10) {
    setGpsQuality('good');
  } else if (gpsAccuracy < 20) {
    setGpsQuality('fair');
  } else {
    setGpsQuality('poor');
  }
}, [gpsAccuracy]);

// Only enable save button when quality is good
<button 
  disabled={gpsQuality === 'poor' || gpsQuality === 'waiting'}
  onClick={saveGPSPosition}
>
  Save Position {gpsQuality === 'excellent' && '🟢'}
</button>
```

### 9. Testing GPS Accuracy

**Apps to Test GPS:**
- iOS: "GPS Status & Toolbox"
- Android: "GPS Test" or "GPS Status"

These show:
- Number of satellites
- Signal strength
- Accuracy in meters
- Altitude
- Speed

### 10. Summary

**Quick Wins:**
1. ✅ Already using `enableHighAccuracy: true`
2. ✅ Already showing accuracy in meters
3. 🔄 Add GPS quality indicator (excellent/good/fair/poor)
4. 🔄 Only allow saving when accuracy < 10m
5. 🔄 Average 5-10 readings before saving
6. 🔄 Show satellite count if available
7. 🔄 Add "Wait for better signal" message

**For Production:**
- Consider using dedicated GPS hardware for critical applications
- Use differential GPS (DGPS) for sub-meter accuracy
- Implement RTK (Real-Time Kinematic) for centimeter accuracy
- Use survey-grade GPS receivers for professional use

## Current App Accuracy

Your app should achieve:
- **Outdoors**: 3-10 meters (typical smartphone GPS)
- **Near buildings**: 10-30 meters
- **Indoors**: Not reliable (use alternative methods)

This is sufficient for emergency exit navigation where you need to know which exit is nearest, not exact position.
