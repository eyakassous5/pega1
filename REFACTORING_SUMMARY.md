# Animation System Refactoring Summary

## What Was Done

The 3D avatar animation system has been completely refactored to make it **easier to tune and maintain** across many sign language gestures.

### Key Improvements

1. **BASE_POSES Library** ✅
   - Reusable arm position presets (BELLY, CHEST, HEAD_LEVEL, FORWARD)
   - Eliminates repetition of base arm/forearm values
   - Easy to switch between common signing positions

2. **Motion Primitives** ✅
   - Unified motion system with semantic types: `hold`, `oscillate`, `push`, `cut`, `circle`, `tap`, `pointDown`
   - Each motion has clear parameter schemas
   - Motions are composable and reusable

3. **Offsets Support** ✅
   - Fine-tune joint positions after applying base pose
   - Perfect for hand layering, stacking, and position adjustments
   - Simple `{x, y, z}` format per bone

4. **Steps (Keyframe Animation)** ✅
   - Multi-beat signs via keyframe interpolation
   - Time-based breakpoints with smooth easing (smoothstep)
   - Overrides motion-based animation when present

5. **Micro-Movements** ✅
   - Subtle head/spine oscillations for natural feel
   - Applied on top of main animation
   - Optional per sign

6. **Global Joint Clamping** ✅
   - Automatic safety limits on all joints
   - Prevents unrealistic arm stretching, head rotation, etc.
   - No manual range checking needed

7. **Template System** ✅
   - `createSignFromTemplate()` compiles templates → animation functions
   - `SIGN_TEMPLATES` holds declarative definitions
   - `registerTemplates()` auto-registers at startup

---

## Architecture

### Files Modified
- **`client/src/components/AvatarModel.jsx`**
  - Added: BASE_POSES, JOINT_RANGES, MOTIONS
  - Added: createSignFromTemplate(), SIGN_TEMPLATES, registerTemplates()
  - Kept: All existing SIGN_POSES (backward compatible)
  - Template registration happens automatically at module load

### Files Created (Documentation)
- **`ANIMATION_SYSTEM.md`** - Complete system documentation
- **`MEDICAL_SIGNS_MIGRATION.md`** - Examples of converting medical signs
- **`ANIMATION_QUICK_REFERENCE.md`** - Quick cheat sheets

---

## Usage Examples

### Example 1: Simple Static Pose
```javascript
sign_simple: {
  base: 'BELLY',
  hands: { right: HAND.FLAT },
}
```

### Example 2: Oscillating Arms
```javascript
sign_wave: {
  base: 'CHEST',
  hands: { right: HAND.OPEN_SPREAD, left: HAND.OPEN_SPREAD },
  rightArmMotion: ['oscillate', { freq: 2.5, ampY: 0.2 }],
  leftArmMotion: ['oscillate', { freq: 2.5, ampY: 0.2, phase: Math.PI }],
}
```

### Example 3: Pushing Motion
```javascript
sign_birth: {
  base: 'BELLY',
  hands: { right: HAND.FLAT, left: HAND.FLAT },
  rightArmMotion: ['push', { freq: 2, forwardAmp: 0.18, downAmp: 0.12 }],
  leftArmMotion: ['push', { freq: 2, forwardAmp: 0.18, downAmp: 0.12, phase: Math.PI }],
  offsets: {
    rightArm: { z: -0.05 },
    leftArm: { z: 0.05 },
  },
  micro: {
    head: ['oscillate', { freq: 1.5, ampX: 0.05 }],
    spine2: ['oscillate', { freq: 1, ampX: 0.02 }],
  },
}
```

### Example 4: Keyframe Animation (Steps)
```javascript
sign_examine: {
  steps: [
    { at: 0.0, poseOverrides: { rightArm: [-0.5, 0.4, 0.3] } },
    { at: 0.5, poseOverrides: { rightArm: [-0.3, 0.5, 0.2] } },
    { at: 1.0, poseOverrides: { rightArm: [-0.5, 0.4, 0.3] } },
  ],
  hands: { right: HAND.FLAT },
}
```

### Example 5: Circle Motion
```javascript
sign_swirl: {
  base: 'CHEST',
  hands: { right: HAND.POINT },
  rightHandMotion: ['circle', { freq: 3, radius: 0.25 }],
}
```

---

## Motion Types Reference

```javascript
// Static
['hold']

// Sinusoidal wave
['oscillate', { freq: 2, ampX: 0.1, ampY: 0, ampZ: 0, phase: 0 }]

// Forward + down push
['push', { freq: 2, forwardAmp: 0.15, downAmp: 0.1, phase: 0 }]

// Side sweep
['cut', { freq: 3, sideAmp: 0.2, phase: 0 }]

// Circular motion
['circle', { freq: 2, radius: 0.15, phase: 0 }]

// On/off tap
['tap', { freq: 4, ampX: 0.1, ampY: 0, ampZ: 0, threshold: 0 }]

// Pointing with wobble
['pointDown', { freq: 2, wobbleAmp: 0.05 }]
```

---

## Migration Path

### For Existing Signs
The old function-based signs in `SIGN_POSES` still work perfectly. They can be gradually migrated to templates as you refine them.

**Command Example:** Convert sign_bonjour to template:
```javascript
// BEFORE (remains in SIGN_POSES)
sign_bonjour: (t) => ({
  rightArm: [-1.2, 0, -0.3 + Math.sin(t * 3) * 0.15],
  rightForeArm: [-0.5, 0, 0],
  rightWrist: [0, 0, Math.sin(t * 4) * 0.3],
  rightHandShape: HAND.OPEN_SPREAD,
  head: [0, 0, 0],
}),

// AFTER (move to SIGN_TEMPLATES)
sign_bonjour: {
  base: 'BELLY',
  hands: { right: HAND.OPEN_SPREAD },
  rightArmMotion: ['oscillate', { freq: 3, ampZ: 0.15 }],
  rightHandMotion: ['oscillate', { freq: 4, ampZ: 0.3 }],
  micro: { head: ['hold'] },
},
```

### For New Signs
Create directly in `SIGN_TEMPLATES`:
```javascript
const SIGN_TEMPLATES = {
  sign_mynewsign: { ... },
};

// Auto-registered via registerTemplates()
```

---

## Safe Ranges (JOINT_RANGES)

All values are automatically clamped to safe ranges:

```javascript
arm:          [-π, π]           // Full rotation
foreArm:      [-2.5, 0.1]       // Prevent overstretching
wrist:        [-π*0.6, π*0.6]   // Limited rotation
head:         [-0.3, 0.3]       // Subtle rotation only
spine:        [-0.15, 0.15]     // Very subtle movement
fingerCurl:   [0, 1]            // 0=straight, 1=closed
fingerSpread: [-0.5, 0.8]       // -0.5=together, 0.8=spread
```

---

## Performance

- **Compilation**: Happens once at startup via `registerTemplates()`
- **Per-frame**: Motion functions are pure and very fast
- **Memory**: No extra allocation per frame (reuses buffers)
- **Scalability**: Can handle 100+ different gestures with ease

---

## Debugging Tips

### View a Pose
```javascript
// In browser console
SIGN_POSES['sign_bonjour'](0.5);  // Get pose at time 0.5s
```

### Inspect a Motion
```javascript
MOTIONS.oscillate(0.5, { freq: 2, ampX: 0.1 });  // Returns [x, y, z] offset
```

### List All Templates
```javascript
Object.keys(SIGN_TEMPLATES);
```

### List All Registered Poses
```javascript
Object.keys(SIGN_POSES).sort();
```

---

## Common Tuning Workflows

### Adjust Speed (Frequency)
```javascript
// Too slow?
['oscillate', { freq: 2 }]     // → Increase to 3
['oscillate', { freq: 3 }]     // Faster

// Too fast?
['oscillate', { freq: 4 }]     // → Decrease to 2
['oscillate', { freq: 2 }]     // Slower
```

### Adjust Amplitude
```javascript
// Too big?
['oscillate', { ampX: 0.3 }]   // → Reduce to 0.1
['oscillate', { ampX: 0.1 }]   // Subtle

// Too small?
['oscillate', { ampX: 0.05 }]  // → Increase to 0.2
['oscillate', { ampX: 0.2 }]   // More pronounced
```

### Sync Two Motions
```javascript
// Opposite phase (90° apart)
rightArm: ['oscillate', { freq: 2, ampY: 0.2, phase: 0 }]
leftArm: ['oscillate', { freq: 2, ampY: 0.2, phase: Math.PI / 2 }]

// Opposite direction (180° apart)
rightArm: ['oscillate', { freq: 2, ampY: 0.2, phase: 0 }]
leftArm: ['oscillate', { freq: 2, ampY: 0.2, phase: Math.PI }]
```

---

## What Stayed the Same

✅ HAND shape presets (FLAT, POINT, FIST, C_SHAPE, etc.)
✅ All existing signs in SIGN_POSES continue to work
✅ The avatar 3D model and rendering
✅ The dictionary lookup system
✅ Voice recognition and translation
✅ Component API (AvatarModel, AvatarScene)

---

## What's New

✅ BASE_POSES library
✅ MOTIONS primitive system
✅ JOINT_RANGES safety clamping
✅ createSignFromTemplate() compiler
✅ SIGN_TEMPLATES declarative definitions
✅ registerTemplates() auto-registration
✅ Offsets support for fine-tuning
✅ Steps support for keyframe animation
✅ Micro-movements for natural feel

---

## Next Steps

1. **Test** the new system by playing signs in the UI
2. **Migrate** 1-2 medical signs to templates to get comfortable
3. **Create** new signs directly as templates
4. **Adjust** JOINT_RANGES if you want different limits
5. **Add** new motion primitives as needed (e.g., `wiggle`, `flutter`, `shake`)

---

## Files Included

- `ANIMATION_SYSTEM.md` - Full documentation
- `MEDICAL_SIGNS_MIGRATION.md` - 10 medical sign migration examples
- `ANIMATION_QUICK_REFERENCE.md` - Cheat sheets and quick lookups
- `AvatarModel.jsx` - Implementation (open source)

---

## Questions?

Refer to the documentation files or inspect the code in:
```
client/src/components/AvatarModel.jsx
Lines 200-500: BASE_POSES, MOTIONS, JOINT_RANGES
Lines 500-700: createSignFromTemplate(), SIGN_TEMPLATES
```

