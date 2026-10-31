# ShareIt Deployment Guide

This guide covers deploying ShareIt frontend to **GitHub Pages** and deploying the signaling coordinator to **Cloudflare Workers**.

---

## 1. GitHub Pages Deployment

ShareIt is pre-configured for automated deployment to GitHub Pages using GitHub Actions.

### Deployment Prerequisites
- Target repository: `https://github.com/sv007git/ShareIt`
- Target URL: `https://sv007git.github.io/ShareIt/`

### Step 1: Configure Repository Settings on GitHub
1. Navigate to your repository: `https://github.com/sv007git/ShareIt/settings/pages`.
2. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions` from the dropdown.

### Step 2: Push to Main Branch
Any push to the `main` branch automatically triggers the workflow defined in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

The workflow performs:
1. `npm ci`
2. `npm test` (Runs Vitest test suite)
3. `npm run build` (Builds static assets into `dist/` with `/ShareIt/` base path)
4. Uploads the build artifact and deploys it directly to GitHub Pages.

### Step 3: SPA Routing on GitHub Pages
Because GitHub Pages is a static file host, direct requests to paths like `/ShareIt/room/ROOM123` would normally produce a 404 error. ShareIt resolves this through a dual-mechanism approach:
1. `public/404.html`: Detects the route and redirects to `/#/room/ROOM123`.
2. Hash routing (`/#/room/:roomId`): Works natively on static hosts without server rewrites.

---

## 2. Signaling Server Deployment (Cloudflare Workers)

Since GitHub Pages cannot host persistent WebSockets or Node.js servers, signaling is kept independent.

### Free Tier Cloudflare Worker with Durable Objects
1. Open a terminal in `workers/signaling`:
   ```bash
   cd workers/signaling
   npm install
   ```

2. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Deploy the Worker:
   ```bash
   npx wrangler deploy
   ```

4. You will receive a URL such as:
   `https://shareit-signaling.<your-subdomain>.workers.dev`

5. Set this URL as an environment variable in your frontend build or in the in-app **Settings > Network** panel:
   ```env
   VITE_SIGNALING_SERVER=wss://shareit-signaling.<your-subdomain>.workers.dev
   ```

---

## 3. STUN and TURN NAT Traversal Configuration

ShareIt comes pre-configured with Google's free public STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`

If you require TURN relay servers for users behind restrictive corporate firewalls or symmetric NAT:
- Add your TURN server URL, username, and credential to GitHub Actions secrets or `.env`:
  ```env
  VITE_TURN_SERVERS=turn:turn.yourcompany.com:3478
  VITE_TURN_USERNAME=your-user
  VITE_TURN_CREDENTIAL=your-token
  ```
- Alternatively, participants can input TURN credentials directly in the **Settings** modal during any meeting.
