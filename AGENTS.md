# APEX 工作指引

- 使用繁體中文。
- 正式副本為 GHProjects/apex-formula，origin 必須是 https://github.com/harrylin0312/apex-formula.git。
- 開工先讀上層 GHProjects/AGENTS.md，確認分支、upstream、工作目錄與遠端狀態；保留使用者既有修改，不要強制推送。
- 先讀 REVIEW_HANDOFF.md 與 PHYSICS_REPORT.md，特別注意高速打滑尚未修正。
- dist/ 是可部署的原始程式，不是可以刪除後重建的暫存輸出。這個專案沒有 npm 建置步驟。
- 核心物理在 dist/core.js；畫面、鏡頭、輸入與比賽流程在 dist/game.js。
- 檢查：node --check dist/core.js、node --check dist/game.js、node tests/physics.test.mjs。
- 原有 18 項測試沒有證明高速手感正確。修改高速模型時應先加入能重現症狀的測試，並檢查四輪力上限、能量、輪速、下壓力、輸入轉角與復位行為。
- 玩家與 AI 應共用物理模型。不可用直接指定車速／偏航或無限抓地力掩蓋問題。
- 車載座艙與車鼻鏡頭必須固定於車身；油門與煞車維持線性 0–100% 指令；四輪持續獨立取樣路面與載重。
- 物理參數或結果變動後，同步更新 PHYSICS_REPORT.md、dist/physics-report.html 與 dist/physics-results.json。清楚分開模型測試與實車校準。
- GitHub Pages 使用 gh-pages 分支根目錄，其內容由 main 的 dist/ 透過 git subtree split 產生。獲准發布後執行 sh scripts/publish-pages.sh；不要手動修改 gh-pages，也不要強制覆蓋遠端。
- .openai/hosting.json 是既有 Sites 的歷史發布識別，無登入憑證。GitHub Pages 發布不使用它；不可宣稱兩個網站自動同步。

- 車模為 CarlosCG31 的 Formula F226（CC BY 4.0）；來源與授權見 ASSET_CREDITS.md，保留遊戲內的作者標示。dist/assets/formula-f226.glb、來源指紋與所需解碼器皆為可發布素材。
- 變更車模或載入流程後，執行 node tests/car-model.test.mjs；不要處置仍被其他車輛共用的模板幾何。
