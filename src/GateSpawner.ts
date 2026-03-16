import * as THREE from 'three'
import { Gate, GateType, GateData } from './Gate'

export class GateSpawner {
  private scene: THREE.Scene
  private gates: GateData[] = []
  private lastSpawnZ = -30  // Start spawning from here
  private lastGateZ = -999  // Track last gate position (for collision)
  private lastTriggeredZ = -999  // Track last gate we triggered (for spawning)
  private gateEffects: Map<number, string> = new Map()
  private obstacleSpawner: any = null
  private initialSpawned = false  // Track if initial spawn done
  private lastPlayerZ = 0  // Track player Z to calculate distance traveled
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initGates()
  }
  
  setObstacleSpawner(obstacleSpawner: any) {
    this.obstacleSpawner = obstacleSpawner
  }
  
  private initGates() {
    for (let i = 0; i < 30; i++) {
      const gateType = Gate.types[i % 3]
      const mesh = Gate.createGateMesh(gateType, '')
      mesh.visible = false
      this.scene.add(mesh)
      
      this.gates.push({
        mesh,
        type: gateType,
        x: 0,
        z: 0,
        active: false,
        triggered: false
      })
    }
  }
  
  spawnGates(playerZ: number) {
    // Initial spawn: only spawn 3 groups ahead ONCE at start
    if (!this.initialSpawned) {
      console.log('[GateSpawner] Doing initial spawn of 3 groups')
      for (let i = 0; i < 3; i++) {
        this.spawnGateGroup()
      }
      this.initialSpawned = true
      this.lastPlayerZ = playerZ
      console.log('[GateSpawner] Initial spawn done, lastSpawnZ:', this.lastSpawnZ)
      return
    }
    
    // After initial spawn: spawn every 20 units traveled
    // playerZ gets more negative as we go forward, so lastPlayerZ - playerZ is positive
    const distanceTraveled = this.lastPlayerZ - playerZ
    
    console.log('[GateSpawner] distanceTraveled:', distanceTraveled, 'lastPlayerZ:', this.lastPlayerZ, 'playerZ:', playerZ)
    
    if (distanceTraveled >= 20) {
      console.log('[GateSpawner] ✓ Spawning new gate group!')
      this.spawnGateGroup()
      this.lastPlayerZ = playerZ
    } else {
      console.log('[GateSpawner] ✗ Not enough distance yet')
    }
  }
  
  private spawnGateGroup() {
    console.log('[GateSpawner] spawnGateGroup called, lastSpawnZ before:', this.lastSpawnZ)
    
    // Move spawn position further
    this.lastSpawnZ -= 20 // Fixed distance between gates
    
    console.log('[GateSpawner] Spawning at z:', this.lastSpawnZ)
    
    // Check obstacle collision
    if (this.obstacleSpawner && this.obstacleSpawner.isTooCloseToObstacle(this.lastSpawnZ)) {
      console.log('[GateSpawner] Too close to obstacle, skipping')
      // Skip this position, try next
      this.lastSpawnZ -= 10
    }
    
    // Spawn 2 gates
    const leftPositions = [-4, -2]
    const rightPositions = [2, 4]
    const leftX = leftPositions[Math.floor(Math.random() * leftPositions.length)]
    const rightX = rightPositions[Math.floor(Math.random() * rightPositions.length)]
    
    const type1 = Gate.getRandomType()
    const type2 = Gate.getRandomType()
    const effect1 = Gate.generateEffect(type1, 0)
    const effect2 = Gate.generateEffect(type2, 0)
    
    console.log('[GateSpawner] Activating gates at x:', leftX, rightX, 'z:', this.lastSpawnZ)
    
    this.activateGate(leftX, type1, effect1.text, this.lastSpawnZ)
    this.activateGate(rightX, type2, effect2.text, this.lastSpawnZ)
  }
    
    // Spawn 2 gates
    const leftPositions = [-4, -2]
    const rightPositions = [2, 4]
    const leftX = leftPositions[Math.floor(Math.random() * leftPositions.length)]
    const rightX = rightPositions[Math.floor(Math.random() * rightPositions.length)]
    
    const type1 = Gate.getRandomType()
    const type2 = Gate.getRandomType()
    const effect1 = Gate.generateEffect(type1, 0)
    const effect2 = Gate.generateEffect(type2, 0)
    
    this.activateGate(leftX, type1, effect1.text, this.lastSpawnZ)
    this.activateGate(rightX, type2, effect2.text, this.lastSpawnZ)
  }
  
  private activateGate(x: number, type: GateType, effectText: string, z: number) {
    const gate = this.gates.find(g => !g.active)
    if (gate) {
      this.scene.remove(gate.mesh)
      gate.mesh = Gate.createGateMesh(type, effectText)
      gate.mesh.visible = true
      gate.mesh.position.set(x, 0, z)
      this.scene.add(gate.mesh)
      
      gate.type = type
      gate.x = x
      gate.z = z
      gate.active = true
      gate.triggered = false
      this.gateEffects.set(z, effectText)
    }
  }
  
  checkCollision(playerMesh: THREE.Group): GateType | null {
    const playerPos = playerMesh.position
    
    for (const gate of this.gates) {
      if (gate.active && !gate.triggered) {
        const gatePos = new THREE.Vector3(gate.x, 0, gate.z)
        const dist = playerPos.distanceTo(gatePos)
        
        if (dist < 1.8) {
          gate.triggered = true
          gate.mesh.visible = false
          // Update last triggered gate position for spawning next gates
          this.lastTriggeredZ = gate.z
          // Keep lastGateZ for any other logic that might need it
          this.lastGateZ = gate.z
          return gate.type
        }
      }
    }
    
    return null
  }
  
  update(playerZ: number) {
    console.log('[GateSpawner] update called, playerZ:', playerZ)
    this.spawnGates(playerZ)
    
    // Recycle gates behind player
    for (const gate of this.gates) {
      if (gate.active && gate.z > playerZ + 20) {
        console.log('[GateSpawner] Recycling gate at z:', gate.z)
        gate.active = false
        gate.triggered = false
        gate.mesh.visible = false
        this.gateEffects.delete(gate.z)
      }
    }
  }
  
  dispose() {
    for (const gate of this.gates) {
      this.scene.remove(gate.mesh)
    }
  }
}
