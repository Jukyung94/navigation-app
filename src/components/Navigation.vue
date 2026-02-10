<template>
  <div class="navigation-container">
    <h2>🧭 Navigate to Exit</h2>
    
    <div v-if="!floorPlanData" class="no-data">
      <p>No floor plan uploaded yet. Please upload a floor plan first.</p>
    </div>

    <div v-else class="navigation-content">
      <!-- GPS Mode Toggle -->
      <div class="mode-toggle">
        <button 
          @click="useGPS = true" 
          :class="{ active: useGPS }"
          class="mode-btn"
        >
          📍 GPS Mode
        </button>
        <button 
          @click="useGPS = false" 
          :class="{ active: !useGPS }"
          class="mode-btn"
        >
          📐 Manual Coordinates
        </button>
      </div>

      <!-- GPS Mode -->
      <div v-if="useGPS" class="gps-mode">
        <div class="gps-status">
          <p v-if="!gpsLocation">🔍 Waiting for GPS signal...</p>
          <div v-else class="gps-active">
            <p><strong>📍 GPS Active</strong></p>
            <p>Lat: {{ gpsLocation.latitude.toFixed(6) }}</p>
            <p>Lon: {{ gpsLocation.longitude.toFixed(6) }}</p>
            <p>Accuracy: ±{{ Math.round(gpsLocation.accuracy) }}m</p>
          </div>
        </div>
        <button @click="calibrateGPS" class="calibrate-btn">
          Calibrate Current Position
        </button>
        <p class="calibration-hint" v-if="!gpsCalibrated">
          Stand at a known point on the floor plan and calibrate
        </p>
      </div>

      <!-- Manual Mode -->
      <div v-else class="location-input">
        <h3>Your Current Location</h3>
        <label>
          X: <input type="number" v-model.number="userX" placeholder="X coordinate" />
        </label>
        <label>
          Y: <input type="number" v-model.number="userY" placeholder="Y coordinate" />
        </label>
        <button @click="findNearestExit">Find Nearest Exit</button>
      </div>

      <!-- Navigation Instructions -->
      <div v-if="nearestExit" class="exit-info">
        <h3>🚪 Nearest Exit: Exit {{ nearestExit.index + 1 }}</h3>
        
        <div class="distance-display">
          <div class="distance-value">{{ nearestExit.distance.toFixed(1) }}m</div>
          <div class="distance-label">Distance</div>
        </div>
        
        <div class="direction-arrow" :style="{ transform: `rotate(${nearestExit.direction}deg)` }">
          ↑
        </div>

        <div class="instructions-text">
          <p class="instruction-main">{{ getDetailedInstructions(nearestExit) }}</p>
          <p class="instruction-bearing">Bearing: {{ nearestExit.direction.toFixed(0) }}° ({{ getCardinalDirection(nearestExit.direction) }})</p>
        </div>

        <!-- Step-by-step navigation -->
        <div class="step-navigation" v-if="navigationSteps.length > 0">
          <h4>Step-by-Step:</h4>
          <div v-for="(step, index) in navigationSteps" :key="index" class="nav-step">
            <span class="step-number">{{ index + 1 }}</span>
            <span class="step-text">{{ step }}</span>
          </div>
        </div>

        <!-- Progress indicator -->
        <div class="progress-indicator">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${getProgress()}%` }"></div>
          </div>
          <p>{{ getProgress() }}% to exit</p>
        </div>
      </div>

      <!-- Interactive Map -->
      <div class="map-view">
        <canvas 
          ref="mapCanvas"
          :width="floorPlanData.width"
          :height="floorPlanData.height"
          @click="handleMapClick"
        ></canvas>
        <p class="map-hint">Tap on map to set your location</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  floorPlanData: Object
})

const useGPS = ref(false)
const gpsLocation = ref(null)
const gpsCalibrated = ref(false)
const calibrationPoint = ref(null)
const userX = ref(null)
const userY = ref(null)
const nearestExit = ref(null)
const mapCanvas = ref(null)
const navigationSteps = ref([])
const initialDistance = ref(null)
let gpsWatchId = null

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

const calibrateGPS = () => {
  if (gpsLocation.value && userX.value !== null && userY.value !== null) {
    calibrationPoint.value = {
      gps: { ...gpsLocation.value },
      map: { x: userX.value, y: userY.value }
    }
    gpsCalibrated.value = true
    localStorage.setItem('gpsCalibration', JSON.stringify(calibrationPoint.value))
  }
}

const updatePositionFromGPS = () => {
  if (!gpsLocation.value || !calibrationPoint.value) return
  
  const latDiff = gpsLocation.value.latitude - calibrationPoint.value.gps.latitude
  const lonDiff = gpsLocation.value.longitude - calibrationPoint.value.gps.longitude
  
  // Convert GPS difference to pixels (rough approximation)
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

  if (initialDistance.value === null && nearest) {
    initialDistance.value = nearest.distance
  }

  nearestExit.value = nearest
  generateNavigationSteps()
  drawMap()
}

const calculateDirection = (x1, y1, x2, y2) => {
  const angle = Math.atan2(x2 - x1, -(y2 - y1)) * (180 / Math.PI)
  return (angle + 360) % 360
}

const getCardinalDirection = (angle) => {
  if (angle >= 337.5 || angle < 22.5) return 'North'
  if (angle >= 22.5 && angle < 67.5) return 'Northeast'
  if (angle >= 67.5 && angle < 112.5) return 'East'
  if (angle >= 112.5 && angle < 157.5) return 'Southeast'
  if (angle >= 157.5 && angle < 202.5) return 'South'
  if (angle >= 202.5 && angle < 247.5) return 'Southwest'
  if (angle >= 247.5 && angle < 292.5) return 'West'
  return 'Northwest'
}

const getDetailedInstructions = (exit) => {
  const distance = exit.distance
  const direction = getCardinalDirection(exit.direction)
  
  if (distance < 5) {
    return `🎯 EXIT IS RIGHT HERE! Look ${direction.toLowerCase()}`
  } else if (distance < 20) {
    return `⚡ Almost there! Walk ${direction.toLowerCase()} for ${distance.toFixed(0)}m`
  } else if (distance < 50) {
    return `🚶 Head ${direction.toLowerCase()} for ${distance.toFixed(0)}m`
  } else {
    return `🏃 Proceed ${direction.toLowerCase()} for ${distance.toFixed(0)}m`
  }
}

const generateNavigationSteps = () => {
  if (!nearestExit.value) return
  
  const steps = []
  const distance = nearestExit.value.distance
  const direction = getCardinalDirection(nearestExit.value.direction)
  
  steps.push(`Turn to face ${direction}`)
  
  if (distance > 50) {
    steps.push(`Walk straight for approximately ${Math.round(distance / 2)}m`)
    steps.push(`Continue ${direction.toLowerCase()} for another ${Math.round(distance / 2)}m`)
  } else if (distance > 20) {
    steps.push(`Walk straight for ${Math.round(distance)}m`)
  } else {
    steps.push(`Walk directly to the exit`)
  }
  
  steps.push(`Exit door will be on your ${direction.toLowerCase()}`)
  
  navigationSteps.value = steps
}

const getProgress = () => {
  if (!nearestExit.value || !initialDistance.value) return 0
  const progress = ((initialDistance.value - nearestExit.value.distance) / initialDistance.value) * 100
  return Math.max(0, Math.min(100, Math.round(progress)))
}

const handleMapClick = (event) => {
  const rect = mapCanvas.value.getBoundingClientRect()
  userX.value = Math.round(event.clientX - rect.left)
  userY.value = Math.round(event.clientY - rect.top)
  findNearestExit()
}

const drawMap = () => {
  if (!mapCanvas.value || !props.floorPlanData) return

  const ctx = mapCanvas.value.getContext('2d')
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, props.floorPlanData.width, props.floorPlanData.height)
    ctx.drawImage(img, 0, 0, props.floorPlanData.width, props.floorPlanData.height)

    // Draw exits
    props.floorPlanData.exits.forEach((exit, index) => {
      ctx.fillStyle = 'red'
      ctx.beginPath()
      ctx.arc(exit.x, exit.y, 12, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(index + 1, exit.x, exit.y + 5)
    })

    // Draw user location
    if (userX.value !== null && userY.value !== null) {
      ctx.fillStyle = 'blue'
      ctx.beginPath()
      ctx.arc(userX.value, userY.value, 10, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(userX.value, userY.value, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Draw path to nearest exit
      if (nearestExit.value) {
        ctx.strokeStyle = '#51cf66'
        ctx.lineWidth = 4
        ctx.setLineDash([10, 5])
        ctx.beginPath()
        ctx.moveTo(userX.value, userY.value)
        ctx.lineTo(nearestExit.value.x, nearestExit.value.y)
        ctx.stroke()
        ctx.setLineDash([])
        
        // Draw direction arrow
        const angle = Math.atan2(
          nearestExit.value.y - userY.value,
          nearestExit.value.x - userX.value
        )
        const arrowSize = 15
        ctx.fillStyle = '#51cf66'
        ctx.beginPath()
        ctx.moveTo(
          nearestExit.value.x - arrowSize * Math.cos(angle - Math.PI / 6),
          nearestExit.value.y - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(nearestExit.value.x, nearestExit.value.y)
        ctx.lineTo(
          nearestExit.value.x - arrowSize * Math.cos(angle + Math.PI / 6),
          nearestExit.value.y - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.fill()
      }
    }
  }
  img.src = props.floorPlanData.image
}

watch(() => props.floorPlanData, () => {
  if (props.floorPlanData) {
    drawMap()
  }
}, { immediate: true })

watch(useGPS, (newVal) => {
  if (newVal) {
    startGPSTracking()
  } else {
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId)
    }
  }
})

onMounted(() => {
  const savedCalibration = localStorage.getItem('gpsCalibration')
  if (savedCalibration) {
    calibrationPoint.value = JSON.parse(savedCalibration)
    gpsCalibrated.value = true
  }
})

onUnmounted(() => {
  if (gpsWatchId) {
    navigator.geolocation.clearWatch(gpsWatchId)
  }
})
</script>

<style scoped>
.navigation-container {
  padding: 1rem;
}

.no-data {
  padding: 2rem;
  background: #f0f0f0;
  border-radius: 8px;
  text-align: center;
}

.navigation-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mode-toggle {
  display: flex;
  gap: 0.5rem;
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 12px;
}

.mode-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.mode-btn.active {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gps-mode {
  background: #e7f5ff;
  padding: 1.5rem;
  border-radius: 12px;
}

.gps-status {
  margin-bottom: 1rem;
}

.gps-active {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.calibrate-btn {
  background: #4c6ef5;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
}

.calibration-hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.location-input {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
}

.location-input label {
  display: block;
  margin: 0.8rem 0;
  font-weight: bold;
}

.location-input input {
  margin-left: 0.5rem;
  padding: 0.6rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  width: 150px;
  font-size: 1rem;
}

.location-input button {
  margin-top: 1rem;
  background: #4c6ef5;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
}

.exit-info {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.distance-display {
  margin: 1rem 0;
}

.distance-value {
  font-size: 3rem;
  font-weight: bold;
}

.distance-label {
  font-size: 1rem;
  opacity: 0.9;
}

.direction-arrow {
  font-size: 5rem;
  margin: 1rem 0;
  transition: transform 0.3s ease;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.instructions-text {
  margin: 1rem 0;
}

.instruction-main {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.instruction-bearing {
  font-size: 1rem;
  opacity: 0.9;
}

.step-navigation {
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: left;
}

.step-navigation h4 {
  margin-bottom: 0.8rem;
}

.nav-step {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0.5rem 0;
}

.step-number {
  background: white;
  color: #51cf66;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

.progress-indicator {
  margin-top: 1rem;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.3);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  background: white;
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 6px;
}

.map-view {
  border: 3px solid #333;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

canvas {
  display: block;
  max-width: 100%;
  cursor: crosshair;
}

.map-hint {
  text-align: center;
  padding: 0.5rem;
  background: #f8f9fa;
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}
</style>
