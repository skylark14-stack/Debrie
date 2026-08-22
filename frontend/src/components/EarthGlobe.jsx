import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'

function Earth() {
  const earthRef = useRef();
  const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  
  useFrame(() => {
    if (earthRef.current) {
      // Real-time Earth rotation (1 revolution per 24 hours based on current UTC time)
      const now = new Date();
      const utcSeconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + now.getUTCMilliseconds() / 1000;
      // Add an offset so that UTC 12:00 aligns the Prime Meridian with the Sun
      earthRef.current.rotation.y = (utcSeconds / 86400) * Math.PI * 2 + Math.PI; 
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

function IndiaHighlight() {
  const getVector = (lat, lon) => {
    const phi = Math.PI / 2 - (lat * Math.PI / 180);
    const theta = (lon * Math.PI / 180) - Math.PI / 2;
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      -Math.sin(phi) * Math.sin(theta)
    );
  };
  
  // Coordinates for Central India
  const pos = getVector(21.0, 78.0);
  pos.multiplyScalar(1.005); // Just above Earth surface

  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      ref.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={pos} onUpdate={self => self.lookAt(0, 0, 0)}>
      <mesh>
        <circleGeometry args={[0.07, 32]} />
        <meshBasicMaterial color="#3ED9A0" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ref}>
        <ringGeometry args={[0.07, 0.08, 32]} />
        <meshBasicMaterial color="#3ED9A0" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function LiveDebris() {
  const [debris, setDebris] = useState([])
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    fetch('/space-track.json')
      .then(res => res.json())
      .then(data => {
        if (data.debris) {
          setDebris(data.debris)
        }
      })
      .catch(err => console.error("Error fetching live debris:", err))
  }, [])

  // The backend assumes Earth is 6.371 units, but this scene uses 1 unit.
  const groupRef = useRef()

  const scale = 1 / 6.371;

  useFrame(() => {
    if (groupRef.current) {
      // Real-time Low Earth Orbit rotation (~90 mins per revolution)
      const now = new Date();
      const utcSeconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + now.getUTCMilliseconds() / 1000;
      groupRef.current.rotation.y = (utcSeconds / 5400) * Math.PI * 2;
    }
  });

  return (
    <group ref={groupRef}>
      {debris.map((item) => (
        <mesh 
            key={item.id} 
            position={[item.x * scale, item.y * scale, item.z * scale]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(item.id) }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(null) }}
            scale={hovered === item.id ? 2.5 : 1}
        >
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshBasicMaterial color={hovered === item.id ? '#FFB454' : '#FF6259'} />
          
          {hovered === item.id && (
            <Html distanceFactor={2.5} center>
              <div style={{
                background: 'rgba(17, 24, 39, 0.9)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--blue)',
                color: 'white',
                fontSize: '10px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                transform: 'translate3d(0, -30px, 0) scale(1)',
                animation: 'popInGlobe 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                transformOrigin: 'bottom center'
              }}>
                <style>
                  {`
                    @keyframes popInGlobe {
                      0% { transform: translate3d(0, -15px, 0) scale(0.5); opacity: 0; }
                      100% { transform: translate3d(0, -30px, 0) scale(1); opacity: 1; }
                    }
                  `}
                </style>
                <strong style={{color: 'var(--blue)'}}>{item.name}</strong><br/>
                NORAD ID: {item.id}
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </group>
  )
}

function DebrisInstanced() {
  const meshRef1 = useRef()
  const meshRef2 = useRef()
  const meshRef3 = useRef()
  
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const count1 = 1000;
  const count2 = 1000;
  const count3 = 1000;
  
  const [geo1, geo2, geo3] = useMemo(() => {
    return [
      new THREE.DodecahedronGeometry(1, 0), 
      new THREE.BoxGeometry(1, 1, 1),       
      new THREE.CylinderGeometry(0.5, 0.5, 2, 5) 
    ]
  }, [])
  
  const [data1, data2, data3] = useMemo(() => {
    const arrays = [[], [], []];
    const counts = [count1, count2, count3];
    
    const colorDullSilver = new THREE.Color('#9BA3AC')
    const colorScorchedMetal = new THREE.Color('#4A5159')
    const colorDarkRust = new THREE.Color('#594A42') 
    
    const getVector = (lat, lon) => {
      const phi = Math.PI / 2 - (lat * Math.PI / 180);
      const theta = (lon * Math.PI / 180) - Math.PI / 2;
      return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: -Math.sin(phi) * Math.sin(theta)
      }
    };
    
    const vIndia = getVector(20, 80);
    const vBrazil = getVector(-10, -50);
    const vLondon = getVector(51.5, -0.1);
    const vParis = getVector(48.8, 2.3);
    const vNorway = getVector(60.5, 8.5);
    
    for (let type = 0; type < 3; type++) {
      let i = 0;
      let attempts = 0;
      
      while(i < counts[type] && attempts < 150000) {
        attempts++;
        // Scatter debris across a massive radius filling the canvas (up to 12 Earth radii)
        const radius = 1.1 + Math.pow(Math.random(), 3) * 11.0; 
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        const vx = Math.sin(phi) * Math.cos(theta);
        const vy = Math.cos(phi);
        const vz = -Math.sin(phi) * Math.sin(theta);
        
        const dotIndia = vx * vIndia.x + vy * vIndia.y + vz * vIndia.z;
        const dotBrazil = vx * vBrazil.x + vy * vBrazil.y + vz * vBrazil.z;
        const dotLondon = vx * vLondon.x + vy * vLondon.y + vz * vLondon.z;
        const dotParis = vx * vParis.x + vy * vParis.y + vz * vParis.z;
        const dotNorway = vx * vNorway.x + vy * vNorway.y + vz * vNorway.z;
        
        let spawnProbability = 0.15; 
        
        if (dotLondon > 0.98 || dotParis > 0.98) {
            if (dotLondon > dotParis) { spawnProbability = 1.0; } 
            else { spawnProbability = 0.02; }
        } else if (dotNorway > 0.95) { spawnProbability = 0.04; }
        else if (dotIndia > 0.85 || dotBrazil > 0.85) { spawnProbability = 1.0; }
        
        if (Math.random() > spawnProbability) continue; 
        
        const x = vx * radius;
        const y = vy * radius;
        const z = vz * radius;
        
        const baseScale = Math.random() * 0.007 + 0.002;
        const scaleX = baseScale * (Math.random() * 3.0 + 0.1); 
        const scaleY = baseScale * (Math.random() * 3.0 + 0.1);
        const scaleZ = baseScale * (Math.random() * 3.0 + 0.1);
        
        let color;
        const randColor = Math.random();
        if (randColor > 0.85) { color = colorDarkRust; } 
        else if (randColor > 0.4) { color = colorScorchedMetal; } 
        else { color = colorDullSilver; }
        
        arrays[type].push({
          pos: [x, y, z],
          rot: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
          scale: [scaleX, scaleY, scaleZ],
          color
        });
        i++;
      }
    }
    return arrays;
  }, [])

  useEffect(() => {
    const setupInstances = (ref, data) => {
      if (!ref.current) return;
      data.forEach((d, i) => {
        dummy.position.set(...d.pos);
        dummy.rotation.set(...d.rot);
        dummy.scale.set(...d.scale); 
        dummy.updateMatrix();
        ref.current.setMatrixAt(i, dummy.matrix);
        ref.current.setColorAt(i, d.color);
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
    setupInstances(meshRef1, data1);
    setupInstances(meshRef2, data2);
    setupInstances(meshRef3, data3);
  }, [data1, data2, data3, dummy])
  
  const shrapnelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.9, 
    metalness: 0.6, 
    flatShading: true 
  }), [])

  useFrame(() => {
    // Real-time High Earth Orbit rotation (~12 hours per revolution)
    const now = new Date();
    const utcSeconds = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + now.getUTCMilliseconds() / 1000;
    const rotBase = (utcSeconds / 43200) * Math.PI * 2;
    
    if (meshRef1.current) meshRef1.current.rotation.y = rotBase;
    if (meshRef2.current) meshRef2.current.rotation.y = rotBase * 1.1; // Slightly different speed
    if (meshRef3.current) meshRef3.current.rotation.y = rotBase * 0.9;
  });

  return (
    <group>
      <instancedMesh ref={meshRef1} args={[null, null, count1]} geometry={geo1} material={shrapnelMaterial} />
      <instancedMesh ref={meshRef2} args={[null, null, count2]} geometry={geo2} material={shrapnelMaterial} />
      <instancedMesh ref={meshRef3} args={[null, null, count3]} geometry={geo3} material={shrapnelMaterial} />
    </group>
  )
}

export default function EarthGlobe() {
  return (
    <div style={{ width: '100%', height: '600px', backgroundColor: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '3rem', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={2.5} />
        <React.Suspense fallback={null}>
          <Earth />
        </React.Suspense>
        
        <IndiaHighlight />
        
        {/* Render the massive procedural background debris cloud */}
        <DebrisInstanced />
        
        {/* Render the 50 live, clickable Space-Track debris items on top */}
        <LiveDebris />
        
        <OrbitControls enablePan={false} minDistance={1.2} maxDistance={12} autoRotate={false} rotateSpeed={0.4} zoomSpeed={0.6} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
        Interactive • Drag to rotate • Scroll to zoom
      </div>
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#FF6259', borderRadius: '50%' }}></div>
        Live Space-Track Data Active
      </div>
    </div>
  )
}
