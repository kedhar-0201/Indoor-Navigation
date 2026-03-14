import React, { useState, useEffect, useRef } from 'react';
import { findPath, generateInstructions, matchDestination } from '../utils/pathfinding';
import { speak, startListening, vibrate, vibratePatterns, unlockAudio, playSOSBuzzer, startPedometer } from '../utils/speech';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';


function Navigation({ currentLocation, onGoHome, onChangeLocation, quickDestination, floorMap }) {
  const [destination, setDestination] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [obstacleDetection, setObstacleDetection] = useState(false);
  const [obstacleMsg, setObstacleMsg] = useState('');
  const videoRef2 = useRef(null);
  const detectionRef = useRef(null);
  const obstacleActiveRef = useRef(false);
    

  useEffect(() => {
    if (quickDestination) {
      handleVoiceCommand(quickDestination.toLowerCase());
    } else {
      setTimeout(() => {
        speak('Where would you like to go? Tap the microphone and say your destination.');
      }, 500);
    }
  }, []);

  useEffect(() => {
    const stop = startPedometer((steps) => setStepCount(steps));
    return () => stop();
  }, []);
  

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Use Chrome or Safari for voice support.');
      return;
    }
    setIsListening(true);
    setStatus('listening');
    setErrorMsg('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (e) => {
      const result = e.results[0][0].transcript.toLowerCase().trim();
      setTranscript(result);
      setIsListening(false);
      setStatus('idle');
      handleVoiceCommand(result);
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      setStatus('idle');
      if (e.error === 'not-allowed') {
        setErrorMsg('Microphone blocked. Please allow mic access.');
      } else if (e.error === 'no-speech') {
        setErrorMsg('No speech detected. Please try again.');
      } else {
        setErrorMsg(`Error: ${e.error}`);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleVoiceCommand = (input) => {
    if (input.includes('avoid stairs') || input.includes('reroute')) {
      setAvoidStairs(true);
      speak('Rerouting to avoid stairs.');
      if (destination) calculateRoute(currentLocation, destination, true);
      return;
    }
    if (input.includes('next')) { handleNextStep(); return; }
    if (input.includes('repeat')) { speakCurrentStep(); return; }
    if (input.includes('go home') || input.includes('cancel')) {
      speak('Returning to home screen.');
      onGoHome();
      return;
    }
    const destinationId = matchDestination(floorMap, input);
    if (destinationId) {
      const destNode = floorMap.nodes[destinationId];
      setDestination(destinationId);
      speak(`Destination set: ${destNode.label}. Calculating route.`);
      calculateRoute(currentLocation, destinationId, avoidStairs);
    } else {
      speak(`Sorry, I could not find ${input}. Please try again.`);
      setErrorMsg(`Could not find "${input}". Try: library, cafeteria, washroom, elevator, exit.`);
    }
  };

  const calculateRoute = (start, end, stairs = false) => {
    const path = findPath(floorMap, start, end, stairs);
    if (!path) {
      speak('Sorry, no route found.');
      return;
    }
    const newInstructions = generateInstructions(floorMap, path);
    setInstructions(newInstructions);
    setCurrentStep(0);
    setStatus('navigating');
    setTimeout(() => speak(newInstructions[0]), 800);
  };

  const speakCurrentStep = () => {
    if (instructions.length > 0) speak(instructions[currentStep]);
  };

  const handleNextStep = () => {
    if (currentStep < instructions.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      speak(instructions[next]);
      if (next === instructions.length - 1) {
        setStatus('arrived');
        vibrate(vibratePatterns.arrival);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      speak(instructions[prev]);
    }
  };

  const nodeIcons = {
    stairs: '🪜', elevator: '🛗', washroom: '🚻',
    exit: '🚪', entrance: '🏛️', corridor: '🚶', room: '📍',
  };

  const startObstacleDetection = async () => {
    setObstacleDetection(true);
    obstacleActiveRef.current = true;
    setObstacleMsg('Loading detector...');
    speak('Loading obstacle detection.');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 320, height: 240 }
      });

      const video = videoRef2.current;
      video.srcObject = stream;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve);
        };
      });

      const model = await cocoSsd.load();
      speak('Obstacle detection active.');
      setObstacleMsg('✅ Scanning...');

      const detect = async () => {
        if (!videoRef2.current || !obstacleActiveRef.current) return;
        try {
          const predictions = await model.detect(video);
          const close = predictions.filter(p => p.bbox[2] * p.bbox[3] > 8000);
          if (close.length > 0) {
            const obj = close[0].class;
            setObstacleMsg(`⚠️ ${obj} detected!`);
            speak(`Caution! ${obj} ahead.`);
          } else {
            setObstacleMsg('✅ Path clear');
          }
        } catch (e) {
          console.log('Detection frame error', e);
        }
        detectionRef.current = setTimeout(detect, 2500);
      };
      detect();
    } catch (e) {
      setObstacleMsg('Camera error.');
      setObstacleDetection(false);
    }
  };

  const stopObstacleDetection = () => {
    setObstacleDetection(false);
    obstacleActiveRef.current = false;
    setObstacleMsg('');
    if (detectionRef.current) clearTimeout(detectionRef.current);
    if (videoRef2.current && videoRef2.current.srcObject) {
      videoRef2.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgAccent} />
      <video ref={videoRef2} style={{ position: 'absolute', width: '320px', height: '240px', opacity: 0, pointerEvents: 'none', top: 0, left: 0 }} muted playsInline />

      {/* Header */}
      <div className="fade-up" style={styles.header}>
        <button style={styles.backBtn} onClick={onGoHome}>← Home</button>
        <span style={styles.headerTitle}>Navigation</span>
        <div style={styles.locationPill} onClick={onChangeLocation}>
          <span style={styles.locationDot} />
          <span style={styles.locationText}>
            {floorMap.nodes[currentLocation]?.label || 'Unknown'}
          </span>
          <span style={{ color: '#00c8aa', fontSize: '11px', fontWeight: '700' }}>⇄</span>
        </div>
      </div>

      {/* Destination selector */}
      <div className="fade-up fade-up-1" style={styles.destCard}
        onClick={() => setShowPicker(!showPicker)}>
        <div style={styles.destTop}>
          <span style={styles.destLabel}>DESTINATION</span>
          <span style={styles.destToggle}>{showPicker ? '▲' : '▼'}</span>
        </div>
        <p style={styles.destValue}>
          {destination ? floorMap.nodes[destination]?.label : 'Tap to select destination'}
        </p>
      </div>
      
      <p style={styles.stepLabel}>Step {currentStep} / {instructions.length}</p>
      <div style={styles.pedometerRow}>
      <span style={styles.pedometerIcon}>👣</span>
      <span style={styles.pedometerText}>{stepCount} steps taken</span>
      </div>

      {/* Destination picker */}
      {showPicker && (
        <div className="fade-up" style={styles.pickerPanel}>
          <p style={styles.pickerTitle}>SELECT DESTINATION</p>
          <div style={styles.pickerGrid}>
            {Object.values(floorMap.nodes).map((node) => (
              <button
                key={node.id}
                style={{
                  ...styles.pickerBtn,
                  backgroundColor: destination === node.id ? '#0f1b2d' : '#fff',
                  borderColor: destination === node.id ? '#0f1b2d' : '#e4eaf2',
                  color: destination === node.id ? '#fff' : '#0f1b2d',
                }}
                onClick={() => {
                  setShowPicker(false);
                  setDestination(node.id);
                  speak(`Destination set: ${node.label}. Calculating route.`);
                  calculateRoute(currentLocation, node.id, avoidStairs);
                }}
              >
                <span style={styles.pickerEmoji}>{nodeIcons[node.type] || '📍'}</span>
                <span style={styles.pickerLabel}>{node.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="fade-up fade-up-2" style={{
        ...styles.statusCard,
        backgroundColor:
          status === 'arrived' ? '#f0fdf9' :
          status === 'navigating' ? '#f5f3ff' :
          status === 'listening' ? '#fffbeb' : '#f8f9fb',
        borderColor:
          status === 'arrived' ? '#00c8aa' :
          status === 'navigating' ? '#0f1b2d' :
          status === 'listening' ? '#f59e0b' : '#e4eaf2',
      }}>
        <span style={styles.statusIcon}>
          {status === 'arrived' ? '✦' :
           status === 'navigating' ? '◎' :
           status === 'listening' ? '◉' : '○'}
        </span>
        <span style={styles.statusText}>
          {status === 'arrived' ? 'You have arrived!' :
           status === 'navigating' ? 'Navigating...' :
           status === 'listening' ? 'Listening — speak now' :
           'Tap mic or select a destination'}
        </span>
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={styles.errorCard}>
          <span style={styles.errorText}>⚠ {errorMsg}</span>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div style={styles.transcriptCard}>
          <span style={styles.transcriptLabel}>YOU SAID</span>
          <span style={styles.transcriptText}>"{transcript}"</span>
        </div>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <div className="fade-up" style={styles.instructionsWrap}>
          <div style={styles.stepBar}>
            <span style={styles.stepCount}>Step {currentStep + 1} / {instructions.length}</span>
            <div style={styles.stepTrack}>
              <div style={{
                ...styles.stepFill,
                width: `${((currentStep + 1) / instructions.length) * 100}%`,
              }} />
            </div>
          </div>

          {currentStep > 0 && (
            <div style={styles.prevStep}>
              <span style={styles.checkMark}>✓</span>
              <span style={styles.prevText}>{instructions[currentStep - 1]}</span>
            </div>
          )}

          <div style={styles.currentStep}>
            <div style={styles.currentStepAccent} />
            <p style={styles.currentText}>{instructions[currentStep]}</p>
          </div>

          {currentStep < instructions.length - 1 && (
            <div style={styles.nextStep}>
              <span style={styles.nextLabel}>NEXT</span>
              <span style={styles.nextText}>{instructions[currentStep + 1]}</span>
            </div>
          )}
        </div>
      )}

      {/* Nav controls */}
      {status === 'navigating' && (
        <div style={styles.navControls}>
          <button style={styles.controlBtn} onClick={handlePrevStep}>◀</button>
          <button style={styles.repeatBtn} onClick={speakCurrentStep}>🔊 Repeat</button>
          <button style={styles.controlBtn} onClick={handleNextStep}>▶</button>
        </div>
      )}

      {/* Avoid stairs */}
      {status === 'navigating' && (
        <button
          style={{
            ...styles.avoidBtn,
            backgroundColor: avoidStairs ? '#f0fdf9' : '#fff',
            borderColor: avoidStairs ? '#00c8aa' : '#e4eaf2',
            color: avoidStairs ? '#00c8aa' : '#7a8fa6',
          }}
          onClick={() => {
            const n = !avoidStairs;
            setAvoidStairs(n);
            if (destination) {
              speak(n ? 'Avoiding stairs. Rerouting via elevator.' : 'Including stairs in route.');
              calculateRoute(currentLocation, destination, n);
            }
          }}
        >
          {avoidStairs ? '✓ Avoiding Stairs' : '⊘ Avoid Stairs'}
        </button>
      )}

      {/* Arrived */}
      {status === 'arrived' && (
        <div style={styles.arrivedCard}>
          <div style={styles.arrivedIcon}>✦</div>
          <p style={styles.arrivedTitle}>Arrived!</p>
          <p style={styles.arrivedSub}>You have reached {floorMap.nodes[destination]?.label}</p>
          <button style={styles.newDestBtn} onClick={() => {
            setDestination(null);
            setInstructions([]);
            setCurrentStep(0);
            setStatus('idle');
            setTranscript('');
            speak('Please scan or select your new location.');
            onChangeLocation();
          }}>
            Navigate Again
          </button>
        </div>
      )}
    
    
    {/* Obstacle Detection */}
      <video ref={videoRef2} style={{ display: 'none' }} muted playsInline />
      <button
        style={{
          ...styles.obstacleBtn,
          backgroundColor: obstacleDetection ? '#f0fdf9' : '#fff',
          borderColor: obstacleDetection ? '#00c8aa' : '#e4eaf2',
        }}
        onClick={obstacleDetection ? stopObstacleDetection : startObstacleDetection}
      >
        <span style={{ fontSize: '22px' }}>{obstacleDetection ? '🟢' : '⚫'}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f1b2d' }}>
            {obstacleDetection ? 'Obstacle Detection ON' : 'Obstacle Detection OFF'}
          </span>
          <span style={{ fontSize: '12px', color: '#7a8fa6' }}>
            {obstacleMsg || 'Tap to enable camera detection'}
          </span>
        </div>
      </button>


        {/* SOS Button */}
      <button
        style={{
          ...styles.sosBtn,
          backgroundColor: sosActive ? '#ff0000' : '#fff5f5',
          transform: sosActive ? 'scale(0.97)' : 'scale(1)',
        }}
        onClick={() => {
          setSosActive(true);
          playSOSBuzzer(); 
          const location = floorMap.nodes[currentLocation]?.label || 'unknown location';
          const college = floorMap.name || 'the building';
          speak(`EMERGENCY! I need help. I am at ${location} in ${college}. Please send assistance immediately.`);
          setTimeout(() => setSosActive(false), 4000);
        }}
      >
        <span style={styles.sosIcon}>🆘</span>
        <div style={styles.sosText}>
          <span style={styles.sosMain}>Emergency SOS</span>
          <span style={styles.sosSub}>Tap to announce your location</span>
        </div>
      </button>

      {/* Mic */}
      <button
        style={{
          ...styles.micBtn,
          backgroundColor: isListening ? '#ff5c5c' : '#0f1b2d',
          animation: isListening ? 'pulse-ring 1.5s infinite' : 'none',
        }}
        onClick={handleListen}
        disabled={isListening}
      >
        <span style={styles.micIcon}>{isListening ? '◉' : '🎤'}</span>
        <span style={styles.micText}>
          {isListening ? 'Listening...' : status === 'navigating' ? 'Voice Command' : 'Say Destination'}
        </span>
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
    gap: '14px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgAccent: {
    position: 'absolute',
    top: '-100px',
    left: '-80px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,170,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid #e4eaf2',
  },
  backBtn: {
    backgroundColor: '#fff',
    border: '1.5px solid #e4eaf2',
    color: '#0f1b2d',
    padding: '8px 14px',
    borderRadius: '100px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 6px rgba(15,27,45,0.06)',
  },
  headerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f1b2d',
  },
  locationPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0f1b2d',
    borderRadius: '100px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  locationDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#00c8aa',
    display: 'inline-block',
  },
  locationText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
  },
  destCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '16px 18px',
    border: '1.5px solid #e4eaf2',
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(15,27,45,0.06)',
  },
  destTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  destLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#7a8fa6',
    letterSpacing: '1.2px',
  },
  destToggle: {
    fontSize: '12px',
    color: '#00c8aa',
    fontWeight: '700',
  },
  destValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f1b2d',
    fontFamily: "'Playfair Display', serif",
  },
  pickerPanel: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '16px',
    border: '1.5px solid #e4eaf2',
    boxShadow: '0 4px 20px rgba(15,27,45,0.1)',
  },
  pickerTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#7a8fa6',
    letterSpacing: '1.2px',
    marginBottom: '12px',
  },
  pickerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  pickerBtn: {
    padding: '12px 6px',
    border: '1.5px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minHeight: '68px',
  },
  pickerEmoji: { fontSize: '18px' },
  pickerLabel: { fontSize: '11px', fontWeight: '600', textAlign: 'center' },
  statusCard: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1.5px solid',
  },
  statusIcon: { fontSize: '18px', color: '#0f1b2d' },
  statusText: { fontSize: '14px', fontWeight: '500', color: '#0f1b2d' },
  errorCard: {
    width: '100%',
    backgroundColor: '#fff5f5',
    border: '1.5px solid #fca5a5',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  errorText: { fontSize: '13px', color: '#dc2626', fontWeight: '500' },
  transcriptCard: {
    width: '100%',
    backgroundColor: '#f0fdf9',
    border: '1.5px solid #00c8aa44',
    borderRadius: '10px',
    padding: '10px 16px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#00c8aa',
    letterSpacing: '1px',
    flexShrink: 0,
  },
  transcriptText: { fontSize: '13px', color: '#0f1b2d', fontStyle: 'italic' },
  instructionsWrap: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stepBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  stepCount: { fontSize: '11px', fontWeight: '700', color: '#7a8fa6', flexShrink: 0 },
  stepTrack: {
    flex: 1,
    height: '3px',
    backgroundColor: '#e4eaf2',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  stepFill: {
    height: '100%',
    backgroundColor: '#00c8aa',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  prevStep: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    padding: '10px 14px',
    backgroundColor: '#f8f9fb',
    borderRadius: '10px',
    border: '1px solid #e4eaf2',
  },
  checkMark: { color: '#00c8aa', fontSize: '14px', flexShrink: 0, marginTop: '1px' },
  prevText: { fontSize: '13px', color: '#7a8fa6' },
  currentStep: {
    backgroundColor: '#fff',
    border: '1.5px solid #0f1b2d',
    borderRadius: '14px',
    padding: '18px 18px 18px 22px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(15,27,45,0.1)',
  },
  currentStepAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: '#00c8aa',
    borderRadius: '4px 0 0 4px',
  },
  currentText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#0f1b2d',
    fontWeight: '600',
  },
  nextStep: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    padding: '10px 14px',
    backgroundColor: '#f8f9fb',
    borderRadius: '10px',
    border: '1px solid #e4eaf2',
  },
  nextLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#7a8fa6',
    letterSpacing: '1px',
    flexShrink: 0,
    marginTop: '2px',
  },
  nextText: { fontSize: '13px', color: '#7a8fa6' },
  navControls: {
    width: '100%',
    display: 'flex',
    gap: '10px',
  },
  controlBtn: {
    width: '52px',
    height: '52px',
    backgroundColor: '#fff',
    border: '1.5px solid #e4eaf2',
    borderRadius: '12px',
    color: '#0f1b2d',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(15,27,45,0.06)',
  },
  repeatBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#0f1b2d',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(15,27,45,0.2)',
  },
  avoidBtn: {
    width: '100%',
    padding: '13px',
    border: '1.5px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#fff',
  },
  arrivedCard: {
    width: '100%',
    backgroundColor: '#f0fdf9',
    border: '1.5px solid #00c8aa',
    borderRadius: '18px',
    padding: '28px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,200,170,0.1)',
  },
  arrivedIcon: {
    fontSize: '40px',
    color: '#00c8aa',
    marginBottom: '12px',
  },
  arrivedTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f1b2d',
    marginBottom: '6px',
  },
  arrivedSub: {
    fontSize: '14px',
    color: '#7a8fa6',
    marginBottom: '20px',
  },
  newDestBtn: {
    padding: '13px 28px',
    backgroundColor: '#0f1b2d',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(15,27,45,0.2)',
  },
  micBtn: {
    width: '100%',
    padding: '20px',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: 'auto',
    boxShadow: '0 8px 32px rgba(15,27,45,0.25)',
  },
  micIcon: { fontSize: '22px' },
  micText: { fontSize: '17px', fontWeight: '700' },

  sosBtn: {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid #ff5c5c',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(255,92,92,0.15)',
  },
  sosIcon: { fontSize: '28px', flexShrink: 0 },
  sosText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  sosMain: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#dc2626',
  },
  sosSub: {
    fontSize: '12px',
    color: '#ef4444',
    opacity: 0.8,
  },
  pedometerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
    pedometerIcon: { fontSize: '14px' },
    pedometerText: {
    fontSize: '12px',
    color: '#7a8fa6',
    fontWeight: '500',
  },
  obstacleBtn: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(15,27,45,0.06)',
  },
};

export default Navigation;