import * as THREE from 'three'

export type EnemyType = 'bomb' | 'skull' | 'ghost'

export class EnemyCrowd {
  private scene!: THREE.Scene
  private meshes: THREE.Mesh[] = []
  private count = 0
  private positions: { x: number, z: number, type: EnemyType, offset: number }[] = []
  private colors: { [key: string]: number } = {
    bomb: 0xffffff,      // White
    skull: 0xffffff,    // White
    ghost: 0xffffff     // White
  }
  
  // Current spawn position (set when spawning)
  private spawnZ = -1000
  // FIX: Keep initial spawnZ as anchor, use separate variable for current position
  private initialSpawnZ = -1000
  private currentZ = -1000
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }
  
  // Initialize enemy crowd with random count
  // If playerZ provided, spawn relative to player
  spawn(difficulty: number = 1, playerZ: number = 0) {
    // Clear existing
    this.clear()
    
    // Fixed enemy count: 32 for epic battles!
    this.count = 32
    
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)  // Slightly smaller than player crowd (0.25)
    
    // Spawn IN FRONT of player - player moves in negative direction (-50), so in front is NEGATIVE
    // Player is at -50, enemies should spawn at -50 - 15 = -65 (in front of player)
    this.spawnZ = playerZ - 15  // 15 units in front of player
    this.initialSpawnZ = this.spawnZ  // FIX: Keep as anchor!
    this.currentZ = this.spawnZ  // Current position starts at spawn
    console.log('[EnemyCrowd] SPAWN: playerZ:', playerZ, 'spawnZ set to:', this.spawnZ)
    
    // Spread enemies in a wider area (like player crowd)
    for (let i = 0; i < this.count; i++) {
      const types: EnemyType[] = ['bomb', 'skull', 'ghost']
      const type = types[Math.floor(Math.random() * types.length)]
      
      // Spread like player crowd: X: -3 to +3, Z: TIGHTER spread (only 3 units)
      const x = (Math.random() - 0.5) * 6  // -3 to +3
      const z = this.spawnZ + (Math.random() * 3)  // Spread over 3 units only (tighter!)
      
      this.positions.push({
        x,
        z,
        type,
        offset: Math.random() * Math.PI * 2
      })
      
      const material = new THREE.MeshStandardMaterial({
        color: this.colors[type],
        roughness: 0.5,
        metalness: 0.3,
        emissive: this.colors[type],
        emissiveIntensity: 0.4
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, 0.1, z)  // Adjusted for smaller size
      mesh.castShadow = false
      
      this.scene.add(mesh)
      this.meshes.push(mesh)
      console.log('[EnemyCrowd] Added mesh at x:', x.toFixed(1), 'z:', z.toFixed(1))
    }
    
    console.log('[EnemyCrowd] Spawned', this.count, 'enemies at z ~', this.spawnZ, '(playerZ was:', playerZ, 'so spawnZ should be', playerZ + 30, ')')
  }
  
  // Get enemy count
  getCount(): number {
    return this.count
  }
  
  // Get enemy zone Z position - return current position
  getEnemyZoneZ(): number {
    return this.currentZ
  }
  
  // Set custom Z for charging animation - set position directly
  setCustomZ(z: number) {
    // FIX: Use initialSpawnZ as anchor, update currentZ instead of spawnZ
    console.log('[EnemyCrowd] setCustomZ called, z:', z.toFixed(1), 'meshes:', this.meshes.length, 'anchor:', this.initialSpawnZ.toFixed(1))
    
    for (let i = 0; i < this.meshes.length; i++) {
      if (this.meshes[i] && this.positions[i]) {
        // Use initialSpawnZ as anchor for offset calculation!
        const offsetZ = this.positions[i].z - this.initialSpawnZ
        // Set new position based on new Z + offset
        this.meshes[i].position.z = z + offsetZ
        if (i === 0) console.log('  [Enemy] mesh[0] z:', this.meshes[i].position.z.toFixed(1), 'offsetZ:', offsetZ.toFixed(1))
      }
    }
    // FIX: Update currentZ, NOT spawnZ! Keep spawnZ as anchor
    this.currentZ = z
  }
  
  // Check if player has reached enemy zone - require player to actually get close!
  hasReachedEnemyZone(playerZ: number): boolean {
    // Player must be within 5 units of enemy to trigger battle
    return playerZ <= this.spawnZ + 5
  }
  
  // Battle: compare with player crowd
  battle(myCount: number): { result: 'win' | 'lose', remainingCount: number } {
    if (this.count === 0) {
      return { result: 'win', remainingCount: myCount }
    }
    
    if (myCount >= this.count) {
      const remaining = myCount - this.count
      this.clear()
      return { result: 'win', remainingCount: remaining }
    } else {
      this.clear()
      return { result: 'lose', remainingCount: 0 }
    }
  }
  
  // Eliminate one enemy (for battle animation)
  eliminateOne() {
    if (this.count > 0) {
      // Remove last enemy
      const mesh = this.meshes.pop()
      if (mesh) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
      this.positions.pop()
      this.count--
    }
  }
  
  // Update animations
  update(time: number) {
    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i]
      if (!mesh) continue
      
      const pos = this.positions[i]
      
      // Floating + threatening animation
      const floatY = Math.sin(time * 4 + pos.offset) * 0.1
      const bounce = Math.abs(Math.sin(time * 6)) * 0.1
      
      mesh.position.y = 0.1 + floatY + bounce  // Adjusted for smaller size
      
      // Rotation
      mesh.rotation.y = time * 0.5 + pos.offset
      mesh.rotation.x = time * 0.3
    }
  }
  
  // Clear all enemies
  clear() {
    for (const mesh of this.meshes) {
      if (mesh) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    }
    this.meshes = []
    this.positions = []
    this.count = 0
  }
  
  dispose() {
    this.clear()
  }
}
