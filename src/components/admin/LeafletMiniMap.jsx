import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes par défaut de Leaflet avec bundler Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function LeafletMiniMap({ lat, lng, label, height = '220px' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const latitude = Number(lat) || 0;
    const longitude = Number(lng) || 0;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Contrôle de zoom discret
      L.control.zoom({ position: 'topright' }).addTo(map);

      const marker = L.marker([latitude, longitude]).addTo(map);
      if (label) {
        marker.bindPopup(`<strong>${label}</strong><br/>Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`).openPopup();
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      const map = mapInstanceRef.current;
      map.setView([latitude, longitude], 6);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        if (label) {
          markerRef.current.setPopupContent(`<strong>${label}</strong><br/>Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        }
      }
    }

    // Recalcul de la taille
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, label]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        background: '#041712',
      }}
    />
  );
}
