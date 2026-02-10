# Testing on Your Smartphone

## ✅ Easiest Method: Use Your Computer's IP

### Step 1: Start the Dev Server
```bash
npm run dev
```

You'll see output like:
```
➜  Local:   https://localhost:5173/
➜  Network: https://192.168.1.100:5173/
```

### Step 2: Access from Your Phone

1. **Connect your phone to the SAME WiFi** as your computer
2. Open your phone's browser (Chrome/Safari)
3. Type the **Network URL** from above (e.g., `https://192.168.1.100:5173`)

### Step 3: Accept the Certificate Warning

You'll see a security warning (this is normal for local development):

**iPhone Safari:**
1. Tap "Show Details"
2. Tap "visit this website"  
3. Tap "Visit Website" again to confirm

**Android Chrome:**
1. Tap "Advanced"
2. Tap "Proceed to [your-ip] (unsafe)"

**Note:** This is safe - it's just because we're using a self-signed certificate for local testing.

### Step 4: Enable Sensors & Test!

1. Tap the **"Enable Sensors"** button
2. Grant permissions when asked
3. Rotate your phone - the compass should move! 🎉

---

## 🚀 Alternative: Use ngrok (No Certificate Warnings!)

If you don't want to deal with certificate warnings:

### Step 1: Install ngrok
Download from: https://ngrok.com/download

### Step 2: Start Your Dev Server
```bash
npm run dev
```

### Step 3: Start ngrok (in a new terminal)
```bash
ngrok http https://localhost:5173
```

### Step 4: Use the ngrok URL
ngrok will give you a URL like: `https://abc123.ngrok-free.app`

Open that URL on your phone - **no certificate warnings!**

---

## 🔧 Troubleshooting

### "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"
✅ **Fixed!** We're now using `@vitejs/plugin-basic-ssl` which generates compatible certificates.

### Compass Not Moving?
- Grant sensor permissions when prompted
- Try rotating your phone to wake up the sensors
- Make sure you're on HTTPS (not HTTP)

### Can't Connect from Phone?
- Verify both devices are on the **same WiFi network**
- Check your computer's firewall settings
- Try disabling VPN if running
- On Windows, you may need to allow Node.js through the firewall

### "This site can't be reached"
- Double-check the IP address matches your computer's IP
- Make sure the dev server is still running
- Try restarting the dev server

### GPS Not Working?
- Make sure you granted location permissions
- GPS works best outdoors or near windows
- You need to calibrate first (tap the 📍 button)

---

## 📱 How to Use the App

1. **Upload Floor Plan**: Tap ⚙️ (settings) → Upload your floor plan image
2. **Mark Exits**: Click on the floor plan to mark emergency exits
3. **Save**: Tap "Save Floor Plan"
4. **Navigate**: Back on compass view, tap 📍 to choose GPS or Manual mode
5. **Calibrate** (GPS mode): Stand at a known point, enter coordinates, tap "Calibrate"
6. **Follow the Arrow**: The green exit indicator shows direction to nearest exit!

---

## 🌐 Deploy for Real Testing

For production testing without local network hassles:

**Free Options:**
- **Vercel**: `npm run build` then drag the `dist` folder to vercel.com
- **Netlify**: Same process at netlify.com
- **GitHub Pages**: Push to GitHub and enable Pages

All provide free HTTPS automatically!
