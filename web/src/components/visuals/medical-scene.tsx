"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type ScenePalette = {
  primary: string;
  ghost: string;
  background: string;
  surface: string;
  graphite: string;
  lead: string;
  starlight: string;
  silver: string;
  isLight: boolean;
};

function readScenePalette(): ScenePalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  const isLight = document.documentElement.dataset.theme === "light";

  return {
    primary: token("--color-mercury-blue", isLight ? "#4257d8" : "#5266eb"),
    ghost: token("--color-ghost-blue", isLight ? "#5266eb" : "#cdddff"),
    background: token("--color-deep-space", isLight ? "#f6f8ff" : "#171721"),
    surface: token("--color-midnight-slate", isLight ? "#ffffff" : "#1e1e2a"),
    graphite: token("--color-graphite", isLight ? "#eef2ff" : "#272735"),
    lead: token("--color-lead", isLight ? "#aab3c6" : "#70707d"),
    starlight: token("--color-starlight", isLight ? "#111827" : "#ededf3"),
    silver: token("--color-silver", isLight ? "#5f687a" : "#c3c3cc"),
    isLight
  };
}

function material(color: string, emissive = color, intensity = 0.1, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0.14,
    transparent: opacity < 1,
    opacity
  });
}

function glassMaterial(palette: ScenePalette, opacity = 0.34) {
  return new THREE.MeshPhysicalMaterial({
    color: palette.surface,
    emissive: palette.primary,
    emissiveIntensity: palette.isLight ? 0.035 : 0.08,
    roughness: 0.18,
    metalness: 0.18,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}

export function MedicalScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [paused, setPaused] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const handleThemeChange = () => setThemeVersion((version) => version + 1);
    window.addEventListener("medisense-theme-change", handleThemeChange);
    return () => window.removeEventListener("medisense-theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const palette = readScenePalette();
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color(palette.background), palette.isLight ? 6.1 : 5.8, 12);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.7, 6.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = palette.isLight ? 1.02 : 1.12;
    renderer.setClearColor(new THREE.Color(palette.background), palette.isLight ? 0.24 : 0.12);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(new THREE.Color(palette.ghost), palette.isLight ? 0.92 : 0.68));
    const keyLight = new THREE.DirectionalLight(new THREE.Color(palette.starlight), palette.isLight ? 1.4 : 1.8);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);
    const blueLight = new THREE.PointLight(new THREE.Color(palette.primary), palette.isLight ? 1.45 : 2.2);
    blueLight.position.set(-3, 2, 3);
    scene.add(blueLight);
    const ghostLight = new THREE.PointLight(new THREE.Color(palette.ghost), palette.isLight ? 0.72 : 0.9);
    ghostLight.position.set(3, -1, 2);
    scene.add(ghostLight);

    const rig = new THREE.Group();
    scene.add(rig);

    const grid = new THREE.GridHelper(5.8, 22, palette.primary, palette.lead);
    grid.position.set(0, -1.47, -0.3);
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((entry) => {
      entry.transparent = true;
      entry.opacity = palette.isLight ? 0.24 : 0.32;
    });
    rig.add(grid);

    const diagnosticPanels = createDiagnosticPanels(palette);
    rig.add(diagnosticPanels);

    const neuralWeb = createNeuralWeb(palette);
    rig.add(neuralWeb);

    const scanBeam = createScanBeam(palette);
    rig.add(scanBeam);

    const doctor = createDoctor(palette);
    doctor.position.set(0, -0.05, 0);
    const coreRings = createCoreRings(palette);
    coreRings.position.set(0, -0.14, 0.05);
    doctor.add(coreRings);
    rig.add(doctor);

    const dna = createDna(palette);
    dna.position.set(-2.25, 0.15, -0.55);
    rig.add(dna);

    const scanner = createScanner(palette);
    scanner.position.set(2.12, 0.12, -0.45);
    rig.add(scanner);

    const particles = createParticles(palette);
    rig.add(particles);

    const nodes = [
      createMetricNode(palette.primary, [-1.2, 1.22, 0.42]),
      createMetricNode(palette.ghost, [1.2, 1.08, 0.36]),
      createMetricNode(palette.lead, [0, -1.14, 0.72])
    ];
    nodes.forEach((node) => rig.add(node));

    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5
      };
    };
    const resetPointer = () => {
      pointerRef.current = { x: 0, y: 0 };
    };
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerleave", resetPointer);

    const clock = new THREE.Clock();
    let animationId = 0;
    const render = () => {
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();
      const shouldPause = pausedRef.current || document.hidden || !isVisibleRef.current;

      if (!shouldPause) {
        const pointer = pointerRef.current;
        rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, Math.sin(t * 0.45) * 0.1 + pointer.x * 0.18, 0.06);
        rig.rotation.x = THREE.MathUtils.lerp(rig.rotation.x, pointer.y * 0.08, 0.05);
        rig.position.y = THREE.MathUtils.lerp(rig.position.y, Math.sin(t * 1.1) * 0.035, 0.06);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.2, 0.045);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.7 - pointer.y * 0.12, 0.045);
        camera.lookAt(0, 0, 0);

        doctor.rotation.y = THREE.MathUtils.lerp(doctor.rotation.y, Math.sin(t * 0.8) * 0.08, 0.08);
        coreRings.rotation.y += delta * 0.5;
        coreRings.rotation.z -= delta * 0.28;
        dna.rotation.y += delta * 0.6;
        scanner.rotation.y += delta * 0.55;
        scanner.rotation.x = Math.sin(t * 0.6) * 0.18;
        particles.rotation.y += delta * 0.08;
        neuralWeb.rotation.y -= delta * 0.06;
        scanBeam.position.x = Math.sin(t * 0.9) * 2.55;
        const beamMaterial = scanBeam.material as THREE.MeshBasicMaterial;
        beamMaterial.opacity = (palette.isLight ? 0.08 : 0.12) + Math.max(0, Math.sin(t * 1.8)) * 0.12;

        diagnosticPanels.children.forEach((panel, index) => {
          panel.position.y = panel.userData.baseY + Math.sin(t * 1.25 + index * 0.8) * 0.035;
          panel.rotation.z = panel.userData.baseRotationZ + Math.sin(t * 0.75 + index) * 0.018;
        });
        nodes.forEach((node, index) => {
          node.position.y += Math.sin(t * 1.5 + index) * 0.0008;
        });
        renderer.render(scene, camera);
      }

      animationId = window.requestAnimationFrame(render);
    };
    render();

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(mount);

    const observer = new IntersectionObserver((entries) => {
      isVisibleRef.current = Boolean(entries[0]?.isIntersecting);
    }, { threshold: 0.1 });
    observer.observe(mount);

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      observer.disconnect();
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerleave", resetPointer);
      scene.traverse((object) => {
        const renderable = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        renderable.geometry?.dispose();
        const itemMaterial = renderable.material;
        if (Array.isArray(itemMaterial)) itemMaterial.forEach((entry) => entry.dispose());
        else itemMaterial?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [themeVersion]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  return (
    <div className="relative h-full min-h-[620px] w-full overflow-hidden font-sans font-light text-starlight">
      <div ref={mountRef} className="h-full w-full" aria-hidden="true" />
      <div className="pointer-events-auto absolute right-6 top-6 flex items-center gap-3 md:right-10">
        <button aria-pressed={paused} onClick={() => setPaused((value) => !value)} className="rounded-pill border border-ghost-blue/20 bg-ghost-blue/10 px-4 py-2 text-sm font-medium text-starlight backdrop-blur-xl hover:bg-ghost-blue/16">
          {paused ? "Play" : "Pause"}
        </button>
      </div>
      <div className="pointer-events-none absolute inset-x-5 top-5 md:inset-x-10">
        <svg className="h-16 w-full text-ghost-blue/40" viewBox="0 0 720 80" aria-hidden="true">
          <path className="heartbeat-line" d="M0 44 H135 L153 44 L168 18 L190 68 L212 30 L230 44 H720" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function createDoctor(palette: ScenePalette) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.82, 8, 16), material(palette.starlight, palette.ghost, 0.08));
  body.position.set(0, -0.8, 0);
  body.scale.set(0.72, 1.12, 0.38);
  group.add(body);

  const coatLine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.035), material(palette.lead, palette.ghost, 0.08));
  coatLine.position.set(0, -0.58, 0.42);
  coatLine.rotation.z = Math.PI / 4;
  group.add(coatLine);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 20), material(palette.silver, palette.ghost, 0.03));
  head.position.set(0, 0.35, 0);
  group.add(head);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 20), material(palette.starlight, palette.primary, 0.18, 0.72));
  visor.position.set(0, 0.13, 0.04);
  visor.scale.set(0.82, 0.28, 0.44);
  group.add(visor);

  const eyeMaterial = material(palette.background, palette.primary, 0.45);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), eyeMaterial);
  leftEye.position.set(-0.14, 0.42, 0.39);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), eyeMaterial.clone());
  rightEye.position.set(0.14, 0.42, 0.39);
  group.add(leftEye, rightEye);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.012, 8, 36), material(palette.primary, palette.primary, 0.6));
  halo.position.set(0, 0.49, 0.42);
  group.add(halo);

  const stethoscope = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.014, 8, 36), material(palette.ghost, palette.primary, 0.32));
  stethoscope.position.set(0, -0.3, 0.49);
  stethoscope.rotation.x = Math.PI / 2;
  group.add(stethoscope);

  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), material(palette.primary, palette.primary, 0.62));
  sensor.position.set(0.34, -0.05, 0.45);
  group.add(sensor);

  return group;
}

function createCoreRings(palette: ScenePalette) {
  const group = new THREE.Group();
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.006, 8, 72), material(palette.primary, palette.primary, 0.42, 0.86));
  ringA.rotation.x = Math.PI / 2;
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.005, 8, 72), material(palette.ghost, palette.primary, 0.2, 0.68));
  ringB.rotation.set(Math.PI / 2.7, 0, Math.PI / 6);
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.004, 8, 72), material(palette.lead, palette.primary, 0.14, 0.5));
  ringC.rotation.set(Math.PI / 2.3, Math.PI / 5, 0);
  group.add(ringA, ringB, ringC);
  return group;
}

function createDna(palette: ScenePalette) {
  const group = new THREE.Group();
  const sphereGeometry = new THREE.SphereGeometry(0.055, 10, 10);
  const connectorGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.08, 8);
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: palette.lead, transparent: true, opacity: palette.isLight ? 0.5 : 0.72 });

  for (let index = 0; index < 20; index += 1) {
    const y = (index - 15.5) * 0.13;
    const angle = index * 0.58;
    const leftSphere = new THREE.Mesh(sphereGeometry.clone(), material(index % 2 ? palette.primary : palette.ghost, index % 2 ? palette.primary : palette.ghost, 0.26));
    leftSphere.position.set(Math.cos(angle) * 0.55, y, Math.sin(angle) * 0.55);
    group.add(leftSphere);
    const rightSphere = new THREE.Mesh(sphereGeometry.clone(), material(index % 2 ? palette.lead : palette.starlight, index % 2 ? palette.lead : palette.starlight, 0.18));
    rightSphere.position.set(Math.cos(angle + Math.PI) * 0.55, y, Math.sin(angle + Math.PI) * 0.55);
    group.add(rightSphere);
    const connector = new THREE.Mesh(connectorGeometry.clone(), connectorMaterial.clone());
    connector.position.set(0, y, 0);
    connector.rotation.set(Math.PI / 2, 0, angle + Math.PI / 2);
    group.add(connector);
  }

  return group;
}

function createScanner(palette: ScenePalette) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 2), material(palette.graphite, palette.ghost, 0.16));
  group.add(core);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.012, 12, 72), material(palette.primary, palette.primary, 0.58));
  ringA.rotation.x = Math.PI / 2.2;
  group.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.01, 12, 72), material(palette.ghost, palette.primary, 0.28));
  ringB.rotation.set(0.4, Math.PI / 2, 0);
  group.add(ringB);
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.008, 12, 72), material(palette.lead, palette.primary, 0.22));
  ringC.rotation.set(0, 0.4, Math.PI / 2);
  group.add(ringC);
  return group;
}

function createDiagnosticPanels(palette: ScenePalette) {
  const group = new THREE.Group();
  const panelGeometry = new THREE.BoxGeometry(1.18, 0.68, 0.024);
  const positions = [
    [-1.85, 0.92, 0.18, -0.32, 0.28],
    [1.74, 0.82, 0.08, 0.32, -0.24],
    [-1.45, -0.78, 0.36, -0.16, -0.18],
    [1.34, -0.9, 0.32, 0.14, 0.2]
  ];

  positions.forEach(([x, y, z, rotationY, rotationZ], panelIndex) => {
    const panel = new THREE.Group();
    panel.position.set(x, y, z);
    panel.rotation.y = rotationY;
    panel.rotation.z = rotationZ;
    panel.userData.baseY = y;
    panel.userData.baseRotationZ = rotationZ;

    const shell = new THREE.Mesh(panelGeometry.clone(), glassMaterial(palette, palette.isLight ? 0.38 : 0.34));
    panel.add(shell);

    const label = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.018), material(palette.primary, palette.primary, 0.42));
    label.position.set(-0.38, 0.22, 0.032);
    panel.add(label);

    [0.72, 0.5, 0.62].forEach((width, barIndex) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.038, 0.014), material(barIndex === panelIndex % 3 ? palette.primary : palette.ghost, palette.primary, 0.18, 0.86));
      bar.position.set(-0.05, 0.08 - barIndex * 0.15, 0.035);
      panel.add(bar);
    });

    group.add(panel);
  });

  return group;
}

function createNeuralWeb(palette: ScenePalette) {
  const group = new THREE.Group();
  const nodeCount = 18;
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < nodeCount; index += 1) {
    const angle = index * 1.76;
    const radius = 2.1 + Math.sin(index * 0.91) * 0.34;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(index * 1.2) * 1.1, Math.sin(angle) * 1.15 - 0.45));
  }

  const linePositions: number[] = [];
  points.forEach((point, index) => {
    [3, 7].forEach((offset) => {
      const target = points[(index + offset) % points.length];
      linePositions.push(point.x, point.y, point.z, target.x, target.y, target.z);
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: palette.ghost,
      transparent: true,
      opacity: palette.isLight ? 0.18 : 0.22,
      depthWrite: false
    })
  );
  group.add(lines);

  const nodeGeometry = new THREE.SphereGeometry(0.034, 8, 8);
  points.forEach((point, index) => {
    const node = new THREE.Mesh(nodeGeometry.clone(), material(index % 4 === 0 ? palette.primary : palette.ghost, palette.primary, 0.32, 0.78));
    node.position.copy(point);
    group.add(node);
  });

  return group;
}

function createScanBeam(palette: ScenePalette) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 3.35),
    new THREE.MeshBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: palette.isLight ? 0.08 : 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  mesh.position.set(-2.4, 0, 0.58);
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function createMetricNode(color: string, position: number[]) {
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), material(color, color, 0.58));
  node.position.set(position[0], position[1], position[2]);
  return node;
}

function createParticles(palette: ScenePalette) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(90 * 3);
  for (let index = 0; index < 90; index += 1) {
    const seed = index * 12.9898;
    positions[index * 3] = (Math.sin(seed) - 0.5) * 6.2;
    positions[index * 3 + 1] = (Math.sin(seed * 1.7) - 0.5) * 3.25;
    positions[index * 3 + 2] = (Math.cos(seed * 1.3) - 0.5) * 3.4;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.022, color: palette.ghost, transparent: true, opacity: palette.isLight ? 0.34 : 0.52 }));
}
