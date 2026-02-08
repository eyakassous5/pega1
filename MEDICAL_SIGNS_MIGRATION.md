# Medical Signs Migration Guide

This file shows how to migrate existing medical sign definitions to the new template-based system.

## Current Medical Signs (Old System)

These signs are currently defined as raw functions in `SIGN_POSES`. They should be migrated to `SIGN_TEMPLATES` for easier tuning.

---

## Migration Examples

### 1. `sign_bras` (Pointing to arm)

**Original (Old System):**
```javascript
sign_bras: (t) => ({
  rightArm: [-0.5, 0.4, 0.3], 
  rightForeArm: [-1.8, 0.2, 0],
  rightHandShape: HAND.POINT,
  leftArm: [0, 0, 1.3], 
  leftForeArm: [-0.2, 0, 0],
  head: [0.1, 0, 0],
}),
```

**Analysis:**
- Right arm: mid-height, pointing forward and right
- Left arm: extended to the side
- Static pose (no time-based motion)

**New Template:**
```javascript
sign_bras: {
  base: 'HEAD_LEVEL',  // Close to the position
  hands: { 
    right: HAND.POINT, 
    left: HAND.FLAT 
  },
  offsets: {
    rightArm: { x: -0.2, y: 0.4, z: 0.4 },
    rightForeArm: { x: -0.6, y: 0.2 },
    leftArm: { x: 0, y: 0, z: 1.3 },
    leftForeArm: { y: 0, z: 0 },
  },
  micro: {
    head: ['oscillate', { freq: 1, ampX: 0.05 }],
  },
}
```

---

### 2. `sign_cerveau` (Pointing to head)

**Original:**
```javascript
sign_cerveau: (t) => ({
  rightArm: [-2.5, 0.3, -0.2], 
  rightForeArm: [-2.0, 0, 0],
  rightWrist: [0, -0.5, 0],
  rightHandShape: HAND.POINT,
  head: [0, 0, Math.sin(t * 3) * 0.05],
}),
```

**Analysis:**
- Arm extended upward/forward
- Pointing gesture at head
- Head has slight oscillation

**New Template:**
```javascript
sign_cerveau: {
  base: 'HEAD_LEVEL',
  hands: { right: HAND.POINT },
  offsets: {
    rightArm: { x: -2.2, y: 0.3 },
    rightForeArm: { x: -0.8 },
    rightWrist: { y: -0.5 },
  },
  micro: {
    head: ['oscillate', { freq: 3, ampZ: 0.05 }],
  },
}
```

---

### 3. `sign_tete` (Head gesture)

**Original:**
```javascript
sign_tete: (t) => ({
  rightArm: [-2.5, 0.3, -0.2], 
  rightForeArm: [-2.0, 0, 0],
  rightWrist: [0, -0.5, 0],
  rightHandShape: HAND.FLAT, 
  head: [0, 0, Math.sin(t * 3) * 0.05],
}),
```

**New Template:**
```javascript
sign_tete: {
  base: 'HEAD_LEVEL',
  hands: { right: HAND.FLAT },
  offsets: {
    rightArm: { x: -2.2, y: 0.3 },
    rightForeArm: { x: -0.8 },
    rightWrist: { y: -0.5 },
  },
  micro: {
    head: ['oscillate', { freq: 3, ampZ: 0.05 }],
  },
}
```

---

### 4. `sign_bouche` (Mouth gesture)

**Original:**
```javascript
sign_bouche: (t) => ({
  rightArm: [-2.2, 0.2, -0.2],
  rightForeArm: [-2.1, 0, 0], 
  rightHandShape: HAND.POINT,
  head: [0, 0, Math.sin(t * 2) * 0.05],
}),
```

**New Template:**
```javascript
sign_bouche: {
  base: 'HEAD_LEVEL',
  hands: { right: HAND.POINT },
  offsets: {
    rightArm: { x: -1.9, y: 0.2 },
    rightForeArm: { x: -0.8 },
  },
  micro: {
    head: ['oscillate', { freq: 2, ampZ: 0.05 }],
  },
}
```

---

### 5. `sign_coeur` (Heart/chest gesture)

**Original:**
```javascript
sign_coeur: (t) => ({
  rightArm: [-1.5, 0.6, 0.4],
  rightForeArm: [-2.0, 0, -0.2],
  rightHandShape: HAND.FLAT, 
  head: [0.1, 0, 0],
}),
```

**New Template:**
```javascript
sign_coeur: {
  base: 'CHEST',
  hands: { right: HAND.FLAT },
  offsets: {
    rightArm: { x: -0.8, y: 0.6, z: 0.6 },
    rightForeArm: { x: -1.2, z: -0.2 },
  },
  micro: {
    head: ['oscillate', { freq: 1, ampX: 0.05 }],
  },
}
```

---

### 6. `sign_ventre` (Belly/stomach gesture)

**Original:**
```javascript
sign_ventre: (t) => ({
  rightArm: [-1.0, 0.3, 0.2],
  rightForeArm: [-1.5, 0, 0],
  rightWrist: [Math.sin(t * 3) * 0.2, Math.cos(t * 3) * 0.2, 0],
  rightHandShape: HAND.FLAT,
  head: [0.1, 0, 0],
}),
```

**Analysis:**
- Hand moves in a circle at the belly
- Fits the `circle` motion pattern

**New Template:**
```javascript
sign_ventre: {
  base: 'BELLY',
  hands: { right: HAND.FLAT },
  offsets: {
    rightArm: { x: 0, y: 0.3, z: 0.5 },
    rightForeArm: { x: -1.0 },
  },
  rightHandMotion: ['circle', { freq: 3, radius: 0.25 }],
  micro: {
    head: ['oscillate', { freq: 1, ampX: 0.05 }],
  },
}
```

---

### 7. `sign_yeux` (Eyes gesture)

**Original:**
```javascript
sign_yeux: (t) => ({
  rightArm: [-2.2, 0.2, -0.2],
  rightForeArm: [-1.8, 0, 0], 
  rightHandShape: HAND.POINT, 
}),
```

**New Template:**
```javascript
sign_yeux: {
  base: 'HEAD_LEVEL',
  hands: { right: HAND.POINT },
  offsets: {
    rightArm: { x: -1.9, y: 0.2 },
    rightForeArm: { x: -0.6 },
  },
}
```

---

### 8. `sign_medecin` (Doctor/physician)

**Original:**
```javascript
sign_medecin: (t) => ({
  leftArm: [-0.8, 0, 0.5],
  leftForeArm: [-1.0, 0, 0],
  leftHandShape: HAND.FLAT,
  rightArm: [-0.8, 0.4, -0.2],
  rightForeArm: [-1.2, 0, 0],
  rightHandShape: HAND.THREE_FINGERS, 
}),
```

**Analysis:**
- Two hands at different heights
- Static pose showing "taking pulse"

**New Template:**
```javascript
sign_medecin: {
  base: 'CHEST',
  hands: { 
    right: HAND.THREE_FINGERS, 
    left: HAND.FLAT 
  },
  offsets: {
    rightArm: { x: -0.1, y: 0.4, z: -0.2 },
    rightForeArm: { x: -0.4 },
    leftArm: { y: 0, z: 0.7 },
    leftForeArm: { x: -0.2 },
  },
  micro: {
    head: ['hold'],
  },
}
```

---

### 9. `sign_hopital` (Hospital)

**Original:**
```javascript
sign_hopital: (t) => ({
  rightArm: [-1.5, 0, 0], 
  rightForeArm: [-1.5, 0, 0],
  rightWrist: [Math.sin(t * 4) * 0.2, Math.cos(t * 4) * 0.2, 0], 
  rightHandShape: HAND.POINT,
}),
```

**Analysis:**
- Hand makes a circular motion (like drawing a cross)

**New Template:**
```javascript
sign_hopital: {
  base: 'CHEST',
  hands: { right: HAND.POINT },
  offsets: {
    rightArm: { x: -1.0 },
    rightForeArm: { x: -1.0 },
  },
  rightHandMotion: ['circle', { freq: 4, radius: 0.25 }],
}
```

---

### 10. `sign_vaccin` (Vaccine/injection)

**Original:**
```javascript
sign_vaccin: (t) => ({
  leftArm: [0, 0, 1.2],
  rightArm: [-1.0, 0.5, 0.4],
  rightForeArm: [-1.5, 0, 0],
  rightWrist: [0, 0, Math.sin(t * 5) > 0 ? -0.2 : 0],
  rightHandShape: HAND.PINCH,
}),
```

**Analysis:**
- Left arm extended (shows injection site)
- Right hand with pinch, wrist taps in/out

**New Template:**
```javascript
sign_vaccin: {
  base: 'BELLY',
  hands: { 
    right: HAND.PINCH, 
    left: HAND.FLAT 
  },
  offsets: {
    leftArm: { z: 1.4 },
    leftForeArm: { z: 0.2 },
    rightArm: { x: -0.5, y: 0.5, z: 0.55 },
    rightForeArm: { x: -1.0 },
  },
  rightHandMotion: ['tap', { freq: 5, ampZ: 0.2 }],
  micro: {
    head: ['hold'],
  },
}
```

---

## How to Apply the Migration

1. **Open** `client/src/components/AvatarModel.jsx`

2. **Move** each medical sign definition from `SIGN_POSES` to `SIGN_TEMPLATES`

3. **Replace** the function with a template object

4. **Test** by playing each sign in the UI and adjusting offsets if needed

5. **Remove** the old function entries from `SIGN_POSES`

Example flow:
```javascript
// OLD (in SIGN_POSES)
sign_bras: (t) => ({ ... }),

// NEW (in SIGN_TEMPLATES)
sign_bras: {
  base: 'HEAD_LEVEL',
  hands: { right: HAND.POINT, left: HAND.FLAT },
  offsets: { ... },
  micro: { ... },
},

// AUTOMATIC via registerTemplates()
// SIGN_POSES.sign_bras becomes the compiled function
```

---

## Benefits After Migration

| Before | After |
|--------|-------|
| Hard to tune freq/amp | One place to change motion params |
| Repeated code | Reusable BASE_POSES, MOTIONS |
| Raw numbers | Semantic: "push", "oscillate", "circle" |
| Manual clamping | Automatic joint safety |
| Single function | Composable template parts |

---

## Next Steps

1. **Gradually migrate** medical signs as you refine them
2. **Create** new signs directly using templates
3. **Share** common motion patterns across signs
4. **Monitor** JOINT_RANGES — adjust if poses look wrong
5. **Add** more motion primitives as needed (e.g., `wiggle`, `shake`, `flutter`)

