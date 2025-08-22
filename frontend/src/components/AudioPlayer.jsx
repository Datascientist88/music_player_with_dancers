// src/components/AudioStereoPlayer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/AudioPlayer.css";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Mousewheel, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

/* ======== Tracks & Covers (your imports) ======== */
import track1_url  from "../assets/music/track1.mp3";
import track2_url  from "../assets/music/track2.mp3";
import track3_url  from "../assets/music/track3.mp3";
import track4_url  from "../assets/music/track4.mp3";
import track5_url  from "../assets/music/track5.mp3";
import track6_url  from "../assets/music/track6.mp3";
import track7_url  from "../assets/music/track7.mp3";
import track8_url  from "../assets/music/track8.mp3";
import track9_url  from "../assets/music/track9.mp3";
import track10_url from "../assets/music/track10.mp3";
import track11_url from "../assets/music/track11.mp3";
import track12_url from "../assets/music/track12.mp3";
import track13_url from "../assets/music/track13.mp3";
import track14_url from "../assets/music/track14.mp3";
import track15_url from "../assets/music/track15.mp3";
import track17_url from "../assets/music/track17.mp3";
import track18_url from "../assets/music/track18.mp3";
import track19_url from "../assets/music/track19.mp3";
import track20_url from "../assets/music/track20.mp3";

import cover1_img  from "../assets/images/cover1.jpg";
import cover2_img  from "../assets/images/cover2.jpg";
import cover3_img  from "../assets/images/cover3.jpg";
import cover4_img  from "../assets/images/cover4.jpg";
import cover5_img  from "../assets/images/cover5.jpg";
import cover6_img  from "../assets/images/cover6.jpg";
import cover7_img  from "../assets/images/cover7.jpg";
import cover8_img  from "../assets/images/cover8.jpg";
import cover9_img  from "../assets/images/cover9.jpg";
import cover10_img from "../assets/images/cover10.jpg";
import cover11_img from "../assets/images/cover11.jpg";
import cover12_img from "../assets/images/cover12.jpg";
import cover13_img from "../assets/images/cover13.jpg";
import cover14_img from "../assets/images/cover14.jpg";
import cover15_img from "../assets/images/cover15.jpg";
import cover18_img from "../assets/images/cover18.jpg";

const TRACKS = [
  { title: "كتير بنعشق",          artist: "شرين عبد الوهاب",         url: track1_url,  cover: cover1_img  },
  { title: "مشاعر",                artist: "شرين عبد الوهاب",         url: track2_url,  cover: cover2_img  },
  { title: "مين دا اللي نسيك",    artist: "نانسي عجرم",               url: track3_url,  cover: cover3_img  },
  { title: "بحبك وحشتني",          artist: "حسين الجسمي",               url: track4_url,  cover: cover4_img  },
  { title: "غريبة الناس",          artist: "وائل جسار",                 url: track18_url, cover: cover18_img },
  { title: "بيت حبيبي",            artist: "يارا",                      url: track5_url,  cover: cover5_img  },
  { title: "ساعات",                artist: "أليسا",                     url: track6_url,  cover: cover6_img  },
  { title: "بحك مش حقول تاني",     artist: "وائل جسار",                 url: track13_url, cover: cover13_img },
  { title: "بامارة مين",           artist: "احمد فريد",                 url: track7_url,  cover: cover7_img  },
  { title: "كلمات",                artist: "ماجدة الرومي",              url: track8_url,  cover: cover8_img  },
  { title: "بكلمة منك",            artist: "شرين عبد الوهاب",         url: track20_url, cover: cover2_img  },
  { title: "خليني ذكرى",           artist: "وائل جسار",                 url: track9_url,  cover: cover9_img  },
  { title: "لو كان بخاطري",        artist: "امال ماهر | راشد الماجد",  url: track10_url, cover: cover10_img },
  { title: "خذني معك",             artist: "فضل شاكر",                  url: track11_url, cover: cover11_img },
  { title: "موجوع",                artist: "وائل جسار",                 url: track12_url, cover: cover12_img },
  { title: "معقول",                artist: "فضل شاكر",                  url: track14_url, cover: cover14_img },
  { title: "على بالي",             artist: "شرين عبد الوهاب",         url: track15_url, cover: cover15_img },
  { title: "حبيبي بالبونت العريض", artist: "حسين الجسمي",               url: track17_url, cover: cover4_img  },
  { title: "بتمون",                artist: "أليسا",                     url: track19_url, cover: cover6_img  },
];

export default function AudioStereoPlayer({ onAnalyserReady }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const swiperRef = useRef(null);
  const playlistRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);        // 0..1 UI state
  const [error, setError] = useState(null);

  const currentTrack = useMemo(() => TRACKS[currentIndex], [currentIndex]);

  // WebAudio graph (built once)
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);                      // <— iOS volume works via GainNode

  // Visualizer
  const animRef = useRef(null);
  const ctxRef = useRef(null);
  const gradientRef = useRef(null);

  // When true, the next src change will auto-play
  const pendingAutoplayRef = useRef(false);

  // Prevent OrbitControls from stealing events
  const stopOrbit = (e) => { e.stopPropagation(); };
  const uiStopperProps = {
    onPointerDown: stopOrbit,
    onPointerUp: stopOrbit,
    onPointerMove: stopOrbit,
    onWheel: stopOrbit,
    onTouchStart: stopOrbit,
    onTouchMove: stopOrbit,
  };

  /* ===== Visualizer ===== */
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, "rgba(255, 25, 255, 0.2)");
    grad.addColorStop(0.5, "rgba(25, 255, 255, 0.75)");
    grad.addColorStop(1, "rgba(255, 255, 25, 0.2)");
    ctxRef.current = ctx;
    gradientRef.current = grad;
  };

  const startVisualizer = () => {
    cancelAnimationFrame(animRef.current);
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const grad = gradientRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !ctx || !grad || !analyser) return;

    const base = canvas.height / 2;
    const maxAmp = canvas.height / 3.5;
    const waves = 10;
    let t = 0;

    const animate = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.05;

      for (let j = 0; j < waves; j++) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = grad;

        let x = 0;
        const dx = canvas.width / data.length;
        let px = 0;
        let py = base;

        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const mid = data.length / 2;
          const dist = Math.abs(i - mid) / mid;
          const bell = 1 - Math.pow((2 * i) / data.length - 1, 2);
          const amp = maxAmp * bell * (1 - dist);
          const invert = j % 2 ? 1 : -1;
          const freq = invert * (0.05 + 0.25);
          const y = base + Math.sin(i * freq + t + j) * amp * v;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const xc = (x + px) / 2;
            const yc = (y + py) / 2;
            ctx.quadraticCurveTo(px, py, xc, yc);
          }

          px = x; py = y; x += dx;
        }

        ctx.lineTo(canvas.width, py);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  };

  /* ===== Build audio graph once ===== */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const ensureGraph = async () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;

        if (!sourceRef.current) {
          sourceRef.current = audioCtx.createMediaElementSource(el);
        }
        if (!gainRef.current) {
          const gain = audioCtx.createGain();
          gain.gain.value = volume;                 // initial volume
          gainRef.current = gain;
        }
        if (!analyserRef.current) {
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
        }

        // Connect: el -> source -> gain -> analyser -> destination
        // Guard against duplicate connections
        try { sourceRef.current.disconnect(); } catch {}
        try { gainRef.current.disconnect(); } catch {}
        try { analyserRef.current.disconnect(); } catch {}

        sourceRef.current.connect(gainRef.current);
        gainRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtx.destination);

        onAnalyserReady?.(analyserRef.current);
        initCanvas();
      } catch (e) {
        console.error(e);
        setError("Audio init error.");
      }
    };

    ensureGraph();

    const onErr = () => setError("Audio source not supported or not found.");
    const onEnded = () => {
      pendingAutoplayRef.current = true;
      setCurrentIndex((i) => (i + 1) % TRACKS.length);
    };

    el.addEventListener("error", onErr);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("error", onErr);
      el.removeEventListener("ended", onEnded);
      cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== Change track: swap src and force autoplay (mobile-safe) ===== */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setError(null);

    const resumeCtx = async () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      try { await audioCtxRef.current.resume(); } catch {}
    };

    const tryImmediatePlay = async () => {
      if (!pendingAutoplayRef.current) return false;
      try {
        await resumeCtx();
        await el.play();
        setIsPlaying(true);
        startVisualizer();
        pendingAutoplayRef.current = false;
        return true;
      } catch {
        return false;
      }
    };

    el.src = currentTrack.url;
    el.load();

    tryImmediatePlay();

    const doAutoplay = async () => {
      if (!pendingAutoplayRef.current) return;
      try {
        await resumeCtx();
        await el.play();
        setIsPlaying(true);
        startVisualizer();
        pendingAutoplayRef.current = false;
      } catch {
        setError("Tap play to continue (mobile autoplay).");
      }
    };

    const onLoadedData = () => doAutoplay();
    const onCanPlay = () => doAutoplay();
    const onCanPlayThrough = () => doAutoplay();

    el.addEventListener("loadeddata", onLoadedData, { once: true });
    el.addEventListener("canplay", onCanPlay, { once: true });
    el.addEventListener("canplaythrough", onCanPlayThrough, { once: true });

    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(currentIndex);
    }

    return () => {
      el.removeEventListener("loadeddata", onLoadedData);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("canplaythrough", onCanPlayThrough);
    };
  }, [currentIndex, currentTrack]);

  /* ===== Volume control (iOS-friendly) =====
     Use GainNode for actual volume; also set HTML volume for non-iOS browsers. */
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume; // has no effect on iOS, fine elsewhere
    if (gainRef.current) {
      // smooth ramp to avoid clicks
      const now = audioCtxRef.current?.currentTime ?? 0;
      try {
        const g = gainRef.current.gain;
        g.cancelScheduledValues(now);
        g.setTargetAtTime(Math.max(0, Math.min(1, volume)), now, 0.005);
      } catch {
        gainRef.current.gain.value = Math.max(0, Math.min(1, volume));
      }
    }
  }, [volume]);

  /* Keep active playlist item visible */
  useEffect(() => {
    if (playlistRef.current) {
      const active = playlistRef.current.querySelector(".active-playlist-item");
      if (active) {
        const c = playlistRef.current;
        const margin = 20;
        const nextTop = active.offsetTop - margin;
        c.scrollTop = nextTop >= 0 ? nextTop : 0;
      }
    }
  }, [currentIndex]);

  const resumeCtx = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    try { await audioCtxRef.current.resume(); } catch {}
  };

  const handlePlayPause = async () => {
    const el = audioRef.current;
    if (!el) return;
    await resumeCtx();
    if (el.paused) {
      el.play().then(() => { setIsPlaying(true); startVisualizer(); })
               .catch(() => setError("Playback blocked — tap to allow audio."));
    } else {
      el.pause(); setIsPlaying(false);
    }
  };

  // Always request autoplay on index change
  const playIndex = (i) => {
    pendingAutoplayRef.current = true;
    setCurrentIndex(((i % TRACKS.length) + TRACKS.length) % TRACKS.length);
  };
  const handlePrev = () => playIndex(currentIndex - 1);
  const handleNext = () => playIndex(currentIndex + 1);

  const seek = (sec) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime + sec);
  };

  return (
    <>
      {/* Mini player (small on mobile) */}
      <div className="audio-player-square stereo" {...uiStopperProps} style={{ touchAction: "manipulation" }}>
        <div className="ap-header">
          <div className="ap-title">
            <div className="ap-now">Now Playing</div>
            <div className="ap-trackline">
              <span className="ap-artist">{currentTrack.artist}</span>
              <span className="ap-sep"> • </span>
              <span className="ap-titletext">{currentTrack.title}</span>
            </div>
          </div>
          {error && <div className="ap-error">{error}</div>}
        </div>

        <canvas ref={canvasRef} width={360} height={140} className="ap-canvas" />

        <div className="ap-controls-row">
          <button className="ap-btn" title="Prev" onClick={handlePrev}>⏮</button>
          <button className="ap-btn big" onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="ap-btn" title="Next" onClick={handleNext}>⏭</button>
        </div>

        <div className="ap-seek-row">
          <button className="ap-btn small" onClick={() => seek(-10)} title="Rewind 10s">−10s</button>
          <input
            className="ap-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ "--vol": volume }}
            title="Volume"
          />
          <button className="ap-btn small" onClick={() => seek(10)} title="Forward 10s">+10s</button>
        </div>

        {/* playsInline is important for iOS; preload=auto helps quick swaps */}
        <audio ref={audioRef} preload="auto" playsInline />
      </div>

      {/* Cards — swipe to change & autoplay */}
      <section className="cards-below-selector left" {...uiStopperProps} style={{ touchAction: "pan-y" }}>
        <div className="cards-wrap">
          <Swiper
            ref={swiperRef}
            className="swiper"
            effect={"cards"}
            grabCursor
            modules={[EffectCards, Mousewheel, Pagination]}
            initialSlide={0}
            mousewheel={{ invert: false }}
            onSlideChange={(sw) => playIndex(sw.realIndex)}
            cardsEffect={{ perSlideOffset: 8, perSlideRotate: 3 }}
          >
            {TRACKS.map((t, idx) => (
              <SwiperSlide key={idx}>
                <div className="card-slide" draggable="false">
                  <img src={t.cover} alt={t.title} draggable="false" />
                  <div className="card-meta">
                    <div className="artist">{t.artist}</div>
                    <div className="title">{t.title}</div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Right-side glass playlist (scroll & click even while playing) */}
      <aside
        className="playlist-right"
        {...uiStopperProps}
        style={{ zIndex: 1005, touchAction: "pan-y" }}
      >
        <div className="playlist-scroller" ref={playlistRef} {...uiStopperProps}>
          {TRACKS.map((t, idx) => (
            <div
              key={idx}
              className={`playlist-item ${idx === currentIndex ? "active-playlist-item" : ""}`}
              onClick={() => playIndex(idx)}
            >
              <img src={t.cover} alt={t.title} draggable="false" />
              <div className="song">
                <p className="artist">{t.artist}</p>
                <p className="title">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

