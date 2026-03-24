# Day 7 — Reward + GameState

你是 Emoji Crowd Runner coding agent。

## 任務
Day 7 Reward + GameState（未接真廣告，先做機制）

## GameState 結構
```typescript
coins: number
lives: number
hasRevived: boolean

methods:
  addCoins(amount)
  spendCoins(amount): boolean
  canReviveWithCoins(): boolean   // coins >= 50
  revive()                        // 重設 player + crowd（保留半數或全數）
  rewardedRevive()                // 將來接廣告，暫時直接 call revive()
  rewardedDoubleCoins(runCoins)   // 將來接廣告，暫時直接 addCoins(runCoins)
```

## Game Over 畫面
- 如果 `canReviveWithCoins()`：顯示「用 50 金幣復活」
- 永遠顯示：「免費復活（之後變睇廣告）」
- 按「用金幣」：`spendCoins(50)` → `revive()`
- 按「免費」：`rewardedRevive()`

## 通關後畫面
- 顯示今局 runCoins
- 按鈕：「免費 x2 金幣（將來睇廣告）」
- 按下：`rewardedDoubleCoins(runCoins)`

## 生成檔案
- `src/GameState.ts`（新增）
- `src/UIManager.ts`（更新）
- `src/main.ts`（更新）

## ⚠️ 注意
暫時全部邏輯內聯，日後自行接廣告 SDK 代替 `rewardedXXX()`
