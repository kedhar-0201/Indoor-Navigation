import React, { useEffect } from 'react';

function Splash({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.bgAccent1} />
      <div style={styles.bgAccent2} />
      <div style={styles.content}>
        <div style={styles.logoRing}>
          <div style={styles.logoInner}>
            <span style={styles.logoIcon}>◎</span>
          </div>
        </div>
        <h1 style={styles.appName}>EchoWave</h1>
        <p style={styles.tagline}>Indoor Navigation for Everyone</p>
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statNum}>253M</span>
            <span style={styles.statLabel}>Visually Impaired Worldwide</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statNum}>0</span>
            <span style={styles.statLabel}>Reliable Indoor Navigation Solutions</span>
            <span style={styles.statNot}>— not anymore.</span>
          </div>
        </div>
      </div>
      <p style={styles.poweredBy}>Built by Hydreigon · Built for Accessibility</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f1b2d',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  bgAccent1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,170,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgAccent2: {
    position: 'absolute',
    bottom: '-100px',
    left: '-100px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,170,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    animation: 'fadeUp 0.6s ease both',
  },
  logoRing: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '2px solid rgba(0,200,170,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a2e47 0%, #0f1b2d 100%)',
    boxShadow: '0 0 60px rgba(0,200,170,0.2)',
  },
  logoInner: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#0f1b2d',
    border: '1px solid rgba(0,200,170,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: '32px',
    color: '#00c8aa',
  },
  appName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '48px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  tagline: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    fontWeight: '400',
  },
  poweredBy: {
    position: 'absolute',
    bottom: '40px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.5px',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginTop: '32px',
    padding: '20px 24px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(0,200,170,0.2)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '36px',
    fontWeight: '700',
    color: '#00c8aa',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: '100px',
    lineHeight: '1.4',
  },
  statDivider: {
    width: '1px',
    height: '50px',
    backgroundColor: 'rgba(0,200,170,0.2)',
  },
  statNot: {
    fontSize: '11px',
    color: '#00c8aa',
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: '2px',
  },
};

export default Splash;