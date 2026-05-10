'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// High Fidelity Model component using FBX
function HighFidelityModel({ motionId, color = '#10B981' }) {
  const isBatting = motionId.startsWith('batting');
  const modelPath = isBatting ? '/models/batting.fbx' : '/models/pitching.fbx';
  const fbx = useFBX(modelPath);
  const { actions, names } = useAnimations(fbx.animations, fbx);

  useEffect(() => {
    if (names.length > 0) {
      // Play the first animation found
      const animationName = names[0];
      const action = actions[animationName];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
    }
    
    // Apply color overlay for a professional "analysis" look
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.6,
          roughness: 0.4,
          transparent: true,
          opacity: 0.9
        });
      }
    });
  }, [fbx, actions, names, color]);

  return <primitive object={fbx} scale={0.01} position={[0, -1.5, 0]} />;
}

export default function MotionViewer3D({ correctMotionId }) {
  const motionTitles = {
    'batting_stance': 'Pro Batting Stance',
    'batting_swing': 'Pro Batting Swing',
    'pitching_windup': 'Pro Pitching Windup',
    'pitching_stride': 'Pro Pitching Stride',
    'default': 'Pro Reference'
  };

  const title = motionTitles[correctMotionId] || 'Pro Motion Reference';

  return (
    <div className="viewer-container glass-panel" style={{ width: '100%', height: '500px', background: 'transparent' }}>
      <div className="viewer-overlay-text" style={{ borderColor: 'var(--success)', color: '#10B981', fontWeight: 600 }}>
        {title}
      </div>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <color attach="background" args={['#FFFFFF']} />
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <directionalLight position={[0, 5, -5]} intensity={0.5} />
        <React.Suspense fallback={null}>
          <HighFidelityModel motionId={correctMotionId} color="#10B981" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </React.Suspense>
        <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} target={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
