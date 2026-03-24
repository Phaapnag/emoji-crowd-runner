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
  currentWave: number // Day 7: Current wave saved
  savedDistance: number // Day 7: Distance saved for continue
  crowdCount: number // Day 7: Crowd count saved for continue
}

export class GameState {
  // State
  private _coins: number = 0
  private _lives: number = 1
  private _hasRevived: boolean = false
  private _runCoins: number = 0
  private _totalCoins: number = 0
  // Day 7: Wave progress
  private _currentWave: number = 1
  private _savedDistance: number = 0
  private _crowdCount: number = 50

  // Constants
  readonly REVIVE_COST = 50
  readonly MAX_LIVES = 1 // Currently no lives system, instant game over

  // Callbacks for UI updates
  private onCoinsChange: ((coins: number) => void) | null = null
  private onLivesChange: ((lives: number) => void) | null = null

  constructor() {
    // Defensive: Check if localStorage is available
    this.ensureLocalStorageAvailable()
    // Load total coins from localStorage
    this.loadTotalCoins()
    // Day 7: Load wave progress
    this.loadWaveProgress()
  }

  // Check if localStorage is available
  private ensureLocalStorageAvailable(): void {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
    } catch (e) {
      console.warn('[GameState] localStorage not available, game will work without persistence')
      // Mark as unavailable by setting a flag
      this._totalCoins = 0
    }
  }

  // Check if localStorage works
  private get isLocalStorageAvailable(): boolean {
    try {
      const test = '__test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  // Day 7: Save wave progress
  saveWaveProgress(wave: number, distance: number, crowd: number): void {
    this._currentWave = wave
    this._savedDistance = distance
    this._crowdCount = crowd
    this.saveToLocalStorage()
  }

  // Day 7: Check if there's saved progress
  hasSavedProgress(): boolean {
    return this._savedDistance > 0
  }

  // Day 7: Clear saved progress (when starting new game)
  clearSavedProgress(): void {
    this._currentWave = 1
    this._savedDistance = 0
    this._crowdCount = 50
    this.removeFromLocalStorage()
  }

  private loadWaveProgress(): void {
    if (!this.isLocalStorageAvailable) return
    try {
      const saved = localStorage.getItem('emojiRunner_waveProgress')
      if (saved) {
        const data = JSON.parse(saved)
        this._currentWave = data.currentWave || 1
        this._savedDistance = data.savedDistance || 0
        this._crowdCount = data.crowdCount || 50
      }
    } catch (e) {
      console.warn('[GameState] Could not load wave progress from localStorage')
    }
  }

  private saveToLocalStorage(): void {
    if (!this.isLocalStorageAvailable) return
    try {
      const data = {
        currentWave: this._currentWave,
        savedDistance: this._savedDistance,
        crowdCount: this._crowdCount,
        totalCoins: this._totalCoins
      }
      localStorage.setItem('emojiRunner_waveProgress', JSON.stringify(data))
    } catch (e) {
      console.warn('[GameState] Could not save to localStorage')
    }
  }

  private removeFromLocalStorage(): void {
    if (!this.isLocalStorageAvailable) return
    try {
      localStorage.removeItem('emojiRunner_waveProgress')
    } catch (e) {
      console.warn('[GameState] Could not remove from localStorage')
    }
  }

  // Getters
  get coins(): number { return this._coins }
  get lives(): number { return this._lives }
  get hasRevived(): boolean { return this._hasRevived }
  get runCoins(): number { return this._runCoins }
  get totalCoins(): number { return this._totalCoins }
  // Day 7: Wave getters
  get currentWave(): number { return this._currentWave }
  get savedDistance(): number { return this._savedDistance }
  get crowdCount(): number { return this._crowdCount }

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
  reset(clearProgress: boolean = false): void {
    this._coins = 0
    this._lives = 1
    this._hasRevived = false
    this._runCoins = 0
    if (this.onCoinsChange) this.onCoinsChange(0)
    if (this.onLivesChange) this.onLivesChange(1)
    
    // Day 7: Clear wave progress if starting new game
    if (clearProgress) {
      this._currentWave = 1
      this._savedDistance = 0
      this._crowdCount = 50
      this.removeFromLocalStorage()
    }
  }

  // LocalStorage persistence
  private loadTotalCoins(): void {
    if (!this.isLocalStorageAvailable) return
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
    if (!this.isLocalStorageAvailable) return
    try {
      localStorage.setItem('emojiRunner_totalCoins', String(this._totalCoins))
    } catch (e) {
      console.warn('[GameState] Could not save totalCoins to localStorage')
    }
  }
}
