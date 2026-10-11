import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RotateCcw, ZoomIn, ZoomOut, Layers, AlertTriangle } from 'lucide-react';

export default function Interactive3DGlobe({ conflicts = [], riskData = [], onConflictSelect }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const [showRiskOverlay, setShowRiskOverlay] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Create gradient material for globe
    const material = new THREE.MeshPhongMaterial({
      color: 0x1a365d,
      emissive: 0x0a1628,
      specular: 0x00ff41,
      shininess: 10,
      transparent: true,
      opacity: 0.9,
      wireframe: false
    });

    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Wireframe overlay
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff41,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
    wireframe.scale.set(1.01, 1.01, 1.01);
    scene.add(wireframe);

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00ff41, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00f5ff, 0.5);
    pointLight.position.set(-5, -3, -5);
    scene.add(pointLight);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Add conflict markers
    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach(marker => scene.remove(marker));
      markersRef.current = [];

      conflicts.forEach((conflict, index) => {
        if (conflict.countries_data) {
          conflict.countries_data.forEach(country => {
            if (country.latitude && country.longitude) {
              const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
              const markerMaterial = new THREE.MeshBasicMaterial({
                color: conflict.status === 'ongoing' ? 0xff0000 : 
                       conflict.status === 'predicted' ? 0xffaa00 : 0x00ff00,
                transparent: true,
                opacity: 0.9
              });
              const marker = new THREE.Mesh(markerGeometry, markerMaterial);

              // Convert lat/long to 3D position
              const phi = (90 - country.latitude) * (Math.PI / 180);
              const theta = (country.longitude + 180) * (Math.PI / 180);
              marker.position.x = -1.02 * Math.sin(phi) * Math.cos(theta);
              marker.position.y = 1.02 * Math.cos(phi);
              marker.position.z = 1.02 * Math.sin(phi) * Math.sin(theta);

              marker.userData = { conflict, country };
              scene.add(marker);
              markersRef.current.push(marker);

              // Pulsing ring for active conflicts
              if (conflict.status === 'ongoing') {
                const ringGeometry = new THREE.RingGeometry(0.03, 0.05, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                  color: 0xff0000,
                  transparent: true,
                  opacity: 0.5,
                  side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.copy(marker.position);
                ring.lookAt(0, 0, 0);
                scene.add(ring);
                markersRef.current.push(ring);
              }
            }
          });
        }
      });
    };

    addMarkers();

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRotating && globeRef.current) {
        globeRef.current.rotation.y += 0.002;
        wireframe.rotation.y += 0.002;
      }

      // Pulse markers
      markersRef.current.forEach((marker, i) => {
        if (marker.geometry.type === 'RingGeometry') {
          marker.material.opacity = 0.3 + Math.sin(Date.now() * 0.005 + i) * 0.2;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      setIsRotating(false);
    };

    const onMouseMove = (e) => {
      if (isDragging && globeRef.current) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };
        globeRef.current.rotation.y += deltaMove.x * 0.005;
        globeRef.current.rotation.x += deltaMove.y * 0.005;
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.001;
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [conflicts, isRotating]);

  const handleZoom = (direction) => {
    if (cameraRef.current) {
      cameraRef.current.position.z += direction * 0.3;
      cameraRef.current.position.z = Math.max(1.5, Math.min(5, cameraRef.current.position.z));
    }
  };

  const handleReset = () => {
    if (cameraRef.current && globeRef.current) {
      cameraRef.current.position.z = 3;
      globeRef.current.rotation.x = 0;
      globeRef.current.rotation.y = 0;
      setIsRotating(true);
    }
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono">3D GLOBAL THEATER</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRiskOverlay(!showRiskOverlay)}
            className={`font-mono text-xs ${showRiskOverlay ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'border-slate-600/30 text-slate-400'}`}
          >
            <Layers className="w-3 h-3 mr-1" />
            RISK OVERLAY
          </Button>
          <Button size="icon" variant="ghost" onClick={() => handleZoom(-1)} className="text-cyan-400">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => handleZoom(1)} className="text-cyan-400">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleReset} className="text-cyan-400">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-[400px] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ background: 'radial-gradient(circle at center, #0a1628 0%, #000510 100%)' }}
      />

      {/* Legend */}
      <div className="absolute bottom-8 left-8 bg-slate-950/80 backdrop-blur-sm cyber-border rounded-lg p-3">
        <div className="text-xs font-mono text-slate-400 mb-2">CONFLICT STATUS</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-mono text-red-400">Active Conflict</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs font-mono text-orange-400">Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs font-mono text-green-400">Resolved</span>
          </div>
        </div>
      </div>

      {/* Selected conflict info */}
      {selectedConflict && (
        <div className="absolute top-20 right-8 bg-slate-950/90 backdrop-blur-sm cyber-border rounded-lg p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-green-400 font-mono">{selectedConflict.name}</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">{selectedConflict.description}</p>
        </div>
      )}
    </Card>
  );
}