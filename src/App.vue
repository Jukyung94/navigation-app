<script setup>
import { ref, onMounted } from 'vue'
import CompassView from './components/CompassView.vue'
import FloorPlanUpload from './components/FloorPlanUpload.vue'

const currentView = ref('compass')
const floorPlanData = ref(null)

onMounted(() => {
  const saved = localStorage.getItem('floorPlan')
  if (saved) {
    floorPlanData.value = JSON.parse(saved)
  }
})

const handleFloorPlanSaved = (data) => {
  floorPlanData.value = data
  currentView.value = 'compass'
}
</script>

<template>
  <div class="app">
    <CompassView 
      v-if="currentView === 'compass'" 
      :floorPlanData="floorPlanData"
      @settings="currentView = 'upload'"
    />
    <div v-else class="upload-view">
      <header>
        <h1>🧭 Emergency Exit Compass</h1>
        <button @click="currentView = 'compass'" class="back-btn">
          ← Back to Compass
        </button>
      </header>
      <main>
        <FloorPlanUpload 
          @floorPlanSaved="handleFloorPlanSaved"
        />
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #000;
  overflow-x: hidden;
}

.app {
  min-height: 100vh;
}

.upload-view {
  min-height: 100vh;
  background: #f5f5f5;
}

.upload-view header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.upload-view header h1 {
  text-align: center;
  margin-bottom: 1rem;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 0.6rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  display: block;
  margin: 0 auto;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}
</style>
