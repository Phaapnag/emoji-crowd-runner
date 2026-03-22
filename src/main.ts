import * as THREE from 'three'
import { Player } from './Player'
import { RoadSpawner } from './RoadSpawner'
import { LevelSpawner } from './LevelSpawner'
import { CrowdManager } from './CrowdManager'
import { GateSpawner } from './GateSpawner'
import { EnemyCrowd } from './EnemyCrowd'
import { UIManager } from './UIManager'
import { GameState } from './GameState'
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

// Day 7: GameState - Central state management
const gameState = new GameState()

// UIManager - Day 6: Right-top HUD + Status Popups
const uiManager = new UIManager(scene, gameContainer)

// Connect gate spawner to obstacle checker
gateSpawner.setObstacleSpawner(levelSpawner)

// Set initial references for UIManager (coins from GameState)
const gameStateRef = { coins: 0, score: 0, distance: 0 }
uiManager.setReferences(crowdManager, player, gameStateRef)

// Game state variables
let score = 0
let distance = 0
let speed = 0.28
let speedRecoveryTimer = 0
let gameOver = false
let gameWon = false
let gameCompleted = false // After wave 8

// Wave/Level system
let currentWave = 1
const MAX_WAVES = 8

// Enemy count per wave: 30, 40, 50, 60, 70, 80, 90, 100
const ENEMY_COUNT_PER_WAVE = [30, 40, 50, 60, 70, 80, 90, 100]

// Crowd max per wave: 50, 50, 60, 70, 80, 90, 100, 100
const CROWD_MAX_PER_WAVE = [50, 50, 60, 70, 80, 90, 100, 100]

// End zone settings
const END_ZONE_DISTANCE = 900
let inEndZone = false
let endZoneTriggered = false
let nextWaveDistance = 0 // Distance for next wave trigger

// Battle states
let battleState: 'none' | 'slowing' | 'waiting' | 'charging' | 'waveComplete' = 'none'
let battleTimer = 0
let chargePosition = 0
let finalResult: 'win' | 'lose' | null = null

// Post-win state for continuing
let postWinTimer = 0

// 3D Text sprites
let bossTextSprite: THREE.Mesh | null = null
let resultTextSprite: THREE.Mesh | null = null

// Camera transition
let cameraTargetY = 5
let cameraTargetZ = 10  // Initial offset from player (smaller = zoom in)
let cameraTransitioning = false

// UI elements
// Day 6: Hide original score (now in HUD)
const scoreEl = document.getElementById('score')!
scoreEl.style.display = 'none'
const battleOverlay = document.getElementById('battleOverlay')!
const battleStatusOverlay = document.getElementById('battleStatusOverlay')!
// Day 6: Hide debug overlay (too much space)
const debugOverlay = document.getElementById('debugOverlay')!
debugOverlay.style.display = 'none'

// Track battle UI elements for efficient updates
let battleUIInitialized = false
let battleMyCountEl: HTMLElement | null = null
let battleEnemyCountEl: HTMLElement | null = null

// Input handling
let inputLeft = false
let inputRight = false

// Unified restart handler for click and Tab key
function handleRestart() {
  // Only handle restart for game over/complete, not wave wins
  if (gameOver || gameCompleted) {
    location.reload()
  }
}

document.addEventListener('click', handleRestart)

document.addEventListener('keydown', (e) => {
  // Press T to run tests (debug mode)
  if (e.key === 't' || e.key === 'T') {
    console.log('\n🚀 Running Day 7 Tests...\n')
    runGameTests()
    return
  }
  
  // Press C to add coins (debug mode)
  if ((e.key === 'c' || e.key === 'C') && !gameOver) {
    gameState.addCoins(100)
    console.log(`[DEBUG] Added 100 coins! Total: ${gameState.coins}`)
    return
  }
  
  // Tab to restart only for game over/complete
  if (gameOver || gameCompleted) {
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
  if (gameOver || gameCompleted) {
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

// Day 7: Game Over Screen with Revive Options
function showGameOverScreen() {
  const canRevive = gameState.canReviveWithCoins()
  const runCoins = gameState.runCoins
  
  let html = `
    <div class="result lose" style="font-size: 32px;">💀 敗北!</div>
    <div class="run-coins" style="margin: 12px 0; font-size: 18px;">今局: 🪙 ${runCoins}</div>
  `
  
  // Revive button A: Use coins (if can afford)
  if (canRevive) {
    html += `
      <button id="revive-coins-btn" class="reward-btn coins" style="
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin: 8px 0;
        width: 80%;
      ">🪙 用 ${gameState.REVIVE_COST} 金幣復活</button>
    `
  }
  
  // Revive button B: Free (will be Watch Ad in future)
  html += `
    <button id="revive-ad-btn" class="reward-btn ad" style="
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin: 8px 0;
      width: 80%;
    ">📺 免費復活</button>
    <div class="restart-hint" style="margin-top: 16px; font-size: 12px; opacity: 0.7;">👆 Click 任意位置 / Tab 重新開始</div>
  `
  
  battleStatusOverlay.innerHTML = html
  battleStatusOverlay.style.display = 'block'
  
  // Button event listeners
  const reviveCoinsBtn = document.getElementById('revive-coins-btn')
  if (reviveCoinsBtn) {
    reviveCoinsBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (gameState.spendCoins(gameState.REVIVE_COST)) {
        performRevive()
      }
    })
  }
  
  const reviveAdBtn = document.getElementById('revive-ad-btn')
  if (reviveAdBtn) {
    reviveAdBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      // TODO: Show Ad here, then call rewardedRevive()
      gameState.rewardedRevive()
      performRevive()
    })
  }
}

// Perform revive - reset player state
function performRevive() {
  gameOver = false
  speed = 0.28
  battleState = 'none'
  inEndZone = false
  endZoneTriggered = false
  nextWaveDistance = distance + 900
  
  // Reset camera
  cameraTargetY = 5
  cameraTargetZ = 10
  cameraTransitioning = true
  
  // Clear overrides
  crowdManager.clearOverride()
  gateSpawner.reset(player.mesh.position.z)
  enemyCrowd.clear()
  
  // Reset battle overlays
  battleStatusOverlay.style.display = 'none'
  battleOverlay.style.display = 'none'
  
  // Remove result sprites
  if (resultTextSprite) {
    scene.remove(resultTextSprite)
    resultTextSprite = null
  }
  
  console.log('[Game] Revived! Has revived:', gameState.hasRevived)
}

// ============== DAY 7 TEST SUITE ==============
// Press 'T' key to run tests

function runGameTests() {
  const results: boolean[] = []
  
  // Test 1: Camera Settings
  console.log('\n=== Test 1: Camera Settings ===')
  console.log(`Camera FOV: ${camera.fov} (expected: 75)`)
  console.log(`Camera Aspect: ${camera.aspect.toFixed(3)} (expected: ${(500/844).toFixed(3)})`)
  const camPassed = camera.fov === 75 && Math.abs(camera.aspect - 500/844) < 0.01
  console.log(`✅ Test 1: ${camPassed ? 'PASS' : 'FAIL'}\n`)
  results.push(camPassed)
  
  // Test 2: Mobile Resize
  console.log('=== Test 2: Mobile Resize ===')
  window.dispatchEvent(new Event('resize'))
  const rect = gameContainer.getBoundingClientRect()
  console.log(`Container size: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`)
  const resizePassed = rect.width > 0 && rect.height > 0
  console.log(`✅ Test 2: ${resizePassed ? 'PASS' : 'FAIL'}\n`)
  results.push(resizePassed)
  
  // Test 3: Game Restart
  console.log('=== Test 3: Game Restart ===')
  const restartTest = typeof handleRestart === 'function'
  console.log(`handleRestart exists: ${restartTest}`)
  console.log(`✅ Test 3: ${restartTest ? 'PASS' : 'FAIL'}\n`)
  results.push(restartTest)
  
  // Test 4: Performance
  console.log('=== Test 4: Performance ===')
  const info = renderer.info
  console.log(`Draw Calls: ${info.render.calls}`)
  console.log(`Triangles: ${info.render.triangles}`)
  console.log(`✅ Test 4: ${info.render.calls < 500 ? 'PASS' : 'CHECK'}\n`)
  results.push(true) // Always pass, just info
  
  // Test 5: Coin System
  console.log('=== Test 5: Coin System ===')
  const prevCoins = gameState.coins
  gameState.addCoins(10)
  console.log(`addCoins(10): ${gameState.coins - prevCoins === 10 ? 'PASS' : 'FAIL'}`)
  const coinPassed = gameState.spendCoins(5) && gameState.coins === prevCoins + 5
  console.log(`spendCoins(5): ${coinPassed ? 'PASS' : 'FAIL'}`)
  gameState.reset()
  results.push(coinPassed)
  
  // Summary
  console.log('\n========================================')
  console.log(`   TEST SUMMARY: ${results.filter(r=>r).length}/${results.length} PASSED`)
  console.log('========================================\n')
}

// Expose for console
;(window as any).runGameTests = runGameTests

// Day 7: Win/Complete Screen with Double Coins Option
function showWinScreen(runCoins: number) {
  const html = `
    <div class="result win" style="font-size: 36px;">🏆 通關!</div>
    <div class="run-coins" style="margin: 16px 0; font-size: 20px;">今局獲得: 🪙 ${runCoins}</div>
    <button id="double-coins-btn" class="reward-btn" style="
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin: 8px 0;
      width: 80%;
    ">📺 免費 x2 金幣</button>
    <div class="restart-hint" style="margin-top: 16px; font-size: 12px; opacity: 0.7;">👆 Click / Tab 重新開始</div>
  `
  
  battleStatusOverlay.innerHTML = html
  battleStatusOverlay.style.display = 'block'
  
  // Button event listener
  const doubleCoinsBtn = document.getElementById('double-coins-btn')
  if (doubleCoinsBtn) {
    doubleCoinsBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      // TODO: Show Ad here, then call rewardedDoubleCoins()
      gameState.rewardedDoubleCoins(runCoins)
      // Show updated total
      const totalDisplay = document.createElement('div')
      totalDisplay.style.cssText = 'margin-top: 12px; font-size: 18px; color: #fbbf24;'
      totalDisplay.textContent = `總金幣: 🪙 ${gameState.totalCoins}`
      doubleCoinsBtn.parentNode?.appendChild(totalDisplay)
      doubleCoinsBtn.style.display = 'none'
    })
  }
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
  
  // Day 6: Update UIManager HUD (hide during battle)
  gameStateRef.coins = gameState.coins
  gameStateRef.score = score
  gameStateRef.distance = distance
  uiManager.update(!inEndZone) // Hide HUD during battle
  
  let collectedCoins = 0
  
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
    // Purple obstacle: instant game over
    gameOver = true
    speed = 0
    battleState = 'waveComplete' // Stop battle logic
    showGameOverScreen()
    return
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
  
  const playerZ = player.mesh.position.z
  
  // Trigger end zone
  const triggerDistance = nextWaveDistance > 0 ? nextWaveDistance : END_ZONE_DISTANCE
  if (!endZoneTriggered && distance >= triggerDistance) {
    endZoneTriggered = true
    inEndZone = true
    battleState = 'slowing'
    battleTimer = 0
    
    // Day 6: Show battle warning popup
    uiManager.showBattleWarning()
    
    // Use wave-based enemy count
    const enemyCount = ENEMY_COUNT_PER_WAVE[currentWave - 1]
    enemyCrowd.spawnForWave(currentWave, playerZ, enemyCount)
    
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
            // Lost - game over
            battleState = 'waveComplete' // Use same state to stop battle loop
            gameOver = true
            
            // Show LOSS 3D sprite
            if (!resultTextSprite) {
              resultTextSprite = createTextSprite('LOSE', '#ff3131', 3)
              resultTextSprite.position.set(0, 3, playerZ)
              scene.add(resultTextSprite)
            }
            
            // Day 7: Show game over screen with revive options
            showGameOverScreen()
          } else if (newEnemyCount <= 0) {
            // Wave complete! Continue to next wave
            battleState = 'waveComplete'
            postWinTimer = 0
            
            // Check if this was the last wave
            if (currentWave >= MAX_WAVES) {
              // Game complete!
              gameCompleted = true
              const runCoins = gameState.runCoins
              showWinScreen(runCoins)
            } else {
              // Show wave complete, continue
              const nextWave = currentWave + 1
              const nextEnemyCount = ENEMY_COUNT_PER_WAVE[nextWave - 1]
              battleStatusOverlay.innerHTML = `
                <div class="result win" style="font-size: 32px;">🏆 第${currentWave}關完成!</div>
                <div class="count friend" style="font-size: 18px; margin-top: 8px;">存活: ${newMyCount} 人</div>
                <div style="font-size: 14px; color: #aaa; margin-top: 8px;">下一關: ${nextEnemyCount} 敵人...</div>
              `
            }
          }
        }
        
        // Rotate the 3D result text if it exists
        if (resultTextSprite) {
          resultTextSprite.rotation.y += 0.02
        }
        break
        
      case 'waveComplete':
        // Don't do normal battle logic, just wait
        if (gameCompleted) {
          // Game is done, wait for restart
          break
        }
        
        // Continue: after 3 seconds, start next wave
        postWinTimer++
        if (postWinTimer >= 180) { // 3 seconds at 60fps
          currentWave++
          
          // Reset for next wave
          inEndZone = false
          endZoneTriggered = false
          battleState = 'none'
          speed = 0.28
          
          // FIX 1: Clear crowd override so they follow player again
          crowdManager.clearOverride()
          
          // FIX 2: Reset gate spawner to start spawning again (pass playerZ)
          gateSpawner.reset(playerZ)
          
          // FIX 3: Clear old enemies from battle
          enemyCrowd.clear()
          
          // Reset camera to normal
          cameraTargetY = 5
          cameraTargetZ = 10
          cameraTransitioning = true
          
          // Clear result sprites
          if (resultTextSprite) {
            scene.remove(resultTextSprite)
            resultTextSprite = null
          }
          
          // Hide battle status, show HUD
          battleStatusOverlay.style.display = 'none'
          battleOverlay.style.display = 'none'
          
          // Continue with remaining crowd
          // nextWaveDistance will be set based on wave
          nextWaveDistance = distance + 900
        }
        break
    }
  }
  
  function applyGateEffect(currentCount: number, type: string, value: number): number {
    const crowdMax = CROWD_MAX_PER_WAVE[currentWave - 1]
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
    
    return Math.max(0, Math.min(crowdMax, newCount))
  }
  
  if (speedRecoveryTimer > 0 && !inEndZone) {
    speedRecoveryTimer--
    if (speedRecoveryTimer === 0) {
      speed = 0.28
      scoreEl.style.color = '#fff'
    }
  }
  
  if (collectedCoins > 0) {
    gameState.addCoins(collectedCoins)
  }
   
  // Hide battle status when not in end zone
  if (!inEndZone) {
    battleOverlay.style.display = 'none'
    battleStatusOverlay.style.display = 'none'
  }
  
  // Update debug camera info (show on screen for debugging)
  // Show camera X, Y, Z positions
  const camDebugEl = document.getElementById('cam-debug')
  if (camDebugEl) {
    camDebugEl.textContent = `Cam: x=${camera.position.x.toFixed(1)} y=${camera.position.y.toFixed(1)} z=${camera.position.z.toFixed(1)} | Wave:${currentWave} | State:${battleState}`
  }
  // debugOverlay is hidden, keep it that way
  debugOverlay.textContent = `PZ:${playerZ.toFixed(0)} CamZ:${camera.position.z.toFixed(0)}`
  
  // Camera - gradual transition to battle view (3 seconds = lerp 0.02)
  const cameraLerp = cameraTransitioning ? 0.02 : 1  // 3 seconds to transition
  camera.position.x = 0
  
  // Determine camera mode based on battle state
  const isInBattle = inEndZone && (battleState === 'slowing' || battleState === 'waiting' || battleState === 'charging')
  
  if (isInBattle) {
    // During battle: camera follows player + shows crowd + enemies
    // Camera MUST follow player in Z or everything goes behind camera
    camera.position.z = playerZ + 12  // CRITICAL: follow player!
    camera.position.y += (cameraTargetY - camera.position.y) * cameraLerp
    // Look at where crowd and enemies meet (in front of player)
    const battleLookZ = playerZ - 5  // Look slightly ahead of player
    camera.lookAt(0, 2, battleLookZ)
  } else if (cameraTransitioning) {
    // Post-wave transition: move camera back to normal position
    // CRITICAL: Always follow player in Z!
    camera.position.z = playerZ + 12  // MUST follow player!
    camera.position.y += (5 - camera.position.y) * cameraLerp
    camera.lookAt(0, 2, playerZ)
    
    // Stop transitioning when close enough
    if (Math.abs(camera.position.y - 5) < 0.1) {
      cameraTransitioning = false
    }
  } else {
    // Normal gameplay: camera follows player in z direction
    // Player moves in negative z, so camera should follow
    camera.position.z = playerZ + 12  // FIXED offset behind player!
    camera.position.y = 5
    camera.lookAt(0, 2, playerZ)  // Look slightly ahead of player
  }
  
  distance += speed
  score = Math.floor(distance) + gameState.coins * 10
  
  const crowdCount = crowdManager.getRemainingCount()
  if (battleState === 'none') {
    let debugInfo = `PZ${playerZ.toFixed(0)} 👥${crowdCount} 🛒${score} 🪙${gameState.coins}`
    scoreEl.textContent = debugInfo
  }
  
  renderer.render(scene, camera)
}

animate()
// cache bust Wed Mar 18 14:02:24 HKT 2026
