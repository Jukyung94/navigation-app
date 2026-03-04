# Testing the Emergency Exit Compass App

## Prerequisites
- Node.js v20.18.0 or higher
- A smartphone (iOS or Android) with compass and GPS
- Both devices on the same WiFi network

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will start with HTTPS enabled (required for device sensors).

## Accessing on Mobile

### Method 1: Local Network (Recommended)

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. On your phone's browser, navigate to:
   ```
   https://[YOUR-IP]:5173
   ```
   Example: `https://192.168.1.100:5173`

3. You'll see a security warning (self-signed certificate). This is normal for local development:
   - iOS Safari: Tap "Show Details" → "visit this website"
   - Android Chrome: Tap "Advanced" → "Proceed to [IP] (unsafe)"

### Method 2: Using ngrok (No Certificate Warnings)

1. Install ngrok: https://ngrok.com/download

2. In a separate terminal, run:
   ```bash
   ngrok http https://localhost:5173
   ```

3. Use the HTTPS URL provided by ngrok on your phone

## Testing Checklist

### Initial Setup
- [ ] App loads on mobile device
- [ ] Navigation between Compass and Setup tabs works

### Floor Plan Setup
- [ ] Upload a floor plan image
- [ ] Click to mark emergency exits
- [ ] Name exits (optional)
- [ ] Exits are saved (persist after refresh)
- [ ] Remove individual exits
- [ ] Clear all data

### Compass Permissions
- [ ] iOS: Permission request appears
- [ ] iOS: Compass works after granting permission
- [ ] Android: Compass works automatically

### Compass Features
- [ ] Compass rotates smoothly as device rotates
- [ ] No 360°/0° jump issue
- [ ] Heading badge shows correct degrees
- [ ] Cardinal directions (N, S, E, W) visible
- [ ] Degree markers visible
- [ ] Floor plan rotates with compass

### Manual Mode
- [ ] Tap on floor plan to set position
- [ ] Blue position marker appears
- [ ] Nearest exit is calculated
- [ ] Distance shown in meters
- [ ] Direction indicator points to exit
- [ ] Cardinal direction text updates

### GPS Mode
- [ ] Switch to GPS mode
- [ ] GPS accuracy displayed
- [ ] Position updates as you move (outdoors)
- [ ] Calibrate GPS button appears in manual mode
- [ ] Calibration saves and persists

### Navigation
- [ ] Green exit indicator visible
- [ ] Indicator rotates to point at nearest exit
- [ ] Pulsing animation on indicator
- [ ] Distance updates as you move
- [ ] Exit name displayed

## Known Issues

### GPS Accuracy
- GPS works best outdoors with clear sky view
- Indoor GPS may be inaccurate or unavailable
- Accuracy varies by device (typically 5-50 meters)

### Compass Calibration
- Some devices may need calibration (figure-8 motion)
- Magnetic interference can affect accuracy
- Keep away from metal objects and electronics

### Browser Compatibility
- iOS: Safari only (Chrome uses Safari engine)
- Android: Chrome, Firefox, Edge all work
- Desktop: Limited sensor support

## Troubleshooting

### Compass Not Working
1. Check HTTPS is enabled (required for sensors)
2. Grant permission when prompted (iOS)
3. Try calibrating device (figure-8 motion)
4. Check browser console for errors

### GPS Not Working
1. Enable location services in device settings
2. Grant location permission to browser
3. Try outdoors for better signal
4. Check GPS accuracy indicator

### Certificate Warnings
- Normal for self-signed certificates
- Safe to proceed on local network
- Use ngrok to avoid warnings

### App Not Loading
1. Check both devices on same WiFi
2. Verify IP address is correct
3. Try disabling firewall temporarily
4. Check port 5173 is not blocked

## Performance Tips

- Close other apps to improve sensor performance
- Keep device charged (GPS drains battery)
- Avoid magnetic interference for compass
- Use WiFi for better GPS accuracy indoors

## Next Steps

After basic testing works:
1. Test with real floor plan in actual building
2. Mark actual emergency exits
3. Walk around and verify navigation accuracy
4. Test in emergency scenarios (if safe)
5. Gather feedback from users
