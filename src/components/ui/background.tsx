"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Background() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Neon Lightning Shader
        const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      uniform float time;
      varying vec2 vUv;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 st) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < 5; i++) {
          v += a * noise(st);
          st = rot * st * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = uv * 2.0 - 1.0;
        float t = time * 0.5;
        
        // Create lightning/energy bolts
        float noiseVal = fbm(p * 3.0 + t);
        float bolt = 1.0 / abs(p.y + sin(p.x * 5.0 + t) * 0.2 + noiseVal * 0.5);
        
        // Neon colors (Orange/Yellow)
        vec3 color = vec3(1.0, 0.6, 0.1) * bolt * 0.05;
        color += vec3(1.0, 0.9, 0.2) * smoothstep(0.9, 1.0, bolt * 0.1);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);
        camera.position.z = 5;

        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            material.uniforms.time.value += 0.01;
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[-1] bg-black pointer-events-none"
        />
    );
}
