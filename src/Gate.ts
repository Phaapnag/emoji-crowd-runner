import * as THREE from 'three'

export type GateType = 'shopping' | 'sparkle' | 'bomb'

export interface GateData {
  mesh: THREE.Group
  type: GateType
  x: number
  z: number
  active: boolean
  triggered: boolean
}

export class Gate {
  // Gate X positions: -4, -2, 0, +2, +4 (wider than lanes)
  static readonly positions = [-4, -2, 0, 2, 4]
  
  static readonly types: GateType[] = ['shopping', 'sparkle', 'bomb']
  
  // Effect descriptions for UI
  static getEffectText(type: GateType): string {
    switch (type) {
      case 'shopping': return '+3'
      case 'sparkle': return '×2'
      case 'bomb': return '-10'
    }
  }
  
  // Apply effect to crowd count - balanced for difficulty
  // Max: 30, Min: 1
  static applyEffect(currentCount: number, type: GateType): number {
    let newCount = currentCount
    
    switch (type) {
      case 'shopping': // +3 (was +5)
        newCount = currentCount + 3
        break
      case 'sparkle': // ×2, but if count > 15 then +10 instead
        if (currentCount <= 15) {
          newCount = currentCount * 2
        } else {
          newCount = currentCount + 10
        }
        break
      case 'bomb': // -10 (min 1)
        newCount = currentCount - 10
        break
    }
    
    // Clamp to [1, 30]
    return Math.max(1, Math.min(30, newCount))
  }
  
  // Get random gate type with weighted probability
  // +: 50%, ×: 20%, -: 30%
  static getRandomType(): GateType {
    const r = Math.random()
    if (r < 0.5) {
      return 'shopping'  // 50%
    } else if (r < 0.7) {
      return 'sparkle'   // 20%
    } else {
      return 'bomb'      // 30%
    }
  }
  
  // Create a gate mesh
  static createGateMesh(type: GateType): THREE.Group {
    const group = new THREE.Group()
    
    let color: number
    let emoji: string
    
    switch (type) {
      case 'shopping':
        color = 0x4ade80 // Green
        emoji = '🛒'
        break
      case 'sparkle':
        color = 0xfacc15 // Yellow
        emoji = '✨'
        break
      case 'bomb':
        color = 0xef4444 // Red
        emoji = '💣'
        break
    }
    
    // Gate frame (two pillars) - thicker now
    const pillarGeo = new THREE.BoxGeometry(0.4, 3, 0.8)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3
    })
    
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat)
    leftPillar.position.set(-1.5, 1.5, 0)
    group.add(leftPillar)
    
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat)
    rightPillar.position.set(1.5, 1.5, 0)
    group.add(rightPillar)
    
    // Top bar - thicker
    const topGeo = new THREE.BoxGeometry(3.4, 0.4, 0.8)
    const topPillar = new THREE.Mesh(topGeo, pillarMat)
    topPillar.position.set(0, 3, 0)
    group.add(topPillar)
    
    // Effect text (as a colored box) - thicker
    const textGeo = new THREE.BoxGeometry(1, 0.8, 0.3)
    const textMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5
    })
    const textBox = new THREE.Mesh(textGeo, textMat)
    textBox.position.set(0, 1.5, 0.4)
    group.add(textBox)
    
    return group
  }
}
