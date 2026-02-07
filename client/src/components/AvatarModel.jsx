import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
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

/** Animated wave across all fingers (function of time) */
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
};

/** Default resting pose — subtle idle breathing */
const IDLE_SIGN_POSE = (t) => ({
  rightArm: [0.08 + Math.sin(t * 1) * 0.03, 0, 0.05],
  rightForeArm: [-0.05 + Math.sin(t * 0.7) * 0.02, 0, 0],
  rightHandShape: HAND.RELAXED,
  leftArm: [0.08 + Math.sin(t * 1.2) * 0.03, 0, -0.05],
  leftForeArm: [-0.05 + Math.sin(t * 0.9) * 0.02, 0, 0],
  leftHandShape: HAND.RELAXED,
  head: [
    Math.sin(t * 0.5) * 0.05,  // Increased amplitude
    Math.sin(t * 0.3) * 0.04,  // Increased amplitude
    0
  ],
  spine2: [Math.sin(t * 0.8) * 0.01, 0, 0],  // Slightly increased
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
  const prefixes = ['mixamorig:', 'mixamorig_', 'Armature_', 'Wolf3D_', ''];
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