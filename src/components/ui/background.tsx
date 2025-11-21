"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Background() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();

    // Orthographic camera for 2D as per user's code
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // --- The Shader Code ---

    const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;

    const fragmentShader = `
            uniform float iTime;
            uniform vec2 iResolution;
            uniform vec2 iMouse; 
            varying vec2 vUv;

            // --- Noise Functions ---
            float hash(float n) { return fract(sin(n) * 43758.5453123); }

            float noise(in vec2 x) {
                vec2 p = floor(x);
                vec2 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                float n = p.x + p.y * 57.0;
                return mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                           mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
            }

            float fbm(vec2 p) {
                float f = 0.0;
                float amp = 0.5;
                for(int i = 0; i < 5; i++) {
                    f += amp * noise(p);
                    p *= 2.0;
                    amp *= 0.5;
                }
                return f;
            }

            // --- Lightning Logic ---
            float getBoltHeight(float x, float seed, float time, float spread) {
                // Increased frequency (x * 1.5) and amplitude (1.8) for spikier path
                float noiseVal = fbm(vec2(x * 1.5, time * 0.5 + seed));
                float offset = (noiseVal - 0.5) * 1.8; 
                return 0.5 + (offset * spread); 
            }

            float drawBolt(vec2 uv, float seed, float time, float thickness, float intensityBoost, float spread) {
                float x = uv.x + time;
                float pathY = getBoltHeight(x, seed, time, spread);
                
                // Increased frequency and intensity for much more "crackle"
                float crackleIntensity = 0.03 * (0.5 + 1.5 * spread); 
                float crackle = noise(vec2(x * 25.0, uv.y * 25.0 + time * 8.0)) * crackleIntensity;
                
                float dist = abs(uv.y - pathY + crackle);
                // Softer falloff (pow 1.5 instead of 2.2) for a larger glow
                return pow(thickness / max(dist, 0.0001), 1.5) * intensityBoost;
            }

            float drawBranch(vec2 uv, float parentSeed, float branchSeed, float time, float thickness, float intensityBoost, float spread) {
                float x = uv.x + time;
                float parentY = getBoltHeight(x, parentSeed, time, spread);
                
                // More jagged deviation for branches
                float deviation = (fbm(vec2(x * 5.0, time + branchSeed)) - 0.5) * 0.8 * spread;
                float branchY = parentY + deviation;
                
                // More chaotic masking for branches appearing/disappearing
                float mask = smoothstep(0.2, 0.8, noise(vec2(x * 4.0, time * 3.0 + branchSeed)));
                float dist = abs(uv.y - branchY);
                // Softer falloff (pow 1.8 instead of 2.5) for branches too
                return pow(thickness / max(dist, 0.0001), 1.8) * mask * intensityBoost;
            }

            void main() {
                vec2 uv = vUv;
                float aspectRatio = iResolution.x / iResolution.y;
                uv.x *= aspectRatio;

                // --- Spread Envelope with Vertical Constraint ---
                // 1. Horizontal spread (pinched ends)
                float spreadX = 0.15 + 0.85 * sin(vUv.x * 3.14159);
                
                // 2. Vertical constraint (fades out towards top and bottom)
                // Calculate distance from center y=0.5.
                float distFromCenterY = abs(vUv.y - 0.5);
                // Fade out starting from y=0.2/0.8 (dist 0.3) down to y=0.0/1.0 (dist 0.5)
                float spreadY = 1.0 - smoothstep(0.3, 0.5, distFromCenterY);
                
                // Combine them so bolts are constrained both horizontally and vertically
                float spread = spreadX * spreadY;

                // Mouse Interaction
                vec2 mousePos = iMouse;
                mousePos.x *= aspectRatio;
                float distToMouse = distance(uv, mousePos);
                float surge = smoothstep(0.25, 0.0, distToMouse);
                float thicknessMult = 1.0 + (surge * 0.5); 
                float intensityMult = 1.0 + (surge * 0.3);

                float totalLightning = 0.0;

                // Lightning Layers (Slightly adjusted thickness for sharper look)
                float t1 = iTime * 0.5;
                totalLightning += drawBolt(uv, 10.0, t1, 0.007 * thicknessMult, 1.0 * intensityMult, spread);
                totalLightning += drawBranch(uv, 10.0, 42.0, t1, 0.0015 * thicknessMult, 1.0 * intensityMult, spread);
                totalLightning += drawBranch(uv, 10.0, 99.0, t1, 0.001 * thicknessMult, 1.0 * intensityMult, spread);

                float t2 = iTime * 0.6 + 100.0;
                totalLightning += drawBolt(uv, 25.3, t2, 0.005 * thicknessMult, 0.8 * intensityMult, spread);
                totalLightning += drawBranch(uv, 25.3, 12.0, t2, 0.0012 * thicknessMult, 1.0 * intensityMult, spread);

                float t3 = iTime * 0.4 - 50.0;
                totalLightning += drawBolt(uv, 50.1, t3, 0.015 * thicknessMult, 0.3 * intensityMult, spread) * 0.5;

                // --- Enhanced Color Grading for Warmer Orange Glow ---
                vec3 colorDeep = vec3(0.9, 0.2, 0.0);   // Warmer Deep red-orange
                vec3 colorNeon = vec3(1.0, 0.5, 0.1);    // Warmer Bright neon orange
                vec3 colorCore = vec3(1.0, 0.8, 0.6);    // Warmer Bright yellow-white core
                
                float t = clamp(totalLightning, 0.0, 1.0);
                
                // More aggressive color mixing for a hotter look
                vec3 lightningColor = mix(colorDeep, colorNeon, smoothstep(0.0, 0.4, t));
                lightningColor = mix(lightningColor, colorCore, smoothstep(0.4, 1.2, totalLightning));
                
                // Boost the overall intensity for much more glow (1.2 -> 1.5)
                lightningColor *= totalLightning * 1.5;

                // Final Color Composition
                vec3 finalColor = vec3(0.02, 0.0, 0.0); // Slightly redder dark background
                finalColor += lightningColor;
                
                // Vignette
                float vignette = 1.0 - length(vUv - 0.5) * 0.8;
                finalColor *= clamp(vignette, 0.2, 1.0);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      iMouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(plane);

    const onMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1.0 - (event.clientY / window.innerHeight);
      uniforms.iMouse.value.set(x, y);
    };

    const onWindowResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.iResolution.value.x = window.innerWidth;
      uniforms.iResolution.value.y = window.innerHeight;
    };

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      uniforms.iTime.value += 0.0005;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
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
