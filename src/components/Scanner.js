import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { speak } from '../utils/speech';
import Tesseract from 'tesseract.js';

function Scanner({ onLocationSet, onGoHome, quickDestination, floorMap }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState('qr');
  const [statusMsg, setStatusMsg] = useState('Point camera at a QR code');
  const [ocrResult, setOcrResult] = useState('');

  useEffect(() => {
    startCamera();
    speak('Scanner open. Point your camera at a QR code, or select your location manually below.');
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            requestAnimationFrame(scanFrame);
          }).catch(console.error);
        };
      }
    } catch (err) {
      setStatusMsg('Camera access denied. Use manual selection below.');
      speak('Camera access denied. Please use manual location selection.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        handleQRResult(code.data);
        return;
      }
    }
    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleQRResult = (data) => {
    stopCamera();
    const nodeId = data.toLowerCase().trim();
    if (floorMap.nodes[nodeId]) {
      const node = floorMap.nodes[nodeId];
      setStatusMsg(`✅ Location set: ${node.label}`);
      speak(`Location confirmed. You are at ${node.label}.`);
      setTimeout(() => onLocationSet(nodeId, quickDestination), 1500);
    } else {
      setStatusMsg('QR code not recognised. Use manual selection.');
      speak('QR code not recognised. Please select location manually.');
    }
  };

  const handleOCR = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    setStatusMsg('Reading sign... please hold still.');
    speak('Reading sign, please hold still.');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatusMsg(`Reading... ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const detectedText = text.trim();
      if (detectedText) {
        setOcrResult(detectedText);
        matchOCRToLocation(detectedText);
      } else {
        setStatusMsg('No text found. Try pointing at a sign.');
        speak('No text detected. Please point camera at a room sign.');
      }
    } catch {
      setStatusMsg('OCR failed. Use manual selection below.');
      speak('Could not read sign. Please select location manually.');
    }
  };

  const matchOCRToLocation = (text) => {
    const lower = text.toLowerCase();
    for (const node of Object.values(floorMap.nodes)) {
      if (lower.includes(node.label.toLowerCase())) {
        setStatusMsg(`✅ Sign recognised: ${node.label}`);
        speak(`Sign detected. You are near ${node.label}.`);
        setTimeout(() => onLocationSet(node.id, quickDestination), 1500);
        return;
      }
    }
    for (const [key, nodeId] of Object.entries(floorMap.shortcuts)) {
      if (lower.includes(key)) {
        const node = floorMap.nodes[nodeId];
        setStatusMsg(`✅ Sign recognised: ${node.label}`);
        speak(`Sign detected. You are near ${node.label}.`);
        setTimeout(() => onLocationSet(node.id, quickDestination), 1500);
        return;
      }
    }
    setStatusMsg(`Could not match: "${text.slice(0, 30)}". Use manual selection.`);
    speak('Could not match sign to a known location. Please select manually.');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => { stopCamera(); onGoHome(); }}>← Back</button>
        <span style={styles.headerTitle}>Set Your Location</span>
        <span />
      </div>

      <div style={styles.modeToggle}>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'qr' ? styles.modeBtnActive : {}) }}
          onClick={() => { setMode('qr'); setStatusMsg('Point camera at a QR code'); }}
        >
          📷 QR Code
        </button>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'ocr' ? styles.modeBtnActive : {}) }}
          onClick={() => { setMode('ocr'); setStatusMsg('Point camera at a room sign'); }}
        >
          🔤 Read Sign
        </button>
      </div>

      <div style={styles.viewfinder}>
        <video ref={videoRef} style={styles.video} muted playsInline />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={styles.scanOverlay}>
          <div style={styles.cornerTL} />
          <div style={styles.cornerTR} />
          <div style={styles.cornerBL} />
          <div style={styles.cornerBR} />
        </div>
      </div>

      <div style={styles.statusCard}>
        <p style={styles.statusMsg}>{statusMsg}</p>
        {ocrResult ? <p style={styles.ocrText}>Detected: "{ocrResult.slice(0, 60)}"</p> : null}
      </div>

      {mode === 'ocr' && (
        <button style={styles.captureBtn} onClick={handleOCR}>
          📸 Capture & Read Sign
        </button>
      )}

      <div style={styles.manualArea}>
        <p style={styles.manualTitle}>SELECT LOCATION MANUALLY</p>
        <div style={styles.manualGrid}>
          {Object.values(floorMap.nodes).map((node) => (
            <button
              key={node.id}
              style={styles.manualBtn}
              onClick={() => {
                stopCamera();
                speak(`Location set to ${node.label}`);
                onLocationSet(node.id, quickDestination);
              }}
            >
              {node.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    color: '#111',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: '420px',
    margin: '0 auto',
    gap: '16px',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '2px solid #ddd',
  },
  backBtn: {
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    color: '#333',
    padding: '8px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111',
  },
  modeToggle: {
    width: '100%',
    display: 'flex',
    gap: '10px',
  },
  modeBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    borderRadius: '10px',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  modeBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    color: '#fff',
  },
  viewfinder: {
    width: '100%',
    aspectRatio: '1',
    backgroundColor: '#000',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    border: '3px solid #4f46e5',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  cornerTL: {
    position: 'absolute', top: '18%', left: '18%',
    width: '48px', height: '48px',
    borderTop: '4px solid #fff',
    borderLeft: '4px solid #fff',
    borderRadius: '4px 0 0 0',
  },
  cornerTR: {
    position: 'absolute', top: '18%', right: '18%',
    width: '48px', height: '48px',
    borderTop: '4px solid #fff',
    borderRight: '4px solid #fff',
    borderRadius: '0 4px 0 0',
  },
  cornerBL: {
    position: 'absolute', bottom: '18%', left: '18%',
    width: '48px', height: '48px',
    borderBottom: '4px solid #fff',
    borderLeft: '4px solid #fff',
    borderRadius: '0 0 0 4px',
  },
  cornerBR: {
    position: 'absolute', bottom: '18%', right: '18%',
    width: '48px', height: '48px',
    borderBottom: '4px solid #fff',
    borderRight: '4px solid #fff',
    borderRadius: '0 0 4px 0',
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid #ddd',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statusMsg: { fontSize: '15px', margin: '0', color: '#333', fontWeight: '500' },
  ocrText: { fontSize: '12px', color: '#888', margin: '8px 0 0 0', fontStyle: 'italic' },
  captureBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
  },
  manualArea: { width: '100%' },
  manualTitle: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '10px',
    letterSpacing: '1px',
    fontWeight: '700',
  },
  manualGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  manualBtn: {
    padding: '14px',
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    borderRadius: '10px',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
};

export default Scanner;