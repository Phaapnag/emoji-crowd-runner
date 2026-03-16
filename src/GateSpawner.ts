import * as THREE from 'three'
import { Gate, GateType, GateData } from './Gate'

export class GateSpawner {
  private scene: THREE.Scene
  private gates: GateData[] = []
  private lastSpawnZ = -30
  private spawnInterval = 50  // Increased to avoid obstacles
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initGates()
  }
  
  private initGates() {
    // Pre-create gate objects
    for (let i = 0; i < 20; i++) {
      const gateType = Gate.types[i % 3]
      const mesh = Gate.createGateMesh(gateType)
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
    // Spawn new gates ahead of player
    while (this.lastSpawnZ > playerZ - 100) {
      this.lastSpawnZ -= this.spawnInterval
      
      // Only 40% chance to spawn gates per segment
      if (Math.random() > 0.4) {
        continue // Skip this segment - no gates
      }
      
      // Spawn 1-2 gates per cycle
      const numGates = Math.random() < 0.6 ? 1 : 2
      
      if (numGates === 1) {
        // Single gate - any position except edges
        const positions = [-2, 0, 2] // Avoid -4 and 4
        const x = positions[Math.floor(Math.random() * positions.length)]
        const type = Gate.getRandomType()
        this.activateGate(x, type)
      } else {
        // Two gates - MUST be far apart (left + right, not adjacent)
        const leftPositions = [-4, -2]
        const rightPositions = [2, 4]
        const leftX = leftPositions[Math.floor(Math.random() * leftPositions.length)]
        const rightX = rightPositions[Math.floor(Math.random() * rightPositions.length)]
        
        const type1 = Gate.getRandomType()
        const type2 = Gate.getRandomType()
        
        this.activateGate(leftX, type1)
        this.activateGate(rightX, type2)
      }
    }
  }
  
  private activateGate(x: number, type: GateType) {
    const gate = this.gates.find(g => !g.active)
    if (gate) {
      // Recreate mesh with correct type
      this.scene.remove(gate.mesh)
      gate.mesh = Gate.createGateMesh(type)
      gate.mesh.visible = true
      gate.mesh.position.set(x, 0, this.lastSpawnZ)
      this.scene.add(gate.mesh)
      
      gate.type = type
      gate.x = x
      gate.z = this.lastSpawnZ
      gate.active = true
      gate.triggered = false
    }
  }
  
  checkCollision(playerMesh: THREE.Group): GateType | null {
    const playerPos = playerMesh.position
    
    for (const gate of this.gates) {
      if (gate.active && !gate.triggered) {
        const gatePos = new THREE.Vector3(gate.x, 0, gate.z)
        const dist = playerPos.distanceTo(gatePos)
        
        if (dist < 1.8) { // Trigger distance - tighter
          gate.triggered = true
          gate.mesh.visible = false
          return gate.type
        }
      }
    }
    
    return null
  }
  
  update(playerZ: number) {
    // Spawn new gates
    this.spawnGates(playerZ)
    
    // Recycle gates behind player
    for (const gate of this.gates) {
      if (gate.active && gate.z > playerZ + 20) {
        gate.active = false
        gate.triggered = false
        gate.mesh.visible = false
      }
    }
  }
  
  dispose() {
    for (const gate of this.gates) {
      this.scene.remove(gate.mesh)
    }
  }
}
