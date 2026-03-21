/**
 * GameState - Central game state management
 * Day 7: Reward system with coins, lives, and revive mechanics
 */

export interface GameStateData {
  coins: number
  lives: number
  hasRevived: boolean
  runCoins: number // Coins earned in current run
  totalCoins: number // All-time coins (stored in localStorage)
}

export class GameState {
  // State
  private _coins: number = 0
  private _lives: number = 1
  private _hasRevived: boolean = false
  private _runCoins: number = 0
  private _totalCoins: number = 0

  // Constants
  readonly REVIVE_COST = 50
  readonly MAX_LIVES = 1 // Currently no lives system, instant game over

  // Callbacks for UI updates
  private onCoinsChange: ((coins: number) => void) | null = null
  private onLivesChange: ((lives: number) => void) | null = null

  constructor() {
    // Load total coins from localStorage
    this.loadTotalCoins()
  }

  // Getters
  get coins(): number { return this._coins }
  get lives(): number { return this._lives }
  get hasRevived(): boolean { return this._hasRevived }
  get runCoins(): number { return this._runCoins }
  get totalCoins(): number { return this._totalCoins }

  // Setters with callbacks
  set coins(value: number) {
    this._coins = value
    if (this.onCoinsChange) this.onCoinsChange(value)
  }

  set lives(value: number) {
    this._lives = value
    if (this.onLivesChange) this.onLivesChange(value)
  }

  // Event listeners
  setCoinsChangeCallback(callback: (coins: number) => void) {
    this.onCoinsChange = callback
  }

  setLivesChangeCallback(callback: (lives: number) => void) {
    this.onLivesChange = callback
  }

  // Coin management
  addCoins(amount: number): void {
    this._coins += amount
    this._runCoins += amount
    this._totalCoins += amount
    this.saveTotalCoins()
    if (this.onCoinsChange) this.onCoinsChange(this._coins)
  }

  spendCoins(amount: number): boolean {
    if (this._coins < amount) return false
    this._coins -= amount
    if (this.onCoinsChange) this.onCoinsChange(this._coins)
    return true
  }

  // Revive system
  canReviveWithCoins(): boolean {
    return this._coins >= this.REVIVE_COST && !this._hasRevived
  }

  revive(): void {
    this._hasRevived = true
    this._lives = 1
    if (this.onLivesChange) this.onLivesChange(this._lives)
  }

  /**
   * Rewarded Ad callback - for future Ad SDK integration
   * Currently just calls revive() directly
   */
  rewardedRevive(): void {
    // TODO: Replace with actual Ad SDK call
    // Ad SDK would call this after ad completes
    console.log('[GameState] Rewarded revive triggered')
    this.revive()
  }

  /**
   * Rewarded Ad callback - double the run coins
   * For future Ad SDK integration
   * Currently just adds coins directly
   */
  rewardedDoubleCoins(runCoins: number): void {
    // TODO: Replace with actual Ad SDK call
    console.log('[GameState] Rewarded double coins triggered')
    this.addCoins(runCoins)
  }

  // Reset for new game
  reset(): void {
    this._coins = 0
    this._lives = 1
    this._hasRevived = false
    this._runCoins = 0
    if (this.onCoinsChange) this.onCoinsChange(0)
    if (this.onLivesChange) this.onLivesChange(1)
  }

  // LocalStorage persistence
  private loadTotalCoins(): void {
    try {
      const saved = localStorage.getItem('emojiRunner_totalCoins')
      if (saved) {
        this._totalCoins = parseInt(saved, 10) || 0
      }
    } catch (e) {
      console.warn('[GameState] Could not load totalCoins from localStorage')
    }
  }

  private saveTotalCoins(): void {
    try {
      localStorage.setItem('emojiRunner_totalCoins', String(this._totalCoins))
    } catch (e) {
      console.warn('[GameState] Could not save totalCoins to localStorage')
    }
  }
}
