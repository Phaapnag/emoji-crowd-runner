# Day 5 — 敵人群 + 終點戰

你是 Emoji Crowd Runner coding agent。

## 任務
加入「敵人群 + 終點戰」玩法，令每局有一個高潮收尾。

## 前提條件
- Player continuous 左右移動（三維）
- Endless road + 障礙 + coin
- Gate 系統：+3 / ×2 / -10，人數範圍 [1, 30]
- CrowdManager：約 1–30 粒，跟隨 player

## 終點條件（End Zone）
- 當 `player.position.z >= 1000`：停止 spawn 障礙和 gate
- 進入「終點戰模式」

## 敵人群（EnemyCrowd）
- 敵人人數：min 5，max 25（可根據難度）
- 固定站在 Z = 1100 區域
- 視覺：紅色，用 💣 形狀，一眼分得出

## 戰鬥邏輯
```
如果 myCount >= enemyCount：
  勝利：剩餘 = myCount - enemyCount
  敵人消失，進入勝利畫面
如果 myCount < enemyCount：
  失敗：Game Over
```

## UI
- 終點戰時顯示：👥 x N vs 💀 x M
- 結果：「勝利！剩餘 N」或「Game Over」

## 生成檔案
- `src/EnemyCrowd.ts`（新增）
- `src/EndZone.ts`（如需要）
- `src/main.ts`（更新：distance 計算、終點戰觸發）
