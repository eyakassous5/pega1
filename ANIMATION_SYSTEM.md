# Animation System V2: Template-Based Architecture

This document describes the refactored animation system for the LST Sign Language Interpreter avatar.

## Overview

The animation system has been refactored to be **easier to tune** across many signs. Instead of writing raw function code, you define **declarative templates** that are compiled into animation functions.

### Key Benefits
- **Reusable**: BASE_POSES, MOTIONS, and HAND shapes are shared
- **Composable**: Combine motion types, offsets, steps, and micro-movements
- **Maintainable**: Change a motion freq or amplitude in one place, affects all signs using it
- **Type-safe**: Clear parameter schemas for each motion type

---

## Architecture Components

### 1. BASE_POSES (Arm Position Library)

Pre-defined neutral arm positions for common signing gestures. Choose one as your starting point.

```javascript
const BASE_POSES = {
  BELLY: {        // Arms down at sides, hands together area
    rightArm: [-1.0, 0, -0.3],
    rightForeArm: [-0.5, 0, 0],
    leftArm: [-1.0, 0, 0.3],
    leftForeArm: [-0.5, 0, 0],
  },
  CHEST: {        // Arms at chest level, slightly bent
    rightArm: [-0.7, 0, -0.2],
    rightForeArm: [-0.8, 0, 0],
    leftArm: [-0.7, 0, 0.2],
    leftForeArm: [-0.8, 0, 0],
  },
  HEAD_LEVEL: {   // Arms at head height, pointing forward
    rightArm: [-0.3, 0, -0.1],
    rightForeArm: [-1.2, 0, 0],
    leftArm: [-0.3, 0, 0.1],
    leftForeArm: [-1.2, 0, 0],
  },
  FORWARD: {      // Neutral forward-ready position
    rightArm: [-0.5, 0, -0.15],
    rightForeArm: [-1.0, 0, 0],
    leftArm: [-0.5, 0, 0.15],
    leftForeArm: [-1.0, 0, 0],
  },
};
```

**Usage**: `{ base: "BELLY" }` in your template.

---

### 2. MOTIONS (Reusable Movement Patterns)

Pre-built motion generators that apply time-based transformations to joints.

#### Available Motion Types

##### `hold`
Static position (no motion).
```javascript
['hold']
```

##### `oscillate`
Smooth sinusoidal oscillation.
```javascript
['oscillate', {
  freq: 2,           // Cycles per second
  ampX: 0.1,         // Amplitude on X axis
  ampY: 0,           // Amplitude on Y axis
  ampZ: 0,           // Amplitude on Z axis
  phase: 0,          // Phase offset (radians)
}]
```

##### `push`
Forward + down motion (e.g., giving birth, pushing).
```javascript
['push', {
  freq: 2,           // Frequency
  forwardAmp: 0.18,  // Forward (Z) amplitude
  downAmp: 0.12,     // Down (X positive) amplitude
  phase: 0,          // Phase offset
}]
```

##### `cut`
Side-sweep motion.
```javascript
['cut', {
  freq: 3,           // Frequency
  sideAmp: 0.2,      // Side (Y) amplitude
  phase: 0,          // Phase offset
}]
```

##### `circle`
Circular rotation in XZ plane.
```javascript
['circle', {
  freq: 2,           // Frequency
  radius: 0.15,      // Circle radius
  phase: 0,          // Phase offset
}]
```

##### `tap`
Quick on/off motion (e.g., checking pulse).
```javascript
['tap', {
  freq: 4,           // Frequency
  ampX: 0.1,         // X amplitude when active
  ampY: 0,           // Y amplitude when active
  ampZ: 0,           // Z amplitude when active
  threshold: 0,      // Sine wave threshold for "active"
}]
```

##### `pointDown`
Pointing motion with small wobble.
```javascript
['pointDown', {
  freq: 2,           // Wobble frequency
  wobbleAmp: 0.05,   // Wobble amplitude
}]
```

---

### 3. createSignFromTemplate()

Converts a template object into an animation function `(t) => pose`.

**Function signature:**
```javascript
const poseFunction = createSignFromTemplate({
  base,              // String: "BELLY", "CHEST", "HEAD_LEVEL", or "FORWARD"
  hands,             // Object: { right: HAND.FLAT, left: HAND.POINT }
  rightArmMotion,    // Array: [motionType, params] or null
  leftArmMotion,     // Array: [motionType, params] or null
  rightHandMotion,   // Array: [motionType, params] or null
  leftHandMotion,    // Array: [motionType, params] or null
  offsets,           // Object: { rightArm: {x, y, z}, ... }
  steps,             // Array: [{at, poseOverrides}, ...] — replaces motions if set
  micro,             // Object: { head: [...], spine2: [...] } — small motions
});
```

---

### 4. Template Structure Examples

#### Simple Single-Motion Template
```javascript
sign_wave: {
  base: 'CHEST',
  hands: { right: HAND.OPEN_SPREAD, left: HAND.OPEN_SPREAD },
  rightArmMotion: ['oscillate', { freq: 3, ampY: 0.2 }],
  leftArmMotion: ['oscillate', { freq: 3, ampY: 0.2, phase: Math.PI }],
}
```

#### Template with Offsets (Hand Layering)
```javascript
sign_birth: {
  base: 'BELLY',
  hands: { right: HAND.FLAT, left: HAND.FLAT },
  rightArmMotion: ['push', { freq: 2, forwardAmp: 0.18, downAmp: 0.12 }],
  leftArmMotion: ['push', { freq: 2, forwardAmp: 0.18, downAmp: 0.12, phase: Math.PI }],
  offsets: {
    rightArm: { x: 0, y: 0, z: -0.05 },  // Right hand slightly forward
    leftArm: { x: 0, y: 0, z: 0.05 },
  },
  micro: {
    head: ['oscillate', { freq: 1.5, ampX: 0.05 }],
    spine2: ['oscillate', { freq: 1, ampX: 0.02 }],
  },
}
```

#### Step-Based Keyframe Animation
```javascript
sign_examine_arms: {
  steps: [
    { 
      at: 0.0, 
      poseOverrides: { 
        rightArm: [-0.5, 0.4, 0.3], 
        rightForeArm: [-1.8, 0.2, 0],
      } 
    },
    { 
      at: 0.5, 
      poseOverrides: { 
        rightArm: [-0.3, 0.5, 0.2], 
        rightForeArm: [-2.0, 0.3, 0],
      } 
    },
    { 
      at: 1.0, 
      poseOverrides: { 
        rightArm: [-0.5, 0.4, 0.3], 
        rightForeArm: [-1.8, 0.2, 0],
      } 
    },
  ],
  hands: { right: HAND.FLAT, left: HAND.FLAT },
}
```

---

### 5. JOINT_RANGES (Safety Clamping)

All joint values are automatically clamped to prevent unrealistic poses:

```javascript
const JOINT_RANGES = {
  arm: [-Math.PI, Math.PI],              // Full rotation
  foreArm: [-2.5, 0.1],                  // Prevent overstretching backward
  wrist: [-Math.PI * 0.6, Math.PI * 0.6],
  head: [-0.3, 0.3],                     // Limited head rotation
  spine: [-0.15, 0.15],                  // Subtle spine movement
  fingerCurl: [0, 1],                    // Finger curl: 0=straight, 1=closed
  fingerSpread: [-0.5, 0.8],             // Finger spread
};
```

**This happens automatically** — no manual clamping needed.

---

### 6. HAND Presets

Predefined hand shapes used in templates:

```javascript
HAND.RELAXED        // Neutral, slightly open
HAND.FLAT           // Open palm
HAND.FIST           // Closed fist
HAND.POINT          // Index finger extended
HAND.C_SHAPE        // C-shape (curved hand)
HAND.THUMBS_UP      // Thumbs up
HAND.ILY            // I Love You sign
HAND.OPEN_SPREAD    // Spread open fingers
HAND.PINCH          // Pinching motion
HAND.CLAW           // Claw shape
HAND.HOOK           // Hook (curved index)
HAND.THREE_FINGERS  // Three fingers extended
HAND.FOUR_FINGERS   // Four fingers extended
```

---

## How to Create a New Sign

### Step 1: Choose a BASE_POSE
Based on where the sign is typically performed:
- `BELLY` — arms at rest near body
- `CHEST` — arms at chest level
- `HEAD_LEVEL` — arms at head height
- `FORWARD` — neutral forward position

### Step 2: Choose Hand Shapes
Pick from `HAND.FLAT`, `HAND.POINT`, etc.

### Step 3: Select Motion(s)
Decide if the sign is:
- **Static** → Use `['hold']`
- **Oscillating** → Use `['oscillate', {...}]`
- **Pushing** → Use `['push', {...}]`
- **Sweeping** → Use `['cut', {...}]`
- **Circular** → Use `['circle', {...}]`
- **Multi-beat** → Use `steps` instead

### Step 4: Apply Offsets (Optional)
Adjust individual joints if needed:
```javascript
offsets: {
  rightArm: { x: 0.05, y: 0, z: -0.1 },
  rightForeArm: { y: 0.05 },
}
```

### Step 5: Add Micro-Movements (Optional)
Subtle head/spine oscillations make the animation feel natural:
```javascript
micro: {
  head: ['oscillate', { freq: 1.5, ampX: 0.05 }],
  spine2: ['oscillate', { freq: 1, ampX: 0.02 }],
}
```

### Step 6: Register in SIGN_TEMPLATES
```javascript
const SIGN_TEMPLATES = {
  sign_mynewsign: {
    base: 'BELLY',
    hands: { right: HAND.FLAT, left: HAND.POINT },
    rightArmMotion: ['oscillate', { freq: 2, ampY: 0.15 }],
    // ... rest of template
  },
};

// Auto-registered into SIGN_POSES via registerTemplates()
```

---

## Migration Guide: Converting Old Signs to Templates

### Before (Old System)
```javascript
sign_bonjour: (t) => ({
  rightArm: [-1.2, 0, -0.3 + Math.sin(t * 3) * 0.15],
  rightForeArm: [-0.5, 0, 0],
  rightWrist: [0, 0, Math.sin(t * 4) * 0.3],
  rightHandShape: HAND.OPEN_SPREAD,
  head: [0, 0, 0],
}),
```

### After (New Template System)
```javascript
sign_bonjour: {
  base: 'BELLY',                         // Equivalent position
  hands: { right: HAND.OPEN_SPREAD },
  rightArmMotion: ['oscillate', { 
    freq: 3, 
    ampZ: 0.15,                          // The -0.3 part + oscillation
  }],
  rightHandMotion: ['oscillate', { 
    freq: 4, 
    ampZ: 0.3,                           // The wrist Z oscillation
  }],
  micro: {
    head: ['hold'],
  },
},
```

**Key Points:**
- Extract base arm position → identify closest BASE_POSE
- Extract hand shape → use corresponding HAND preset
- Extract motion math → map to MOTIONS type + params
- Keep offsets if needed for fine-tuning

---

## Performance Tips

1. **Reuse motion parameters** across similar signs
2. **Use micro movements** sparingly (adds computation)
3. **Prefer steps** for complex multi-beat animations (easier to debug)
4. **Clamp is automatic** — no manual range checks needed

---

## Debugging

### Log a Sign's Pose
```javascript
console.log(SIGN_POSES['sign_bonjour'](0.5));  // Get pose at t=0.5
```

### Verify Template Registration
```javascript
console.log(SIGN_TEMPLATES);      // See all templates
console.log(Object.keys(SIGN_POSES));  // See all registered poses
```

### Check Motion Output
```javascript
console.log(MOTIONS.oscillate(0.5, { freq: 2, ampX: 0.1 }));
// Output: [x, y, z] offset
```

---

## Example Complete Sign

```javascript
sign_greeting: {
  // Start at belly
  base: 'BELLY',
  
  // Hand shapes
  hands: { 
    right: HAND.OPEN_SPREAD, 
    left: HAND.OPEN_SPREAD 
  },
  
  // Both arms wave out
  rightArmMotion: ['oscillate', { freq: 2.5, ampY: 0.2 }],
  leftArmMotion: ['oscillate', { freq: 2.5, ampY: 0.2, phase: Math.PI }],
  
  // Hands move side-to-side
  rightHandMotion: ['oscillate', { freq: 2.5, ampZ: 0.15 }],
  leftHandMotion: ['oscillate', { freq: 2.5, ampZ: 0.15, phase: Math.PI }],
  
  // Subtle head nod
  micro: {
    head: ['oscillate', { freq: 1.2, ampY: 0.1 }],
    spine2: ['oscillate', { freq: 0.8, ampX: 0.02 }],
  },
  
  // Offset to separate hands slightly
  offsets: {
    rightArm: { z: -0.1 },
    leftArm: { z: 0.1 },
  },
}
```

---

## References

- **JOINT_RANGES**: Safe value limits for each joint
- **createSignFromTemplate()**: The compiler function
- **registerTemplates()**: Auto-registration hook
- **Smoothstep**: Easing function for step interpolation
