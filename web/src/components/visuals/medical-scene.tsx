"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function material(color: string, emissive = color, intensity = 0.1, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.28,
    metalness: 0.16,
    transparent: opacity < 1,
    opacity
  });
}

export function MedicalScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const isVisibleRef = useRef(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf8fbff, 7, 12);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.7, 6.3);

    // Performance-focused renderer settings: lower antialias and pixel ratio
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
    renderer.setClearColor(0xf8fbff, 0.95);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);
    const tealLight = new THREE.PointLight(0x14b8a6, 1.5);
    tealLight.position.set(-3, 2, 3);
    scene.add(tealLight);
    const violetLight = new THREE.PointLight(0x7c3aed, 1.15);
    violetLight.position.set(3, -1, 2);
    scene.add(violetLight);

    const rig = new THREE.Group();
    scene.add(rig);

    const grid = new THREE.GridHelper(5.3, 18, 0xbae6fd, 0xdbeafe);
    grid.position.set(0, -1.47, -0.3);
    rig.add(grid);

    const doctor = createDoctor();
    doctor.position.set(0, -0.05, 0);
    rig.add(doctor);

    const dna = createDna();
    dna.position.set(-2.25, 0.15, -0.55);
    rig.add(dna);

    const scanner = createScanner();
    scanner.position.set(2.12, 0.12, -0.45);
    rig.add(scanner);

    const particles = createParticles();
    rig.add(particles);

    const nodes = [
      createMetricNode("#2563eb", [-1.2, 1.22, 0.42]),
      createMetricNode("#14b8a6", [1.2, 1.08, 0.36]),
      createMetricNode("#7c3aed", [0, -1.14, 0.72])
    ];
    nodes.forEach((node) => rig.add(node));

    const clock = new THREE.Clock();
    let animationId = 0;
    const render = () => {
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      const shouldPause = pausedRef.current || document.hidden || !isVisibleRef.current;
      if (shouldPause) {
        // skip heavy updates and rendering when offscreen or paused
        animationId = window.requestAnimationFrame(render);
        return;
      }

      if (!pausedRef.current) {
        rig.rotation.y = THREE.MathUtils.lerp(rig.rotation.y, Math.sin(t * 0.45) * 0.1, 0.06);
        rig.position.y = THREE.MathUtils.lerp(rig.position.y, Math.sin(t * 1.1) * 0.035, 0.06);
        doctor.rotation.y = THREE.MathUtils.lerp(doctor.rotation.y, Math.sin(t * 0.8) * 0.08, 0.08);
        dna.rotation.y += delta * 0.6;
        scanner.rotation.y += delta * 0.55;
        scanner.rotation.x = Math.sin(t * 0.6) * 0.18;
        particles.rotation.y += delta * 0.08;
        nodes.forEach((node, index) => {
          node.position.y += Math.sin(t * 1.5 + index) * 0.0008;
        });
      }

      renderer.render(scene, camera);
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

    // Pause rendering when the component is not visible in viewport
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      isVisibleRef.current = !!e.isIntersecting;
    }, { threshold: 0.1 });
    io.observe(mount);

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const itemMaterial = object.material;
          if (Array.isArray(itemMaterial)) itemMaterial.forEach((entry) => entry.dispose());
          else itemMaterial.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      io.disconnect();
    };
  }, []);

  // sync paused state to ref so effect doesn't re-run
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  return (
    <div className="relative h-[76svh] min-h-[520px] w-full overflow-hidden md:h-[82svh] font-sans font-light text-slate-700">
      <div ref={mountRef} className="h-full w-full" aria-hidden="true" />

      {/* Left info card -- human-friendly heading and CTAs */}
      <div className="pointer-events-auto absolute left-6 top-6 max-w-lg rounded-2xl bg-white/95 border border-sky-50 p-5 shadow-md backdrop-blur-sm md:left-10">
        <h3 className="text-sm font-medium text-sky-500">Medisense</h3>
        <h2 className="mt-1 text-2xl md:text-4xl font-medium tracking-tight text-slate-800">Interactive 3D medical visualization</h2>
        <p className="mt-3 text-sm text-slate-600 font-light">Explore an interactive 3D illustration with clear status, readable metrics and gentle animations — designed for humans.</p>
        <div className="mt-4 flex gap-3">
          <button className="rounded-md bg-sky-50 border border-sky-100 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm hover:bg-sky-100">Explore</button>
          <button className="rounded-md border border-slate-100 bg-white px-4 py-2 text-sm font-medium text-slate-700">Docs</button>
        </div>
      </div>

      {/* Pause / Play control */}
      <div className="pointer-events-auto absolute right-6 top-6 flex items-center gap-3 md:right-10">
        <button aria-pressed={paused} onClick={() => setPaused((v) => !v)} className="rounded-full bg-white/80 border border-sky-50 px-3 py-2 text-sm font-medium text-sky-600 shadow-sm hover:bg-white">
          {paused ? "Play" : "Pause"}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-5 top-5 md:inset-x-10">
        <svg className="h-16 w-full text-sky-200" viewBox="0 0 720 80" aria-hidden="true">
          <path className="heartbeat-line" d="M0 44 H135 L153 44 L168 18 L190 68 L212 30 L230 44 H720" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-5 bottom-5 hidden gap-3 md:grid md:grid-cols-3">
        {[
          ["Neural triage", "97% uptime"],
          ["CBC vision", "10 markers"],
          ["Safety layer", "Local fallback"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-sky-50 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-sky-500">{label}</p>
            <p className="mt-1 text-xs font-medium text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function createDoctor() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.82, 8, 16), material("#ffffff", "#eff6ff", 0.09));
  body.position.set(0, -0.8, 0);
  body.scale.set(0.72, 1.12, 0.38);
  group.add(body);

  const coatLine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.035), material("#dbeafe", "#dbeafe", 0.08));
  coatLine.position.set(0, -0.58, 0.42);
  coatLine.rotation.z = Math.PI / 4;
  group.add(coatLine);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), material("#f8d8c6", "#f8d8c6", 0.03));
  head.position.set(0, 0.35, 0);
  group.add(head);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), material("#ffffff", "#dbeafe", 0.18, 0.92));
  visor.position.set(0, 0.13, 0.04);
  visor.scale.set(0.82, 0.28, 0.44);
  group.add(visor);

  const eyeMaterial = material("#07111f", "#2563eb", 0.45);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), eyeMaterial);
  leftEye.position.set(-0.14, 0.42, 0.39);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), eyeMaterial);
  rightEye.position.set(0.14, 0.42, 0.39);
  group.add(leftEye, rightEye);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.012, 8, 32), material("#38bdf8", "#38bdf8", 0.6));
  halo.position.set(0, 0.49, 0.42);
  group.add(halo);

  const stethoscope = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.014, 8, 32), material("#14b8a6", "#14b8a6", 0.42));
  stethoscope.position.set(0, -0.3, 0.49);
  stethoscope.rotation.x = Math.PI / 2;
  group.add(stethoscope);

  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), material("#7c3aed", "#7c3aed", 0.62));
  sensor.position.set(0.34, -0.05, 0.45);
  group.add(sensor);

  return group;
}

function createDna() {
  const group = new THREE.Group();
  const sphereGeometry = new THREE.SphereGeometry(0.055, 8, 8);
  const connectorGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.08, 8);
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.72 });

  for (let index = 0; index < 20; index += 1) {
    const y = (index - 15.5) * 0.13;
    const angle = index * 0.58;
    const leftSphere = new THREE.Mesh(sphereGeometry.clone(), material(index % 2 ? "#2563eb" : "#14b8a6", index % 2 ? "#2563eb" : "#14b8a6", 0.26));
    leftSphere.position.set(Math.cos(angle) * 0.55, y, Math.sin(angle) * 0.55);
    group.add(leftSphere);
    const rightSphere = new THREE.Mesh(sphereGeometry.clone(), material(index % 2 ? "#7c3aed" : "#06b6d4", index % 2 ? "#7c3aed" : "#06b6d4", 0.24));
    rightSphere.position.set(Math.cos(angle + Math.PI) * 0.55, y, Math.sin(angle + Math.PI) * 0.55);
    group.add(rightSphere);
    const connector = new THREE.Mesh(connectorGeometry.clone(), connectorMaterial.clone());
    connector.position.set(0, y, 0);
    connector.rotation.set(Math.PI / 2, 0, angle + Math.PI / 2);
    group.add(connector);
  }

  return group;
}

function createScanner() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 2), material("#eff6ff", "#eff6ff", 0.18));
  group.add(core);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.012, 12, 64), material("#2563eb", "#2563eb", 0.58));
  ringA.rotation.x = Math.PI / 2.2;
  group.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.01, 12, 64), material("#14b8a6", "#14b8a6", 0.38));
  ringB.rotation.set(0.4, Math.PI / 2, 0);
  group.add(ringB);
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.008, 12, 64), material("#7c3aed", "#7c3aed", 0.32));
  ringC.rotation.set(0, 0.4, Math.PI / 2);
  group.add(ringC);
  return group;
}

function createMetricNode(color: string, position: number[]) {
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), material(color, color, 0.58));
  node.position.set(position[0], position[1], position[2]);
  return node;
}

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(60 * 3);
  for (let index = 0; index < 60; index += 1) {
    const seed = index * 12.9898;
    positions[index * 3] = (Math.sin(seed) - 0.5) * 5.8;
    positions[index * 3 + 1] = (Math.sin(seed * 1.7) - 0.5) * 3;
    positions[index * 3 + 2] = (Math.cos(seed * 1.3) - 0.5) * 3.2;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.02, color: 0x60a5fa, transparent: true, opacity: 0.5 }));
}
