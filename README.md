# 🧭 Emergency Exit Compass App

A React-based web application that uses smartphone sensors (compass & GPS) to help users navigate to emergency exits using floor plans.

## Features

- **Real-time Compass**: Uses device orientation sensors for accurate heading
- **Floor Plan Integration**: Upload and mark emergency exits on building floor plans
- **GPS Tracking**: Real-time position tracking with calibration system
- **Manual Positioning**: Tap-to-place for indoor use or testing
- **Smart Navigation**: Automatically finds nearest exit and shows direction
- **Smooth Rotation**: No 360°/0° jump issues with intelligent interpolation
- **Mobile-First**: Designed for smartphones with HTTPS sensor access

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (HTTPS enabled)
npm run dev
```

Access on mobile: `https://[YOUR-IP]:5173`

See [TESTING.md](TESTING.md) for detailed mobile testing instructions.

## How It Works

1. **Setup**: Upload a floor plan and mark emergency exits
2. **Position**: Choose manual (tap) or GPS mode
3. **Navigate**: Compass shows direction and distance to nearest exit

## Tech Stack

- React 19
- Vite (with HTTPS)
- Device Orientation API (compass)
- Geolocation API (GPS)
- LocalStorage (persistence)

## Browser Support

- ✅ iOS Safari (with permission)
- ✅ Android Chrome/Firefox/Edge
- ⚠️ Desktop browsers (limited sensor support)

## Development

See [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) for detailed feature list and technical decisions.

## Requirements

- HTTPS (required for device sensors)
- Modern smartphone with compass and GPS
- Node.js v20.18.0 or higher

## License

MIT
