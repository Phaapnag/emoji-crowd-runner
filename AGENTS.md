# AGENTS.md — Emoji Crowd Runner

## 📦 Setup

```bash
npm install
npm run dev      # localhost:5173
npm run build    # 輸出到 dist/
```

TypeScript 嚴格模式。改動後確保 `npm run build` 冇 error。
🌿 Branch 規則
•	`main`：穩定版，唔好直接 push
•	`agent/kawai`：Kawai 主線開發（Day 7 → Day 12）
•	`agent/perplexity`：Enhancement / UI 改進
所有改動透過 PR 合併，由 repo owner review。
📖 詳細 Context
開工前請讀：
•	`AGENT_CONTEXT.md` — 角色分工、開發守則、關鍵檔案
•	`PLAN.md` — 12 日完整計劃
•	`PROGRESS.md` — 當前進度
•	`DEBUG_LOG.md` — 已知 bug
•	`days/dayN.md` — 當日任務（N = 當前日數）
