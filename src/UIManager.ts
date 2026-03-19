/**
 * UIManager - Handles HUD and status popups
 * 右上永久 HUD + 中間狀態提示
 */

export class UIManager {
  private scene: THREE.Scene
  private container: HTMLElement
  private hudElement: HTMLElement | null = null
  private popupElement: HTMLElement | null = null
  
  // Popup tracking
  private currentPopup: string | null = null
  private popupTimeout: number | null = null
  private lastPopupTime: number = 0
  private popupCooldown: number = 500 // ms between popups
  
  // Reference to crowdManager and game state (will be set on init)
  private crowdManagerRef: any = null
  private playerRef: any = null
  private gameStateRef: any = null
  
  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene
    this.container = container
    this.createHUD()
    this.createPopup()
  }
  
  // Set references to game objects
  setReferences(crowdManager: any, player: any, gameState: any) {
    this.crowdManagerRef = crowdManager
    this.playerRef = player
    this.gameStateRef = gameState
  }
  
  // Create right-top HUD element
  private createHUD() {
    this.hudElement = document.createElement('div')
    this.hudElement.id = 'hud-right'
    this.hudElement.className = 'hud-right'
    this.hudElement.innerHTML = `
      <span class="hud-icon">👥</span> <span id="hud-crowd">0</span>  
      <span class="hud-icon">🪙</span> <span id="hud-coins">0</span>  
      <span class="hud-icon">🏃</span> <span id="hud-distance">0.0</span>km
    `
    this.container.appendChild(this.hudElement)
  }
  
  // Create center popup element
  private createPopup() {
    this.popupElement = document.createElement('div')
    this.popupElement.id = 'status-popup'
    this.popupElement.className = 'status-popup'
    this.popupElement.style.display = 'none'
    this.container.appendChild(this.popupElement)
  }
  
  // Update HUD - call every frame
  update() {
    if (!this.hudElement || !this.crowdManagerRef || !this.playerRef || !this.gameStateRef) return
    
    const crowdCount = this.crowdManagerRef.getRemainingCount()
    const coins = this.gameStateRef.coins
    const distanceKm = (Math.abs(this.playerRef.mesh.position.z) / 100).toFixed(1)
    
    // Update HUD elements
    const hudCrowd = document.getElementById('hud-crowd')
    const hudCoins = document.getElementById('hud-coins')
    const hudDistance = document.getElementById('hud-distance')
    
    if (hudCrowd) hudCrowd.textContent = String(crowdCount)
    if (hudCoins) hudCoins.textContent = String(coins)
    if (hudDistance) hudDistance.textContent = distanceKm
  }
  
  // Show temporary popup - auto hides after 2s
  showPopup(text: string, force: boolean = false) {
    if (!this.popupElement) return
    
    const now = Date.now()
    
    // Cooldown check - prevent spam
    if (!force && now - this.lastPopupTime < this.popupCooldown) {
      return
    }
    
    // If same popup is showing, extend the timer
    if (this.currentPopup === text && this.popupTimeout !== null) {
      clearTimeout(this.popupTimeout)
    } else {
      this.currentPopup = text
      this.popupElement.textContent = text
      this.popupElement.style.display = 'block'
      
      // Reset animation by removing and re-adding class
      this.popupElement.classList.remove('status-popup')
      void this.popupElement.offsetWidth // Trigger reflow
      this.popupElement.classList.add('status-popup')
    }
    
    // Auto hide after 2s
    this.popupTimeout = window.setTimeout(() => {
      if (this.popupElement) {
        this.popupElement.style.display = 'none'
        this.currentPopup = null
      }
    }, 2000)
    
    this.lastPopupTime = now
  }
  
  // Convenience methods for different popup types
  showGatePopup(gateType: string, value: number) {
    let text = ''
    switch (gateType) {
      case 'shopping':
        text = `🛒 +${value} 人！`
        break
      case 'sparkle':
        text = `✨ ×${value}！`
        break
      case 'bomb':
        text = `💣 -${value} 人！`
        break
      default:
        text = `🎯 獲得！`
    }
    this.showPopup(text)
  }
  
  showCrowdChange(newCount: number) {
    this.showPopup(`👥 人數變動！`)
  }
  
  showBattleWarning() {
    this.showPopup(`⚔️ 戰鬥即將開始...`, true)
  }
  
  showBossArrival() {
    this.showPopup(`👹 BOSS 來襲！`, true)
  }
  
  // Cleanup
  dispose() {
    if (this.hudElement) {
      this.hudElement.remove()
    }
    if (this.popupElement) {
      this.popupElement.remove()
    }
    if (this.popupTimeout !== null) {
      clearTimeout(this.popupTimeout)
    }
  }
}
