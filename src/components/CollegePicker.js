import React, { useState } from 'react';
import colleges from '../data/colleges';
import { speak } from '../utils/speech';

function CollegePicker({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (college) => {
    setSelected(college.id);
    speak(`${college.name} selected.`);
    setTimeout(() => onSelect(college), 600);
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgAccent} />

      <div className="fade-up" style={styles.header}>
        <div style={styles.logoSmall}>
          <span style={styles.logoIcon}>◎</span>
        </div>
        <div>
          <h1 style={styles.title}>Select Your College</h1>
          <p style={styles.subtitle}>Choose your institution to begin navigation</p>
        </div>
      </div>

      <div className="fade-up fade-up-1" style={styles.grid}>
        {Object.values(colleges).map((college) => (
          <button
            key={college.id}
            style={{
              ...styles.card,
              borderColor: selected === college.id ? '#00c8aa' : '#e4eaf2',
              backgroundColor: selected === college.id ? '#f0fdf9' : '#fff',
              transform: selected === college.id ? 'scale(0.98)' : 'scale(1)',
            }}
            onClick={() => handleSelect(college)}
          >
            <div style={{
              ...styles.cardAccent,
              backgroundColor: college.color,
            }} />
            <span style={styles.cardEmoji}>{college.emoji}</span>
            <div style={styles.cardInfo}>
              <p style={styles.cardShort}>{college.shortName}</p>
              <p style={styles.cardName}>{college.name}</p>
              <p style={styles.cardLocation}>📍 {college.location}</p>
            </div>
            {selected === college.id && (
              <span style={styles.checkmark}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fb',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 20px 40px',
    maxWidth: '440px',
    margin: '0 auto',
    gap: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  bgAccent: {
    position: 'absolute',
    top: '-80px',
    right: '-60px',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,170,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoSmall: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#0f1b2d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: '20px',
    color: '#00c8aa',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f1b2d',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '13px',
    color: '#7a8fa6',
    margin: '4px 0 0 0',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    width: '100%',
    padding: '16px',
    border: '1.5px solid',
    borderRadius: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    position: 'relative',
    overflow: 'hidden',
    textAlign: 'left',
    boxShadow: '0 2px 10px rgba(15,27,45,0.06)',
    transition: 'all 0.2s ease',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    borderRadius: '4px 0 0 4px',
  },
  cardEmoji: {
    fontSize: '28px',
    flexShrink: 0,
    marginLeft: '6px',
  },
  cardInfo: {
    flex: 1,
  },
  cardShort: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f1b2d',
    margin: '0 0 2px 0',
    fontFamily: "'Playfair Display', serif",
  },
  cardName: {
    fontSize: '12px',
    color: '#7a8fa6',
    margin: '0 0 4px 0',
  },
  cardLocation: {
    fontSize: '11px',
    color: '#7a8fa6',
    margin: 0,
  },
  checkmark: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#00c8aa',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
};

export default CollegePicker;