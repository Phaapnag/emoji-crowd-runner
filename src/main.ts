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
let speed = 0.28
let speedRecoveryTimer = 0
let invulnerableTimer = 0
let gameOver = false
let gameWon = false

// End zone settings
const END_ZONE_DISTANCE = 900
let inEndZone = false
let endZoneTriggered = false

// Battle states
let battleState: 'none' | 'slowing' | 'waiting' | 'charging' | 'battling' | 'ended' = 'none'
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

// Create battle instruction overlay (bottom center)
const battleOverlay = document.createElement('div')
battleOverlay.style.cssText = `
  position: fixed;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  color: #ffff00;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px #000;
  pointer-events: none;
  display: none;
  z-index: 100;
  text-align: center;
`
document.body.appendChild(battleOverlay)

// Create battle status overlay (bottom center - for both mobile and browser)
const battleStatusOverlay = document.createElement('div')
battleStatusOverlay.style.cssText = `
  position: fixed;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%);
  color: #ffffff;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 3px 3px 6px #000, -1px -1px 0 #000;
  pointer-events: none;
  display: none;
  z-index: 100;
  text-align: center;
  font-family: Arial, sans-serif;
  white-space: nowrap;
  min-width: 200px;
`
document.body.appendChild(battleStatusOverlay)

// Debug camera info overlay
const debugOverlay = document.createElement('div')
debugOverlay.style.cssText = `
  position: fixed;
  top: 10px;
  left: 10px;
  color: #00ff00;
  font-size: 12px;
  font-family: monospace;
  pointer-events: none;
  z-index: 100;
  text-shadow: 1px 1px 2px #000;
`
document.body.appendChild(debugOverlay)

// Input handling
let inputLeft = false
let inputRight = false

document.addEventListener('keydown', (e) => {
  // Tab to continue after battle (when battleState is 'ended')
  if (battleState === 'ended' && finalResult) {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (finalResult === 'win') {
        gameWon = true
      } else {
        gameOver = true
      }
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
    console.log('[Key] Up arrow - Starting battle!')
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

// Click to restart / continue
document.addEventListener('click', () => {
  if (battleState === 'ended' && finalResult) {
    if (finalResult === 'win') {
      gameWon = true
    } else {
      gameOver = true
    }
  } else if (gameOver || gameWon) {
    location.reload()
  }
})

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
      console.log('[Touch] Swipe up - Starting battle!')
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

// Window resize
function updateCameraFOV() {
  const aspect = window.innerWidth / window.innerHeight
  
  if (aspect < 0.5) {
    camera.fov = 90
    camera.position.z = 8
  } else {
    camera.fov = 75
    camera.position.z = 12
  }
  
  camera.aspect = aspect
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', updateCameraFOV)
updateCameraFOV()

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
  
  // Debug log
  console.log('[Game] distance:', distance.toFixed(1), 'battleState:', battleState, 'playerZ:', player.mesh.position.z.toFixed(1))
  
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
      }
      scoreEl.style.color = '#ffff00'
    }
  }
  
  const playerZ = player.mesh.position.z
  
  // Trigger end zone
  if (!endZoneTriggered && distance >= END_ZONE_DISTANCE) {
    console.log('[EndZone] Player reached end zone!')
    endZoneTriggered = true
    inEndZone = true
    battleState = 'slowing'
    battleTimer = 0
    
    const difficulty = Math.min(1.5, 1 + (score / 2000))
    enemyCrowd.spawn(difficulty, playerZ)
    
    speed = speed * 0.3
    
    // Clear gates AND obstacles
    gateSpawner.clearAll()
    levelSpawner.clearAll()
    
    // Start camera transition to battle view (3 seconds = lerp 0.02)
    cameraTargetY = 10  // Higher to see enemies
    cameraTargetZ = 18  // Further back
    cameraTransitioning = true
    
    scoreEl.style.color = '#ff0000'
    console.log('[EndZone] Enemy count:', enemyCrowd.getCount())
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
        
        if (bossTextSprite) {
          bossTextSprite.visible = (Math.floor(battleTimer / 10) % 2 === 0)
        }
        
        if (battleTimer >= 90) {
          speed = 0
          battleState = 'waiting'
          battleTimer = 0
          
          if (!bossTextSprite) {
            bossTextSprite = createTextSprite('BOSS', '#ff0000', 3)
            bossTextSprite.position.set(0, 4, playerZ - 5)
            scene.add(bossTextSprite)
          }
        }
        
        // Show battle status in center (for browser)
        battleStatusOverlay.innerHTML = `👥 ${myCount} vs 💀 ${enemyCount}`
        battleStatusOverlay.style.display = 'block'
        battleStatusOverlay.style.color = '#ffff00'
        
        scoreEl.textContent = `⚔️ BOSS戰! 👥${myCount} vs 💀${enemyCount} (減速中...)`
        break
        
      case 'waiting':
        // Show battle instruction at bottom center
        battleOverlay.textContent = `⚔️ 向上掃 / 按↑ 開始戰鬥!`
        battleOverlay.style.display = 'block'
        
        // Show battle status in center
        battleStatusOverlay.innerHTML = `👥 ${myCount} vs 💀 ${enemyCount}`
        battleStatusOverlay.style.display = 'block'
        battleStatusOverlay.style.color = '#ffffff'
        
        if (bossTextSprite) {
          if (battleTimer < 120) {
            bossTextSprite.visible = (Math.floor(battleTimer / 10) % 2 === 0)
          } else {
            bossTextSprite.visible = false
          }
        }
        
        battleTimer++
        scoreEl.textContent = ``
        break
        
      case 'charging':
        // Hide overlays
        battleOverlay.style.display = 'none'
        battleStatusOverlay.style.display = 'none'
        
        battleTimer++
        
        // SLOW charge animation: 2 seconds to meet (120 frames)
        const chargeProgress = Math.min(1, battleTimer / 120)
        const enemyZ = enemyCrowd.getEnemyZoneZ()
        
        // Enemies move toward player, but STOP at player position (don't pass!)
        const minEnemyZ = playerZ + 2
        const enemyMoveZ = enemyZ - (enemyZ - minEnemyZ) * chargeProgress
        
        // Crowd moves toward enemies - keep updating every frame!
        const crowdMoveZ = playerZ + (enemyZ - playerZ) * chargeProgress * 0.5
        
        // Apply positions - keep setting every frame so they move continuously
        crowdManager.setCustomZ(crowdMoveZ)
        enemyCrowd.setCustomZ(enemyMoveZ)
        
        enemyCrowd.update(Date.now() * 0.001)
        
        scoreEl.textContent = `⚔️ 衝啊! 👥${myCount} vs 💀${enemyCount}`
        
        if (battleTimer >= 120) {
          battleState = 'battling'
          battleTimer = 0
        }
        break
        
      case 'battling':
        battleOverlay.style.display = 'none'
        
        speed = 0
        battleTimer++
        
        enemyCrowd.update(Date.now() * 0.001)
        
        if (battleTimer % 30 === 0 && myCount > 0 && enemyCount > 0) {
          crowdManager.rebuild(Math.max(0, myCount - 1))
          enemyCrowd.eliminateOne()
          
          const newMyCount = crowdManager.getRemainingCount()
          const newEnemyCount = enemyCrowd.getCount()
          
          console.log('[Battle] Clash! My:', newMyCount, 'Enemy:', newEnemyCount)
          
          // Show updated counts in center
          battleStatusOverlay.innerHTML = `👥 ${newMyCount} vs 💀 ${newEnemyCount}`
          battleStatusOverlay.style.display = 'block'
          
          scoreEl.textContent = `⚔️ 決戰! 👥${newMyCount} vs 💀${newEnemyCount}`
          
          if (newMyCount <= 0) {
            battleState = 'ended'
            finalResult = 'lose'
            // Don't set gameOver yet - wait for player input
            battleStatusOverlay.style.display = 'none'
            
            resultTextSprite = createTextSprite('LOSS', '#ff0000', 3)
            resultTextSprite.position.set(0, 3, playerZ)
            scene.add(resultTextSprite)
            
            scoreEl.innerHTML = `💀 敗北!<br>敵人: ${newEnemyCount}<br><small>Tab/Click to restart</small>`
          } else if (newEnemyCount <= 0) {
            battleState = 'ended'
            finalResult = 'win'
            // Don't set gameWon yet - wait for player input
            battleStatusOverlay.style.display = 'none'
            
            resultTextSprite = createTextSprite('WIN', '#00ff00', 3)
            resultTextSprite.position.set(0, 3, playerZ)
            scene.add(resultTextSprite)
            
            scoreEl.innerHTML = `🎉 勝利!<br>剩餘: ${newMyCount}<br>Score: ${score}<br><small>Tab/Click to continue</small>`
          }
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
    const targetZ = player.mesh.position.z + cameraTargetZ
    const targetY = cameraTargetY
    camera.position.z += (targetZ - camera.position.z) * cameraLerp
    camera.position.y += (targetY - camera.position.y) * cameraLerp
    camera.lookAt(0, 2, player.mesh.position.z)
    
    // Stop transitioning when close enough
    if (Math.abs(camera.position.y - cameraTargetY) < 0.1 && Math.abs(camera.position.z - (player.mesh.position.z + cameraTargetZ)) < 0.5) {
      cameraTransitioning = false
    }
  } else {
    // Normal gameplay
    camera.position.z = player.mesh.position.z + 10
    camera.position.y = 5
    camera.lookAt(0, 0, player.mesh.position.z)
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
