# 車模與第三方素材來源

## Formula F226

- 原作者：**CarlosCG31** — https://sketchfab.com/CarlosCG31
- 原作：**Formula F226** — https://sketchfab.com/3d-models/formula-f226-a4dd03155ab64a6a9b7c677af189c1a1
- 授權：**Creative Commons Attribution 4.0 International (CC BY 4.0)** — https://creativecommons.org/licenses/by/4.0/
- 原作者公開 Sketchfab API 確認可下載，標示 CC Attribution 及商業使用可。
- 本專案使用的網頁優化版本由 **BadCodesGG / interactive-f1** 提供： https://github.com/BadCodesGG/interactive-f1
- 該版本將零件分組、以塗裝替換原材質並使用 Meshopt 壓縮；其 NOTICE 與 credits.ts 將此車模標示為 CC BY 4.0，並保留 CarlosCG31 原作者與原作連結。
- 本專案下載的 GLB 含 73,052 個三角面、529,804 bytes；詳細來源版本、路徑與 SHA-256 位於 `dist/assets/formula-f226.provenance.json`。
- APEX 的調整：執行時轉換座標與比例、對齊四輪物理接地點、合併可共用幾何、加入自有 APEX 配色／投影貼花／材質、獨立輪速與轉角動畫，以及通用車手。
- 未使用 BadCodes 名稱、標誌、字樣貼圖或其塗裝程式。APEX 圖案與車號為本專案生成。

本車模的開放授權獨立於專案程式碼授權。原作與優化來源作者不代表認可本遊戲。此為通用概念車模，並非真實車隊 CAD、官方 F1 車輛或精確工程規格。

## Three.js 載入工具

遊戲、GLTFLoader、BufferGeometryUtils 與 DecalGeometry 使用 Three.js r170，授權為 MIT；本地相對匯入路徑已調整。授權全文位於 `dist/vendor/THREE-LICENSE.txt`。

Meshopt decoder 隨 Three.js r170 發布，來源為 meshoptimizer，MIT 授權；全文位於 `dist/vendor/MESHOPT-LICENSE.txt`。
