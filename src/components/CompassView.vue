<template>
  <div class="compass-view">
    <!-- Permission Request Screen -->
    <div v-if="!permissionGranted" class="permission-screen">
      <div class="permission-content">
        <h2>🧭 Compass Access Required</h2>
        <p>This app needs access to your device's compass and location sensors to work.</p>
        <button @click="requestPermissions" class="permission-btn">
          Enable Sensors
        </button>
        <p class="permission-note">{{ permissionStatus }}</p>
      </div>
    </div>

    <!-- Main App (shown after permission granted) -->
    <div v-else>
      <!-- Top Bar -->
      <div class="top-bar">
        <!-- <button class="icon-btn" @click="$emit('share')">
          <span>📤</span>
        </button>
        <div class="heading-badge">MAGNETIC HEADING</div>
        <button class="icon-btn" @click="$emit('favorite')">
          <span>❤️</span>
        </button> -->
      </div>

      <!-- Main Content -->
      <div class="main-content">
      <!-- Location/Street Name -->
      <div v-if="nearestExit" class="location-info">
        <span class="location-name">Exit {{ nearestExit.index + 1 }}</span>
        <span class="info-icon">ℹ️</span>
      </div>

      <!-- Heading Display -->
      <div class="heading-display">
        <div class="heading-value">{{ Math.round(heading) }}°</div>
        <div class="heading-direction">{{ getCardinalDirection(heading) }}</div>
      </div>

      <!-- Compass Container with Floor Plan Background -->
      <div class="compass-container" ref="compassContainer">
        <!-- Floor Plan Background (rotates with compass) -->
        <div class="floor-plan-layer" :style="{ transform: `rotate(${-smoothHeading}deg)` }">
          <canvas 
            ref="floorPlanCanvas"
            class="floor-plan-canvas"
          ></canvas>
        </div>

        <!-- Compass Ring (rotates with compass) -->
        <div class="compass-ring" :style="{ transform: `rotate(${-smoothHeading}deg)` }">
          <!-- Degree markers (every 10°, major every 30°) -->
          <div v-for="deg in degreeMarkers" :key="deg" 
               class="degree-marker"
               :class="{ major: deg % 30 === 0, minor: deg % 30 !== 0 }"
               :style="{ transform: `rotate(${deg}deg) translateY(-130px)` }">
            <div class="marker-line"></div>
            <div v-if="deg % 30 === 0" class="marker-text">{{ deg }}</div>
          </div>

          <!-- Cardinal directions (inside circle, near edge) -->
          <div class="cardinal north">N</div>
          <div class="cardinal east">E</div>
          <div class="cardinal south">S</div>
          <div class="cardinal west">W</div>
        </div>

        <!-- Center Crosshair (fixed) -->
        <div class="crosshair">
          <div class="crosshair-line horizontal"></div>
          <div class="crosshair-line vertical"></div>
          <div class="center-dot"></div>
        </div>

        <!-- North Indicator (fixed at top) -->
        <div class="north-indicator">
          <div class="north-arrow">▼</div>
        </div>

        <!-- Exit Direction Indicator -->
        <div v-if="nearestExit" 
             class="exit-indicator"
             :style="{ transform: `rotate(${nearestExit.direction - smoothHeading}deg)` }">
          <div class="exit-arrow">🚪</div>
        </div>
      </div>

      <!-- Distance to Exit -->
      <div v-if="nearestExit" class="distance-info">
        <div class="distance-value">{{ nearestExit.distance.toFixed(1) }}m</div>
        <div class="distance-label">to exit</div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar">
      <div class="strength-info">
        <span>GPS ACCURACY</span>
        <span class="strength-value">±{{ gpsAccuracy }}m</span>
      </div>
      <!-- <button class="icon-btn" @click="toggleMode">
        <span>📍</span>
      </button> -->
      <button class="icon-btn" @click="$emit('settings')">
        <span>⚙️</span>
      </button>
    </div>

      <!-- Mode Toggle Overlay -->
      <div v-if="showModeSelector" class="mode-overlay">
        <div class="mode-panel">
          <h3>Select Mode</h3>
          <button @click="setMode('gps')" :class="{ active: useGPS }">
            📍 GPS Mode
          </button>
          <button @click="setMode('manual')" :class="{ active: !useGPS }">
            📐 Manual Mode
          </button>
          <button @click="calibrateGPS" v-if="useGPS && gpsLocation">
            🎯 Calibrate Position
          </button>
          <button @click="showModeSelector = false" class="close-btn">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const props = defineProps({
  floorPlanData: Object
})

const emit = defineEmits(['share', 'favorite', 'settings'])

// Compass & GPS
const heading = ref(0)
const smoothHeading = ref(0) // For smooth rotation
const gpsLocation = ref(null)
const gpsAccuracy = computed(() => gpsLocation.value ? Math.round(gpsLocation.value.accuracy) : 0)
const permissionGranted = ref(false)
const permissionStatus = ref('Tap the button to enable sensors')

// Navigation
const userX = ref(null)
const userY = ref(null)
const nearestExit = ref(null)
const useGPS = ref(false)
const gpsCalibrated = ref(false)
const calibrationPoint = ref(null)
const showModeSelector = ref(false)

// UI
const compassContainer = ref(null)
const floorPlanCanvas = ref(null)
// Show markers every 10 degrees instead of every degree
const degreeMarkers = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350]

let gpsWatchId = null

const getCardinalDirection = (angle) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(((angle % 360) / 22.5)) % 16
  return directions[index]
}

const handleOrientation = (event) => {
  let alpha = event.alpha
  
  // iOS Safari uses webkitCompassHeading
  if (event.webkitCompassHeading !== undefined) {
    alpha = event.webkitCompassHeading
  } 
  // Android Chrome uses alpha but needs to be inverted
  else if (event.alpha !== null) {
    // Check if we have absolute orientation
    if (event.absolute) {
      alpha = event.alpha
    } else {
      alpha = 360 - event.alpha
    }
  }
  
  if (alpha !== null) {
    // Smooth angle transition to avoid 360/0 jump
    const newHeading = alpha
    const currentHeading = smoothHeading.value
    
    // Calculate shortest rotation direction
    let diff = newHeading - currentHeading
    
    // Normalize to -180 to 180 range
    if (diff > 180) {
      diff -= 360
    } else if (diff < -180) {
      diff += 360
    }
    
    // Apply smooth interpolation
    smoothHeading.value = (currentHeading + diff * 0.3) % 360
    if (smoothHeading.value < 0) smoothHeading.value += 360
    
    heading.value = Math.round(alpha)
    permissionStatus.value = `Compass active: ${Math.round(alpha)}°`
  }
}

const startGPSTracking = () => {
  if ('geolocation' in navigator) {
    gpsWatchId = navigator.geolocation.watchPosition(
      (position) => {
        gpsLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading
        }
        
        if (gpsCalibrated.value && calibrationPoint.value) {
          updatePositionFromGPS()
        }
      },
      (error) => {
        console.error('GPS Error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    )
  }
}

const requestPermissions = async () => {
  try {
    permissionStatus.value = 'Requesting permissions...'
    
    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      
      permissionStatus.value = 'Requesting device orientation...'
      const orientationPermission = await DeviceOrientationEvent.requestPermission()
      
      if (orientationPermission === 'granted') {
        permissionGranted.value = true
        
        // Try absolute first (better for compass)
        if (typeof DeviceOrientationAbsoluteEvent !== 'undefined') {
          window.addEventListener('deviceorientationabsolute', handleOrientation, true)
        }
        window.addEventListener('deviceorientation', handleOrientation, true)
        
        permissionStatus.value = 'Sensors enabled! Compass should be working...'
        startGPSTracking()
      } else {
        permissionStatus.value = 'Permission denied. Please enable in Settings.'
      }
    } 
    // Android and other browsers
    else {
      permissionGranted.value = true
      
      // Try multiple event types for better compatibility
      if (typeof DeviceOrientationAbsoluteEvent !== 'undefined') {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true)
      }
      window.addEventListener('deviceorientation', handleOrientation, true)
      
      permissionStatus.value = 'Sensors enabled! Waiting for compass data...'
      startGPSTracking()
      
      // Test if we're getting data
      setTimeout(() => {
        if (heading.value === 0) {
          permissionStatus.value = 'No compass data. Try rotating your device.'
        }
      }, 2000)
    }
  } catch (error) {
    console.error('Permission error:', error)
    permissionStatus.value = `Error: ${error.message}`
  }
}

const calibrateGPS = () => {
  if (gpsLocation.value && userX.value !== null && userY.value !== null) {
    calibrationPoint.value = {
      gps: { ...gpsLocation.value },
      map: { x: userX.value, y: userY.value }
    }
    gpsCalibrated.value = true
    localStorage.setItem('gpsCalibration', JSON.stringify(calibrationPoint.value))
    showModeSelector.value = false
  }
}

const updatePositionFromGPS = () => {
  if (!gpsLocation.value || !calibrationPoint.value) return
  
  const latDiff = gpsLocation.value.latitude - calibrationPoint.value.gps.latitude
  const lonDiff = gpsLocation.value.longitude - calibrationPoint.value.gps.longitude
  
  const metersPerDegree = 111000
  const pixelsPerMeter = 2
  
  userX.value = calibrationPoint.value.map.x + (lonDiff * metersPerDegree * pixelsPerMeter)
  userY.value = calibrationPoint.value.map.y - (latDiff * metersPerDegree * pixelsPerMeter)
  
  findNearestExit()
}

const findNearestExit = () => {
  if (!props.floorPlanData || userX.value === null || userY.value === null) return

  let minDistance = Infinity
  let nearest = null

  props.floorPlanData.exits.forEach((exit, index) => {
    const distance = Math.sqrt(
      Math.pow(exit.x - userX.value, 2) + Math.pow(exit.y - userY.value, 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      const direction = calculateDirection(userX.value, userY.value, exit.x, exit.y)
      nearest = { ...exit, index, distance, direction }
    }
  })

  nearestExit.value = nearest
  drawFloorPlan()
}

const calculateDirection = (x1, y1, x2, y2) => {
  const angle = Math.atan2(x2 - x1, -(y2 - y1)) * (180 / Math.PI)
  return (angle + 360) % 360
}

const drawFloorPlan = () => {
  if (!floorPlanCanvas.value || !props.floorPlanData) return

  const canvas = floorPlanCanvas.value
  const size = 280
  canvas.width = size
  canvas.height = size
  
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  img.onload = () => {
    ctx.clearRect(0, 0, size, size)
    
    // Calculate scale to fit floor plan in circle
    const scale = Math.min(size / props.floorPlanData.width, size / props.floorPlanData.height) * 0.8
    const offsetX = (size - props.floorPlanData.width * scale) / 2
    const offsetY = (size - props.floorPlanData.height * scale) / 2
    
    // Draw floor plan
    ctx.globalAlpha = 0.6
    ctx.drawImage(img, offsetX, offsetY, props.floorPlanData.width * scale, props.floorPlanData.height * scale)
    ctx.globalAlpha = 1.0
    
    // Draw exits
    props.floorPlanData.exits.forEach((exit, index) => {
      const x = offsetX + exit.x * scale
      const y = offsetY + exit.y * scale
      
      ctx.fillStyle = '#ff6b6b'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.fillStyle = 'white'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(index + 1, x, y + 3)
    })
    
    // Draw user location
    if (userX.value !== null && userY.value !== null) {
      const x = offsetX + userX.value * scale
      const y = offsetY + userY.value * scale
      
      ctx.fillStyle = '#4c6ef5'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }
  
  img.src = props.floorPlanData.image
}

const toggleMode = () => {
  showModeSelector.value = !showModeSelector.value
}

const setMode = (mode) => {
  useGPS.value = mode === 'gps'
  showModeSelector.value = false
  
  if (useGPS.value && !gpsWatchId) {
    startGPSTracking()
  }
}

// Handle canvas click for manual positioning
const handleCanvasClick = (event) => {
  if (useGPS.value) return
  
  const rect = floorPlanCanvas.value.getBoundingClientRect()
  const size = 280
  const scale = Math.min(size / props.floorPlanData.width, size / props.floorPlanData.height) * 0.8
  const offsetX = (size - props.floorPlanData.width * scale) / 2
  const offsetY = (size - props.floorPlanData.height * scale) / 2
  
  const x = (event.clientX - rect.left - offsetX) / scale
  const y = (event.clientY - rect.top - offsetY) / scale
  
  userX.value = Math.round(x)
  userY.value = Math.round(y)
  findNearestExit()
}

watch(() => props.floorPlanData, () => {
  if (props.floorPlanData) {
    drawFloorPlan()
  }
}, { immediate: true })

onMounted(() => {
  // Don't auto-request on iOS, show button instead
  if (typeof DeviceOrientationEvent === 'undefined' || 
      typeof DeviceOrientationEvent.requestPermission !== 'function') {
    // Auto-request on Android/Desktop
    requestPermissions()
  }
  
  const savedCalibration = localStorage.getItem('gpsCalibration')
  if (savedCalibration) {
    calibrationPoint.value = JSON.parse(savedCalibration)
    gpsCalibrated.value = true
  }
})

watch(() => floorPlanCanvas.value, (canvas) => {
  if (canvas) {
    canvas.addEventListener('click', handleCanvasClick)
  }
})

onUnmounted(() => {
  window.removeEventListener('deviceorientationabsolute', handleOrientation)
  window.removeEventListener('deviceorientation', handleOrientation)
  if (gpsWatchId) {
    navigator.geolocation.clearWatch(gpsWatchId)
  }
  if (floorPlanCanvas.value) {
    floorPlanCanvas.value.removeEventListener('click', handleCanvasClick)
  }
})
</script>

<style scoped>
.compass-view {
  min-height: 100vh;
  background: #000;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.permission-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.permission-content {
  text-align: center;
  max-width: 400px;
}

.permission-content h2 {
  margin-bottom: 1rem;
  font-size: 2rem;
}

.permission-content p {
  margin: 1rem 0;
  color: #aaa;
  line-height: 1.6;
}

.permission-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  margin: 1.5rem 0;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s;
}

.permission-btn:active {
  transform: scale(0.95);
}

.permission-note {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  position: relative;
  z-index: 10;
}

.heading-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.icon-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.location-name {
  font-size: 1.2rem;
  font-weight: bold;
}

.heading-display {
  text-align: center;
  margin-bottom: 1rem;
}

.heading-value {
  font-size: 2.5rem;
  font-weight: bold;
}

.heading-direction {
  font-size: 1.5rem;
  color: #aaa;
}

.compass-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 2rem 0;
}

.floor-plan-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center;
  width: 280px;
  height: 280px;
  margin-left: -140px;
  margin-top: -140px;
  border-radius: 50%;
  overflow: hidden;
  z-index: 2;
}

.floor-plan-canvas {
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

.compass-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  margin-left: -150px;
  margin-top: -150px;
  transform-origin: center;
  z-index: 3;
}

.degree-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center;
  margin-left: -1px;
}

.marker-line {
  width: 2px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  margin: 0 auto;
}

.degree-marker.minor .marker-line {
  height: 8px;
  width: 2px;
  background: rgba(255, 255, 255, 0.5);
}

.degree-marker.major .marker-line {
  height: 12px;
  width: 2px;
  background: rgba(255, 255, 255, 0.8);
}

.marker-text {
  font-size: 0.7rem;
  text-align: center;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.6);
}

.cardinal {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 1.6rem;
  font-weight: bold;
  color: white;
  text-shadow: 
    0 0 8px rgba(0, 0, 0, 0.9),
    0 0 15px rgba(0, 0, 0, 0.7),
    2px 2px 4px rgba(0, 0, 0, 1);
  transform-origin: center;
}

.cardinal.north {
  transform: translateY(-100px) translateX(-50%);
  color: #ff6b6b;
  font-size: 1.8rem;
}

.cardinal.east {
  transform: translateX(100px);
}

.cardinal.south {
  transform: translateY(100px) translateX(-50%);
}

.cardinal.west {
  transform: translateX(-100px);
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.crosshair-line {
  position: absolute;
  background: white;
}

.crosshair-line.horizontal {
  width: 40px;
  height: 2px;
  left: -20px;
  top: -1px;
}

.crosshair-line.vertical {
  width: 2px;
  height: 40px;
  left: -1px;
  top: -20px;
}

.center-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  left: -4px;
  top: -4px;
}

.north-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 11;
}

.north-arrow {
  color: #ff6b6b;
  font-size: 1.5rem;
}

.exit-indicator {
  position: absolute;
  top: 20px;
  left: 50%;
  transform-origin: 50% 130px;
  z-index: 12;
}

.exit-arrow {
  font-size: 1.5rem;
  background: #51cf66;
  padding: 0.3rem 0.6rem;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.distance-info {
  text-align: center;
  margin-top: 1rem;
}

.distance-value {
  font-size: 2rem;
  font-weight: bold;
  color: #51cf66;
}

.distance-label {
  font-size: 1rem;
  color: #aaa;
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  position: relative;
  z-index: 10;
}

.strength-info {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
}

.strength-value {
  font-weight: bold;
  font-size: 1rem;
}

.mode-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.mode-panel {
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 12px;
  min-width: 280px;
}

.mode-panel h3 {
  margin-bottom: 1rem;
  text-align: center;
}

.mode-panel button {
  width: 100%;
  padding: 1rem;
  margin: 0.5rem 0;
  background: #333;
  color: white;
  border: 2px solid #555;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.mode-panel button.active {
  background: #4c6ef5;
  border-color: #4c6ef5;
}

.mode-panel button.close-btn {
  background: #666;
  margin-top: 1rem;
}
</style>
