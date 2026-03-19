import * as THREE from 'three'
import { Player } from './Player'
import { RoadSpawner } from './RoadSpawner'
import { LevelSpawner } from './LevelSpawner'
import { CrowdManager } from './CrowdManager'
import { GateSpawner } from './GateSpawner'
import { EnemyCrowd } from './EnemyCrowd'
import { UIManager } from './UIManager'
import './ui.css'

// Scene setup
const scene = new THREE.Scene()
// Purple gradient background (matches game container)
scene.background = new THREE.Color(0x2d1b4e)

// Camera - use 500/844 aspect ratio for browser
const camera = new THREE.PerspectiveCamera(75, 500 / 844, 0.1, 1000)
camera.position.set(0, 5, 12)
camera.lookAt(0, 0, 0)

// Renderer - append to game container, not body
const gameContainer = document.querySelector('.game-container') as HTMLElement
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
gameContainer.appendChild(renderer.domElement)

function resizeRenderer() {
  const rect = gameContainer.getBoundingClientRect()
  renderer.setSize(rect.width, rect.height)
}

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

// UIManager - Day 6: Right-top HUD + Status Popups
const uiManager = new UIManager(scene, gameContainer)

// Connect gate spawner to obstacle checker
gateSpawner.setObstacleSpawner(levelSpawner)

// Set initial references for UIManager (coins will be passed directly in update)
// Use a mutable reference object
const gameStateRef = { coins: 0, score: 0, distance: 0 }
uiManager.setReferences(crowdManager, player, gameStateRef)

// Game state
let score = 0
let distance = 0
let coins = 0
let lives = 3
let speed = 0.28
let speedRecoveryTimer = 0
let invulnerableTimer = 0
let gameOver = false
let gameWon = false

// End zone settings - DEBUG: quick test at 50!
const END_ZONE_DISTANCE = 900
let inEndZone = false
let endZoneTriggered = false

// Battle states
let battleState: 'none' | 'slowing' | 'waiting' | 'charging' | 'ended' = 'none'
let battleTimer = 0
let chargePosition = 0
let finalResult: 'win' | 'lose' | null = null

// 3D Text sprites
let bossTextSprite: THREE.Mesh | null = null
let resultTextSprite: THREE.Mesh | null = null

// Camera transition
let cameraTargetY = 5
let cameraTargetZ = 10  // Initial offset from player (smaller = zoom in)
let cameraTransitioning = false

// UI elements
const scoreEl = document.getElementById('score')!
const battleOverlay = document.getElementById('battleOverlay')!
const battleStatusOverlay = document.getElementById('battleStatusOverlay')!
const debugOverlay = document.getElementById('debugOverlay')!

// Track battle UI elements for efficient updates
let battleUIInitialized = false
let battleMyCountEl: HTMLElement | null = null
let battleEnemyCountEl: HTMLElement | null = null

// Input handling
let inputLeft = false
let inputRight = false

// Unified restart handler for click and Tab key
function handleRestart() {
  if (battleState === 'ended') {
    window.location.href = window.location.href
  } else if (gameOver || gameWon) {
    location.reload()
  }
}

document.addEventListener('click', handleRestart)

document.addEventListener('keydown', (e) => {
  // Tab to continue after battle (when battleState is 'ended')
  if (battleState === 'ended') {
    if (e.key === 'Tab') {
      e.preventDefault()
      handleRestart()
      return
    }
  }
  
  if (gameOver || gameWon) {
    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') {
      location.reload()
    }
    return
  }
  
  // Arrow Up or W to start battle
  if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && battleState === 'waiting') {
    battleState = 'charging'
    battleTimer = 0
    battleOverlay.style.display = 'none'
    if (bossTextSprite) {
      scene.remove(bossTextSprite)
      bossTextSprite = null
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

// Removed duplicate click listener - now handled by unified handleRestart()

// Touch handling
let touchStartY = 0
let touchStartX = 0

document.addEventListener('touchstart', (e) => {
  if (battleState === 'ended' && finalResult) {
    if (finalResult === 'win') {
      gameWon = true
    } else {
      gameOver = true
    }
    return
  }
  
  if (gameOver || gameWon) {
    location.reload()
    return
  }
  
  touchStartY = e.touches[0].clientY
  touchStartX = e.touches[0].clientX
  
  e.preventDefault()
  handleTouch(e.touches[0].clientX)
}, { passive: false })

document.addEventListener('touchmove', (e) => {
  const deltaY = touchStartY - e.touches[0].clientY
  const deltaX = Math.abs(touchStartX - e.touches[0].clientX)
  
  // Swipe up to start battle
  if (deltaY > 50 && deltaX < 30) {
    if (battleState === 'waiting') {
      battleState = 'charging'
      battleTimer = 0
      battleOverlay.style.display = 'none'
      if (bossTextSprite) {
        scene.remove(bossTextSprite)
        bossTextSprite = null
      }
    }
  }
  
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

// Window resize - keep game aspect ratio 500/844
let resizeInitialized = false
function updateCameraFOV() {
  // Keep fixed aspect ratio for game camera
  camera.fov = 75
  camera.aspect = 500 / 844
  camera.position.z = 12
  camera.updateProjectionMatrix()
  // Resize renderer to match container
  resizeRenderer()
}

window.addEventListener('resize', updateCameraFOV)
// Only call once on init to avoid duplicate resize issues
if (!resizeInitialized) {
  resizeInitialized = true
  updateCameraFOV()
}

// Helper: Create text sprite WITHOUT background box
function createTextSprite(text: string, color: string, size: number = 3): THREE.Mesh {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 512
  canvas.height = 256
  
  // Transparent background - NO box, NO black background!
  
  // Text only - bigger for visibility
  ctx.font = `bold ${size * 50}px Arial`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 10
  ctx.lineWidth = 3
  ctx.strokeStyle = '#000'
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2)
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const geometry = new THREE.PlaneGeometry(6, 3)  // Smaller size
  const mesh = new THREE.Mesh(geometry, material)
  
  return mesh
}

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  if (gameOver || gameWon) {
    enemyCrowd.update(Date.now() * 0.001)
    crowdManager.update(player.mesh.position.x, player.mesh.position.z, Date.now() * 0.001)
    
    if (resultTextSprite) {
      resultTextSprite.rotation.y += 0.02
    }
    
    renderer.render(scene, camera)
    return
  }
  
  if (battleState === 'ended') {
    if (resultTextSprite) {
      resultTextSprite.rotation.y += 0.02
    }
    
    renderer.render(scene, camera)
    return
  }
  
  // Update player - freeze movement in end zone
  if (inEndZone) {
    // Disable left/right movement in end zone
    player.update(false, false, 0)
  } else {
    player.update(inputLeft, inputRight, speed)
  }
  roadSpawner.update(player.mesh.position.z)
  levelSpawner.update(player.mesh.position.z)
  gateSpawner.update(player.mesh.position.z)
  crowdManager.update(player.mesh.position.x, player.mesh.position.z, Date.now() * 0.001)
  
  // Day 6: Update UIManager HUD
  gameStateRef.coins = coins
  gameStateRef.score = score
  gameStateRef.distance = distance
  uiManager.update()
  
  let collectedCoins = 0
  
  if (invulnerableTimer === 0) {
    const crowdPositions = crowdManager.getCrowdPositions()
    const collision = levelSpawner.checkCollisions(player.mesh, crowdPositions)
    collectedCoins = collision.collectedCoins
    
    if (collision.hitObstacle && collision.crowdHits && collision.crowdHits.length > 0) {
      crowdManager.eliminateByIndices(collision.crowdHits)
      scoreEl.style.color = '#ff8800'
    }
    
    if (collision.hitRed) {
      speed = 0.1
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
    
    const gateCollision = gateSpawner.checkCollision(player.mesh)
    if (gateCollision) {
      const currentCount = crowdManager.getRemainingCount()
      const newCount = applyGateEffect(currentCount, gateCollision.type, gateCollision.value)
      if (newCount !== currentCount) {
        crowdManager.rebuild(newCount)
        // Day 6: Show gate popup
        uiManager.showGatePopup(gateCollision.type, gateCollision.value)
      }
      scoreEl.style.color = '#ffff00'
    }
  }
  
  const playerZ = player.mesh.position.z
  
  // Trigger end zone
  if (!endZoneTriggered && distance >= END_ZONE_DISTANCE) {
    endZoneTriggered = true
    inEndZone = true
    battleState = 'slowing'
    battleTimer = 0
    
    // Day 6: Show battle warning popup
    uiManager.showBattleWarning()
    
    const difficulty = Math.min(1.5, 1 + (score / 2000))
    enemyCrowd.spawn(difficulty, playerZ)
    
    speed = speed * 0.3
    
    // Clear gates AND obstacles
    gateSpawner.clearAll()
    levelSpawner.clearAll()
    
    // Start camera transition to battle view (3 seconds = lerp 0.02)
    cameraTargetY = 7  // Lower to see enemies better (was 10)
    cameraTargetZ = 10  // Closer for battle view
    cameraTransitioning = true
    
    scoreEl.style.color = '#ff0000'
  }
  
  // Also start camera transition BEFORE end zone (when approaching)
  // Y starts at distance 900, Z starts at distance 850
  // Note: Smaller Z = zoom IN, Larger Z = zoom OUT
  if (!endZoneTriggered && distance >= 850) {
    // Gradually move camera forward as we approach end zone
    const approachProgress = (distance - 850) / 50  // Z: 850-900
    // Zoom IN: Z goes from 10 DOWN to 6 (closer to player = bigger view)
    cameraTargetZ = 10 + (6 - 10) * Math.min(1, approachProgress)
    cameraTransitioning = true
  }
  
  if (!endZoneTriggered && distance >= 900) {
    // Y starts at 900 - goes higher for better view
    const yProgress = (distance - 900) / 50  // Y: 900-950
    cameraTargetY = 5 + (10 - 5) * Math.min(1, yProgress)
  }
  
  // Battle state machine
  if (inEndZone) {
    const myCount = crowdManager.getRemainingCount()
    const enemyCount = enemyCrowd.getCount()
    
    switch (battleState) {
      case 'slowing':
        battleTimer++
        
        // Show BOSS text using HTML overlay (at TOP!)
        if (battleTimer < 60) {
          battleOverlay.innerHTML = '<span class="boss-text">👹 BOSS</span>'
          battleOverlay.style.top = '60px'
          battleOverlay.style.bottom = 'auto'
          battleOverlay.style.display = 'block'
        } else {
          battleOverlay.style.display = 'none'
        }
        
        if (battleTimer >= 90) {
          speed = 0
          battleState = 'waiting'
          battleTimer = 0
          battleOverlay.style.display = 'none'
        }
        
        // Show battle status at BOTTOM with neon styling - compact layout
        battleStatusOverlay.innerHTML = `
          <div class="count-row">
            <span class="count friend">👥 ${myCount} 人</span>
            <span class="vs-text">VS</span>
            <span class="count enemy">💀 ${enemyCount} 敵</span>
          </div>
        `
        battleStatusOverlay.style.display = 'block'
        
        scoreEl.textContent = `⚔️ BOSS戰!`
        break
        
      case 'waiting':
        // Show battle instruction at TOP with neon styling
        battleOverlay.innerHTML = '<span class="instruction-text">⚔️<br>向上掃<br>按↑開始!</span>'
        battleOverlay.style.top = '60px'
        battleOverlay.style.bottom = 'auto'
        battleOverlay.style.display = 'block'
        
        // Show battle status at BOTTOM with neon styling - compact layout
        battleStatusOverlay.innerHTML = `
          <div class="count-row">
            <span class="count friend">👥 ${myCount} 人</span>
            <span class="vs-text">VS</span>
            <span class="count enemy">💀 ${enemyCount} 敵</span>
          </div>
        `
        battleStatusOverlay.style.display = 'block'
        
        battleTimer++
        scoreEl.textContent = ``
        break
        
      case 'charging':
        // Hide instruction overlay
        battleOverlay.style.display = 'none'
        
        // Set up HTML structure ONCE when entering charging state - compact layout
        if (battleTimer === 0) {
          battleStatusOverlay.innerHTML = `
            <div class="count-row">
              <span id="battle-my-count" class="count friend">👥 ${myCount} 人</span>
              <span class="vs-text">VS</span>
              <span id="battle-enemy-count" class="count enemy">💀 ${enemyCount} 敵</span>
            </div>
          `
          battleStatusOverlay.style.display = 'block'
        }
        
        battleTimer++
        
        // Move both crowds toward each other
        const enemyZ = enemyCrowd.getEnemyZoneZ()
        const meetingPoint = playerZ - 7.5
        
        // Enemy move: 10% per frame toward meeting point
        const enemyMoveAmount = (meetingPoint - enemyZ) * 0.1
        const newEnemyZ = enemyZ + enemyMoveAmount
        
        // Crowd moves toward meeting point
        const currentCrowdPos = crowdManager.getCurrentZ()
        const crowdMoveAmount = (meetingPoint - currentCrowdPos) * 0.1
        const newCrowdZ = currentCrowdPos + crowdMoveAmount
        
        // Apply positions
        enemyCrowd.setCustomZ(newEnemyZ)
        crowdManager.setCustomZ(newCrowdZ)
        enemyCrowd.update(Date.now() * 0.001)
        
        // BATTLE CLASH during charging! (every 8 frames)
        if (battleTimer % 8 === 0 && myCount > 0 && enemyCount > 0) {
          crowdManager.rebuild(Math.max(0, myCount - 1))
          enemyCrowd.eliminateOne()
          
          const newMyCount = crowdManager.getRemainingCount()
          const newEnemyCount = enemyCrowd.getCount()
          
          // Update only the numbers with neon styling
          const myCountEl = document.getElementById('battle-my-count')
          const enemyCountEl = document.getElementById('battle-enemy-count')
          if (myCountEl) {
            myCountEl.textContent = `👥 ${newMyCount} 人`
            myCountEl.className = 'count friend'
          }
          if (enemyCountEl) {
            enemyCountEl.textContent = `💀 ${newEnemyCount} 敵`
            enemyCountEl.className = 'count enemy'
          }
          
          scoreEl.textContent = `⚔️ 決戰! 👥${newMyCount} vs 💀${newEnemyCount}`
          
          // Check for winner!
          if (newMyCount <= 0) {
            battleState = 'ended'
            finalResult = 'lose'
            
            // Show WIN/LOSS 3D sprite
            if (!resultTextSprite) {
              resultTextSprite = createTextSprite('LOSS', '#ff3131', 3)
              resultTextSprite.position.set(0, 3, playerZ)
              scene.add(resultTextSprite)
            }
            
            battleStatusOverlay.innerHTML = `
              <div class="result lose" style="font-size: 36px;">💀 敗北!</div>
              <div class="count enemy" style="font-size: 18px; margin-top: 8px;">敵人: ${newEnemyCount}</div>
              <div class="restart-hint">👆 Click / Tab 重新開始</div>
            `
          } else if (newEnemyCount <= 0) {
            battleState = 'ended'
            finalResult = 'win'
            
            // Show WIN/LOSS 3D sprite
            if (!resultTextSprite) {
              resultTextSprite = createTextSprite('WIN', '#39ff14', 3)
              resultTextSprite.position.set(0, 3, playerZ)
              scene.add(resultTextSprite)
            }
            
            battleStatusOverlay.innerHTML = `
              <div class="result win" style="font-size: 36px;">🏆 勝利!</div>
              <div class="count friend" style="font-size: 18px; margin-top: 8px;">存活: ${newMyCount} 人</div>
              <div class="restart-hint">👆 Click / Tab 重新開始</div>
            `
          }
        }
        
        // Rotate the 3D result text if it exists
        if (resultTextSprite) {
          resultTextSprite.rotation.y += 0.02
        }
        break
    }
  }
  
  function applyGateEffect(currentCount: number, type: string, value: number): number {
    let newCount = currentCount
    
    switch (type) {
      case 'shopping':
        newCount = currentCount + value
        break
      case 'sparkle':
        newCount = Math.floor(currentCount * value)
        break
      case 'bomb':
        newCount = currentCount - value
        break
    }
    
    return Math.max(0, Math.min(50, newCount))
  }
  
  if (speedRecoveryTimer > 0 && !inEndZone) {
    speedRecoveryTimer--
    if (speedRecoveryTimer === 0) {
      speed = 0.28
      scoreEl.style.color = '#fff'
    }
  }
  
  if (invulnerableTimer > 0) {
    invulnerableTimer--
    player.mesh.visible = Math.floor(invulnerableTimer / 5) % 2 === 0
  } else {
    player.mesh.visible = true
  }
  
  coins += collectedCoins
   
  // Hide battle status when not in end zone
  if (!inEndZone) {
    battleOverlay.style.display = 'none'
    battleStatusOverlay.style.display = 'none'
  }
  
  // Update debug camera info
  debugOverlay.textContent = `Cam: x=${camera.position.x.toFixed(1)} y=${camera.position.y.toFixed(1)} z=${camera.position.z.toFixed(1)} | D:${Math.floor(distance)} | State:${battleState}`
  
  // Camera - gradual transition to battle view (3 seconds = lerp 0.02)
  const cameraLerp = cameraTransitioning ? 0.02 : 1  // 3 seconds to transition
  camera.position.x = 0
  if (inEndZone || cameraTransitioning) {
    // End zone: camera higher and further back to show player+crowd + enemies
    // Look at the MEETING POINT (playerZ - 7.5), not just playerZ
    const battleLookZ = playerZ - 7.5  // Where crowd and enemies meet
    const targetZ = playerZ + cameraTargetZ
    const targetY = cameraTargetY
    camera.position.z += (targetZ - camera.position.z) * cameraLerp
    camera.position.y += (targetY - camera.position.y) * cameraLerp
    camera.lookAt(0, 2, battleLookZ)  // Look at meeting point!
    
    // Stop transitioning when close enough
    if (Math.abs(camera.position.y - cameraTargetY) < 0.1 && Math.abs(camera.position.z - (playerZ + cameraTargetZ)) < 0.5) {
      cameraTransitioning = false
    }
  } else {
    // Normal gameplay
    camera.position.z = playerZ + 10
    camera.position.y = 5
    camera.lookAt(0, 0, playerZ)
  }
  
  distance += speed
  score = Math.floor(distance) + coins * 10
  
  const crowdCount = crowdManager.getRemainingCount()
  if (battleState === 'none') {
    let debugInfo = `👥 ${crowdCount} | 🛒 ${score} 🪙 ${coins} ❤️ ${lives} | D:${Math.floor(distance)}`
    scoreEl.textContent = debugInfo
  }
  
  renderer.render(scene, camera)
}

animate()
// cache bust Wed Mar 18 14:02:24 HKT 2026
