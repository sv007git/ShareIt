# ShareIt Real-Device & Multi-Browser Testing Guide

This guide details how to verify ShareIt features across multiple browser tabs and real physical devices.

---

## 1. Quick Multi-Tab Verification (Same Computer)

Thanks to ShareIt's built-in **`BroadcastChannel` fallback**, you can perform complete browser-to-browser WebRTC testing without even running an external signaling server!

1. Open a browser window to `http://localhost:3000` (or `https://sv007git.github.io/ShareIt/`).
2. Click **Start Sharing** to create a new room (e.g., `share-abc-xyz`).
3. You will enter the **Green Room**. Allow microphone/camera permissions.
4. Click **Copy Invite Link**, then open a second **Incognito / Private Window** and paste the URL.
5. In Tab 2, enter a different name (e.g. "Bob") and click **Join Meeting Now**.
6. **Result**: Both tabs will connect via peer-to-peer WebRTC!
   - You will see both video tiles with name badges.
   - Speaking into the microphone will light up the active speaker green indicator.
   - Muting in Tab 1 immediately updates the status in Tab 2.

---

## 2. Screen Sharing Verification

1. In Tab 1, click **Share Screen** in the bottom control bar.
2. The browser prompt will appear asking what to share:
   - Select **Entire Screen**, **Window**, or **Tab**.
   - Check the **"Share audio"** checkbox if available.
3. Verify that Tab 2 immediately displays the presentation stream in the large center presentation area with full resolution.
4. Verify that Tab 1's webcam appears in the **Floating Picture-in-Picture tile**.
5. Drag the floating tile around the screen. Verify it moves smoothly.
6. Click **Stop Sharing** in Tab 1 (or the browser's top bar notification).
7. Verify that Tab 2 automatically switches back to the normal video grid with Tab 1's camera stream restored.

---

## 3. Real-Time Chat Verification

1. In Tab 1, click the **Chat** icon in the bottom control bar.
2. Type `Hello from Tab 1! 🚀` and press Enter.
3. Verify that Tab 2 shows an unread notification badge on the Chat button.
4. Open the Chat drawer in Tab 2 and verify the message, sender name, and timestamp appear properly.
5. Click a quick emoji reaction (`👍`) in Tab 2 and verify it appears in both tabs.

---

## 4. Chunked File Transfer Verification (Explicit Accept/Reject)

1. In Tab 1, click the **P2P File Transfer** icon in the control bar.
2. Drag and drop any image, document, or PDF (or click to pick a file).
3. Tab 1 will display the file as `pending` (Waiting for acceptance).
4. Verify that Tab 2 receives an alert:
   > **Alice wants to send you 'document.pdf' (2.4 MB). Accept download?**
5. Click **Accept**.
6. Both tabs will show real-time progress bars and transfer speeds (`X MB/s`).
7. Once 100% is reached, Tab 2 displays a green **"Download File"** button.
8. Click **Download File** in Tab 2 and verify the file opens cleanly with matching checksum/content.

---

## 5. Host Controls Verification

1. The participant who created the room is designated as the **Host** (indicated with a shield badge).
2. Click the **Lock Room** button in the header.
3. Open a third tab and attempt to join the room URL.
4. Verify the new participant receives a message that the room is locked.
5. Unlock the room and verify the participant can join.
6. In the Host's Participants panel, click **Mute** on a participant. Verify their microphone is muted.
7. Click **Remove from meeting** on a participant. Verify that participant is disconnected and redirected to the home screen.

---

## 6. Mobile Device Testing Checklist

| Test Item | Android (Chrome/Firefox) | iOS (Safari) | Expected Result |
|---|---|---|---|
| Responsive UI | Touch-friendly controls | Touch-friendly controls | Bottom bar auto-fits, tiles stack in single column |
| Camera Switch | Front / Rear toggle | Front / Rear toggle | Switches between selfie and environment camera |
| Microphone | Functional | Functional | Audio level meter moves smoothly |
| Screen Share | Displays device options | Displays "Viewing Mode" badge | Mobile iOS Safari gracefully explains screen capture restriction |
| View Shared Screen | Fullscreen HD | Fullscreen HD | Clear zoom and pan of presenter's screen |
