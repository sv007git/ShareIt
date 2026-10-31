# ShareIt 🚀
### Real-Time Screen Sharing, Video Conferencing & Audio Communication Platform

[![Deploy ShareIt to GitHub Pages](https://github.com/sv007git/ShareIt/actions/workflows/deploy.yml/badge.svg)](https://github.com/sv007git/ShareIt/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![WebRTC Direct P2P](https://img.shields.io/badge/WebRTC-DTLS--SRTP%20Encrypted-emerald.svg)](https://webrtc.org/)

**ShareIt** is a modern, high-performance, mobile-responsive web application designed for frictionless peer-to-peer screen sharing, HD video conferencing, audio-only calling, in-meeting chat, and chunked P2P file transfers directly in the browser—with **no software installations**, **no user registration**, and **zero tracking**.

- **Live GitHub Pages URL**: [https://sv007git.github.io/ShareIt/](https://sv007git.github.io/ShareIt/)
- **GitHub Repository**: [https://github.com/sv007git/ShareIt](https://github.com/sv007git/ShareIt)

---

## 🌟 Key Capabilities

- 🖥️ **Ultra-Fast Screen Sharing**: Share entire displays, application windows, or browser tabs with 60 FPS clarity and optional system/tab audio capture (`navigator.mediaDevices.getDisplayMedia`).
- 📹 **Simultaneous Screen & Webcam**: Present your screen in full-resolution presentation mode while keeping your webcam video visible in a draggable, resizable Picture-in-Picture floating tile.
- 🎙️ **Crystal-Clear Audio & Visualizer**: High-fidelity Opus audio with echo cancellation, noise suppression, real-time decibel level metering, and active speaker highlighting.
- 👥 **Multi-Participant Rooms**: Dynamic responsive video grid (1x1, 1x2, 2x2, 3x2, etc.) supporting multiple participants with low-latency WebRTC mesh and SFU-ready architecture.
- 💬 **In-Meeting Real-Time Chat**: Send encrypted text messages, timestamps, participant names, and quick emoji reactions.
- 📁 **Chunked P2P File Sharing**: Transfer files securely over WebRTC DataChannels in 16KB chunks. Features real-time progress bars, transfer rates, download generation, and explicit **Accept/Reject prompts** (never auto-accepts untrusted files).
- 🛡️ **Host Controls & Room Security**: Room creators can lock the room, mute participants, or remove disruptive users.
- 📱 **Mobile Responsive Design**: Full touch-friendly experience across Android (Chrome, Edge, Firefox) and iOS Safari with orientation adjustments and device capability detection.
- 🚀 **Zero Backend on GitHub Pages**: Built as a purely static Single Page Application (SPA) compatible with GitHub Pages hosting, paired with an independent signaling layer (Cloudflare Workers Durable Objects or local WebSocket).

---

## 🏗️ Architecture & Technology Stack

```
ShareIt/
├── .github/workflows/deploy.yml     # Automated GitHub Actions CI/CD to GitHub Pages
├── public/
│   ├── 404.html                     # SPA redirect router for GitHub Pages
│   └── logo.svg                     # ShareIt brand emblem
├── src/
│   ├── components/
│   │   ├── common/                  # Button, Input, Modal, Badge, ThemeToggle
│   │   ├── landing/                 # Hero, Features, How It Works, Devices, FAQ
│   │   ├── meeting/                 # VideoGrid, VideoTile, ScreenShareView, ControlBar
│   │   ├── panels/                  # ChatPanel, ParticipantsPanel, FileSharePanel, SettingsModal
│   │   └── prejoin/                 # GreenRoom, DeviceSelector, AudioMeter
│   ├── contexts/                    # ThemeContext, SettingsContext
│   ├── hooks/                       # useAudioLevel, useMediaDevices, useRoom
│   ├── pages/                       # MeetingRoomPage
│   ├── services/                    # FileTransferService (Chunked DataChannel)
│   ├── signaling/                   # SignalingClient, BroadcastSignaling, Types
│   ├── webrtc/                      # PeerManager, MediaManager, IceConfig
│   └── utils/                       # idGenerator, formatters, deviceDetect
├── server/
│   └── devSignaling.ts              # Local Node.js WebSocket signaling server
├── workers/signaling/               # Cloudflare Workers Durable Object signaling coordinator
├── tests/                           # Vitest automated unit test suite
├── docs/                            # In-depth architectural & deployment guides
└── vite.config.ts                   # Vite bundler configured for GitHub Pages base path
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/sv007git/ShareIt.git
cd ShareIt
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the local signaling server
In a separate terminal window, start the local WebSocket signaling server:
```bash
npm run signaling
```
This runs a WebSocket server at `ws://localhost:8080/ws` with health checks at `http://localhost:8080/health`.

### 4. Start the frontend development server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

> **Note**: ShareIt includes an in-browser `BroadcastChannel` local fallback! If no signaling server is running, two tabs on the same machine can still test WebRTC audio, video, screen share, chat, and file sharing with **zero setup**.

---

## 🧪 Testing

Run the automated test suite with Vitest:
```bash
npm test
```

### End-to-End Real Device Verification Checklist
1. **Room Creation**: Open the app, click **Start Sharing**, and verify a unique room code (e.g. `share-8f2-x9k`) is generated.
2. **Pre-Join Green Room**: Confirm camera preview displays, microphone meter moves when speaking, and device selection works.
3. **Invitation Link**: Click **Copy Invite Link**, open an Incognito window or second browser tab, and paste the URL.
4. **2-Way Audio/Video**: Both tabs should connect via WebRTC with bidirectional audio and video streams.
5. **Screen Sharing**: In Tab 1, click **Share Screen**. Select an application window or tab. Verify Tab 2 receives the presentation in full HD with the presenter's webcam floating in Picture-in-Picture.
6. **Chat & File Transfer**: Send a chat message and verify instant delivery. Send a file from Tab 1; Tab 2 will show an explicit **Accept/Reject** prompt before streaming chunked data and offering the download file.
7. **Host Controls**: In Host tab, toggle **Lock Room** or mute participant.

For detailed testing scenarios, refer to [`docs/TESTING_GUIDE.md`](./docs/TESTING_GUIDE.md).

---

## 🌐 Deploying to GitHub Pages

The repository contains a GitHub Actions workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) that automatically builds and deploys ShareIt to GitHub Pages on every push to the `main` branch.

### Enabling GitHub Pages on your repository:
1. Go to your repository on GitHub: `https://github.com/sv007git/ShareIt`.
2. Click **Settings** > **Pages** in the left sidebar.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. Push a commit to `main` (or click **Actions** > **Deploy ShareIt to GitHub Pages** > **Run workflow**).
5. Your site will be live at `https://sv007git.github.io/ShareIt/`.

---

## ☁️ Production Signaling Backend (Cloudflare Workers)

For multi-device internet deployment outside the same local browser, deploy the included Cloudflare Worker Durable Object signaling coordinator:

1. Navigate to `workers/signaling`:
   ```bash
   cd workers/signaling
   npm install
   ```
2. Log into Cloudflare with Wrangler:
   ```bash
   npx wrangler login
   ```
3. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
4. Set the deployed worker URL in your GitHub Secrets or environment variable:
   ```env
   VITE_SIGNALING_SERVER=wss://shareit-signaling.<your-subdomain>.workers.dev
   ```

For detailed setup, see [`docs/SIGNALING_SETUP.md`](./docs/SIGNALING_SETUP.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
