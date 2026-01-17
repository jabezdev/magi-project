# Media Behavior Design Requirements

This document serves as the comprehensive design requirement specification for all media types within the software. It details the exact behaviors, UI layouts, controls, and screen outputs for every supported media type.

---

# 0. Global Architecture & UI

## 0.1 Global UI Layout
The application is divided into **3 Main Vertical Columns**:

### Column 1: Resources & Schedule
- **Top Section**: **Schedule** (Timeline of the current service).
- **Middle Divider**: Resizable Splitter.
- **Bottom Section**: **Unified Library** (Searchable database of all media).

### Column 2: Operation (The Workspace)
- **Layout**: 2x2 Grid (or split view with sticky headers).
- **Upper Left**: **Preview Panel** (Inspection area).
    - **Header**: Contains the **"GO LIVE ->"** button (Prominent, Top Right of panel). Moves Preview content to Live.
- **Upper Right**: **Live Panel** (Active Program area).
    - **Header**: Contains **4 Global Output Controls**:
        1.  **Logo**: Overrides output with the configured Logo Loop/Image.
        2.  **Black**: Cuts output to Black.
        3.  **Clear**: Clears overlays (Lyrics/Lower Thirds), keeps Background.
        4.  **Play** (Restore): Disables Logo/Black/Clear and resumes normal program output.
- **Lower Left**: **Preview Utility Panel**.
    - *Context Aware*: Shows relevant tools for the Preview Item (e.g., Background Picker for Songs, Transport Controls for Video).
    - *Dynamic Visibility*: Hides (or shows empty state) if no item is loaded in Preview.
- **Lower Right**: **Live Utility Panel**.
    - *Context Aware*: Shows relevant tools for the Live Item.
- **Smart Merging vs Split**:
    - **Merge**: If both Preview and Live items share the same utility type (e.g., Background Picker), the Bottom Row merges into a single wide panel. Visual indicators (Blue/Red) distinguish selection.
    - **Split**: If types differ (e.g., Preview takes Text Props, Live takes Video Transport), the bottom row stays **Split 50/50**. Left side shows Preview tools, Right side shows Live tools.

### Column 3: Outputs & Audio
- **Top Section**: **Mini-Outputs Panel**.
    - **Rendering**: Live iframe instances of the actual output routes (see below).
    - **Thumbnails**: [Main Screen] | [Confidence] | [Lower Thirds] | [Mobile].
    - **Toggles**: Individual switches to Enable/Disable rendering (save resources).
- **Bottom Section**: **Audio Control Panel**.
    - **Purpose**: Global mixer for all active audio sources (Video tracks, Audio files, SFX).
    - **Design**: Faders per active source + Master Fader. Always visible.

## 0.2 Application Routes & Architecture
- **Control Panel**: `/` (Operator interface).
- **Main Output**: `/main` (Projector).
- **Confidence Monitor**: `/confidence` (Stage facing).
- **Lower Thirds**: `/thirds` (Broadcast overlay).
- **Mobile View**: `/mobile` (Personal device).
    - *Network*: Accessed via local network (e.g. `domain/mobile`).
    - *Persistence*: Caches last known schedule/status to allow "offline" navigation if connection drops. Re-syncs automatically on reconnect.

## 0.3 Global Settings & Defaults
- **Transitions**:
    - **Global Default**: Cross-Dissolve (1.0s) for Backgrounds, Cut (0s) for Lyrics.
    - **Hierarchy**: **System Default** -> **Theme Preset** -> **Individual Item Override**.
    - **Overrides**: Every media item can override defaults.
- **Audio Output**:
    - **Multi-Channel**: Supports matrix routing (e.g., Ch 1-2 Main, Ch 3-4 Click). Configurable in Settings (Enabled/Disabled).
- **Error Handling**:
    - **Missing Media**: Items with missing files display a Red "File Not Found" icon/overlay. Playback is disabled.
- **Keyboard Shortcuts** (Unified):
    - `Space`: Fire "Next" (Slide/Video/Cues).
    - `Shift + Space`: Fire "Previous".
    - `F1`: **Clear** (Clears Lyrics/Overlays).
    - `F2`: **Black** (Cut to Black).
    - `F3`: **Logo** (Toggle Static Mode).
    - `F4`: **Play** (Restore/Clear All Clears).
    - `Arrow Up/Down`: Navigate Schedule.
    - `Ctrl + Enter`: (Editor) Break Slide.
    - `Esc`: Stop / Unfocus.

---

# General Concepts

## 1. Creation / Import
- All creation and import shall be on the + Button at the Unified Library. A popover or a whole editing screen should open up based on the media type selected.
- All needed metadata should be asked from the user to make sure that items are not mismanaged and are easy to find.

## 2. Library
- **Unified Storage**: Library contains ALL media types (Songs, Scriptures, Videos, Images, Backgrounds, Presentations).
- **Search Scope**: By default, search filters OUT Background Videos/Images to keep the list clean.
- **Search logic**: Fuzzy search title, metadata, tags, and content (lyrics). Matches shown by relevance.
- **Filters**: User can toggle filters: "All", "Song", "Scripture", "Slides", "Media", "Backgrounds"
- **Order**: Most Recently Used (MRU) first, then Creation Date.
- **Interaction Standard**:
    - **Left Click Card**: Toggles Preview (Loads into Preview Panel).
    - **Right Click Card**: Opens Context Menu (Edit, Delete, Properties).
    - **Left Click Thumbnail**: Opens specific "Override/Settings" Popover (e.g., Background Override for Songs).
    - **Double Click Card**: Adds to Schedule (Default Arrangement).

## 3. Schedule
- **Display**: Optimized per media type.
- **Interaction Standard**:
    - **Click**: Loads into Preview.
    - **Drag (In)**: Adds to Schedule.
    - **Drag (Out/Bottom)**: Removes from Schedule.
    - **Drag (Reorder)**: Changes sequence.
- **Attributes**: Items in schedule are "Instances". Edits here (e.g., Key, Arrangement, Background Override) do not affect the Master Library Item.

## 4. Preview Panel
- **Visibility**: Primary goal is clarity.
- **Layouts**:
    - **Visual**: Shows the exact slide/image/video.
    - **Text-Only/Control**: (For Songs/Slides) Option to view as a text-heavy grid or list for operators who need density over visual fidelity.
- **Navigation**: Easy access to all parts of the item.

## 5. Live Panel
- **Control**: Includes functionality (Play/Pause, Vol) absent in Preview.
- **Settings**:
    - **Video Mirroring**: A Global Setting exists to toggle "Mirror Video to Confidence/Mobile".
        - *On*: High Performance. Full video shown on all screens.
        - *Off*: Low Performance/Safety. Confidence/Mobile show Thumbnail + Progress only.

## 6. Main Projection Screen
- **Priority**: Highest rendering priority.
- **Content**: The "Program" output.

## 7. Confidence Monitor Screen
- **Philosophy**: Utility focus. Zero distraction.
- **Video Behavior**: Respects the "Video Mirroring" global setting.
- **Footer**: **MUST** show "Next Item: [Title]" to cue the stage team.

## 8. Lower Thirds Screen
- **Philosophy**: Clean broadcast overlay.
- **Constraint**: Non-blocking. Content must respect the lower 20% safe area.

## 9. Mobile Screen
- **Philosophy**: **Read-Only** Monitor (Personal).
- **Control**:
    - **No Output Control**: User cannot Play/Pause/Fire items.
    - **Navigation**: User *can* scroll their local view to look ahead.
    - **Sync**: "Resume Auto-Scroll" button appears when user unlocks sync.
- **Footer**: Shows "Next Item: [Title]".

---

# 1. Song

## 1. Creation / Import
- **UI Context**: A full-screen modal known as the **Song Editor**.
- **Input Fields**:
    - **Header**: Large input for **Song Title** and **Artist Name**.
    - **Metadata Section**: Optional fields for **Copyright**, **CCLI Number**, **Key**, **Tempo**, and **Time Signature**.
- **Parts Creation**:
    - **Mechanism**: "Add Part" button bar (Sticky at top or bottom) with preset types: *Intro, Verse, Chorus, Pre-Chorus, Bridge, Tag, Coda, Ending*.
    - **Editing**: Each part appears as a distinct card/block. Inside, the user types lyrics in a textarea.
    - **Slide Splitting**:
        - **Manual**: User adds extra Enter lines (or a specific "Split" button) to create a slide break within a part.
        - **Visual**: A horizontal dashed line indicates a slide break. There is also a number indicator
- **Background Assignment**:
    - **Global**: A "Default Background" drop-zone in the panel next to the Metadata Section.
    - **Part-Specific**: Each part has a thumbnail (follows the Global Background by default) and by clicking the thumbnail -> "Override Background" -> Opens Media Picker. overrides global. The thumbnail changes to indicate override
- **Arrangements**:
    - **UI**: Right column named "Arrangement". Arrangements are vertical columns with the arrangement name on top and the Parts components listed row by row on their color. 
    - **Action**: "Add Arrangement" -> Name it (e.g., "Acoustic Cover").
    - **Workflow**: On top is a bar that contains all the existing Parts into a linear sequence list.
    - **Reuse**: The same parts can be reused as many times needed. Editing the lyrics in the main block updates all instances.

## 2. Library
- **Layout**: List View (Virtual Scroll for performance).
- **Row Content**:
    - **Left**: Global Background for that Song as a thumbnail. Music Note Icon (Grey/Neutral) if none.
    - **Center**: **Title** (Bold, Primary Text) + **Artist** (Small, Secondary Text).
    - **Right**:
        - **Badge**: Small pill showing number of arrangements (e.g., "2 Arr").
        - **Actions**: "Edit" (Pencil), "Add" (+).
- **Search Behavior**:
    - **Bar**: Top of Library panel.
    - **Scope**: Matches text in Title, Artist, OR Lyrics content.
    - **Highlight**: Matched text in the list is bolded/highlighted.
- **Selection**: Click row to preview (does not add to schedule). Double-click to add to schedule (Default Arrangement), or the + "Add" button, or drag into a specific place in the Schedule.

## 3. Schedule
- **Representation**: A Schedule Item card in the left sidebar Timeline.
- **Content**:
    - **Icon**: Thumbnail (Shows the Global thumbnail).
    - **Text**: Song Title (Top), Artist (Bottom).
- **Interactions**:
    - **Hover**: Shows a "Settings" gear or specific "Background" icon overlay on the thumbnail.
    - **Click**: Loads the song into the **Preview Panel**.
    - **Drag**: Reorder position in the list.
    - **Remove**: Drag to the bottom (Library area) -> Library overlay turns Red/Delete icon -> Release to remove.
- **Overrides (Schedule-Specific)**:
    - **Pop-over**: Click the Thumbnail/Icon.
    - **Options**: "Select Theme/Background". User picks a background only for *this* specific instance in the service. Does not affect the saved Song in Library.

## 4. Preview Panel
- **Layout Structure**:
    - **Header**: "PREVIEW: [Song Title]" (Blue accent).
    - **Action**: **"GO LIVE"** button (Top Right). Clicking this pushes the item to the Live Panel.
    - **Top Sticky Bar (Arrangement Strip)**:
        - Horizontal track showing blocks: [V1][Pr][C][V2][C][B][C].
        - **Color Coding**: Each part type has a specific color (Verse=Blue, Chorus=Red, Bridge=Orange, etc.).
        - **Active Indicator**: A White border or "Glow" around the block currently being previewed.
    - **Main Area (Lyric Scroll)**:
        - **Vertical Gutter**: Left side. Shows Rotated Labels (e.g., "VERSE 1").
        - **Slides**: Rows of cards. Each card represents one slide.
        - **Content**: White text on dark grey card background.
- **Controls & Interaction**:
    - **Select**: Single click a slide card -> Card turns **Blue** (Preview Active).
    - **Context Menu**: Right-click a slide -> "Override Slide Background" (One-off override).
    - **Quick Edit**: "**Edit**" button in Panel Header opens the Song Editor.
- **Bottom Panel (Backgrounds)**:
    - **Content**: Grid of available backgrounds (Videos/Images).
    - **Selection**: The background currently assigned to the song is bordered **Blue**. Clicking another one seamlessly switches the Preview background to that new asset.

## 5. Live Panel
- **Layout Structure**: Mirrors Preview Panel exactly but with **Red** accents.
- **Header**: "LIVE: [Song Title]" (Red accent).
- **Global Controls**: [Logo] [Black] [Clear] [Play] buttons visible in this panel frame.
- **Arrangement Strip**: Shows what is currently on the Main Screen.
- **Main Area**:
    - **Active Slide**: The slide currently projected is highlighted **Red**.
    - **Follow Mode**:
        - **Behavior**: If the user sends a new song to live, this panel auto-scrolls to ensure the first slide is at the center.
        - **Navigation**: Clicking a slide here performs a **Hard Cut** (or configured transition) to that slide immediately.
- **Bottom Panel (Backgrounds)**:
    - **Shared State**: The Backgrounds Panel is physically located at the bottom of these columns.
    - **Indicators**:
        - **Blue Border**: Selected in Preview.
        - **Red Border**: Currently Live on Screen.
        - **Double-Click**: Takes a background Live (Red) immediately.
        - **Single-Click**: Selects for Preview (Blue).
- **View Modes**:
    - **Standard**: Cards view.
    - **Text-Only**: Dense list of lyrics/slides for power users.

## 6. Main Projection Screen
- **Composition**:
    - **Layer 1 (Bottom)**: Background Video/Image (Looping).
    - **Layer 2 (Top)**: Lyrics Text.
- **Typography**:
    - **Font**: User configured (e.g., Inter, Bebas Neue, Gotham, Montserrat).
    - **Size**: Scaled to maximize readability or fixed size (User setting).
    - **Alignment**: Center/Center or depending on theme and user setting.
    - **Shadow**: Heavy drop shadow or outline to ensure contrast against video. (user setting too)
- **Transitions**:
    - **Text**: Rapid fade (0.3s) by default but there is a user setting.
    - **Background**: Smooth Cross-Dissolve (1.0s) to avoid jarring cuts (user setting too).

## 7. Confidence Monitor Screen
- **Layout Mode**: "Teleprompter".
- **Visuals**:
    - **Colors**: High Contrast (White Text on Pure Black Background).
    - **Layout**: Follows the vertical gutter for parts + text as slide blocks like the Preview and Live Panels. 
    - **Previous Slide**: The last 3 slides are still rendered on top of the current slide, tho if it doesn't fit, the top one just gets cut off. Same layout, the items just scrolls. Same font size and font as the current slide. Color is greyed out (user setting)
    - **Current Slide**: In the center of the screen. Font color is white.
    - **Next Slide**: Next 3 slides are loaded in, but if it doesn't fit, the bottom one just gets cut off.
- **Header Info Bar**:
    - **Right**: Current System Time (HH:MM AM/PM).
    - **Center**: A simplified progress strip of the Arrangement with their colors (e.g., [V1] [C] [V2]...). The current part is highlighted. This helps the band know where they are in the roadmap. If there are a lot of parts, it auto-scrolls into the active one.

## 8. Lower Thirds Screen
- **Visuals**:
    - **Background**: Transparent (Alpha channel 0). or changed as the user likes to (green, blue screen, etc.)
    - **Text**: White text with black shadow/stroke. (or as the user sets in the settings)
    - **Layout**: Bottom 15-20% of the screen. (or as the user sets)
- **Formatting**:
    - **Line**: Max 2 lines. (User preference needed, usually auto-reflow to fit all of the text of the slide).
    - **Alignment**: Centered horizontal.

## 9. Mobile Screen
- **Purpose**: Personal monitor for musicians/operators.
- **Layout (Portrait)**:
    - **Top**: "Now Live" (Song Title).
    - **Middle**: Large text area showing current lyrics.
    - **Bottom**: List of upcoming parts.
- **Layout (Landscape)**: Split View.
    - **Left Col**: Arrangement List (Clickable to jump if operator).
    - **Right Col**: Current Lyrics (Huge).
- **Sync Behavior**:
    - **Lock**: Default. Auto-scrolls as the operator changes slides.
    - **Unlock**: Text interaction (scroll) pauses the auto-scroll. A "Resume Auto" floating button appears.

---

# 2. Scripture

## 1. Creation / Import
- Main scripture translations are already uploaded to the system.
- There is an "Upload Translation" button in the settings to upload new translations but it's just a file drop with the metadata entries.

## 2. Library
- **Regular Operation**: Search matches general verse content (no specific Translation locked yet).
- **Selection Interaction**:
    - **Click**: Opens "Translation Selection" Popover (Right side).
    - **Popover Layout**:
        - **Tabs**: [English] | [Tagalog] | [other...]
        - **Content**: Shows the full text of the selected verse range in that translation.
        - **Scroll**: If text is long, the content box scrolls.
    - **Action**: User clicks "Add to Schedule" button for the specific translation tab active.

## 3. Schedule
- **Display**: Reference Title + [Translation Tag] (e.g., "John 3:16 [NIV]").
- **Thumbnail**: Generic Scripture Icon or the specific background if assigned.
- **Re-Selection**: Clicking the **Translation Tag** pill opens the Popover again to switch translations (e.g., swap NIV to ESV).
- **Action**: Drag to reorder.

## 4. Preview Panel
- **Slide Generation**:
    - The system **automatically** breaks the selected verses into slides based on font size/line limits. User does not manually split "Slide 1".
    - **Reference**: The Bible Reference is shown as a "Header" on every slide (optional) or just the first.
- **Layout**: Similar to Song. Sticky Header showing "Genesis 1". Scrollable list of generated slides.

## 5. Live Panel
- **Representation**: List of verse slides.
- **Control**: Click to fire.
- **Highlight**: Red border on active slide.

## 6. Main Projection Screen
- **Visuals**:
    - **Body**: Verse text. Top/Center.
    - **Footer**: Reference (e.g., "Genesis 1:1") in smaller, distinct font (yellow/gold).
- **Background**: Often a more subtle, static, or slow-moving abstract video to ensure readability of dense text.

## 7. Confidence Monitor Screen
- **Visuals**:
    - Text only.
    - No background.
    - **Reference**: Shown clearly at top.
    - **Scroll**: If the verse is long, it might scroll automatically or be paged.

## 8. Lower Thirds Screen
- **Logic**:
    - **Splitting**: Scripture is shown at the bottom.
    - **Display**: Text + Reference next to it.
    - **Transition**: Fast dissolve between chunks.

## 9. Mobile Screen
- **Visuals**: Continuous stream of text (like a Bible reader app).
- **Highlight**: The current "chunk" being projected is highlighted in Yellow.

---

# 3. Video (YouTube)

## 1. Creation / Import
- **UI Context**: "Add Item" -> "YouTube URL".
- **Input**: Paste URL field.
- **Validation**: System checks URL, displays "Fetching...".
- **Result**: Displays video thumbnail, Title, and duration.
- **Trimming Options**:
    - **Range Slider**: Two handles (Start/End).
    - **Input**: "Start at: 00:00", "End at: 03:00".
- **Download**: Depending on implementation, it might stream or pre-download. (Assume Stream/Cache).

## 2. Library
- **Display**: Title of the video.
- **Icon**: Video Thumbnail
- **Metadata**: YouTube Brand Icon (Red play button). Duration (e.g., "4:20").

## 3. Schedule
- **Display**: Title + Thumbnail.
- **Info**: Shows "Trimmed Duration" if distinct from total.

## 4. Preview Panel
- **Player**: Embedded Video Player.
- **State**: Default **Muted** (to not disturb service).
- **Controls**: Play/Pause, Scrubber.
- **Playhead Logic**:
    - **Default**: Starts at the configured "Start Time" (e.g. 00:00).
    - **Override**: When user scrubs, a **"Start at Current Frame"** toggle appears. If checked, "Go Live" starts from that exact scrub position.
- **Cues**: "Set In point" / "Set Out point" buttons available for quick adjustment.
- **Header**: Contains **"Edit"** button for quick access to source properties.

## 5. Live Panel
- **Player**: Active monitor of playback.
- **Controls (Prominent)**:
    - **Big Play/Pause**: Center.
    - **Stop**: **Cuts Video to Black immediately**. (Distinct from Global "Clear", which removes overlays).
    - **Fade**: 2-second fade out button.
    - **Scrubber**: Live seek (Warning: Dangerous).
- **Timer**: Large countdown showing "Time Remaining".

## 6. Main Projection Screen
- **Visuals**: Full Screen Video.
- **Audio**: Audio is routed to the Main Output.
- **Overlay**: None (Clean feed).

## 7. Confidence Monitor Screen
- **Visuals**:
    - **Rest State**: Thumbnail Image.
    - **Active State**: Mirror the video.
    - **Status Overlay**:
        - "PLAYING: [Title]"
        - **Countdown**: Giant numbers "-02:14".
        - **Performance Setting**: If Mirroring OFF -> Show Static Thumbnail. If Mirroring ON -> Show Video Feed.
        - **Footer**: "Next Item: [Next Schedule Item Title]".

## 8. Lower Thirds Screen
- **Visuals**: **Transparent**.
- **Reason**: Live camera feed is usually active. We do not overlay a full YouTube video on top of the speaker.
- **Exception**: If "Picture-in-Picture" mode is designed, but default is Hidden.

## 9. Mobile Screen
- **Visuals**: Static Thumbnail or Live Feed (depends on Setting).
- **Status**: Progress Bar + Time Remaining.
- **Controls**: **Read Only**. No Play/Pause buttons.
- **Footer**: "Next Item: [Next Schedule Item Title]".


---

# 4. Video (Content)

## 1. Creation / Import
- **UI Context**: "Add Item" -> "Upload Media".
- **File Picker**: Selects MP4, MKV, MOV files from local disk.
- **Settings Modal**:
    - **Name**: Editable display name.
    - **Loop**: Checkbox (Default Off for content).
    - **Volume**: Gain slider (0-100%).
    - **Thumbnail**: Auto-generated or User-uploaded custom poster frame.

## 2. Library
- **Layout**: Listed on the Search Library like other items
- **Icon**: Clapperboard Icon or Video File Icon.
- **Thumbnail**: Small preview of the video frame.

## 3. Schedule
- **Display**: Title + Thumbnail.
- **Behavior**: Acts as a standalone program item.

## 4. Preview Panel
- **Player**: Standard video preview.
- **Audio**: Muted by default to prevent control room noise.
- **Scrubbing**: Full timeline access.

## 5. Live Panel
- **Controls**:
    - **Transport**: Play, Pause, Stop (Rewind to start).
    - **Seek**: Draggable progress bar.
    - **Fade Out**: Button to fade video & audio over 2s.
- **Feedback**:
    - **Time Elapsed**: 01:23
    - **Time Remaining**: -02:45
    - **End Action**: Indicator showing what happens at end (Stop or Advance).

## 6. Main Projection Screen
- **Visuals**: Full Screen, Original Aspect Ratio (Black bars if mismatch, unless "Zoom/Fill" selected).
- **Z-Index**: Highest Priority (Opaque). Cover all other layers.

## 7. Confidence Monitor Screen
- **Visuals**:
    - **Content**: Video is shown.
    - **Countdown**: Large, high-visibility green/red countdown timer.
    - **Next**: "Next Item: Sermon".

## 8. Lower Thirds Screen
- **Visuals**: **Transparent**.
- **Usage**: Content videos usually replace the live camera feed on the Switcher, so the Lower Thirds graphics channel should be clean to avoid double-keying artifacts.

## 9. Mobile Screen
- **Visuals**:
    - Name of Video.
    - Playback Progress Bar.
    - "Next Item: Sermon".

---

# 5. Video (Background)

## 1. Creation / Import
- **UI Context**: Upload Background Video.
- **Properties**:
    - **Loop**: Locked to ON.
    - **Audio**: Locked to MUTE.

## 2. Library
- **Section**: "Backgrounds" Tab (Separated from main content usually).
- **Sorting**: By Color, Style, or Name.
- **Preview**: Hovering the thumbnail plays a mute preview (scrub-on-hover).

## 3. Schedule
- **Usage**: Not typically a "root" item.
- **Context**: Used as a property of Songs/Scriptures.
- **Exception**: "Walk-in Loop". A Schedule Item composed *only* of a Background Video.

## 4. Preview Panel
- **Context**: The "Backgrounds" bottom drawer.
- **Selection**: Click to arm. Blue border.

## 5. Live Panel
- **Context**: Bottom drawer.
- **Indicator**: Red border around the playing loop.
- **Transition**: Double-clicking a new background here initiates a Cross-Dissolve on the Main Screen immediately.

## 6. Main Projection Screen
- **Layer**: **Background Layer** (Bottom-most).
- **Behavior**:
    - Loops seamlessly (cross-fade end-to-start if possible, or simple cut loop based on user setting).
    - **Persistence**: If Song A ends and Song B starts, and both use the **same** background, the video does **NOT** restart/cut. It continues playing smoothly.

## 7. Confidence Monitor Screen
- **Visuals**: **Not shown**.
- **Rationale**: Motion backgrounds reduce contrast and legibility for the stage talent.

## 8. Lower Thirds Screen
- **Visuals**: **Transparent**.
- **Rationale**: Broadcast requires a clean key.

## 9. Mobile Screen
- **Visuals**: Transparent.

---

# 6. Image (Content)

## 1. Creation / Import
- **UI Context**: Upload JPG, PNG.
- **Properties**:
    - **Duration**: "Duration" (if part of auto-advance).
    - **Name**: Editable display name.
    - **Aspect Ratio Mismatch setting**: "Fit" or "Fill" or "Stretch".

## 2. Library
- **Icon**: Photo Icon.
- **Thumbnail**: The image itself.

## 3. Schedule
- **Display**: Title + Thumbnail.

## 4. Preview Panel
- **Canvas**: Shows the image fit to container or based on the user settings
- **Edit**: Crop/Zoom controls if applicable.

## 5. Live Panel
- **Action**: "Show" button.
- **Status**: Live indicator.

## 6. Main Projection Screen
- **Visuals**: Full Screen.
- **Scaling**:
    - **Fit**: Black bars if aspect ratio differs.
    - **Fill**: Zoomed to cover (center crop).
    - **Stretch**: Stretches to cover (center crop).
- **Layer**: Content Layer (Opaque).

## 7. Confidence Monitor Screen
- **Visuals**: The Image is displayed based on the user settings.
- **Context**: Speakers often need to see the slide/chart/meme being shown to the audience.
- **Label**: "IMAGE" at top.

## 8. Lower Thirds Screen
- **Visuals**: **Hidden**.
 
## 9. Mobile Screen
- **Visuals**: Small thumbnail preview.

---

# 7. Image (Background)

## 1. Creation / Import
- **UI Context**: Upload -> Mark as Background.
- **Properties**:
    - **Duration**: "Duration" (if part of auto-advance).
    - **Name**: Editable display name.
    - **Aspect Ratio Mismatch setting**: "Fit" or "Fill" or "Stretch".

## 2. Library
- **Section**: Backgrounds Tab.
- **Filter**: "Still Images".
- **Thumbnail**: The image itself.

## 3. Schedule
- **Usage**: Property of Song/Scripture.

## 4. Preview Panel
- **Context**: Bottom drawer background picker.

## 5. Live Panel
- **Selection**: Doucble click to apply immediately

## 6. Main Projection Screen
- **Layer**: Background Layer.
- **Behavior**: Static.
- **Transition**: Cross-dissolve when switching from a Video BG or another Image BG.

## 7. Confidence Monitor Screen
- **Visuals**: Black.

## 8. Lower Thirds Screen
- **Visuals**: Transparent.

## 9. Mobile Screen
- **Visuals**: Transparent

---

# 8. Presentation (Local Slide Deck)

## 1. Creation / Import
- **UI Context**: "New Presentation".
- **Editor**:
    - **Sidebar**: List of slides (drag to reorder).
    - **Canvas**: **WYMIWYG** (What You Mean Is What You Get). User enters content/intent -> System renders to Template.
    - **Templates**: "Pick a Theme" modal (fonts, colors).
- **Media Injection**:
    - **Action**: "Insert Media Slide".
    - **Choices**: Select Video (Content) or Image (Content) from Library.
    - **Result**: The media item becomes "Slide 3".

## 2. Library
- **Icon**: Projector/Presentation Icon.
- **Info**: "12 Slides".
- **Thumbnail**: The rendered first slide.

## 3. Schedule
- **Display**: Presentation Title.
- **Thumbnail**: The rendered first slide.

## 4. Preview Panel
- **Layout**: 
    - **Standard**: Horizontal filmstrip (PowerPoint style).
    - **Control View**: Dense **Text List** option (similar to Songs) for easy reading of bullets/notes without rendering graphics.
- **Main View**: Large preview of Selected Slide.
- **Notes Panel**: Right side panel showing "Speaker Notes" for the selected slide.

## 5. Live Panel
- **Controls**: Standardized **PREV** / **NEXT** buttons (Large/Touch-friendly).
- **Media Nodes**: If the next slide is a Video, the thumbnail shows a "Play" overlay to indicate auto-start.

## 6. Main Projection Screen
- **Visuals**: Rendered HTML/Canvas of the slide.
- **Logic**:
    - **Standard Slide**: Static visual.
    - **Media Slide**: Plays the video content full screen.

## 7. Confidence Monitor Screen
- **Visuals**:
    - **Current Slide**: Top Left (Large). High visibility.
    - **Next Slide**: Top Right (Small).
    - **Speaker Notes**: Bottom half of the screen. Yellow text on black. Use specific "Notes" field from the slide data.

## 8. Lower Thirds Screen
- **Visuals**:
    - **Smart Template**: If the slide contains bullet points, extract text and render in a lower-third list style.
    - **Fallback**: Don't render full graphical slides on lower thirds (unreadable/blocks camera).

## 9. Mobile Screen
- **Visuals**: Focus on **Speaker Notes**.
- **Layout**:
    - Top: Current Slide Preview.
    - Center: Grid of previews and next slide thumbnails
    - Bottom: Scrollable Notes area.
- **Controls**: Next/Prev slide.

---

# 9. Presentation (Images)

## 1. Creation / Import
- **UI Context**: "Import Slides (Images)".
- **File Picker**: Select multiple JPEGs (e.g., exported from PowerPoint).
- **Processing**: Sorts alphabetically. Creates 1 slide per image.

## 2. Library
- **Icon**: Stack of Photos Icon.

## 3. Schedule
- **Display**: Title + Slide Count.

## 4. Preview Panel
- **Layout**: Simple filmstrip.

## 5. Live Panel
- **Controls**: Standardized **PREV** / **NEXT** buttons.

## 6. Main Projection Screen
- **Visuals**: Images displayed Full Screen (Fit/Fill settings apply).

## 7. Confidence Monitor Screen
- **Visuals**:
    - **Current**: Fit-to-screen image.
    - **Next**: Thumbnail.

## 8. Lower Thirds Screen
- **Visuals**: Hidden.

## 9. Mobile Screen
- **Visuals**: Thumbnails list.

---

# 10. Presentation (Canva)

## 1. Creation / Import
- **UI Context**: "Add Canva Presentation".
- **Import Flow**:
    - Upload the exported `.mp4` from Canva.
    - **Definition Editor**: User watches the video and marks "Times" for each slide:
        - Slide 1 IN: 00:00 - 00:05.
        - Slide 1 HOLD: 00:05.
        - Slide 1 OUT / Slide 2 IN: 00:05 - 00:10.
- **Automation**: Potentially auto-detect scene changes (Future) but default is the hold is at the center of the runtime of the video

## 2. Library
- **Icon**: Canva logo or Video Deck Icon.

## 3. Schedule
- **Display**: Title.

## 4. Preview Panel
- **Layout**: List of "Steps" (Slide 1, Slide 2, Slide 3).
- **Preview**: Hovering a step plays the transition video in the preview player.

## 5. Live Panel
- **Controls**: **Prev** / **Next**.
- **Logic**:
    - Current State: Holding at 00:05.
    - User clicks NEXT.
    - Action: Player plays video from 00:05 to 00:10.
    - Event: At 00:10, Player pauses automatically. State is now "Slide 2".

## 6. Main Projection Screen
- **Visuals**: High-quality Video.
- **Audio**: Pass-through (if video has sound).

## 7. Confidence Monitor Screen
- **Visuals**: Shows a Static Frame of the *Destination* Slide.
- **Reason**: We don't want to distract the speaker with the flying animations. Just show them the final bullet points of the next slide.

## 8. Lower Thirds Screen
- **Visuals**: Hidden.

## 9. Mobile Screen
- **Visuals**: Step List. "Ready to Advance".

---

# 11. Audio

## 1. Creation / Import
- **UI Context**: "Library" -> "Audio" Tab -> Upload MP3/WAV/AAC.
- **Tagging**: Tag as "BGM", "Pad", "SFX".

## 2. Library
- **Section**: Audio Tab.
- **Display**: Title, Duration, Artist.
- **Icon**: Waveform.

## 3. Schedule
- **Usage**:
    - **Standalone**: Playing a pre-service playlist.
    - **Attached**: Linked to a Song (Backing Track).

## 4. Preview Panel
- **Player**: Waveform visualizer.
- **Output**: Local Computer Audio (Cue) only.

## 5. Live Panel
- **Location**: **Column 3 Bottom Section** (Global Audio Panel).
- **Controls**:
    - Play/Pause.
    - **Fader**: Vertical Volume Slider.
    - **Loop**: Toggle.
    - **Fade Out**: 5s slow fade button.

## 6. Main Projection Screen
- **Visuals**: **No Change**. (Audio is purely auditory).
- **Note**: Playing audio does NOT clear the active lyrics/video.

## 7. Confidence Monitor Screen
- **Visuals**: Small "Toast" notification in corner: 🎵 "Playing: Ambient Pad D".

## 8. Lower Thirds Screen
- **Visuals**: None.

## 9. Mobile Screen
- **Visuals**: **No Player Controls**.
- **Status**: Display-only info (Title, Time).

---

# Special Combinations & Interaction Logic

This section defines how the system handles collisions and combinations of multiple media types active simultaneously.

## 1. Song + Backing Track (Audio)
- **Scenario**: A user wants to play a specific MP3 backing track while displaying lyrics for "Amazing Grace".
- **Setup**: In Schedule, User edits Song item -> "Link Audio" -> Selects MP3.
- **Live Execution**:
    - User clicks **"Go Live"** on Verse 1 Slide.
    - **Action**:
        1. Visuals: Verse 1 Text appears on Main Screen.
        2. Audio: MP3 Backing Track starts playing on Main Audio Out.
    - User clicks **"Chorus"** Slide.
        1. Visuals: Change to Chorus.
        2. Audio: **Continues uninterrupted**.
    - User clicks **"Stop"** (Media Clear).
        1. Visuals: Fade to Black/Logo.
        2. Audio: **Fades out** (does not hard cut).

## 2. Presentation (Slide Deck) + Embedded Video
- **Scenario**: A PowerPoint-style deck with a video file as Slide 3.
- **Pre-Roll behavior**:
    - User is on Slide 2.
    - Confidence Monitor "Next" preview shows the Video Thumbnail + Duration.
- **Trigger**:
    - User clicks "Next".
    - **Main Screen**:
        - Text slides disappear.
        - Video Player Overlay appears (Top Z-Index).
        - Video Plays.
        - **System Audio**: Unmutes Video Channel. **Ducks** any Background Audio (Pad) by 50%.
- **Completion**:
    - Video finishes.
    - **Action**: Auto-advance to Slide 4 (or hold on black frame, configurable).
    - **Audio**: Background Pad fades back up to 100%.

## 3. Video (Content) vs. Lower Thirds
- **Rule**: **Content Exclusion**.
- **Logic**:
    - IF Main Screen == Video (Content) OR Video (YouTube) OR Presentation (Canva)
    - THEN Lower Thirds Output == **FORCE OFF/TRANSPARENT**.
- **Reasoning**: These media types occupy the full visual attention and likely the full frame. Overlaying a Lower Third (which usually replicates what's on Main) is redundant and messy over moving video.

## 4. Song + Image Background Override
- **Scenario**:
    - Global Song Background = "Nebula Loop" (Video).
    - Verse 2 has an **Override** set to a specific "Cross Image" (Static).
- **Transition Logic**:
    - V1 (Video) -> V2 (Image):
        - Video Layer: Pauses/Hides? No, usually keeps playing underneath but obscured.
        - Content Layer: Shows Image (Opaque).
        - Transition: Cross Dissolve.
    - V2 (Image) -> Chorus (Video):
        - Image Layer: Fades out.
        - Video Layer: revealed (still looping).

---

# 12. Data Models & Schemas

To ensure consistency, query performance, and future-proofing (including Cloud Sync), all media types share a common `BaseMediaItem` structure. The architecture treats the library as a **Distributed Document Store**.

## 1. Common Schema (BaseMediaItem)
All items inherit these fields.

### Core Identity
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique identifier (Immutable). |
| `type` | `String` | Enum: `SONG`, `SCRIPTURE`, `VIDEO`, `IMAGE`, `PRESENTATION`, `AUDIO`. |
| `title` | `String` | Primary display name. |
| `tags` | `Array<String>` | User-defined tags (e.g., "Worship", "Announcements"). |

### Sync & Versioning (Full History)
| Field | Type | Description |
| :--- | :--- | :--- |
| `version` | `Integer` | Incrementing counter. Represents the "Head" state. |
| `origin_device_id` | `UUID` | ID of the device that created the item. |
| `last_modified_device_id` | `UUID` | ID of the device that made the last edit. |
| `is_deleted` | `Boolean` | Soft Delete flag. |
| `content_hash` | `String` | SHA-256 hash of the content state (deduplication). |
| `history_head_id` | `UUID` | Pointer to the latest "Commit" in the history log (see below). |

### Analytics & Workflow
| Field | Type | Description |
| :--- | :--- | :--- |
| `created_at` | `DateTime` | ISO 8601 timestamp. |
| `updated_at` | `DateTime` | ISO 8601 timestamp. |
| `usage_count` | `Integer` | Auto-increment on "Go Live". |
| `last_used_at` | `DateTime` | For MRU sorting. |
| `author` | `String` | Name of the user who created it (e.g. "Jabez"). |
| `notes` | `String` | Private internal notes for the media team. |

---

## 2. History & Reversion Model
To support "Save Everything" and "Revert", the system implements an **Append-Only History Log** (conceptually similar to Git commits).

### History Entry Schema
Stored in a separate `history` collection/folder (`/library/history/[Item_UUID].jsonl`).

```json
{
  "commit_id": "UUID",
  "parent_commit_id": "UUID (Previous version)",
  "version_number": "Integer",
  "timestamp": "DateTime",
  "author": "String",
  "device_id": "UUID",
  "change_summary": "String (e.g. 'Changed Key from C to D')",
  "full_snapshot": "JSON (The complete state of the item at this point)"
}
```

### Revert Workflow
1.  **User Action**: Selects "History" tab in Item Properties.
2.  **Display**: List of versions: "v5 (Current) -> v4 (Jabez, yesterday) -> v3 (Admin, last week)".
3.  **Action**: User clicks "Restore v3".
4.  **System Process**:
    *   READ `full_snapshot` from v3 commit.
    *   CREATE new commit v6 (parent: v5).
    *   WRITE v3's data into Head but keep `version` as 6.
    *   Result: The item is reverted, but the history chain is preserved (forward-moving revert).

## 3. Type-Specific Metadata Schemas

### A. Song
```json
{
  "artist": "String",
  "copyright": "String",
  "ccli_number": "String",
  "key": "String",
  "original_key": "String (Reference only)",
  "tempo": "Integer (BPM)",
  "time_signature": "String",
  "themes": ["String (Semantics like 'Grace', 'Victory')"],
  "scripture_references": ["String (e.g. 'John 3:16')"],
  "language": "String (ISO code, e.g. 'en-US')",
  "default_background_id": "UUID",
  "parts": [
    {
      "id": "UUID",
      "type": "Enum(VERSE, CHORUS...)",
      "label": "String",
      "lyrics": "String (Markdown)",
      "background_override_id": "UUID (Optional)"
    }
  ],
  "arrangements": [
    {
      "id": "UUID",
      "name": "String",
      "is_default": "Boolean",
      "sequence": ["UUID (Part ID)", "UUID (Part ID)"] 
    }
  ]
}
```

### B. Scripture
```json
{
  "reference_title": "String",
  "book": "String",
  "chapter": "Integer",
  "verse_start": "Integer",
  "verse_end": "Integer",
  "translation_id": "String",
  "text_content": "String",
  "is_favorite": "Boolean (User bookmark)"
}
```

### C. Video (YouTube & Content)
```json
{
  "source_url": "String",
  "file_hash": "String (SHA-256 of the binary file, for smart syncing assets)",
  "file_size_bytes": "Integer",
  "duration_total": "Integer",
  "trim_start": "Integer",
  "trim_end": "Integer",
  "volume_multiplier": "Float",
  "is_loop": "Boolean",
  "thumbnail_path": "String"
}
```

### D. Image (Content & Background)
```json
{
  "source_url": "String",
  "file_hash": "String",
  "scaling_mode": "Enum(FIT, FILL, STRETCH)",
  "dominant_color": "String (Hex code, helpful for auto-text coloring)",
  "duration": "Integer"
}
```

### E. Presentation (Slide Deck)
```json
{
  "slides": [
    {
      "id": "UUID",
      "type": "Enum(TEXT, IMAGE, VIDEO)",
      "content": "HTML/JSON",
      "notes": "String",
      "media_source_id": "UUID"
    }
  ],
  "theme_id": "UUID"
}
```

### F. Presentation (Canva)
```json
{
  "video_source_id": "UUID",
  "original_canva_url": "String (For reopening the project in Canva)",
  "cues": [
    {
      "time_in": "Float",
      "time_hold": "Float",
      "time_out": "Float"
    }
  ]
}
```

### G. Audio
```json
{
  "source_url": "String",
  "file_hash": "String",
  "duration": "Integer",
  "artist": "String",
  "bpm": "Integer (Auto-detected)",
  "musical_key": "String (Auto-detected)",
  "waveform_data": "Array<Float>"
}
```

---

## 4. Database & Sync Strategy (Distributed)

*   **Document Store**: Each library item is a separate JSON Entry.
*   **Storage Partitioning**:
    *   **Hot Store** (`/library/db/`): Contains only the HEAD version of items (Fast read/write).
    *   **Cold Store** (`/library/history/`): Contains the append-only logs of changes (Large, rarely read unless auditing).
*   **Replication Strategy**:
    1.  **Peer-to-Peer Sync**: Devices sync the HEAD state first.
    2.  **History Sync**: Optimistic / On-Demand. History is only synced if a user specifically requests to "View History" or "Revert" on a secondary device, OR during a scheduled background "Deep Sync".
    3.  **Conflict Resolution**:
        *   Uses `version` + `content_hash` + `history_lines` to merge changes without data loss.
*   **Asset Sync**:
    *   Binary Assets are Content-Addressable (CAS).
    *   If v1 used `video_A.mp4` and v2 uses `video_B.mp4`, both files are kept in the CAS until a "Garbage Collection" routine runs (e.g. delete assets not referenced in any history commits older than 1 year).
