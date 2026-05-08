# Emoji Crowd Runner — 進度記錄

## 📍 當前進度

- **當前日**：Day 7（進行中）
- **開始日期**：2026-03-16
- **今日任務**：Reward + GameState（復活機制 / x2 金幣 / 廣告預留位置）
- **遊戲網址**：https://emoji-crowd-runner.vercel.app

## ✅ 已完成

- [x] Day 1：Vite + Three.js 基本場景
  - 購物車角色（三線道控制）
  - Sunset gradient background
  - 無盡道路 + 黃色虛線
  - 藍色 barrier、Camera 靜止、60 FPS mobile
- [x] Day 2：LevelSpawner + 碰撞
  - 障礙物（紅/黃/紫）、金幣、碰撞檢測
  - 撞到由 Game Over 改為減速
- [x] Day 3：Emoji Crowd（InstancedMesh → 改 Mesh）
  - InstancedMesh 改為普通 Mesh（可見性問題）
  - Continuous 左右移動（velocity + friction）
  - 手機 Touch 控制完善（preventDefault + passive:false）
  - 速度由 0.15 調至 0.018，Crowd 由 5 個增至 15 個
- [x] Day 4：數學門 Gate 系統
  - Gate 類型：+5、×2、-10（後 finetune 為 +3）
  - Camera 手機自適配（FOV 90/75）
  - 道路擴闊 12→16 units
  - 修復門重疊、門與障礙物太近問題
  - Gate 文字顯示（黑底彩字 70px）
  - Crowd 新成員加入動畫（彈跳效果）
- [x] Day 5：敵人群 + 終點戰 + Synthwave UI
  - 修復戰鬥人數顯示錯誤（spawnZ 被覆蓋問題）
  - 修復 Renderer Canvas 重複（附加到 body → .game-container）
  - 修復重複 Click 監聽器（統一 handleRestart()）
  - 加入 Resize 保護（resizeInitialized flag）
  - Synthwave UI 主題（Caveat + Quicksand 字體，Neon Cyan/Pink）
- [x] Day 6：8-Wave Battle System + 統一 HUD
  - 8 波敵人系統（每波遞增 30→100）
  - 移除命制，紫色障礙物 = 直接 Game Over
  - 統一 HUD Bar（👥 | 🪙 | km）
  - Wave 過渡（Crowd/Gate/Enemy 正確重置）
  - Camera fix（Battle 時跟隨 player z 位置）
- [ ] Day 7：Reward + GameState ← **當前**
- [ ] Day 8：特效升級（shader）
- [ ] Day 9：粒子 + 音效
- [ ] Day 10：美術 Asset
- [ ] Day 11：Embed + Mobile
- [ ] Day 12：Polish + Deploy

## 📝 最新工作記錄

> （由 AI agent 在每次工作後追加）

- 2026-03-24：補完 Day 1–6 記錄，建立 AI agent 記憶架構
- 2026-05-08：Codex 接手主線，從 `main` 開 `agent/codex-day7-plus`，完成第一輪 hardening checkpoint：debug 快捷鍵限 dev、移除任意 click/touch reload、防止 restart 保留 saved progress、修正 touch container 座標、減少 production console log。
- 2026-05-08：驗證 `npm run build` 通過；in-app browser dev 測試 `runGameTests` 5/5 passed；production preview 無 app console log，普通畫面 click 不會 reload。
---
