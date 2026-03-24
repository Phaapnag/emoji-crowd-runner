# Emoji Crowd Runner — 12日開發計劃

## 🎮 項目總覽
- **名稱**：Emoji 創作工廠衝刺
- **目標**：chapeng-studio 可 embed 的 mini game，emoji 主題 3D crowd runner
- **技術**：Vite + TypeScript + Three.js + emoji geometry
- **美術風格**：可愛 emoji + studio 燈光，60 FPS mobile
- **變現**：睇廣告換 emoji 皮膚／助手

## 🎨 視覺目標
- 5 種 emoji 角色（🛒🦕🛩️💣✨）
- 旋轉閃光 Gate
- 創意粒子 trail
- Studio gradient background

## 📅 12日 Roadmap

| Day | 目標 | 主要輸出 |
|-----|------|----------|
| 1 | Vite + Three.js 基本場景 | main.ts, Player.ts, RoadSpawner.ts |
| 2 | LevelSpawner + 碰撞 | 障礙、coin spawn |
| 3 | Emoji Crowd (InstancedMesh) | CrowdManager.ts |
| 4 | 數學門 Gate 系統 | Gate.ts, GateSpawner.ts |
| 5 | 敵人群 + 終點戰 | EnemyCrowd.ts, EndZone.ts |
| 6 | HUD + 狀態提示 UI | UIManager.ts, ui.css |
| 7 | Reward + GameState | GameState.ts |
| 8 | 特效升級（shader） | PostProcessManager.ts |
| 9 | 粒子 + 音效 | ParticleManager.ts, AudioManager.ts |
| 10 | 美術 Asset | AssetLoader.ts, MaterialManager.ts |
| 11 | Embed + Mobile | React wrapper, PWA |
| 12 | Polish + Deploy | Vercel deploy, embed.html |
