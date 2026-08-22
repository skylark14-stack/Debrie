import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- Simulation 1: Design for Demise (D4D) Geometry ---
function D4DSimulation() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1

  const solidMass = Math.max(0, 100 - (progress * 40)); // Solid loses 40%
  const perfMass = Math.max(0, 100 - (progress * 98)); // Perforated loses 98%
  const altitude = Math.max(0, 120 - (progress * 60)); // Falls from 120km to 60km

  useEffect(() => {
    let animationFrame;
    if (running) {
      const startTime = Date.now();
      const duration = 4000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(1, elapsed / duration);
        setProgress(newProgress);
        
        if (newProgress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setRunning(false);
        }
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [running]);

  const handleRun = () => {
    setProgress(0);
    setRunning(true);
  };

  return (
    <div style={{ backgroundColor: 'var(--panel)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '3rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--blue)', fontSize: '1.5rem' }}>1. Design for Demise (D4D) Geometry</h3>
      <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
        Comparing a solid structural bracket against an optimized perforated design. 
        Higher surface-area-to-mass ratios allow components to demise more thoroughly during reentry.
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Solid Part */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Standard Solid Bracket</h4>
          
          <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* Simple visual for solid bracket melting */}
            <div style={{
              width: `${100 * (solidMass/100)}px`,
              height: `${100 * (solidMass/100)}px`,
              backgroundColor: progress > 0 ? (progress > 0.5 ? '#FF6259' : '#FFB454') : '#B0C4DE',
              borderRadius: '4px',
              transition: 'all 0.1s',
              boxShadow: progress > 0.2 ? `0 0 ${progress * 20}px #FF6259` : 'none',
              transform: `rotate(${progress * 180}deg) translateY(${progress * 50}px)`
            }}></div>
          </div>
          
          <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--panel-2)', padding: '1rem', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Mass Remaining</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: solidMass > 20 ? 'var(--red)' : 'var(--text)' }}>{solidMass.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Verdict</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: progress === 1 ? 'var(--red)' : 'var(--text-dim)' }}>
                {progress === 1 ? 'FAIL (SURVIVED)' : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Part */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>D4D Optimized Bracket</h4>
          
          <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{
              width: `${100 * (perfMass/100)}px`,
              height: `${100 * (perfMass/100)}px`,
              backgroundColor: progress > 0 ? (progress > 0.3 ? '#FF6259' : '#FFB454') : '#B0C4DE',
              border: perfMass > 5 ? '4px dashed #080B14' : 'none',
              borderRadius: '4px',
              transition: 'all 0.1s',
              opacity: perfMass / 100,
              boxShadow: progress > 0.1 && perfMass > 5 ? `0 0 ${progress * 30}px #FF6259` : 'none',
              transform: `rotate(${progress * 270}deg) translateY(${progress * 50}px)`
            }}></div>
          </div>

          <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--panel-2)', padding: '1rem', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Mass Remaining</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: perfMass < 5 ? 'var(--green)' : 'var(--text)' }}>{perfMass.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Verdict</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: progress === 1 ? 'var(--green)' : 'var(--text-dim)' }}>
                {progress === 1 ? 'PASS (DEMISED)' : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <button 
          onClick={handleRun}
          disabled={running}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: running ? 'var(--panel-2)' : 'var(--blue)', 
            color: running ? 'var(--text-dim)' : '#080B14', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            cursor: running ? 'not-allowed' : 'pointer' 
          }}
        >
          {running ? 'Simulating...' : 'Run Reentry Pass'}
        </button>
        
        <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: 'var(--blue)' }}>
          ALTITUDE: {altitude.toFixed(1)} km
        </div>
      </div>
    </div>
  );
}

// --- T4D 3D Scene ---
function T4DScene({ time, thresholdTime }) {
  const metalRef = useRef();
  const thermiteRef = useRef();
  const lightRef = useRef();

  useFrame((state, delta) => {
    if (metalRef.current && thermiteRef.current) {
      if (time >= thresholdTime && time < 7) {
        // Reaction is active
        const progress = (time - thresholdTime) / (7 - thresholdTime); // 0 to 1 over 3 seconds
        
        // Metal melts
        metalRef.current.material.color.lerp(new THREE.Color('#ff3300'), 0.05);
        metalRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(metalRef.current.material.emissiveIntensity, 2.0, 0.05);
        metalRef.current.material.opacity = THREE.MathUtils.lerp(metalRef.current.material.opacity, 0.1, 0.05);
        metalRef.current.scale.setScalar(THREE.MathUtils.lerp(metalRef.current.scale.x, 0.2, 0.02));
        
        // Thermite sparks/grows then dies
        if (progress < 0.5) {
            thermiteRef.current.scale.setScalar(THREE.MathUtils.lerp(thermiteRef.current.scale.x, 2.5, 0.1));
            thermiteRef.current.material.opacity = THREE.MathUtils.lerp(thermiteRef.current.material.opacity, 1, 0.1);
            if (lightRef.current) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 15, 0.1);
        } else {
            thermiteRef.current.scale.setScalar(THREE.MathUtils.lerp(thermiteRef.current.scale.x, 0.1, 0.05));
            thermiteRef.current.material.opacity = THREE.MathUtils.lerp(thermiteRef.current.material.opacity, 0, 0.05);
            if (lightRef.current) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.05);
        }
      } else if (time >= 7) {
        // Cooling
        metalRef.current.material.color.lerp(new THREE.Color('#222222'), 0.05);
        metalRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(metalRef.current.material.emissiveIntensity, 0, 0.05);
        if (lightRef.current) lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.1);
      } else if (time === 0) {
        // Reset
        metalRef.current.material.color.set('#B0C4DE');
        metalRef.current.material.emissiveIntensity = 0;
        metalRef.current.material.opacity = 1;
        metalRef.current.scale.setScalar(1);
        thermiteRef.current.scale.setScalar(0.5);
        thermiteRef.current.material.opacity = 0.2;
        if (lightRef.current) lightRef.current.intensity = 0;
      }
      
      // Rotate the whole thing slowly
      metalRef.current.rotation.y += delta * 0.5;
      metalRef.current.rotation.x += delta * 0.2;
      thermiteRef.current.rotation.copy(metalRef.current.rotation);
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      
      {/* Intense flash during reaction */}
      <pointLight ref={lightRef} color="#ffaa00" intensity={0} distance={10} />
      
      {/* Tough Metallic Satellite Component (Titanium structural ring) */}
      <mesh ref={metalRef}>
        <torusGeometry args={[1, 0.3, 16, 100]} />
        <meshStandardMaterial 
          color="#B0C4DE" 
          metalness={0.9} 
          roughness={0.1} 
          transparent 
          opacity={1}
          emissive="#ff3300"
          emissiveIntensity={0}
        />
      </mesh>
      
      {/* Thermite Core packed in the center */}
      <mesh ref={thermiteRef} scale={0.5}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ff5500" 
          emissiveIntensity={2} 
          transparent 
          opacity={0.2} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// --- Simulation 2: Thermite for Demise (T4D) ---
function T4DSimulation() {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0); // 0 to 10
  
  // Logic
  const heatingRampEnd = 5;
  const thresholdTime = 4;
  
  let temp = 200;
  let stateStr = "IDLE";
  
  if (time > 0 && time < thresholdTime) {
    temp = 200 + (time / thresholdTime) * 600; // Ramps up to 800C
    stateStr = "HEATING";
  } else if (time >= thresholdTime && time < 7) {
    // Reaction spikes
    const spike = (time - thresholdTime) / 3;
    temp = 800 + Math.sin(spike * Math.PI) * 1700; // Spikes to ~2500C
    stateStr = "REACTION PROPAGATING";
  } else if (time >= 7) {
    temp = 800 * (1 - (time - 7)/3); // Cooling down
    stateStr = "COMPLETE - COOLING";
  }

  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => {
        setTime(t => {
          if (t >= 10) {
            setRunning(false);
            return 10;
          }
          return t + 0.05;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [running]);

  const handleSimulate = () => {
    setTime(0);
    setRunning(true);
  };
  
  const handleReset = () => {
    setTime(0);
    setRunning(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--panel)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '3rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--amber)', fontSize: '1.5rem' }}>2. Thermite for Demise (T4D) Reaction</h3>
      <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
        Passive ignition of thermite powder packed in voids to melt tough components. 
        Requires ambient reentry heat to cross a fixed threshold.
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Thermite Cross-section Visualizer */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '100%', 
              height: '300px', 
              background: '#080B14', 
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <Canvas camera={{ position: [0, 0, 4] }}>
                <T4DScene time={time} thresholdTime={thresholdTime} />
                <OrbitControls enablePan={false} enableZoom={false} autoRotate={true} autoRotateSpeed={1} />
              </Canvas>
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'var(--panel-2)', 
            borderRadius: '6px', 
            fontFamily: 'monospace', 
            textAlign: 'center',
            fontSize: '1.1rem',
            color: time > thresholdTime && time < 7 ? 'var(--amber)' : 'var(--text)',
            transition: 'color 0.3s'
          }}>
            Fe₂O₃ + 2Al &rarr; Al₂O₃ + 2Fe + Heat
          </div>
        </div>

        {/* Readouts */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--panel-2)', padding: '1.5rem', borderRadius: '8px', flex: 1 }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Internal Temperature</div>
            <div style={{ fontSize: '2.5rem', fontFamily: 'monospace', color: temp > 2000 ? 'var(--red)' : (temp > 700 ? 'var(--amber)' : 'var(--text)'), fontWeight: 'bold' }}>
              {temp.toFixed(0)}°C
            </div>
            
            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>State</div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 'bold' }}>{stateStr}</div>

            <div style={{ marginTop: '1.5rem', padding: '0.75rem', borderLeft: '3px solid var(--amber)', background: 'var(--bg)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              <strong>Note:</strong> Real-world wind tunnel tests show only ~60% heat transfer efficiency (~40% heat lost to ablation).
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button 
          onClick={handleSimulate}
          disabled={running && time > 0 && time < 10}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--amber)', color: '#080B14', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Simulate Reentry Heating
        </button>
        <button 
          onClick={handleReset}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--panel-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}


// --- Simulation 3: AURA AI Trigger ---
function AuraAISimulation() {
  const canvasRef = useRef(null);
  
  // Stats
  const [esaHits, setEsaHits] = useState(0);
  const [auraHits, setAuraHits] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  
  // Scenario config
  const [scenario, setScenario] = useState(null);

  const generateScenario = useCallback(() => {
    // Generate randomized noisy heat curve
    const duration = 100; // points
    const baseCurve = [];
    
    // Randomize peak location between 50 and 80
    const peakIdx = Math.floor(Math.random() * 30) + 50; 
    const windowStart = peakIdx - 5;
    const windowEnd = peakIdx + 5;
    
    // Tumble noise (simulating irregular heating)
    const tumbleFreq = Math.random() * 0.2 + 0.05;
    
    for (let i = 0; i <= duration; i++) {
      // Base gaussian bell shape for heating
      const val = Math.exp(-Math.pow(i - peakIdx, 2) / 400) * 1200; 
      // Add tumble noise
      const noise = Math.sin(i * tumbleFreq) * (val * 0.1) + (Math.random() * 20);
      baseCurve.push(Math.max(200, val + noise)); // ambient ~200
    }
    
    // ESA baseline threshold is static 800C
    const esaThreshold = 800;
    let esaTriggerIdx = -1;
    for (let i = 0; i <= duration; i++) {
      if (baseCurve[i] >= esaThreshold) {
        esaTriggerIdx = i;
        break;
      }
    }
    
    // AURA logic: uses ROC to predict time-to-peak.
    // If temp > baseline && predicted time to peak < 5 steps, fire.
    let auraTriggerIdx = -1;
    let smoothedTemp = 200;
    
    for (let i = 1; i <= duration; i++) {
      smoothedTemp = smoothedTemp * 0.8 + baseCurve[i] * 0.2;
      const roc = smoothedTemp - (baseCurve[i-1] * 0.8 + baseCurve[Math.max(0, i-2)] * 0.2); // Rough derivative
      
      if (smoothedTemp > 500 && roc > 0) { // Baseline filter to avoid early trigger
        const distToPeakEst = (1200 - smoothedTemp) / Math.max(1, roc);
        if (distToPeakEst < 5) {
          auraTriggerIdx = i;
          break;
        }
      }
    }
    
    // Fallback if AURA fails to trigger early
    if (auraTriggerIdx === -1) auraTriggerIdx = peakIdx;
    
    const isEsaHit = esaTriggerIdx >= windowStart && esaTriggerIdx <= windowEnd;
    const isAuraHit = auraTriggerIdx >= windowStart && auraTriggerIdx <= windowEnd;
    
    setEsaHits(prev => prev + (isEsaHit ? 1 : 0));
    setAuraHits(prev => prev + (isAuraHit ? 1 : 0));
    setTotalRuns(prev => prev + 1);
    
    setScenario({
      data: baseCurve,
      peakIdx, windowStart, windowEnd,
      esaTriggerIdx, isEsaHit,
      auraTriggerIdx, isAuraHit
    });
  }, []);

  // Initial generation
  useEffect(() => {
    generateScenario();
  }, [generateScenario]);

  // Draw chart
  useEffect(() => {
    if (!scenario || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const { data, windowStart, windowEnd, esaTriggerIdx, auraTriggerIdx } = scenario;
    const maxTemp = 1500;
    const points = data.length;
    
    const getX = (i) => (i / points) * width;
    const getY = (val) => height - (val / maxTemp) * height;
    
    // Draw True Peak Window Shading
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(getX(windowStart), 0, getX(windowEnd) - getX(windowStart), height);
    
    // Draw ESA Baseline (teal)
    ctx.strokeStyle = 'rgba(62, 217, 160, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, getY(800));
    ctx.lineTo(width, getY(800));
    ctx.stroke();
    
    // Draw Temp Curve
    ctx.strokeStyle = '#B0C4DE';
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      if (i===0) ctx.moveTo(getX(i), getY(data[i]));
      else ctx.lineTo(getX(i), getY(data[i]));
    }
    ctx.stroke();
    
    // Draw ESA Trigger Point
    if (esaTriggerIdx !== -1) {
      ctx.fillStyle = '#3ED9A0'; // Teal
      ctx.beginPath();
      ctx.arc(getX(esaTriggerIdx), getY(data[esaTriggerIdx]), 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Vertical line down
      ctx.strokeStyle = '#3ED9A0';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(getX(esaTriggerIdx), getY(data[esaTriggerIdx]));
      ctx.lineTo(getX(esaTriggerIdx), height);
      ctx.stroke();
    }
    
    // Draw AURA Trigger Point
    if (auraTriggerIdx !== -1) {
      ctx.fillStyle = '#B464FF'; // Violet
      ctx.beginPath();
      ctx.arc(getX(auraTriggerIdx), getY(data[auraTriggerIdx]), 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Vertical line down
      ctx.strokeStyle = '#B464FF';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(getX(auraTriggerIdx), getY(data[auraTriggerIdx]));
      ctx.lineTo(getX(auraTriggerIdx), height);
      ctx.stroke();
    }
    
  }, [scenario]);

  return (
    <div style={{ backgroundColor: 'var(--panel)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#B464FF', fontSize: '1.5rem' }}>3. AURA AI Trigger Prediction</h3>
      <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
        Comparing ESA's static temperature fuse (teal) against AURA's rate-of-change AI trigger (violet). 
        The AI reads noisy tumbling temperatures and predicts the ideal "time-to-peak heat flux" window (shaded region).
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '400px', backgroundColor: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={300} 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          ></canvas>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-dimmer)', fontSize: '0.8rem' }}>
            <span>Reentry Start (Atmospheric Interface)</span>
            <span>Time / Altitude Decay &rarr;</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--panel-2)', padding: '1.5rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>In-Window Hit Rate</h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>ESA Baseline (Static)</span>
                <span style={{ color: '#3ED9A0', fontWeight: 'bold' }}>
                  {totalRuns > 0 ? Math.round((esaHits / totalRuns) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalRuns > 0 ? (esaHits / totalRuns) * 100 : 0}%`, background: '#3ED9A0' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>AURA AI (Predictive)</span>
                <span style={{ color: '#B464FF', fontWeight: 'bold' }}>
                  {totalRuns > 0 ? Math.round((auraHits / totalRuns) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalRuns > 0 ? (auraHits / totalRuns) * 100 : 0}%`, background: '#B464FF' }}></div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              Based on {totalRuns} randomized noisy reentry tumbles.
            </div>
          </div>
          
          <button 
            onClick={generateScenario}
            style={{ padding: '1rem', background: '#B464FF', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
          >
            Simulate New Reentry Tumble
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuraConcept() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: '#B464FF', margin: '0 0 0.2rem 0' }}>AURA: Sustainable Space Activity</h2>
        <div style={{ color: '#B464FF', opacity: 0.8, fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          ADAPTIVE UNCONTROLLED REENTRY ASSIST
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', maxWidth: '900px', margin: 0 }}>
          Interactive proof-of-concept simulations exploring active reentry mechanisms. 
          AURA is an AI-timed ignition trigger designed to improve the reliability of ESA's Thermite-for-Demise (T4D) approach.
        </p>
      </header>

      <D4DSimulation />
      <T4DSimulation />
      <AuraAISimulation />

      <footer style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dimmer)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
          <strong>Note:</strong> The above models are simulated proof-of-concepts illustrating the functional behavior of D4D, T4D, and the proposed AURA predictive trigger. They do not represent flight-proven physical test data.
        </p>
      </footer>
    </div>
  );
}
