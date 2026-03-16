import * as THREE from 'three'

export type EnemyType = 'bomb' | 'skull' | 'ghost'

export class EnemyCrowd {
  private scene: THREE.Scene
  private meshes: THREE.Mesh[] = []
  private count = 0
  private positions: { x: number, z: number, type: EnemyType, offset: number }[] = []
  private colors: { [key: string]: number } = {
    bomb: 0xef4444,      // Red
    skull: 0x7f1d1d,    // Dark red
    ghost: 0x4a044e     // Purple
  }
  
  // End zone Z position (negative because we go into negative Z)
  private readonly enemyZoneZ = -1100
  private readonly crowdZoneZ = -1050
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }
  
  // Initialize enemy crowd with random count
  spawn(difficulty: number = 1) {
    // Clear existing
    this.clear()
    
    // Random enemy count: 5 to 25, scaled by difficulty
    this.count = Math.floor(5 + Math.random() * 20 * difficulty)
    this.count = Math.min(30, Math.max(5, this.count))
    
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    
    for (let i = 0; i < this.count; i++) {
      const types: EnemyType[] = ['bomb', 'skull', 'ghost']
      const type = types[Math.floor(Math.random() * types.length)]
      
      // Spread out in a line/area ahead of player
      const x = (Math.random() - 0.5) * 12  // -6 to +6 (wider than player lane)
      const z = this.enemyZoneZ + (Math.random() - 0.5) * 10  // Slight variation
      
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
      mesh.position.set(x, 0.15, z)
      mesh.castShadow = false
      
      this.scene.add(mesh)
      this.meshes.push(mesh)
    }
    
    console.log('[EnemyCrowd] Spawned', this.count, 'enemies at z ~', this.enemyZoneZ)
  }
  
  // Get enemy count
  getCount(): number {
    return this.count
  }
  
  // Get enemy zone Z position
  getEnemyZoneZ(): number {
    return this.enemyZoneZ
  }
  
  // Check if player has reached enemy zone (playerZ is negative)
  hasReachedEnemyZone(playerZ: number): boolean {
    return playerZ <= this.crowdZoneZ
  }
  
  // Battle: compare with player crowd
  // Returns: 'win' | 'lose' | 'continue'
  battle(myCount: number): { result: 'win' | 'lose', remainingCount: number } {
    if (this.count === 0) {
      // Already defeated
      return { result: 'win', remainingCount: myCount }
    }
    
    if (myCount >= this.count) {
      // Win! Remaining = myCount - enemyCount
      const remaining = myCount - this.count
      this.clear()
      return { result: 'win', remainingCount: remaining }
    } else {
      // Lose!
      this.clear()
      return { result: 'lose', remainingCount: 0 }
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
      
      mesh.position.y = 0.3 + floatY + bounce
      
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
