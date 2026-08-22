import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const phases = [
  { id: 1, title: 'Satellite in Operation', desc: 'The satellite is functioning normally in its nominal high orbit.' },
  { id: 2, title: 'Mission Ends / Fuel Depletes', desc: 'The satellite runs out of station-keeping fuel and begins to lose altitude.' },
  { id: 3, title: 'Orbital Decay & Re-entry', desc: 'Gravity pulls it into the atmosphere. Friction causes violent heating.' },
  { id: 4, title: 'Breakup & Disintegration', desc: 'The intense heat and pressure cause the structure to fail and explode.' },
  { id: 5, title: 'Surviving Space Debris', desc: 'Dense components survive and become highly dangerous space shrapnel.' },
];

function EarthBackground() {
  const earthRef = useRef();
  const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  
  useFrame(() => {
    if (earthRef.current) {
       earthRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group position={[0, -5, 0]}>
      {/* Earth Surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[10, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Atmospheric Glow */}
      <mesh scale={[1.03, 1.03, 1.03]}>
        <sphereGeometry args={[10, 64, 64]} />
        <meshBasicMaterial color="#4FD1FF" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Low Earth Orbit (LEO) - Outer Ring (Nominal Orbit) */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[16, 0.02, 16, 100]} />
        <meshBasicMaterial color="#3ED9A0" transparent opacity={0.3} />
      </mesh>
      
      {/* Low Earth Orbit (LEO) - Inner Ring (Decaying Orbit) */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[13, 0.02, 16, 100]} />
        <meshBasicMaterial color="#FFB454" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function SatelliteSimulation({ phase }) {
  const group = useRef();
  const controlsRef = useRef();
  const cameraGroupRef = useRef();
  
  const shrapnelCount = 40;
  const shrapnelData = useMemo(() => {
    return Array.from({ length: shrapnelCount }).map(() => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(Math.random() * 0.1 + 0.05),
      rot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI),
      rotVel: new THREE.Vector3((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2)
    }));
  }, []);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const instancedMeshRef = useRef();
  
  const heatMaterialRef = useRef();
  const bodyMaterialRef = useRef();

  const orbitAngle = useRef(0);
  const orbitRadius = useRef(16);
  const orbitY = useRef(-5); // matches Earth center

  useFrame((state, delta) => {
    // 1. Calculate the satellite's position in the massive orbit
    orbitAngle.current += delta * 0.15; // Orbit speed
    
    if (phase === 1) {
      orbitRadius.current = THREE.MathUtils.lerp(orbitRadius.current, 16, 0.02);
      orbitY.current = THREE.MathUtils.lerp(orbitY.current, -5, 0.02);
    } else if (phase === 2) {
      orbitRadius.current = THREE.MathUtils.lerp(orbitRadius.current, 13, 0.02); // Drop to inner ring
      orbitY.current = THREE.MathUtils.lerp(orbitY.current, -5, 0.02);
    } else if (phase >= 3) {
      orbitRadius.current = THREE.MathUtils.lerp(orbitRadius.current, 10, 0.015); // Spiral into atmosphere
      orbitY.current -= delta * 0.5; 
    }

    const currentX = Math.cos(orbitAngle.current) * orbitRadius.current;
    const currentZ = Math.sin(orbitAngle.current) * orbitRadius.current;

    // 2. Update camera and target to follow the satellite
    if (controlsRef.current && cameraGroupRef.current) {
        // Move the pivot point of the camera to the satellite's position
        cameraGroupRef.current.position.set(currentX, orbitY.current, currentZ);
        controlsRef.current.target.set(currentX, orbitY.current, currentZ);
        controlsRef.current.update();
    }

    // 3. Update satellite mesh rotation and effects
    if (group.current && phase < 4) {
      // Keep satellite at local origin [0,0,0] inside the camera group
      group.current.position.set(0, 0, 0); 
      
      if (phase === 1) {
        group.current.rotation.y += delta * 0.4;
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
        if (heatMaterialRef.current) heatMaterialRef.current.opacity = 0;
        if (bodyMaterialRef.current) bodyMaterialRef.current.emissiveIntensity = 0;
      } else if (phase === 2) {
        group.current.rotation.y += delta * 0.1;
        group.current.rotation.x += delta * 0.3;
        if (heatMaterialRef.current) heatMaterialRef.current.opacity = 0;
      } else if (phase === 3) {
        group.current.rotation.y += delta * 2.5;
        group.current.rotation.x += delta * 3.2;
        group.current.rotation.z += delta * 1.8;
        if (heatMaterialRef.current) {
            heatMaterialRef.current.opacity = THREE.MathUtils.lerp(heatMaterialRef.current.opacity, 0.9, 0.05);
        }
        if (bodyMaterialRef.current) {
            bodyMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(bodyMaterialRef.current.emissiveIntensity, 2.5, 0.05);
        }
      }
    }
    
    // 4. Explosion logic
    if (phase >= 4 && instancedMeshRef.current) {
      shrapnelData.forEach((d, i) => {
        d.pos.add(d.vel);
        d.pos.y -= delta * 0.5; // Continue to fall slightly relative to local origin
        
        d.rot.x += d.rotVel.x;
        d.rot.y += d.rotVel.y;
        d.rot.z += d.rotVel.z;
        
        dummy.position.copy(d.pos);
        dummy.rotation.copy(d.rot);
        
        const shrinkFactor = phase === 5 ? 0.99 : 1;
        dummy.scale.multiplyScalar(shrinkFactor);
        
        dummy.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    } else {
      if (group.current) {
          shrapnelData.forEach((d) => {
             d.pos.set(0, 0, 0);
             d.pos.add(new THREE.Vector3((Math.random() - 0.5)*0.5, (Math.random() - 0.5)*0.5, (Math.random() - 0.5)*0.5));
             dummy.scale.setScalar(Math.random() * 0.6 + 0.4);
          });
      }
    }
  });

  return (
    <>
      <OrbitControls ref={controlsRef} enablePan={false} minDistance={2} maxDistance={12} autoRotate={phase < 3} autoRotateSpeed={0.5} />
      
      <React.Suspense fallback={null}>
         <EarthBackground />
      </React.Suspense>

      <group ref={cameraGroupRef}>
        {/* Intact Realistic Satellite */}
        {phase < 4 && (
          <group ref={group}>
            <mesh>
              <boxGeometry args={[1.2, 1.2, 1.2]} />
              <meshStandardMaterial 
                  ref={bodyMaterialRef}
                  color="#D4AF37" 
                  metalness={0.9} 
                  roughness={0.3} 
                  emissive="#ff3300"
                  emissiveIntensity={0}
              />
            </mesh>
            <mesh position={[0, -0.7, 0]}>
              <cylinderGeometry args={[0.2, 0.4, 0.4, 16]} />
              <meshStandardMaterial color="#333333" metalness={0.8} />
            </mesh>
            <mesh position={[-2.0, 0, 0]}>
              <boxGeometry args={[2.8, 0.05, 1.0]} />
              <meshStandardMaterial color="#0A1931" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[-2.0, 0, 0]}>
               <boxGeometry args={[2.85, 0.06, 1.05]} />
               <meshStandardMaterial color="#B0C4DE" wireframe={true} />
            </mesh>
            <mesh position={[2.0, 0, 0]}>
              <boxGeometry args={[2.8, 0.05, 1.0]} />
              <meshStandardMaterial color="#0A1931" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[2.0, 0, 0]}>
               <boxGeometry args={[2.85, 0.06, 1.05]} />
               <meshStandardMaterial color="#B0C4DE" wireframe={true} />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <cylinderGeometry args={[0.4, 0.05, 0.5, 16]} />
              <meshStandardMaterial color="#E9EEF7" metalness={0.5} />
            </mesh>
            
            <mesh scale={[1.8, 1.8, 1.8]}>
               <sphereGeometry args={[1, 32, 32]} />
               <meshBasicMaterial ref={heatMaterialRef} color="#ff4400" transparent={true} opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        )}

        {/* Surviving Shrapnel / Debris */}
        {phase >= 4 && (
          <instancedMesh ref={instancedMeshRef} args={[null, null, shrapnelCount]}>
            <dodecahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color="#3A4149" metalness={0.8} roughness={0.9} flatShading />
          </instancedMesh>
        )}
      </group>
    </>
  );
}

export default function DeorbitTracker() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [fuel, setFuel] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    
    let interval;
    if (currentPhase === 1) {
       interval = setInterval(() => {
          setFuel(f => {
             if (f <= 15) { clearInterval(interval); setCurrentPhase(2); return 15; }
             return f - 1;
          });
       }, 50); 
    } else if (currentPhase === 2) {
       interval = setInterval(() => {
          setFuel(f => {
             if (f <= 0) { clearInterval(interval); setCurrentPhase(3); return 0; }
             return f - 0.5;
          });
       }, 50); 
    } else if (currentPhase === 3) {
       interval = setTimeout(() => setCurrentPhase(4), 2500);
    } else if (currentPhase === 4) {
       interval = setTimeout(() => setCurrentPhase(5), 2000);
    } else if (currentPhase === 5) {
       interval = setTimeout(() => { setCurrentPhase(1); setFuel(100); }, 4000);
    }
    
    return () => { clearInterval(interval); clearTimeout(interval); };
  }, [currentPhase, isPlaying]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 0 2rem 0' }}>
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', margin: 0 }}>Deorbit Tracker</h2>
            <button 
              onClick={() => {
                if (!isPlaying && currentPhase === 5) {
                   setCurrentPhase(1);
                   setFuel(100);
                }
                setIsPlaying(!isPlaying);
              }}
              style={{ 
                padding: '0.6rem 1.5rem', 
                backgroundColor: isPlaying ? 'var(--panel-2)' : 'var(--blue)', 
                color: isPlaying ? 'var(--text)' : '#080B14', 
                border: isPlaying ? '1px solid var(--border)' : 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: '0.9rem', 
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isPlaying ? '⏸ Pause' : (currentPhase === 5 ? '↺ Restart' : '▶ Play Simulation')}
            </button>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', maxWidth: '800px', margin: 0 }}>
            From working satellite to tracked debris. A simplified model of end-of-life: fuel depletion, orbital decay, atmospheric burn-up, and the hardware that's tough enough to survive it.
          </p>
        </div>
        
        <div style={{ width: '250px', backgroundColor: 'var(--panel-2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.9rem' }}>Propellant Level</span>
                <span style={{ color: fuel > 20 ? 'var(--green)' : (fuel > 0 ? 'var(--amber)' : 'var(--red)'), fontWeight: 'bold' }}>
                    {Math.max(0, Math.round(fuel))}%
                </span>
            </div>
            <div style={{ height: '12px', width: '100%', backgroundColor: '#080B14', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                    height: '100%', 
                    width: `${fuel}%`, 
                    backgroundColor: fuel > 20 ? 'var(--green)' : (fuel > 0 ? 'var(--amber)' : 'var(--red)'),
                    transition: 'width 0.1s linear, background-color 0.3s ease'
                }}></div>
            </div>
            {fuel === 0 && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center', animation: 'pulse 1s infinite' }}>CRITICAL: TANK EMPTY</div>}
        </div>
      </div>
      
      {/* Landscape 3D Simulation */}
      <div style={{ width: '100%', height: '55vh', backgroundColor: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', marginBottom: '1.5rem' }}>
        <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
          <color attach="background" args={['#080B14']} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          
          <SatelliteSimulation phase={currentPhase} />
        </Canvas>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
          {isPlaying ? 'Simulation Running' : 'Simulation Paused'}
        </div>
      </div>

      {/* Horizontal Timeline UI */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {phases.map((p) => (
          <div 
            key={p.id}
            onClick={() => { 
                setCurrentPhase(p.id); 
                if(p.id===1) setFuel(100); 
                if(p.id>2) setFuel(0); 
                setIsPlaying(false); // Pause when user manually clicks a phase
            }}
            style={{
              flex: '1 0 200px',
              padding: '1.25rem',
              borderRadius: '8px',
              border: `1px solid ${currentPhase === p.id ? 'var(--blue)' : 'var(--border)'}`,
              backgroundColor: currentPhase === p.id ? 'var(--panel)' : 'var(--panel-2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: currentPhase === p.id ? 'var(--blue)' : 'var(--text-dimmer)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              PHASE 0{p.id}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: currentPhase === p.id ? 'var(--text)' : 'var(--text-dim)' }}>
              {p.title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dimmer)', lineHeight: '1.4' }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        /* Hide scrollbar for timeline */
        ::-webkit-scrollbar {
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: var(--bg); 
        }
        ::-webkit-scrollbar-thumb {
            background: var(--panel-2); 
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--border); 
        }
      `}</style>
    </div>
  );
}
