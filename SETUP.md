# MAGI Projection System - Setup & Usage Guide

## 🚀 Getting Started

Your church projection system is ready to use! Here's how to get it running.

### Option 1: Local Development (Fastest)

```bash
# Install dependencies
bun install

# Build frontend
bun run build

# Start server
bun run server
```

Then open:
- **Control Panel**: http://localhost:3000
- **Main Projection**: http://localhost:3000?screen=main-projection
- **Confidence Monitor**: http://localhost:3000?screen=confidence-monitor

### Option 2: Docker (Production Ready)

```bash
# Build image
docker build -t magi-projection-system:latest .

# Start container
docker-compose up -d

# Stop container
docker-compose down
```

Access on your network:
- Replace `localhost` with your server IP: `http://<YOUR_SERVER_IP>:3000`

## 📱 Using the System

### Control Panel (Operator's Screen)
1. **Select a Song**: Click any song title in the left panel
2. **Choose a Verse**: Click individual verses on the right
3. **Preview**: See what's displayed in the preview box
4. **Update Video**: Enter a video URL and click "Update Video"

### Main Projection Screen
- Displays full-screen lyrics over looping video background
- Text is large and readable for congregation
- Updates instantly when Control Panel changes verse

### Confidence Monitor
- Shows the operator what's on the Main Screen
- Previews the next verse coming up
- Confirms system is connected and working

## 🎵 Adding Your Songs

Edit `data/lyrics.json` to add new songs:

```json
{
  "id": 100,
  "title": "Your Song Title",
  "artist": "Artist Name",
  "lyrics": [
    {
      "verse": 1,
      "text": "Verse 1 lyrics here\nMultiple lines OK"
    },
    {
      "verse": 2,
      "text": "Verse 2 lyrics here"
    }
  ]
}
```

Save and refresh your browser - changes appear instantly!

## 🎬 Adding Background Videos

1. Place MP4 video in `public/videos/`
2. In Control Panel, update video URL to `/public/videos/yourfile.mp4`
3. Click "Update Video" - video loops on Main Screen

**Supported formats**: MP4, WebM, OGG

## 🖥️ Multi-Computer Setup

Perfect for church with multiple screens:

1. **Server Computer**: Run the app (Docker or local)
2. **Operator Computer**: Open `http://<SERVER_IP>:3000` (Control Panel)
3. **Main Display PC**: Open `http://<SERVER_IP>:3000?screen=main-projection`
4. **Side Monitor (optional)**: Open `http://<SERVER_IP>:3000?screen=confidence-monitor`

All devices automatically stay synchronized!

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect" | Ensure server is running on correct IP/port |
| Videos not playing | Check video format (use MP4) and file path |
| Screens out of sync | Refresh browser or restart server |
| Socket.io connection issues | Check firewall allows port 3000 |

## 📁 Project Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Frontend application logic |
| `src/style.css` | Styling for all screens |
| `server.mjs` | Express backend & Socket.io |
| `data/lyrics.json` | Song database |
| `public/videos/` | Background video files |
| `Dockerfile` | Docker container setup |
| `docker-compose.yml` | Multi-container orchestration |

## 🎨 Customizing Colors

Edit `src/style.css` to change colors:

```css
:root {
  --primary-color: #1a1a2e;      /* Dark background */
  --accent-color: #0f3460;       /* Medium blue */
  --text-color: #ffffff;         /* White text */
  --success-color: #00d4ff;      /* Bright cyan */
}
```

Rebuild after changes:
```bash
bun run build
```

## 📝 Production Checklist

- [ ] Add your church's songs to `data/lyrics.json`
- [ ] Add background video to `public/videos/`
- [ ] Update video URL in Control Panel
- [ ] Test all 3 screens on different devices
- [ ] Test verse navigation and video looping
- [ ] Customize colors if desired
- [ ] Deploy Docker image to production server
- [ ] Test network access from multiple devices

## 🆘 Need Help?

- Check `README.md` for full documentation
- Review `.github/copilot-instructions.md` for development guidelines
- Video errors? Ensure MP4 format and correct path
- Connection issues? Check firewall and network IP

## 🎉 You're All Set!

Your church projection system is ready for worship! 

Start with the Control Panel and enjoy synchronized displays across your entire sanctuary.

God bless! 🙏
