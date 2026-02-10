<template>
  <div class="compass-container">
    <div v-if="!permissionGranted" class="permission-request">
      <p>This app needs access to your device sensors</p>
      <button @click="requestPermissions" class="permission-btn">Enable Sensors</button>
    </div>

    <div v-else>
      <div class="compass" :style="{ transform: `rotate(${-heading}deg)` }">
        <div class="direction north">N</div>
        <div class="direction east">E</div>
        <div class="direction south">S</div>
        <div class="direction west">W</div>
        <div class="compass-needle"></div>
        
        <!-- Exit direction indicator -->
        <div v-if="exitDirection !== null" 
             class="exit-indicator" 
             :style="{ transform: `rotate(${exitDirection}deg)` }">
          <div class="exit-arrow">EXIT →</div>
        </div>
      </div>
      
      <div class="info-panel">
        <div class="heading-display">{{ Math.round(heading) }}°</div>
        <div class="cardinal-direction">{{ getCardinalDirection(heading) }}</div>
        
        <div v-if="gpsLocation" class="gps-info">
          <p><strong>📍 GPS Location:</strong></p>
          <p>Lat: {{ gpsLocation.latitude.toFixed(6) }}</p>
          <p>Lon: {{ gpsLocation.longitude.toFixed(6) }}</p>
          <p>Accuracy: ±{{ Math.round(gpsLocation.accuracy) }}m</p>
        </div>

        <div v-if="exitInfo" class="exit-info-compact">
          <p><strong>🚪 Nearest Exit:</strong></p>
          <p>Distance: {{ exitInfo.distance.toFixed(1) }}m</p>
          <p>Direction: {{ getCardinalDirection(exitInfo.bearing) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  exitInfo: Object
})

const heading = ref(0)
const gpsLocation = ref(null)
const permissionGranted = ref(false)
const exitDirection = ref(null)
let watchId = null

const getCardinalDirection = (angle) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(((angle % 360) / 45)) % 8
  return directions[index]
}

const handleOrientation = (event) => {
  let alpha = event.alpha
  
  // Handle different browser implementations
  if (event.webkitCompassHeading) {
    alpha = event.webkitCompassHeading
  } else if (alpha !== null) {
    alpha = 360 - alpha
  }
  
  if (alpha !== null) {
    heading.value = alpha
  }
}

const startGPSTracking = () => {
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        gpsLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading
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
    // Request orientation permission (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission()
      if (permission === 'granted') {
        permissionGranted.value = true
        window.addEventListener('deviceorientationabsolute', handleOrientation, true)
        window.addEventListener('deviceorientation', handleOrientation, true)
        startGPSTracking()
      }
    } else {
      permissionGranted.value = true
      window.addEventListener('deviceorientationabsolute', handleOrientation, true)
      window.addEventListener('deviceorientation', handleOrientation, true)
      startGPSTracking()
    }
  } catch (error) {
    console.error('Permission error:', error)
  }
}

watch(() => props.exitInfo, (newInfo) => {
  if (newInfo && newInfo.bearing !== undefined) {
    exitDirection.value = newInfo.bearing
  } else {
    exitDirection.value = null
  }
}, { immediate: true })

onMounted(() => {
  // Auto-request on Android/desktop
  if (typeof DeviceOrientationEvent === 'undefined' || 
      typeof DeviceOrientationEvent.requestPermission !== 'function') {
    requestPermissions()
  }
})

onUnmounted(() => {
  window.removeEventListener('deviceorientationabsolute', handleOrientation)
  window.removeEventListener('deviceorientation', handleOrientation)
  if (watchId) {
    navigator.geolocation.clearWatch(watchId)
  }
})

defineExpose({ gpsLocation })
</script>

<style scoped>
.compass-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
}

.permission-request {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.permission-btn {
  margin-top: 1rem;
  background: #4c6ef5;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.compass {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease-out;
}

.direction {
  position: absolute;
  font-weight: bold;
  font-size: 1.8rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.north {
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  color: #ff6b6b;
  font-size: 2rem;
}

.east {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.south {
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
}

.west {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.compass-needle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 110px;
  background: linear-gradient(to bottom, #ff6b6b 0%, #ff6b6b 50%, white 50%, white 100%);
  transform: translate(-50%, -50%);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.exit-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform-origin: center;
  pointer-events: none;
}

.exit-arrow {
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  background: #51cf66;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.info-panel {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.heading-display {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  text-align: center;
}

.cardinal-direction {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-top: 0.5rem;
}

.gps-info, .exit-info-compact {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
}

.gps-info p, .exit-info-compact p {
  margin: 0.3rem 0;
}
</style>
