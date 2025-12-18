
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface MagicMirrorBoxProps {
    analyser?: AnalyserNode | null;
    intensity?: number; // 0 to 1
    color?: string;
    isActive?: boolean;
}

const MagicMirrorBox: React.FC<MagicMirrorBoxProps> = ({ analyser, intensity = 0.5, color = '#32CD32', isActive = true }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const spiritRef = useRef<THREE.Mesh | null>(null);
    const boxRef = useRef<THREE.Group | null>(null);
    const frameIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 2.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(300, 300);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(color, 2, 10);
        pointLight.position.set(0, 0, 1);
        scene.add(pointLight);

        // Box Frame
        const boxSize = 1.6;
        const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const boxMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
        const boxLines = new THREE.LineSegments(edges, boxMaterial);
        const boxGroup = new THREE.Group();
        boxGroup.add(boxLines);
        
        // Emissive inner glow planes
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.05, 
            side: THREE.DoubleSide 
        });
        const glowPlane = new THREE.Mesh(new THREE.BoxGeometry(boxSize * 0.95, boxSize * 0.95, boxSize * 0.95), glowMaterial);
        boxGroup.add(glowPlane);
        
        scene.add(boxGroup);
        boxRef.current = boxGroup;

        // Spirit Entity (Noise Displacement Sphere)
        const spiritGeo = new THREE.SphereGeometry(0.6, 64, 64);
        const spiritMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) },
                uIntensity: { value: intensity },
                uAudio: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vNoise;
                uniform float uTime;
                uniform float uIntensity;
                uniform float uAudio;

                // Simple 3D Noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 =   v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i); 
                    vec4 p = permute( permute( permute( 
                               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(dot(x3,x3),1.0)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vUv = uv;
                    vNoise = snoise(normal * 2.0 + uTime * 0.5) * (uIntensity + uAudio * 2.0);
                    vec3 newPosition = position + normal * vNoise * 0.3;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying float vNoise;
                uniform vec3 uColor;

                void main() {
                    float alpha = 0.6 + vNoise * 0.4;
                    vec3 glowColor = uColor * (1.0 + vNoise * 0.5);
                    gl_FragColor = vec4(glowColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
        });

        const spirit = new THREE.Mesh(spiritGeo, spiritMaterial);
        scene.add(spirit);
        spiritRef.current = spirit;

        // Animation Loop
        const audioData = new Uint8Array(analyser?.frequencyBinCount || 0);
        const clock = new THREE.Clock();

        const animate = () => {
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            if (spiritRef.current) {
                spiritRef.current.rotation.y += delta * 0.2;
                spiritRef.current.rotation.z += delta * 0.1;
                (spiritRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
                
                if (analyser) {
                    analyser.getByteFrequencyData(audioData);
                    let sum = 0;
                    for(let i = 0; i < 32; i++) sum += audioData[i];
                    const avg = sum / (32 * 255);
                    (spiritRef.current.material as THREE.ShaderMaterial).uniforms.uAudio.value = avg;
                    
                    if (boxRef.current) {
                        const scale = 1 + avg * 0.2;
                        boxRef.current.scale.set(scale, scale, scale);
                    }
                }
            }

            if (boxRef.current) {
                boxRef.current.rotation.y += delta * 0.15;
                boxRef.current.rotation.x += delta * 0.05;
            }

            renderer.render(scene, camera);
            frameIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            spiritGeo.dispose();
            boxGeo.dispose();
            boxMaterial.dispose();
            glowMaterial.dispose();
        };
    }, []);

    useEffect(() => {
        if (spiritRef.current) {
            const mat = spiritRef.current.material as THREE.ShaderMaterial;
            mat.uniforms.uColor.value = new THREE.Color(color);
            mat.uniforms.uIntensity.value = intensity;
        }
        if (boxRef.current) {
            const lines = boxRef.current.children[0] as THREE.LineSegments;
            (lines.material as THREE.LineBasicMaterial).color = new THREE.Color(color);
            const glow = boxRef.current.children[1] as THREE.Mesh;
            (glow.material as THREE.MeshBasicMaterial).color = new THREE.Color(color);
        }
    }, [color, intensity]);

    return (
        <div 
            ref={containerRef} 
            className={`w-64 h-64 relative transition-all duration-1000 ${isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}
            style={{ 
                filter: `drop-shadow(0 0 15px ${color}44)`,
                cursor: 'pointer'
            }}
        />
    );
};

export default MagicMirrorBox;
