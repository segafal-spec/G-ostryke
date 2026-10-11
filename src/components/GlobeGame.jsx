import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  playClickSound,
  playPinDropSound,
  startAmbientMusic,
  stopAmbientMusic,
} from '../utils/audio';

// Configuration explicite du WebWorker MapLibre GL JS pour garantir le chargement des GeoJSON en dev et prod
if (maplibregl.config) {
  maplibregl.config.WORKER_URL = '/maplibre-gl-worker.mjs';
}

// Dictionnaire complet de traduction française des 177 pays du monde
const COUNTRY_TRANSLATIONS = {
  'Afghanistan': 'Afghanistan',
  'Albania': 'Albanie',
  'Algeria': 'Algérie',
  'Angola': 'Angola',
  'Antarctica': 'Antarctique',
  'Argentina': 'Argentine',
  'Armenia': 'Arménie',
  'Australia': 'Australie',
  'Austria': 'Autriche',
  'Azerbaijan': 'Azerbaïdjan',
  'Bangladesh': 'Bangladesh',
  'Belarus': 'Biélorussie',
  'Belgium': 'Belgique',
  'Belize': 'Belize',
  'Benin': 'Bénin',
  'Bhutan': 'Bhoutan',
  'Bolivia': 'Bolivie',
  'Bosnia and Herzegovina': 'Bosnie-Herzégovine',
  'Botswana': 'Botswana',
  'Brazil': 'Brésil',
  'Brunei': 'Brunei',
  'Bulgaria': 'Bulgarie',
  'Burkina Faso': 'Burkina Faso',
  'Burundi': 'Burundi',
  'Cambodia': 'Cambodge',
  'Cameroon': 'Cameroun',
  'Canada': 'Canada',
  'Central African Republic': 'République centrafricaine',
  'Chad': 'Tchad',
  'Chile': 'Chili',
  'China': 'Chine',
  'Colombia': 'Colombie',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Croatie',
  'Cuba': 'Cuba',
  'Cyprus': 'Chypre',
  'Czechia': 'Tchéquie',
  'Czech Republic': 'Tchéquie',
  'Democratic Republic of the Congo': 'RD Congo',
  'Denmark': 'Danemark',
  'Djibouti': 'Djibouti',
  'Dominican Republic': 'République dominicaine',
  'East Timor': 'Timor oriental',
  'Ecuador': 'Équateur',
  'Egypt': 'Égypte',
  'El Salvador': 'Salvador',
  'Equatorial Guinea': 'Guinée équatoriale',
  'Eritrea': 'Érythrée',
  'Estonia': 'Estonie',
  'Ethiopia': 'Éthiopie',
  'Falkland Islands': 'Îles Malouines',
  'Fiji': 'Fidji',
  'Finland': 'Finlande',
  'France': 'France',
  'French Southern and Antarctic Lands': 'Terres australes françaises',
  'Gabon': 'Gabon',
  'Gambia': 'Gambie',
  'Georgia': 'Géorgie',
  'Germany': 'Allemagne',
  'Ghana': 'Ghana',
  'Greece': 'Grèce',
  'Greenland': 'Groenland',
  'Guatemala': 'Guatemala',
  'Guinea': 'Guinée',
  'Guinea-Bissau': 'Guinée-Bissau',
  'Guyana': 'Guyana',
  'Haiti': 'Haïti',
  'Honduras': 'Honduras',
  'Hungary': 'Hongrie',
  'Iceland': 'Islande',
  'India': 'Inde',
  'Indonesia': 'Indonésie',
  'Iran': 'Iran',
  'Iraq': 'Irak',
  'Ireland': 'Irlande',
  'Israel': 'Israël',
  'Italy': 'Italie',
  'Ivory Coast': "Côte d'Ivoire",
  'Jamaica': 'Jamaïque',
  'Japan': 'Japon',
  'Jordan': 'Jordanie',
  'Kazakhstan': 'Kazakhstan',
  'Kenya': 'Kenya',
  'Kosovo': 'Kosovo',
  'Kuwait': 'Koweït',
  'Kyrgyzstan': 'Kirghizistan',
  'Laos': 'Laos',
  'Latvia': 'Lettonie',
  'Lebanon': 'Liban',
  'Lesotho': 'Lesotho',
  'Liberia': 'Libéria',
  'Libya': 'Libye',
  'Lithuania': 'Lituanie',
  'Luxembourg': 'Luxembourg',
  'Macedonia': 'Macédoine du Nord',
  'Madagascar': 'Madagascar',
  'Malawi': 'Malawi',
  'Malaysia': 'Malaisie',
  'Mali': 'Mali',
  'Mauritania': 'Mauritanie',
  'Mexico': 'Mexique',
  'Moldova': 'Moldavie',
  'Mongolia': 'Mongolie',
  'Montenegro': 'Monténégro',
  'Morocco': 'Maroc',
  'Mozambique': 'Mozambique',
  'Myanmar': 'Birmanie',
  'Namibia': 'Namibie',
  'Nepal': 'Népal',
  'Netherlands': 'Pays-Bas',
  'New Caledonia': 'Nouvelle-Calédonie',
  'New Zealand': 'Nouvelle-Zélande',
  'Nicaragua': 'Nicaragua',
  'Niger': 'Niger',
  'Nigeria': 'Nigéria',
  'North Korea': 'Corée du Nord',
  'Northern Cyprus': 'Chypre du Nord',
  'Norway': 'Norvège',
  'Oman': 'Oman',
  'Pakistan': 'Pakistan',
  'Palestine': 'Palestine',
  'Panama': 'Panama',
  'Papua New Guinea': 'Papouasie-Nouvelle-Guinée',
  'Paraguay': 'Paraguay',
  'Peru': 'Pérou',
  'Philippines': 'Philippines',
  'Poland': 'Pologne',
  'Portugal': 'Portugal',
  'Puerto Rico': 'Porto Rico',
  'Qatar': 'Qatar',
  'Republic of Serbia': 'Serbie',
  'Republic of the Congo': 'Congo',
  'Romania': 'Roumanie',
  'Russia': 'Russie',
  'Rwanda': 'Rwanda',
  'Saudi Arabia': 'Arabie saoudite',
  'Senegal': 'Sénégal',
  'Sierra Leone': 'Sierra Leone',
  'Slovakia': 'Slovaquie',
  'Slovenia': 'Slovénie',
  'Solomon Islands': 'Îles Salomon',
  'Somalia': 'Somalie',
  'Somaliland': 'Somaliland',
  'South Africa': 'Afrique du Sud',
  'South Korea': 'Corée du Sud',
  'South Sudan': 'Soudan du Sud',
  'Spain': 'Espagne',
  'Sri Lanka': 'Sri Lanka',
  'Sudan': 'Soudan',
  'Suriname': 'Suriname',
  'Swaziland': 'Eswatini',
  'Sweden': 'Suède',
  'Switzerland': 'Suisse',
  'Syria': 'Syrie',
  'Taiwan': 'Taïwan',
  'Tajikistan': 'Tadjikistan',
  'Thailand': 'Thaïlande',
  'The Bahamas': 'Bahamas',
  'Togo': 'Togo',
  'Trinidad and Tobago': 'Trinité-et-Tobago',
  'Tunisia': 'Tunisie',
  'Turkey': 'Turquie',
  'Turkmenistan': 'Turkménistan',
  'Uganda': 'Ouganda',
  'Ukraine': 'Ukraine',
  'United Arab Emirates': 'Émirats arabes unis',
  'United Kingdom': 'Royaume-Uni',
  'United Republic of Tanzania': 'Tanzanie',
  'United States of America': 'États-Unis',
  'United States': 'États-Unis',
  'USA': 'États-Unis',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Ouzbékistan',
  'Vanuatu': 'Vanuatu',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnam',
  'Western Sahara': 'Sahara occidental',
  'Yemen': 'Yémen',
  'Zambia': 'Zambie',
  'Zimbabwe': 'Zimbabwe',
};

// Dictionnaire inverse pour retrouver le nom ADMIN à partir d'un pays français
const REVERSE_COUNTRY_MAP = {};
Object.entries(COUNTRY_TRANSLATIONS).forEach(([admin, fr]) => {
  REVERSE_COUNTRY_MAP[fr.toLowerCase()] = admin;
  REVERSE_COUNTRY_MAP[admin.toLowerCase()] = admin;
});

// Codes 2 lettres personnalisés selon les noms français des pays
const FRENCH_SPECIAL_CODES = {
  'Spain': 'ES',
  'Germany': 'AL',
  'Switzerland': 'SU',
  'United Kingdom': 'RU',
  'Netherlands': 'PB',
  'Austria': 'AU',
  'Poland': 'PO',
  'Denmark': 'DA',
  'Ireland': 'IR',
  'Algeria': 'AL',
  'Tunisia': 'TU',
  'Turkey': 'TR',
  'Czechia': 'TC',
  'Czech Republic': 'TC',
  'Hungary': 'HO',
  'Bulgaria': 'BU',
  'China': 'CH',
  'Japan': 'JA',
  'Mexico': 'ME',
  'South Africa': 'AS',
  'United States of America': 'US',
  'United States': 'US',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Greece': 'GR',
  'Portugal': 'PT',
  'Italy': 'IT',
  'France': 'FR',
  'Belgium': 'BE',
  'Morocco': 'MA',
  'Egypt': 'EG',
  'Russia': 'RU',
  'Ukraine': 'UA',
};



// ============================================================================
// Préchargement asynchrone des GeoJSON au niveau du module
// ============================================================================
let cachedGeoData = null;
let geoDataPromise = null;

function loadAllGeoData() {
  if (cachedGeoData) return Promise.resolve(cachedGeoData);
  if (!geoDataPromise) {
    geoDataPromise = Promise.all([
      fetch('/data/countries.geojson')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch((err) => {
          console.error('Erreur chargement countries.geojson:', err);
          return null;
        }),
      fetch('/data/country-centers.geojson')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch((err) => {
          console.error('Erreur chargement country-centers.geojson:', err);
          return null;
        }),
      fetch('/data/world-borders.geojson')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .catch((err) => {
          console.error('Erreur chargement world-borders.geojson:', err);
          return null;
        }),
    ]).then(([countries, countryCenters, worldBorders]) => {
      if (countryCenters && countryCenters.features) {
        countryCenters.features.forEach((f) => {
          const p = f.properties || {};
          const frName = COUNTRY_TRANSLATIONS[p.name] || p.name_fr || p.name || '';
          let frCode = FRENCH_SPECIAL_CODES[p.name] || p.codeFr || p.displayCode;
          if (!frCode && frName) {
            const clean = frName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
            frCode = clean.length >= 2 ? clean.slice(0, 2) : p.code2;
          }
          p.codeFr = frCode || p.code2 || '';
          p.displayCode = frCode || p.displayCode || p.code2 || '';
          p.name_fr = frName;
        });
      }
      cachedGeoData = { countries, countryCenters, worldBorders };
      return cachedGeoData;
    });
  }
  return geoDataPromise;
}

// Lancement immédiat en tâche de fond
loadAllGeoData();

function applyDataToSources(map, data) {
  if (!map || !data) return;
  try {
    const sBorders = map.getSource('world-borders');
    if (sBorders && data.worldBorders) {
      sBorders.setData(data.worldBorders);
    }
    const sCountries = map.getSource('countries');
    if (sCountries && data.countries) {
      sCountries.setData(data.countries);
    }
    const sCenters = map.getSource('country-centers');
    if (sCenters && data.countryCenters) {
      sCenters.setData(data.countryCenters);
    }
  } catch (e) {
    // Le style n'est pas encore prêt, retenté par les événements
  }
}

// Calcul précis d'un grand cercle (arc géodésique) entre deux coordonnées sur la sphère 3D
function getGreatCircleArc(startLng, startLat, endLng, endLat, numPoints = 80) {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const lat1 = Number(startLat) * toRad;
  const lon1 = Number(startLng) * toRad;
  const lat2 = Number(endLat) * toRad;
  const lon2 = Number(endLng) * toRad;

  const v1 = [
    Math.cos(lat1) * Math.cos(lon1),
    Math.cos(lat1) * Math.sin(lon1),
    Math.sin(lat1)
  ];
  const v2 = [
    Math.cos(lat2) * Math.cos(lon2),
    Math.cos(lat2) * Math.sin(lon2),
    Math.sin(lat2)
  ];

  const dot = Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const omega = Math.acos(dot);

  if (omega < 1e-5) {
    return [[startLng, startLat], [endLng, endLat]];
  }

  const sinOmega = Math.sin(omega);
  const coords = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const a = Math.sin((1 - t) * omega) / sinOmega;
    const b = Math.sin(t * omega) / sinOmega;

    const x = a * v1[0] + b * v2[0];
    const y = a * v1[1] + b * v2[1];
    const z = a * v1[2] + b * v2[2];

    const lat = Math.atan2(z, Math.hypot(x, y)) * toDeg;
    const lon = Math.atan2(y, x) * toDeg;
    coords.push([Math.round(lon * 10000) / 10000, Math.round(lat * 10000) / 10000]);
  }

  return coords;
}

export default function GlobeGame({
  currentGuess,
  onMapClick,
  targetAnswer,
  isResultPhase,
  distanceKm,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const guessMarkerRef = useRef(null);
  const targetMarkerRef = useRef(null);
  const tooltipRef = useRef(null);
  // Coordonnées écran projetées de la ligne de liaison SVG (avec badge distance)
  const [svgLine, setSvgLine] = useState(null);

  const onMapClickRef = useRef(onMapClick);
  const isResultPhaseRef = useRef(isResultPhase);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    isResultPhaseRef.current = isResultPhase;
  }, [isResultPhase]);

  // Ambiance sonore (sono1 & sono2) : joue UNIQUEMENT lorsque la carte est affichée à l'écran
  useEffect(() => {
    startAmbientMusic();

    const handleVisibility = () => {
      if (document.hidden) {
        stopAmbientMusic(false);
      } else {
        startAmbientMusic();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopAmbientMusic();
    };
  }, []);

  // Initialisation 100% MapLibre GL JS en Globe 3D avec projection Globe native
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          projection: {
            type: 'globe',
          },
          sky: {
            'sky-color': '#010409',
            'horizon-color': '#0284c7',
            'fog-color': '#010409',
            'atmosphere-blend': 0.85,
          },
          sources: {
            satellite: {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              ],
              tileSize: 256,
              maxzoom: 19,
              attribution: '© Esri — Source: Esri, Maxar, Earthstar Geographics',
            },
            'world-borders': {
              type: 'geojson',
              data: cachedGeoData?.worldBorders || '/data/world-borders.geojson',
            },
            countries: {
              type: 'geojson',
              data: cachedGeoData?.countries || '/data/countries.geojson',
            },
            'country-centers': {
              type: 'geojson',
              data: cachedGeoData?.countryCenters || '/data/country-centers.geojson',
            },
            'arc-source': {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
            },
          },
          layers: [
            // 1. Fond satellite photoréaliste pur (style GeoSports)
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'satellite',
            },

            // 2. Couches transparentes pour interaction & raycasting
            {
              id: 'hit-countries',
              type: 'fill',
              source: 'countries',
              paint: {
                'fill-color': '#10b981',
                'fill-opacity': 0.02,
              },
            },

            // 3. PHASE DE RÉSULTAT : Remplissage lumineux du territoire cible
            {
              id: 'target-country-fill',
              type: 'fill',
              source: 'countries',
              paint: {
                'fill-color': '#10b981',
                'fill-opacity': 0.28,
              },
              filter: ['==', 'ADMIN', ''],
            },

            // 4. Surbrillance dynamique au survol de la souris
            {
              id: 'highlight-country-fill',
              type: 'fill',
              source: 'countries',
              paint: {
                'fill-color': 'rgba(16, 185, 129, 0.35)',
              },
              filter: ['==', 'ADMIN', ''],
            },
            {
              id: 'highlight-country-casing',
              type: 'line',
              source: 'countries',
              paint: {
                'line-color': '#020b08',
                'line-width': 5,
                'line-opacity': 0.9,
              },
              filter: ['==', 'ADMIN', ''],
            },
            {
              id: 'highlight-country-line',
              type: 'line',
              source: 'countries',
              paint: {
                'line-color': '#34d399',
                'line-width': 3.2,
                'line-opacity': 1.0,
              },
              filter: ['==', 'ADMIN', ''],
            },

            // 5. FRONTIÈRES TERRESTRES DES PAYS (Style GeoSports officiel - lignes blanches nettes et continues)
            // Casing sombre pour contraste maximal sur tous les reliefs (désert, neige, forêt)
            {
              id: 'boundary-land-casing',
              type: 'line',
              source: 'world-borders',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#000000',
                'line-width': ['interpolate', ['linear'], ['zoom'], 0, 2.6, 2, 3.2, 5, 4.2, 8, 5.2],
                'line-opacity': 0.85,
              },
            },
            // Ligne blanche continue éclatante délimitant chaque pays
            {
              id: 'boundary-land-core',
              type: 'line',
              source: 'world-borders',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#ffffff',
                'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1.4, 2, 1.8, 5, 2.4, 8, 3.2],
                'line-opacity': 1.0,
              },
            },
            // Contour discret des îles et côtes
            {
              id: 'boundary-countries-coastline',
              type: 'line',
              source: 'countries',
              paint: {
                'line-color': 'rgba(255, 255, 255, 0.3)',
                'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.5, 4, 1.0, 7, 1.5],
                'line-opacity': 0.4,
              },
            },



            // 6. PHASE DE RÉSULTAT : Contour vert néon éclatant de la cible
            {
              id: 'target-country-glow',
              type: 'line',
              source: 'countries',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#10b981',
                'line-width': 9,
                'line-blur': 4,
                'line-opacity': 0.95,
              },
              filter: ['==', 'ADMIN', ''],
            },
            {
              id: 'target-country-core',
              type: 'line',
              source: 'countries',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#34d399',
                'line-width': 3.5,
                'line-opacity': 1.0,
              },
              filter: ['==', 'ADMIN', ''],
            },

            // 7. LIGNE ROUGE GÉODÉSIQUE WEBGL (courbe tracée sur la sphère 3D)
            {
              id: 'arc-glow',
              type: 'line',
              source: 'arc-source',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#ef4444',
                'line-width': 12,
                'line-opacity': 0.75,
                'line-blur': 4,
              },
            },
            {
              id: 'arc-core',
              type: 'line',
              source: 'arc-source',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#ef4444',
                'line-width': 4.5,
                'line-opacity': 1.0,
              },
            },
            {
              id: 'arc-dash',
              type: 'line',
              source: 'arc-source',
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#ffffff',
                'line-width': 2.5,
                'line-dasharray': [3, 2],
                'line-opacity': 1.0,
              },
            },

            // 8. CODES PAYS 2 LETTRES (Style GeoSports officiel - US, FR, SP, IT, GE...)
            {
              id: 'country-code-labels',
              type: 'symbol',
              source: 'country-centers',
              minzoom: 1.0,
              layout: {
                'text-field': ['coalesce', ['get', 'displayCode'], ['get', 'code2'], ''],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  1.0, 9.5,
                  2.5, 11.5,
                  4.0, 13.5,
                  7.0, 16.0
                ],
                'text-anchor': 'center',
                'symbol-sort-key': ['coalesce', ['get', 'LABELRANK'], 5],
                'text-padding': 3,
                'text-allow-overlap': false,
                'text-ignore-placement': false,
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': 'rgba(0, 0, 0, 0.95)',
                'text-halo-width': 2.2,
                'text-halo-blur': 0.4,
              },
            },

          ],
        },
        center: [15, 25],
        zoom: 1.4,
        minZoom: 1,
        maxZoom: 18,
        attributionControl: false,
      });

      // Attribution immédiate de l'instance map
      mapInstanceRef.current = map;

      // Synchronisation garantie des données GeoJSON
      const syncData = () => {
        loadAllGeoData().then((data) => {
          if (data && map) {
            applyDataToSources(map, data);
          }
        });
      };

      map.on('style.load', () => {
        try {
          map.setProjection({ type: 'globe' });
          map.setSky({
            'sky-color': '#010409',
            'horizon-color': '#0284c7',
            'fog-color': '#010409',
            'atmosphere-blend': 0.85,
          });
        } catch (e) {
          console.warn('SetProjection globe fallback:', e);
        }
        syncData();
      });

      map.on('load', syncData);
      map.on('idle', syncData);

      // Sécurité supplémentaire en cas de latence réseau
      const t1 = setTimeout(syncData, 300);
      const t2 = setTimeout(syncData, 1000);

      // Écouteur de clic pour poser la proposition du joueur
      map.on('click', (e) => {
        if (isResultPhaseRef.current) return;
        if (onMapClickRef.current) {
          const lat = Math.round(e.lngLat.lat * 10000) / 10000;
          const lng = Math.round(e.lngLat.lng * 10000) / 10000;
          onMapClickRef.current({ lat, lng });
          playPinDropSound();
        }
      });

      // Gestion dynamique du survol (Pays du Monde)
      let currentHoveredCountry = null;

      const clearAllHover = () => {
        if (currentHoveredCountry) {
          map.setFilter('highlight-country-fill', ['==', 'ADMIN', '']);
          map.setFilter('highlight-country-casing', ['==', 'ADMIN', '']);
          map.setFilter('highlight-country-line', ['==', 'ADMIN', '']);
          currentHoveredCountry = null;
        }
      };

      map.on('mousemove', (e) => {
        if (!tooltipRef.current) return;
        const bbox = [
          [e.point.x - 4, e.point.y - 4],
          [e.point.x + 4, e.point.y + 4],
        ];

        // 2. Détection Pays du Monde (en Français avec drapeau)
        let countryFeats = [];
        try {
          countryFeats = map.queryRenderedFeatures(bbox, {
            layers: ['hit-countries', 'country-code-labels'],
          });
        } catch (err) {
          countryFeats = [];
        }

        if (countryFeats && countryFeats.length > 0) {
          const c = countryFeats[0].properties;
          const adminKey = c.ADMIN || c.name || c.NAME || '';
          if (adminKey) {
            const frName = c.name_fr || COUNTRY_TRANSLATIONS[adminKey] || adminKey;
            let flag = '🌍';
            const iso = c.ISO_A2 || c.code2 || '';
            if (iso && iso.length === 2 && /^[A-Z]{2}$/i.test(iso)) {
              flag = String.fromCodePoint(...iso.toUpperCase().split('').map((ch) => 127397 + ch.charCodeAt(0)));
            } else if (adminKey === 'France') {
              flag = '🇫🇷';
            }
            const label = `${flag} ${frName}`;

            clearAllHover();
            currentHoveredCountry = adminKey;
            map.setFilter('highlight-country-fill', ['==', 'ADMIN', adminKey]);
            map.setFilter('highlight-country-casing', ['==', 'ADMIN', adminKey]);
            map.setFilter('highlight-country-line', ['==', 'ADMIN', adminKey]);

            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = `${e.point.x + 14}px`;
            tooltipRef.current.style.top = `${e.point.y + 14}px`;
            tooltipRef.current.innerText = label;
            tooltipRef.current.style.borderColor = '#10b981';
            tooltipRef.current.style.color = '#ffffff';
            map.getCanvas().style.cursor = 'pointer';
            return;
          }
        }

        clearAllHover();
        tooltipRef.current.style.display = 'none';
        map.getCanvas().style.cursor = 'grab';
      });

      map.on('mouseleave', () => {
        clearAllHover();
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      });

      mapInstanceRef.current = map;

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err) {
      console.error('Erreur initialisation Globe MapLibre :', err);
    }
  }, []);


  // Marqueur de proposition joueur (Pin bleu avec halo)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentGuess) {
      if (!guessMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'bizgames-pin-guess';
        el.style.width = '26px';
        el.style.height = '26px';
        el.style.background = 'radial-gradient(circle at 35% 35%, #60a5fa, #2563eb 70%, #1e40af)';
        el.style.border = '2.5px solid #ffffff';
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)';
        el.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.95), 0 0 32px rgba(37, 99, 235, 0.5), 0 4px 10px rgba(0,0,0,0.6)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';

        const inner = document.createElement('div');
        inner.style.width = '6px';
        inner.style.height = '6px';
        inner.style.background = '#ffffff';
        inner.style.borderRadius = '50%';
        el.appendChild(inner);

        guessMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([Number(currentGuess.lng), Number(currentGuess.lat)])
          .addTo(map);
      } else {
        guessMarkerRef.current.setLngLat([Number(currentGuess.lng), Number(currentGuess.lat)]);
      }
    } else if (guessMarkerRef.current) {
      guessMarkerRef.current.remove();
      guessMarkerRef.current = null;
    }
  }, [currentGuess]);

  // Phase de résultat : Marqueur cible vert, ligne rouge laser (WebGL + SVG temps réel) et cadrage caméra
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let moveHandler = null;

    if (isResultPhase && targetAnswer) {
      const targetLng = Number(targetAnswer.lng);
      const targetLat = Number(targetAnswer.lat);

      // 1. Marqueur officiel émeraude avec bulle cible
      if (!targetMarkerRef.current) {
        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.pointerEvents = 'none';
        el.innerHTML = `
          <div style="background: rgba(3, 18, 14, 0.96); border: 1.5px solid #10b981; color: #34d399; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 8px; box-shadow: 0 4px 18px rgba(0,0,0,0.7), 0 0 12px rgba(16, 185, 129, 0.4); white-space: nowrap; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>🎯</span>
            <span>${targetAnswer.lieu_nom || 'Réponse'}</span>
          </div>
          <div style="width: 28px; height: 28px; background: radial-gradient(circle at 35% 35%, #34d399, #10b981 70%, #047857); border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 0 20px rgba(16, 185, 129, 0.95), 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
            <div style="width: 7px; height: 7px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        `;

        targetMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([targetLng, targetLat])
          .addTo(map);
      } else {
        targetMarkerRef.current.setLngLat([targetLng, targetLat]);
      }

      // 2. Surbrillance du pays ou état cible en vert néon
      try {
        if (targetAnswer.pays) {
          const targetClean = targetAnswer.pays.trim().toLowerCase();
          const matchedAdmin = REVERSE_COUNTRY_MAP[targetClean] || targetAnswer.pays;
          map.setFilter('target-country-fill', ['==', 'ADMIN', matchedAdmin]);
          map.setFilter('target-country-glow', ['==', 'ADMIN', matchedAdmin]);
          map.setFilter('target-country-core', ['==', 'ADMIN', matchedAdmin]);
        }
      } catch (e) {
        console.warn('Filter target territory:', e);
      }

      // 3. Tracé de la ligne rouge laser reliant proposition et réponse
      if (currentGuess) {
        const guessLng = Number(currentGuess.lng);
        const guessLat = Number(currentGuess.lat);

        // A. Couche WebGL MapLibre (arc tridimensionnel sur la sphère 3D)
        const arcCoordinates = getGreatCircleArc(guessLng, guessLat, targetLng, targetLat, 80);
        const arcSource = map.getSource('arc-source');
        if (arcSource) {
          arcSource.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: arcCoordinates,
                },
              },
            ],
          });
        }

        // B. Ligne de liaison SVG temps réel (garantie 100% nette avec badge distance en son centre)
        const updateSvgLineCoords = () => {
          try {
            if (!mapInstanceRef.current) return;
            const p1 = mapInstanceRef.current.project([guessLng, guessLat]);
            const p2 = mapInstanceRef.current.project([targetLng, targetLat]);
            if (p1 && p2 && !isNaN(p1.x) && !isNaN(p1.y) && !isNaN(p2.x) && !isNaN(p2.y)) {
              setSvgLine({
                x1: p1.x,
                y1: p1.y,
                x2: p2.x,
                y2: p2.y,
              });
            }
          } catch (e) {
            // projection temporairement indisponible
          }
        };

        updateSvgLineCoords();
        moveHandler = updateSvgLineCoords;
        map.on('move', moveHandler);
        map.on('render', moveHandler);
        map.on('zoom', moveHandler);

        // C. Cadrage caméra automatique fluide
        const minLng = Math.min(guessLng, targetLng);
        const maxLng = Math.max(guessLng, targetLng);
        const minLat = Math.min(guessLat, targetLat);
        const maxLat = Math.max(guessLat, targetLat);

        try {
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            {
              padding: { top: 120, bottom: 270, left: 80, right: 80 },
              maxZoom: 6.5,
              duration: 1200,
            }
          );
        } catch (e) {
          map.flyTo({
            center: [(guessLng + targetLng) / 2, (guessLat + targetLat) / 2],
            zoom: 3.5,
            duration: 1000,
          });
        }
      } else {
        map.flyTo({
          center: [targetLng, targetLat],
          zoom: 4.5,
          essential: true,
          duration: 1000,
        });
      }
    } else {
      // Nettoyage pour question suivante
      setSvgLine(null);
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }
      try {
        map.setFilter('target-country-fill', ['==', 'ADMIN', '']);
        map.setFilter('target-country-glow', ['==', 'ADMIN', '']);
        map.setFilter('target-country-core', ['==', 'ADMIN', '']);
      } catch (e) {}

      const arcSource = map.getSource('arc-source');
      if (arcSource) {
        arcSource.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }

    return () => {
      if (moveHandler && map) {
        map.off('move', moveHandler);
        map.off('render', moveHandler);
        map.off('zoom', moveHandler);
      }
    };
  }, [isResultPhase, targetAnswer, currentGuess]);

  return (
    <div style={styles.container}>
      <div ref={mapContainerRef} style={styles.mapContainer} />

      {/* Ligne laser SVG temps réel connectant les deux points avec badge distance */}
      {isResultPhase && svgLine && (
        <svg
          style={styles.svgOverlay}
          width="100%"
          height="100%"
        >
          <defs>
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Halo rouge laser extérieur */}
          <line
            x1={svgLine.x1}
            y1={svgLine.y1}
            x2={svgLine.x2}
            y2={svgLine.y2}
            stroke="#ef4444"
            strokeWidth="10"
            strokeOpacity="0.65"
            strokeLinecap="round"
            filter="url(#laserGlow)"
          />

          {/* Trait rouge net */}
          <line
            x1={svgLine.x1}
            y1={svgLine.y1}
            x2={svgLine.x2}
            y2={svgLine.y2}
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Tirets blancs animés haute précision (style GeoSports) */}
          <line
            x1={svgLine.x1}
            y1={svgLine.y1}
            x2={svgLine.x2}
            y2={svgLine.y2}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />

          {/* Badge de distance rouge vif au centre du trait de liaison (comme dans GeoSports) */}
          {distanceKm !== undefined && distanceKm !== null && !isNaN(distanceKm) && (
            <g
              transform={`translate(${(svgLine.x1 + svgLine.x2) / 2}, ${(svgLine.y1 + svgLine.y2) / 2})`}
              style={{ pointerEvents: 'none' }}
            >
              <rect
                x="-70"
                y="-15"
                width="140"
                height="30"
                rx="15"
                fill="rgba(220, 38, 38, 0.95)"
                stroke="#ffffff"
                strokeWidth="2"
                filter="drop-shadow(0 4px 12px rgba(0,0,0,0.7))"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12.5"
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.4px"
              >
                {Math.round(distanceKm) < 1 ? '🎯 < 1 km !' : `📍 ${Math.round(distanceKm).toLocaleString('fr-FR')} km`}
              </text>
            </g>
          )}
        </svg>
      )}

      {/* Infobulle de survol interactive affichant le pays et son nom en français */}
      <div ref={tooltipRef} style={styles.floatingTooltip} />


    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#010409',
    zIndex: 1,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    cursor: 'grab',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 10,
  },
  floatingTooltip: {
    position: 'absolute',
    display: 'none',
    zIndex: 999,
    pointerEvents: 'none',
    background: 'rgba(3, 18, 14, 0.96)',
    border: '1.5px solid #10b981',
    padding: '7px 14px',
    borderRadius: '10px',
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: '800',
    letterSpacing: '0.4px',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.8), 0 0 15px rgba(16, 185, 129, 0.3)',
    transition: 'top 0.04s ease, left 0.04s ease',
  },

};
