import { useState } from 'react'
import CompassView from './components/CompassView'
import FloorPlanUpload from './components/FloorPlanUpload'
import './App.css'

function App() {
  const [showSetup, setShowSetup] = useState(false)

  return (
    <div className="app">
      <CompassView onOpenSetup={() => setShowSetup(true)} />
      {showSetup && (
        <FloorPlanUpload onClose={() => setShowSetup(false)} />
      )}
    </div>
  )
}

export default App
