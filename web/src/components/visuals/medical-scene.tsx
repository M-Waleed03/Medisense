"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function makeMaterial(color: string, emissive = color, intensity = 0.12) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.12
  });
}

export function MedicalScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.45, 4.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.82));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);
    const tealLight = new THREE.PointLight(0x14b8a6, 1.3);
    tealLight.position.set(-3, -2, 3);
    scene.add(tealLight);

    const dna = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(0.045, 24, 24);
    const connectorGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.42, 16);
    const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.62 });

    for (let index = 0; index < 28; index += 1) {
      const y = (index - 13.5) * 0.13;
      const angle = index * 0.55;
      const left = new THREE.Vector3(Math.cos(angle) * 0.72, y, Math.sin(angle) * 0.72);
      const right = new THREE.Vector3(Math.cos(angle + Math.PI) * 0.72, y, Math.sin(angle + Math.PI) * 0.72);

      const leftSphere = new THREE.Mesh(sphereGeometry, makeMaterial(index % 2 ? "#3B82F6" : "#14B8A6", "#0EA5E9", 0.15));
      leftSphere.position.copy(left);
      dna.add(leftSphere);

      const rightSphere = new THREE.Mesh(sphereGeometry, makeMaterial(index % 2 ? "#8B5CF6" : "#06B6D4", "#8B5CF6", 0.12));
      rightSphere.position.copy(right);
      dna.add(rightSphere);

      const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
      connector.position.set(0, y, 0);
      connector.rotation.set(0, angle, Math.PI / 2);
      dna.add(connector);
    }

    dna.position.x = -1.15;
    scene.add(dna);

    const core = new THREE.Group();
    core.position.x = 1.05;
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.64, 2), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.18 }));
    core.add(coreMesh);
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.012, 16, 120), makeMaterial("#3B82F6", "#3B82F6", 0.35));
    core.add(ringA);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.01, 16, 120), makeMaterial("#14B8A6", "#14B8A6", 0.25));
    ringB.rotation.x = Math.PI / 2.4;
    core.add(ringB);
    scene.add(core);

    const particlePositions = new Float32Array(180 * 3);
    for (let index = 0; index < 180; index += 1) {
      const seed = index * 12.9898;
      particlePositions[index * 3] = (Math.sin(seed) - 0.5) * 6;
      particlePositions[index * 3 + 1] = (Math.sin(seed * 1.7) - 0.5) * 4;
      particlePositions[index * 3 + 2] = (Math.cos(seed * 1.3) - 0.5) * 4;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: 0.018, color: 0x60a5fa, transparent: true, opacity: 0.55 }));
    scene.add(particles);

    let frame = 0;
    let animationId = 0;
    const render = () => {
      frame += 0.01;
      dna.rotation.y += 0.003;
      core.rotation.y += 0.008;
      core.rotation.x = Math.sin(frame * 0.9) * 0.16;
      core.position.y = Math.sin(frame) * 0.08;
      particles.rotation.y += 0.0008;
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
      renderer.dispose();
      particleGeometry.dispose();
      sphereGeometry.dispose();
      connectorGeometry.dispose();
      connectorMaterial.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-[420px] w-full overflow-hidden md:h-[560px]">
      <div ref={mountRef} className="h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-10 bottom-8 h-12 rounded-full bg-blue-200/30 blur-2xl" />
    </div>
  );
}
