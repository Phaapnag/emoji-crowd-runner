# Day 12 — 最終打磨 + Deploy

你是 Emoji Crowd Runner coding agent。

## 任務
Day 12 最終 Polish + Deploy

## 效能保證
- 60 FPS guarantee（LOD + culling）
- WebGL 2 fallback

## Analytics（Local Only）
```typescript
// LocalStorage 記錄
最高分、勝率、平均人數
// Leaderboard（local only）
```

## Deploy
- Vercel production build
- chapeng-studio embed code

## Easter Egg 🥚
- 連勝 5 次：特殊 emoji skin 解鎖
- 完美通關：隱藏模式觸發

## 生成檔案
- Final polish（效能優化）
- `embed.html`（chapeng-studio 用）
- `src/Analytics.ts`（新增）

## ✅ 最終 Checklist
- [ ] 60 FPS on mobile
- [ ] 所有 dispose() 呼叫
- [ ] No memory leak
- [ ] PWA manifest 正確
- [ ] Vercel build 成功
- [ ] embed.html 測試通過
