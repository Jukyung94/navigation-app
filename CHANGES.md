# Recent Changes

## Removed Manual Mode
- Removed manual/GPS mode toggle
- App now uses GPS automatically when available
- Users can tap the floor plan to set their position and calibrate GPS
- Position automatically updates via GPS once calibrated

## Fixed Direction Calculation
- Corrected bearing calculation using proper atan2 formula
- Exit indicator now points in the correct direction
- Bearing is calculated from user position to exit position

## Updated Compass Design
- Matches reference image with gray ring and markers
- Red north indicator (triangle) at top
- White cardinal directions (N, E, S, W) on rotating ring
- Degree markers every 10° with major markers every 30°
- Darker center area for floor plan
- Red exit indicator dot at bottom

## Improved Sensor Detection
- Listens to both `deviceorientationabsolute` and `deviceorientation` events
- Better Android support with `event.absolute` check
- Debug display shows raw heading and permission status

## Simplified UI
- Removed mode selector buttons
- Single workflow: tap to set position, GPS auto-calibrates
- Test rotation button for debugging
- GPS accuracy display when available

## How to Use

1. Upload floor plan and mark exits (Setup tab)
2. Go to Compass tab
3. Tap on the floor plan where you are currently located
4. If GPS is available, it will auto-calibrate to that position
5. As you move, your position updates automatically (if GPS calibrated)
6. Compass shows direction to nearest exit

## Testing

- Use "Test Rotation" button to verify compass rotates smoothly
- Check debug info (Raw heading) to see if sensor is working
- Make sure you're using HTTPS on a mobile device
- Grant compass permission when prompted (iOS)
