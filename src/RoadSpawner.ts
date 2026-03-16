import * as THREE from 'three'

export class RoadSpawner {
  private scene: THREE.Scene
  private laneMarkers: THREE.Mesh[] = []
  private barrierL: THREE.Mesh
  private barrierR: THREE.Mesh
  private ground: THREE.Mesh

  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Wider ground for gates at [-4, -2, 0, 2, 4]
    const groundGeo = new THREE.PlaneGeometry(16, 1000)
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x374151,
      roughness: 0.8,
      metalness: 0.1
    })
    this.ground = new THREE.Mesh(groundGeo, groundMat)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.receiveShadow = true
    this.scene.add(this.ground)
    
    // Create lane markers
    this.createLaneMarkers()
    
    // Create barriers - wider for gates
    const barrierGeo = new THREE.BoxGeometry(0.3, 0.5, 10000)
    const barrierMat = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.2
    })
    
    // Barriers at -6 and +6 to accommodate gates at -4 to +4
    this.barrierL = new THREE.Mesh(barrierGeo, barrierMat)
    this.barrierL.position.set(-6, 0.25, -5000)
    this.scene.add(this.barrierL)
    
    this.barrierR = new THREE.Mesh(barrierGeo, barrierMat.clone())
    this.barrierR.position.set(6, 0.25, -5000)
    this.scene.add(this.barrierR)
  }

  private createLaneMarkers() {
    const markerGeo = new THREE.PlaneGeometry(0.15, 4)
    const markerMat = new THREE.MeshBasicMaterial({ 
      color: 0xfacc15,
      side: THREE.DoubleSide
    })
    
    // Create lots of markers that loop
    for (let i = 0; i < 400; i++) {
      const markerL = new THREE.Mesh(markerGeo, markerMat)
      markerL.rotation.x = -Math.PI / 2
      markerL.position.set(-1, 0.02, -i * 5)
      this.scene.add(markerL)
      this.laneMarkers.push(markerL)
      
      const markerR = new THREE.Mesh(markerGeo, markerMat.clone())
      markerR.rotation.x = -Math.PI / 2
      markerR.position.set(1, 0.02, -i * 5)
      this.scene.add(markerR)
      this.laneMarkers.push(markerR)
    }
  }

  update(playerZ: number) {
    // Ground follows player
    this.ground.position.z = playerZ - 400
    
    // Loop lane markers - when they pass behind camera, move them far ahead
    this.laneMarkers.forEach(marker => {
      if (marker.position.z > playerZ + 20) {
        marker.position.z -= 2000
      }
    })
  }
}
