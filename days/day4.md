# Day 4 — 數學門 Gate 系統

你是 Emoji Crowd Runner coding agent，chapeng-studio theme。

## 任務
加入 Emoji 數學門（Gate）系統，改變 crowd 人數。

## 前提條件
- Player 左右流暢移動（keyboard + touch）
- Endless road + 障礙 + coin
- CrowdManager：在 player 後面跟隨（約 10–20 個）

## Gate 類型（3 種）
| 類型 | 效果 |
|------|------|
| 🛒 +3 | 人數 +3 |
| ✨ ×2 | 人數 ×2（currentCount ≤ 15）或 +10（> 15），上限 30 |
| 💣 -10 | 人數 -10，最少 1 |

## 視覺效果
- RingGeometry 圓環放在跑道上
- 圓環上顯示對應 emoji 和文字
- Gate 持續沿 Y 軸旋轉

## Gate 出現頻率（已 finetune）
- 每個 segment 40% 機率生成一組門
- 一組最多 2 個 gate
- Gate X 位置：`[-4, -2, 0, +2, +4]`
- 類型機率：+門 50%，×門 20%，−門 30%

## 生成檔案
- `src/Gate.ts`（新增）
- `src/GateSpawner.ts`（新增）
- `src/main.ts`（更新）

## ⚠️ 注意
- 障礙與 gate 的 Z 差距至少 5–8 units
- newCount clamp 在 [1, 30]
