# Emoji Crowd Runner — Agent Context

> 📌 你是 **Emoji Crowd Runner coding agent**。請根據自己所屬 branch 扮演對應角色。

---

## 👥 角色 / Branch 設定

- `main`：穩定版本，對外公開遊玩，**唔好直接喺呢條 branch 開工**。
- `agent/kawai`：**主線開發** agent。
  - 任務：跟住 `PLAN.md` 由 Day 7 → Day 12，負責核心功能（Reward、粒子、音效、Asset、Embed、Deploy）。
- `agent/perplexity`：**Enhancement / 架構 / UI** agent。
  - 任務：Gate 分佈邏輯、UI/UX、美術調整、效能優化、協作架構。

開工前，你需要知道自己係邊個：
- 如果你係 Kawai 喺 OpenWork 入面開工 → 用 `agent/kawai` branch。
- 如果你係 Perplexity 呢邊嘅 AI → 用 `agent/perplexity` branch。

---

## 🔍 每次開始工作前（必做）

1. 讀 `PLAN.md`：了解 12 日整體目標、tech stack、視覺方向。
2. 讀 `PROGRESS.md`：確認當前係第幾日、今日任務、已完成事項。
3. 讀 `DEBUG_LOG.md`：搜尋有無與當日任務相關的已知問題，避免重複踩坑。
4. 讀 `days/day{N}.md`（N = 當前日）：了解今日的完整任務 prompt 與需求。

> 💡 **唔再強制用 AGENT_TASKS 認領任務**：
> - Kawai：專心跟住 `PLAN.md` 行主線就得。
> - Perplexity：如果要做較大改動（例如 Gate 邏輯重構），先口頭同 Papa 傾好，再自行更新 `AGENT_TASKS.md`（可選）。

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
- **部署**: Vercel（main＝production，其他 branch＝preview）
- **Agent 工具**: OpenWork, Perplexity

## 📁 關鍵檔案位置

```
src/
  main.ts           # 主入口，game loop
  Player.ts         # 玩家控制
  RoadSpawner.ts    # Endless road
  CrowdManager.ts   # Emoji crowd
  Gate.ts           # 數學門
  GateSpawner.ts    # Gate 生成
  EnemyCrowd.ts     # 敵人群
  UIManager.ts      # HUD + 提示
  GameState.ts      # 分數、金幣、生命 / Reward
  PostProcessManager.ts  # shader 特效
  ParticleManager.ts     # 粒子系統（Day 9）
  AudioManager.ts        # 音效（Day 9）
  AssetLoader.ts         # 材質/紋理（Day 10）
  MaterialManager.ts     # PBR 材質（Day 10）
```

---

## ⚠️ 開發守則

- 保持 60 FPS（mobile）：避免在 game loop 中 new 物件。
- 使用 InstancedMesh / 簡化 geometry 處理大量重複 mesh。
- 加新功能前先搜尋 `DEBUG_LOG.md` 有無相關已知問題。
- 唔好重複綁定 event listener（resize、touch、keydown）。
- Three.js 物件使用後記得呼叫 `dispose()`。
- 如需大改結構（特別係 `main.ts`），盡量與 Papa 溝通後先開始。
