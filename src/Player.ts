import * as THREE from 'three'

export class Player {
  mesh: THREE.Group
  private currentX = 0
  private velocityX = 0
  
  // Continuous movement settings - very slow
  private moveSpeed = 0.018
  private friction = 0.85

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group()
    
    // Main body - green box with 🛒 emoji style
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.5, 0.8)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x4ade80,
      roughness: 0.3,
      metalness: 0.1
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.5
    body.castShadow = true
    this.mesh.add(body)
    
    // Shopping cart handle
    const handleGeo = new THREE.BoxGeometry(0.1, 0.1, 1.2)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x64748b })
    const handle = new THREE.Mesh(handleGeo, handleMat)
    handle.position.set(0, 1.0, -0.5)
    this.mesh.add(handle)
    
    // Cart bars
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2)
    const barMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    for (let i = 0; i < 3; i++) {
      const bar = new THREE.Mesh(barGeo, barMat)
      bar.position.set(-0.4 + i * 0.4, 0.6, -0.3)
      bar.rotation.x = Math.PI / 2
      this.mesh.add(bar)
    }
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b })
    const wheelPositions = [
      [-0.5, 0.2, 0.3],
      [0.5, 0.2, 0.3],
      [-0.5, 0.2, -0.3],
      [0.5, 0.2, -0.3]
    ]
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.position.set(pos[0], pos[1], pos[2])
      wheel.rotation.z = Math.PI / 2
      this.mesh.add(wheel)
    })
    
    // Emoji decoration (simplified as colored spheres)
    const emojiGeo = new THREE.SphereGeometry(0.15, 16, 16)
    const emojiMat1 = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.3 })
    const emoji1 = new THREE.Mesh(emojiGeo, emojiMat1)
    emoji1.position.set(-0.3, 1.8, 0)
    this.mesh.add(emoji1)
    
    scene.add(this.mesh)
  }

  update(inputLeft: boolean, inputRight: boolean, speed: number) {
    // Apply velocity based on input (continuous movement)
    if (inputLeft) {
      this.velocityX -= this.moveSpeed
    }
    if (inputRight) {
      this.velocityX += this.moveSpeed
    }
    
    // Apply friction
    this.velocityX *= this.friction
    
    // Update position
    this.currentX += this.velocityX
    
    // Clamp to road boundaries (road is about -5 to 5 wide now)
    this.currentX = Math.max(-5, Math.min(5, this.currentX))
    
    this.mesh.position.x = this.currentX
    
    // Bounce animation
    this.mesh.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.1
    
    // Move forward
    this.mesh.position.z -= speed
    
    // Tilt based on velocity
    this.mesh.rotation.z = this.velocityX * 0.5
  }
}
