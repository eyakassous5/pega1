import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Procedural humanoid avatar with programmatic sign language animations.
 * No external 3D model required — perfect for hackathon MVP.
 *
 * Each sign is mapped to a function that returns target poses for body parts.
 * The avatar smoothly interpolates between poses using lerp.
 */

// ==================== SIGN ANIMATION DEFINITIONS ====================
// Each animation fn returns target rotations/positions for body parts
// Coordinate system: x=pitch, y=yaw, z=roll

const SIGN_ANIMATIONS = {
  sign_bonjour: (t) => ({
    label: 'Bonjour',
    rightUpperArm: { rotation: [-1.2, 0, -0.3 + Math.sin(t * 3) * 0.15] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 4) * 0.3] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_au_revoir: (t) => ({
    label: 'Au revoir',
    rightUpperArm: { rotation: [-1.4, 0, -0.5] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 6) * 0.5, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [Math.sin(t * 2) * 0.05, 0, 0] },
  }),

  sign_merci: (t) => ({
    label: 'Merci',
    rightUpperArm: { rotation: [-0.8, 0, -0.2] },
    rightLowerArm: { rotation: [-0.9, 0, 0] },
    rightHand: { rotation: [-0.3 + Math.sin(t * 3) * 0.1, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.15, 0, 0] },
  }),

  sign_svp: (t) => ({
    label: "S'il vous plaît",
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 2.5) * 0.2] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_oui: (t) => ({
    label: 'Oui',
    rightUpperArm: { rotation: [-0.9, 0, -0.3] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 4) * 0.3, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [Math.sin(t * 4) * 0.15, 0, 0] },
  }),

  sign_non: (t) => ({
    label: 'Non',
    rightUpperArm: { rotation: [-1.0, 0, -0.3] },
    rightLowerArm: { rotation: [-0.6, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 5) * 0.4] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, Math.sin(t * 4) * 0.2, 0] },
  }),

  sign_comment: (t) => ({
    label: 'Comment',
    rightUpperArm: { rotation: [-0.8, 0, -0.5] },
    rightLowerArm: { rotation: [-0.4, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 3) * 0.3, Math.sin(t * 3) * 0.2] },
    leftUpperArm: { rotation: [-0.8, 0, 0.5] },
    leftLowerArm: { rotation: [-0.4, 0, 0] },
    leftHand: { rotation: [0, Math.sin(t * 3 + Math.PI) * 0.3, Math.sin(t * 3 + Math.PI) * 0.2] },
    head: { rotation: [0, 0, Math.sin(t * 2) * 0.05] },
  }),

  sign_ca_va: (t) => ({
    label: 'Ça va',
    rightUpperArm: { rotation: [-0.9, 0, -0.4] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.1, Math.sin(t * 2) * 0.1, 0] },
  }),

  sign_bien: (t) => ({
    label: 'Bien',
    rightUpperArm: { rotation: [-1.0, 0, -0.4] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
  }),

  sign_mal: (t) => ({
    label: 'Mal',
    rightUpperArm: { rotation: [-1.0, 0, -0.4] },
    rightLowerArm: { rotation: [-0.3, 0, Math.PI] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [-0.1, 0, Math.sin(t * 1.5) * 0.05] },
  }),

  sign_je: (t) => ({
    label: 'Je / Moi',
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_tu: (t) => ({
    label: 'Tu / Toi',
    rightUpperArm: { rotation: [-0.7, 0, -0.1] },
    rightLowerArm: { rotation: [-0.2, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_il_elle: (t) => ({
    label: 'Il / Elle',
    rightUpperArm: { rotation: [-0.6, -0.5, -0.2] },
    rightLowerArm: { rotation: [-0.2, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, -0.2, 0] },
  }),

  sign_nous: (t) => ({
    label: 'Nous',
    rightUpperArm: { rotation: [-0.5, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8 + Math.sin(t * 2) * 0.2, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 2) * 0.2, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.05, Math.sin(t * 1.5) * 0.05, 0] },
  }),

  sign_nom: (t) => ({
    label: 'Nom',
    rightUpperArm: { rotation: [-0.7, 0, -0.3] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 5) * 0.15, 0, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.3] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_quoi: (t) => ({
    label: 'Quoi',
    rightUpperArm: { rotation: [-0.7, 0, -0.5] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 3) * 0.2, 0] },
    leftUpperArm: { rotation: [-0.7, 0, 0.5] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    leftHand: { rotation: [0, Math.sin(t * 3 + Math.PI) * 0.2, 0] },
    head: { rotation: [0, 0, Math.sin(t * 2) * 0.08] },
  }),

  sign_ou: (t) => ({
    label: 'Où',
    rightUpperArm: { rotation: [-0.8, Math.sin(t * 3) * 0.3, -0.3] },
    rightLowerArm: { rotation: [-0.2, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, Math.sin(t * 2) * 0.15, 0] },
  }),

  sign_quand: (t) => ({
    label: 'Quand',
    rightUpperArm: { rotation: [-0.5, 0, -0.2] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 3) * 0.3] },
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.8, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_pourquoi: (t) => ({
    label: 'Pourquoi',
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightHand: { rotation: [0 + Math.sin(t * 2) * 0.15, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, Math.sin(t * 1.5) * 0.05] },
  }),

  sign_aide: (t) => ({
    label: 'Aide',
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    leftHand: { rotation: [0, 0, 0] },
    body: { position: [0, Math.sin(t * 2) * 0.03, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_eau: (t) => ({
    label: 'Eau',
    rightUpperArm: { rotation: [-0.6, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 3) * 0.1, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [-0.1, 0, 0] },
  }),

  sign_manger: (t) => ({
    label: 'Manger',
    rightUpperArm: { rotation: [-0.6, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3 + Math.sin(t * 4) * 0.15, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [Math.sin(t * 4) * 0.03, 0, 0] },
  }),

  sign_dormir: (t) => ({
    label: 'Dormir',
    rightUpperArm: { rotation: [-0.7, 0, -0.2] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [-0.7, 0, 0.2] },
    leftLowerArm: { rotation: [-1.0, 0, 0] },
    leftHand: { rotation: [0, 0, 0] },
    head: { rotation: [0.2, 0, 0.25] },
  }),

  sign_toilettes: (t) => ({
    label: 'Toilettes',
    rightUpperArm: { rotation: [-0.9, 0, -0.3] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 4) * 0.2, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_docteur: (t) => ({
    label: 'Docteur',
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-0.9, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 3) * 0.1] },
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.7, 0, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_douleur: (t) => ({
    label: 'Douleur',
    rightUpperArm: { rotation: [-0.7, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 5) * 0.2, 0, Math.sin(t * 5) * 0.2] },
    leftUpperArm: { rotation: [-0.7, 0, 0.2] },
    leftLowerArm: { rotation: [-0.8, 0, 0] },
    leftHand: { rotation: [Math.sin(t * 5 + Math.PI) * 0.2, 0, Math.sin(t * 5 + Math.PI) * 0.2] },
    head: { rotation: [0, 0, Math.sin(t * 3) * 0.08] },
  }),

  sign_aimer: (t) => ({
    label: 'Aimer',
    rightUpperArm: { rotation: [-0.5, 0, -0.3] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.3] },
    leftLowerArm: { rotation: [-1.0, 0, 0] },
    leftHand: { rotation: [0, 0, 0] },
    body: { position: [0, Math.sin(t * 1.5) * 0.02, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_content: (t) => ({
    label: 'Content',
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 3) * 0.15] },
    leftUpperArm: { rotation: [-0.4, 0, 0.1] },
    leftLowerArm: { rotation: [-0.7, 0, 0] },
    body: { position: [0, Math.abs(Math.sin(t * 2)) * 0.02, 0] },
    head: { rotation: [0.1, 0, Math.sin(t * 2) * 0.05] },
  }),

  sign_triste: (t) => ({
    label: 'Triste',
    rightUpperArm: { rotation: [-0.3, 0, -0.1] },
    rightLowerArm: { rotation: [-1.0, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    leftUpperArm: { rotation: [-0.3, 0, 0.1] },
    leftLowerArm: { rotation: [-1.0, 0, 0] },
    head: { rotation: [0.2, 0, Math.sin(t * 1.5) * 0.03] },
  }),

  sign_peur: (t) => ({
    label: 'Peur',
    rightUpperArm: { rotation: [-0.8, 0, -0.5] },
    rightLowerArm: { rotation: [-0.4, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 5) * 0.1] },
    leftUpperArm: { rotation: [-0.8, 0, 0.5] },
    leftLowerArm: { rotation: [-0.4, 0, 0] },
    leftHand: { rotation: [0, 0, Math.sin(t * 5 + 1) * 0.1] },
    body: { position: [0, 0, Math.sin(t * 5) * 0.02] },
    head: { rotation: [-0.1, 0, 0] },
  }),

  sign_comprendre: (t) => ({
    label: 'Comprendre',
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightHand: { rotation: [0, 0, t < 0.5 ? 0 : 0.2] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
  }),

  sign_pas_comprendre: (t) => ({
    label: 'Pas comprendre',
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 4) * 0.3, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, Math.sin(t * 3) * 0.15, 0] },
  }),

  sign_repeter: (t) => ({
    label: 'Répéter',
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightHand: { rotation: [0, Math.sin(t * 3) * 0.3, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_lentement: (t) => ({
    label: 'Lentement',
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.5 + Math.sin(t * 1.2) * 0.1, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.4, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_attendre: (t) => ({
    label: 'Attendre',
    rightUpperArm: { rotation: [-0.6, 0, -0.3] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    leftUpperArm: { rotation: [-0.6, 0, 0.3] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    leftHand: { rotation: [Math.sin(t * 2 + Math.PI) * 0.1, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_famille: (t) => ({
    label: 'Famille',
    rightUpperArm: { rotation: [-0.7, 0, -0.3] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
    leftUpperArm: { rotation: [-0.7, 0, 0.3] },
    leftLowerArm: { rotation: [-0.5, 0, 0] },
    leftHand: { rotation: [0, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_pere: (t) => ({
    label: 'Père',
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_mere: (t) => ({
    label: 'Mère',
    rightUpperArm: { rotation: [-0.3, 0, -0.1] },
    rightLowerArm: { rotation: [-1.2, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 2) * 0.1, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_enfant: (t) => ({
    label: 'Enfant',
    rightUpperArm: { rotation: [-0.5, 0, -0.3] },
    rightLowerArm: { rotation: [-0.6, 0, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.3] },
    leftLowerArm: { rotation: [-0.6, 0, 0] },
    body: { position: [0, 0, Math.sin(t * 2) * 0.02] },
    head: { rotation: [0.1, 0, Math.sin(t * 1.5) * 0.05] },
  }),

  sign_ami: (t) => ({
    label: 'Ami',
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.8, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_ecole: (t) => ({
    label: 'École',
    rightUpperArm: { rotation: [-0.6, 0, -0.2] },
    rightLowerArm: { rotation: [-0.7, 0, 0] },
    rightHand: { rotation: [Math.sin(t * 5) * 0.2, 0, 0] },
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.7, 0, 0] },
    leftHand: { rotation: [Math.sin(t * 5 + Math.PI) * 0.2, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_maison: (t) => ({
    label: 'Maison',
    rightUpperArm: { rotation: [-1.0, 0, -0.3] },
    rightLowerArm: { rotation: [-0.5, 0, -0.4] },
    leftUpperArm: { rotation: [-1.0, 0, 0.3] },
    leftLowerArm: { rotation: [-0.5, 0, 0.4] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_travail: (t) => ({
    label: 'Travail',
    rightUpperArm: { rotation: [-0.7, 0, -0.2] },
    rightLowerArm: { rotation: [-0.6 + Math.sin(t * 4) * 0.2, 0, 0] },
    leftUpperArm: { rotation: [-0.6, 0, 0.2] },
    leftLowerArm: { rotation: [-0.5, 0, 0] },
    head: { rotation: [0.05, 0, 0] },
  }),

  sign_apprendre: (t) => ({
    label: 'Apprendre',
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.0 + Math.sin(t * 2) * 0.2, 0, 0] },
    leftUpperArm: { rotation: [-0.5, 0, 0.2] },
    leftLowerArm: { rotation: [-0.5, 0, 0] },
    head: { rotation: [Math.sin(t * 1.5) * 0.05, 0, 0] },
  }),

  sign_aujourd_hui: (t) => ({
    label: "Aujourd'hui",
    rightUpperArm: { rotation: [-0.6, 0, -0.3] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    leftUpperArm: { rotation: [-0.6, 0, 0.3] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_demain: (t) => ({
    label: 'Demain',
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-1.1, 0, 0] },
    rightHand: { rotation: [0, 0, t < 0.5 ? 0 : 0.3] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_hier: (t) => ({
    label: 'Hier',
    rightUpperArm: { rotation: [-0.4, 0.5, -0.1] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0.1, 0] },
  }),

  sign_argent: (t) => ({
    label: 'Argent',
    rightUpperArm: { rotation: [-0.5, 0, -0.1] },
    rightLowerArm: { rotation: [-0.8, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 4) * 0.2] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, 0, 0] },
  }),

  sign_telephone: (t) => ({
    label: 'Téléphone',
    rightUpperArm: { rotation: [-0.5, 0, -0.2] },
    rightLowerArm: { rotation: [-1.3, 0, 0] },
    rightHand: { rotation: [0.1, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0, -0.15, Math.sin(t * 2) * 0.03] },
  }),

  sign_excusez: (t) => ({
    label: 'Excusez-moi',
    rightUpperArm: { rotation: [-0.4, 0, -0.1] },
    rightLowerArm: { rotation: [-0.9, 0, 0] },
    rightHand: { rotation: [0, 0, Math.sin(t * 2) * 0.15] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.15, 0, 0] },
  }),

  sign_bienvenue: (t) => ({
    label: 'Bienvenue',
    rightUpperArm: { rotation: [-0.8, 0, -0.5 - Math.sin(t * 2) * 0.2] },
    rightLowerArm: { rotation: [-0.3, 0, 0] },
    leftUpperArm: { rotation: [-0.8, 0, 0.5 + Math.sin(t * 2) * 0.2] },
    leftLowerArm: { rotation: [-0.3, 0, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),

  sign_bonsoir: (t) => ({
    label: 'Bonsoir',
    rightUpperArm: { rotation: [-1.0, 0, -0.3 + Math.sin(t * 2) * 0.1] },
    rightLowerArm: { rotation: [-0.5, 0, 0] },
    rightHand: { rotation: [0.3, 0, 0] },
    leftUpperArm: { rotation: [0.2, 0, 0.1] },
    leftLowerArm: { rotation: [0, 0, 0] },
    head: { rotation: [0.1, 0, 0] },
  }),
};

// Idle animation
const IDLE_POSE = (t) => ({
  rightUpperArm: { rotation: [0.2, 0, 0.1] },
  rightLowerArm: { rotation: [0, 0, 0] },
  rightHand: { rotation: [0, 0, 0] },
  leftUpperArm: { rotation: [0.2, 0, 0.1] },
  leftLowerArm: { rotation: [0, 0, 0] },
  leftHand: { rotation: [0, 0, 0] },
  head: { rotation: [Math.sin(t * 0.5) * 0.02, Math.sin(t * 0.3) * 0.02, 0] },
  body: { position: [0, Math.sin(t * 0.8) * 0.005, 0] },
});

// ==================== MATERIALS ====================

const SKIN_COLOR = '#d4a574';
const SKIN_COLOR_DARK = '#c49464';
const SHIRT_COLOR = '#2563eb';
const PANTS_COLOR = '#1e293b';
const HAIR_COLOR = '#2d1b0e';
const EYE_COLOR = '#1a1a2e';

// ==================== AVATAR COMPONENT ====================

function AvatarModel({ currentSign, isAnimating }) {
  const groupRef = useRef();
  const timeRef = useRef(0);
  const lerpSpeed = 5;

  // Refs for all animated parts
  const headRef = useRef();
  const bodyRef = useRef();
  const rightUpperArmRef = useRef();
  const rightLowerArmRef = useRef();
  const rightHandRef = useRef();
  const leftUpperArmRef = useRef();
  const leftLowerArmRef = useRef();
  const leftHandRef = useRef();

  // Materials
  const skinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SKIN_COLOR, roughness: 0.7 }),
    []
  );
  const skinDarkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SKIN_COLOR_DARK, roughness: 0.8 }),
    []
  );
  const shirtMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SHIRT_COLOR, roughness: 0.6 }),
    []
  );
  const pantsMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PANTS_COLOR, roughness: 0.7 }),
    []
  );
  const hairMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HAIR_COLOR, roughness: 0.9 }),
    []
  );
  const eyeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: EYE_COLOR }),
    []
  );
  const whiteMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }),
    []
  );
  const mouthMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8b4a4a', roughness: 0.5 }),
    []
  );

  // Animation frame
  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Get target pose
    const animFn =
      currentSign && SIGN_ANIMATIONS[currentSign.animation]
        ? SIGN_ANIMATIONS[currentSign.animation]
        : IDLE_POSE;

    const pose = animFn(t);

    // Smoothly lerp each body part toward target
    const lerpPart = (ref, poseData, defaultRot = [0, 0, 0]) => {
      if (!ref.current || !poseData) return;
      const target = poseData.rotation || defaultRot;
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        target[0],
        lerpSpeed * delta
      );
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        target[1],
        lerpSpeed * delta
      );
      ref.current.rotation.z = THREE.MathUtils.lerp(
        ref.current.rotation.z,
        target[2],
        lerpSpeed * delta
      );
    };

    lerpPart(headRef, pose.head);
    lerpPart(
      rightUpperArmRef,
      pose.rightUpperArm || { rotation: [0.2, 0, 0.1] }
    );
    lerpPart(rightLowerArmRef, pose.rightLowerArm);
    lerpPart(rightHandRef, pose.rightHand);
    lerpPart(
      leftUpperArmRef,
      pose.leftUpperArm || { rotation: [0.2, 0, 0.1] }
    );
    lerpPart(leftLowerArmRef, pose.leftLowerArm);
    lerpPart(leftHandRef, pose.leftHand);

    // Body position (breathing/movement)
    if (bodyRef.current && pose.body?.position) {
      const targetY = pose.body.position[1] || 0;
      bodyRef.current.position.y = THREE.MathUtils.lerp(
        bodyRef.current.position.y,
        targetY,
        lerpSpeed * delta
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={bodyRef}>
        {/* ===== TORSO ===== */}
        {/* Upper body (shirt) */}
        <mesh position={[0, 1.05, 0]} material={shirtMaterial} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.3]} />
        </mesh>
        {/* Lower body (pants waist) */}
        <mesh position={[0, 0.72, 0]} material={pantsMaterial} castShadow>
          <boxGeometry args={[0.5, 0.15, 0.28]} />
        </mesh>

        {/* ===== NECK ===== */}
        <mesh position={[0, 1.38, 0]} material={skinMaterial} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.08, 8]} />
        </mesh>

        {/* ===== HEAD ===== */}
        <group ref={headRef} position={[0, 1.55, 0]}>
          {/* Head sphere */}
          <mesh material={skinMaterial} castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 0.06, -0.02]} material={hairMaterial} castShadow>
            <sphereGeometry args={[0.185, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.065, 0.02, 0.155]} material={whiteMaterial}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
          <mesh position={[0.065, 0.02, 0.155]} material={whiteMaterial}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
          {/* Pupils */}
          <mesh position={[-0.065, 0.02, 0.175]} material={eyeMaterial}>
            <sphereGeometry args={[0.015, 8, 8]} />
          </mesh>
          <mesh position={[0.065, 0.02, 0.175]} material={eyeMaterial}>
            <sphereGeometry args={[0.015, 8, 8]} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.02, 0.17]} material={skinDarkMaterial}>
            <sphereGeometry args={[0.02, 8, 8]} />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, -0.065, 0.16]} material={mouthMaterial}>
            <boxGeometry args={[0.06, 0.012, 0.02]} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.18, 0, 0]} material={skinMaterial}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
          <mesh position={[0.18, 0, 0]} material={skinMaterial}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        </group>

        {/* ===== RIGHT ARM ===== */}
        <group position={[-0.35, 1.2, 0]}>
          {/* Shoulder */}
          <mesh material={shirtMaterial} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
          <group ref={rightUpperArmRef}>
            {/* Upper arm */}
            <mesh position={[0, -0.15, 0]} material={shirtMaterial} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
            </mesh>
            {/* Elbow */}
            <group position={[0, -0.3, 0]}>
              <mesh material={skinMaterial}>
                <sphereGeometry args={[0.04, 8, 8]} />
              </mesh>
              <group ref={rightLowerArmRef}>
                {/* Lower arm */}
                <mesh position={[0, -0.14, 0]} material={skinMaterial} castShadow>
                  <capsuleGeometry args={[0.04, 0.18, 4, 8]} />
                </mesh>
                {/* Hand */}
                <group ref={rightHandRef} position={[0, -0.3, 0]}>
                  <mesh material={skinMaterial} castShadow>
                    <boxGeometry args={[0.08, 0.1, 0.04]} />
                  </mesh>
                  {/* Fingers hint */}
                  <mesh position={[0, -0.07, 0]} material={skinDarkMaterial}>
                    <boxGeometry args={[0.07, 0.04, 0.035]} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ===== LEFT ARM ===== */}
        <group position={[0.35, 1.2, 0]}>
          <mesh material={shirtMaterial} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
          <group ref={leftUpperArmRef}>
            <mesh position={[0, -0.15, 0]} material={shirtMaterial} castShadow>
              <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
            </mesh>
            <group position={[0, -0.3, 0]}>
              <mesh material={skinMaterial}>
                <sphereGeometry args={[0.04, 8, 8]} />
              </mesh>
              <group ref={leftLowerArmRef}>
                <mesh position={[0, -0.14, 0]} material={skinMaterial} castShadow>
                  <capsuleGeometry args={[0.04, 0.18, 4, 8]} />
                </mesh>
                <group ref={leftHandRef} position={[0, -0.3, 0]}>
                  <mesh material={skinMaterial} castShadow>
                    <boxGeometry args={[0.08, 0.1, 0.04]} />
                  </mesh>
                  <mesh position={[0, -0.07, 0]} material={skinDarkMaterial}>
                    <boxGeometry args={[0.07, 0.04, 0.035]} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* ===== LEGS ===== */}
        {/* Right leg */}
        <group position={[-0.13, 0.62, 0]}>
          <mesh position={[0, -0.2, 0]} material={pantsMaterial} castShadow>
            <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0]} material={pantsMaterial} castShadow>
            <capsuleGeometry args={[0.055, 0.25, 4, 8]} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.72, 0.03]} material={eyeMaterial} castShadow>
            <boxGeometry args={[0.1, 0.06, 0.16]} />
          </mesh>
        </group>

        {/* Left leg */}
        <group position={[0.13, 0.62, 0]}>
          <mesh position={[0, -0.2, 0]} material={pantsMaterial} castShadow>
            <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.5, 0]} material={pantsMaterial} castShadow>
            <capsuleGeometry args={[0.055, 0.25, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.72, 0.03]} material={eyeMaterial} castShadow>
            <boxGeometry args={[0.1, 0.06, 0.16]} />
          </mesh>
        </group>

        {/* ===== GROUND PLANE (invisible) ===== */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}

export default AvatarModel;
