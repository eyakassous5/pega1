import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ==================================================================
   HAND SHAPE PRESETS
   curl: 0 = straight, 1 = fully curled (≈90° total across 3 joints)
   spread: radians of lateral splay
   ================================================================== */

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

/** Dynamic hand shapes (functions of time) */
const WAVE_FINGERS = (t) => ({
  thumb:  { curl: 0.1, spread: 0.5 },
  index:  { curl: Math.abs(Math.sin(t * 6)) * 0.7, spread: 0.05 },
  middle: { curl: Math.abs(Math.sin(t * 6 + 0.3)) * 0.7, spread: 0 },
  ring:   { curl: Math.abs(Math.sin(t * 6 + 0.6)) * 0.7, spread: -0.05 },
  pinky:  { curl: Math.abs(Math.sin(t * 6 + 0.9)) * 0.7, spread: -0.1 },
});

/** Resolve hand shape — if it's a function, call it with t */
const resolveHand = (h, t) => (typeof h === 'function' ? h(t) : h);

/* ==================================================================
   SIGN ANIMATIONS
   Each key returns a pose object including arms, hand shapes, wrist,
   head, and body. All hand shapes use the HAND preset library above.
   ================================================================== */

const SIGN_ANIMATIONS = {
  sign_bonjour: (t) => ({
    rightUpperArm: { rotation: [-1.2, 0, -0.3 + Math.sin(t * 3) * 0.15] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 4) * 0.3] },
    rightHand: HAND.OPEN_SPREAD,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, 0] },
  }),

  sign_au_revoir: (t) => ({
    rightUpperArm: { rotation: [-1.4, 0, -0.5] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 6) * 0.5, 0] },
    rightHand: WAVE_FINGERS,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [Math.sin(t * 2) * 0.05, 0, 0] },
  }),

  sign_merci: (t) => ({
    rightUpperArm: { rotation: [-0.8, 0, -0.2] },
    rightLowerArm: { rotation: [-0.9, 0, 0] },
    rightWrist: { rotation: [-0.3 + Math.sin(t * 3) * 0.1, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.15, 0, 0] },
  }),

  sign_svp: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 2.5) * 0.2] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_oui: (t) => ({
    rightUpperArm: { rotation: [-0.9, 0, -0.3] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 4) * 0.3, 0, 0] },
    rightHand: HAND.FIST,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [Math.sin(t * 4) * 0.15, 0, 0] },
  }),

  sign_non: (t) => ({
    rightUpperArm: { rotation: [-1.0, 0, -0.3] },
    rightLowerArm: { rotation: [-0.6, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 5) * 0.4] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, Math.sin(t * 4) * 0.2, 0] },
  }),

  sign_comment: (t) => ({
    rightUpperArm: { rotation: [-0.8, 0, -0.5] },
    rightLowerArm: { rotation: [-0.4, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 3) * 0.3, Math.sin(t * 3) * 0.2] },
    rightHand: HAND.OPEN_SPREAD,
    leftUpperArm: { rotation: [-0.8, 0, 0.5] },
    leftLowerArm: { rotation: [-0.4, 0, 0] },
    leftWrist: { rotation: [0, Math.sin(t * 3 + Math.PI) * 0.3, Math.sin(t * 3 + Math.PI) * 0.2] },
    leftHand: HAND.OPEN_SPREAD,
    head: { rotation: [0, 0, Math.sin(t * 2) * 0.05] },
  }),

  sign_ca_va: (t) => ({
    rightUpperArm: { rotation: [-0.9, 0, -0.4] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.1, Math.sin(t * 2) * 0.1, 0] },
  }),

  sign_bien: (t) => ({
    rightUpperArm: { rotation: [-1.0, 0, -0.4] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
  }),

  sign_mal: (t) => ({
    rightUpperArm: { rotation: [-1.0, 0, -0.4] },
    rightLowerArm: { rotation: [-0.3, 0, Math.PI] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [-0.1, 0, Math.sin(t * 1.5) * 0.05] },
  }),

  sign_je: (t) => ({
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_tu: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.1] },
    rightLowerArm: { rotation: [-0.2, 0, 0] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, 0] },
  }),

  sign_il_elle: (t) => ({
    rightUpperArm: { rotation: [-0.6, -0.5, -0.2] },
    rightLowerArm: { rotation: [-0.2, 0, 0] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, -0.2, 0] },
  }),

  sign_nous: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8 + Math.sin(t * 2) * 0.2, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 2) * 0.2, 0] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.05, Math.sin(t * 1.5) * 0.05, 0] },
  }),

  sign_nom: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.3] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 5) * 0.15, 0, 0] },
    rightHand: HAND.HOOK,
    leftUpperArm: { rotation: [-0.5, 0, 0.3] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0, 0, 0] },
  }),

  sign_quoi: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.5] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 3) * 0.2, 0] },
    rightHand: HAND.OPEN_SPREAD,
    leftUpperArm: { rotation: [-0.7, 0, 0.5] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    leftWrist: { rotation: [0, Math.sin(t * 3 + Math.PI) * 0.2, 0] },
    leftHand: HAND.OPEN_SPREAD,
    head: { rotation: [0, 0, Math.sin(t * 2) * 0.08] },
  }),

  sign_ou: (t) => ({
    rightUpperArm: { rotation: [-0.8, Math.sin(t * 3) * 0.3, -0.3] },
    rightLowerArm: { rotation: [-0.2, 0, 0] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, Math.sin(t * 2) * 0.15, 0] },
  }),

  sign_quand: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.2] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 3) * 0.3] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.8, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_pourquoi: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 2) * 0.15, 0, 0] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, Math.sin(t * 1.5) * 0.05] },
  }),

  sign_aide: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: HAND.FIST,
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    leftHand: HAND.FLAT,
    body: { position: [0, Math.sin(t * 2) * 0.03, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_eau: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 3) * 0.1, 0, 0] },
    rightHand: HAND.C_SHAPE,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [-0.1, 0, 0] },
  }),

  sign_manger: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3 + Math.sin(t * 4) * 0.15, 0, 0] },
    rightHand: HAND.PINCH,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [Math.sin(t * 4) * 0.03, 0, 0] },
  }),

  sign_dormir: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.2] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.7, 0, 0.2] },
    leftLowerArm: { rotation: [-1.0, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0.2, 0, 0.25] },
  }),

  sign_toilettes: (t) => ({
    rightUpperArm: { rotation: [-0.9, 0, -0.3] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 4) * 0.2, 0] },
    rightHand: {
      thumb:  { curl: 0, spread: 0.8 },
      index:  { curl: 1, spread: 0 },
      middle: { curl: 1, spread: 0 },
      ring:   { curl: 1, spread: 0 },
      pinky:  { curl: 0, spread: -0.2 },
    },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, 0] },
  }),

  sign_docteur: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-0.9, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 3) * 0.1] },
    rightHand: HAND.HOOK,
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.7, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_douleur: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 5) * 0.2, 0, Math.sin(t * 5) * 0.2] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [-0.7, 0, 0.2] },
    leftLowerArm: { rotation: [-0.8, 0, 0] },
    leftWrist: { rotation: [Math.sin(t * 5 + Math.PI) * 0.2, 0, Math.sin(t * 5 + Math.PI) * 0.2] },
    leftHand: HAND.POINT,
    head: { rotation: [0, 0, Math.sin(t * 3) * 0.08] },
  }),

  sign_aimer: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.3] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightHand: HAND.CLAW,
    leftUpperArm: { rotation: [-0.5, 0, 0.3] },
    leftLowerArm: { rotation: [-1.0, 0, 0] },
    leftHand: HAND.CLAW,
    body: { position: [0, Math.sin(t * 1.5) * 0.02, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_content: (t) => ({
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 3) * 0.15] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.4, 0, 0.1] },
    leftLowerArm: { rotation: [-0.7, 0, 0] },
    leftHand: HAND.FLAT,
    body: { position: [0, Math.abs(Math.sin(t * 2)) * 0.02, 0] },
    head: { rotation: [0.1, 0, Math.sin(t * 2) * 0.05] },
  }),

  sign_triste: (t) => ({
    rightUpperArm: { rotation: [-0.3, 0, -0.1] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    rightHand: HAND.CLAW,
    leftUpperArm: { rotation: [-0.3, 0, 0.1] },
    leftLowerArm: { rotation: [-1.0, 0, 0] },
    leftHand: HAND.CLAW,
    head: { rotation: [0.2, 0, Math.sin(t * 1.5) * 0.03] },
  }),

  sign_peur: (t) => ({
    rightUpperArm: { rotation: [-0.8, 0, -0.5] },
    rightLowerArm: { rotation: [-0.4, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 5) * 0.1] },
    rightHand: HAND.OPEN_SPREAD,
    leftUpperArm: { rotation: [-0.8, 0, 0.5] },
    leftLowerArm: { rotation: [-0.4, 0, 0] },
    leftHand: HAND.OPEN_SPREAD,
    body: { position: [0, 0, Math.sin(t * 5) * 0.02] },
    head: { rotation: [-0.1, 0, 0] },
  }),

  sign_comprendre: (t) => ({
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightWrist: { rotation: [0, 0, t % 2 < 1 ? 0 : 0.2] },
    rightHand: HAND.POINT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
  }),

  sign_pas_comprendre: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 4) * 0.3, 0] },
    rightHand: HAND.OPEN_SPREAD,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, Math.sin(t * 3) * 0.15, 0] },
  }),

  sign_repeter: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightWrist: { rotation: [0, Math.sin(t * 3) * 0.3, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_lentement: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.5 + Math.sin(t * 1.2) * 0.1, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.4, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0, 0, 0] },
  }),

  sign_attendre: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.3] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.6, 0, 0.3] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0, 0, 0] },
  }),

  sign_famille: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.3] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightHand: HAND.C_SHAPE,
    leftUpperArm: { rotation: [-0.7, 0, 0.3] },
    leftLowerArm: { rotation: [-0.5, 0, 0] },
    leftHand: HAND.C_SHAPE,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_pere: (t) => ({
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, 0] },
  }),

  sign_mere: (t) => ({
    rightUpperArm: { rotation: [-0.3, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_enfant: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.3] },
    rightLowerArm: { rotation: [-0.6, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.5, 0, 0.3] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    leftHand: HAND.FLAT,
    body: { position: [0, 0, Math.sin(t * 2) * 0.02] },
    head: { rotation: [0.1, 0, Math.sin(t * 1.5) * 0.05] },
  }),

  sign_ami: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: HAND.HOOK,
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.8, 0, 0] },
    leftHand: HAND.HOOK,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_ecole: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightWrist: { rotation: [Math.sin(t * 5) * 0.2, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.7, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0, 0, 0] },
  }),

  sign_maison: (t) => ({
    rightUpperArm: { rotation: [-1.0, 0, -0.3] },
    rightLowerArm: { rotation: [-0.5, 0, -0.4] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-1.0, 0, 0.3] },
    leftLowerArm: { rotation: [-0.5, 0, 0.4] },
    leftHand: HAND.FLAT,
    head: { rotation: [0, 0, 0] },
  }),

  sign_travail: (t) => ({
    rightUpperArm: { rotation: [-0.7, 0, -0.2] },
    rightLowerArm: { rotation: [-0.6 + Math.sin(t * 4) * 0.2, 0, 0] },
    rightHand: HAND.FIST,
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.5, 0, 0] },
    leftHand: HAND.FIST,
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_apprendre: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.0 + Math.sin(t * 2) * 0.2, 0, 0] },
    rightHand: HAND.CLAW,
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.5, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [Math.sin(t * 1.5) * 0.05, 0, 0] },
  }),

  sign_aujourd_hui: (t) => ({
    rightUpperArm: { rotation: [-0.6, 0, -0.3] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [-0.6, 0, 0.3] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    leftHand: HAND.FLAT,
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_demain: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.1, 0, 0] },
    rightWrist: { rotation: [0, 0, t % 2 < 1 ? 0 : 0.3] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, 0] },
  }),

  sign_hier: (t) => ({
    rightUpperArm: { rotation: [-0.4, 0.5, -0.1] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightHand: HAND.THUMBS_UP,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0.1, 0] },
  }),

  sign_argent: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 4) * 0.2] },
    rightHand: HAND.PINCH,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, 0, 0] },
  }),

  sign_telephone: (t) => ({
    rightUpperArm: { rotation: [-0.5, 0, -0.2] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightWrist: { rotation: [0.1, 0, 0] },
    rightHand: {
      thumb:  { curl: 0, spread: 0.8 },
      index:  { curl: 1, spread: 0 },
      middle: { curl: 1, spread: 0 },
      ring:   { curl: 1, spread: 0 },
      pinky:  { curl: 0, spread: -0.3 },
    },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0, -0.15, Math.sin(t * 2) * 0.03] },
  }),

  sign_excusez: (t) => ({
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-0.9, 0, 0] },
    rightWrist: { rotation: [0, 0, Math.sin(t * 2) * 0.15] },
    rightHand: HAND.FIST,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.15, 0, 0] },
  }),

  sign_bienvenue: (t) => ({
    rightUpperArm: { rotation: [-0.8, 0, -0.5 - Math.sin(t * 2) * 0.2] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: HAND.OPEN_SPREAD,
    leftUpperArm: { rotation: [-0.8, 0, 0.5 + Math.sin(t * 2) * 0.2] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    leftHand: HAND.OPEN_SPREAD,
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_bonsoir: (t) => ({
    rightUpperArm: { rotation: [-1.0, 0, -0.3 + Math.sin(t * 2) * 0.1] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightWrist: { rotation: [0.3, 0, 0] },
    rightHand: HAND.FLAT,
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    leftHand: HAND.RELAXED,
    head: { rotation: [0.1, 0, 0] },
  }),
};

/** Default idle animation with subtle breathing */
const IDLE_POSE = (t) => ({
  rightUpperArm: { rotation: [0.2, 0, 0.1] },
  rightLowerArm: { rotation: [0, 0, 0] },
  rightHand: HAND.RELAXED,
  leftUpperArm: { rotation: [0.2, 0, 0.1] },
  leftLowerArm: { rotation: [0, 0, 0] },
  leftHand: HAND.RELAXED,
  head: { rotation: [Math.sin(t * 0.5) * 0.02, Math.sin(t * 0.3) * 0.02, 0] },
  body: { position: [0, Math.sin(t * 0.8) * 0.005, 0] },
});

/* ==================================================================
   COLORS
   ================================================================== */
const SKIN = '#d4a574';
const SKIN_DARK = '#c49464';
const SHIRT = '#2563eb';
const PANTS = '#1e293b';
const HAIR = '#2d1b0e';
const EYE_COL = '#1a1a2e';

/* ==================================================================
   PROCEDURAL FINGER COMPONENT
   3 capsule segments per finger with independent curl + spread
   ================================================================== */

function Finger({ length = [0.028, 0.022, 0.018], radius = 0.008, curl = 0, spread = 0, material, side = 1 }) {
  const c = curl * (Math.PI / 2);
  const j1 = c * 0.33;
  const j2 = c * 0.37;
  const j3 = c * 0.30;

  return (
    <group rotation={[0, 0, spread * side]}>
      <group rotation={[j1, 0, 0]}>
        <mesh position={[0, -length[0] / 2, 0]} material={material} castShadow>
          <capsuleGeometry args={[radius, length[0], 3, 6]} />
        </mesh>
        <group position={[0, -length[0], 0]} rotation={[j2, 0, 0]}>
          <mesh position={[0, -length[1] / 2, 0]} material={material} castShadow>
            <capsuleGeometry args={[radius * 0.9, length[1], 3, 6]} />
          </mesh>
          <group position={[0, -length[1], 0]} rotation={[j3, 0, 0]}>
            <mesh position={[0, -length[2] / 2, 0]} material={material} castShadow>
              <capsuleGeometry args={[radius * 0.8, length[2], 3, 6]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function ThumbFinger({ length = [0.022, 0.018, 0.015], radius = 0.009, curl = 0, spread = 0, material, side = 1 }) {
  const c = curl * (Math.PI / 2);
  const j1 = c * 0.3;
  const j2 = c * 0.35;
  const j3 = c * 0.35;

  return (
    <group rotation={[0.2, spread * side * 0.7, spread * side]}>
      <group rotation={[j1, 0, 0]}>
        <mesh position={[0, -length[0] / 2, 0]} material={material} castShadow>
          <capsuleGeometry args={[radius, length[0], 3, 6]} />
        </mesh>
        <group position={[0, -length[0], 0]} rotation={[j2, 0, 0]}>
          <mesh position={[0, -length[1] / 2, 0]} material={material} castShadow>
            <capsuleGeometry args={[radius * 0.85, length[1], 3, 6]} />
          </mesh>
          <group position={[0, -length[1], 0]} rotation={[j3, 0, 0]}>
            <mesh position={[0, -length[2] / 2, 0]} material={material} castShadow>
              <capsuleGeometry args={[radius * 0.75, length[2], 3, 6]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ==================================================================
   ARTICULATED HAND COMPONENT
   Palm + 5 fingers (thumb, index, middle, ring, pinky)
   ================================================================== */

function ArticulatedHand({ handShape, material, side = 1, wristRotation = [0, 0, 0] }) {
  const h = handShape || HAND.RELAXED;

  return (
    <group rotation={wristRotation}>
      {/* Palm */}
      <mesh material={material} castShadow>
        <boxGeometry args={[0.07, 0.09, 0.025]} />
      </mesh>

      {/* Thumb */}
      <group position={[side * 0.035, -0.01, 0.008]}>
        <ThumbFinger curl={h.thumb.curl} spread={h.thumb.spread} material={material} side={side} />
      </group>

      {/* Index */}
      <group position={[side * 0.024, -0.048, 0]}>
        <Finger length={[0.028, 0.022, 0.018]} radius={0.007} curl={h.index.curl} spread={h.index.spread} material={material} side={side} />
      </group>

      {/* Middle */}
      <group position={[side * 0.008, -0.05, 0]}>
        <Finger length={[0.032, 0.024, 0.019]} radius={0.007} curl={h.middle.curl} spread={h.middle.spread} material={material} side={side} />
      </group>

      {/* Ring */}
      <group position={[-side * 0.008, -0.048, 0]}>
        <Finger length={[0.029, 0.022, 0.017]} radius={0.0065} curl={h.ring.curl} spread={h.ring.spread} material={material} side={side} />
      </group>

      {/* Pinky */}
      <group position={[-side * 0.024, -0.043, 0]}>
        <Finger length={[0.022, 0.017, 0.014]} radius={0.006} curl={h.pinky.curl} spread={h.pinky.spread} material={material} side={side} />
      </group>
    </group>
  );
}

/* ==================================================================
   MAIN AVATAR COMPONENT
   Drop-in replacement — same interface: currentSign, isAnimating
   ================================================================== */

function AvatarModel({ currentSign, isAnimating }) {
  const groupRef = useRef();
  const timeRef = useRef(0);

  // Body part refs for smooth lerp
  const bodyRef = useRef();
  const headRef = useRef();
  const rUpperArmRef = useRef();
  const rLowerArmRef = useRef();
  const lUpperArmRef = useRef();
  const lLowerArmRef = useRef();

  // Interpolated hand states
  const rHandRef = useRef({ ...HAND.RELAXED });
  const lHandRef = useRef({ ...HAND.RELAXED });
  const rWristRef = useRef([0, 0, 0]);
  const lWristRef = useRef([0, 0, 0]);

  // Trigger re-render each frame so Hand components pick up interpolated values
  const [, setFrame] = useState(0);

  // Materials (memoised — created once)
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7 }), []);
  const skinDarkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_DARK, roughness: 0.8 }), []);
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.6 }), []);
  const pantsMat = useMemo(() => new THREE.MeshStandardMaterial({ color: PANTS, roughness: 0.7 }), []);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.9 }), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: EYE_COL }), []);
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b4a4a', roughness: 0.5 }), []);

  const LERP_SPEED = 5;

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const lr = LERP_SPEED * delta;

    // Determine animation function
    const animFn =
      currentSign && SIGN_ANIMATIONS[currentSign.animation]
        ? SIGN_ANIMATIONS[currentSign.animation]
        : IDLE_POSE;

    const pose = animFn(t);

    // --- Lerp body part rotations ---
    const lerpRot = (ref, target) => {
      if (!ref.current) return;
      const r = target?.rotation || [0, 0, 0];
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, r[0], lr);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, r[1], lr);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, r[2], lr);
    };

    lerpRot(headRef, pose.head);
    lerpRot(rUpperArmRef, pose.rightUpperArm || { rotation: [0.2, 0, 0.1] });
    lerpRot(rLowerArmRef, pose.rightLowerArm);
    lerpRot(lUpperArmRef, pose.leftUpperArm || { rotation: [0.2, 0, 0.1] });
    lerpRot(lLowerArmRef, pose.leftLowerArm);

    // Body subtle movement
    if (bodyRef.current) {
      const by = pose.body?.position?.[1] ?? 0;
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, by, lr);
    }

    // --- Lerp hand shapes (per-finger curl + spread) ---
    const lerpHand = (stateRef, target) => {
      const tgt = resolveHand(target, t) || HAND.RELAXED;
      const cur = stateRef.current;
      const out = {};
      for (const f of ['thumb', 'index', 'middle', 'ring', 'pinky']) {
        out[f] = {
          curl: THREE.MathUtils.lerp(cur[f]?.curl ?? 0.1, tgt[f]?.curl ?? 0.1, lr),
          spread: THREE.MathUtils.lerp(cur[f]?.spread ?? 0, tgt[f]?.spread ?? 0, lr),
        };
      }
      stateRef.current = out;
    };

    lerpHand(rHandRef, pose.rightHand);
    lerpHand(lHandRef, pose.leftHand);

    // --- Lerp wrist rotation ---
    const lerpWrist = (stateRef, target) => {
      const r = target?.rotation || [0, 0, 0];
      stateRef.current = stateRef.current.map((v, i) => THREE.MathUtils.lerp(v, r[i], lr));
    };
    lerpWrist(rWristRef, pose.rightWrist);
    lerpWrist(lWristRef, pose.leftWrist);

    // Force React re-render so Hand components get updated values
    setFrame((f) => f + 1);
  });

  // Read current interpolated values for render
  const rH = rHandRef.current;
  const lH = lHandRef.current;

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>

        {/* ========== TORSO ========== */}
        <mesh position={[0, 1.05, 0]} material={shirtMat} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.3]} />
        </mesh>
        {/* Belt / waist */}
        <mesh position={[0, 0.72, 0]} material={pantsMat} castShadow>
          <boxGeometry args={[0.5, 0.15, 0.28]} />
        </mesh>

        {/* ========== NECK ========== */}
        <mesh position={[0, 1.38, 0]} material={skinMat} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.08, 8]} />
        </mesh>

        {/* ========== HEAD ========== */}
        <group ref={headRef} position={[0, 1.55, 0]}>
          <mesh material={skinMat} castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 0.06, -0.02]} material={hairMat} castShadow>
            <sphereGeometry args={[0.185, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Eyebrows */}
          <mesh position={[-0.065, 0.055, 0.155]} material={hairMat}>
            <boxGeometry args={[0.04, 0.008, 0.01]} />
          </mesh>
          <mesh position={[0.065, 0.055, 0.155]} material={hairMat}>
            <boxGeometry args={[0.04, 0.008, 0.01]} />
          </mesh>
          {/* Eye whites */}
          <mesh position={[-0.065, 0.02, 0.155]} material={whiteMat}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
          <mesh position={[0.065, 0.02, 0.155]} material={whiteMat}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
          {/* Pupils */}
          <mesh position={[-0.065, 0.02, 0.175]} material={eyeMat}>
            <sphereGeometry args={[0.015, 8, 8]} />
          </mesh>
          <mesh position={[0.065, 0.02, 0.175]} material={eyeMat}>
            <sphereGeometry args={[0.015, 8, 8]} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.02, 0.17]} material={skinDarkMat}>
            <sphereGeometry args={[0.02, 8, 8]} />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, -0.065, 0.16]} material={mouthMat}>
            <boxGeometry args={[0.06, 0.012, 0.02]} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.18, 0, 0]} material={skinMat}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
          <mesh position={[0.18, 0, 0]} material={skinMat}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        </group>

        {/* ========== RIGHT ARM ========== */}
        <group position={[-0.35, 1.2, 0]}>
          {/* Shoulder joint */}
          <mesh material={shirtMat} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
          <group ref={rUpperArmRef}>
            {/* Upper arm */}
            <mesh position={[0, -0.15, 0]} material={shirtMat} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
            </mesh>
            <group position={[0, -0.3, 0]}>
              {/* Elbow joint */}
              <mesh material={skinMat}>
                <sphereGeometry args={[0.04, 8, 8]} />
              </mesh>
              <group ref={rLowerArmRef}>
                {/* Forearm */}
                <mesh position={[0, -0.14, 0]} material={skinMat} castShadow>
                  <capsuleGeometry args={[0.04, 0.18, 4, 8]} />
                </mesh>
                {/* ARTICULATED RIGHT HAND */}
                <group position={[0, -0.28, 0]}>
                  <ArticulatedHand handShape={rH} material={skinMat} side={-1} wristRotation={rWristRef.current} />
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ========== LEFT ARM ========== */}
        <group position={[0.35, 1.2, 0]}>
          <mesh material={shirtMat} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
          <group ref={lUpperArmRef}>
            <mesh position={[0, -0.15, 0]} material={shirtMat} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
            </mesh>
            <group position={[0, -0.3, 0]}>
              <mesh material={skinMat}>
                <sphereGeometry args={[0.04, 8, 8]} />
              </mesh>
              <group ref={lLowerArmRef}>
                <mesh position={[0, -0.14, 0]} material={skinMat} castShadow>
                  <capsuleGeometry args={[0.04, 0.18, 4, 8]} />
                </mesh>
                {/* ARTICULATED LEFT HAND */}
                <group position={[0, -0.28, 0]}>
                  <ArticulatedHand handShape={lH} material={skinMat} side={1} wristRotation={lWristRef.current} />
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ========== RIGHT LEG ========== */}
        <group position={[-0.13, 0.62, 0]}>
          <mesh position={[0, -0.2, 0]} material={pantsMat} castShadow>
            <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0]} material={pantsMat} castShadow>
            <capsuleGeometry args={[0.055, 0.25, 4, 8]} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.72, 0.03]} material={eyeMat} castShadow>
            <boxGeometry args={[0.1, 0.06, 0.16]} />
          </mesh>
        </group>

        {/* ========== LEFT LEG ========== */}
        <group position={[0.13, 0.62, 0]}>
          <mesh position={[0, -0.2, 0]} material={pantsMat} castShadow>
            <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0]} material={pantsMat} castShadow>
            <capsuleGeometry args={[0.055, 0.25, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.72, 0.03]} material={eyeMat} castShadow>
            <boxGeometry args={[0.1, 0.06, 0.16]} />
          </mesh>
        </group>

        {/* Invisible ground for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}

export default AvatarModel;