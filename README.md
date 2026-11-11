# APEX / Formula Lab

Buildless Canvas racing game. Open `dist/index.html`, or serve `dist/` over HTTP.

Controls: WASD / arrow keys, C camera, R recover, Escape pause. Touch supports simultaneous pedals and steering. Responsive portrait and landscape layouts.

Three cameras: chase, cockpit, overhead. Single original 1.59 km closed circuit. Ordered lap gates, invalidation on track departure, local personal best, automatic gears and optional synthesized engine sound.

Physics: 120 Hz fixed timestep planar bicycle model; 798 kg mass, 3.6 m wheelbase, axle slip forces, lateral friction limits, combined rear traction budget, quadratic drag and downforce, reduced grass grip and rolling resistance. Simplified game model, not a validated F1 simulator. No official F1 affiliation.
