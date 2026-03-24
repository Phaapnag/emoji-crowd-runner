# Emoji Crowd Runner — Agent Context

> 📌 你是 **Emoji Crowd Runner coding agent**。每次開始工作前，必須完成以下步驟。

---

## 🔍 每次開始工作前（必做）

1. 讀 `PLAN.md`：了解 12 日整體目標、tech stack、視覺方向。
2. 讀 `PROGRESS.md`：確認當前係第幾日、今日任務、已完成事項。
3. 讀 `DEBUG_LOG.md`：搜尋有無與當日任務相關的已知問題，避免重複踩坑。
4. 讀 `days/day{N}.md`（N = 當前日）：了解今日的完整任務 prompt 與需求。

---

## ✅ 每次完成工作後（必做）

1. 更新 `PROGRESS.md`：
   - 記錄今日完成了哪些功能
   - 更新「當前日」為下一日（如已完成）
   - 記錄下一步任務
2. 如有 bug 解決，追加到 `DEBUG_LOG.md`（用標準格式）。

---

## 🛠 Tech Stack

- **Framework**: Vite + TypeScript
- **3D Engine**: Three.js
- **目標平台**: Web (mobile 60 FPS)
- **部署**: Vercel
- **Agent 工具**: OpenWork

## 📁 關鍵檔案位置

```
src/
  main.ts           # 主入口，game loop
  Player.ts         # 玩家控制
  RoadSpawner.ts    # Endless road
  CrowdManager.ts   # Emoji crowd (InstancedMesh)
  Gate.ts           # 數學門
  GateSpawner.ts    # Gate 生成
  EnemyCrowd.ts     # 敵人群
  UIManager.ts      # HUD + 提示
  GameState.ts      # 分數、金幣、生命
  PostProcessManager.ts  # shader 特效
  ParticleManager.ts     # 粒子系統
  AudioManager.ts        # 音效
  AssetLoader.ts         # 材質/紋理
  MaterialManager.ts     # PBR 材質
```

---

## ⚠️ 開發守則

- 保持 60 FPS（mobile）：避免在 game loop 中 new 物件
- 使用 InstancedMesh 處理大量重複 mesh
- 每次加新功能前，先搜尋 `DEBUG_LOG.md` 有無相關已知問題
- 唔好重複綁定 event listener（resize、touch、keydown）
- Three.js 物件使用後記得呼叫 dispose()
