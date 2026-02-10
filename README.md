# 🧭 Emergency Exit Compass

A mobile-first web application that uses your smartphone's compass and GPS sensors to guide you to the nearest emergency exit using uploaded floor plans.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)
![Vite](https://img.shields.io/badge/Vite-7.3-purple.svg)

## ✨ Features

- 📱 **Real-time Compass** - Uses device orientation sensors for accurate heading
- 🗺️ **Floor Plan Integration** - Upload and mark emergency exits on building layouts
- 📍 **GPS Navigation** - Track your position with GPS calibration
- 🎯 **Smart Exit Finding** - Automatically calculates nearest exit
- 🧭 **Visual Direction** - Arrow indicator showing exit direction
- 📏 **Distance Display** - Real-time distance to nearest exit
- 🔄 **Smooth Rotation** - No jumps at 0°/360° transition
- 💾 **Offline Storage** - Floor plans saved locally

## 🚀 Demo

> **Note**: This app requires HTTPS and device sensors (compass/GPS). Best experienced on mobile devices.

## 📱 Screenshots

<!-- Add screenshots here when available -->

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Device Orientation API** - Compass functionality
- **Geolocation API** - GPS tracking
- **Canvas API** - Floor plan rendering
- **LocalStorage** - Data persistence

## 📋 Prerequisites

- Node.js v20.18.0 or higher
- npm 10.8.2 or higher
- Modern smartphone with compass and GPS
- HTTPS connection (required for device sensors)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/emergency-exit-compass.git
cd emergency-exit-compass
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the app:
   - Local: `https://localhost:5173`
   - Network: `https://[your-ip]:5173` (for mobile testing)

## 📱 Mobile Testing

### Option 1: Local Network (Recommended)

1. Start the dev server: `npm run dev`
2. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
3. On your phone, navigate to: `https://[your-ip]:5173`
4. Accept the security warning (self-signed certificate)
5. Grant sensor permissions when prompted

### Option 2: Using ngrok (No Certificate Warnings)

1. Install [ngrok](https://ngrok.com/download)
2. Run: `ngrok http https://localhost:5173`
3. Use the provided HTTPS URL on your phone

See [TESTING.md](TESTING.md) for detailed instructions.

## 📖 Usage

### 1. Upload Floor Plan
- Tap the ⚙️ settings button
- Upload your building's floor plan image
- Click on the image to mark emergency exits
- Save the floor plan

### 2. Choose Navigation Mode
- **GPS Mode**: Uses real GPS coordinates (requires calibration)
- **Manual Mode**: Tap on map to set your position

### 3. Calibrate (GPS Mode Only)
- Stand at a known point on the floor plan
- Enter the coordinates manually
- Tap "Calibrate Current Position"

### 4. Navigate
- The compass shows your current heading
- Green exit indicator points to nearest exit
- Distance is displayed below the compass
- Follow the arrow to reach the exit

## 🏗️ Project Structure

```
emergency-exit-compass/
├── src/
│   ├── App.vue                 # Main app container
│   ├── main.js                 # Entry point
│   └── components/
│       ├── CompassView.vue     # Main compass + navigation
│       └── FloorPlanUpload.vue # Floor plan management
├── public/
├── vite.config.js              # Vite configuration
├── TESTING.md                  # Testing instructions
├── DEVELOPMENT_LOG.md          # Development history
└── README.md                   # This file
```

## 🔒 Security & Privacy

- All data is stored locally on your device
- No data is sent to external servers
- GPS coordinates are only used for navigation
- Floor plans remain on your device

## 🌐 Browser Compatibility

| Browser | Compass | GPS | Status |
|---------|---------|-----|--------|
| iOS Safari | ✅ | ✅ | Full support (requires permission) |
| Android Chrome | ✅ | ✅ | Full support |
| Desktop Chrome | ❌ | ✅ | GPS only |
| Desktop Firefox | ❌ | ✅ | GPS only |

## 🐛 Known Issues

- GPS accuracy varies by device and environment (better outdoors)
- Compass requires HTTPS (browser security requirement)
- Self-signed certificates show warnings in local development
- Desktop browsers don't support device orientation

## 🚧 Roadmap

- [ ] Multi-floor support
- [ ] Voice guidance
- [ ] Haptic feedback
- [ ] AR mode with camera overlay
- [ ] PWA for offline use
- [ ] Share floor plans between users
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Inspired by real-world emergency navigation needs
- Built with modern web technologies
- Designed for mobile-first experience

## 📞 Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter)

Project Link: [https://github.com/YOUR_USERNAME/emergency-exit-compass](https://github.com/YOUR_USERNAME/emergency-exit-compass)

---

**⚠️ Important**: This app is designed to assist in emergency situations but should not be the sole method of emergency navigation. Always follow official building evacuation procedures and signage.
