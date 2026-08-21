import React, { useEffect, useState, useRef, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const projection = geoMercator()
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
  .center([80, 22])
  .scale(900);

const path = geoPath().projection(projection);

const telescopes = [
  { 
    name: "Mount Abu (Rajasthan)", 
    coordinates: [72.7792, 24.6548], 
    latStr: "24° 39' 17\" N", 
    lonStr: "72° 46' 45\" E",
    type: "Optical Observatory",
    status: "Active (Clear Skies)",
    aperture: "1.2m Infrared",
    network: "ISRO NETRA"
  },
  { 
    name: "Ponmudi (Kerala)", 
    coordinates: [77.12, 8.76], 
    latStr: "8° 46' 04\" N", 
    lonStr: "77° 07' 12\" E",
    type: "Radar Tracking Station",
    status: "Active",
    aperture: "Phased Array",
    network: "ISRO NETRA"
  },
  { 
    name: "Leh (Ladakh)", 
    coordinates: [78.9641, 32.7794], 
    latStr: "32° 46' 46\" N", 
    lonStr: "78° 57' 51\" E",
    type: "High-Altitude Optical",
    status: "Maintenance",
    aperture: "0.7m Wide-Field",
    network: "Project Vega Node"
  }
];

function TelescopeFOV({ isVega }) {
  const radiusTop = isVega ? 4.5 : 1.2;
  const height = 10;
  
  return (
    <group position={[0, height/2 + 0.5, 0]}>
      <mesh>
        <cylinderGeometry args={[radiusTop, 0.1, height, 32, 1, true]} />
        <meshBasicMaterial 
          color={isVega ? '#4FD1FF' : '#ffffff'} 
          transparent 
          opacity={isVega ? 0.25 : 0.15} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function DebrisParticles({ isVega }) {
  const groupRef = useRef();
  
  const debris = useMemo(() => {
    return new Array(isVega ? 120 : 15).fill(0).map(() => ({
      x: (Math.random() - 0.5) * (isVega ? 8 : 2), // Constrain to FOV
      y: 4 + Math.random() * 6,
      z: (Math.random() - 0.5) * (isVega ? 8 : 2),
      speed: 0.5 + Math.random() * 1.5,
      size: isVega ? (Math.random() > 0.7 ? 0.08 : 0.03) : 0.08 // Vega sees small debris
    }));
  }, [isVega]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.x += debris[i].speed * delta;
        const bound = isVega ? 4 : 1.5;
        if (child.position.x > bound) child.position.x = -bound; // wrap around tightly
      });
    }
  });

  return (
    <group ref={groupRef}>
      {debris.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.size, 8, 8]} />
          <meshBasicMaterial color={d.size < 0.05 ? '#4FD1FF' : '#ffffff'} />
        </mesh>
      ))}
    </group>
  );
}

function EarthSurface() {
  const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  return (
    <mesh position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <sphereGeometry args={[10.3, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.6} />
    </mesh>
  );
}

function VegaScene({ isVega }) {
  return (
    <>
      <color attach="background" args={['#050810']} />
      <Stars radius={50} depth={50} count={3000} factor={3} fade speed={1} />
      
      <React.Suspense fallback={null}>
         <EarthSurface />
      </React.Suspense>
      
      {/* High Contrast Telescope Dome */}
      <group position={[0, 0.3, 0]}>
         {/* Base */}
         <mesh position={[0, 0, 0]}>
           <cylinderGeometry args={[0.6, 0.6, 0.6, 32]} />
           <meshStandardMaterial color="#A0AAB5" metalness={0.6} roughness={0.4} />
         </mesh>
         {/* Dome */}
         <mesh position={[0, 0.3, 0]}>
           <sphereGeometry args={[0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
           <meshStandardMaterial color="#E8ECEF" metalness={0.6} roughness={0.3} />
         </mesh>
         {/* Lens Tube */}
         <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <cylinderGeometry args={[0.25, 0.25, 1.2, 16]} />
           <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} emissive="#222222" />
         </mesh>
      </group>

      <TelescopeFOV isVega={isVega} />
      <DebrisParticles isVega={isVega} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" />
      <pointLight position={[0, 2, 2]} intensity={5.0} distance={10} color="#4FD1FF" />
      
      <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2 - 0.1} minPolarAngle={0} autoRotate={true} autoRotateSpeed={0.5} target={[0, 4, 0]} />
    </>
  )
}

export default function GroundRelay({ onBack }) {
  const [hoveredTelescope, setHoveredTelescope] = useState(null);
  const [selectedTelescope, setSelectedTelescope] = useState(null);
  const [geographies, setGeographies] = useState([]);

  const connectionPathD = useMemo(() => {
    return telescopes.map((t, i) => {
      const [x, y] = projection(t.coordinates);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/india.json')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((topo) => {
        if (!cancelled) setGeographies(feature(topo, topo.objects.states).features);
      })
      .catch((err) => console.error('Failed to load map geographies:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ground-relay-page" style={{ padding: '0 0 2rem 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
             onClick={onBack} 
             style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: 0, transition: 'color 0.2s' }}
             onMouseEnter={(e) => e.target.style.color = 'var(--text)'}
             onMouseLeave={(e) => e.target.style.color = 'var(--text-dim)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="19" y1="12" x2="5" y2="12"></line>
               <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Dashboard
          </button>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', marginBottom: '0.5rem' }}>Ground Relay Network</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', maxWidth: '800px', margin: 0 }}>
            Live connection to terrestrial radar and optical tracking stations monitoring orbital assets.
          </p>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '1rem', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        backgroundColor: 'var(--panel)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
        flex: 1,
        minHeight: '600px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* HUD Elements overlay */}
        <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 }}>
           <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed var(--blue)', animation: 'spin 4s linear infinite', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--blue)', borderRadius: '50%' }}></div>
           </div>
           <div style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 'bold' }}>ISRO NETRA</div>
           <div style={{ color: 'var(--green)', fontSize: '0.75rem', animation: 'pulse 2s infinite' }}>● Uplink Active</div>
        </div>

        {/* Map Container */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              style={{ width: '100%', maxWidth: '800px', height: '100%' }}
            >
              <g>
                {geographies.map((geo, i) => (
                  <path key={i} d={path(geo)} className="relay-geography" />
                ))}
              </g>

              {/* Dotted Connections */}
              <path 
                d={connectionPathD} 
                fill="none" 
                stroke="var(--amber)" 
                strokeWidth="1.5" 
                strokeDasharray="6 6" 
                opacity="0.5"
                style={{ filter: 'drop-shadow(0 0 4px var(--amber))' }}
              />

              {/* Telescopes Markers */}
              {telescopes.map(t => {
                const [x, y] = projection(t.coordinates);
                const isSelected = selectedTelescope?.name === t.name;
                return (
                  <g
                    key={t.name}
                    transform={`translate(${x}, ${y})`}
                    onMouseEnter={() => setHoveredTelescope(t.name)}
                    onMouseLeave={() => setHoveredTelescope(null)}
                    onClick={() => setSelectedTelescope(t)}
                  >
                    <circle
                      r={hoveredTelescope === t.name || isSelected ? 10 : 7}
                      fill="var(--amber)"
                      stroke="var(--bg-2)"
                      strokeWidth={1.5}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        filter: hoveredTelescope === t.name || isSelected ? 'drop-shadow(0 0 12px var(--amber))' : 'drop-shadow(0 0 4px var(--amber))'
                      }}
                    />

                    {hoveredTelescope === t.name && (
                      <g pointerEvents="none">
                        <text
                          textAnchor="middle"
                          y={-38}
                          style={{ fill: 'var(--text)', fontSize: '16px', fontWeight: 'bold', filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.9))' }}
                        >
                          {t.name}
                        </text>
                        <text
                          textAnchor="middle"
                          y={-20}
                          style={{ fill: 'var(--amber)', fontSize: '13px', filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.9))' }}
                        >
                          {t.latStr} | {t.lonStr}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side Panel for Selected Telescope */}
          {selectedTelescope && (
            <div style={{ width: '350px', backgroundColor: 'var(--bg-2)', borderLeft: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>{selectedTelescope.name}</h3>
                <button 
                  onClick={() => setSelectedTelescope(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Network Affiliation</div>
                  <div style={{ color: 'var(--blue)', fontWeight: 'bold' }}>{selectedTelescope.network}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Facility Type</div>
                  <div style={{ color: 'var(--text)' }}>{selectedTelescope.type}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Primary Aperture</div>
                  <div style={{ color: 'var(--text)' }}>{selectedTelescope.aperture}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Current Status</div>
                  <div style={{ color: selectedTelescope.status.includes('Maintenance') ? 'var(--amber)' : 'var(--green)', fontWeight: 'bold' }}>
                    {selectedTelescope.status}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Coordinates</div>
                  <div style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{selectedTelescope.latStr}</div>
                  <div style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{selectedTelescope.lonStr}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- PROJECT VEGA UPGRADE ---------------- */}
        <div style={{ marginTop: '4rem', padding: '2rem', backgroundColor: '#080B14', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--text)', margin: '0 0 0.5rem 0', letterSpacing: '1px' }}>
              Project <span style={{color: 'var(--blue)', fontWeight: 800}}>Vega</span>
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', margin: 0, maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
              Comparing the standard terrestrial twilight observation system with our proposed Vega wide-field hardware upgrade for full night-sky debris tracking.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            
            {/* Before Upgrade */}
            <div style={{ flex: '1 1 400px', backgroundColor: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, color: 'var(--text-dim)' }}>BEFORE UPGRADE</h3>
                <h4 style={{ margin: '0.25rem 0 0 0', color: 'var(--text)', fontSize: '1.2rem' }}>STANDARD TWILIGHT OBSERVATION</h4>
              </div>
              <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                <Canvas camera={{ position: [0, 5, 14], fov: 50 }}>
                   <React.Suspense fallback={null}>
                     <VegaScene isVega={false} />
                   </React.Suspense>
                </Canvas>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Visible Debris ({'>'}5cm)</div>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Limited Sky Coverage</div>
              </div>
            </div>

            {/* After Upgrade */}
            <div style={{ flex: '1 1 400px', backgroundColor: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--blue)', overflow: 'hidden', boxShadow: '0 0 20px rgba(79, 209, 255, 0.15)' }}>
              <div style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(79, 209, 255, 0.05)' }}>
                <h3 style={{ margin: 0, color: 'var(--blue)' }}>AFTER UPGRADE (VEGA)</h3>
                <h4 style={{ margin: '0.25rem 0 0 0', color: 'var(--text)', fontSize: '1.2rem' }}>WIDE-FIELD EXTENDED TRACKING</h4>
              </div>
              <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                <Canvas camera={{ position: [0, 5, 14], fov: 50 }}>
                   <React.Suspense fallback={null}>
                     <VegaScene isVega={true} />
                   </React.Suspense>
                </Canvas>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  <span style={{color: 'var(--blue)', fontSize: '1.2rem', lineHeight: '0'}}>•</span> Increased Debris Detection
                </div>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Maximized Sky Coverage</div>
              </div>
            </div>

          </div>

          {/* Comparison Table */}
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
            <table style={{ width: '100%', maxWidth: '800px', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}></th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>Before Upgrade</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--blue)', color: 'var(--blue)' }}>Vega Upgrade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', textAlign: 'left', fontWeight: 'bold' }}>Observation Window</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Twilight Only</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Full Night Sky Capability</td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', textAlign: 'left', fontWeight: 'bold' }}>Debris Size Detection</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{'>'} 5 cm</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{'<'} 5 cm & {'>'} 5 cm (Enhanced Resolution)</td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', textAlign: 'left', fontWeight: 'bold' }}>Sky Coverage Area</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Limited (Narrow FOV)</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Wide (Wide FOV)</td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', textAlign: 'left', fontWeight: 'bold' }}>Tracking Efficiency</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Low</td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', color: 'var(--green)', fontWeight: 'bold' }}>High</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      <style>{`
        .relay-geography {
          fill: #0A101C;
          stroke: #2B7A99;
          stroke-width: 1;
          outline: none;
          transition: all 0.2s;
        }
        .relay-geography:hover {
          fill: #14223A;
          stroke: #4FD1FF;
          stroke-width: 1.5;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  )
}
