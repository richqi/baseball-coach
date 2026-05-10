'use client';

import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// A simple mannequin built from primitives to represent basic motions
function Mannequin({ motionId }) {
  const group = useRef();
  const rightArm = useRef();
  const leftArm = useRef();
  const torso = useRef();
  const rightLeg = useRef();
  const leftLeg = useRef();
  const head = useRef();

  // Animation logic based on motionId
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    if (!group.current) return;

    // Reset rotations first
    rightArm.current.rotation.set(0, 0, 0);
    leftArm.current.rotation.set(0, 0, 0);
    torso.current.rotation.set(0, 0, 0);
    rightLeg.current.rotation.set(0, 0, 0);
    leftLeg.current.rotation.set(0, 0, 0);
    group.current.position.set(0, 0, 0);

    if (motionId === 'batting_swing') {
      // Simple swing animation loop
      const phase = (Math.sin(t * 3) + 1) / 2; // 0 to 1
      torso.current.rotation.y = THREE.MathUtils.lerp(-Math.PI / 4, Math.PI / 2, phase);
      rightArm.current.rotation.z = THREE.MathUtils.lerp(Math.PI / 4, Math.PI / 2, phase);
      rightArm.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, phase);
      leftArm.current.rotation.z = THREE.MathUtils.lerp(-Math.PI / 4, -Math.PI / 2, phase);
      leftArm.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, phase);
      
    } else if (motionId === 'batting_stance') {
      // Static batting stance
      torso.current.rotation.y = -Math.PI / 4;
      rightArm.current.rotation.z = Math.PI / 4;
      rightArm.current.rotation.x = Math.PI / 8;
      leftArm.current.rotation.z = -Math.PI / 4;
      leftArm.current.rotation.x = Math.PI / 4;
      rightLeg.current.rotation.z = -Math.PI / 16;
      leftLeg.current.rotation.z = Math.PI / 16;

    } else if (motionId === 'pitching_windup') {
      // Leg lift animation
      const phase = (Math.sin(t * 2) + 1) / 2;
      leftLeg.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, phase); // Lift knee
      leftLeg.current.position.y = THREE.MathUtils.lerp(0, 1, phase); // Lift leg group
      rightArm.current.rotation.x = THREE.MathUtils.lerp(0, Math.PI, phase); // Hand drops back
      torso.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI / 4, phase); // Turn body
    } else if (motionId === 'pitching_stride') {
      // Stride out
      leftLeg.current.rotation.x = 0;
      leftLeg.current.position.y = 0;
      leftLeg.current.position.z = 2; // Step forward
      rightArm.current.rotation.x = Math.PI; // Arm up (cocked position)
      rightArm.current.rotation.z = Math.PI / 2;
      leftArm.current.rotation.x = -Math.PI / 2; // Glove arm pointing
      torso.current.rotation.y = Math.PI / 4; 
    } else {
      // Default / Neutral standing pose
      rightArm.current.rotation.z = 0.2;
      leftArm.current.rotation.z = -0.2;
    }
  });

  const material = new THREE.MeshStandardMaterial({ 
    color: '#00F0FF', 
    metalness: 0.6, 
    roughness: 0.2 
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Torso */}
      <group ref={torso} position={[0, 2.5, 0]}>
        <mesh material={material}>
          <cylinderGeometry args={[0.5, 0.4, 1.5, 32]} />
        </mesh>
        
        {/* Head */}
        <group ref={head} position={[0, 1.2, 0]}>
          <mesh material={material}>
            <sphereGeometry args={[0.35, 32, 32]} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group position={[-0.7, 0.5, 0]}>
          <group ref={rightArm}>
            <mesh material={material} position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.15, 0.1, 1.2, 16]} />
            </mesh>
          </group>
        </group>

        {/* Left Arm */}
        <group position={[0.7, 0.5, 0]}>
          <group ref={leftArm}>
            <mesh material={material} position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.15, 0.1, 1.2, 16]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Leg */}
      <group position={[-0.25, 1.5, 0]}>
        <group ref={rightLeg}>
          <mesh material={material} position={[0, -0.75, 0]}>
            <cylinderGeometry args={[0.18, 0.12, 1.5, 16]} />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group position={[0.25, 1.5, 0]}>
        <group ref={leftLeg}>
          <mesh material={material} position={[0, -0.75, 0]}>
            <cylinderGeometry args={[0.18, 0.12, 1.5, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function MotionViewer3D({ motionId }) {
  // Map internal motion IDs to user-friendly titles
  const motionTitles = {
    'batting_stance': 'Batting Stance',
    'batting_swing': 'Batting Swing',
    'pitching_windup': 'Pitching Windup (Balance Point)',
    'pitching_stride': 'Pitching Stride (Foot Strike)',
    'default': 'Neutral Pose'
  };

  const title = motionTitles[motionId] || 'Correct Motion';

  return (
    <div className="viewer-container">
      <div className="viewer-overlay-text">
        3D Reference: {title}
      </div>
      <Canvas camera={{ position: [0, 3, 8], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <directionalLight position={[0, 5, -5]} intensity={0.5} />
        
        <React.Suspense fallback={null}>
          <Mannequin motionId={motionId} />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </React.Suspense>
        
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>
    </div>
  );
}
