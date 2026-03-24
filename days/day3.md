# Day 3 — Emoji Crowd (InstancedMesh)

你是 Emoji Crowd Runner coding agent。

## 任務
加 Emoji Crowd（InstancedMesh）

## 需求
- 在 player 後面生成一群小 emoji 公仔
- 最少 10 個 follower，排成 2～3 行隊形
- 跟住 player 移動（左右跟隨、略為散開）
- 用 InstancedMesh 提高效能
- 每個 follower 用簡單 geometry（細綠色 box 或簡單 emoji 形）

## 注意
開始工作前，貼入 `Player.ts` / `main.ts` / road / levelSpawner 相關部分。

## 生成檔案
- `src/CrowdManager.ts`（新增）
- `src/main.ts`（更新 main loop 加入 crowd 跟隨）

## ⚠️ 效能要求
- 保持 mobile 60 FPS
- InstancedMesh 更新後必須設 `instanceMatrix.needsUpdate = true`
