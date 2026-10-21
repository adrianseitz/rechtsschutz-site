"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import studio from "@pmndrs/assets/hdri/studio.exr";

/** Prüft, ob der Browser WebGL kann – sonst bleibt der Bereich leer (die Seite funktioniert trotzdem). */
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function shieldShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 1.25);
  s.bezierCurveTo(0.35, 1.08, 0.7, 1.0, 0.98, 1.0);
  s.lineTo(0.98, 0.12);
  s.bezierCurveTo(0.98, -0.62, 0.5, -1.05, 0, -1.3);
  s.bezierCurveTo(-0.5, -1.05, -0.98, -0.62, -0.98, 0.12);
  s.lineTo(-0.98, 1.0);
  s.bezierCurveTo(-0.7, 1.0, -0.35, 1.08, 0, 1.25);
  return s;
}

function Shield() {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const pop = useRef(0);
  const pointer = useThree((st) => st.pointer);
  const body = useMemo(
    () => {
      const g = new THREE.ExtrudeGeometry(shieldShape(), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 12, curveSegments: 64 });
      g.center();
      return g;
    },
    []
  );
  const check = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.42, 0.04, 0),
      new THREE.Vector3(-0.12, -0.26, 0),
      new THREE.Vector3(0.46, 0.38, 0),
    ], false, "catmullrom", 0.05);
    return new THREE.TubeGeometry(curve, 64, 0.095, 24, false);
  }, []);
  const caps = useMemo(() => new THREE.SphereGeometry(0.095, 24, 24), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.3, 3.5, delta);
    if (spin.current > 0) {
      const step = Math.min(spin.current, delta * 14);
      spin.current -= step;
      g.rotation.y += step;
    } else {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y % (Math.PI * 2), pointer.x * 0.55 + Math.sin(t * 0.35) * 0.18 - 0.15, 3.5, delta);
    }
    pop.current = THREE.MathUtils.damp(pop.current, 0, 6, delta);
    const s = 0.78 * (1 + pop.current * 0.18);
    g.scale.set(s, s, s);
  });

  return (
    <group ref={group} scale={0.78}
      onClick={(e) => {
        e.stopPropagation();
        spin.current += Math.PI * 2;
        pop.current = 1;
        const ne = e.nativeEvent as PointerEvent;
        window.dispatchEvent(new CustomEvent("rs:burst", { detail: { x: ne.clientX, y: ne.clientY, strong: true } }));
        if ("vibrate" in navigator) { try { navigator.vibrate([10, 40, 14]); } catch { /* */ } }
      }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = ""; }}>
      <mesh geometry={body} castShadow>
        <meshPhysicalMaterial color="#FFC400" metalness={0.05} roughness={0.16} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <group position={[0, 0.02, 0.33]}>
        <mesh geometry={check}>
          <meshPhysicalMaterial color="#0B0B0A" metalness={0.3} roughness={0.18} clearcoat={1} />
        </mesh>
        <mesh geometry={caps} position={[-0.42, 0.04, 0]}><meshPhysicalMaterial color="#0B0B0A" roughness={0.18} clearcoat={1} /></mesh>
        <mesh geometry={caps} position={[0.46, 0.38, 0]}><meshPhysicalMaterial color="#0B0B0A" roughness={0.18} clearcoat={1} /></mesh>
      </group>
    </group>
  );
}

function Orbiters() {
  return (
    <>
      <Float speed={2.2} rotationIntensity={1.2} floatIntensity={1.4}>
        <mesh position={[1.2, 0.2, -0.4]} castShadow>
          <sphereGeometry args={[0.3, 64, 64]} />
          <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.8} roughness={0.05} ior={1.45} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={1.6} rotationIntensity={2} floatIntensity={1.2}>
        <mesh position={[-1.2, -0.75, 0.2]} rotation={[0.8, 0.3, 0]} castShadow>
          <torusGeometry args={[0.26, 0.1, 32, 96]} />
          <meshPhysicalMaterial color="#0B0B0A" metalness={0.4} roughness={0.15} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={2.8} rotationIntensity={0.6} floatIntensity={2}>
        <mesh position={[-1.2, 1.15, -0.6]} castShadow>
          <sphereGeometry args={[0.16, 48, 48]} />
          <meshPhysicalMaterial color="#FFD60A" roughness={0.1} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.6}>
        <mesh position={[1.35, -1.0, 0.3]} rotation={[0.4, 0.6, 0.2]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshPhysicalMaterial color="#F4F3EE" roughness={0.25} clearcoat={0.6} />
        </mesh>
      </Float>
    </>
  );
}

export default function Shield3D({ className = "" }: { className?: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(webglAvailable()), []);
  if (!ok) return null;
  return (
    <div className={className} aria-hidden>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 7], fov: 35 }} gl={{ antialias: true, alpha: true, premultipliedAlpha: false, toneMapping: THREE.NeutralToneMapping }} onCreated={({ gl, scene }) => { gl.setClearColor(0x000000, 0); scene.background = null; }}>
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
          <Shield />
        </Float>
        <Orbiters />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.28} scale={3.2} blur={2.4} far={3} color="#0B0B0A" />
        <Environment files={studio} environmentIntensity={0.7}>
          <Lightformer form="rect" intensity={3} position={[2, 3, 4]} scale={[3, 1.2, 1]} />
          <Lightformer form="ring" intensity={2} color="#FFD60A" position={[-4, 1, 2]} scale={2} />
        </Environment>
      </Canvas>
    </div>
  );
}
