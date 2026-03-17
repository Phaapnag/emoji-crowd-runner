import * as THREE from 'three'

export type ObstacleType = 'red' | 'purple'

export interface GameObject {
  mesh: THREE.Mesh
  type: 'obstacle' | 'coin'
  obstacleType?: ObstacleType
  active: boolean
}

export class LevelSpawner {
  private scene: THREE.Scene
  private obstacles: GameObject[] = []
  private coins: GameObject[] = []
  private lastSpawnZ = -20
  private spawnInterval = 25  // Increased to avoid gates
  private lanes = [-2, 0, 2]

  constructor(scene: THREE.Scene) {
    this.scene = scene
    // Pre-create objects
    this.createObstacles()
    this.createCoins()
  }

  private createObstacles() {
    // Red = slow down, Purple = lose life
    for (let i = 0; i < 30; i++) {
      // 50% red, 50% purple
      const isRed = Math.random() < 0.5
      const obstacleType: ObstacleType = isRed ? 'red' : 'purple'
      
      let geo: THREE.BufferGeometry
      let mat: THREE.Material
      
      if (isRed) {
        geo = new THREE.BoxGeometry(1, 1.5, 1)
        mat = new THREE.MeshStandardMaterial({ 
          color: 0xff6b6b,  // Red
          roughness: 0.5,
          metalness: 0.2
        })
      } else {
        geo = new THREE.CylinderGeometry(0.5, 0.5, 1.5)
        mat = new THREE.MeshStandardMaterial({ 
          color: 0x5f27cd,  // Purple
          roughness: 0.5,
          metalness: 0.2
        })
      }
      
      const mesh = new THREE.Mesh(geo, mat)
      mesh.visible = false
      mesh.castShadow = true
      this.scene.add(mesh)
      
      this.obstacles.push({
        mesh,
        type: 'obstacle',
        obstacleType,
        active: false
      })
    }
  }

  private createCoins() {
    const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16)
    const coinMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    })
    
    for (let i = 0; i < 50; i++) {
      const mesh = new THREE.Mesh(coinGeo, coinMat)
      mesh.rotation.x = Math.PI / 2
      mesh.visible = false
      this.scene.add(mesh)
      
      this.coins.push({
        mesh,
        type: 'coin',
        active: false
      })
    }
  }

  spawnObjects(playerZ: number) {
    // Spawn new objects ahead of player
    while (this.lastSpawnZ > playerZ - 100) {
      this.lastSpawnZ -= this.spawnInterval
      
      // Randomly choose lane
      const lane = this.lanes[Math.floor(Math.random() * 3)]
      
      // 60% chance obstacle, 40% chance coins
      if (Math.random() < 0.6) {
        this.spawnObstacle(lane)
      } else {
        this.spawnCoin(lane)
      }
    }
  }

  private spawnObstacle(lane: number) {
    const obstacle = this.obstacles.find(o => !o.active)
    if (obstacle) {
      obstacle.mesh.position.set(lane, 0.75, this.lastSpawnZ)
      obstacle.mesh.visible = true
      obstacle.active = true
    }
  }

  private spawnCoin(lane: number) {
    // Spawn 3 coins in a row
    for (let i = 0; i < 3; i++) {
      const coin = this.coins.find(c => !c.active)
      if (coin) {
        coin.mesh.position.set(lane, 1, this.lastSpawnZ - i * 2)
        coin.mesh.visible = true
        coin.active = true
      }
    }
  }

  checkCollisions(playerMesh: THREE.Group, crowdPositions?: THREE.Vector3[]): { 
    hitRed: boolean, 
    hitPurple: boolean,
    collectedCoins: number,
    hitObstacle: boolean,
    crowdHits: number[]  // Indices of crowd members that hit obstacles
  } {
    let hitRed = false
    let hitPurple = false
    let collectedCoins = 0
    let hitObstacle = false
    const crowdHits: number[] = []
    
    const playerCenter = playerMesh.position
    
    // Check obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.active) {
        // Tighten player collision distance too
        const dist = playerCenter.distanceTo(obstacle.mesh.position)
        if (dist < 1.2) {
          if (obstacle.obstacleType === 'red') {
            hitRed = true
          } else {
            hitPurple = true
          }
        }
        
        // Check crowd collision with this specific obstacle
        // Only check non-null positions
        if (crowdPositions && crowdPositions.length > 0) {
          for (let i = 0; i < crowdPositions.length; i++) {
            if (crowdPositions[i]) {
              const crowdDist = crowdPositions[i].distanceTo(obstacle.mesh.position)
              // TIGHTEN distance - only 0.8 units (much stricter)
              if (crowdDist < 0.8 && !crowdHits.includes(i)) {
                hitObstacle = true
                crowdHits.push(i)
              }
            }
          }
        }
      }
    }
    
    // Check coins
    for (const coin of this.coins) {
      if (coin.active) {
        const dist = playerCenter.distanceTo(coin.mesh.position)
        if (dist < 1.2) {
          coin.active = false
          coin.mesh.visible = false
          collectedCoins++
        }
      }
    }
    
    return { hitRed, hitPurple, collectedCoins, hitObstacle, crowdHits }
  }
  
  // Check if a Z position is too close to any obstacle (for gate spawning)
  isTooCloseToObstacle(z: number): boolean {
    const minDistance = 12  // Minimum distance from obstacles
    
    for (const obstacle of this.obstacles) {
      if (obstacle.active) {
        const dist = Math.abs(obstacle.mesh.position.z - z)
        if (dist < minDistance) {
          return true  // Too close!
        }
      }
    }
    return false  // Safe to spawn gate here
  }
  
  update(playerZ: number) {
    // Spawn new objects
    this.spawnObjects(playerZ)
    
    // Recycle objects that are behind player
    for (const obstacle of this.obstacles) {
      if (obstacle.active && obstacle.mesh.position.z > playerZ + 20) {
        obstacle.active = false
        obstacle.mesh.visible = false
      }
    }
    
    for (const coin of this.coins) {
      if (coin.active && coin.mesh.position.z > playerZ + 20) {
        coin.active = false
        coin.mesh.visible = false
      }
    }
    
    // Rotate coins
    const time = Date.now() * 0.003
    for (const coin of this.coins) {
      if (coin.active) {
        coin.mesh.rotation.z = time
      }
    }
  }
  
  // Get active obstacle positions for crowd collision
  getActiveObstacles(): { position: THREE.Vector3 }[] {
    return this.obstacles
      .filter(o => o.active)
      .map(o => ({ position: o.mesh.position.clone() }))
  }
  
  // Clear all obstacles and coins (for end zone)
  clearAll() {
    for (const obs of this.obstacles) {
      obs.active = false
      obs.mesh.visible = false
    }
    for (const coin of this.coins) {
      coin.active = false
      coin.mesh.visible = false
    }
  }
}
