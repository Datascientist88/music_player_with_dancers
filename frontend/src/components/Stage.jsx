// src/components/Stage.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const PUBLIC = process.env.PUBLIC_URL || "";

const MODELS = {
  michelle: {
    url: `${PUBLIC}/models/Michelle.glb`,
    scale: 1.0,
    yOffset: 0,
    turn: 0,
    hasEmbeddedAnim: true,
  },
  tango: {
    url: `${PUBLIC}/models/readyplayer.me.glb`,
    scale: 1.0,
    yOffset: 0,
    turn: 0,
    hasEmbeddedAnim: false, // Mixamo -> RPM retargeting
    mixamoFBX: `${PUBLIC}/models/mixamo.fbx`,
  },
};

export default function Stage({ analyser, dancer = "michelle" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;

    // Scene (transparent—CSS background shows through)
    const scene = new THREE.Scene();

    // Camera — zoom in closer to the dancer
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 1.85, 3.25); // was ~4.8

    // Renderer (alpha)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearColor(0x000000, 0);
    // No shadows (prevents any shadow artifacts)
    renderer.shadowMap.enabled = false;

    container.appendChild(renderer.domElement);

    // IBL for reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(renderer), 0.04);
    scene.environment = envRT.texture;

    // Controls: tighter orbit, no underside
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.2;   // closer min
    controls.maxDistance = 5.5;   // tighter max
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minAzimuthAngle = -Math.PI / 3;
    controls.maxAzimuthAngle =  Math.PI / 3;
    controls.target.set(0, 1.05, 0);

    // Neutral studio lighting (slightly dim)
    const ambient = new THREE.AmbientLight(0xffffff, 0.22);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9fa8b3, 0.6);
    const key  = new THREE.DirectionalLight(0xffffff, 0.85);
    const fill = new THREE.DirectionalLight(0xffffff, 0.42);
    const rim  = new THREE.PointLight(0xffffff, 0.45, 16);
    key.position.set(4, 6, 5);
    fill.position.set(-5, 4.5, 2);
    rim.position.set(0, 2.6, -3.5);
    scene.add(ambient, hemi, key, fill, rim);

    // ---------- OFF-BLUE SHINY FLOOR (NO TRANSMISSION / NO GHOSTING) ----------
    const FLOOR_Y = -0.4;          // lowered so the CSS "wall" stays visible
    const FLOOR_SIZE = 140;
    const TILE_SEGMENTS = 40;

    const floorGeo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
    // Use MeshStandard/Physical WITHOUT transmission to avoid refractive duplicates
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#cfe3ff"), // off-blue tint
      metalness: 0.25,
      roughness: 0.12,                   // shiny, but not mirror
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.15,
      transparent: true,
      opacity: 0.78,                     // glassy feel without refraction
      depthWrite: true,
      premultipliedAlpha: true,
      // crucial: NO transmission => no "double legs" / glow ghosts
      transmission: 0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.renderOrder = -5;        // render under everything (prevents overdraw halos)
    scene.add(floor);

    // Tile grout lines
    const groutColor1 = 0xd0e2ff;
    const groutColor2 = 0x97b8ea;
    const tiles = new THREE.GridHelper(FLOOR_SIZE, TILE_SEGMENTS, groutColor1, groutColor2);
    tiles.material.transparent = true;
    tiles.material.opacity = 0.30;
    tiles.material.depthWrite = false;
    tiles.renderOrder = -4;        // below dancer
    tiles.position.y = FLOOR_Y + 0.001;
    scene.add(tiles);

    // Subtle sparkle overlay
    const edgeSparkle = new THREE.GridHelper(FLOOR_SIZE, TILE_SEGMENTS, 0xffffff, 0xffffff);
    edgeSparkle.material.transparent = true;
    edgeSparkle.material.opacity = 0.06;
    edgeSparkle.material.depthWrite = false;
    edgeSparkle.renderOrder = -3;  // below dancer
    edgeSparkle.position.y = FLOOR_Y + 0.0025;
    scene.add(edgeSparkle);

    // Glitter (cool icy-blue palette)
    const glitterGroup = new THREE.Group();
    glitterGroup.position.y = FLOOR_Y + 0.003;
    glitterGroup.renderOrder = -2; // below dancer
    scene.add(glitterGroup);

    const glitterLayers = []; // { mat, base, speed, phase }
    const makeGlitterLayer = (count, size, baseOpacity, speed, colorHex) => {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * FLOOR_SIZE;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * FLOOR_SIZE;
      }
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: colorHex,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity: baseOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geom, mat);
      glitterGroup.add(pts);
      glitterLayers.push({ mat, base: baseOpacity, speed, phase: Math.random() * Math.PI * 2 });
    };

    makeGlitterLayer(900, 0.042, 0.36, 0.9,  0xeaf4ff);
    makeGlitterLayer(650, 0.055, 0.28, 1.25, 0xcfe5ff);
    makeGlitterLayer(450, 0.070, 0.22, 1.7,  0xb9d8ff);

    // ---------- LOAD DANCER(S) ----------
    const loaderGLTF = new GLTFLoader();
    const loaderFBX = new FBXLoader();
    const mixers = [];
    const clock = new THREE.Clock();

    // Find first skinned mesh (for retargeting target)
    const findFirstSkinnedMesh = (root) => {
      let target = null;
      root.traverse((o) => { if (!target && o.isSkinnedMesh) target = o; });
      return target;
    };

    // Ensure dancers never cast/receive shadows (prevents any shadow-like halos)
    const disableShadows = (root) => {
      root.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.castShadow = false;
          o.receiveShadow = false;
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(m => m.dithering = true);
          }
        }
      });
    };

    const meta = MODELS[dancer] || MODELS.michelle;
    let disposed = false;

    const loadMichelle = () =>
      new Promise((resolve, reject) => {
        loaderGLTF.load(
          meta.url,
          (gltf) => {
            const root = gltf.scene || gltf.scenes[0];
            disableShadows(root);
            root.position.set(0, meta.yOffset, 0);
            root.rotation.y = meta.turn;
            root.scale.setScalar(meta.scale);
            scene.add(root);

            const mixer = new THREE.AnimationMixer(root);
            if (gltf.animations?.length) mixer.clipAction(gltf.animations[0]).play();
            mixers.push(mixer);
            resolve();
          },
          undefined,
          reject
        );
      });

    const loadTangoRetargeted = () =>
      new Promise((resolve, reject) => {
        Promise.all([
          new Promise((res, rej) => loaderFBX.load(meta.mixamoFBX, res, undefined, rej)),
          new Promise((res, rej) => loaderGLTF.load(meta.url, res, undefined, rej)),
        ])
          .then(([sourceModel, targetModel]) => {
            const sourceClip = sourceModel.animations?.[0];

            // build a skeleton from the FBX helper bones
            const helper = new THREE.SkeletonHelper(sourceModel);
            const sourceSkeleton = new THREE.Skeleton(helper.bones);
            const sourceMixer = new THREE.AnimationMixer(sourceModel);
            if (sourceClip) sourceMixer.clipAction(sourceClip).play();

            const targetRoot = targetModel.scene || targetModel.scenes?.[0];
            disableShadows(targetRoot);
            targetRoot.position.set(0, meta.yOffset, 0);
            targetRoot.rotation.y = meta.turn;
            targetRoot.scale.setScalar(meta.scale);
            scene.add(targetRoot);

            const targetSkin = findFirstSkinnedMesh(targetRoot);
            if (!targetSkin) { console.warn("No SkinnedMesh in readyplayer.me.glb"); resolve(); return; }

            const retargetOptions = {
              hip: "mixamorigHips",
              scale: 0.01, // Mixamo cm → meters
              getBoneName: (bone) => "mixamorig" + bone.name,
            };

            const retargetedClip = SkeletonUtils.retargetClip(
              targetSkin, sourceSkeleton, sourceClip, retargetOptions
            );
            const targetMixer = new THREE.AnimationMixer(targetSkin);
            targetMixer.clipAction(retargetedClip).play();

            mixers.push(sourceMixer, targetMixer);
            resolve();
          })
          .catch(reject);
      });

    const load = meta.hasEmbeddedAnim ? loadMichelle() : loadTangoRetargeted();

    // Subtle audio reactivity
    let smoothedEnergy = 0;
    const getEnergy = () => {
      if (!analyser) return 0;
      const len = analyser.frequencyBinCount;
      const data = new Uint8Array(len);
      analyser.getByteFrequencyData(data);
      let sum = 0; for (let i = 0; i < len; i++) sum += data[i];
      return sum / (len * 255);
    };

    load.then(() => {
      if (disposed) return;

      const tick = () => {
        const dt = clock.getDelta();
        const t = performance.now() * 0.001;

        // Animation speed breathes with energy
        const energy = getEnergy();
        smoothedEnergy += (energy - smoothedEnergy) * 0.08;
        mixers.forEach((m) => m.update(dt * (0.96 + smoothedEnergy * 0.4)));

        // Glitter flicker & micro drift
        glitterLayers.forEach((g) => {
          g.mat.opacity = g.base * (0.55 + 0.45 * Math.sin(t * g.speed + g.phase));
        });
        glitterGroup.rotation.y = Math.sin(t * 0.1) * 0.005;

        renderer.render(scene, camera);
        controls.update();
        if (!disposed) requestAnimationFrame(tick);
      };

      tick();
    });

    // Resize
    const onResize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement?.parentNode === container) container.removeChild(renderer.domElement);
      envRT.dispose(); pmrem.dispose();
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material?.dispose?.();
        }
      });
    };
  }, [analyser, dancer]);

  return <div ref={mountRef} className="stage-container" />;
}

