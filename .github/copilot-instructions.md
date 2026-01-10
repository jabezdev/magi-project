# Copilot Instructions for MAGI Church Projection System

This is a church projection system built with Vite, Express, Socket.io, and Docker.

## Project Overview

A multi-screen projection system for church worship featuring:
- **Control Panel**: Manage songs and verses
- **Main Projection Screen**: Display lyrics with video background
- **Confidence Monitor**: Operator preview screen

All screens sync in real-time via Socket.io.

## Development Workflow

- Use `bun run build` to build the frontend
- Use `bun run server` to start the Express server (after building)
- Use `bun add <package>` to install new dependencies
- Use `bun remove <package>` to remove dependencies

## Project Structure

- `src/` - Frontend TypeScript and CSS files
- `server.mjs` - Express + Socket.io backend
- `data/` - Lyrics JSON database
- `public/` - Static assets (videos, images)
- `dist/` - Production build output (generated)
- `index.html` - Application entry point

## Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project metadata and dependencies
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-container orchestration

## Screen Access

- **Control Panel**: `http://localhost:3000`
- **Main Projection**: `http://localhost:3000?screen=main-projection`
- **Confidence Monitor**: `http://localhost:3000?screen=confidence-monitor`

## Docker Deployment

```bash
docker build -t magi-projection-system:latest .
docker-compose up -d
```

Access via network IP: `http://<SERVER_IP>:3000`

## Key Features

- Real-time synchronization across screens
- Lyrics management via JSON
- Looping background video support
- Responsive design for multiple display sizes
- Network-ready deployment

## Adding Songs

Edit `data/lyrics.json` to add or modify songs in different sets.

## API Endpoints

- `GET /api/lyrics` - Retrieve all songs
- `GET /api/config` - Get app configuration

## Socket.io Events

- `update-slide`: Update displayed lyrics
- `update-video`: Change background video
- `slide-updated`: Broadcast slide changes
- `video-updated`: Broadcast video changes

