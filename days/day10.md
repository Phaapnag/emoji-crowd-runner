# Day 10 — 美術 Asset

你是 Emoji Crowd Runner coding agent。

## 任務
Day 10 美術 Asset 整合

## Emoji Texture
- 5 張 PNG 放在 `/public/textures/`：
  - `emoji-cart.png`（🛒）
  - `emoji-dino.png`（🦕）
  - `emoji-plane.png`（🛩️）
  - `emoji-bomb.png`（💣）
  - `emoji-spark.png`（✨）
- 應用到對應 crowd geometry

## PBR 環境
- Polyhaven `studio_floor` PBR（diff/normal/rough/ao）
- Gradient skybox（藍紫色調）

## Lighting
- 環境光 + 3 point light（studio 燈光）
- Crowd emissive + bloom

## 生成檔案
- `src/AssetLoader.ts`（新增）
- `src/MaterialManager.ts`（新增）
- `src/main.ts`（更新：整合 AssetLoader + MaterialManager）
