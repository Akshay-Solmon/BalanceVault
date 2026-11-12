import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion, isWebGLAvailable } from '../../utils/motion';
import { Shield } from 'lucide-react';

export const VaultHero3D: React.FC<{ size?: number }> = ({ size = 320 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const isMotionReduced = prefersReducedMotion();
    setReducedMotion(isMotionReduced);

    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    // 3. Renderer setup with capped DPR
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 4. Soft fintech lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x4f8cff, 2.5, 10);
    blueLight.position.set(2.5, 2.5, 3);
    scene.add(blueLight);

    const tealLight = new THREE.PointLight(0x22d3b7, 2.0, 10);
    tealLight.position.set(-2.5, -2, 2.5);
    scene.add(tealLight);

    // 5. Outer Glass Cube (Vault shell)
    const cubeGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x131a2e,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.6,
      clearcoat: 0.8,
    });
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    scene.add(cubeMesh);

    // Subtle edge highlight lines on the cube
    const edges = new THREE.EdgesGeometry(cubeGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4f8cff,
      transparent: true,
      opacity: 0.5,
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    cubeMesh.add(wireframe);

    // 6. Inner Floating Octahedron Core (The "Vault Core")
    const coreGeo = new THREE.OctahedronGeometry(0.7, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x22d3b7,
      emissive: 0x22d3b7,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 7. Small orbiting cryptographic nodes
    const nodeGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x4f8cff });

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 1.25, Math.sin(angle) * 0.4, Math.sin(angle) * 1.25);
      nodeGroup.add(node);
    }
    scene.add(nodeGroup);

    // 8. Animation loop
    let animationFrameId: number;
    const animate = () => {
      if (!isMotionReduced) {
        cubeMesh.rotation.y += 0.004;
        cubeMesh.rotation.x += 0.002;

        coreMesh.rotation.y -= 0.008;
        coreMesh.rotation.z += 0.005;

        nodeGroup.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      cubeGeo.dispose();
      cubeMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      edges.dispose();
      lineMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      renderer.dispose();
    };
  }, [size]);

  // Fallback if WebGL unavailable
  if (!hasWebGL) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(79, 140, 255, 0.15) 0%, rgba(19, 26, 46, 0.8) 70%, transparent 100%)',
          borderRadius: '50%',
          border: '1px solid rgba(79, 140, 255, 0.2)',
        }}
      >
        <Shield size={64} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
      aria-label="3D Vault security visualizer"
    />
  );
};
