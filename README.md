# APEX — Alpine Grand Prix

[開始遊戲](https://harrylin0312.github.io/apex-formula/) · [物理報告](https://harrylin0312.github.io/apex-formula/physics-report.html) · [審查交接](REVIEW_HANDOFF.md)

**待修問題：高速容易打滑。** 本次先發布現況供檢查，尚未套用高速操控修正；請先讀交接文件與研究重現程式。既有 18 項測試通過，不代表高速手感已驗證。


Buildless WebGL racing game. Serve `dist/` over HTTP; ES modules require an HTTP origin. Three.js r170 is bundled with its MIT license under `dist/vendor/`.

The full Traditional Chinese physics design, parameter and validation report is in `PHYSICS_REPORT.md` and published as `dist/physics-report.html`. Reproducible test data is in `dist/physics-results.json`.

## Controls

- WASD/arrows: steering and linearly ramped pedals. C: chase/cockpit/nose camera. Space: ERS. R: recover. Escape: pause.
- Touch/mouse pedals: bottom-to-top travel maps linearly to 0–100%; release returns to zero. The left steering pad is proportional. Portrait and landscape layouts are supported.
- Standard gamepad triggers accept analog throttle/brake. Hardware verification is outstanding.
- ABS/traction control and automatic throttle are optional and default off.

## Vehicle dynamics

`dist/core.js` implements a planar rigid body with four independent wheel rotational states. Each contact point samples asphalt, curb, grass or gravel independently. Wheel loads include static distribution, aero downforce, longitudinal and lateral quasi-static load transfer and load sensitivity. Wheel slip, slip angle and combined-slip force limits produce acceleration, braking and yaw through force/moment integration. Ackermann front steering, rear drive, individual ABS/TCS intervention and implicit longitudinal wheel-force integration are included.

Player and AI share the same solver. The chassis loop runs at 120 Hz with two tyre substeps (240 Hz). Fixed cockpit/nose views have no follow smoothing, speed FOV change or impact shake. The chase view remains smoothed.

The original 4.062 km / 12-corner Alpine circuit references the stop-and-go character of Red Bull Ring and includes six 18–28 m-radius corners. It does not replicate official surveyed coordinates or elevation.

The model is not calibrated against real F1 tyre data. Suspension vertical dynamics, elevation, tyre temperature/wear, weather, detailed transmission/differential and full collision angular momentum are not implemented. These limitations are explicit in the report.

## Verification

Run:

```sh
node --check dist/game.js
node --check dist/core.js
node tests/physics.test.mjs --save
```

The 21 regression checks cover steering direction, Ackermann, linear controls/torques, split surface, force limits, normal-load conservation, load transfer, wheelspin, ABS, fixed-camera invariance, passive energy dissipation, lap/recovery behavior, collisions, low-speed corner geometry, two complete controller-driven laps and timestep convergence. Browser checks cover startup, analog pedal operation, steering, fixed views, live wheel telemetry and responsive landscape/portrait layouts. Real phones, multitouch performance and physical gamepads remain unverified.

Optional Google Fonts have system-font fallbacks. Original game and assets; no official association with F1, Red Bull Ring, Real Racing 3 or Ala Mobile.

## GitHub Pages publication

The `main` branch contains the complete editable source and tests. The `gh-pages` branch is derived from `main:dist` with `git subtree split`. After committing an authorized update, run `sh scripts/publish-pages.sh`, then check the Pages build status. This does not update the historical Sites deployment.

## Complete 3D car model

The car is now the downloaded **Formula F226** by **CarlosCG31** (CC BY 4.0), using the 73,052-triangle, 529,804-byte web-optimized GLB distributed by BadCodesGG / interactive-f1. Source links, changes and licensing are in [ASSET_CREDITS.md](ASSET_CREDITS.md) and [the in-game credits page](https://harrylin0312.github.io/apex-formula/asset-credits.html).

`dist/car-model.js` loads bundled glTF/Meshopt tools, expands quantized attributes, corrects mirrored winding, shares merged static geometry, aligns four independently animated wheels to physical contacts, applies APEX paint/decals and supplies fixed camera mounts. The physics core and parameters are unchanged. The cockpit eye is fitted to the downloaded model; the vehicle model does not define collision geometry or grip.

Run `node tests/car-model.test.mjs` to check decompression, geometry dimensions, wheel alignment, cockpit sightline and shared resources. Model assets and decoders are self-hosted; play does not require access to Sketchfab, GitHub raw or a model CDN. Physical phone performance remains unverified.

輪胎冒煙特效依各輪接地載重、抓地力使用率及滑動速度獨立觸發；鎖死、空轉與側滑會在對應輪胎接地點產生漸散煙霧。特效測試：`node tests/tyre-smoke.test.mjs`。
