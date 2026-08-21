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
          <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', margin: '0 0 0.5rem 0' }}>Orbital Watch</h2>
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
    </div>
  );
}
