# Ready Player Music — 3D Dancers + Glassmorphic Stereo Player (WebGL)

A React (JS) app that blends a **Three.js** WebGL 3D stage (Michelle / ReadyPlayerMe dancers with animation retargeting) with a **glassmorphic stereo audio player**, a **card stack** (Swiper “Effect Cards”) and a **transparent playlist**.
Optimized for desktop; on mobile the player remains, while the cards & list are hidden for a clean stage.

---

## ✨ Features

* **WebGL only** (no WebGPU) with modern, neutral studio lighting.
* **Dancer switcher**:

  * **Michelle** (disco) – GLB with embedded animation.
  * **ReadyPlayerMe** (tango) – animation retargeted from Mixamo FBX → RPM rig.
* **Orbit controls with constraints** (no full flip; can’t dive under floor).
* **Shiny off-blue glass tiles** + subtle glitter & grout lines.
* **Glassmorphic stereo player**:

  * Wave **visualizer** (magenta → cyan → yellow gradient).
  * Prev / Play-Pause / Next, seek ±10s, volume with filled glass track.
  * **Card stack** of covers (top-left under dancer selector), **transparent playlist** (right).
* **Responsive**:

  * Desktop/tablet: cards + playlist visible.
  * **Mobile**: cards & playlist hidden, compact player only.
* Assets loaded from `/public` (models) and `/src/assets` (music/images).

---

## 📁 Project Structure (key files)

```
/public
  └─ models/
       Michelle.glb
       readyplayer.me.glb
       mixamo.fbx

/src
  ├─ components/
  │    App.jsx
  │    Stage.jsx            ← 3D scene (WebGL, lighting, dancers)
  │    AudioPlayer.jsx      ← glass player + visualizer + cards + playlist
  ├─ assets/
  │   ├─ music/             ← track1.mp3 ... track20.mp3 (you can add more)
  │   └─ images/            ← cover1.jpg ... coverN.jpg
  ├─ styles/
  │   App.css               ← layout, top controls, fixed player positioning
  │   AudioPlayer.css       ← player, cards, playlist styling (glassmorphic)
  └─ main.jsx / index.js
```

> The code references `process.env.PUBLIC_URL || ""` for public paths, so it works in CRA and Vite (base `/`). Keep models under `/public/models`.

---

## 🧰 Prerequisites

* **Node.js 18+** recommended
* A modern desktop browser (Chrome/Edge/Firefox/Safari)

---

## 🚀 Setup & Run

1. **Install**

   ```bash
   npm install
   ```

2. **Start dev server**

   * If the template is **Vite**:

     ```bash
     npm run dev
     ```
   * If the template is **Create React App**:

     ```bash
     npm start
     ```

3. Open the printed local URL (e.g., `http://localhost:5173` for Vite or `http://localhost:3000` for CRA).

4. **Build for production**

   ```bash
   npm run build
   ```

---

## 🎵 Add/Replace Music & Covers

* Put audio files in: `src/assets/music/`
* Put cover images in: `src/assets/images/`
* Update/extend the `TRACKS` array in **`AudioPlayer.jsx`**:

  ```js
  { title: "Song", artist: "Artist", url: trackX_url, cover: coverX_img }
  ```
* Supported formats: `mp3` is typical; modern browsers also support `ogg`, `m4a` depending on codecs.

> **Autoplay note**: Browsers require a user interaction before audio starts. Click Play once; then Next/Prev will work seamlessly.

---

## 🕺 Add/Replace Dancers

* Place GLB/FBX files in `/public/models/`
* Update paths in **`Stage.jsx`** → `MODELS`:

  ```js
  michelle: { url: `${PUBLIC}/models/Michelle.glb`, ... }
  tango:    { url: `${PUBLIC}/models/readyplayer.me.glb`, mixamoFBX: `${PUBLIC}/models/mixamo.fbx` }
  ```
* **Michelle** uses embedded animation; **ReadyPlayerMe** retargets a Mixamo FBX clip to RPM rig via `SkeletonUtils.retargetClip`.

---

## 🎚 Controls

* **Top-left** segmented buttons: switch dancer (Michelle / ReadyPlayerMe).
* **Orbit**: drag to rotate; wheel to zoom (limited); pan disabled.
* **Player**:

  * ⏮ Prev • ⏯ Play/Pause • ⏭ Next
  * −10s / +10s seek
  * Volume slider (glass filled track)
* **Cards**: scroll/drag (Swiper Effect Cards). Clicking a card changes the track.
* **Playlist**: click an item to play.

---

## 🛠 Troubleshooting

**“The element has no supported sources.”**

* The audio file path is wrong or not bundled. Ensure imports like:

  ```js
  import track1_url from "../assets/music/track1.mp3";
  ```
* If you added new files, restart the dev server so the bundler picks them up.

**No sound until I click**

* This is normal due to **autoplay policies**. Click the Play button once to unlock audio.

**Models won’t load / CORS**

* Keep models under `/public/models` to serve from same origin. Don’t load cross-origin without proper CORS headers.

**Glowing/ghost feet**

* Fixed in `Stage.jsx` by removing transmission/refraction on the floor and rendering floor/grid/glitter **below** the dancer.

**Rotation looks weird**

* OrbitControls are constrained (no underside/flip). Adjust `minPolarAngle`, `maxPolarAngle`, distances in `Stage.jsx` if needed.

---

## ⚙️ Implementation Notes

* **WebGLRenderer** only (no WebGPU).
* **Lighting**: ambient + hemisphere + key/fill + rim for natural studio feel (not green).
* **Floor**: off-blue glossy physical material (no transmission to avoid ghosting).
* **Visualizer**: Canvas2D with smooth multi-wave lines; colors: magenta → cyan → yellow.
* **Responsive**:

  * Desktop: Cards under selector (top-left), playlist on right, player bottom-left.
  * Mobile ≤ 768px: **cards & playlist hidden**; compact player stays visible.

---

## 🙏 Credits

* [Three.js](https://threejs.org/)
* [Mixamo](https://www.mixamo.com/) (source animations)
* [Ready Player Me](https://readyplayer.me/) (avatar rig/target)
* [Swiper](https://swiperjs.com/) (Effect Cards)
* Brick wall background pattern from \[transparenttextures.com] (please self-host in production).

---

## 📄 License

This project is provided as-is for demonstration/educational purposes.
You are responsible for the licenses of **music files**, **images**, and **3D models** you add.

---

## 💡 Tips

* For production, **self-host textures** (don’t hotlink).
* Compress GLBs with `gltfpack`/`draco` for faster loads.
* Keep music filenames lowercase and without spaces to avoid path issues.
* If you change the site base path, ensure `PUBLIC_URL` (CRA) or `base` (Vite) resolves so `/public/models/...` still loads.

Enjoy the show! 🎶🕺💃

