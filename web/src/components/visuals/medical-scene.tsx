"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function material(color: string, emissive = color, intensity = 0.1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.32,
    metalness: 0.12
  });
}

export function MedicalScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf8fbff, 6, 12);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.62, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0xf8fbff, 0.88);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const tealLight = new THREE.PointLight(0x14b8a6, 1.6);
    tealLight.position.set(-3, 2, 3);
    scene.add(tealLight);
    const violetLight = new THREE.PointLight(0x8b5cf6, 1.1);
    violetLight.position.set(3, -1, 2);
    scene.add(violetLight);

    const rig = new THREE.Group();
    scene.add(rig);

    const grid = new THREE.GridHelper(5.2, 18, 0xbae6fd, 0xdbeafe);
    grid.position.set(0, -1.48, -0.3);
    rig.add(grid);

    const doctor = createDoctor();
    doctor.position.set(0, -0.18, 0.05);
    rig.add(doctor);

    const dna = createDna();
    dna.position.set(-1.95, 0.2, -0.45);
    rig.add(dna);

    const scanner = createScanner();
    scanner.position.set(1.85, 0.15, -0.35);
    rig.add(scanner);

    const particles = createParticles();
    rig.add(particles);

    const metricNodes = [
      createMetricNode("#3b82f6", [-1.2, 1.12, 0.35]),
      createMetricNode("#14b8a6", [1.08, 1.05, 0.45]),
      createMetricNode("#8b5cf6", [0.05, -1.16, 0.62])
    ];
    metricNodes.forEach((node) => rig.add(node));

    let frame = 0;
    let animationId = 0;
    const render = () => {
      frame += 0.01;
      rig.rotation.y = Math.sin(frame * 0.3) * 0.08;
      rig.position.y = Math.sin(frame * 0.7) * 0.03;
      doctor.position.y = -0.18 + Math.sin(frame * 1.4) * 0.035;
      doctor.rotation.y = Math.sin(frame * 0.9) * 0.08;
      dna.rotation.y += 0.008;
      scanner.rotation.x = Math.sin(frame * 0.6) * 0.18;
      scanner.rotation.y += 0.007;
      particles.rotation.y += 0.0012;
      metricNodes.forEach((node, index) => {
        node.position.y += Math.sin(frame * 1.5 + index) * 0.0008;
      });
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
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative h-[460px] w-full overflow-hidden md:h-[620px]">
      <div ref={mountRef} className="h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 grid gap-3 md:grid-cols-3">
        {[
          ["Neural triage", "97% routing uptime"],
          ["CBC vision", "Platelets, WBC, Hb"],
          ["Safety layer", "Local fallback ready"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/80 bg-white/72 px-4 py-3 shadow-soft backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{label}</p>
            <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <svg className="pointer-events-none absolute left-5 right-5 top-5 h-16 text-primary" viewBox="0 0 620 80" aria-hidden="true">
        <path className="heartbeat-line" d="M0 44 H115 L133 44 L146 18 L166 68 L188 30 L204 44 H620" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function createDoctor() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.82, 16, 32), material("#ffffff", "#f8fafc", 0.08));
  body.position.set(0, -0.72, 0);
  body.scale.set(0.72, 1.1, 0.38);
  group.add(body);

  const coatLine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.03), material("#dbeafe", "#dbeafe", 0.05));
  coatLine.position.set(0, -0.52, 0.41);
  coatLine.rotation.z = Math.PI / 4;
  group.add(coatLine);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 48, 48), material("#f8d8c6", "#f8d8c6", 0.03));
  head.position.set(0, 0.36, 0);
  group.add(head);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), material("#ffffff", "#dbeafe", 0.12));
  visor.position.set(0, 0.12, 0.04);
  visor.scale.set(0.82, 0.28, 0.44);
  group.add(visor);

  const eyeMaterial = material("#0f172a", "#2563eb", 0.32);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 24), eyeMaterial);
  leftEye.position.set(-0.14, 0.42, 0.39);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 24), eyeMaterial);
  rightEye.position.set(0.14, 0.42, 0.39);
  group.add(leftEye, rightEye);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 12, 64), material("#38bdf8", "#38bdf8", 0.45));
  halo.position.set(0, 0.48, 0.41);
  group.add(halo);

  const stethoscope = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 12, 64), material("#14b8a6", "#14b8a6", 0.35));
  stethoscope.position.set(0, -0.28, 0.48);
  stethoscope.rotation.x = Math.PI / 2;
  group.add(stethoscope);

  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 24), material("#8b5cf6", "#8b5cf6", 0.55));
  sensor.position.set(0.34, -0.04, 0.43);
  group.add(sensor);

  return group;
}

function createDna() {
  const group = new THREE.Group();
  const sphereGeometry = new THREE.SphereGeometry(0.055, 20, 20);
  const connectorGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.1, 12);
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.72 });

  for (let index = 0; index < 30; index += 1) {
    const y = (index - 14.5) * 0.13;
    const angle = index * 0.58;
    const left = [Math.cos(angle) * 0.55, y, Math.sin(angle) * 0.55] as const;
    const right = [Math.cos(angle + Math.PI) * 0.55, y, Math.sin(angle + Math.PI) * 0.55] as const;

    const leftSphere = new THREE.Mesh(sphereGeometry.clone(), material(index % 2 ? "#3b82f6" : "#14b8a6", index % 2 ? "#2563eb" : "#0f766e", 0.28));
    leftSphere.position.set(...left);
    group.add(leftSphere);

    const rightSphere = new THREE.Mesh(sphereGeometry.clone(), material(index % 2 ? "#8b5cf6" : "#06b6d4", index % 2 ? "#7c3aed" : "#0891b2", 0.24));
    rightSphere.position.set(...right);
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
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 2), material("#eff6ff", "#eff6ff", 0.12));
  group.add(core);

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.012, 16, 140), material("#3b82f6", "#3b82f6", 0.55));
  ringA.rotation.x = Math.PI / 2.2;
  group.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.01, 16, 140), material("#14b8a6", "#14b8a6", 0.35));
  ringB.rotation.set(0.4, Math.PI / 2, 0);
  group.add(ringB);

  const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.008, 16, 140), material("#8b5cf6", "#8b5cf6", 0.28));
  ringC.rotation.set(0, 0.4, Math.PI / 2);
  group.add(ringC);

  return group;
}

function createMetricNode(color: string, position: number[]) {
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 28, 28), material(color, color, 0.55));
  node.position.set(position[0], position[1], position[2]);
  return node;
}

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(110 * 3);
  for (let index = 0; index < 110; index += 1) {
    const seed = index * 12.9898;
    positions[index * 3] = (Math.sin(seed) - 0.5) * 5;
    positions[index * 3 + 1] = (Math.sin(seed * 1.7) - 0.5) * 3;
    positions[index * 3 + 2] = (Math.cos(seed * 1.3) - 0.5) * 3;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.018, color: 0x60a5fa, transparent: true, opacity: 0.55 }));
}
