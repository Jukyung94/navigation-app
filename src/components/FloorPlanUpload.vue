<template>
  <div class="upload-container">
    <h2>Upload Floor Plan</h2>
    <input 
      type="file" 
      @change="handleFileUpload" 
      accept="image/*"
      ref="fileInput"
    />
    
    <div v-if="floorPlan" class="floor-plan-preview">
      <canvas 
        ref="canvas" 
        @click="handleCanvasClick"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
      
      <div class="instructions">
        <p>Click on the image to mark emergency exits</p>
        <p v-if="exits.length > 0">Exits marked: {{ exits.length }}</p>
      </div>

      <div class="exit-list">
        <h3>Emergency Exits</h3>
        <div v-for="(exit, index) in exits" :key="index" class="exit-item">
          <span>Exit {{ index + 1 }}: ({{ exit.x }}, {{ exit.y }})</span>
          <button @click="removeExit(index)">Remove</button>
        </div>
      </div>

      <button @click="saveFloorPlan" class="save-btn">Save Floor Plan</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['floorPlanSaved'])

const fileInput = ref(null)
const canvas = ref(null)
const floorPlan = ref(null)
const exits = ref([])
const canvasWidth = ref(600)
const canvasHeight = ref(400)

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        floorPlan.value = img
        drawFloorPlan()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const drawFloorPlan = () => {
  if (!canvas.value || !floorPlan.value) return
  
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  ctx.drawImage(floorPlan.value, 0, 0, canvasWidth.value, canvasHeight.value)
  
  // Draw exits
  exits.value.forEach((exit, index) => {
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(exit.x, exit.y, 10, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(index + 1, exit.x, exit.y + 4)
  })
}

const handleCanvasClick = (event) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  exits.value.push({ x: Math.round(x), y: Math.round(y) })
  drawFloorPlan()
}

const removeExit = (index) => {
  exits.value.splice(index, 1)
  drawFloorPlan()
}

const saveFloorPlan = () => {
  const floorPlanData = {
    image: floorPlan.value.src,
    exits: exits.value,
    width: canvasWidth.value,
    height: canvasHeight.value
  }
  localStorage.setItem('floorPlan', JSON.stringify(floorPlanData))
  emit('floorPlanSaved', floorPlanData)
}
</script>

<style scoped>
.upload-container {
  padding: 2rem;
}

h2 {
  margin-bottom: 1rem;
}

input[type="file"] {
  margin-bottom: 1rem;
}

.floor-plan-preview {
  margin-top: 1rem;
}

canvas {
  border: 2px solid #333;
  cursor: crosshair;
  display: block;
  margin-bottom: 1rem;
}

.instructions {
  margin: 1rem 0;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 4px;
}

.exit-list {
  margin: 1rem 0;
}

.exit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #fff;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.exit-item button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background: #51cf66;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.save-btn:hover {
  background: #40c057;
}
</style>
