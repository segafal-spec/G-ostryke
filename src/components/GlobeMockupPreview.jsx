import React, { useEffect, useRef, useState } from 'react';
import { Play, Sparkles, Navigation, Target, MapPin } from 'lucide-react';
import Globe from 'globe.gl';

export default function GlobeMockupPreview({ onStartGame }) {
  const containerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [globeReady, setGlobeReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (globeInstanceRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 450;
    const height = container.clientHeight || 280;

    let globe = null;

    try {
      // Initialisation du Globe 3D miniature pour l'aperçu de la mapmonde
      globe = Globe()(container)
        .width(width)
        .height(height)
        .globeImageUrl('/textures/earth-blue-marble.jpg')
        .backgroundImageUrl('/textures/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#10b981')
        .atmosphereAltitude(0.24)
        .pointOfView({ lat: 36.5, lng: -119.5, altitude: 2.1 }, 0);

      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false; // Garder la vue cadrée pour l'aperçu
      }

      // Marqueurs : Cible officielle Apple Park & Pointage simulé
      const markers = [
        {
          lat: 37.3346,
          lng: -122.009,
          type: 'target',
          name: 'Apple Park (Cupertino)',
        },
        {
          lat: 37.7749,
          lng: -122.4194,
          type: 'guess',
          name: 'Pointage simulé (SF)',
        },
      ];

      globe
        .htmlElementsData(markers)
        .htmlLat((d) => d.lat)
        .htmlLng((d) => d.lng)
        .htmlElement((d) => {
          const el = document.createElement('div');
          el.style.pointerEvents = 'none';
          el.style.transform = 'translate(-50%, -100%)';

          if (d.type === 'target') {
            el.innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="background:rgba(16,185,129,0.9);color:#ffffff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.5);white-space:nowrap;border:1px solid #ffffff;">
                  🎯 Apple Park
                </div>
                <div style="width:20px;height:20px;background:linear-gradient(135deg,#10b981,#059669);border:2px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 12px #10b981;"></div>
              </div>
            `;
          } else {
            el.innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="background:rgba(245,158,11,0.9);color:#0b0f19;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.5);white-space:nowrap;border:1px solid #ffffff;">
                  📍 Pointage
                </div>
                <div style="width:18px;height:18px;background:linear-gradient(135deg,#f59e0b,#d97706);border:2px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 10px #f59e0b;"></div>
              </div>
            `;
          }
          return el;
        });

      // Arc lumineux 3D entre le pointage et la cible
      globe
        .arcsData([
          {
            startLat: 37.7749,
            startLng: -122.4194,
            endLat: 37.3346,
            endLng: -122.009,
            color: ['#f59e0b', '#10b981'],
          },
        ])
        .arcColor('color')
        .arcAltitude(0.16)
        .arcStroke(2.2)
        .arcDashLength(0.4)
        .arcDashGap(0.15)
        .arcDashAnimateTime(1500);

      // Frontières des pays du monde
      fetch('/data/countries.geojson')
        .then((res) => res.json())
        .then((countriesData) => {
          if (!globeInstanceRef.current) return;

          const countries = (countriesData.features || [])
            .filter((d) => d.properties?.ISO_A2 !== 'AQ')
            .map((f) => ({ ...f, _type: 'country' }));

          globe
            .polygonsData(countries)
            .polygonCapColor(() => 'rgba(0, 0, 0, 0)')
            .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
            .polygonStrokeColor(() => 'rgba(52, 211, 153, 0.7)')
            .polygonAltitude(() => 0.005);
        })
        .catch(() => {});

      globeInstanceRef.current = globe;
      setGlobeReady(true);

      // Redimensionnement
      const handleResize = () => {
        if (!containerRef.current || !globeInstanceRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          globeInstanceRef.current.width(w).height(h);
        }
      };

      window.addEventListener('resize', handleResize);
      const timer = setTimeout(handleResize, 100);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        globeInstanceRef.current = null;
      };
    } catch (err) {
      console.warn('Globe mockup fallback utilisé :', err);
    }
  }, []);

  return (
    <div style={styles.previewContainer} onClick={onStartGame} title="Cliquez pour lancer la session Éco-Titan">
      {/* 1. FOND CONCEPT SOLAR-PUNK LUXURY ECO-TITAN */}
      <div
        style={{
          ...styles.fallbackMapImage,
          opacity: globeReady ? 0.35 : 1,
        }}
      />

      {/* 2. CANVAS THREE.JS DU GLOBE INTERACTIF */}
      <div ref={containerRef} style={styles.threeCanvasContainer} />

      {/* 3. LIGNES TACTIQUES DE COORDONNÉES HUD & SCANNER */}
      <div style={styles.hudGridOverlay} />

      {/* 4. BADGES TACTIQUES DU JEU ("À quoi ressemble le jeu") */}
      <div style={styles.topHudRow}>
        <div style={styles.hudBadgeTarget}>
          <Target size={13} color="#10b981" />
          <span>🌿 Cible : Apple Park • 100% Énergie Solaire</span>
        </div>

        <div style={styles.hudBadgeLive}>
          <span style={styles.livePulseDot} />
          <span>⚡ Réseau Éco-Titan Actif</span>
        </div>
      </div>

      {/* Pin central avec animation radar pour la map statique de fallback */}
      {!globeReady && (
        <div style={styles.centerTargetPin}>
          <span style={styles.targetPulseCircle} />
          <div style={styles.targetPinBadge}>
            <MapPin size={13} color="#10b981" />
            <span>Apple Park (Cupertino, CA)</span>
          </div>
        </div>
      )}

      {/* 5. BANDEAU DE SCORE / DISTANCE CALCULÉE DU JEU */}
      <div style={styles.bottomScorePill}>
        <span style={{ color: '#6ee7b7' }}>Précision : </span>
        <strong style={{ color: '#ffffff' }}>48 km</strong>
        <span style={{ color: '#6ee7b7' }}> • Score Éco : </span>
        <strong style={{ color: '#fbbf24' }}>+4 880 PTS</strong>
      </div>

      {/* 6. BOUTON OVERLAY D'ACTION RAPIDE */}
      <div style={styles.ctaOverlayBox}>
        <div style={styles.playButtonPill}>
          <Play size={18} fill="#03120e" color="#03120e" />
          <span>Lancer la Session Éco-Titan 2085</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  previewContainer: {
    height: '290px',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    boxShadow: 'inset 0 0 35px rgba(3, 18, 14, 0.9), 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.15)',
    cursor: 'pointer',
    background: '#03120e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackMapImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/images/concept_solarpunk_luxury.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 0.6s ease',
    zIndex: 1,
  },
  threeCanvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    backgroundImage: `
      radial-gradient(circle at center, transparent 30%, rgba(7, 11, 22, 0.6) 90%),
      linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: '100% 100%, 30px 30px, 30px 30px',
    zIndex: 3,
  },
  topHudRow: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 4,
    pointerEvents: 'none',
  },
  hudBadgeTarget: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(3, 18, 14, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#ecfdf5',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  hudBadgeLive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(3, 18, 14, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(52, 211, 153, 0.4)',
    color: '#34d399',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  livePulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 10px #34d399',
  },
  centerTargetPin: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    pointerEvents: 'none',
  },
  targetPulseCircle: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: '2px solid #10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    boxShadow: '0 0 15px #10b981',
    animation: 'pulse 1.8s infinite',
  },
  targetPinBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(3, 18, 14, 0.92)',
    border: '1px solid #10b981',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  bottomScorePill: {
    position: 'absolute',
    bottom: '56px',
    left: '12px',
    background: 'rgba(3, 18, 14, 0.9)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '5px 12px',
    borderRadius: '14px',
    fontSize: '11px',
    color: '#cbd5e1',
    zIndex: 4,
    pointerEvents: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  ctaOverlayBox: {
    position: 'absolute',
    bottom: '12px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  playButtonPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    color: '#03120e',
    padding: '9px 18px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
};
