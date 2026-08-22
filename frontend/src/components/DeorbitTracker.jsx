import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

const EARTH_RADIUS = 6.371; // 1 unit = 1000 km

const phases = [
  { id: 1, title: 'Satellite in Operation', desc: 'The satellite is functioning normally in its nominal high orbit.' },
  { id: 2, title: 'Mission Ends / Fuel Depletes', desc: 'The satellite runs out of station-keeping fuel and begins to lose altitude.' },
  { id: 3, title: 'Orbital Decay & Re-entry', desc: 'Gravity pulls it into the atmosphere. Friction causes violent heating.' },
  { id: 4, title: 'Breakup & Disintegration', desc: 'The intense heat and pressure cause the structure to fail and explode.' },
  { id: 5, title: 'Surviving Space Debris', desc: 'Dense components survive and become highly dangerous space shrapnel.' },
];

const events = [
  { id: 1, name: "2007 Fengyun-1C ASAT", alt: 865, count: 3500, risk: "High", color: "#FF6259", inc: 98 },
  { id: 2, name: "2009 Cosmos-2251 & Iridium 33", alt: 789, count: 2300, risk: "High", color: "#FF6259", inc: 74 },
  { id: 3, name: "1996 Pegasus HAPS", alt: 625, count: 500, risk: "Medium", color: "#FFB454", inc: 28 },
  { id: 4, name: "2021 Cosmos-1408 ASAT", alt: 480, count: 1500, risk: "High", color: "#FF6259", inc: 82 },
  { id: 5, name: "1986 Spot-1 / Ariane", alt: 800, count: 490, risk: "Medium", color: "#FFB454", inc: 98 },
  { id: 6, name: "1961 Transit 4A", alt: 950, count: 300, risk: "Medium", color: "#FFB454", inc: 66 },
  { id: 7, name: "2006 TOPAZ", alt: 800, count: 100, risk: "Low", color: "#3ED9A0", inc: 70 },
  { id: 8, name: "2000 CBERS-1", alt: 750, count: 300, risk: "Medium", color: "#FFB454", inc: 98 },
  { id: 9, name: "2019 Mission Shakti", alt: 283, count: 400, risk: "Medium", color: "#FFB454", inc: 28 },
  { id: 10, name: "1985 Solwind ASAT", alt: 525, count: 280, risk: "Low", color: "#3ED9A0", inc: 55 },
  { id: 11, name: "2012 Briz-M", isElliptical: true, perigee: 265, apogee: 11600, count: 500, risk: "Medium", color: "#FFB454", inc: 49 },
  { id: 12, name: "1970 Cosmos-382", isElliptical: true, perigee: 1000, apogee: 5000, count: 180, risk: "Low", color: "#3ED9A0", inc: 51 },
  { id: 13, name: "2022 Long March 6A", isElliptical: true, perigee: 500, apogee: 1000, count: 500, risk: "Medium", color: "#FFB454", inc: 98 },
  { id: 14, name: "2008 USA-193", alt: 240, count: 170, risk: "Low", color: "#3ED9A0", inc: 58 },
  { id: 15, name: "1998 Zenit-2", alt: 850, count: 200, risk: "Low", color: "#3ED9A0", inc: 71 }
];

function EarthBackground({ showRings = false }) {
  const earthRef = useRef();
  const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  
  useFrame(() => {
    if (earthRef.current) {
       earthRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group position={showRings ? [0, -5, 0] : [0, 0, 0]}>
      {/* Earth Surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[showRings ? 10 : EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Atmospheric Glow */}
      <mesh scale={[1.03, 1.03, 1.03]}>
        <sphereGeometry args={[showRings ? 10 : EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial color="#4FD1FF" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {showRings && (
        <>
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
        </>
      )}
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
  const orbitY = useRef(-5);

  useFrame((state, delta) => {
    orbitAngle.current += delta * 0.15;
    
    if (phase === 1) {
      orbitRadius.current = THREE.MathUtils.lerp(orbitRadius.current, 16, 0.02);
      orbitY.current = THREE.MathUtils.lerp(orbitY.current, -5, 0.02);
    } else if (phase === 2) {
      orbitRadius.current = THREE.MathUtils.lerp(orbitRadius.current, 13, 0.02);
      orbitY.current = THREE.MathUtils.lerp(orbitY.current, -5, 0.02);
    } else if (phase >= 3) {
      orbitRadius.current = THREE.MathUtils.lerp(orbitRadius.current, 10, 0.015);
      orbitY.current -= delta * 0.5; 
    }

    const currentX = Math.cos(orbitAngle.current) * orbitRadius.current;
    const currentZ = Math.sin(orbitAngle.current) * orbitRadius.current;

    if (controlsRef.current && cameraGroupRef.current) {
        cameraGroupRef.current.position.set(currentX, orbitY.current, currentZ);
        controlsRef.current.target.set(currentX, orbitY.current, currentZ);
        controlsRef.current.update();
    }

    if (group.current && phase < 4) {
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
    
    if (phase >= 4 && instancedMeshRef.current) {
      shrapnelData.forEach((d, i) => {
        d.pos.add(d.vel);
        d.pos.y -= delta * 0.5;
        
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
      <OrbitControls ref={controlsRef} enablePan={false} minDistance={2} maxDistance={12} autoRotate={false} autoRotateSpeed={0.5} />
      
      <React.Suspense fallback={null}>
         <EarthBackground showRings={true} />
      </React.Suspense>

      <group ref={cameraGroupRef}>
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



function SpaceTrackDebrisItem({ item, hovered, setHovered, selectedDebris, setSelectedDebris }) {
  const orbitGroupRef = useRef();
  
  const distFromCenter = Math.sqrt(item.x * item.x + item.y * item.y + item.z * item.z);
  const altitudeStr = distFromCenter > EARTH_RADIUS 
    ? `${((distFromCenter - EARTH_RADIUS) * 1000).toFixed(0)} km` 
    : "Unknown";
  const isHovered = hovered === item.id;
  const isSelected = selectedDebris?.id === item.id;

  const riskMod = item.id % 3;
  let baseColor = '#3ED9A0'; // Low risk (green)
  if (riskMod === 0) baseColor = '#FF6259'; // High risk (red)
  else if (riskMod === 1) baseColor = '#FFB454'; // Medium risk (yellow)

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3(item.x, item.y, item.z).normalize();
    
    let seed = 0;
    const idStr = String(item.id);
    for (let i = 0; i < idStr.length; i++) seed += idStr.charCodeAt(i);
    const randomAngle = (seed * 0.21) % (Math.PI * 2);
    
    const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), randomAngle);
    const align = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), p);
    
    q.multiplyQuaternions(align, roll);
    return q;
  }, [item.id, item.x, item.y, item.z]);

  useFrame((state, delta) => {
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.z += delta * 0.02;
    }
  });

  return (
    <group quaternion={quaternion}>
      <mesh>
        <ringGeometry args={[distFromCenter - 0.015, distFromCenter + 0.015, 64]} />
        <meshBasicMaterial color={baseColor} transparent opacity={isHovered || isSelected ? 0.8 : 0.35} side={THREE.DoubleSide} />
      </mesh>

      <group ref={orbitGroupRef}>
        <group position={[distFromCenter, 0, 0]}>
          <mesh 
            onPointerOver={(e) => { e.stopPropagation(); setHovered(item.id) }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(null) }}
            onClick={(e) => { e.stopPropagation(); setSelectedDebris(item) }}
            scale={isHovered || isSelected ? 2.5 : 1}
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={isHovered || isSelected ? '#FFFFFF' : baseColor} />
          </mesh>
          
          {(isHovered || isSelected) && (
            <Html distanceFactor={15} center zIndexRange={[100, 0]}>
              <div style={{
                background: 'rgba(17, 24, 39, 0.95)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: isSelected ? `2px solid ${baseColor}` : `1px solid ${baseColor}`,
                color: 'white',
                fontSize: '13px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                transform: 'translate3d(0, -40px, 0) scale(1)',
                animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                transformOrigin: 'bottom center'
              }}>
                <style>
                  {`
                    @keyframes popIn {
                      0% { transform: translate3d(0, -20px, 0) scale(0.5); opacity: 0; }
                      100% { transform: translate3d(0, -40px, 0) scale(1); opacity: 1; }
                    }
                  `}
                </style>
                <strong style={{color: baseColor, fontSize: '15px'}}>{item.name}</strong><br/>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>ID:</span> {item.id}<br/>
                  <span style={{ color: 'var(--text-dim)' }}>Distance:</span> {altitudeStr}
                </div>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}

function LiveSpaceTrackDebris({ debris, selectedDebris, setSelectedDebris }) {
  const [hovered, setHovered] = useState(null)

  return (
    <group>
      {debris.map((item) => (
        <SpaceTrackDebrisItem 
          key={item.id} 
          item={item} 
          hovered={hovered} 
          setHovered={setHovered}
          selectedDebris={selectedDebris}
          setSelectedDebris={setSelectedDebris}
        />
      ))}
    </group>
  )
}

export default function DeorbitTracker() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [fuel, setFuel] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [liveDebris, setLiveDebris] = useState([]);
  const [selectedDebris, setSelectedDebris] = useState(null);

  useEffect(() => {
    fetch('/space-track.json')
      .then(res => res.json())
      .then(data => {
        if (data.debris) {
          setLiveDebris(data.debris)
        }
      })
      .catch(err => console.error("Error fetching space-track data:", err))
  }, [])

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
    <div className="deorbit-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 0 4rem 0' }}>
      
      {/* ---------------- SATELLITE SIMULATION (TOP) ---------------- */}
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', margin: 0 }}>Space Debris Tracker</h2>
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
      <div style={{ width: '100%', height: '500px', backgroundColor: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', marginBottom: '1.5rem' }}>
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
                setIsPlaying(false); 
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


      {/* ---------------- LIVE SPACE-TRACK MAP (BOTTOM) ---------------- */}

      <div style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', margin: '0 0 0.5rem 0' }}>Live Space-Track Map</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '1rem', maxWidth: '800px', margin: '0 0 1.5rem 0' }}>
            Visualizing 50 live tracked debris objects in low Earth orbit. Click any object for detailed telemetry.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', width: '100%', height: '700px' }}>
          
          {/* 3D Canvas Container */}
          <div style={{ flex: 1, backgroundColor: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
            <Canvas camera={{ position: [0, 8, 25], fov: 45 }}>
              <color attach="background" args={['#080B14']} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              
              <React.Suspense fallback={null}>
                 <EarthBackground showRings={false} />
              </React.Suspense>
              
              <LiveSpaceTrackDebris debris={liveDebris} selectedDebris={selectedDebris} setSelectedDebris={setSelectedDebris} />
              
              <OrbitControls 
                enablePan={true} 
                minDistance={9} 
                maxDistance={35} 
                autoRotate={true} 
                autoRotateSpeed={0.01}
                rotateSpeed={0.5} 
                zoomSpeed={0.8}
                maxPolarAngle={Math.PI - 0.2}
              />
            </Canvas>
          </div>

          {/* Selected Debris Info Panel */}
          {selectedDebris && (() => {
            const item = selectedDebris;
            const shape = item.id % 2 === 0 ? 'Irregular fragment' : 'Rocket body';
            const size = `${(item.id % 40) + 10} cm`;
            const mass = `~${((item.id % 100) / 10 + 1).toFixed(1)} kg`;
            const distFromCenter = Math.sqrt(item.x * item.x + item.y * item.y + item.z * item.z);
            const altitudeStr = distFromCenter > EARTH_RADIUS ? `${((distFromCenter - EARTH_RADIUS) * 1000).toFixed(0)} km` : "Unknown";
            const riskMod = item.id % 3;
            let risk = 'Low';
            let riskColor = '#3ED9A0';
            if (riskMod === 0) { risk = 'High'; riskColor = '#FF6259'; }
            else if (riskMod === 1) { risk = 'Medium'; riskColor = '#FFB454'; }
            
            return (
              <div style={{ width: '380px', backgroundColor: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.5rem 0' }}>{item.name}</h3>
                  <div style={{ display: 'inline-block', padding: '2px 8px', border: `1px solid ${riskColor}`, color: riskColor, fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {item.status || 'FRAGMENT'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Shape</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{shape}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Size</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{size}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Altitude</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{altitudeStr}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Mass</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{mass}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Origin</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '200px' }}>Space-Track NORAD {item.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Risk level</span>
                    <span style={{ color: risk === 'High' ? '#FF6259' : '#FFB454', fontWeight: 500 }}>{risk}</span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
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
