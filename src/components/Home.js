import React, { useEffect } from 'react';
import { speak } from '../utils/speech';

function Home({ onStart, currentLocation, college, onSwitchCollege }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      speak('Welcome to EchoWave. Tap Start Navigation to begin.');
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const quickItems = [
    { emoji: '🚻', label: 'Washroom', id: 'Washroom' },
    { emoji: '🚪', label: 'Exit', id: 'Exit' },
    { emoji: '🛗', label: 'Elevator', id: 'Elevator' },
    { emoji: '☕', label: 'Cafeteria', id: 'Cafeteria' },
    { emoji: '📚', label: 'Library', id: 'Library' },
    { emoji: '🎓', label: 'Lecture Hall A', id: 'Lecture Hall A' },
  ];

  return (
    <div style={styles.container}>

      {/* Background accent */}
      <div style={styles.bgAccent} />

      {/* Top bar */}
      <div className="fade-up" style={styles.topBar}>
        <div
          style={styles.locationChip}
          onClick={() => onStart()}
        >
          <div style={{
            ...styles.locationDot,
            backgroundColor: currentLocation ? '#00c8aa' : '#ff5c5c',
            animation: currentLocation ? 'none' : 'pulse-ring 2s infinite',
          }} />
          <span style={styles.locationText}>
            {currentLocation ? `📍 ${currentLocation}` : 'Location not set'}
          </span>
          <span style={styles.locationArrow}>→</span>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <div className="fade-up fade-up-1" style={styles.logoWrap}>
          <div style={styles.logoRing}>
            <div style={styles.logoInner}>
              <span style={styles.logoIcon}>◎</span>
            </div>
          </div>
        </div>

        <div className="fade-up fade-up-2" style={styles.heroText}>
          <h1 style={styles.appName}>EchoWave</h1>
          <p style={styles.appSub}>
  {college ? `${college.name}` : 'Indoor navigation, reimagined for everyone.'}
</p>
        </div>
      </div>

      {/* CTA */}
      <div className="fade-up fade-up-3" style={styles.ctaWrap}>
        <button style={styles.ctaBtn} onClick={() => onStart()}>
          <div style={styles.ctaBtnInner}>
            <span style={styles.ctaIcon}>⊕</span>
            <div>
              <div style={styles.ctaMain}>Start Navigation</div>
              <div style={styles.ctaSub}>Scan QR or read a sign to begin</div>
            </div>
          </div>
          <span style={styles.ctaArrow}>→</span>
        </button>
      </div>

      {/* Quick destinations */}
      <div className="fade-up fade-up-4" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>QUICK DESTINATIONS</span>
          <div style={styles.sectionLine} />
        </div>
        <div style={styles.quickGrid}>
          {quickItems.map((item, i) => (
            <button
              key={item.id}
              style={styles.quickCard}
              onClick={() => onStart(item.id)}
            >
              <span style={styles.quickEmoji}>{item.emoji}</span>
              <span style={styles.quickLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      

    <button style={styles.switchBtn} onClick={(e) => { e.stopPropagation(); onSwitchCollege(); }}>
        🏫 Switch College
      </button>

    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 20px 40px',
    maxWidth: '440px',
    margin: '0 auto',
    gap: '28px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgAccent: {
    position: 'absolute',
    top: '-120px',
    right: '-80px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,170,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  topBar: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  locationChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    border: '1.5px solid #e4eaf2',
    borderRadius: '100px',
    padding: '8px 16px 8px 10px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15,27,45,0.06)',
  },
  locationDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  locationText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#0f1b2d',
  },
  locationArrow: {
    fontSize: '13px',
    color: '#00c8aa',
    fontWeight: '700',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    paddingTop: '12px',
  },
  logoWrap: {
    position: 'relative',
  },
  logoRing: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    border: '2px solid rgba(0,200,170,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fff 0%, #f0faf8 100%)',
    boxShadow: '0 8px 32px rgba(0,200,170,0.15), 0 2px 8px rgba(15,27,45,0.08)',
  },
  logoInner: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#0f1b2d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: '28px',
    color: '#00c8aa',
  },
  heroText: {
    textAlign: 'center',
  },
  appName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '42px',
    fontWeight: '700',
    color: '#0f1b2d',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  appSub: {
    fontSize: '17px',
    color: '#0f1b2d',
    marginTop: '8px',
    fontWeight: '600',
  },
  ctaWrap: { width: '100%' },
  ctaBtn: {
    width: '100%',
    padding: '18px 20px',
    backgroundColor: '#0f1b2d',
    border: 'none',
    borderRadius: '18px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 32px rgba(15,27,45,0.25)',
  },
  ctaBtnInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  ctaIcon: {
    fontSize: '28px',
    color: '#00c8aa',
  },
  ctaMain: {
    fontSize: '17px',
    fontWeight: '600',
    textAlign: 'left',
    color: '#fff',
  },
  ctaSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'left',
    marginTop: '2px',
  },
  ctaArrow: {
    fontSize: '20px',
    color: '#00c8aa',
    fontWeight: '700',
  },
  section: { width: '100%' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#7a8fa6',
    letterSpacing: '1.2px',
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e4eaf2',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  switchBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    border: '1.5px solid #e4eaf2',
    borderRadius: '14px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#7a8fa6',
  },
  quickCard: {
    padding: '16px 8px',
    backgroundColor: '#fff',
    border: '1.5px solid #e4eaf2',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(15,27,45,0.05)',
  },
  quickEmoji: { fontSize: '24px' },
  quickLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0f1b2d',
    textAlign: 'center',
  },
  
};

export default Home;