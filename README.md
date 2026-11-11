# APEX — Coastal Grand Prix

Browser-based 3D open-wheel racing game, rendered with bundled Three.js r170 (MIT license in `dist/vendor/THREE-LICENSE.txt`). No build step or external runtime engine download is needed. Optional Google Fonts have local font fallbacks.

Serve `dist/` with an HTTP server. ES modules require HTTP; opening index.html directly is not supported.

## Play

- Grand Prix: eight cars, three laps, three difficulty levels, collision response and finish classification.
- Time attack: unlimited laps and browser-local personal best.
- Chase, cockpit and nose cameras (C).
- Keyboard: WASD/arrows, Space for ERS, R for track recovery, Escape for pause.
- Touch: proportional steering pad plus independently held throttle, brake and ERS. Portrait and landscape layouts.
- Standard gamepad axes and triggers are supported but not hardware-verified.
- Optional automatic throttle, braking/traction assistance and racing line; three liveries; quality selection.

Track recovery holds the player for three seconds while opponents continue. Track departure invalidates time-attack lap times. Recovery preserves race progress. Window blur and hidden tabs pause the race and clear held inputs.

## Implementation

`core.js` contains fixed-120-Hz vehicle dynamics, a resampled 3.66 km spline circuit, bounded track progress, surface-dependent grip, drag/downforce, ERS and collision separation. Handling is tuned for a playable racing game; no claim of validated F1 vehicle data. AI follows a curvature-based speed profile with braking anticipation and lane changes.

`game.js` contains scene geometry, car models, race flow, UI, cameras and synthesized audio. Curbs, fencing, trees, spectators and the racing line use instancing; static car parts are merged by material. Mobile defaults reduce render resolution and disable shadows.

## Verification

Run `node tests/physics.test.mjs` and `node --check dist/game.js`.

Core tests exercise acceleration, stopping, steering, surface limits, recovery, lap wrap, collision separation and two complete laps under closed-loop driving. Safari browser checks cover WebGL rendering, eight-car starts, running race HUD, camera changes, pause and responsive 390×844 / 844×390 layouts. Physical phone performance, multitouch and gamepad input still need device checks.

Original game and assets; no official association with F1, Real Racing 3 or Ala Mobile.
