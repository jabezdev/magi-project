# 🎵 MAGI Projection System

A comprehensive church projection system built with **Vite**, **TypeScript**, **Express**, **Socket.io**, and **Docker**. Display lyrics, videos, and images across multiple screens in real-time.

## 🎯 Features

- **3 Synchronized Screens:**
  - **Control Panel**: Manage song selection, verses, and background videos
  - **Main Projection Screen**: Display lyrics with looping video background
  - **Confidence Monitor**: Operator preview with current and next slide information

- **Real-time Updates**: Socket.io synchronization between all screens
- **Lyrics Management**: JSON-based song database with multiple verses
- **Video Support**: Looping background video on main projection screen
- **Docker Ready**: Complete containerized deployment

## 📋 Project Structure

```
magi/project/
├── src/                    # Frontend source files
│   ├── main.ts            # Multi-screen application logic
│   └── style.css          # Responsive styling
├── server.mjs             # Express + Socket.io backend
├── data/
│   └── lyrics.json        # Song lyrics database
├── public/
│   └── videos/            # Background video files
├── dist/                  # Build output (generated)
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Multi-container setup
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **Docker** and **Docker Compose** (for containerized deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Build frontend:**
   ```bash
   bun run build
   ```

3. **Start server:**
   ```bash
   bun run server
   ```

4. **Access the application:**
   - Control Panel: `http://localhost:3000`
   - Main Projection: `http://localhost:3000?screen=main-projection`
   - Confidence Monitor: `http://localhost:3000?screen=confidence-monitor`

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t magi-projection-system:latest .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access on network:**
   - Replace `localhost` with your server's IP address
   - Control Panel: `http://<SERVER_IP>:3000`
   - Main Projection: `http://<SERVER_IP>:3000?screen=main-projection`
   - Confidence Monitor: `http://<SERVER_IP>:3000?screen=confidence-monitor`

## 📱 Screen Descriptions

### Control Panel
The control center for managing the projection system:
- **Song Selection**: Browse songs organized by sets (Welcome, Worship, etc.)
- **Verse Control**: Select which verse of a song to display
- **Video Management**: Update background video URL
- **Preview**: See what's currently displayed

### Main Projection Screen
Large display for the congregation:
- **Looping Background Video**: Automatically plays and loops
- **Full-Screen Lyrics**: Large, readable text with proper contrast
- **Real-time Updates**: Instantly reflects Control Panel changes

### Confidence Monitor
Operator preview screen:
- **Current Slide**: Shows what's currently on Main Screen
- **Next Slide**: Preview of upcoming verse
- **Connection Status**: Confirms synchronization with Control Panel

## 🎵 Lyrics Data Format

Songs are stored in `data/lyrics.json`:

```json
{
  "sets": [
    {
      "id": 1,
      "title": "Set Name",
      "songs": [
        {
          "id": 1,
          "title": "Song Title",
          "artist": "Artist Name",
          "lyrics": [
            {
              "verse": 1,
              "text": "Verse text with\nmultiple lines"
            }
          ]
        }
      ]
    }
  ],
  "defaultBackgroundVideo": "/public/videos/background.mp4"
}
```

## 🎬 Adding Videos

1. Place your MP4 video file in `public/videos/`
2. Update the video URL in Control Panel or in `data/lyrics.json`
3. Video will automatically loop on the Main Projection Screen

Supported formats:
- MP4 (.mp4)
- WebM (.webm)
- OGG (.ogv)

## 🔌 API Endpoints

- **GET `/api/lyrics`** - Retrieve all songs and lyrics
- **GET `/api/config`** - Get application configuration

## 🔄 Socket.io Events

### Client → Server
- `update-slide`: Update current song and verse
- `update-video`: Change background video URL
- `request-state`: Request current state

### Server → Clients
- `slide-updated`: Broadcast slide change
- `video-updated`: Broadcast video change
- `state-request-ack`: Acknowledge state request

## 🛠️ Development

### Scripts

- `bun run dev` - Development mode (runs server)
- `bun run build` - Build frontend for production
- `bun run preview` - Preview production build
- `bun run server` - Start Express server with built frontend

### Adding New Songs

Edit `data/lyrics.json` and add songs to the appropriate set:

```json
{
  "id": 4,
  "title": "New Song Title",
  "artist": "Artist Name",
  "lyrics": [
    {
      "verse": 1,
      "text": "First verse lyrics here"
    },
    {
      "verse": 2,
      "text": "Second verse lyrics here"
    }
  ]
}
```

## 🎨 Customization

### Colors
Edit `src/style.css` CSS variables:
```css
:root {
  --primary-color: #1a1a2e;
  --accent-color: #0f3460;
  --text-color: #ffffff;
  --success-color: #00d4ff;
}
```

### Font Sizes
Modify sizes in `src/style.css` for different displays:
- `.verse` for Main Projection lyrics
- `.song-btn` for Control Panel buttons
- `.monitor-content` for Confidence Monitor

## 🌐 Network Setup

For multiple displays on the same network:

1. **Server Machine**: Run the application
2. **Main Projection PC**: Open `http://<SERVER_IP>:3000?screen=main-projection`
3. **Operator Computer**: Open `http://<SERVER_IP>:3000` (Control Panel)
4. **Optional - Monitor**: Open `http://<SERVER_IP>:3000?screen=confidence-monitor`

All displays automatically sync in real-time.

## 🐳 Docker Notes

The Docker image includes:
- Node.js 20 Alpine base
- All dependencies pre-installed
- Pre-built frontend
- Express server on port 3000

### Persistent Data
- `/app/public` - Video files volume
- `/app/data` - Lyrics data volume

## 📝 License

MIT

## 🙏 About

Built for church worship and projection needs. Designed to be simple, reliable, and easy to use.

---

For updates, support, or feature requests, please contact the development team.
