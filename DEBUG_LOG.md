# Emoji Crowd Runner — Debug Log

> 每次發現 bug 或解決問題，追加一個 entry。AI 每次開始工作前必讀。

## 格式

```
## [Day N] [簡短標題]
**症狀**：（看到咩問題）
**根因**：（點解發生）
**解決**：（點樣修復）
**相關檔案**：（例如 CrowdManager.ts, main.ts）
**Tag**：#threejs #instancedmesh #performance
```

---

## Entries

## [Day 3] Crowd 方塊不可見 / 出現一秒消失
**症狀**：用戶睇唔到啲小方塊，出現咗一秒就消失
**根因**：InstancedMesh 尺寸太細，加上 matrix 未正確更新
**解決**：改用普通 Mesh，加大尺寸
**相關檔案**：CrowdManager.ts
**Tag**：#threejs #instancedmesh #visibility

---

## [Day 3] 手機 Touch 控制方向錯亂
**症狀**：手指郁動時方向唔更新；加中間區域後方向反轉
**根因**：touchstart 只記錄起點，touchmove 未持續更新方向；中間區域邏輯衝突
**解決**：移除中間區域判斷，改用 touchmove delta + preventDefault
**相關檔案**：main.ts / Player.ts
**Tag**：#touch #mobile #input

```typescript
// ✅ 永遠用呢個 template！
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const deltaX = e.touches[0].clientX - touchStartX;
  targetLane = Math.max(-1, Math.min(1, deltaX * 0.01));
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
}, { passive: false });
```

---

## [Day 3] Player 移動速度太快
**症狀**：Player 左右移動太快，難以控制
**根因**：velocity 初始值過高（0.15）
**解決**：逐步調低：0.15 → 0.05 → 0.035 → 0.018（最終減慢約 75%）
**相關檔案**：Player.ts
**Tag**：#gameplay #tuning

---

## [Day 4] Gate 類型機率導致人數過快到上限
**症狀**：門出現得太密，人數好快去到上限 15
**根因**：×2 門出現頻率太高，+5 數值太大
**解決**：調整機率（+門 50%，×門 20%，−門 30%），+5→+3，上限由 15 提高到 30；×門在 count>15 時改為 +10
**相關檔案**：GateSpawner.ts, Gate.ts
**Tag**：#gate #balance #gameplay

---

## [Day 5] 戰鬥人數顯示錯誤
**症狀**：戰鬥時雙方人數顯示不準確
**根因**：`spawnZ` 被 `setCustomZ()` 覆蓋，導致 `getEnemyZoneZ()` 返回錯誤值
**解決**：新增 `initialSpawnZ` 錨點，`setCustomZ()` 只更新 `currentZ`，`getEnemyZoneZ()` 返回 `currentZ`
**相關檔案**：EnemyCrowd.ts
**Tag**：#battle #enemycrowd #bug

```typescript
private spawnZ = -1000
private initialSpawnZ = -1000  // 新增錨點
private currentZ = -1000

setCustomZ(z: number) {
  this.currentZ = z  // ✅ 只更新 currentZ
}
getEnemyZoneZ() {
  return this.currentZ  // ✅ 返回 currentZ
}
```

---

## [Day 5] Renderer Canvas 重複出現
**症狀**：遊戲容器出現兩個 Canvas
**根因**：Renderer 附加到 `document.body` 而非 `.game-container`
**解決**：改為 `gameContainer.appendChild(renderer.domElement)`
**相關檔案**：main.ts
**Tag**：#renderer #canvas #bug

---

## [Day 5] 重新開始畫面縮小（每隔一次）
**症狀**：每隔一次重新開始，畫面會縮小
**根因**：兩個獨立 click 監聽器衝突 + resize 邏輯重複執行
**解決**：統一用 `handleRestart()` 合併所有 click 邏輯；加入 `resizeInitialized` flag 防止重複
**相關檔案**：main.ts
**Tag**：#resize #eventlistener #bug

```typescript
// ✅ 統一 handleRestart
function handleRestart() {
  if (battleState === 'ended') {
    window.location.href = window.location.href
  } else if (gameOver || gameWon) {
    location.reload()
  }
}
document.addEventListener('click', handleRestart)

// ✅ Resize 保護
let resizeInitialized = false
if (!resizeInitialized) {
  resizeInitialized = true
  updateCameraFOV()
}
```

---

## 常見 Three.js 陷阱（預設提醒）

- ⚠️ `InstancedMesh` 更新後必須設 `instanceMatrix.needsUpdate = true`
- ⚠️ `addEventListener` 不要在 game loop 裡重複綁定
- ⚠️ resize listener 只綁定一次，用 `removeEventListener` 清理舊的
- ⚠️ 離開場景時記得呼叫 `renderer.dispose()` 同 `geometry.dispose()`
- ⚠️ Mobile touch 需要 `preventDefault()` + `{ passive: false }`
- ⚠️ `setInterval` / `setTimeout` 必須在 game over 或 destroy 時 `clearInterval`
