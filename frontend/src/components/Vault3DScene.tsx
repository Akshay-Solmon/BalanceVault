import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Shield, Lock, Zap, RotateCcw } from 'lucide-react';

interface Vault3DSceneProps {
  status?: 'LOCKED' | 'ACTIVE' | 'PROCESSING';
  accentColor?: string;
  size?: 'compact' | 'full';
  interactive?: boolean;
}

export const Vault3DScene: React.FC<Vault3DSceneProps> = ({
  status = 'ACTIVE',
  size = 'compact',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [speed, setSpeed] = useState(1);
  const sceneRef = useRef<{
    pulseEnergy: () => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || (size === 'compact' ? 240 : 400);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = size === 'compact' ? 5.5 : 6.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Color palette based on status
    const isAmber = status === 'LOCKED';
    const primaryHex = isAmber ? 0xf59e0b : 0x06b6d4;
    const secondaryHex = isAmber ? 0xd97706 : 0x38bdf8;
    const coreHex = isAmber ? 0xef4444 : 0x10b981;

    // 1. Central Core - Geometric Crystal
    const coreGeometry = new THREE.IcosahedronGeometry(0.9, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: coreHex,
      emissive: coreHex,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // Wireframe overlay on core
    const coreWireGeo = new THREE.IcosahedronGeometry(0.92, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreWire = new THREE.Mesh(coreWireGeo, coreWireMat);
    coreMesh.add(coreWire);

    // 2. Cryptographic Rings (3 nested rings representing 3 DB security tiers)
    const createRing = (radius: number, tube: number, color: number, tiltX: number, tiltY: number) => {
      const geometry = new THREE.TorusGeometry(radius, tube, 16, 80);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };

    const ring1 = createRing(1.4, 0.03, primaryHex, Math.PI / 4, 0);
    const ring2 = createRing(1.8, 0.025, secondaryHex, 0, Math.PI / 3);
    const ring3 = createRing(2.2, 0.02, 0x94a3b8, Math.PI / 6, Math.PI / 4);

    scene.add(ring1);
    scene.add(ring2);
    scene.add(ring3);

    // 3. Floating Data Nodes (Particles around the core)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.4 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: primaryHex,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(primaryHex, 2.5, 15);
    pointLight1.position.set(3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(secondaryHex, 2.0, 15);
    pointLight2.position.set(-3, -3, 2);
    scene.add(pointLight2);

    // Mouse Interaction
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - prevMouseX;
        const deltaY = clientY - prevMouseY;
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        prevMouseX = clientX;
        prevMouseY = clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / width) * 2 - 1;
        const normY = -(((clientY - rect.top) / height) * 2 - 1);
        targetRotationY = normX * 0.5;
        targetRotationX = -normY * 0.5;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    if (interactive) {
      container.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
    }

    // Impulse Energy Pulse Function
    let energyPulse = 0;
    sceneRef.current = {
      pulseEnergy: () => {
        energyPulse = 1.0;
      },
    };

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentSpeed = speed;

      // Base rotations
      coreMesh.rotation.x += 0.4 * delta * currentSpeed;
      coreMesh.rotation.y += 0.6 * delta * currentSpeed;

      ring1.rotation.z += 0.8 * delta * currentSpeed;
      ring2.rotation.x += 0.6 * delta * currentSpeed;
      ring3.rotation.y -= 0.5 * delta * currentSpeed;

      particles.rotation.y += 0.1 * delta * currentSpeed;

      // Smooth damping to mouse rotation
      scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.08;
      scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.08;

      // Pulse decay
      if (energyPulse > 0) {
        energyPulse = Math.max(0, energyPulse - delta * 1.5);
        const scale = 1.0 + energyPulse * 0.35;
        coreMesh.scale.set(scale, scale, scale);
        pointLight1.intensity = 2.5 + energyPulse * 4;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || (size === 'compact' ? 240 : 400);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        container.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [status, size, interactive, speed]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: size === 'compact' ? '240px' : '380px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.08) 0%, rgba(9, 13, 22, 0.95) 75%)',
        border: '1px solid #1e293b',
        boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* 3D HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '14px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: status === 'ACTIVE' ? '#10b981' : '#f59e0b',
          boxShadow: `0 0 10px ${status === 'ACTIVE' ? '#10b981' : '#f59e0b'}`,
        }} />
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#cbd5e1',
          fontFamily: 'var(--font-mono)',
        }}>
          3D VAULT CORE: {status}
        </span>
      </div>

      {/* Floating 3D Control Chips */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '12px',
        display: 'flex',
        gap: '0.35rem',
        zIndex: 10,
      }}>
        <button
          onClick={() => setSpeed((s) => (s === 1 ? 2.5 : s === 2.5 ? 0.3 : 1))}
          title="Toggle Rotation Speed"
          className="btn-secondary"
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: 'rgba(15, 23, 42, 0.8)' }}
        >
          <Zap size={11} color="#38bdf8" /> {speed}x
        </button>
        <button
          onClick={() => sceneRef.current?.pulseEnergy()}
          title="Trigger Energy Impulse"
          className="btn-secondary"
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: 'rgba(15, 23, 42, 0.8)' }}
        >
          <Shield size={11} color="#10b981" /> Pulse
        </button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '14px',
        fontSize: '0.68rem',
        color: '#64748b',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
      }}>
        [ Drag to rotate 3D mesh • Multi-axis security rings ]
      </div>
    </div>
  );
};
