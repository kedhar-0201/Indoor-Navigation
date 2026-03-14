# EchoWave 🔊
### Indoor Navigation for the Visually Impaired

> *"253 million people are visually impaired worldwide. Zero reliable indoor navigation solutions exist — until now."*

EchoWave is an AI-powered, audio-first indoor navigation web app built for visually impaired users. No app installation needed — runs directly in any mobile browser.

---

## 🌐 Live Demo
**[echowave-peach.vercel.app](https://echowave-peach.vercel.app)**

---

## 🎯 Problem Statement
GPS works outdoors but completely fails indoors. Visually impaired individuals have no reliable way to navigate inside hospitals, colleges, malls, or any large building. EchoWave solves this with zero infrastructure requirements.

---

## ✨ Features

### 🧭 Core Navigation
- **A* Pathfinding** — Optimal route calculation between any two points
- **Turn-by-turn voice guidance** — Every instruction spoken aloud
- **Stair/Elevator awareness** — Say "avoid stairs" to reroute automatically
- **Multi-college support** — BMSCE, RVCE, MSRIT, IIIT-B, PES, IISc

### 📍 Hybrid Positioning
- **QR Code scanning** — Instant location detection at anchor points
- **OCR Sign Reading** — Reads existing building signs using Tesseract.js (offline)
- **Voice location input** — Say your location out loud
- **Manual selection** — Fallback grid of all locations

### 🎙️ Voice Interface
- **Speech recognition** — Natural language destination input
- **Text-to-speech** — All directions spoken automatically
- **Voice commands** — "avoid stairs", "repeat", "next step", "go home"

### 🛡️ Safety Features
- **Emergency SOS** — One tap announces your exact location out loud with alarm
- **Obstacle Detection** — Real-time object detection via TensorFlow.js COCO-SSD
- **Haptic feedback** — Vibration on arrival

### 📊 Accessibility
- **Pedometer** — Live step counter via accelerometer
- **Audio-first design** — Fully usable without looking at screen
- **Offline capable** — Core navigation works without internet

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend framework |
| A* Algorithm (custom JS) | Pathfinding |
| Web Speech API | TTS + Voice recognition |
| jsQR | QR code decoding |
| Tesseract.js | Offline OCR sign reading |
| TensorFlow.js + COCO-SSD | Real-time obstacle detection |
| DeviceMotion API | Step counting via accelerometer |
| Web Audio API | SOS buzzer generation |
| Vibration API | Haptic feedback |
| Vercel | Deployment |

---

## 🏗️ Architecture
```
User
 ├── QR Code → jsQR → Location ID
 ├── Sign → Tesseract.js OCR → Location ID  
 └── Voice → Web Speech API → Location ID
          ↓
    A* Pathfinding (JSON Graph)
          ↓
    Turn-by-turn Instructions
          ↓
    Web Speech API (TTS) → Audio Output
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- npm

### Installation
```bash
git clone https://github.com/kedhar-0201/Indoor-Navigation.git
cd Indoor-Navigation
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in Safari (recommended for best voice support).

### Deployment
```bash
vercel build --prod
vercel deploy --prebuilt --prod
```

---

## 🗺️ Adding a New College

Edit `src/data/colleges.js` and add a new entry:
```javascript
your_college: {
  id: "your_college",
  name: "Your College Name",
  shortName: "YCN",
  nodes: { ... },
  edges: [ ... ],
  shortcuts: { ... }
}
```

---

## 👥 Team

Built by **Team Hydreigon** at the hackathon.

---

## 📄 License
MIT
