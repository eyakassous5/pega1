import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import AvatarModel from './AvatarModel';
import './AvatarScene.css';

/** Simple HTML loading spinner shown while the GLB model streams in */
function LoadingFallback() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#94a3b8', fontSize: '1.1rem', fontFamily: 'inherit',
      flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #334155',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Chargement de l'avatar…
    </div>
  );
}

function AvatarScene({ currentSign, isAnimating }) {
  return (
    <div className="avatar-scene" style={{ position: 'relative' }}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 1.4, 2.8], fov: 40 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            console.log('✅ Three.js Canvas created', gl.info);
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight
            position={[-3, 3, -3]}
            intensity={0.4}
            color="#b0d4ff"
          />
          <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffffff" />

          {/* Environment */}
          <Environment preset="studio" />

          {/* GLB Avatar */}
          <AvatarModel
            currentSign={currentSign}
            isAnimating={isAnimating}
          />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.5}
            scale={6}
            blur={2.5}
          />

          {/* Controls */}
          <OrbitControls
            target={[0, 1.2, 0]}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            minDistance={1.2}
            maxDistance={6}
          />
        </Canvas>
      </Suspense>

      {/* CSS keyframe for the spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default AvatarScene;
