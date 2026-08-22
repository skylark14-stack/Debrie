import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- CONSTANTS & ORBITAL PARAMETERS ---
const EARTH_RADIUS = 2.0;

// Orbit 1: Initial Circular LEO Orbit (500 km altitude)
const ORBIT1_ALTITUDE_KM = 500;
const ORBIT1_RADIUS = 2.5;

// Orbit 2: Target Safe Circular Orbit (560 km altitude)
const ORBIT2_ALTITUDE_KM = 560;
const ORBIT2_RADIUS = 3.0;

const VELOCITY_ORBIT1_KMS = 7.61;
const VELOCITY_ORBIT2_KMS = 7.58;

// Fixed angle of the stationary debris on Orbit 1
const STATIONARY_DEBRIS_ANGLE = Math.PI * 0.65; // ~117 degrees

// Theme Palette matching OrbitGuard AI Aerospace System
const COLORS = {
  bg: '#080B14',
  panel: '#111827',
  panel2: '#0E1420',
  border: '#22314A',
  blue: '#4FD1FF',
  amber: '#FFB454',
  red: '#FF6259',
  green: '#3ED9A0',
  text: '#E9EEF7',
  textDim: '#8A96AC'
};

// --- PHOTOREALISTIC NASA BLUE MARBLE EARTH GLOBE ---
function NASAEarthMesh() {
  const earthRef = useRef();
  const atmosphereRef = useRef();

  // Load NASA Blue Marble High-Res Earth Imagery (Same as NASA & EarthGlobe component)
  const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  // Earth rotation removed to keep it static and normal for a 2D map view

  return (
    <group>
      {/* Real NASA Photorealistic Earth Surface (Flat 2D Look) */}
      <mesh ref={earthRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[EARTH_RADIUS, 64]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* Realistic Thin Atmosphere Layer */}
      <mesh ref={atmosphereRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[EARTH_RADIUS * 1.035, 64]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function EarthBody() {
  return (
    <React.Suspense fallback={
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[EARTH_RADIUS, 32]} />
        <meshBasicMaterial color="#0B2545" />
      </mesh>
    }>
      <NASAEarthMesh />
    </React.Suspense>
  );
}

// --- VIBRANT GLOWING ORBIT RINGS ---
function VibrantOrbits({ burnAngle, isTransiting }) {
  const orbit1Points = useMemo(() => {
    const pts = [];
    const count = 140;
    for (let i = 0; i <= count; i++) {
      const a = (i / count) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * ORBIT1_RADIUS, 0, Math.sin(a) * ORBIT1_RADIUS));
    }
    return pts;
  }, []);

  const orbit2Points = useMemo(() => {
    const pts = [];
    const count = 140;
    for (let i = 0; i <= count; i++) {
      const a = (i / count) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * ORBIT2_RADIUS, 0, Math.sin(a) * ORBIT2_RADIUS));
    }
    return pts;
  }, []);

  const hohmannPoints = useMemo(() => {
    if (burnAngle === null) return null;

    const r1 = ORBIT1_RADIUS;
    const r2 = ORBIT2_RADIUS;
    const a = (r1 + r2) / 2;
    const e = (r2 - r1) / (r1 + r2);

    const pts = [];
    const count = 100;
    for (let i = 0; i <= count; i++) {
      const nu = (i / count) * Math.PI;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
      const angle = nu + burnAngle;
      pts.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
    }
    return pts;
  }, [burnAngle]);

  return (
    <group>
      {/* Orbit 1 Line & Glow */}
      <Line points={orbit1Points} color={COLORS.blue} lineWidth={2.5} opacity={0.8} transparent />
      <Line points={orbit1Points} color={COLORS.blue} lineWidth={6} opacity={0.2} transparent />

      {/* Orbit 2 Line & Glow */}
      <Line points={orbit2Points} color={COLORS.green} lineWidth={2.5} opacity={0.85} transparent />
      <Line points={orbit2Points} color={COLORS.green} lineWidth={6} opacity={0.22} transparent />

      {/* Hohmann Avoidance Transfer Trajectory Stream */}
      {hohmannPoints && (
        <group>
          <Line
            points={hohmannPoints}
            color={isTransiting ? COLORS.amber : COLORS.green}
            lineWidth={4.5}
            opacity={0.95}
            transparent
          />
          <Line
            points={hohmannPoints}
            color={isTransiting ? COLORS.amber : COLORS.green}
            lineWidth={9}
            opacity={0.3}
            transparent
          />
        </group>
      )}
    </group>
  );
}

// --- DYNAMIC REAL ROCKET FIRE PLUME (NO LIGHT SHINING ON EARTH!) ---
function RealFirePlume({ active }) {
  const flameRef = useRef();
  const embersMeshRef = useRef();

  const count = 60;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const embers = useMemo(() => {
    const p = [];
    for (let i = 0; i < count; i++) {
      p.push({
        z: -0.1 - Math.random() * 0.5,
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.08,
        speed: 1.5 + Math.random() * 2.2,
        scale: 0.015 + Math.random() * 0.02
      });
    }
    return p;
  }, [count]);

  useFrame((state, delta) => {
    if (!active) return;

    // 1. Turbulent Fire Flame Flicker
    if (flameRef.current) {
      const time = state.clock.elapsedTime * 35;
      const flickerScaleX = 1 + Math.sin(time) * 0.12;
      const flickerScaleZ = 1 + Math.cos(time * 1.3) * 0.2;
      flameRef.current.scale.set(flickerScaleX, flickerScaleX, flickerScaleZ);
    }

    // 2. Fire Embers Dispersing in Vacuum
    if (embersMeshRef.current) {
      embers.forEach((eb, i) => {
        eb.z -= delta * eb.speed;
        if (eb.z < -0.7) {
          eb.z = -0.1;
          eb.x = (Math.random() - 0.5) * 0.06;
          eb.y = (Math.random() - 0.5) * 0.06;
        }

        dummy.position.set(eb.x, eb.y, eb.z);
        const s = eb.scale * (1 - Math.abs(eb.z) / 0.75);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        embersMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      embersMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <group position={[0, 0, -0.09]}>
      {/* Combustion Core & Fiery Flame Tongue */}
      <group ref={flameRef}>
        {/* Incandescent White Combustion Throat */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
          <coneGeometry args={[0.035, 0.15, 32]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Fiery Bright Yellow Inner Flame */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
          <coneGeometry args={[0.075, 0.35, 32]} />
          <meshBasicMaterial color="#FFDD44" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Real Fiery Red/Orange Flame Body */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.28]}>
          <coneGeometry args={[0.12, 0.55, 32]} />
          <meshBasicMaterial color="#FF3300" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* Fire Embers Particle Stream */}
      <instancedMesh ref={embersMeshRef} args={[null, null, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#FFAA00" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {/* STRICTLY LOCAL Micro Point-Light: Illuminates ONLY the satellite engine nozzle (distance: 0.35), NEVER Earth! */}
      <pointLight color="#FF5500" intensity={3.0} distance={0.5} position={[0, 0, -0.05]} />
    </group>
  );
}

// --- DETAILED SPACECRAFT MODEL ---
function DetailedSatellite({ position, rotationAngle, isFiringThruster, currentOrbitState }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.set(0, -rotationAngle + Math.PI / 2, 0);
      if (isFiringThruster) {
        const vib = Math.sin(state.clock.elapsedTime * 70) * 0.006;
        groupRef.current.rotation.x += vib;
        groupRef.current.rotation.z += vib;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Main Avionics Bus Chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.16]} />
        <meshStandardMaterial color="#E5E7EB" metalness={0.92} roughness={0.15} />
      </mesh>

      {/* 2. Gold Kapton Thermal Blanket Wrap */}
      <mesh position={[0, 0.051, 0]}>
        <boxGeometry args={[0.102, 0.002, 0.162]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* 3. Left Solar Array Wing */}
      <group position={[-0.2, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.26, 0.006, 0.12]} />
          <meshStandardMaterial color="#1E3A8A" metalness={0.7} roughness={0.1} emissive="#0F172A" />
        </mesh>
        <mesh position={[0, 0.004, 0]}>
          <boxGeometry args={[0.25, 0.001, 0.11]} />
          <meshBasicMaterial color={COLORS.blue} wireframe />
        </mesh>
      </group>

      {/* 4. Right Solar Array Wing */}
      <group position={[0.2, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.26, 0.006, 0.12]} />
          <meshStandardMaterial color="#1E3A8A" metalness={0.7} roughness={0.1} emissive="#0F172A" />
        </mesh>
        <mesh position={[0, 0.004, 0]}>
          <boxGeometry args={[0.25, 0.001, 0.11]} />
          <meshBasicMaterial color={COLORS.blue} wireframe />
        </mesh>
      </group>

      {/* 5. High-Gain Communications Dish */}
      <mesh position={[0, 0.08, 0.03]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.005, 0.025, 16]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* 6. Main Engine Nozzle */}
      <group position={[0, 0, -0.085]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.032, 0.03, 16]} />
          <meshStandardMaterial color="#1F2937" metalness={0.95} roughness={0.08} />
        </mesh>
      </group>

      {/* 7. Real Rocket Fire Thrust Effect */}
      <RealFirePlume active={isFiringThruster} />

      {/* (Status Halo removed per user request) */}
    </group>
  );
}

// --- STATIONARY DEBRIS HAZARD ---
function StationaryDebris({ position, visible }) {
  const ref = useRef();
  const flyInTime = useRef(0);

  React.useEffect(() => {
    if (visible) {
      flyInTime.current = 0;
    }
  }, [visible]);

  useFrame((state, delta) => {
    if (ref.current && visible) {
      ref.current.rotation.x += delta * 1.5;
      ref.current.rotation.y += delta * 2.2;

      // Fly-in animation from deep space
      if (flyInTime.current < 1.0) {
        flyInTime.current += delta * 2.0; // speed
        const t = Math.min(1.0, flyInTime.current);
        const ease = 1 - Math.pow(1 - t, 3); // Ease-out cubic
        const startOffset = 8; // start far away
        
        ref.current.position.set(
          position[0] + startOffset * (1 - ease),
          position[1],
          position[2] + startOffset * (1 - ease)
        );
      } else {
        ref.current.position.set(position[0], position[1], position[2]);
      }
    }
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={[position[0] + 8, position[1], position[2] + 8]}>
      <mesh>
        <dodecahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color={COLORS.red} />
      </mesh>
    </group>
  );
}

// --- MAIN 3D SCENE CANVAS ---
function CollisionRiskCanvas({
  satPos,
  satAngle,
  debrisPos,
  debrisVisible,
  burnAngle,
  isFiringThruster,
  currentOrbitState,
  isTransiting
}) {
  return (
    <div style={{ width: '100%', height: '540px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
      <Canvas orthographic camera={{ zoom: 70, position: [0, 10, 0] }}>
        <ambientLight intensity={0.4} />
        {/* Single Natural Directional Sun Light in Space */}
        <directionalLight position={[10, 4, 8]} intensity={2.6} />
        <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={1} />

        <EarthBody />

        <VibrantOrbits burnAngle={burnAngle} isTransiting={isTransiting} />

        <DetailedSatellite 
          position={satPos} 
          rotationAngle={satAngle} 
          isFiringThruster={isFiringThruster}
          currentOrbitState={currentOrbitState}
        />
        
        <StationaryDebris position={debrisPos} visible={debrisVisible} />

        <OrbitControls enableRotate={false} enablePan={true} enableZoom={true} minZoom={30} maxZoom={150} />
      </Canvas>

      {/* Visual Overlay Legend */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(11, 17, 31, 0.88)',
        backdropFilter: 'blur(8px)',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        border: `1px solid ${COLORS.border}`,
        fontSize: '0.8rem',
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: currentOrbitState === 'WARNING' ? COLORS.red : currentOrbitState === 'ORBIT2_SAFE' ? COLORS.green : COLORS.blue,
            boxShadow: `0 0 8px ${currentOrbitState === 'WARNING' ? COLORS.red : COLORS.blue}`
          }} />
          Simulation Mode: <span style={{ color: COLORS.blue }}>{currentOrbitState}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.73rem', color: COLORS.textDim }}>
          <span><span style={{ color: COLORS.blue, fontWeight: 'bold' }}>---</span> Orbit 1 (500km)</span>
          <span><span style={{ color: COLORS.green, fontWeight: 'bold' }}>---</span> Orbit 2 (560km)</span>
          {burnAngle !== null && <span><span style={{ color: COLORS.amber, fontWeight: 'bold' }}>---</span> Hohmann Transfer</span>}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        background: 'rgba(11, 17, 31, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        border: `1px solid ${COLORS.border}`,
        fontSize: '0.75rem',
        color: COLORS.textDim
      }}>
        Interactive 3D Space View • Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

// --- MAIN COMPONENT & STATE MACHINE ENGINE ---
export default function CollisionRisk() {
  // State Machine: 'NOMINAL' | 'WARNING' | 'BURN_1' | 'TRANSITING' | 'BURN_2' | 'ORBIT2_SAFE'
  const [currentOrbitState, setCurrentOrbitState] = useState('NOMINAL');
  const [autoAvoidance, setAutoAvoidance] = useState(true);
  const [simSpeed, setSimSpeed] = useState(0.5);

  // Kinematics & Transfer Angle Parameters
  const [satAngle, setSatAngle] = useState(0);
  const [burnAngle, setBurnAngle] = useState(null);
  const [isFiringThruster, setIsFiringThruster] = useState(false);
  const [debrisVisible, setDebrisVisible] = useState(false);

  // Telemetry Dashboard Gauges
  const [altitude, setAltitude] = useState(ORBIT1_ALTITUDE_KM);
  const [velocity, setVelocity] = useState(VELOCITY_ORBIT1_KMS);
  const [totalDeltaV, setTotalDeltaV] = useState(0.0);
  const [tca, setTca] = useState(40.0);
  const [missDistance, setMissDistance] = useState(0.045);
  const [distanceToDebris, setDistanceToDebris] = useState(1200);

  const stateRef = useRef(currentOrbitState);
  stateRef.current = currentOrbitState;
  const autoRef = useRef(autoAvoidance);
  autoRef.current = autoAvoidance;
  const speedRef = useRef(simSpeed);
  speedRef.current = simSpeed;

  const [debrisAngle, setDebrisAngle] = useState(STATIONARY_DEBRIS_ANGLE);

  const debrisPos = useMemo(() => {
    return [
      Math.cos(debrisAngle) * ORBIT1_RADIUS,
      0,
      Math.sin(debrisAngle) * ORBIT1_RADIUS
    ];
  }, [debrisAngle]);

  const handleTriggerDebrisEvent = () => {
    if (stateRef.current !== 'NOMINAL') return;
    setDebrisAngle(satAngle + Math.PI); // Spawn exactly opposite to the satellite
    setDebrisVisible(true);
    setTca(40.0);
    setMissDistance(0.045);
    setCurrentOrbitState('WARNING');
  };

  const executeHohmannTransferBurn = () => {
    if (stateRef.current !== 'WARNING') return;

    setCurrentOrbitState('BURN_1');
    setBurnAngle(satAngle);
    setIsFiringThruster(true);
    setTotalDeltaV(prev => prev + 1.62);

    setTimeout(() => {
      setIsFiringThruster(false);
      setCurrentOrbitState('TRANSITING');
      setMissDistance(14.8);
    }, 4500);
  };

  const handleCircularizeOrbit2 = () => {
    if (stateRef.current === 'TRANSITING') {
      setCurrentOrbitState('BURN_2');
      setIsFiringThruster(true);
      setTotalDeltaV(prev => prev + 1.58);

      setTimeout(() => {
        setIsFiringThruster(false);
        setCurrentOrbitState('ORBIT2_SAFE');
      }, 4500);
    }
  };

  const handleResetSimulation = () => {
    setCurrentOrbitState('NOMINAL');
    setSatAngle(0);
    setBurnAngle(null);
    setIsFiringThruster(false);
    setDebrisVisible(false);
    setAltitude(ORBIT1_ALTITUDE_KM);
    setVelocity(VELOCITY_ORBIT1_KMS);
    setTotalDeltaV(0.0);
    setTca(40.0);
    setMissDistance(0.045);
  };

  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const updatePhysics = (now) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      const currentSpeed = speedRef.current;
      const currentState = stateRef.current;

      setSatAngle(prevAngle => {
        const dAngle = deltaSec * 0.22 * currentSpeed;
        const newAngle = (prevAngle + dAngle) % (Math.PI * 2);

        let currentRadius = ORBIT1_RADIUS;

        if ((currentState === 'BURN_1' || currentState === 'TRANSITING' || currentState === 'BURN_2') && burnAngle !== null) {
          const r1 = ORBIT1_RADIUS;
          const r2 = ORBIT2_RADIUS;
          const a = (r1 + r2) / 2;
          const e = (r2 - r1) / (r1 + r2);
          
          let nu = newAngle - burnAngle;
          if (nu < 0) nu += Math.PI * 2;
          
          if (nu <= Math.PI) {
            currentRadius = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
          } else {
            currentRadius = ORBIT2_RADIUS;
          }
        } else if (currentState === 'ORBIT2_SAFE') {
          currentRadius = ORBIT2_RADIUS;
        }

        const currentAltKm = ORBIT1_ALTITUDE_KM + ((currentRadius - ORBIT1_RADIUS) / (ORBIT2_RADIUS - ORBIT1_RADIUS)) * (ORBIT2_ALTITUDE_KM - ORBIT1_ALTITUDE_KM);
        setAltitude(Math.round(currentAltKm * 10) / 10);

        const currentVel = currentState === 'ORBIT2_SAFE' ? VELOCITY_ORBIT2_KMS : VELOCITY_ORBIT1_KMS;
        setVelocity(currentVel);

        return newAngle;
      });

      setDebrisAngle(prevAngle => {
        // Revolve the debris in the opposite direction (retrograde orbit)
        const dAngle = deltaSec * 0.22 * currentSpeed;
        return (prevAngle - dAngle) % (Math.PI * 2);
      });

      if (currentState === 'WARNING') {
        setTca(prevTca => {
          const nextTca = Math.max(0, prevTca - deltaSec * currentSpeed * 5);
          if (autoRef.current && nextTca <= 22.0) {
            executeHohmannTransferBurn();
          }
          return Math.round(nextTca * 10) / 10;
        });
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [burnAngle]);

  const satPos = useMemo(() => {
    let currentRadius = ORBIT1_RADIUS;
    if ((currentOrbitState === 'BURN_1' || currentOrbitState === 'TRANSITING' || currentOrbitState === 'BURN_2') && burnAngle !== null) {
      const r1 = ORBIT1_RADIUS;
      const r2 = ORBIT2_RADIUS;
      const a = (r1 + r2) / 2;
      const e = (r2 - r1) / (r1 + r2);
      let nu = satAngle - burnAngle;
      if (nu < 0) nu += Math.PI * 2;
      if (nu <= Math.PI) {
        currentRadius = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
      } else {
        currentRadius = ORBIT2_RADIUS;
      }
    } else if (currentOrbitState === 'ORBIT2_SAFE') {
      currentRadius = ORBIT2_RADIUS;
    }
    return [Math.cos(satAngle) * currentRadius, 0, Math.sin(satAngle) * currentRadius];
  }, [satAngle, currentOrbitState, burnAngle]);

  useEffect(() => {
    if (!debrisVisible) {
      setDistanceToDebris(1200);
      return;
    }
    const dx = satPos[0] - debrisPos[0];
    const dy = satPos[1] - debrisPos[1];
    const dz = satPos[2] - debrisPos[2];
    const dist3d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const distKm = Math.round(dist3d * 320 * 10) / 10;
    setDistanceToDebris(distKm);
  }, [satPos, debrisPos, debrisVisible]);

  return (
    <div style={{ padding: '1.5rem 0', color: COLORS.text }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h2 style={{ fontSize: '2.2rem', color: COLORS.blue, margin: 0, fontWeight: 700 }}>
              Collision Risk Calculations
            </h2>
            <span style={{
              background: currentOrbitState === 'WARNING' ? 'rgba(255, 98, 89, 0.2)' : currentOrbitState.includes('BURN') ? 'rgba(255, 180, 84, 0.2)' : currentOrbitState === 'ORBIT2_SAFE' ? 'rgba(62, 217, 160, 0.2)' : 'rgba(79, 209, 255, 0.2)',
              border: `1px solid ${currentOrbitState === 'WARNING' ? COLORS.red : currentOrbitState.includes('BURN') ? COLORS.amber : currentOrbitState === 'ORBIT2_SAFE' ? COLORS.green : COLORS.blue}`,
              color: currentOrbitState === 'WARNING' ? COLORS.red : currentOrbitState.includes('BURN') ? COLORS.amber : currentOrbitState === 'ORBIT2_SAFE' ? COLORS.green : COLORS.blue,
              padding: '0.2rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              {currentOrbitState === 'NOMINAL' && 'ORBIT 1: NOMINAL (500km)'}
              {currentOrbitState === 'WARNING' && 'WARNING: STATIONARY DEBRIS AHEAD'}
              {currentOrbitState === 'BURN_1' && 'MANEUVER: HOHMANN TRANSFER BURN'}
              {currentOrbitState === 'TRANSITING' && 'TRANSITING TO ORBIT 2'}
              {currentOrbitState === 'BURN_2' && 'CIRCULARIZING ORBIT 2'}
              {currentOrbitState === 'ORBIT2_SAFE' && 'ORBIT 2: SAFE CLEARANCE (560km)'}
            </span>
          </div>
          <h3 style={{ margin: '0.5rem 0', color: COLORS.text, fontSize: '1.4rem' }}>Hohmann Transfer</h3>
          <p style={{ color: COLORS.textDim, margin: 0, fontSize: '0.95rem', maxWidth: '850px' }}>
            Demonstrates an unexpected stationary debris hazard on <strong>Orbit 1 (500km)</strong> and the autonomous <strong>Hohmann Transfer</strong> maneuver to switch satellite position up into <strong>Orbit 2 (560km)</strong>.
          </p>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {(currentOrbitState === 'WARNING' || currentOrbitState === 'BURN_1') && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(255, 98, 89, 0.18) 0%, rgba(17, 24, 39, 0.95) 100%)',
          borderLeft: `4px solid ${COLORS.red}`,
          borderTop: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(255, 98, 89, 0.2)',
          animation: 'pulseAlert 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 98, 89, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.red,
              fontSize: '1.5rem'
            }}>
              🚨
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', color: COLORS.red, fontSize: '1.05rem', fontWeight: 700 }}>
                CRITICAL CONJUNCTION: STATIONARY DEBRIS ON ORBIT 1
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: COLORS.text }}>
                Untracked derelict object detected stationary directly ahead at <strong>Orbit 1 (500 km)</strong> waypoint.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: COLORS.textDim, textTransform: 'uppercase' }}>Collision Risk</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: COLORS.red }}>CRITICAL</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: COLORS.textDim, textTransform: 'uppercase' }}>Nominal Clearance</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: COLORS.amber }}>45 meters</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: COLORS.textDim, textTransform: 'uppercase' }}>Time to Impact</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: COLORS.red }}>{tca}s</div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Render Canvas */}
      <CollisionRiskCanvas
        satPos={satPos}
        satAngle={satAngle}
        debrisPos={debrisPos}
        debrisVisible={debrisVisible}
        burnAngle={burnAngle}
        isFiringThruster={isFiringThruster}
        currentOrbitState={currentOrbitState}
        isTransiting={currentOrbitState === 'TRANSITING'}
      />

      {/* Control Panel Bar */}
      <div style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginTop: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleTriggerDebrisEvent}
            disabled={currentOrbitState !== 'NOMINAL'}
            style={{
              padding: '0.75rem 1.4rem',
              backgroundColor: currentOrbitState === 'NOMINAL' ? COLORS.red : '#374151',
              color: currentOrbitState === 'NOMINAL' ? '#FFFFFF' : COLORS.textDim,
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: currentOrbitState === 'NOMINAL' ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: currentOrbitState === 'NOMINAL' ? '0 4px 14px rgba(255, 98, 89, 0.3)' : 'none'
            }}
          >
            Trigger Stationary Debris Event
          </button>

          {!autoAvoidance && currentOrbitState === 'WARNING' && (
            <button
              onClick={executeHohmannTransferBurn}
              style={{
                padding: '0.75rem 1.4rem',
                backgroundColor: COLORS.blue,
                color: '#080B14',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(79, 209, 255, 0.4)',
                animation: 'pulseBtn 1.5s infinite'
              }}
            >
              Manual Hohmann Transfer Burn (+1.62 m/s)
            </button>
          )}

          {currentOrbitState === 'TRANSITING' && (
            <button
              onClick={handleCircularizeOrbit2}
              style={{
                padding: '0.75rem 1.4rem',
                backgroundColor: COLORS.green,
                color: '#080B14',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(62, 217, 160, 0.3)'
              }}
            >
              Circularize into Orbit 2 (+1.58 m/s)
            </button>
          )}

          <button
            onClick={handleResetSimulation}
            style={{
              padding: '0.75rem 1.2rem',
              backgroundColor: 'transparent',
              color: COLORS.textDim,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Reset to Orbit 1
          </button>
        </div>

        {/* Toggles & Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.textDim }}>Auto-Avoidance:</span>
            <button
              onClick={() => setAutoAvoidance(!autoAvoidance)}
              style={{
                background: autoAvoidance ? COLORS.green : '#374151',
                color: autoAvoidance ? '#080B14' : COLORS.text,
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {autoAvoidance ? 'AUTOMATED (ON)' : 'MANUAL (OFF)'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.textDim }}>Speed:</span>
            {[0.5, 1, 3].map(spd => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                style={{
                  background: simSpeed === spd ? COLORS.blue : COLORS.panel2,
                  color: simSpeed === spd ? '#080B14' : COLORS.textDim,
                  border: `1px solid ${COLORS.border}`,
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry Dashboard HUD */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginTop: '1.25rem'
      }}>
        <div style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Satellite Altitude
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: altitude > 520 ? COLORS.green : COLORS.blue }}>
            {altitude} <span style={{ fontSize: '0.9rem', color: COLORS.textDim, fontWeight: 400 }}>km</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textDim, marginTop: '0.2rem' }}>
            {altitude > 520 ? 'Target Orbit 2 (560km)' : 'Initial Orbit 1 (500km)'}
          </div>
        </div>

        <div style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Orbital Velocity
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: COLORS.text }}>
            {velocity} <span style={{ fontSize: '0.9rem', color: COLORS.textDim, fontWeight: 400 }}>km/s</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textDim, marginTop: '0.2rem' }}>
            {altitude > 520 ? 'v_orbit2 = 7.58 km/s' : 'v_orbit1 = 7.61 km/s'}
          </div>
        </div>

        <div style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Distance to Debris
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: distanceToDebris < 150 ? COLORS.red : COLORS.amber }}>
            {distanceToDebris} <span style={{ fontSize: '0.9rem', color: COLORS.textDim, fontWeight: 400 }}>km</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textDim, marginTop: '0.2rem' }}>
            {currentOrbitState === 'ORBIT2_SAFE' ? 'Safely Above Orbit 1 Debris' : 'Approaching Debris'}
          </div>
        </div>

        <div style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Total Δv Expended
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: COLORS.green }}>
            {totalDeltaV.toFixed(2)} <span style={{ fontSize: '0.9rem', color: COLORS.textDim, fontWeight: 400 }}>m/s</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textDim, marginTop: '0.2rem' }}>
            Hohmann transfer Δv1 + Δv2
          </div>
        </div>

        <div style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Miss Clearance Distance
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: missDistance > 1 ? COLORS.green : COLORS.red }}>
            {missDistance > 1 ? `${missDistance} km` : `${Math.round(missDistance * 1000)} m`}
          </div>
          <div style={{ fontSize: '0.75rem', color: COLORS.textDim, marginTop: '0.2rem' }}>
            Safety Altitude Margin: 60 km
          </div>
        </div>
      </div>
    </div>
  );
}
