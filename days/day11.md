# Day 11 — Embed + Mobile 優化

你是 Emoji Crowd Runner coding agent。

## 任務
Day 11 Embed 準備 + Mobile 優化

## Single Component
```jsx
<EmojiCrowdRunner width="100%" height="100%" />
```
- 自動 resize
- Pause on visibility change（`document.visibilitychange`）

## Mobile 優化
- Touch sensitivity 自適配（螢幕大小）
- Low power mode（減少 particle 數量）
- PWA manifest（可安裝）

## Performance
- FPS counter（DevTools overlay）
- LOD（遠處 crowd 簡化 geometry）

## 生成檔案
- `index.html`（更新）
- React wrapper（如果需要）
- `public/manifest.json`（PWA）
