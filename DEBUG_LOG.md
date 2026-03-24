# Emoji Crowd Runner — Debug Log

> 每次發現 bug 或解決問題，追加一個 entry。AI 每次開始工作前必讀。

## 格式

```
## [日期] [簡短標題]
**症狀**：（看到咩問題）
**根因**：（點解發生）
**解決**：（點樣修復）
**相關檔案**：（例如 CrowdManager.ts, main.ts）
**Tag**：#threejs #instancedmesh #performance
```

---

## Entries

> （由 AI agent 在解決 bug 後追加，初始為空）

---

## 常見 Three.js 陷阱（預設提醒）

- ⚠️ `InstancedMesh` 更新後必須設 `instanceMatrix.needsUpdate = true`
- ⚠️ `addEventListener` 不要在 game loop 裡重複綁定
- ⚠️ resize listener 只綁定一次，用 `removeEventListener` 清理舊的
- ⚠️ 離開場景時記得呼叫 `renderer.dispose()` 同 `geometry.dispose()`
- ⚠️ Mobile touch 需要 `preventDefault()` + `{ passive: false }`
- ⚠️ `setInterval` / `setTimeout` 必須在 game over 或 destroy 時 `clearInterval`
