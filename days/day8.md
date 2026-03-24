# Day 8 — 特效升級（Shader / Post-Processing）

你是 Emoji Crowd Runner coding agent。

## 任務
Day 8 特效升級（shader）

## 需求

### Crowd Glow Outline
- 用 `EffectComposer` + `OutlinePass`
- 只選 crowd meshes（唔選 road/gate）

### Gate 脈衝動畫
- Ring scale 0.8 → 1.2 → 0.8（2s loop）
- Emissive 閃爍（Neon Cyan）

### Screen Shake
- 撞障礙：`camera.position` 抖動 0.1 units（0.3s）
- 戰鬥：抖動 0.3 units（0.6s）

## 注意
開始工作前，貼入現有 `main.ts` / 相關 code。

## 生成檔案
- `src/PostProcessManager.ts`（新增）
- shader code（如需要）
- `src/main.ts`（更新：整合 PostProcessManager）
