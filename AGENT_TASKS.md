# Agent Task Board

用嚟協調多個 AI agent（例如 Perplexity / Kawai）同人類協作嘅任務黑板。

## 🔒 進行中（唔好動呢啲檔案）

> 開始一個任務前，必須：
> 1. 讀 AGENT_CONTEXT.md
> 2. 讀 PROGRESS.md、DEBUG_LOG.md
> 3. 喺呢個表度「認領」任務（填上自己名同相關檔案）

| Agent        | 任務描述                | 相關檔案                         | 開始時間       |
|-------------|-------------------------|----------------------------------|----------------|
| _空_        | _等待認領_              |                                  |                |

## ✅ 建議任務池（待認領）

- [ ] Gate 分佈邏輯微調（避免太易爆人數、加多啲有趣選擇）
- [ ] Day 7 Reward + GameState 邏輯安全性檢查（避免死循環 / 負金幣）
- [ ] Mobile touch sensitivity 再微調（大屏手機測試）

## 📋 協作規則

1. **永遠唔好直接改 `main`**：
   - Perplexity 用 `agent/perplexity` branch
   - Kawai 用 `agent/kawai` branch
2. 開始任務前：
   - 更新呢份 `AGENT_TASKS.md`，寫明自己要改邊啲檔案
3. 完成任務後：
   - 喺 `PROGRESS.md` 記錄完成狀態
   - 如有 bug / 坑，寫入 `DEBUG_LOG.md`
   - 開 Pull Request 從自己 branch → `main`，由 Papa review 之後先 merge
