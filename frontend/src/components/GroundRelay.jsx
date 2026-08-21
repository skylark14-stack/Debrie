import React from 'react'

export default function GroundRelay({ onBack }) {
  return (
    <div className="ground-relay-page">
      <button onClick={onBack} className="back-btn">
        &larr; Back to Dashboard
      </button>
      
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--blue)', marginBottom: '0.5rem' }}>Ground Relay Network</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', maxWidth: '800px' }}>
          Live connection to terrestrial radar and optical tracking stations monitoring orbital assets.
        </p>
      </div>
      
      <div style={{ 
        marginTop: '3rem', 
        padding: '3rem', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        backgroundColor: 'var(--panel)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px dashed var(--blue)', animation: 'spin 4s linear infinite', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--blue)', borderRadius: '50%' }}></div>
        </div>
        <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Establishing secure uplink...</h3>
        <p style={{ color: 'var(--text-dim)' }}>Awaiting telemetry data from deep space tracking network.</p>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
