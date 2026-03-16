import * as THREE from 'three'
import { Player } from './Player'
import { RoadSpawner } from './RoadSpawner'
import { LevelSpawner } from './LevelSpawner'
import { CrowdManager } from './CrowdManager'
import { GateSpawner } from './GateSpawner'
import { EnemyCrowd } from './EnemyCrowd'

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
const enemyCrowd = new EnemyCrowd(scene)

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
let gameWon = false

// End zone settings
const END_ZONE_DISTANCE = 800  // Trigger end zone when distance >= 800 (about 800+ score)
let inEndZone = false
let endZoneTriggered = false

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
  if (gameOver || gameWon) {
    location.reload()
  }
})

// Touch handling - simple binary control:
// Touch left half = move left (constant speed)
// Touch right half = move right (constant speed)
// Release = stop

document.addEventListener('touchstart', (e) => {
  if (gameOver || gameWon) {
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
  
  // Debug log
  console.log('[Game] distance:', distance.toFixed(1), 'score:', score, 'playerZ:', player.mesh.position.z.toFixed(1))
  
  if (gameOver) {
    console.log('[Game] Game Over!')
    enemyCrowd.update(Date.now() * 0.001)  // Still animate enemies on game over
    renderer.render(scene, camera)
    return
  }
  
  if (gameWon) {
    console.log('[Game] Game Won!')
    enemyCrowd.update(Date.now() * 0.001)  // Still animate on win
    crowdManager.update(player.mesh.position.x, player.mesh.position.z, Date.now() * 0.001)
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
    const gateCollision = gateSpawner.checkCollision(player.mesh)
    if (gateCollision) {
      const currentCount = crowdManager.getRemainingCount()
      const newCount = applyGateEffect(currentCount, gateCollision.type, gateCollision.value)
      if (newCount !== currentCount) {  // Only rebuild if count changes!
        crowdManager.rebuild(newCount)
      }
      scoreEl.style.color = '#ffff00' // Yellow flash
    }
  }
  
  // ===== END ZONE LOGIC =====
  // Check if player has reached end zone (using distance, not Z position)
  const playerZ = player.mesh.position.z
  
  // Trigger end zone when distance >= END_ZONE_DISTANCE
  if (!endZoneTriggered && distance >= END_ZONE_DISTANCE) {
    console.log('[EndZone] Player reached end zone! distance:', distance, 'playerZ:', playerZ)
    endZoneTriggered = true
    inEndZone = true
    
    // Spawn enemy crowd - spawn at a position relative to player
    const difficulty = Math.min(1.5, 1 + (score / 2000))  // Difficulty scales with score
    enemyCrowd.spawn(difficulty, playerZ)
    console.log('[EndZone] Enemy count:', enemyCrowd.getCount(), 'Enemy zone Z:', enemyCrowd.getEnemyZoneZ())
    
    // Update UI to show battle mode
    scoreEl.style.color = '#ff0000'
    scoreEl.textContent = `⚔️ 終點戰! 我方:${crowdManager.getRemainingCount()} 敵人:${enemyCrowd.getCount()}`
  }
  
  // Update enemy crowd if in end zone
  if (inEndZone && !gameOver && !gameWon) {
    try {
      enemyCrowd.update(Date.now() * 0.001)
      console.log('[EndZone] EN:', enemyCrowd.getCount(), 'EZ:', enemyCrowd.getEnemyZoneZ(), 'PZ:', playerZ)
    } catch (e) {
      console.error('[EndZone] Error:', e)
    }
    
    // Check if player has reached enemy zone for battle
    if (enemyCrowd.hasReachedEnemyZone(playerZ)) {
      const myCount = crowdManager.getRemainingCount()
      const battleResult = enemyCrowd.battle(myCount)
      
      if (battleResult.result === 'win') {
        // Victory!
        gameWon = true
        crowdManager.rebuild(battleResult.remainingCount)
        scoreEl.innerHTML = `🎉 勝利!<br>剩餘: ${battleResult.remainingCount}<br>Score: ${score}<br><small>Tap to restart</small>`
        scoreEl.style.color = '#00ff00'
      } else {
        // Defeat
        gameOver = true
        crowdManager.rebuild(0)
        scoreEl.innerHTML = `💀 敗北!<br>敵人: ${enemyCrowd.getCount()}<br>我方: ${myCount}<br><small>Tap to restart</small>`
        scoreEl.style.color = '#ff0000'
      }
    } else {
      // Show battle UI while approaching
      const myCount = crowdManager.getRemainingCount()
      const enemyCount = enemyCrowd.getCount()
      scoreEl.innerHTML = `⚔️ 終點戰!<br>👥 我方: ${myCount}<br>💀 敵人: ${enemyCount}<br>接近中...`
    }
  }
  
  // Stop spawning when in end zone
  if (inEndZone) {
    // Don't spawn new obstacles/gates in end zone
  }

  // Apply gate effect to crowd count (use stored value!)
  function applyGateEffect(currentCount: number, type: string, value: number): number {
    let newCount = currentCount
    
    switch (type) {
      case 'shopping': // Green: +value
        newCount = currentCount + value
        break
      case 'sparkle': // Yellow: ×value
        newCount = Math.floor(currentCount * value)
        break
      case 'bomb': // Red: -value
        newCount = currentCount - value
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
  
  // Build debug info (always show basic info)
  let debugInfo = `👥 ${crowdCount} | 🛒 ${score} 🪙 ${coins} ❤️ ${lives} | D:${Math.floor(distance)} E:${endZoneTriggered}`
  
  // Add enemy debug info if in end zone
  if (inEndZone && !gameOver && !gameWon) {
    try {
      debugInfo += ` | EN:${enemyCrowd.getCount()} EZ:${enemyCrowd.getEnemyZoneZ()} PZ:${Math.floor(playerZ)}`
    } catch (e) {
      console.error('[Debug] Error:', e)
    }
  }
  
  scoreEl.textContent = debugInfo
  
  renderer.render(scene, camera)
}

animate()
