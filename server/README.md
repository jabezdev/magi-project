# MAGI Server Architecture

## Overview
The MAGI server is a modular Node.js/Express application that serves the API and manages the filesystem-based database (`/data` directory). It has been refactored to follow strict RESTful principles and a "Lean" architecture with no legacy backward-compatibility layers.

## Directory Structure

- **`server.mjs`**: Entry point. Sets up Express, static file serving, and initializes routes.
- **`server/api/`**: Contains modular route handlers.
    - `index.mjs`: Aggregator that mounts all sub-modules.
    - `songs.mjs`: Song management (UUID-based).
    - `schedules.mjs`: Schedule management.
    - `media.mjs`: Media file management (Video/Image).
    - `slides.mjs`: Slide group and content management.
    - `scriptures.mjs`: Scripture version management.
    - `utils.mjs`: Shared helpers (Multer upload, UUID generation, Sanitization).
- **`server/scanners.mjs`**: Centralized logic for scanning the filesystem and generating metadata. Used by both API and State initialization.
- **`server/config.mjs`**: Configuration and settings management.
- **`server/state.mjs`**: In-memory state management (synchronized with clients via Socket.IO).

## Data Organization

All data is stored in the `data/` directory relative to the server root:
- `data/songs/`: JSON files named `[UUID]-[Title].json`.
- `data/schedules/`: JSON files for schedules.
- `data/media/`:
    - `background_videos/`, `content_videos/`
    - `background_images/`, `content_images/`
- `data/slides/`: Folders containing slide images or data.
- `data/scriptures/`: JSON files for scripture versions.

## API Endpoints

The API follows strict CRUD standards:
- **CREATE**: `POST /resource`
- **READ (List)**: `GET /resource`
- **READ (Item)**: `GET /resource/:id`
- **UPDATE**: `PUT /resource/:id`
- **DELETE**: `DELETE /resource/:id`

### Songs (`/api/songs`)
- `GET /` - List all songs (metadata).
- `GET /:id` - Get full song details.
- `POST /` - Create new song (Auto-generated UUID).
- `PUT /:id` - Update existing song.
- `DELETE /:id` - Delete song.

### Schedules (`/api/schedules`)
- `GET /` - List all schedules.
- `GET /:name` - Get schedule details.
- `POST /` - Create new schedule (`{ name: "..." }`).
- `PUT /:name` - Save/Update schedule.

### Media (`/api/media`)
- `GET /media/:type` - List media of a specific type (e.g., `background_videos`).
- `POST /media/upload/:type` - Upload file (Multipart form-data).
- `PUT /media/:type/:filename` - Rename file (`{ newName: "..." }`).
- `DELETE /media/:type/:filename` - Delete file and thumbnail.

### Slides (`/api/slides`)
- `GET /` - List slide groups.
- `POST /groups` - Create new slide group (Folder).
- `PUT /groups/:type/:name` - Rename slide group.
- `DELETE /groups/:type/:name` - Delete group.
- `POST /:type/:group/upload` - Upload slide image to group.
- `DELETE /:type/:group/:filename` - Delete specific slide image.

### Scriptures (`/api/scriptures`)
- `GET /` - List versions.
- `GET /:id` - Get version content.
- `POST /` - Create/Upload version (JSON in body).
- `PUT /:id` - Update version.
- `DELETE /:id` - Delete version.

## Key Design Decisions
1.  **UUIDs for Songs**: Songs are identified by strict UUIDs to allow multiple songs with the same title without collision.
2.  **Filesystem as Database**: The filesystem is the single source of truth. The API directly manipulates files and folders.
3.  **Strict REST**: No ambiguous endpoints. `POST` is strictly for creation, `PUT` is strictly for updates.
4.  **Centralized Scanning**: `Scanners` module is used for all file listing operations to ensure consistency between API and Socket state.
5.  **State Synchronization**: The `state-sync` socket event provides the full initial state, including all available media (`availableMedia`), slides (`availableSlides`), and scriptures (`availableScriptures`), reducing the need for client-side initial REST calls.
