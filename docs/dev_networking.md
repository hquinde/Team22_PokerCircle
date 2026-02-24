# Dev Networking (Expo Device -> Local Backend)

This document explains how to connect the Expo frontend (running on a physical device) to the local backend server during development.

---

## The big rule: do NOT use localhost on a physical device
- On your laptop, `http://localhost:3000` works.
- On your phone (Expo Go), `localhost` points to the phone itself.
- Use your laptop's LAN IP instead: `http://<LAN_IP>:3000`

Example:
http://192.168.1.23:3000

## How to find your LAN IP
### Windows
Run:
ipconfig
Look for "IPv4 Address" under your active Wi-Fi adapter.

### macOS
System Settings -> Network -> Wi-Fi -> Details (IP Address)

### Linux
ip a
Look for an inet address on your Wi-Fi interface.

## Base URL rules
- **Physical device (Expo Go):**
  `http://<LAN_IP>:3000`
- **Emulator/simulator:**
  May use localhost depending on platform, but LAN IP still works reliably.

## Troubleshooting checklist
- Phone and laptop must be on the same Wi-Fi network.
- Ensure Windows Firewall allows inbound traffic to port 3000 (Private network).
- Confirm backend is listening on 0.0.0.0 (this repo does: httpServer.listen(..., "0.0.0.0")).
- Test from another device on the network:
  - Open http://<LAN_IP>:3000/api/health in a browser on your phone.
