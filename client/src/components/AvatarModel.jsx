import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, useHelper } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/* ══════════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════════ */

/** Path to the ReadyPlayerMe (or any Mixamo-rigged) GLB avatar */
const MODEL_URL = '/models/avatar.glb';

/** Cross-fade duration (seconds) between animation states */
const XFADE = 0.35;

/** Procedural bone-pose lerp speed (per-frame multiplier) */
const LERP_SPEED = 6;

/* ══════════════════════════════════════════════════════════════════
   READY PLAYER ME  ▸  Bone Name Map
   RPM uses the Mixamo / GLB humanoid naming convention.
   This map lets us address bones by a short alias.
   ══════════════════════════════════════════════════════════════════ */

const BONE_MAP = {
  // Spine chain
  hips:   'Hips',
  spine:  'Spine',
  spine1: 'Spine1',
  spine2: 'Spine2',
  neck:   'Neck',
  head:   'Head',

  // Left arm
  leftShoulder: 'LeftShoulder',
  leftArm:      'LeftArm',
  leftForeArm:  'LeftForeArm',
  leftHand:     'LeftHand',

  // Right arm
  rightShoulder: 'RightShoulder',
  rightArm:      'RightArm',
  rightForeArm:  'RightForeArm',
  rightHand:     'RightHand',

  // Left leg
  leftUpLeg:  'LeftUpLeg',
  leftLeg:    'LeftLeg',
  leftFoot:   'LeftFoot',
  leftToeBase:'LeftToeBase',

  // Right leg
  rightUpLeg:  'RightUpLeg',
  rightLeg:    'RightLeg',
  rightFoot:   'RightFoot',
  rightToeBase:'RightToeBase',

  // ── Left hand fingers ──
  leftThumb1:  'LeftHandThumb1',
  leftThumb2:  'LeftHandThumb2',
  leftThumb3:  'LeftHandThumb3',
  leftIndex1:  'LeftHandIndex1',
  leftIndex2:  'LeftHandIndex2',
  leftIndex3:  'LeftHandIndex3',
  leftMiddle1: 'LeftHandMiddle1',
  leftMiddle2: 'LeftHandMiddle2',
  leftMiddle3: 'LeftHandMiddle3',
  leftRing1:   'LeftHandRing1',
  leftRing2:   'LeftHandRing2',
  leftRing3:   'LeftHandRing3',
  leftPinky1:  'LeftHandLittle1',
  leftPinky2:  'LeftHandLittle2',
  leftPinky3:  'LeftHandLittle3',

  // ── Right hand fingers ──
  rightThumb1:  'RightHandThumb1',
  rightThumb2:  'RightHandThumb2',
  rightThumb3:  'RightHandThumb3',
  rightIndex1:  'RightHandIndex1',
  rightIndex2:  'RightHandIndex2',
  rightIndex3:  'RightHandIndex3',
  rightMiddle1: 'RightHandMiddle1',
  rightMiddle2: 'RightHandMiddle2',
  rightMiddle3: 'RightHandMiddle3',
  rightRing1:   'RightHandRing1',
  rightRing2:   'RightHandRing2',
  rightRing3:   'RightHandRing3',
  rightPinky1:  'RightHandLittle1',
  rightPinky2:  'RightHandLittle2',
  rightPinky3:  'RightHandLittle3',
};

/* ══════════════════════════════════════════════════════════════════
   HAND SHAPE PRESETS  (curl 0→1 = straight→90°, spread = radians)
   ══════════════════════════════════════════════════════════════════ */

const HAND = {
  RELAXED: {
    thumb:  { curl: 0.15, spread: 0.4 },
    index:  { curl: 0.12, spread: 0.05 },
    middle: { curl: 0.12, spread: 0 },
    ring:   { curl: 0.12, spread: -0.05 },
    pinky:  { curl: 0.12, spread: -0.12 },
  },
  FLAT: {
    thumb:  { curl: 0, spread: 0.5 },
    index:  { curl: 0, spread: 0.05 },
    middle: { curl: 0, spread: 0 },
    ring:   { curl: 0, spread: -0.05 },
    pinky:  { curl: 0, spread: -0.1 },
  },
  FIST: {
    thumb:  { curl: 0.7, spread: 0.1 },
    index:  { curl: 1, spread: 0 },
    middle: { curl: 1, spread: 0 },
    ring:   { curl: 1, spread: 0 },
    pinky:  { curl: 1, spread: 0 },
  },
  POINT: {
    thumb:  { curl: 0.6, spread: 0.2 },
    index:  { curl: 0, spread: 0 },
    middle: { curl: 1, spread: 0 },
    ring:   { curl: 1, spread: 0 },
    pinky:  { curl: 1, spread: 0 },
  },
  C_SHAPE: {
    thumb:  { curl: 0.35, spread: 0.6 },
    index:  { curl: 0.5, spread: 0.04 },
    middle: { curl: 0.55, spread: 0 },
    ring:   { curl: 0.6, spread: -0.04 },
    pinky:  { curl: 0.65, spread: -0.08 },
  },
  THUMBS_UP: {
    thumb:  { curl: 0, spread: 0.8 },
    index:  { curl: 1, spread: 0 },
    middle: { curl: 1, spread: 0 },
    ring:   { curl: 1, spread: 0 },
    pinky:  { curl: 1, spread: 0 },
  },
  ILY: {
    thumb:  { curl: 0, spread: 0.8 },
    index:  { curl: 0, spread: 0.15 },
    middle: { curl: 1, spread: 0 },
    ring:   { curl: 1, spread: 0 },
    pinky:  { curl: 0, spread: -0.2 },
  },
  OPEN_SPREAD: {
    thumb:  { curl: 0, spread: 0.7 },
    index:  { curl: 0, spread: 0.15 },
    middle: { curl: 0, spread: 0 },
    ring:   { curl: 0, spread: -0.15 },
    pinky:  { curl: 0, spread: -0.3 },
  },
  PINCH: {
    thumb:  { curl: 0.4, spread: 0.3 },
    index:  { curl: 0.4, spread: 0.02 },
    middle: { curl: 1, spread: 0 },
    ring:   { curl: 1, spread: 0 },
    pinky:  { curl: 1, spread: 0 },
  },
  CLAW: {
    thumb:  { curl: 0.4, spread: 0.5 },
    index:  { curl: 0.45, spread: 0.1 },
    middle: { curl: 0.45, spread: 0 },
    ring:   { curl: 0.45, spread: -0.1 },
    pinky:  { curl: 0.45, spread: -0.15 },
  },
  HOOK: {
    thumb:  { curl: 0.6, spread: 0.2 },
    index:  { curl: 0, spread: 0.08 },
    middle: { curl: 0, spread: -0.08 },
    ring:   { curl: 1, spread: 0 },
    pinky:  { curl: 1, spread: 0 },
  },
  THREE_FINGERS: {
    thumb:  { curl: 0.6, spread: 0.2 },
    index:  { curl: 0, spread: 0.1 },
    middle: { curl: 0, spread: 0 },
    ring:   { curl: 0, spread: -0.1 },
    pinky:  { curl: 1, spread: 0 },
  },
  FOUR_FINGERS: {
    thumb:  { curl: 0.7, spread: 0.1 },
    index:  { curl: 0, spread: 0.08 },
    middle: { curl: 0, spread: 0.02 },
    ring:   { curl: 0, spread: -0.04 },
    pinky:  { curl: 0, spread: -0.1 },
  },
};

/* ══════════════════════════════════════════════════════════════════
   ANIMATION SYSTEM V2: Template-Based with BASE_POSES & Motion Primitives
   ══════════════════════════════════════════════════════════════════ */

/**
 * JOINT_RANGES: Safe rotation ranges [min, max] for each joint in radians.
 * Prevents unrealistic poses and joint flipping.
 */
const JOINT_RANGES = {
  arm: [-Math.PI, Math.PI],           // Full rotation
  foreArm: [-2.5, 0.1],               // Prevent overstretching backward
  wrist: [-Math.PI * 0.6, Math.PI * 0.6],
  head: [-0.3, 0.3],                  // Limited head rotation
  spine: [-0.15, 0.15],               // Subtle spine movement
  fingerCurl: [0, 1],                 // Finger curl: 0=straight, 1=closed
  fingerSpread: [-0.5, 0.8],          // Finger spread: negative=together, positive=apart
};

/** Clamp a value to [min, max] */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * BASE_POSES: Common arm positions used as starting points.
 * Each contains default arm/foreArm/wrist positions.
 */
const BASE_POSES = {
  BELLY: {
    rightArm:     [-1.0, 0, -0.3],
    rightForeArm: [-0.5, 0, 0],
    leftArm:      [-1.0, 0, 0.3],
    leftForeArm:  [-0.5, 0, 0],
  },
  CHEST: {
    rightArm:     [-0.7, 0, -0.2],
    rightForeArm: [-0.8, 0, 0],
    leftArm:      [-0.7, 0, 0.2],
    leftForeArm:  [-0.8, 0, 0],
  },
  HEAD_LEVEL: {
    rightArm:     [-0.3, 0, -0.1],
    rightForeArm: [-1.2, 0, 0],
    leftArm:      [-0.3, 0, 0.1],
    leftForeArm:  [-1.2, 0, 0],
  },
  FORWARD: {
    rightArm:     [-0.5, 0, -0.15],
    rightForeArm: [-1.0, 0, 0],
    leftArm:      [-0.5, 0, 0.15],
    leftForeArm:  [-1.0, 0, 0],
  },
};

/**
 * Motion Primitives: Reusable motion patterns
 * Each returns a [x, y, z] offset to apply or a complete value based on time
 */
const MOTIONS = {
  /**
   * hold: Static (no motion)
   */
  hold: (t, params = {}) => [0, 0, 0],

  /**
   * oscillate: Sinusoidal motion
   * params: { freq, ampX, ampY, ampZ, phase }
   */
  oscillate: (t, params = {}) => {
    const { freq = 2, ampX = 0.1, ampY = 0, ampZ = 0, phase = 0 } = params;
    return [
      Math.sin(t * freq + phase) * ampX,
      Math.sin(t * freq + phase) * ampY,
      Math.sin(t * freq + phase) * ampZ,
    ];
  },

  /**
   * push: Forward motion (down+forward then back)
   * params: { freq, forwardAmp, downAmp, phase }
   */
  push: (t, params = {}) => {
    const { freq = 2, forwardAmp = 0.15, downAmp = 0.1, phase = 0 } = params;
    const cycle = Math.sin(t * freq + phase);
    return [
      cycle > 0 ? cycle * downAmp : 0,          // X: down on push
      0,
      cycle * forwardAmp,                       // Z: forward
    ];
  },

  /**
   * cut: Side sweep motion
   * params: { freq, sideAmp, phase }
   */
  cut: (t, params = {}) => {
    const { freq = 3, sideAmp = 0.2, phase = 0 } = params;
    return [
      0,
      Math.sin(t * freq + phase) * sideAmp,    // Y: side to side
      0,
    ];
  },

  /**
   * circle: Circular motion in XZ plane
   * params: { freq, radius, phase }
   */
  circle: (t, params = {}) => {
    const { freq = 2, radius = 0.15, phase = 0 } = params;
    const angle = t * freq + phase;
    return [
      Math.sin(angle) * radius,
      0,
      Math.cos(angle) * radius,
    ];
  },

  /**
   * tap: Quick repetitive motion (binary on/off)
   * params: { freq, ampX, ampY, ampZ, threshold }
   */
  tap: (t, params = {}) => {
    const { freq = 4, ampX = 0.1, ampY = 0, ampZ = 0, threshold = 0 } = params;
    const cycle = Math.sin(t * freq);
    const active = cycle > threshold ? 1 : 0;
    return [
      active * ampX,
      active * ampY,
      active * ampZ,
    ];
  },

  /**
   * pointDown: Finger pointing downward with small oscillation
   * params: { freq, wobbleAmp }
   */
  pointDown: (t, params = {}) => {
    const { freq = 2, wobbleAmp = 0.05 } = params;
    return [
      Math.sin(t * freq) * wobbleAmp,           // X: slight wobble
      0,
      0,
    ];
  },
};

/**
 * Smoothstep easing function for smooth interpolation between 0 and 1
 * Used for step-based animations
 */
const smoothstep = (t) => t * t * (3 - 2 * t);

/**
 * Interpolate between two values with easing
 */
const lerp = (a, b, t, easeFunc = smoothstep) => {
  const eased = easeFunc(clamp(t, 0, 1));
  return a + (b - a) * eased;
};

/**
 * Interpolate between two 3D vectors
 */
const lerpVec3 = (a, b, t, easeFunc = smoothstep) => [
  lerp(a[0], b[0], t, easeFunc),
  lerp(a[1], b[1], t, easeFunc),
  lerp(a[2], b[2], t, easeFunc),
];

/**
 * createSignFromTemplate: Transforms a template definition into a pose function
 * @param {Object} template - { base, hands, rightArmMotion, leftArmMotion, offsets, steps, micro }
 * @returns {Function} (t) => pose object
 */
const createSignFromTemplate = (template) => {
  const {
    base = 'BELLY',
    hands = { right: HAND.FLAT, left: HAND.FLAT },
    rightArmMotion = null,
    leftArmMotion = null,
    rightHandMotion = null,
    leftHandMotion = null,
    offsets = {},
    steps = null,
    micro = {},
  } = template;

  // Validate base
  if (!BASE_POSES[base]) {
    console.warn(`Unknown base pose: ${base}, defaulting to BELLY`);
  }
  const basePose = BASE_POSES[base] || BASE_POSES.BELLY;

  return (t) => {
    let pose = { ...basePose };

    // ─── Per-step keyframe interpolation (if steps exist) ───
    if (steps && Array.isArray(steps) && steps.length > 0) {
      // Normalize time to [0, 1] within one cycle
      const normalizedT = t % 1;

      // Find the two steps bracketing this time
      let prevStep = steps[0];
      let nextStep = steps[steps.length - 1];

      for (let i = 0; i < steps.length; i++) {
        if (steps[i].at <= normalizedT) {
          prevStep = steps[i];
        }
        if (steps[i].at >= normalizedT && nextStep === steps[steps.length - 1]) {
          nextStep = steps[i];
          break;
        }
      }

      // Interpolate between prev and next step
      if (nextStep.at !== prevStep.at) {
        const stepT = (normalizedT - prevStep.at) / (nextStep.at - prevStep.at);
        const eased = smoothstep(stepT);

        // Merge and interpolate overrides
        if (prevStep.poseOverrides && nextStep.poseOverrides) {
          for (const key in prevStep.poseOverrides) {
            const prev = prevStep.poseOverrides[key];
            const next = nextStep.poseOverrides[key];
            if (Array.isArray(prev) && Array.isArray(next)) {
              pose[key] = lerpVec3(prev, next, eased);
            }
          }
        }
      }
    } else {
      // ─── Motion-based animation (if no steps) ───

      // Apply arm motions
      if (rightArmMotion) {
        const [motionType, motionParams] = rightArmMotion;
        const motion = MOTIONS[motionType](t, motionParams);
        pose.rightArm = [
          pose.rightArm[0] + motion[0],
          pose.rightArm[1] + motion[1],
          pose.rightArm[2] + motion[2],
        ];
      }

      if (leftArmMotion) {
        const [motionType, motionParams] = leftArmMotion;
        const motion = MOTIONS[motionType](t, motionParams);
        pose.leftArm = [
          pose.leftArm[0] + motion[0],
          pose.leftArm[1] + motion[1],
          pose.leftArm[2] + motion[2],
        ];
      }

      // Apply hand motions (to wrist/foreArm)
      if (rightHandMotion) {
        const [motionType, motionParams] = rightHandMotion;
        const motion = MOTIONS[motionType](t, motionParams);
        if (!pose.rightWrist) pose.rightWrist = [0, 0, 0];
        pose.rightWrist = [
          pose.rightWrist[0] + motion[0],
          pose.rightWrist[1] + motion[1],
          pose.rightWrist[2] + motion[2],
        ];
      }

      if (leftHandMotion) {
        const [motionType, motionParams] = leftHandMotion;
        const motion = MOTIONS[motionType](t, motionParams);
        if (!pose.leftWrist) pose.leftWrist = [0, 0, 0];
        pose.leftWrist = [
          pose.leftWrist[0] + motion[0],
          pose.leftWrist[1] + motion[1],
          pose.leftWrist[2] + motion[2],
        ];
      }
    }

    // ─── Apply offsets ───
    if (offsets) {
      for (const bone in offsets) {
        if (!pose[bone]) pose[bone] = [0, 0, 0];
        const offset = offsets[bone];
        pose[bone] = [
          pose[bone][0] + (offset.x ?? 0),
          pose[bone][1] + (offset.y ?? 0),
          pose[bone][2] + (offset.z ?? 0),
        ];
      }
    }

    // ─── Apply micro motions (small oscillations on head/spine/etc) ───
    if (micro) {
      for (const bone in micro) {
        const microMotion = micro[bone];
        const [motionType, motionParams] = microMotion;
        const motion = MOTIONS[motionType](t, motionParams);
        if (!pose[bone]) pose[bone] = [0, 0, 0];
        pose[bone] = [
          pose[bone][0] + motion[0],
          pose[bone][1] + motion[1],
          pose[bone][2] + motion[2],
        ];
      }
    }

    // ─── Clamp all arm/foreArm values to safe ranges ───
    ['rightArm', 'leftArm', 'rightForeArm', 'leftForeArm', 'rightWrist', 'leftWrist'].forEach(bone => {
      if (pose[bone]) {
        pose[bone] = [
          clamp(pose[bone][0], JOINT_RANGES.arm[0], JOINT_RANGES.arm[1]),
          clamp(pose[bone][1], JOINT_RANGES.arm[0], JOINT_RANGES.arm[1]),
          clamp(pose[bone][2], JOINT_RANGES.arm[0], JOINT_RANGES.arm[1]),
        ];
      }
    });

    // ─── Clamp head/spine ───
    if (pose.head) {
      pose.head = [
        clamp(pose.head[0], JOINT_RANGES.head[0], JOINT_RANGES.head[1]),
        clamp(pose.head[1], JOINT_RANGES.head[0], JOINT_RANGES.head[1]),
        clamp(pose.head[2], JOINT_RANGES.head[0], JOINT_RANGES.head[1]),
      ];
    }
    if (pose.spine2) {
      pose.spine2 = [
        clamp(pose.spine2[0], JOINT_RANGES.spine[0], JOINT_RANGES.spine[1]),
        clamp(pose.spine2[1], JOINT_RANGES.spine[0], JOINT_RANGES.spine[1]),
        clamp(pose.spine2[2], JOINT_RANGES.spine[0], JOINT_RANGES.spine[1]),
      ];
    }

    // ─── Apply hand shapes ───
    if (hands.right) pose.rightHandShape = hands.right;
    if (hands.left) pose.leftHandShape = hands.left;

    return pose;
  };
};

/**
 * SIGN_TEMPLATES: Declarative templates for signs
 * Each template is converted to a pose function via createSignFromTemplate()
 *
 * USAGE PATTERNS:
 * 1. Base + Hands + Motion:
 *    { base: "BELLY", hands: { right: HAND.FLAT }, rightArmMotion: ["oscillate", {...}] }
 *
 * 2. Steps-based (keyframe animation, ignores motions):
 *    { steps: [{at: 0.0, poseOverrides: {...}}, {at: 0.5, poseOverrides: {...}}] }
 *
 * 3. Offsets applied after base:
 *    { base: "CHEST", offsets: { rightArm: {x: 0.05, y: 0, z: -0.1} } }
 *
 * 4. Micro motions for subtle movement:
 *    { micro: { head: ["oscillate", {freq: 1}], spine2: ["oscillate", {freq: 0.8}] } }
 */
const SIGN_TEMPLATES = {
  // Example 1: "birth" sign - dual push motion with offset stacking
  sign_birth: {
    base: 'BELLY',
    hands: { right: HAND.FLAT, left: HAND.FLAT },
    rightArmMotion: ['push', { freq: 2, forwardAmp: 0.18, downAmp: 0.12 }],
    leftArmMotion: ['push', { freq: 2, forwardAmp: 0.18, downAmp: 0.12, phase: Math.PI }],
    offsets: {
      rightArm: { x: 0, y: 0, z: -0.05 },    // Right hand slightly forward
      leftArm: { x: 0, y: 0, z: 0.05 },
    },
    micro: {
      head: ['oscillate', { freq: 1.5, ampX: 0.05 }],
      spine2: ['oscillate', { freq: 1, ampX: 0.02 }],
    },
  },

  // Example 2: Step-based animation - precise keyframe sequence
  sign_examine_arms: {
    steps: [
      { at: 0.0, poseOverrides: { 
          rightArm: [-0.5, 0.4, 0.3], 
          rightForeArm: [-1.8, 0.2, 0],
          leftArm: [0, 0, 1.3],
          leftForeArm: [-0.2, 0, 0],
        } 
      },
      { at: 0.5, poseOverrides: { 
          rightArm: [-0.3, 0.5, 0.2], 
          rightForeArm: [-2.0, 0.3, 0],
          leftArm: [0.1, 0.2, 1.2],
          leftForeArm: [-0.1, 0.1, 0],
        } 
      },
      { at: 1.0, poseOverrides: { 
          rightArm: [-0.5, 0.4, 0.3], 
          rightForeArm: [-1.8, 0.2, 0],
          leftArm: [0, 0, 1.3],
          leftForeArm: [-0.2, 0, 0],
        } 
      },
    ],
    hands: { right: HAND.FLAT, left: HAND.FLAT },
  },

  // Example 3: Circle motion with custom micro movements
  sign_spinner: {
    base: 'CHEST',
    hands: { right: HAND.POINT, left: HAND.POINT },
    rightArmMotion: ['circle', { freq: 2.5, radius: 0.25 }],
    leftArmMotion: ['circle', { freq: 2.5, radius: 0.25, phase: Math.PI }],
    micro: {
      head: ['oscillate', { freq: 2, ampY: 0.08 }],
    },
  },

  // Example 4: Tap motion (e.g., for checking pulse)
  sign_pulse_check: {
    base: 'FORWARD',
    hands: { right: HAND.FOUR_FINGERS, left: HAND.FLAT },
    rightHandMotion: ['tap', { freq: 5, ampX: 0.1, threshold: 0 }],
    offsets: {
      rightArm: { y: 0.3 },
    },
    micro: {
      head: ['hold'],
    },
  },

  // Example 5: Multi-hand oscillation (e.g., handshake or greeting)
  sign_wave_hands: {
    base: 'CHEST',
    hands: { right: HAND.OPEN_SPREAD, left: HAND.OPEN_SPREAD },
    rightArmMotion: ['oscillate', { freq: 3, ampY: 0.2 }],
    leftArmMotion: ['oscillate', { freq: 3, ampY: 0.2, phase: Math.PI }],
    rightHandMotion: ['oscillate', { freq: 3, ampZ: 0.15 }],
    leftHandMotion: ['oscillate', { freq: 3, ampZ: 0.15, phase: Math.PI }],
  },

  // Example 6: Side-sweep cut motion
  sign_dismissing: {
    base: 'BELLY',
    hands: { right: HAND.FLAT, left: HAND.FLAT },
    rightArmMotion: ['cut', { freq: 2, sideAmp: 0.3 }],
    offsets: {
      rightArm: { z: -0.2 },
    },
    micro: {
      head: ['oscillate', { freq: 1.5, ampY: 0.1 }],
    },
  },
};

/**
 * Auto-register templates into SIGN_POSES
 * (Existing direct SIGN_POSES entries remain untouched)
 */
const registerTemplates = () => {
  for (const [key, template] of Object.entries(SIGN_TEMPLATES)) {
    if (!SIGN_POSES[key]) {
      SIGN_POSES[key] = createSignFromTemplate(template);
    }
  }
};


const WAVE_FINGERS = (t) => ({
  thumb:  { curl: 0.1, spread: 0.5 },
  index:  { curl: Math.abs(Math.sin(t * 6)) * 0.7, spread: 0.05 },
  middle: { curl: Math.abs(Math.sin(t * 6 + 0.3)) * 0.7, spread: 0 },
  ring:   { curl: Math.abs(Math.sin(t * 6 + 0.6)) * 0.7, spread: -0.05 },
  pinky:  { curl: Math.abs(Math.sin(t * 6 + 0.9)) * 0.7, spread: -0.1 },
});

/** Resolve hand shape — if it's a function, call with current time */
const resolveHand = (h, t) => (typeof h === 'function' ? h(t) : h);

/* ══════════════════════════════════════════════════════════════════
   SIGN POSE LIBRARY
   Each sign returns a pose: arm rotations (Euler XYZ), hand shapes,
   optional wrist, head, body overrides.
   ══════════════════════════════════════════════════════════════════ */

const SIGN_POSES = {
  sign_bonjour: (t) => ({
    rightArm: [-1.2, 0, -0.3 + Math.sin(t * 3) * 0.15],
    rightForeArm: [-0.5, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 4) * 0.3],
    rightHandShape: HAND.OPEN_SPREAD,
    head: [0, 0, 0],
  }),
  sign_au_revoir: (t) => ({
    rightArm: [-1.4, 0, -0.5],
    rightForeArm: [-0.3, 0, 0],
    rightWrist: [0, Math.sin(t * 6) * 0.5, 0],
    rightHandShape: WAVE_FINGERS,
    head: [Math.sin(t * 2) * 0.05, 0, 0],
  }),
  sign_merci: (t) => ({
    rightArm: [-0.8, 0, -0.2],
    rightForeArm: [-0.9, 0, 0],
    rightWrist: [-0.3 + Math.sin(t * 3) * 0.1, 0, 0],
    rightHandShape: HAND.FLAT,
    head: [0.15, 0, 0],
  }),
  sign_svp: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-0.7, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 2.5) * 0.2],
    rightHandShape: HAND.FLAT,
    head: [0.1, 0, 0],
  }),
  sign_oui: (t) => ({
    rightArm: [-0.9, 0, -0.3],
    rightForeArm: [-0.8, 0, 0],
    rightWrist: [Math.sin(t * 4) * 0.3, 0, 0],
    rightHandShape: HAND.FIST,
    head: [Math.sin(t * 4) * 0.15, 0, 0],
  }),
  sign_non: (t) => ({
    rightArm: [-1.0, 0, -0.3],
    rightForeArm: [-0.6, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 5) * 0.4],
    rightHandShape: HAND.POINT,
    head: [0, Math.sin(t * 4) * 0.2, 0],
  }),
  sign_comment: (t) => ({
    rightArm: [-0.8, 0, -0.5],
    rightForeArm: [-0.4, 0, 0],
    rightWrist: [0, Math.sin(t * 3) * 0.3, Math.sin(t * 3) * 0.2],
    rightHandShape: HAND.OPEN_SPREAD,
    leftArm: [-0.8, 0, 0.5],
    leftForeArm: [-0.4, 0, 0],
    leftWrist: [0, Math.sin(t * 3 + Math.PI) * 0.3, Math.sin(t * 3 + Math.PI) * 0.2],
    leftHandShape: HAND.OPEN_SPREAD,
    head: [0, 0, Math.sin(t * 2) * 0.05],
  }),
  sign_ca_va: (t) => ({
    rightArm: [-0.9, 0, -0.4],
    rightForeArm: [-0.3, 0, 0],
    rightHandShape: HAND.THUMBS_UP,
    head: [0.1, Math.sin(t * 2) * 0.1, 0],
  }),
  sign_bien: (t) => ({
    rightArm: [-1.0, 0, -0.4],
    rightForeArm: [-0.3, 0, 0],
    rightHandShape: HAND.THUMBS_UP,
    head: [Math.sin(t * 2) * 0.1, 0, 0],
  }),
  sign_mal: (t) => ({
    rightArm: [-1.0, 0, -0.4],
    rightForeArm: [-0.3, 0, Math.PI],
    rightHandShape: HAND.THUMBS_UP,
    head: [-0.1, 0, Math.sin(t * 1.5) * 0.05],
  }),
  sign_je: (t) => ({
    rightArm: [-0.4, 0, -0.1],
    rightForeArm: [-1.2, 0, 0],
    rightHandShape: HAND.POINT,
    head: [0.05, 0, 0],
  }),
  sign_tu: (t) => ({
    rightArm: [-0.7, 0, -0.1],
    rightForeArm: [-0.2, 0, 0],
    rightHandShape: HAND.POINT,
  }),
  sign_il_elle: (t) => ({
    rightArm: [-0.6, -0.5, -0.2],
    rightForeArm: [-0.2, 0, 0],
    rightHandShape: HAND.POINT,
    head: [0, -0.2, 0],
  }),
  sign_nous: (t) => ({
    rightArm: [-0.5, 0, -0.2],
    rightForeArm: [-0.8 + Math.sin(t * 2) * 0.2, 0, 0],
    rightWrist: [0, Math.sin(t * 2) * 0.2, 0],
    rightHandShape: HAND.POINT,
    head: [0.05, Math.sin(t * 1.5) * 0.05, 0],
  }),
  sign_nom: (t) => ({
    rightArm: [-0.7, 0, -0.3],
    rightForeArm: [-0.8, 0, 0],
    rightWrist: [Math.sin(t * 5) * 0.15, 0, 0],
    rightHandShape: HAND.HOOK,
    leftArm: [-0.5, 0, 0.3],
    leftForeArm: [-0.6, 0, 0],
    leftHandShape: HAND.FLAT,
  }),
  sign_quoi: (t) => ({
    rightArm: [-0.7, 0, -0.5],
    rightForeArm: [-0.3, 0, 0],
    rightWrist: [0, Math.sin(t * 3) * 0.2, 0],
    rightHandShape: HAND.OPEN_SPREAD,
    leftArm: [-0.7, 0, 0.5],
    leftForeArm: [-0.3, 0, 0],
    leftWrist: [0, Math.sin(t * 3 + Math.PI) * 0.2, 0],
    leftHandShape: HAND.OPEN_SPREAD,
    head: [0, 0, Math.sin(t * 2) * 0.08],
  }),
  sign_ou: (t) => ({
    rightArm: [-0.8, Math.sin(t * 3) * 0.3, -0.3],
    rightForeArm: [-0.2, 0, 0],
    rightHandShape: HAND.POINT,
    head: [0, Math.sin(t * 2) * 0.15, 0],
  }),
  sign_quand: (t) => ({
    rightArm: [-0.5, 0, -0.2],
    rightForeArm: [-1.0, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 3) * 0.3],
    rightHandShape: HAND.POINT,
    leftArm: [-0.5, 0, 0.2],
    leftForeArm: [-0.8, 0, 0],
    leftHandShape: HAND.FLAT,
    head: [0.05, 0, 0],
  }),
  sign_pourquoi: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-1.3, 0, 0],
    rightWrist: [Math.sin(t * 2) * 0.15, 0, 0],
    rightHandShape: HAND.POINT,
    head: [0, 0, Math.sin(t * 1.5) * 0.05],
  }),
  sign_aide: (t) => ({
    rightArm: [-0.6, 0, -0.2],
    rightForeArm: [-0.8, 0, 0],
    rightHandShape: HAND.FIST,
    leftArm: [-0.5, 0, 0.2],
    leftForeArm: [-0.6, 0, 0],
    leftHandShape: HAND.FLAT,
    spine2: [Math.sin(t * 2) * 0.03, 0, 0],
    head: [0.1, 0, 0],
  }),
  sign_eau: (t) => ({
    rightArm: [-0.6, 0, -0.1],
    rightForeArm: [-1.2, 0, 0],
    rightWrist: [Math.sin(t * 3) * 0.1, 0, 0],
    rightHandShape: HAND.C_SHAPE,
    head: [-0.1, 0, 0],
  }),
  sign_manger: (t) => ({
    rightArm: [-0.6, 0, -0.1],
    rightForeArm: [-1.3 + Math.sin(t * 4) * 0.15, 0, 0],
    rightHandShape: HAND.PINCH,
    head: [Math.sin(t * 4) * 0.03, 0, 0],
  }),
  sign_dormir: (t) => ({
    rightArm: [-0.7, 0, -0.2],
    rightForeArm: [-1.0, 0, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.7, 0, 0.2],
    leftForeArm: [-1.0, 0, 0],
    leftHandShape: HAND.FLAT,
    head: [0.2, 0, 0.25],
  }),
  sign_toilettes: (t) => ({
    rightArm: [-0.9, 0, -0.3],
    rightForeArm: [-0.5, 0, 0],
    rightWrist: [0, Math.sin(t * 4) * 0.2, 0],
    rightHandShape: {
      thumb: { curl: 0, spread: 0.8 }, index: { curl: 1, spread: 0 },
      middle: { curl: 1, spread: 0 }, ring: { curl: 1, spread: 0 },
      pinky: { curl: 0, spread: -0.2 },
    },
  }),
  sign_docteur: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-0.9, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 3) * 0.1],
    rightHandShape: HAND.HOOK,
    leftArm: [-0.6, 0, 0.2],
    leftForeArm: [-0.7, 0, 0],
    leftHandShape: HAND.FLAT,
    head: [0.1, 0, 0],
  }),
  sign_douleur: (t) => ({
    rightArm: [-0.7, 0, -0.2],
    rightForeArm: [-0.8, 0, 0],
    rightWrist: [Math.sin(t * 5) * 0.2, 0, Math.sin(t * 5) * 0.2],
    rightHandShape: HAND.POINT,
    leftArm: [-0.7, 0, 0.2],
    leftForeArm: [-0.8, 0, 0],
    leftWrist: [Math.sin(t * 5 + Math.PI) * 0.2, 0, Math.sin(t * 5 + Math.PI) * 0.2],
    leftHandShape: HAND.POINT,
    head: [0, 0, Math.sin(t * 3) * 0.08],
  }),
  sign_aimer: (t) => ({
    rightArm: [-0.5, 0, -0.3],
    rightForeArm: [-1.0, 0, 0],
    rightHandShape: HAND.CLAW,
    leftArm: [-0.5, 0, 0.3],
    leftForeArm: [-1.0, 0, 0],
    leftHandShape: HAND.CLAW,
    spine2: [Math.sin(t * 1.5) * 0.02, 0, 0],
    head: [0.1, 0, 0],
  }),
  sign_content: (t) => ({
    rightArm: [-0.4, 0, -0.1],
    rightForeArm: [-0.7, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 3) * 0.15],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.4, 0, 0.1],
    leftForeArm: [-0.7, 0, 0],
    leftHandShape: HAND.FLAT,
    spine2: [Math.abs(Math.sin(t * 2)) * 0.02, 0, 0],
    head: [0.1, 0, Math.sin(t * 2) * 0.05],
  }),
  sign_triste: (t) => ({
    rightArm: [-0.3, 0, -0.1],
    rightForeArm: [-1.0, 0, 0],
    rightWrist: [Math.sin(t * 2) * 0.1, 0, 0],
    rightHandShape: HAND.CLAW,
    leftArm: [-0.3, 0, 0.1],
    leftForeArm: [-1.0, 0, 0],
    leftHandShape: HAND.CLAW,
    head: [0.2, 0, Math.sin(t * 1.5) * 0.03],
  }),
  sign_peur: (t) => ({
    rightArm: [-0.8, 0, -0.5],
    rightForeArm: [-0.4, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 5) * 0.1],
    rightHandShape: HAND.OPEN_SPREAD,
    leftArm: [-0.8, 0, 0.5],
    leftForeArm: [-0.4, 0, 0],
    leftHandShape: HAND.OPEN_SPREAD,
    spine2: [0, 0, Math.sin(t * 5) * 0.02],
    head: [-0.1, 0, 0],
  }),
  sign_comprendre: (t) => ({
    rightArm: [-0.4, 0, -0.1],
    rightForeArm: [-1.3, 0, 0],
    rightWrist: [0, 0, t % 2 < 1 ? 0 : 0.2],
    rightHandShape: HAND.POINT,
    head: [Math.sin(t * 2) * 0.1, 0, 0],
  }),
  sign_pas_comprendre: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-1.2, 0, 0],
    rightWrist: [0, Math.sin(t * 4) * 0.3, 0],
    rightHandShape: HAND.OPEN_SPREAD,
    head: [0, Math.sin(t * 3) * 0.15, 0],
  }),
  sign_repeter: (t) => ({
    rightArm: [-0.6, 0, -0.2],
    rightForeArm: [-0.7, 0, 0],
    rightWrist: [0, Math.sin(t * 3) * 0.3, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.5, 0, 0.2],
    leftForeArm: [-0.6, 0, 0],
    leftHandShape: HAND.FLAT,
    head: [0.05, 0, 0],
  }),
  sign_lentement: (t) => ({
    rightArm: [-0.6, 0, -0.2],
    rightForeArm: [-0.5 + Math.sin(t * 1.2) * 0.1, 0, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.5, 0, 0.2],
    leftForeArm: [-0.4, 0, 0],
    leftHandShape: HAND.FLAT,
  }),
  sign_attendre: (t) => ({
    rightArm: [-0.6, 0, -0.3],
    rightForeArm: [-0.3, 0, 0],
    rightWrist: [Math.sin(t * 2) * 0.1, 0, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.6, 0, 0.3],
    leftForeArm: [-0.3, 0, 0],
    leftHandShape: HAND.FLAT,
  }),
  sign_famille: (t) => ({
    rightArm: [-0.7, 0, -0.3],
    rightForeArm: [-0.5, 0, 0],
    rightHandShape: HAND.C_SHAPE,
    leftArm: [-0.7, 0, 0.3],
    leftForeArm: [-0.5, 0, 0],
    leftHandShape: HAND.C_SHAPE,
    head: [0.05, 0, 0],
  }),
  sign_pere: (t) => ({
    rightArm: [-0.4, 0, -0.1],
    rightForeArm: [-1.3, 0, 0],
    rightWrist: [Math.sin(t * 2) * 0.1, 0, 0],
    rightHandShape: HAND.THUMBS_UP,
  }),
  sign_mere: (t) => ({
    rightArm: [-0.3, 0, -0.1],
    rightForeArm: [-1.2, 0, 0],
    rightWrist: [Math.sin(t * 2) * 0.1, 0, 0],
    rightHandShape: HAND.THUMBS_UP,
    head: [0.05, 0, 0],
  }),
  sign_enfant: (t) => ({
    rightArm: [-0.5, 0, -0.3],
    rightForeArm: [-0.6, 0, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.5, 0, 0.3],
    leftForeArm: [-0.6, 0, 0],
    leftHandShape: HAND.FLAT,
    spine2: [0, 0, Math.sin(t * 2) * 0.02],
    head: [0.1, 0, Math.sin(t * 1.5) * 0.05],
  }),
  sign_ami: (t) => ({
    rightArm: [-0.6, 0, -0.2],
    rightForeArm: [-0.8, 0, 0],
    rightHandShape: HAND.HOOK,
    leftArm: [-0.6, 0, 0.2],
    leftForeArm: [-0.8, 0, 0],
    leftHandShape: HAND.HOOK,
    head: [0.05, 0, 0],
  }),
  sign_ecole: (t) => ({
    rightArm: [-0.6, 0, -0.2],
    rightForeArm: [-0.7, 0, 0],
    rightWrist: [Math.sin(t * 5) * 0.2, 0, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.6, 0, 0.2],
    leftForeArm: [-0.7, 0, 0],
    leftHandShape: HAND.FLAT,
  }),
  sign_maison: (t) => ({
    rightArm: [-1.0, 0, -0.3],
    rightForeArm: [-0.5, 0, -0.4],
    rightHandShape: HAND.FLAT,
    leftArm: [-1.0, 0, 0.3],
    leftForeArm: [-0.5, 0, 0.4],
    leftHandShape: HAND.FLAT,
  }),
  sign_travail: (t) => ({
    rightArm: [-0.7, 0, -0.2],
    rightForeArm: [-0.6 + Math.sin(t * 4) * 0.2, 0, 0],
    rightHandShape: HAND.FIST,
    leftArm: [-0.6, 0, 0.2],
    leftForeArm: [-0.5, 0, 0],
    leftHandShape: HAND.FIST,
    head: [0.05, 0, 0],
  }),
  sign_apprendre: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-1.0 + Math.sin(t * 2) * 0.2, 0, 0],
    rightHandShape: HAND.CLAW,
    leftArm: [-0.5, 0, 0.2],
    leftForeArm: [-0.5, 0, 0],
    leftHandShape: HAND.FLAT,
    head: [Math.sin(t * 1.5) * 0.05, 0, 0],
  }),
  sign_aujourd_hui: (t) => ({
    rightArm: [-0.6, 0, -0.3],
    rightForeArm: [-0.3, 0, 0],
    rightHandShape: HAND.FLAT,
    leftArm: [-0.6, 0, 0.3],
    leftForeArm: [-0.3, 0, 0],
    leftHandShape: HAND.FLAT,
    head: [0.1, 0, 0],
  }),
  sign_demain: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-1.1, 0, 0],
    rightWrist: [0, 0, t % 2 < 1 ? 0 : 0.3],
    rightHandShape: HAND.THUMBS_UP,
  }),
  sign_hier: (t) => ({
    rightArm: [-0.4, 0.5, -0.1],
    rightForeArm: [-0.5, 0, 0],
    rightHandShape: HAND.THUMBS_UP,
    head: [0, 0.1, 0],
  }),
  sign_argent: (t) => ({
    rightArm: [-0.5, 0, -0.1],
    rightForeArm: [-0.8, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 4) * 0.2],
    rightHandShape: HAND.PINCH,
  }),
  sign_telephone: (t) => ({
    rightArm: [-0.5, 0, -0.2],
    rightForeArm: [-1.3, 0, 0],
    rightWrist: [0.1, 0, 0],
    rightHandShape: {
      thumb: { curl: 0, spread: 0.8 }, index: { curl: 1, spread: 0 },
      middle: { curl: 1, spread: 0 }, ring: { curl: 1, spread: 0 },
      pinky: { curl: 0, spread: -0.3 },
    },
    head: [0, -0.15, Math.sin(t * 2) * 0.03],
  }),
  sign_excusez: (t) => ({
    rightArm: [-0.4, 0, -0.1],
    rightForeArm: [-0.9, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 2) * 0.15],
    rightHandShape: HAND.FIST,
    head: [0.15, 0, 0],
  }),
  sign_bienvenue: (t) => ({
    rightArm: [-0.8, 0, -0.5 - Math.sin(t * 2) * 0.2],
    rightForeArm: [-0.3, 0, 0],
    rightHandShape: HAND.OPEN_SPREAD,
    leftArm: [-0.8, 0, 0.5 + Math.sin(t * 2) * 0.2],
    leftForeArm: [-0.3, 0, 0],
    leftHandShape: HAND.OPEN_SPREAD,
    head: [0.1, 0, 0],
  }),
  sign_bonsoir: (t) => ({
    rightArm: [-1.0, 0, -0.3 + Math.sin(t * 2) * 0.1],
    rightForeArm: [-0.5, 0, 0],
    rightWrist: [0.3, 0, 0],
    rightHandShape: HAND.FLAT,
    head: [0.1, 0, 0],
  }),

  // ─── MEDICAL / ANATOMY SIGNS ───

  sign_bras: (t) => ({
    // Point to Left Arm
    rightArm: [-0.5, 0.4, 0.3], 
    rightForeArm: [-1.8, 0.2, 0],
    rightHandShape: HAND.POINT,
    // Hold Left Arm out
    leftArm: [0, 0, 1.3], 
    leftForeArm: [-0.2, 0, 0],
    head: [0.1, 0, 0],
  }),

  sign_cerveau: (t) => ({
    // Point to Head
    rightArm: [-2.5, 0.3, -0.2], 
    rightForeArm: [-2.0, 0, 0],
    rightWrist: [0, -0.5, 0],
    rightHandShape: HAND.POINT,
    head: [0, 0, Math.sin(t * 3) * 0.05],
  }),

  sign_tete: (t) => ({
    rightArm: [-2.5, 0.3, -0.2], 
    rightForeArm: [-2.0, 0, 0],
    rightWrist: [0, -0.5, 0],
    rightHandShape: HAND.FLAT, 
    head: [0, 0, Math.sin(t * 3) * 0.05],
  }),

  sign_bouche: (t) => ({
    rightArm: [-2.2, 0.2, -0.2],
    rightForeArm: [-2.1, 0, 0], 
    rightHandShape: HAND.POINT,
    head: [0, 0, Math.sin(t * 2) * 0.05],
  }),

  sign_coeur: (t) => ({
    rightArm: [-1.5, 0.6, 0.4],
    rightForeArm: [-2.0, 0, -0.2],
    rightHandShape: HAND.FLAT, 
    head: [0.1, 0, 0],
  }),

  sign_ventre: (t) => ({
    rightArm: [-1.0, 0.3, 0.2],
    rightForeArm: [-1.5, 0, 0],
    rightWrist: [Math.sin(t * 3) * 0.2, Math.cos(t * 3) * 0.2, 0],
    rightHandShape: HAND.FLAT,
    head: [0.1, 0, 0],
  }),

  sign_yeux: (t) => ({
    rightArm: [-2.2, 0.2, -0.2],
    rightForeArm: [-1.8, 0, 0], 
    rightHandShape: HAND.POINT, 
  }),
  
  sign_medecin: (t) => ({
    leftArm: [-0.8, 0, 0.5],
    leftForeArm: [-1.0, 0, 0],
    leftHandShape: HAND.FLAT,
    rightArm: [-0.8, 0.4, -0.2],
    rightForeArm: [-1.2, 0, 0],
    rightHandShape: HAND.THREE_FINGERS, 
  }),

  sign_hopital: (t) => ({
    rightArm: [-1.5, 0, 0], 
    rightForeArm: [-1.5, 0, 0],
    rightWrist: [Math.sin(t * 4) * 0.2, Math.cos(t * 4) * 0.2, 0], 
    rightHandShape: HAND.POINT,
  }),
  
  sign_vaccin: (t) => ({
    leftArm: [0, 0, 1.2],
    rightArm: [-1.0, 0.5, 0.4],
    rightForeArm: [-1.5, 0, 0],
    rightWrist: [0, 0, Math.sin(t * 5) > 0 ? -0.2 : 0],
    rightHandShape: HAND.PINCH,
  }),
};

// Auto-register templates into SIGN_POSES
registerTemplates();

/** Default resting pose — subtle idle breathing */
const IDLE_SIGN_POSE = (t) => ({
  // A-Pose: Arms ~60-70 degrees down, flared out
  // X = 1.1 (approx 63 degrees)
  // Z = -0.2 (slight adjustment to prevent "backwards" look)
  rightArm: [1.1 + Math.sin(t * 1) * 0.02, 0, -0.2],
  rightForeArm: [-0.1 + Math.sin(t * 0.7) * 0.02, 0, -0.1], 
  rightHandShape: HAND.RELAXED,

  leftArm: [1.1 + Math.sin(t * 1.2) * 0.02, 0, 0.2],
  leftForeArm: [-0.1 + Math.sin(t * 0.9) * 0.02, 0, 0.1],
  leftHandShape: HAND.RELAXED,

  head: [
    Math.sin(t * 0.5) * 0.05,
    Math.sin(t * 0.3) * 0.04,
    0
  ],
  spine2: [Math.sin(t * 0.8) * 0.02, 0, 0],
});

/* ══════════════════════════════════════════════════════════════════
   ANIMATION STATE MACHINE
   States: 'idle' | 'sign'
   Manages clip-based animations (from GLB/FBX) AND procedural poses
   ══════════════════════════════════════════════════════════════════ */

class AnimationStateMachine {
  constructor() {
    this.currentState = 'idle';
    this.currentAction = null;
    this.mixer = null;
    this.actions = {};        // clip name → THREE.AnimationAction
    this.clips = {};          // clip name → THREE.AnimationClip
  }

  init(mixer, clips) {
    this.mixer = mixer;
    clips.forEach((clip) => {
      this.clips[clip.name] = clip;
      const action = mixer.clipAction(clip);
      action.setEffectiveWeight(0);
      this.actions[clip.name] = action;
    });

    console.log('🎬 AnimationStateMachine: Initialized with', clips.length, 'clips');
    console.log('  Clips:', clips.map(c => c.name).slice(0, 5), '...');

    // Auto-play 'Idle' clip if it exists in the GLB
    if (this.actions['Idle']) {
      this.actions['Idle'].setEffectiveWeight(1);
      this.actions['Idle'].play();
      this.currentAction = this.actions['Idle'];
      console.log('▶️ AnimationStateMachine: Playing Idle clip');
    }
  }

  /** Transition to a named clip with crossfade */
  transitionTo(clipName, fadeDuration = XFADE) {
    const nextAction = this.actions[clipName];
    if (!nextAction || nextAction === this.currentAction) return;

    nextAction.reset();
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (this.currentAction) {
      nextAction.crossFadeFrom(this.currentAction, fadeDuration, true);
    }

    this.currentAction = nextAction;
    this.currentState = clipName;
  }

  /** Transition back to idle clip (if available) */
  toIdle(fadeDuration = XFADE) {
    if (this.actions['Idle']) {
      this.transitionTo('Idle', fadeDuration);
      this.currentState = 'idle';
    } else {
      // No idle clip — just fade out current
      if (this.currentAction) {
        this.currentAction.fadeOut(fadeDuration);
      }
      this.currentState = 'idle';
    }
  }

  update(delta) {
    this.mixer?.update(delta);
  }

  hasClip(name) {
    return !!this.actions[name];
  }
}

/* ══════════════════════════════════════════════════════════════════
   HELPER: Apply hand shape to skeleton finger bones
   ══════════════════════════════════════════════════════════════════ */

const FINGER_KEYS = ['thumb', 'index', 'middle', 'ring', 'pinky'];
const FINGER_BONE_PREFIX = {
  thumb:  'Thumb',
  index:  'Index',
  middle: 'Middle',
  ring:   'Ring',
  pinky:  'Little',
};

function applyHandShape(bones, side, handShape, lr) {
  if (!handShape) return;
  const prefix = side === 'right' ? 'Right' : 'Left';

  for (const finger of FINGER_KEYS) {
    const fd = handShape[finger];
    if (!fd) continue;

    const curlAngle = (fd.curl ?? 0) * (Math.PI / 2);
    const spreadAngle = fd.spread ?? 0;
    const boneName = FINGER_BONE_PREFIX[finger];

    // Distribute curl across 3 joints (33%, 37%, 30%)
    const curls = [curlAngle * 0.33, curlAngle * 0.37, curlAngle * 0.30];

    for (let j = 1; j <= 3; j++) {
      const fullName = `${prefix}Hand${boneName}${j}`;
      const bone = bones[fullName];
      if (!bone) continue;

      const targetX = curls[j - 1];
      const targetZ = j === 1 ? spreadAngle : 0;   // spread only on 1st joint

      bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, targetX, lr);
      bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetZ, lr);
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   HELPER: Apply arm / body pose to skeleton
   ══════════════════════════════════════════════════════════════════ */

function applyProceduralPose(bones, pose, lr) {
  if (!bones || Object.keys(bones).length === 0) return;

  // Arm bones
  const armPairs = [
    ['rightArm',     'RightArm'],
    ['rightForeArm', 'RightForeArm'],
    ['rightWrist',   'RightHand'],
    ['leftArm',      'LeftArm'],
    ['leftForeArm',  'LeftForeArm'],
    ['leftWrist',    'LeftHand'],
  ];

  for (const [poseKey, boneName] of armPairs) {
    const rot = pose[poseKey];
    const bone = bones[boneName];
    if (!rot || !bone) continue;
    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, rot[0], lr);
    bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, rot[1], lr);
    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, rot[2], lr);
  }

  // Head
  if (pose.head && bones.Head) {
    const h = pose.head;
    bones.Head.rotation.x = THREE.MathUtils.lerp(bones.Head.rotation.x, h[0], lr);
    bones.Head.rotation.y = THREE.MathUtils.lerp(bones.Head.rotation.y, h[1], lr);
    bones.Head.rotation.z = THREE.MathUtils.lerp(bones.Head.rotation.z, h[2], lr);
  }

  // Spine2 (upper torso sway)
  if (pose.spine2 && bones.Spine2) {
    const s = pose.spine2;
    bones.Spine2.rotation.x = THREE.MathUtils.lerp(bones.Spine2.rotation.x, s[0], lr);
    bones.Spine2.rotation.y = THREE.MathUtils.lerp(bones.Spine2.rotation.y, s[1], lr);
    bones.Spine2.rotation.z = THREE.MathUtils.lerp(bones.Spine2.rotation.z, s[2], lr);
  }

  // Hands (finger shapes)
  if (pose.rightHandShape) applyHandShape(bones, 'right', pose.rightHandShape, lr);
  if (pose.leftHandShape)  applyHandShape(bones, 'left', pose.leftHandShape, lr);
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT  —  GLB Avatar with Bone-Driven Sign Animation
   Props: currentSign, isAnimating  (same interface as before)
   ══════════════════════════════════════════════════════════════════ */

/* Helper: find a bone by trying multiple naming conventions */
function findBone(map, baseName) {
  // Try exact match first
  if (map[baseName]) return map[baseName];
  // Try common prefixes from Mixamo / RPM exports
  const prefixes = [
    'mixamorig:', 'mixamorig_', 'mixamorig', 
    'Mixamorig:', 'Mixamorig_', 'Mixamorig',
    'Armature_', 'Wolf3D_', 'Bb_', 'Bip01_', ''
  ];
  for (const prefix of prefixes) {
    const key = prefix + baseName;
    if (map[key]) return map[key];
  }
  return null;
}

/* Build a normalized bone map (short name → bone object) */
function buildNormalizedBoneMap(rawMap) {
  const EXPECTED = [
    'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
    'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
    'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
    'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
    'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
  ];
  // Finger bones
  const sides = ['Left', 'Right'];
  const fingers = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];
  for (const side of sides) {
    for (const finger of fingers) {
      for (let i = 1; i <= 3; i++) {
        EXPECTED.push(`${side}Hand${finger}${i}`);
      }
    }
  }

  const normalized = {};
  for (const name of EXPECTED) {
    const bone = findBone(rawMap, name);
    if (bone) normalized[name] = bone;
  }
  return normalized;
}

function AvatarModel({ currentSign, isAnimating }) {
  const groupRef = useRef();
  const timeRef = useRef(0);
  const prevSignRef = useRef(null);
  const smRef = useRef(new AnimationStateMachine());
  const boneWarningsRef = useRef(new Set());

  // ── Load GLB model ──
  const { scene, animations } = useGLTF(MODEL_URL);

  // ── Clone with SkeletonUtils for proper skinned-mesh support ──
  const clonedScene = useMemo(() => {
    try {
      const clone = SkeletonUtils.clone(scene);
      console.log('✅ Scene cloned with SkeletonUtils');
      return clone;
    } catch (e) {
      console.warn('⚠️ SkeletonUtils.clone failed, falling back to scene.clone:', e);
      return scene.clone(true);
    }
  }, [scene]);

  // DEBUG: Visualise skeleton
  useHelper(groupRef, THREE.SkeletonHelper, 'cyan'); 

  // ── Build bone lookup table ──
  const bones = useMemo(() => {
    // Step 1: Collect ALL bone-like objects
    const rawMap = {};
    clonedScene.traverse((obj) => {
      if (obj.isBone) {
        rawMap[obj.name] = obj;
      }
    });

    // Step 2: Also grab from skeleton bindings
    if (Object.keys(rawMap).length === 0) {
      clonedScene.traverse((obj) => {
        if (obj.isSkinnedMesh && obj.skeleton) {
          obj.skeleton.bones.forEach((bone) => {
            rawMap[bone.name] = bone;
          });
        }
      });
    }

    console.log(`🦴 Raw bones found: ${Object.keys(rawMap).length}`);
    if (Object.keys(rawMap).length > 0) {
      console.log('   Names:', Object.keys(rawMap).join(', '));
    } else {
      // Full scene dump for debugging
      console.error('❌ NO BONES FOUND in model!');
      clonedScene.traverse((obj) => {
        console.log(`  ${obj.type}: "${obj.name}"`,
          obj.isBone ? '[BONE]' : '',
          obj.isSkinnedMesh ? '[SKINNED]' : '');
      });
    }

    // Step 3: Normalize names
    const normalized = buildNormalizedBoneMap(rawMap);
    console.log(`🦴 Normalized bones mapped: ${Object.keys(normalized).length}`);
    console.log('   Mapped:', Object.keys(normalized).join(', '));

    // Expose to window for debugging
    window.__avatarBones = {
      rawCount: Object.keys(rawMap).length,
      rawNames: Object.keys(rawMap),
      normalizedCount: Object.keys(normalized).length,
      normalizedNames: Object.keys(normalized),
    };

    return normalized;
  }, [clonedScene]);

  // ── Animation mixer from GLB clips ──
  const mixer = useMemo(() => new THREE.AnimationMixer(clonedScene), [clonedScene]);

  // Initialise state machine with embedded clips
  useEffect(() => {
    smRef.current.init(mixer, animations);
    return () => mixer.stopAllAction();
  }, [mixer, animations]);

  // ── Enable shadows on all meshes ──
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) obj.material.needsUpdate = true;
      }
    });
  }, [clonedScene]);

  // ── Transition when currentSign changes ──
  useEffect(() => {
    const sm = smRef.current;
    const animKey = currentSign?.animation;

    if (!animKey) return;

    // Reset time for each new sign so animations start from t=0
    timeRef.current = 0;
    prevSignRef.current = animKey;

    console.log('🎬 Sign changed →', animKey, '| hasPose:', !!SIGN_POSES[animKey]);

    if (sm.hasClip(animKey)) {
      sm.transitionTo(animKey);
    }
  }, [currentSign]);

  // Return to idle when no sign
  useEffect(() => {
    if (!currentSign && prevSignRef.current) {
      prevSignRef.current = null;
      smRef.current.toIdle();
    }
  }, [currentSign]);

  // ── Per-frame update ──
  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const lr = Math.min(1, LERP_SPEED * delta);   // clamp to avoid overshoot
    const sm = smRef.current;

    // Tick the clip mixer
    sm.update(delta);

    // Determine procedural pose
    const animKey = currentSign?.animation;
    const poseFn = animKey && SIGN_POSES[animKey] ? SIGN_POSES[animKey] : IDLE_SIGN_POSE;
    const pose = poseFn(t);

    // Always apply procedural bone control (unless a clip perfectly covers it)
    const clipPlaying = animKey && sm.hasClip(animKey);
    if (!clipPlaying) {
      const resolved = { ...pose };
      if (resolved.rightHandShape) resolved.rightHandShape = resolveHand(resolved.rightHandShape, t);
      if (resolved.leftHandShape)  resolved.leftHandShape  = resolveHand(resolved.leftHandShape, t);
      applyProceduralPose(bones, resolved, lr);
    } else {
      // Even with a clip, still apply finger shapes procedurally
      const resolved = { ...pose };
      if (resolved.rightHandShape) {
        applyHandShape(bones, 'right', resolveHand(resolved.rightHandShape, t), lr);
      }
      if (resolved.leftHandShape) {
        applyHandShape(bones, 'left', resolveHand(resolved.leftHandShape, t), lr);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRE-LOAD MODEL
   ══════════════════════════════════════════════════════════════════ */
useGLTF.preload(MODEL_URL);

export default AvatarModel;