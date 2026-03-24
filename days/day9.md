# Day 9 — 粒子系統 + 音效

你是 Emoji Crowd Runner coding agent。

## 任務
Day 9 粒子 + 音效

## Particle System
- **跑步 trail**：player 後方留彩色粒子（10s decay）
- **勝利煙火**：終點爆開多色粒子
- **Crowd rebuild**：新增 emoji 淡入粒子

## AudioManager
| 事件 | 音效 | 時長 |
|------|------|------|
| Gate 觸發 | ding | 0.2s |
| Crowd rebuild | whoosh | 0.5s |
| 勝利 | fanfare | 1s |
| 失敗 | fail horn | 0.8s |

音效來源：從 Freesound 下載，放在 `/public/sounds/`

## 生成檔案
- `src/ParticleManager.ts`（新增）
- `src/AudioManager.ts`（新增）
- `src/main.ts`（更新：整合兩個 manager）
