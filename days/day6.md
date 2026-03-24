# Day 6 — HUD + 狀態提示 UI

你是 Emoji Crowd Runner coding agent。

## 任務
右上永久 HUD + 中間狀態提示（半透明，保持現有 Synthwave 風格）

## 前提條件（唔好改現有左上狀態同戰鬥 UI）
- 左上：狀態文字 + 計時器（保持）
- 戰鬥：👥 vs 💀 中間顯示（保持）

## 新增 UI 元素

### 右上 HUD（永久顯示）
```
👥 18  🪙 839  🏃 1.2km
```
- 👥 = `CrowdManager.count`
- 🪙 = `gameState.coins`
- 🏃 = `Math.floor(player.position.z / 100)` + "km"
- 樣式：90% transparent，Neon Cyan，小字體

### 中間短暫提示（fade in/out 2s）
- 門觸發：「🛒 +3 人！」
- 人數變化：「👥 人數變動！」
- 進入戰鬥：「戰鬥即將開始...」

## CSS 規格
```css
.hud-right {
  position: absolute; top: 20px; right: 20px;
  opacity: 0.9; color: #00f0ff;
  text-shadow: 0 0 5px #00f0ff;
  font-size: 14px; background: rgba(0,0,0,0.3);
  padding: 8px 12px; border-radius: 8px;
}
.status-popup {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  opacity: 0.8; color: #ff2d95;
  font-size: 28px; text-shadow: 0 0 10px #ff2d95;
  animation: fadeInOut 2s ease-in-out;
}
@keyframes fadeInOut {
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.8; transform: scale(1); }
}
```

## 步驟順序
1. Code Reviewer 模式：檢查 console log 重複、event listener 重複、canvas 重複 append、dispose() 呼叫、memory leak
2. 修復問題
3. 實作 UIManager

## 生成檔案
- `src/UIManager.ts`（新增）
- `src/ui.css`（新增）
- `src/main.ts`（更新：整合 UIManager）
