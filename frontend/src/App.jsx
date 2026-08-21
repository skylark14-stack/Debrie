import React, { useState } from 'react'
import EarthGlobe from './components/EarthGlobe'
import Sidebar from './components/Sidebar'
import GroundRelay from './components/GroundRelay'
import DeorbitTracker from './components/DeorbitTracker'
import OrbitalWatch from './components/OrbitalWatch'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false); // Close sidebar on navigation
  };

  return (
    <>
      <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
        {sidebarOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} onNavigate={navigateTo} />

      <div className={`dashboard-container ${sidebarOpen ? 'shifted' : ''}`}>
        
        {currentPage === 'home' && (
          <>
            <header className="hero-section">
              <h1 className="hero-tagline">
                If you react, you start losing. We predict, We pre-move, We Win.
              </h1>
              <p className="hero-description">
                Space debris, or "space junk", consists of defunct human-made objects in space—principally in Earth orbit—which no longer serve a useful function. This includes derelict spacecraft, abandoned launch vehicle stages, and fragmentation debris from breakups, collisions, or explosions. A single collision can trigger a Kessler Syndrome cascade, threatening all active space operations.
              </p>
              
              <button 
                className="ground-relay-btn" 
                onClick={() => setCurrentPage('ground-relay')}
              >
                Launch Ground Relay
              </button>
            </header>

            <EarthGlobe />

            <section className="stats-grid">
              <div className="stat-card blue">
                <h3 className="stat-title">Total Tracked Debris</h3>
                <p className="stat-value">34,582</p>
                <p style={{ color: 'var(--text-dimmer)', fontSize: '0.875rem' }}>Currently monitored by USSPACECOM</p>
              </div>

              <div className="stat-card amber">
                <h3 className="stat-title">Fragmentation Debris</h3>
                <p className="stat-value">21,142</p>
                <p style={{ color: 'var(--text-dimmer)', fontSize: '0.875rem' }}>Caused by explosions or collisions</p>
              </div>

              <div className="stat-card red">
                <h3 className="stat-title">Active Close Approach Alerts</h3>
                <p className="stat-value">142</p>
                <p style={{ color: 'var(--text-dimmer)', fontSize: '0.875rem' }}>Within a 5km threshold today</p>
              </div>

              <div className="stat-card green">
                <h3 className="stat-title">Deorbited This Year</h3>
                <p className="stat-value">37</p>
                <p style={{ color: 'var(--text-dimmer)', fontSize: '0.875rem' }}>Successfully removed missions</p>
              </div>
            </section>
          </>
        )}

        {currentPage === 'ground-relay' && (
          <GroundRelay onBack={() => navigateTo('home')} />
        )}

        {currentPage === 'deorbit-tracker' && (
          <DeorbitTracker />
        )}

        {currentPage === 'orbital-watch' && (
          <OrbitalWatch />
        )}

        {currentPage === 'collision-risk' && (
          <div style={{ padding: '4rem 0', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--red)', fontSize: '2rem' }}>Collision Risk Assessment</h2>
            <p style={{ color: 'var(--text-dim)' }}>Live conjunction alerts and orbital prediction models coming soon...</p>
          </div>
        )}
        
      </div>
    </>
  )
}

export default App
