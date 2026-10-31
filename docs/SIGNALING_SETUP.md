# ShareIt Signaling Setup Guide

This document explains how to run the signaling backend for ShareIt.

---

## Architecture of ShareIt Signaling

GitHub Pages only hosts static HTML, JS, CSS, and media assets. Signaling must therefore run separately. ShareIt supports three operational modes:

1. **Local Node.js Development Server** (`server/devSignaling.ts`):
   - Standalone WebSocket server using Node.js `ws`.
   - Perfect for local development, LAN meetings, and testing.
   - Run with `npm run signaling`.

2. **Cloudflare Workers with Durable Objects** (`workers/signaling/`):
   - Globally distributed, edge WebSocket room coordinator.
   - Handles room creation, locking, host assignments, WebRTC SDP offers/answers, ICE candidates, chat, and file metadata.
   - Generous free tier from Cloudflare.

3. **In-Browser BroadcastChannel Mesh Fallback** (`src/signaling/broadcastSignaling.ts`):
   - Zero-configuration in-browser signaling between tabs.
   - Automatically activates if no WebSocket server is reachable!

---

## 1. Local Development Signaling Server

Run the development signaling server on port 8080:
```bash
npm run signaling
```

Terminal output:
```
===============================================
🚀 ShareIt Dev Signaling Server
📡 WebSocket URL: ws://localhost:8080/ws
🌐 HTTP Health:   http://localhost:8080/health
===============================================
```

---

## 2. Deploying to Cloudflare Workers with Durable Objects

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

### Step 2: Log into Cloudflare
```bash
wrangler login
```

### Step 3: Configure `wrangler.toml`
The configuration is already provided in [`workers/signaling/wrangler.toml`](../workers/signaling/wrangler.toml):
```toml
name = "shareit-signaling"
main = "src/index.ts"
compatibility_date = "2024-04-01"

[durable_objects]
bindings = [
  { name = "ROOMS", class_name = "RoomDurableObject" }
]

[[migrations]]
tag = "v1"
new_classes = ["RoomDurableObject"]
```

### Step 4: Deploy
```bash
cd workers/signaling
wrangler deploy
```

Upon completion, Wrangler will output your live URL:
`https://shareit-signaling.<your-subdomain>.workers.dev`

### Step 5: Connect ShareIt Frontend
In your `.env` or GitHub Actions secrets:
```env
VITE_SIGNALING_SERVER=wss://shareit-signaling.<your-subdomain>.workers.dev
```
Or in the ShareIt interface, open **Settings > Network** and enter your URL.
