import React, { useState } from 'react';

export default function Sidebar({ isOpen, toggleSidebar, onNavigate }) {
  const [homeExpanded, setHomeExpanded] = useState(false);
  const [susExpanded, setSusExpanded] = useState(false);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Vega AI</h2>
          <button 
            onClick={toggleSidebar} 
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div 
          className="nav-item" 
          onClick={() => onNavigate('home')}
        >
          <span>Home</span>
        </div>

        <div 
          className="nav-item" 
          onClick={() => onNavigate('ground-relay')}
        >
          <span>Launch Ground Relay</span>
        </div>

        <div 
          className={`nav-item ${homeExpanded ? 'active' : ''}`} 
          onClick={() => setHomeExpanded(!homeExpanded)}
        >
          <span>Simulations & Tools</span>
          <svg className={`chevron ${homeExpanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        <div className={`sub-menu ${homeExpanded ? 'open' : ''}`}>
          <div className="sub-menu-item" onClick={() => onNavigate('deorbit-tracker')}>Debris Tracker</div>
          <div className="sub-menu-item" onClick={() => onNavigate('orbital-watch')}>Debris Analysis</div>
          <div className="sub-menu-item" onClick={() => onNavigate('collision-risk')}>Collision Risk Calculations</div>
        </div>

        <div 
          className={`nav-item ${susExpanded ? 'active' : ''}`} 
          onClick={() => setSusExpanded(!susExpanded)}
          style={{ marginTop: '1rem' }}
        >
          <span>Sustainable Space</span>
          <svg className={`chevron ${susExpanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        <div className={`sub-menu ${susExpanded ? 'open' : ''}`}>
          <div className="sub-menu-item" onClick={() => onNavigate('aura-concept')}>AURA Concept</div>
        </div>

      </aside>
    </>
  );
}
