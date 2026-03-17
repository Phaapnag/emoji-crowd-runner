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
const END_ZONE_DISTANCE = 900  // Trigger end zone when distance >= 900
let inEndZone = false
let endZoneTriggered = false

// Battle states: 'none' | 'slowing' | 'waiting' | 'charging' | 'battling' | 'ended'
let battleState: 'none' | 'slowing' | 'waiting' | 'charging' | 'battling' | 'ended' = 'none'
let battleTimer = 0  // Timer for various battle phases
let chargePosition = 0  // For charging animation
let finalResult: 'win' | 'lose' | null = null

// 3D Text sprites
let bossTextSprite: THREE.Mesh | null = null
let resultTextSprite: THREE.Mesh | null = null

// UI elements
const scoreEl = document.getElementById('score')!

// Input handling - continuous movement
let inputLeft = false
let inputRight = false

document.addEventListener('keydown', (e) => {
  if (gameOver || gameWon) {
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

// Click to restart / continue
document.addEventListener('click', () => {
  if (battleState === 'ended' && finalResult) {
    // Player tapped to continue after battle
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
    // Player tapped to continue after battle
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
  // Check for swipe up gesture
  const deltaY = touchStartY - e.touches[0].clientY
  const deltaX = Math.abs(touchStartX - e.touches[0].clientX)
  
  // If swiped up more than 50px - start battle from waiting state
  if (deltaY > 50 && deltaX < 30) {
    if (battleState === 'waiting') {
      console.log('[Touch] Swipe up - Starting charge!')
      battleState = 'charging'
      battleTimer = 0
      // Remove boss text
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

// Window resize with automatic camera adjustment
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

// Helper: Create 3D text sprite
function createTextSprite(text: string, color: string, size: number = 3): THREE.Mesh {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 512
  canvas.height = 256
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
  
  // Text
  ctx.font = `bold ${size * 40}px Arial`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide
  })
  const geometry = new THREE.PlaneGeometry(8, 4)
  const mesh = new THREE.Mesh(geometry, material)
  
  return mesh
}

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  
  // Debug log
  console.log('[Game] distance:', distance.toFixed(1), 'battleState:', battleState, 'playerZ:', player.mesh.position.z.toFixed(1))
  
  if (gameOver || gameWon) {
    // Still render but stop updates
    enemyCrowd.update(Date.now() * 0.001)
    crowdManager.update(player.mesh.position.x, player.mesh.position.z, Date.now() * 0.001)
    
    // Rotate result text
    if (resultTextSprite) {
      resultTextSprite.rotation.y += 0.02
    }
    
    renderer.render(scene, camera)
    return
  }
  
  // ===== BATTLE ENDED STATE =====
  if (battleState === 'ended') {
    // Rotate result text until player taps
    if (resultTextSprite) {
      resultTextSprite.rotation.y += 0.02
    }
    
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
  
  // ===== END ZONE LOGIC =====
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
    
    // Start slowing down
    speed = speed * 0.3
    
    gateSpawner.clearAll()
    
    // Show BOSS text (will be created below)
    scoreEl.style.color = '#ff0000'
    console.log('[EndZone] Enemy count:', enemyCrowd.getCount())
  }
  
  // ===== BATTLE STATE MACHINE =====
  if (inEndZone) {
    const myCount = crowdManager.getRemainingCount()
    const enemyCount = enemyCrowd.getCount()
    
    switch (battleState) {
      case 'slowing':
        // Slowing down for 1.5 seconds (90 frames at 60fps)
        battleTimer++
        
        // Show BOSS text flashing
        if (bossTextSprite) {
          bossTextSprite.visible = (Math.floor(battleTimer / 10) % 2 === 0)
        }
        
        if (battleTimer >= 90) {  // 1.5 seconds
          // Stop completely!
          speed = 0
          battleState = 'waiting'
          battleTimer = 0
          
          // Create BOSS text if not exists
          if (!bossTextSprite) {
            bossTextSprite = createTextSprite('BOSS', '#ff0000', 4)
            bossTextSprite.position.set(0, 4, playerZ - 5)
            scene.add(bossTextSprite)
          }
        }
        
        scoreEl.textContent = `⚔️ BOSS戰! 👥${myCount} vs 💀${enemyCount} (減速中...)`
        break
        
      case 'waiting':
        // Stopped, waiting for player to swipe up
        if (bossTextSprite) {
          // Flash for 2 seconds then hide
          if (battleTimer < 120) {  // 2 seconds
            bossTextSprite.visible = (Math.floor(battleTimer / 10) % 2 === 0)
          } else {
            bossTextSprite.visible = false
          }
        }
        
        battleTimer++
        scoreEl.textContent = `⚔️ 向上掃開始戰鬥! 👥${myCount} vs 💀${enemyCount}`
        break
        
      case 'charging':
        // Both sides charge toward each other!
        battleTimer++
        
        // Charging animation: 1 second to meet in middle
        const chargeProgress = Math.min(1, battleTimer / 60)  // 1 second charge
        chargePosition = playerZ + (enemyCrowd.getEnemyZoneZ() - playerZ) * chargeProgress
        
        // Move crowd forward
        crowdManager.setCustomZ(playerZ + (enemyCrowd.getEnemyZoneZ() - playerZ) * chargeProgress * 0.4)
        
        // Move enemies backward (toward player)
        enemyCrowd.setCustomZ(enemyCrowd.getEnemyZoneZ() - (enemyCrowd.getEnemyZoneZ() - playerZ) * chargeProgress * 0.4)
        
        enemyCrowd.update(Date.now() * 0.001)
        
        scoreEl.textContent = `⚔️ 衝啊! 👥${myCount} vs 💀${enemyCount}`
        
        if (battleTimer >= 60) {  // 1 second charge
          battleState = 'battling'
          battleTimer = 0
        }
        break
        
      case 'battling':
        // Battle in progress - clash and eliminate
        speed = 0
        battleTimer++
        
        enemyCrowd.update(Date.now() * 0.001)
        
        // Clash every few frames
        if (battleTimer % 30 === 0 && myCount > 0 && enemyCount > 0) {
          crowdManager.rebuild(Math.max(0, myCount - 1))
          enemyCrowd.eliminateOne()
          
          const newMyCount = crowdManager.getRemainingCount()
          const newEnemyCount = enemyCrowd.getCount()
          
          console.log('[Battle] Clash! My:', newMyCount, 'Enemy:', newEnemyCount)
          
          scoreEl.textContent = `⚔️ 決戰! 👥${newMyCount} vs 💀${newEnemyCount}`
          
          if (newMyCount <= 0) {
            // Defeat!
            battleState = 'ended'
            finalResult = 'lose'
            gameOver = true
            
            // Show LOSS text
            resultTextSprite = createTextSprite('LOSS', '#ff0000', 5)
            resultTextSprite.position.set(0, 3, playerZ)
            scene.add(resultTextSprite)
            
            scoreEl.innerHTML = `💀 敗北!<br>敵人: ${newEnemyCount}<br><small>Tap to restart</small>`
          } else if (newEnemyCount <= 0) {
            // Victory!
            battleState = 'ended'
            finalResult = 'win'
            gameWon = true
            
            // Show WIN text
            resultTextSprite = createTextSprite('WIN', '#00ff00', 5)
            resultTextSprite.position.set(0, 3, playerZ)
            scene.add(resultTextSprite)
            
            scoreEl.innerHTML = `🎉 勝利!<br>剩餘: ${newMyCount}<br>Score: ${score}<br><small>Tap to continue</small>`
          }
        }
        break
    }
  }
  
  // Stop spawning in end zone
  if (inEndZone) {
    // Don't spawn new obstacles/gates
  }
  
  // Apply gate effect
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
  
  // Recover speed (not in end zone)
  if (speedRecoveryTimer > 0 && !inEndZone) {
    speedRecoveryTimer--
    if (speedRecoveryTimer === 0) {
      speed = 0.28
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
  
  // Score
  distance += speed
  score = Math.floor(distance) + coins * 10
  
  // Debug info (only show when not in battle states)
  const crowdCount = crowdManager.getRemainingCount()
  if (battleState === 'none') {
    let debugInfo = `👥 ${crowdCount} | 🛒 ${score} 🪙 ${coins} ❤️ ${lives} | D:${Math.floor(distance)}`
    scoreEl.textContent = debugInfo
  }
  
  renderer.render(scene, camera)
}

animate()
