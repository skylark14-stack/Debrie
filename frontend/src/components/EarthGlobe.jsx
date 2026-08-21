import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'

function Earth() {
  const earthRef = useRef()
  
  // High-res realistic earth map
  const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
    </mesh>
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
  
  // To avoid "intersecting triangles" from vertex noise, we use solid base geometries.
  // We will create the "weird" crash shapes by aggressively stretching, squashing,
  // and rotating these solid blocks, ensuring they remain single, unbroken pieces.
  const [geo1, geo2, geo3] = useMemo(() => {
    return [
      new THREE.DodecahedronGeometry(1, 0), // Base for chunky, rocky metal fragments
      new THREE.BoxGeometry(1, 1, 1),       // Base for crushed plates, panels, and beams
      new THREE.CylinderGeometry(0.5, 0.5, 2, 5) // Base for bent pipes, struts, and rods
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
        const radius = 1.03 + Math.pow(Math.random(), 2) * 0.4; 
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
        
        // Base probability ensures debris is spread all around the Earth
        let spawnProbability = 0.15; 
        
        // London vs Paris overlap resolution
        // Because they are so close geographically, we must check which one we are closer to
        if (dotLondon > 0.98 || dotParis > 0.98) {
            if (dotLondon > dotParis) {
                spawnProbability = 1.0; // Max debris over London
            } else {
                spawnProbability = 0.02; // Very sparse over Paris
            }
        } 
        // Sparse zone over Norway
        else if (dotNorway > 0.95) {
            spawnProbability = 0.04; 
        }
        // Dense zones over India and Brazil
        else if (dotIndia > 0.85 || dotBrazil > 0.85) {
            spawnProbability = 1.0;
        }
        
        if (Math.random() > spawnProbability) {
            continue; 
        }
        
        const x = vx * radius;
        const y = vy * radius;
        const z = vz * radius;
        
        const baseScale = Math.random() * 0.007 + 0.002;
        const scaleX = baseScale * (Math.random() * 3.0 + 0.1); 
        const scaleY = baseScale * (Math.random() * 3.0 + 0.1);
        const scaleZ = baseScale * (Math.random() * 3.0 + 0.1);
        
        let color;
        const randColor = Math.random();
        if (randColor > 0.85) {
            color = colorDarkRust; 
        } else if (randColor > 0.4) {
            color = colorScorchedMetal; 
        } else {
            color = colorDullSilver; 
        }
        
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
  
  // Removed independent useFrame rotation so debris stays geographically locked to Earth

  // Material: VERY rough, unpolished, and dull. 
  // Flat shading combined with high-poly distorted geometry creates realistic shattered facets.
  const shrapnelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.9,  // Unpolished, dull, oxidized
    metalness: 0.6,  // Still metal, but not shiny
    flatShading: true // Crucial for the "shattered/torn" facet look on high-poly meshes
  }), [])

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
        <DebrisInstanced />
        <OrbitControls enablePan={false} minDistance={1.2} maxDistance={12} autoRotate={true} autoRotateSpeed={0.3} rotateSpeed={0.4} zoomSpeed={0.6} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
        Interactive • Drag to rotate • Scroll to zoom
      </div>
    </div>
  )
}
