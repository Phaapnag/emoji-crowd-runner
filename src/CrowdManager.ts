import * as THREE from 'three'

export type EmojiType = 'shopping' | 'dinosaur' | 'plane' | 'bomb' | 'sparkle'

export class CrowdManager {
  private scene: THREE.Scene
  private meshes: THREE.Mesh[] = []
  // Start from 0
  private count = 0
  private emojiTypes: EmojiType[] = ['shopping', 'dinosaur', 'plane', 'bomb', 'sparkle']
  private positions: { x: number, z: number, type: EmojiType, offset: number }[] = []
  private colors: { [key: string]: number } = {
    shopping: 0x4ade80,  // Bright green
    dinosaur: 0x22c55e,  // Green
    plane: 0x3b82f6,    // Blue
    bomb: 0xef4444,      // Red
    sparkle: 0xfacc15   // Yellow
  }
  
  // Maximum crowd size - up to 50
  private maxCrowd = 50
  
  // Track new members that are "running" to join (spawn time)
  private spawnTimes: number[] = []
  
  // Check if a position overlaps with existing crowd members
  private isOverlapping(x: number, z: number): boolean {
    const minDist = 0.4  // Minimum distance between crowd members
    for (const pos of this.positions) {
      const dx = x - pos.x
      const dz = z - pos.z
      if (Math.sqrt(dx * dx + dz * dz) < minDist) {
        return true
      }
    }
    return false
  }

  // Store previous positions for delayed following
  private prevPositions: { x: number, z: number }[] = []
  
  // Initialize with default positions
  private initPrevPositions() {
    this.prevPositions = this.positions.map(pos => ({
      x: pos.x,
      z: 0.6 + pos.z
    }))
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initCrowd()
    this.initPrevPositions()
  }

  private initCrowd() {
    // SMALL but VISIBLE blocks - 0.25 size for Flowers game
    const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
    
    // Initialize positions - MORE SPREAD OUT and IRREGULAR
    for (let i = 0; i < this.count; i++) {
      const type = this.emojiTypes[i % this.emojiTypes.length]
      
      // More compact: tighter X range, much tighter Z spread
      // X: -1.5 to +1.5
      // Z: 0 to 0.8 (very tight)
      const x = (Math.random() - 0.5) * 3  // -1.5 to +1.5
      const z = Math.random() * 0.8  // 0 to 0.8 (very tight)
      
      this.positions.push({
        x,
        z,
        type,
        offset: Math.random() * Math.PI * 2
      })

      // Create individual mesh
      const material = new THREE.MeshStandardMaterial({
        color: this.colors[type],
        roughness: 0.5,
        metalness: 0.2,
        emissive: this.colors[type],
        emissiveIntensity: 0.3
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = false
      
      this.scene.add(mesh)
      this.meshes.push(mesh)
    }
  }

  // Get crowd positions for collision detection (only non-null meshes)
  getCrowdPositions(): THREE.Vector3[] {
    return this.meshes
      .filter(mesh => mesh !== null)
      .map(mesh => mesh.position.clone())
  }

  // Method to eliminate a crowd member (when hit by obstacle)
  eliminateCrowdMember(index: number) {
    if (index >= 0 && index < this.meshes.length && this.meshes[index]) {
      this.scene.remove(this.meshes[index])
      this.meshes[index].geometry.dispose()
      ;(this.meshes[index].material as THREE.Material).dispose()
      this.meshes[index] = null as any
    }
  }
  
  // Eliminate multiple crowd members by indices
  eliminateByIndices(indices: number[]) {
    // Remove from the end first to avoid index shifting issues
    indices.sort((a, b) => b - a)
    
    for (const idx of indices) {
      if (idx >= 0 && idx < this.meshes.length && this.meshes[idx]) {
        this.scene.remove(this.meshes[idx])
        this.meshes[idx].geometry.dispose()
        ;(this.meshes[idx].material as THREE.Material).dispose()
        
        // Remove from array
        this.meshes.splice(idx, 1)
        this.positions.splice(idx, 1)
      }
    }
    
    // Update count
    this.count = this.meshes.length
  }

  // Get count of remaining crowd members
  getRemainingCount(): number {
    return this.meshes.length  // Now that we properly manage the array, just return length
  }
  
  // Rebuild crowd with new count (for gate effects) - ADD new members, don't re-randomize existing
  rebuild(newCount: number) {
    // First, clean up any null entries from array
    this.meshes = this.meshes.filter(m => m !== null)
    
    const currentCount = this.meshes.length
    
    if (newCount > currentCount) {
      // ADD new crowd members
      const toAdd = newCount - currentCount
      const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
      
      for (let i = 0; i < toAdd; i++) {
        const type = this.emojiTypes[Math.floor(Math.random() * this.emojiTypes.length)]
        
        // Target position in the crowd
        let newX: number, newZ: number
        let attempts = 0
        do {
          newX = (Math.random() - 0.5) * 3.5  // -1.75 to +1.75
          newZ = Math.random() * 1.2  // 0 to 1.2
          attempts++
        } while (this.isOverlapping(newX, newZ) && attempts < 20)
        
        // Spawn position: far behind (edge of screen) + random offset to left/right
        const spawnX = newX + (Math.random() - 0.5) * 4  // Spread horizontally
        const spawnZ = newZ + 15  // Start 15 units behind (will "run" forward)
        
        this.positions.push({
          x: newX,
          z: newZ,
          type,
          offset: Math.random() * Math.PI * 2
        })
        
        // Initialize prev position at spawn point (will animate towards target)
        this.prevPositions.push({
          x: spawnX,
          z: spawnZ
        })
        
        // Track spawn time for animation
        this.spawnTimes.push(Date.now())
        
        const material = new THREE.MeshStandardMaterial({
          color: this.colors[type],
          roughness: 0.5,
          metalness: 0.2,
          emissive: this.colors[type],
          emissiveIntensity: 0.3
        })
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = false
        
        // Start mesh at spawn position
        mesh.position.set(spawnX, 0.125, spawnZ)
        
        this.scene.add(mesh)
        this.meshes.push(mesh)
      }
      
      this.count = newCount
    } else if (newCount < currentCount) {
      // REMOVE excess crowd members from the END
      const toRemove = currentCount - newCount
      
      for (let i = 0; i < toRemove; i++) {
        const mesh = this.meshes.pop()
        if (mesh) {
          this.scene.remove(mesh)
          mesh.geometry.dispose()
          ;(mesh.material as THREE.Material).dispose()
        }
        this.positions.pop()
        this.prevPositions.pop()
        this.spawnTimes.pop()
      }
      
      this.count = newCount
    }
  }
  
  // Rebuild from remaining positions (when some hit obstacles)
  rebuildFromPositions(positions: THREE.Vector3[]) {
    // Remove all existing meshes
    this.meshes.forEach(mesh => {
      if (mesh) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    })
    this.meshes = []
    this.positions = []
    this.spawnTimes = []
    
    // Set new count
    this.count = positions.length
    
    // Recreate meshes at remaining positions
    const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
    
    for (let i = 0; i < positions.length; i++) {
      const type = this.emojiTypes[i % this.emojiTypes.length]
      
      this.positions.push({
        x: positions[i].x,
        z: positions[i].z - 0.8, // Offset back to original position
        type,
        offset: Math.random() * Math.PI * 2
      })
      
      const material = new THREE.MeshStandardMaterial({
        color: this.colors[type],
        roughness: 0.5,
        metalness: 0.2,
        emissive: this.colors[type],
        emissiveIntensity: 0.3
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = false
      
      this.scene.add(mesh)
      this.meshes.push(mesh)
    }
  }

  update(playerX: number, playerZ: number, time: number) {
    const total = this.positions.length
    
    for (let i = 0; i < this.positions.length; i++) {
      const mesh = this.meshes[i]
      if (!mesh) continue
      
      const pos = this.positions[i]
      
      // Target position relative to player
      const targetX = playerX + pos.x
      const targetZ = playerZ + 0.6 + pos.z
      
      // Get previous position
      const prev = this.prevPositions[i]
      
      // Check if this is a new member (still far from target = running to join)
      const distFromTarget = Math.abs(prev.z - targetZ)
      const isRunning = distFromTarget > 2
      
      // Slower delay for "running" members, faster for joined
      const delay = isRunning ? 0.03 : 0.12
      
      // Lerp towards target
      const newX = prev.x + (targetX - prev.x) * delay
      const newZ = prev.z + (targetZ - prev.z) * delay
      
      // Update previous position for next frame
      this.prevPositions[i] = { x: newX, z: newZ }
      
      // Floating animation (more bouncing if running)
      const floatY = Math.sin(time * 3 + (pos?.offset || 0)) * 0.1
      
      // More bounce if running
      const bounce = isRunning ? Math.abs(Math.sin(time * 8)) * 0.15 : 0
      
      mesh.position.set(
        newX,
        0.3 + floatY + bounce,  // Low to ground
        newZ
      )
      
      // Tiny scale
      mesh.scale.setScalar(1.0)
      
      // Gentle wobble
      mesh.rotation.y = time * 0.5 + (pos?.offset || 0)
      mesh.rotation.x = time * 0.3
    }
  }

  // Reset crowd positions when game restarts
  reset(playerX: number, playerZ: number) {
    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions[i]
      this.prevPositions[i] = {
        x: playerX + pos.x,
        z: playerZ + 0.6 + pos.z
      }
    }
  }

  dispose() {
    this.meshes.forEach(mesh => {
      if (mesh) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    })
    this.meshes = []
  }
}
