# Animation System Documentation Index

## 📚 Documentation Files

### 1. **REFACTORING_SUMMARY.md** (START HERE)
- High-level overview of what changed
- Architecture summary
- Before/after examples
- Performance notes
- Migration path

👉 **Read this first if you want to understand the big picture.**

---

### 2. **ANIMATION_SYSTEM.md** (COMPLETE GUIDE)
- Full system documentation
- Component breakdown:
  - BASE_POSES library
  - MOTIONS primitives
  - createSignFromTemplate()
  - JOINT_RANGES safety limits
  - HAND presets
- Detailed usage examples
- Migration guide
- Debugging tips

👉 **Read this for comprehensive reference and deep understanding.**

---

### 3. **ANIMATION_QUICK_REFERENCE.md** (CHEAT SHEET)
- 30-second quick start
- Motion types cheat sheet
- Base poses quick ref
- Hand shapes quick ref
- Common patterns (wave, dual hands, circle, etc.)
- Parameter reference
- Debugging quick tips

👉 **Read this when you need quick lookups during development.**

---

### 4. **MEDICAL_SIGNS_MIGRATION.md** (PRACTICAL EXAMPLES)
- 10 medical sign migrations (old → new)
- For each sign:
  - Original function
  - Analysis of the pose
  - Template equivalent
- Benefits after migration
- Step-by-step migration instructions

👉 **Read this to see how to convert actual signs to templates.**

---

## 🎯 Quick Navigation

### "I want to..."

#### Create a new sign
→ **ANIMATION_QUICK_REFERENCE.md** → "Common Patterns"
→ **ANIMATION_SYSTEM.md** → "How to Create a New Sign"

#### Understand the system
→ **REFACTORING_SUMMARY.md**
→ **ANIMATION_SYSTEM.md** → "Architecture Components"

#### Migrate an existing sign
→ **MEDICAL_SIGNS_MIGRATION.md** → Examples
→ **ANIMATION_SYSTEM.md** → "Migration Guide"

#### Tune an animation
→ **ANIMATION_QUICK_REFERENCE.md** → "Common Tuning Workflows"
→ **ANIMATION_SYSTEM.md** → "MOTIONS"

#### Look up a parameter
→ **ANIMATION_QUICK_REFERENCE.md** → "Parameter Reference"
→ **ANIMATION_SYSTEM.md** → "MOTIONS" section

#### Debug a pose
→ **ANIMATION_SYSTEM.md** → "Debugging"
→ **ANIMATION_QUICK_REFERENCE.md** → "Debugging"

---

## 🗂️ Code Structure

### In `client/src/components/AvatarModel.jsx`

**Lines 70-190:** HAND presets
- `HAND.FLAT`, `HAND.POINT`, `HAND.FIST`, etc.

**Lines 200-260:** BASE_POSES library
```javascript
const BASE_POSES = {
  BELLY, CHEST, HEAD_LEVEL, FORWARD
}
```

**Lines 265-295:** JOINT_RANGES safety limits
```javascript
const JOINT_RANGES = {
  arm, foreArm, wrist, head, spine, fingerCurl, fingerSpread
}
```

**Lines 320-470:** MOTIONS primitives
```javascript
const MOTIONS = {
  hold, oscillate, push, cut, circle, tap, pointDown
}
```

**Lines 480-520:** Utility functions
```javascript
smoothstep(), lerp(), lerpVec3(), clamp()
```

**Lines 530-630:** createSignFromTemplate() implementation
- The main compiler function

**Lines 635-810:** SIGN_TEMPLATES
- Template definitions for new signs
- Example templates:
  - sign_birth (push + offset)
  - sign_examine_arms (steps)
  - sign_spinner (circle)
  - sign_pulse_check (tap)
  - sign_wave_hands (dual oscillate)
  - sign_dismissing (cut)

**Lines 815-825:** registerTemplates()
- Auto-registration of templates into SIGN_POSES
- Called once at module load

**Lines 830-1100:** SIGN_POSES
- Existing function-based signs (backward compatible)
- Still work perfectly
- Can be migrated to templates gradually

---

## 📋 Template Anatomy

Every template has this structure:

```javascript
const SIGN_TEMPLATES = {
  sign_name: {
    base,                  // Pick: BELLY, CHEST, HEAD_LEVEL, FORWARD
    hands,                 // { right: HAND.*, left: HAND.* }
    rightArmMotion,        // [type, {params}] or null
    leftArmMotion,         // [type, {params}] or null
    rightHandMotion,       // [type, {params}] or null
    leftHandMotion,        // [type, {params}] or null
    offsets,               // { bone: {x, y, z}, ... }
    steps,                 // [{at, poseOverrides}, ...] (overrides motions)
    micro,                 // { head: [...], spine2: [...] }
  },
};
```

---

## 🚀 Getting Started Checklist

- [ ] Read **REFACTORING_SUMMARY.md**
- [ ] Scan **ANIMATION_QUICK_REFERENCE.md**
- [ ] Open browser and test a sign
- [ ] Create your first template sign
- [ ] Migrate 1-2 medical signs
- [ ] Explore MEDICAL_SIGNS_MIGRATION.md examples
- [ ] Bookmark ANIMATION_SYSTEM.md for reference

---

## 💡 Common Tasks

### Create a waving sign
1. See ANIMATION_QUICK_REFERENCE.md → "Wave Motion"
2. Adjust freq and ampY to taste
3. Add micro for head nod

### Create a tapping sign (checking pulse)
1. See MEDICAL_SIGNS_MIGRATION.md → sign_medecin
2. Use `rightHandMotion: ['tap', {...}]`
3. Position arm via offsets

### Create a circular sign
1. See ANIMATION_QUICK_REFERENCE.md → "Circle Motion"
2. Combine circle motion with appropriate base pose
3. Adjust freq and radius

### Create a multi-beat sign
1. See ANIMATION_QUICK_REFERENCE.md → "Multi-Beat (Steps)"
2. Define keyframes with at: 0.0, 0.5, 1.0
3. Add pose overrides for each frame

---

## 🔗 Cross References

| Document | Covers |
|-----------|--------|
| REFACTORING_SUMMARY | Big picture, what changed, examples |
| ANIMATION_SYSTEM | Complete reference, all features |
| ANIMATION_QUICK_REFERENCE | Quick lookups, patterns, cheat sheets |
| MEDICAL_SIGNS_MIGRATION | Real-world migration examples |
| This file | Navigation and structure |

---

## 📖 Reading Difficulty Levels

- **Beginner**: REFACTORING_SUMMARY → ANIMATION_QUICK_REFERENCE
- **Intermediate**: ANIMATION_SYSTEM + MEDICAL_SIGNS_MIGRATION
- **Advanced**: Source code in AvatarModel.jsx

---

## ✅ What's Documented

✅ BASE_POSES (4 presets)
✅ MOTIONS (7 types)
✅ createSignFromTemplate()
✅ SIGN_TEMPLATES
✅ registerTemplates()
✅ JOINT_RANGES
✅ HAND presets
✅ Migration examples
✅ Common patterns
✅ Debugging

---

## 🚧 Future Work

- [ ] Hand shape animations
- [ ] Additional motion primitives (wiggle, flutter, shake)
- [ ] Easing curve options
- [ ] Collision detection
- [ ] Blinking/eye animation
- [ ] Mouth movement

---

## 💬 Support

If something is unclear:

1. Check relevant documentation file
2. Inspect the source code
3. Create a test sign and experiment
4. Review MEDICAL_SIGNS_MIGRATION examples

---

## Version

**Animation System V2**
- Released: February 2026
- Status: Production-ready
- Backward compatible with existing SIGN_POSES

