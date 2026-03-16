import * as THREE from 'three'
import { Player } from './Player'
import { RoadSpawner } from './RoadSpawner'
import { LevelSpawner } from './LevelSpawner'
import { CrowdManager } from './CrowdManager'
import { GateSpawner } from './GateSpawner'

// Scene setup
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 5, 12)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.setClearColor(0x000000, 0)
document.body.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(5, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
scene.add(directionalLight)

const fillLight = new THREE.DirectionalLight(0xffaa00, 0.5)
fillLight.position.set(-5, 5, -5)
scene.add(fillLight)

// Game objects
const player = new Player(scene)
const roadSpawner = new RoadSpawner(scene)
const levelSpawner = new LevelSpawner(scene)
const crowdManager = new CrowdManager(scene)
const gateSpawner = new GateSpawner(scene)

// Connect gate spawner to obstacle checker
gateSpawner.setObstacleSpawner(levelSpawner)

// Game state
let score = 0
let distance = 0
let coins = 0
let lives = 3
let speed = 0.28  // 70% of original (0.4 * 0.7)
let speedRecoveryTimer = 0
let invulnerableTimer = 0
let gameOver = false

// UI elements
const scoreEl = document.getElementById('score')!

// Input handling - continuous movement
let inputLeft = false
let inputRight = false

document.addEventListener('keydown', (e) => {
  if (gameOver) {
    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') {
      location.reload()
    }
    return
  }
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    inputLeft = true
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    inputRight = true
  }
})

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    inputLeft = false
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    inputRight = false
  }
})

// Click to restart (for Chrome browser)
document.addEventListener('click', () => {
  if (gameOver) {
    location.reload()
  }
})

// Touch handling - simple binary control:
// Touch left half = move left (constant speed)
// Touch right half = move right (constant speed)
// Release = stop

document.addEventListener('touchstart', (e) => {
  if (gameOver) {
    location.reload()
    return
  }
  // Prevent default to stop browser touch behavior
  e.preventDefault()
  handleTouch(e.touches[0].clientX)
}, { passive: false })

document.addEventListener('touchmove', (e) => {
  e.preventDefault()
  handleTouch(e.touches[0].clientX)
}, { passive: false })

document.addEventListener('touchend', (e) => {
  inputLeft = false
  inputRight = false
})

document.addEventListener('touchcancel', () => {
  inputLeft = false
  inputRight = false
})

function handleTouch(touchX: number) {
  const screenWidth = window.innerWidth
  
  // Simple: left half = left, right half = right
  // Try INVERTED for user's phone issue
  if (touchX < screenWidth * 0.4) {
    inputLeft = true
    inputRight = false
  } else if (touchX > screenWidth * 0.6) {
    inputRight = true
    inputLeft = false
  } else {
    inputLeft = false
    inputRight = false
  }
}

// Window resize with automatic camera adjustment
function updateCameraFOV() {
  const aspect = window.innerWidth / window.innerHeight
  
  if (aspect < 0.5) {
    // 手機直向 - 廣角
    camera.fov = 90
    camera.position.z = 8
  } else {
    // 平板／電腦 - 正常
    camera.fov = 75
    camera.position.z = 12
  }
  
  camera.aspect = aspect
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', updateCameraFOV)

// 初始化 camera setting
updateCameraFOV()

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  if (gameOver) {
    renderer.render(scene, camera)
    return
  }
  
  // Update player with continuous input
  player.update(inputLeft, inputRight, speed)
  
  // Update road
  roadSpawner.update(player.mesh.position.z)
  
  // Update level (obstacles + coins)
  levelSpawner.update(player.mesh.position.z)
  
  // Update gates
  gateSpawner.update(player.mesh.position.z)
  
  // Update crowd - pass player X and Z position for following
  crowdManager.update(player.mesh.position.x, player.mesh.position.z, Date.now() * 0.001)
  
  let collectedCoins = 0
  
  // Check collisions
  if (invulnerableTimer === 0) {
    // Get crowd positions for collision detection
    const crowdPositions = crowdManager.getCrowdPositions()
    const collision = levelSpawner.checkCollisions(player.mesh, crowdPositions)
    collectedCoins = collision.collectedCoins
    
    // If crowd hits obstacle, eliminate ONLY the crowd members that hit obstacles
    if (collision.hitObstacle && collision.crowdHits && collision.crowdHits.length > 0) {
      // Remove only the specific crowd members that hit
      crowdManager.eliminateByIndices(collision.crowdHits)
      scoreEl.style.color = '#ff8800' // Orange flash
    }
    
    if (collision.hitRed) {
      speed = 0.1  // Slow down (70% of 0.15)
      speedRecoveryTimer = 60
      scoreEl.style.color = '#ff6b6b'
    }
    
    if (collision.hitPurple) {
      lives--
      invulnerableTimer = 60
      scoreEl.style.color = '#ff0000'
      
      if (lives <= 0) {
        gameOver = true
        scoreEl.innerHTML = `💥 Game Over!<br>Score: ${score}<br>🪙 ${coins}<br><small>Tap to restart</small>`
        return
      }
    }
    
    // Check gate collisions - only rebuild if count actually changes
    const gateType = gateSpawner.checkCollision(player.mesh)
    if (gateType) {
      const currentCount = crowdManager.getRemainingCount()
      const newCount = applyGateEffect(currentCount, gateType)
      if (newCount !== currentCount) {  // Only rebuild if count changes!
        crowdManager.rebuild(newCount)
      }
      scoreEl.style.color = '#ffff00' // Yellow flash
    }
  }
  
  // Apply gate effect to crowd count
  // - Red: -5 to -20 (random)
  // - Green: +2 to +5 (random)
  // - Yellow: ×1 to ×3 (random)
  // - Each gate spawns 2
  function applyGateEffect(currentCount: number, type: string): number {
    let newCount = currentCount
    
    switch (type) {
      case 'shopping': // Green: +2 to +5
        newCount = currentCount + Math.floor(Math.random() * 4) + 2  // +2 to +5
        break
      case 'sparkle': // Yellow: ×1 to ×3
        newCount = Math.floor(currentCount * (Math.random() * 2 + 1))  // ×1 to ×3
        break
      case 'bomb': // Red: -5 to -20
        newCount = currentCount - (Math.floor(Math.random() * 16) + 5)  // -5 to -20
        break
    }
    
    // Clamp to [0, 50]
    return Math.max(0, Math.min(50, newCount))
  }
  
  // Recover speed
  if (speedRecoveryTimer > 0) {
    speedRecoveryTimer--
    if (speedRecoveryTimer === 0) {
      speed = 0.28  // 70% of original
      scoreEl.style.color = '#fff'
    }
  }
  
  // Invulnerability
  if (invulnerableTimer > 0) {
    invulnerableTimer--
    player.mesh.visible = Math.floor(invulnerableTimer / 5) % 2 === 0
  } else {
    player.mesh.visible = true
  }
  
  coins += collectedCoins
  
  // Camera
  camera.position.x = 0
  camera.position.z = player.mesh.position.z + 10
  camera.position.y = 5
  camera.lookAt(0, 0, player.mesh.position.z)
  
  // Score with crowd count
  distance += speed
  score = Math.floor(distance) + coins * 10
  const crowdCount = crowdManager.getRemainingCount()
  scoreEl.textContent = `👥 ${crowdCount} | 🛒 ${score} 🪙 ${coins} ❤️ ${lives}`
  
  renderer.render(scene, camera)
}

animate()
