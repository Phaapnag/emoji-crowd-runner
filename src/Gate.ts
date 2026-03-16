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
  
  // Effect descriptions for UI - show actual effect
  static getEffectText(type: GateType): string {
    switch (type) {
      case 'shopping': return '+?'  // Will be set dynamically
      case 'sparkle': return '×?'  // Will be set dynamically
      case 'bomb': return '-?'    // Will be set dynamically
    }
  }
  
  // Generate and return the actual effect for this gate instance
  static generateEffect(type: GateType, currentCount: number): { text: string, value: number } {
    let value: number
    let text: string
    
    switch (type) {
      case 'shopping': // +2 to +5
        value = Math.floor(Math.random() * 4) + 2
        text = '+' + value
        break
      case 'sparkle': // ×1 to ×3
        value = Math.floor(Math.random() * 3) + 1
        text = '×' + value
        break
      case 'bomb': // -5 to -20
        value = Math.floor(Math.random() * 16) + 5
        text = '-' + value
        break
    }
    
    return { text, value }
  }
  
  // Apply effect to crowd count
  // - Red: -5 to -20 (random)
  // - Green: +2 to +5 (random)
  // - Yellow: ×1 to ×3 (random)
  // Max: 50, Min: 0
  static applyEffect(currentCount: number, type: GateType): number {
    let newCount = currentCount
    
    switch (type) {
      case 'shopping': // +2 to +5
        newCount = currentCount + Math.floor(Math.random() * 4) + 2
        break
      case 'sparkle': // ×1 to ×3
        newCount = Math.floor(currentCount * (Math.random() * 2 + 1))
        break
      case 'bomb': // -5 to -20
        newCount = currentCount - (Math.floor(Math.random() * 16) + 5)
        break
    }
    
    // Clamp to [0, 50]
    return Math.max(0, Math.min(50, newCount))
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
  
  // Create a gate mesh with effect text on TOP
  static createGateMesh(type: GateType, effectText: string = ''): THREE.Group {
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
    
    // Gate frame (two pillars)
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
    
    // Top bar
    const topGeo = new THREE.BoxGeometry(3.4, 0.4, 0.8)
    const topPillar = new THREE.Mesh(topGeo, pillarMat)
    topPillar.position.set(0, 3, 0)
    group.add(topPillar)
    
    // Effect text ON TOP of gate (floating above)
    // Use sprite for text - make it more visible with dark background
    if (effectText) {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 128
      const ctx = canvas.getContext('2d')!
      
      // Dark semi-transparent background for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(0, 0, 256, 128)
      
      // Colored border
      const colorHex = '#' + color.toString(16).padStart(6, '0')
      ctx.strokeStyle = colorHex
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, 248, 120)
      
      // White text for maximum contrast
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 80px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(effectText, 128, 68)
      
      const texture = new THREE.CanvasTexture(canvas)
      const spriteMat = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.scale.set(2.5, 1.25, 1)
      sprite.position.set(0, 4.5, 0) // On TOP of the gate (higher up)
      group.add(sprite)
    }
    
    // Emoji on the gate
    const emojiCanvas = document.createElement('canvas')
    emojiCanvas.width = 128
    emojiCanvas.height = 128
    const emojiCtx = emojiCanvas.getContext('2d')!
    emojiCtx.font = '80px Arial'
    emojiCtx.textAlign = 'center'
    emojiCtx.textBaseline = 'middle'
    emojiCtx.fillText(emoji, 64, 64)
    
    const emojiTexture = new THREE.CanvasTexture(emojiCanvas)
    const emojiSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture }))
    emojiSprite.scale.set(1.2, 1.2, 1)
    emojiSprite.position.set(0, 1.5, 0.5)
    group.add(emojiSprite)
    
    return group
  }
}
