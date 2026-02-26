'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { CountryWithPSI } from '@/app/types';

const EARTH_TEXTURE_URL = 'https://cdn.jsdelivr.net/npm/three-globe@2.34.2/example/img/earth-blue-marble.jpg';

const RISK_COLORS: Record<string, string> = {
  Stable: '#22c55e',
  Moderate: '#eab308',
  Elevated: '#f97316',
  High: '#ef4444',
  Crisis: '#dc2626',
};

function Hotspot({ country, onClick }: { country: CountryWithPSI; onClick: () => void }) {
  const phi = (90 - country.latitude) * (Math.PI / 180);
  const theta = (country.longitude + 180) * (Math.PI / 180);
  const radius = 1.02;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  const color = RISK_COLORS[country.risk_level] || '#22c55e';
  const scale = 0.5 + (country.psi_score / 100) * 0.5;
  const isCrisis = country.risk_level === 'Crisis';

  return (
    <group position={[x, y, z]}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.02 * scale, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
        />
      </mesh>
      {isCrisis && (
        <mesh>
          <sphereGeometry args={[0.025 * scale, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

function GlobeSphere() {
  const [earthMap] = useTexture([EARTH_TEXTURE_URL]);
  earthMap.wrapS = earthMap.wrapT = THREE.RepeatWrapping;
  earthMap.colorSpace = THREE.SRGBColorSpace;

  return (
    <Sphere args={[1, 64, 64]}>
      <meshStandardMaterial
        map={earthMap}
        metalness={0.1}
        roughness={0.7}
      />
    </Sphere>
  );
}

function Wireframe() {
  const wireframeRef = useRef<THREE.LineSegments>(null);
  useFrame((state) => {
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.01, 2);
    const edges = new THREE.EdgesGeometry(geo);
    return new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#475569', opacity: 0.15, transparent: true }));
  }, []);

  return <primitive object={geometry} ref={wireframeRef} />;
}

interface GlobeProps {
  countries: CountryWithPSI[];
  onCountryClick: (country: CountryWithPSI) => void;
}

export default function Globe({ countries, onCountryClick }: GlobeProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, -5, 5]} intensity={0.4} color="#ffffff" />
          <GlobeSphere />
        <Wireframe />
        <OrbitControls
          makeDefault
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={5}
          autoRotate
          autoRotateSpeed={0.3}
        />
        {countries.map((country) => (
          <Hotspot
            key={country.id}
            country={country}
            onClick={() => onCountryClick(country)}
          />
        ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
