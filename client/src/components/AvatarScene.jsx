import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import AvatarModel from './AvatarModel';
import './AvatarScene.css';

function AvatarScene({ currentSign, isAnimating }) {
  return (
    <div className="avatar-scene">
      <Canvas
        camera={{ position: [0, 1.2, 2.5], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight
            position={[-3, 3, -3]}
            intensity={0.3}
            color="#b0d4ff"
          />
          <pointLight position={[0, 3, 0]} intensity={0.4} color="#ffffff" />

          {/* Environment */}
          <Environment preset="studio" />

          {/* Avatar */}
          <AvatarModel
            currentSign={currentSign}
            isAnimating={isAnimating}
          />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.4}
            scale={5}
            blur={2}
          />

          {/* Controls */}
          <OrbitControls
            target={[0, 1, 0]}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            minDistance={1.5}
            maxDistance={5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default AvatarScene;
