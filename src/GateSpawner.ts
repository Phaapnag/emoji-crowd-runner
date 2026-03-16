import * as THREE from 'three'
import { Gate, GateType, GateData } from './Gate'

export class GateSpawner {
  // Gate spawning system
  private scene: THREE.Scene
  private gates: GateData[] = []
  private lastSpawnZ = -100  // Start spawning from here (farther)
  private lastGateZ = -999  // Track last gate position (for collision)
  private lastTriggeredZ = -999  // Track last gate we triggered (for spawning)
  private gateEffects: Map<number, string> = new Map()
  private obstacleSpawner: any = null
  private initialSpawned = false  // Track if initial spawn done
  private playerZAtLastSpawn = 0  // Track player Z when last spawn happened
  private spawningDisabled = false  // Disable spawning in end zone
  
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
        triggered: false,
        effectValue: 0
      })
    }
  }
  
  spawnGates(playerZ: number) {
    // Don't spawn in end zone
    if (this.spawningDisabled) {
      return
    }
    
    // Initial spawn: only spawn 1 group at start
    if (!this.initialSpawned) {
      console.log('[GateSpawner] Doing initial spawn of 1 group')
      this.spawnGateGroup()
      this.initialSpawned = true
      this.playerZAtLastSpawn = playerZ
      console.log('[GateSpawner] Initial spawn done, currentGateZ:', this.lastSpawnZ)
      return
    }
    
    // After initial spawn: only spawn when player has PASSED the current gate group
    // playerZ gets more negative as we go forward
    // If player has moved past the current gate by 80 units, spawn next
    const distancePastGate = this.playerZAtLastSpawn - playerZ
    
    console.log('[GateSpawner] playerZ:', playerZ, 'playerZAtLastSpawn:', this.playerZAtLastSpawn, 'distancePastGate:', distancePastGate)
    
    if (distancePastGate >= 80) {
      console.log('[GateSpawner] ✓ Spawning new gate group!')
      this.spawnGateGroup()
      this.playerZAtLastSpawn = playerZ
    } else {
      console.log('[GateSpawner] ✗ Has not passed last gate yet')
    }
  }
  
  private spawnGateGroup() {
    console.log('[GateSpawner] spawnGateGroup called, lastSpawnZ before:', this.lastSpawnZ)
    
    // Move spawn position further
    this.lastSpawnZ -= 80 // Fixed distance between gates
    
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
    
    console.log('[GateSpawner] Activating gates at x:', leftX, rightX, 'z:', this.lastSpawnZ, 'effects:', effect1.text, effect2.text)
    
    this.activateGate(leftX, type1, effect1.text, this.lastSpawnZ, effect1.value)
    this.activateGate(rightX, type2, effect2.text, this.lastSpawnZ, effect2.value)
  }
  
  private activateGate(x: number, type: GateType, effectText: string, z: number, effectValue: number) {
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
      gate.effectValue = effectValue
      this.gateEffects.set(z, effectText)
    }
  }
  
  checkCollision(playerMesh: THREE.Group): { type: GateType, value: number } | null {
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
          return { type: gate.type, value: gate.effectValue }
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
  
  // Clear all gates (for end zone)
  clearAll() {
    for (const gate of this.gates) {
      gate.active = false
      gate.triggered = false
      gate.mesh.visible = false
    }
    this.gateEffects.clear()
    this.spawningDisabled = true  // Disable spawning
  }
  
  // Check if there are any active gates
  hasActiveGates(): boolean {
    return this.gates.some(g => g.active)
  }
  
  // Reset spawning for new game
  reset() {
    this.spawningDisabled = false
    this.initialSpawned = false
    this.lastSpawnZ = -100
    this.playerZAtLastSpawn = 0
  }
  
  dispose() {
    for (const gate of this.gates) {
      this.scene.remove(gate.mesh)
    }
  }
}
