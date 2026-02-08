# Animation System Quick Reference

## TL;DR - Create a Sign in 30 Seconds

```javascript
const SIGN_TEMPLATES = {
  sign_mynewsign: {
    base: 'BELLY',                              // Pick one: BELLY, CHEST, HEAD_LEVEL, FORWARD
    hands: { right: HAND.FLAT, left: HAND.POINT },  // Pick hand shapes
    rightArmMotion: ['oscillate', { freq: 2, ampY: 0.15 }],
    micro: { head: ['hold'] },
  },
};

// Done! Auto-registered via registerTemplates()
```

---

## Motion Types Cheat Sheet

| Motion | Use Case | Params |
|--------|----------|--------|
| `hold` | Static | (none) |
| `oscillate` | Wave, sway | `freq`, `ampX`, `ampY`, `ampZ` |
| `push` | Give/push | `freq`, `forwardAmp`, `downAmp` |
| `cut` | Sweep side | `freq`, `sideAmp` |
| `circle` | Circle motion | `freq`, `radius` |
| `tap` | Quick pulse | `freq`, `ampX`, `ampY`, `ampZ` |
| `pointDown` | Wobble point | `freq`, `wobbleAmp` |

---

## Base Poses Cheat Sheet

```javascript
BELLY        // Arms at rest, hands near body
CHEST        // Arms at chest, slightly bent
HEAD_LEVEL   // Arms at head height, pointing forward
FORWARD      // Neutral, ready position
```

---

## Hand Shapes Quick Ref

```
FLAT, POINT, FIST, C_SHAPE, THUMBS_UP, 
PINCH, CLAW, HOOK, OPEN_SPREAD, THREE_FINGERS, 
FOUR_FINGERS, ILY, RELAXED
```

---

## Common Patterns

### Static Pose
```javascript
sign_static: {
  base: 'BELLY',
  hands: { right: HAND.FLAT },
  micro: { head: ['hold'] },
}
```

### Wave Motion
```javascript
sign_wave: {
  base: 'BELLY',
  hands: { right: HAND.OPEN_SPREAD },
  rightArmMotion: ['oscillate', { freq: 2.5, ampY: 0.2 }],
}
```

### Dual Hands
```javascript
sign_dual: {
  base: 'CHEST',
  hands: { right: HAND.FLAT, left: HAND.FLAT },
  rightArmMotion: ['oscillate', { freq: 2, ampY: 0.2 }],
  leftArmMotion: ['oscillate', { freq: 2, ampY: 0.2, phase: Math.PI }],
}
```

### Circle Motion
```javascript
sign_circle: {
  base: 'CHEST',
  hands: { right: HAND.POINT },
  rightHandMotion: ['circle', { freq: 3, radius: 0.2 }],
}
```

### Multi-Beat (Steps)
```javascript
sign_beats: {
  steps: [
    { at: 0.0, poseOverrides: { rightArm: [-0.5, 0, 0] } },
    { at: 0.5, poseOverrides: { rightArm: [-0.3, 0.2, 0] } },
    { at: 1.0, poseOverrides: { rightArm: [-0.5, 0, 0] } },
  ],
  hands: { right: HAND.FLAT },
}
```

### Hand Layering (Offset)
```javascript
sign_stacked: {
  base: 'BELLY',
  hands: { right: HAND.FLAT, left: HAND.FLAT },
  rightArmMotion: ['oscillate', { freq: 2, ampX: 0.1 }],
  offsets: {
    rightArm: { z: -0.1 },  // Forward
    leftArm: { z: 0.1 },    // Back
  },
}
```

### With Head Movement
```javascript
sign_head: {
  base: 'BELLY',
  hands: { right: HAND.FLAT },
  rightArmMotion: ['oscillate', { freq: 2, ampY: 0.15 }],
  micro: {
    head: ['oscillate', { freq: 1.5, ampY: 0.1 }],
    spine2: ['oscillate', { freq: 1, ampX: 0.03 }],
  },
}
```

---

## Parameter Reference

### Oscillate
```javascript
['oscillate', {
  freq: 2,        // Cycles per second
  ampX: 0.1,      // X amplitude
  ampY: 0,        // Y amplitude
  ampZ: 0,        // Z amplitude
  phase: 0,       // Phase offset (radians)
}]
```

### Push
```javascript
['push', {
  freq: 2,        // Frequency
  forwardAmp: 0.15,  // Z amplitude
  downAmp: 0.1,      // X amplitude
  phase: 0,          // Phase offset
}]
```

### Circle
```javascript
['circle', {
  freq: 2,        // Revolutions per second
  radius: 0.15,   // Circle radius
  phase: 0,       // Phase offset
}]
```

### Tap
```javascript
['tap', {
  freq: 5,        // Taps per second
  ampX: 0.1,      // X amplitude when active
  ampY: 0,        // Y amplitude when active
  ampZ: 0,        // Z amplitude when active
  threshold: 0,   // Sine wave threshold
}]
```

---

## Common Frequencies (Hz)

```
0.5  - Very slow, deliberate
1.0  - Slow, careful motion
1.5  - Medium-slow pacing
2.0  - Natural speed (most signs)
3.0  - Fast, energetic
4.0+ - Very fast, flickering
```

---

## Common Amplitudes

```
0.05  - Subtle (micro movements)
0.1   - Soft (gentle motion)
0.15  - Standard (typical arm movement)
0.2   - Great (full arm movement)
0.3+  - Extreme (large gestures)
```

---

## Phase Offset Examples

```javascript
// Two hands in sync
['oscillate', { freq: 2, ampY: 0.2 }]
['oscillate', { freq: 2, ampY: 0.2 }]

// Two hands opposite
['oscillate', { freq: 2, ampY: 0.2 }]
['oscillate', { freq: 2, ampY: 0.2, phase: Math.PI }]  // ← opposite

// Two hands with delay
['oscillate', { freq: 2, ampY: 0.2 }]
['oscillate', { freq: 2, ampY: 0.2, phase: Math.PI / 2 }]  // ← 90° delay
```

---

## Offset Axis Reference

```
X:  Vertical (negative = up, positive = down)
Y:  Forward/back (negative = back, positive = forward)
Z:  Side (negative = left, positive = right)
```

---

## Debugging

### Check a Pose
```javascript
console.log(SIGN_POSES['sign_mytest'](0.5));
// Output: { rightArm: [...], leftArm: [...], ... }
```

### Check a Motion
```javascript
console.log(MOTIONS.oscillate(0.5, { freq: 2, ampX: 0.1 }));
// Output: [x, y, z]
```

### List All Signs
```javascript
console.log(Object.keys(SIGN_POSES).sort());
```

---

## Performance Notes

- Each template is compiled **once** at startup via `registerTemplates()`
- Motion primitives are **pure functions** (no state)
- Finger shapes are **pre-computed** (no interpolation)
- **Clamping is automatic** (no manual range checks)

---

## Limitations & Future Work

- Steps use **linear + smoothstep** easing (cubic easing planned)
- Hand shape animations **not yet supported** (finger motion coming)
- No **collision detection** (hands can intersect body)
- **Blinking** and **mouth movement** not yet implemented

---

## Support

Refer to:
- `ANIMATION_SYSTEM.md` - Full documentation
- `MEDICAL_SIGNS_MIGRATION.md` - Migration examples
- `AvatarModel.jsx` - Source code (BASE_POSES, MOTIONS, createSignFromTemplate)

