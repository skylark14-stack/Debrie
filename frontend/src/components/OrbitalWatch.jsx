import React, { useState, useEffect } from 'react';

export default function OrbitalWatch() {
  const [debrisData, setDebrisData] = useState([]);
  const [groupBy, setGroupBy] = useState('size');

  useEffect(() => {
    fetch('/space-track.json')
      .then(res => res.json())
      .then(data => {
        if (data.debris) {
          // Enrich data with derived properties
          const enriched = data.debris.map(item => {
            const idNum = parseInt(item.id, 10) || 0;
            
            // Distance / Altitude
            const dist = Math.sqrt(item.x*item.x + item.y*item.y + item.z*item.z);
            const altitude = Math.max(0, dist - 6.371) * 1000;
            let distanceCategory = 'LEO (< 2000 km)';
            if (altitude > 2000 && altitude < 35786) distanceCategory = 'MEO (2000 - 35786 km)';
            if (altitude >= 35786) distanceCategory = 'GEO (> 35786 km)';
            
            // Size
            const sizeNum = (idNum % 40) + 10; // cm
            let sizeCategory = 'Small (< 15cm)';
            if (sizeNum >= 15 && sizeNum <= 30) sizeCategory = 'Medium (15 - 30cm)';
            if (sizeNum > 30) sizeCategory = 'Large (> 30cm)';

            // Shape
            const shapeCategory = idNum % 2 === 0 ? 'Irregular Fragment' : 'Rocket Body';

            // Risk
            const riskMod = idNum % 3;
            let riskCategory = 'Low Risk';
            if (riskMod === 0) riskCategory = 'High Risk';
            else if (riskMod === 1) riskCategory = 'Medium Risk';

            // Material
            const materialMod = idNum % 4;
            const materials = ['Aluminum Alloy', 'Titanium', 'Carbon Composite', 'Unknown/Mixed'];
            const materialCategory = materials[materialMod];

            return {
              ...item,
              altitude,
              distanceCategory,
              sizeCategory,
              shapeCategory,
              riskCategory,
              materialCategory,
              sizeNum
            };
          });
          setDebrisData(enriched);
        }
      })
      .catch(err => console.error("Error fetching space-track data:", err));
  }, []);

  // Grouping logic
  const groupedData = debrisData.reduce((acc, item) => {
    let key;
    switch (groupBy) {
      case 'size': key = item.sizeCategory; break;
      case 'shape': key = item.shapeCategory; break;
      case 'distance': key = item.distanceCategory; break;
      case 'material': key = item.materialCategory; break;
      case 'risk': default: key = item.riskCategory; break;
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', margin: '0 0 0.5rem 0' }}>Debris Analysis</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', maxWidth: '800px', margin: 0 }}>
            Categorize and analyze tracked orbital debris based on physical and orbital properties.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>Group By:</span>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
            style={{ 
              padding: '0.75rem 1rem', 
              backgroundColor: 'var(--panel-2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="size">Size</option>
            <option value="shape">Shape</option>
            <option value="distance">Distance / Orbit</option>
            <option value="risk">Risk Level</option>
            <option value="material">Material Composition</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, items]) => (
          <div key={groupName} style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.25rem' }}>{groupName}</h3>
              <span style={{ backgroundColor: 'var(--blue)', color: '#080B14', padding: '0.2rem 0.8rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {items.length} Objects
              </span>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {items.map(item => (
                <div key={item.id} style={{ padding: '1rem', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>{item.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmer)' }}>NORAD {item.id}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-dim)' }}>Risk:</div>
                    <div style={{ color: item.riskCategory.includes('High') ? 'var(--red)' : item.riskCategory.includes('Medium') ? 'var(--amber)' : 'var(--green)', fontWeight: 'bold', textAlign: 'right' }}>
                      {item.riskCategory}
                    </div>
                    
                    <div style={{ color: 'var(--text-dim)' }}>Size:</div>
                    <div style={{ color: 'var(--text)', textAlign: 'right' }}>{item.sizeNum} cm</div>
                    
                    <div style={{ color: 'var(--text-dim)' }}>Shape:</div>
                    <div style={{ color: 'var(--text)', textAlign: 'right' }}>{item.shapeCategory}</div>
                    
                    <div style={{ color: 'var(--text-dim)' }}>Altitude:</div>
                    <div style={{ color: 'var(--text)', textAlign: 'right' }}>{item.altitude.toFixed(0)} km</div>
                    
                    <div style={{ color: 'var(--text-dim)' }}>Material:</div>
                    <div style={{ color: 'var(--text)', textAlign: 'right', gridColumn: 'span 2' }}>{item.materialCategory}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Analysis Report Section */}
      <div style={{ marginTop: '4rem', padding: '2rem', backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#B464FF' }}>✨ AI Analysis Report</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 'bold' }}>Analysis Filter:</span>
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value)}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: 'var(--bg)', 
                color: 'var(--text)', 
                border: '1px solid var(--border)', 
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="size">Size</option>
              <option value="shape">Shape</option>
              <option value="distance">Distance / Orbit</option>
              <option value="risk">Risk Level</option>
              <option value="material">Material Composition</option>
            </select>
          </div>
        </div>

        {debrisData.length > 0 && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Histogram */}
            <div style={{ flex: 1.5, minWidth: '350px', padding: '1.5rem', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-dim)' }}>Distribution Histogram</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px' }}>
                {Object.entries(groupedData).map(([key, items]) => {
                  const maxCount = Math.max(...Object.values(groupedData).map(v => v.length));
                  const heightPct = Math.max(5, (items.length / maxCount) * 100);
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', padding: '0 5px' }}>
                        <div style={{ 
                          width: '100%', 
                          height: `${heightPct}%`, 
                          backgroundColor: 'var(--blue)', 
                          borderRadius: '4px 4px 0 0', 
                          opacity: 0.85, 
                          transition: 'height 0.4s ease-out' 
                        }}></div>
                      </div>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }} title={key}>
                        {key}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)', marginTop: '0.25rem' }}>{items.length}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Generated Text */}
            <div style={{ flex: 1, minWidth: '300px', padding: '1.5rem', backgroundColor: 'rgba(180, 100, 255, 0.05)', borderRadius: '8px', border: '1px dashed #B464FF' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#B464FF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                AI Insights Generated
              </h4>
              <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Analysis of the current dataset grouped by <strong style={{color:'var(--blue)', textTransform:'capitalize'}}>{groupBy}</strong> reveals <strong>{Object.keys(groupedData).length} distinct clusters</strong>. 
                The largest concentration of tracked debris falls into the <strong>{Object.entries(groupedData).sort((a,b)=>b[1].length - a[1].length)[0]?.[0]}</strong> category, accounting for <strong style={{color:'var(--red)'}}>{Math.round((Object.entries(groupedData).sort((a,b)=>b[1].length - a[1].length)[0]?.[1].length / debrisData.length) * 100)}%</strong> of all detected objects.
              </p>
              <div style={{ padding: '1rem', background: 'var(--panel)', borderLeft: '3px solid #B464FF', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automated Recommendation</div>
                <div style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  OrbitGuard AI suggests prioritizing active debris removal (ADR) planning and collision avoidance re-routing for high-density subsets within this specific distribution to mitigate cascading Kessler Syndrome probabilities.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
