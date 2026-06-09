// ==========================================================================
// AeroCast AI - Interactive Weather Mapping Engine (Leaflet.js)
// ==========================================================================

let desktopMap = null;
let mobileMap = null;

// Track active layers
let activeDesktopLayerName = 'clouds';
let activeMobileLayerName = 'clouds';

// Overlay groups
let desktopLayerGroup = null;
let mobileLayerGroup = null;

/**
 * Initialize both maps
 */
function initMaps() {
  // 1. Desktop Map
  const desktopMapEl = document.getElementById('weather-leaflet-map');
  if (desktopMapEl && !desktopMap) {
    desktopMap = L.map('weather-leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([51.505, -0.09], 10); // Default to London

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(desktopMap);

    desktopLayerGroup = L.layerGroup().addTo(desktopMap);

    // Desktop layer button click handlers
    const desktopBtns = document.querySelectorAll('.map-layer-btn');
    desktopBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        desktopBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const layer = btn.getAttribute('data-layer');
        const lat = window.currentLat || 51.5074;
        const lon = window.currentLon || -0.1278;
        switchMapLayer('desktop', layer, lat, lon, window.currentMetrics);
      });
    });
  }

  // 2. Mobile Simulator Map
  const mobileMapEl = document.getElementById('mobile-leaflet-map');
  if (mobileMapEl && !mobileMap) {
    mobileMap = L.map('mobile-leaflet-map', {
      zoomControl: false,
      scrollWheelZoom: true
    }).setView([51.505, -0.09], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mobileMap);

    mobileLayerGroup = L.layerGroup().addTo(mobileMap);

    // Mobile layer button click handlers
    const mobileBtns = document.querySelectorAll('.m-map-overlay-btn');
    mobileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        mobileBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const layer = btn.getAttribute('data-m-layer');
        const lat = window.currentLat || 51.5074;
        const lon = window.currentLon || -0.1278;
        switchMapLayer('mobile', layer, lat, lon, window.currentMetrics);
      });
    });
  }

  // Listen for window resize to force map updates
  window.addEventListener('resize', () => {
    if (desktopMap) desktopMap.invalidateSize();
    if (mobileMap) mobileMap.invalidateSize();
  });
}

/**
 * Centers maps on a target coordinate and redraws active weather layers
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} weatherMetrics - Current weather data for overlay rendering
 */
function updateMaps(lat, lon, weatherMetrics) {
  if (!desktopMap) initMaps();

  // Move views
  if (desktopMap) {
    desktopMap.setView([lat, lon], 10);
    drawWeatherLayers(desktopMap, desktopLayerGroup, activeDesktopLayerName, lat, lon, weatherMetrics);
    desktopMap.invalidateSize();
  }

  if (mobileMap) {
    mobileMap.setView([lat, lon], 9);
    drawWeatherLayers(mobileMap, mobileLayerGroup, activeMobileLayerName, lat, lon, weatherMetrics);
    mobileMap.invalidateSize();
  }
}

/**
 * Switch active overlay layer on a map
 * @param {string} scope - 'desktop' or 'mobile'
 * @param {string} layerName - 'clouds', 'rain', 'wind', 'temp'
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} weatherMetrics - Weather metrics
 */
function switchMapLayer(scope, layerName, lat, lon, weatherMetrics) {
  if (scope === 'desktop') {
    activeDesktopLayerName = layerName;
    if (desktopMap) {
      drawWeatherLayers(desktopMap, desktopLayerGroup, layerName, lat, lon, weatherMetrics);
    }
  } else {
    activeMobileLayerName = layerName;
    if (mobileMap) {
      drawWeatherLayers(mobileMap, mobileLayerGroup, layerName, lat, lon, weatherMetrics);
    }
  }
}

/**
 * Generates and draws simulated visual weather layer patterns on a Leaflet map
 */
function drawWeatherLayers(mapInstance, layerGroup, layerName, lat, lon, weatherMetrics) {
  if (!layerGroup) return;
  layerGroup.clearLayers();

  const tempVal = weatherMetrics ? weatherMetrics.temp : 20;
  const windVal = weatherMetrics ? weatherMetrics.wind : 15;
  const humidityVal = weatherMetrics ? weatherMetrics.humidity : 60;

  // Draw simulated representations based on active layer toggled
  if (layerName === 'clouds') {
    // CLOUDS LAYER: Cloud polygons drifting around
    const cloudColor = document.documentElement.getAttribute('data-theme') === 'light' ? '#64748b' : '#ffffff';
    const numClouds = 6;
    for (let i = 0; i < numClouds; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.15;
      const offsetLon = (Math.random() - 0.5) * 0.15;
      const radius = (0.02 + Math.random() * 0.04) * (humidityVal / 50);

      // Create fluffy circle polygons
      L.circle([lat + offsetLat, lon + offsetLon], {
        color: 'transparent',
        fillColor: cloudColor,
        fillOpacity: 0.15 + (Math.random() * 0.15),
        radius: radius * 111300 // Translate rough degree offset to meters
      }).addTo(layerGroup);
    }
  } 
  else if (layerName === 'rain') {
    // RAIN RADAR: Green/Yellow/Red storm cells indicating radar reflections
    const isRaining = tempVal < 35 && humidityVal > 70;
    const numCells = isRaining ? 5 : 2;
    const colors = ['#22c55e', '#f59e0b', '#ef4444']; // dbz levels

    for (let i = 0; i < numCells; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.1;
      const offsetLon = (Math.random() - 0.5) * 0.1;
      const baseRadius = 2500 + Math.random() * 5000;

      // Draw concentric circles to simulate core intensity layers
      L.circle([lat + offsetLat, lon + offsetLon], {
        color: colors[0],
        weight: 1,
        fillColor: colors[0],
        fillOpacity: 0.35,
        radius: baseRadius
      }).addTo(layerGroup);

      if (Math.random() > 0.4) {
        L.circle([lat + offsetLat, lon + offsetLon], {
          color: 'transparent',
          fillColor: colors[1],
          fillOpacity: 0.45,
          radius: baseRadius * 0.6
        }).addTo(layerGroup);
      }

      if (Math.random() > 0.7) {
        L.circle([lat + offsetLat, lon + offsetLon], {
          color: 'transparent',
          fillColor: colors[2],
          fillOpacity: 0.55,
          radius: baseRadius * 0.3
        }).addTo(layerGroup);
      }
    }
  } 
  else if (layerName === 'wind') {
    // WIND VECTOR ARROWS: Grid of directional vector elements
    const step = 0.04;
    const arrowColor = '#3b82f6';
    
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        const gridLat = lat + (x * step) + (Math.random() - 0.5) * 0.01;
        const gridLon = lon + (y * step) + (Math.random() - 0.5) * 0.01;

        // Custom icon representing a wind vector arrow
        const windAngle = weatherMetrics ? weatherMetrics.windDirection : 45;
        const len = 10 + (windVal / 5);

        const iconHtml = `<div style="transform: rotate(${windAngle}deg); width: ${len}px; height: 2px; background: ${arrowColor}; position: relative;">
          <div style="position: absolute; right: 0; top: -3px; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 6px solid ${arrowColor};"></div>
        </div>`;

        const windIcon = L.divIcon({
          className: 'custom-wind-icon',
          html: iconHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([gridLat, gridLon], { icon: windIcon }).addTo(layerGroup);
      }
    }
  } 
  else if (layerName === 'temp') {
    // TEMPERATURE HEATMAP: Thermal gradient spheres surrounding the area
    const step = 0.035;
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        const gridLat = lat + (x * step);
        const gridLon = lon + (y * step);
        
        // Add random variance to simulated local heat islands
        const localizedTemp = tempVal + (Math.random() - 0.5) * 4;
        
        let color = '#ef4444'; // Hot
        if (localizedTemp < 10) color = '#3b82f6'; // Cold
        else if (localizedTemp < 20) color = '#22d3ee'; // Cool
        else if (localizedTemp < 28) color = '#22c55e'; // Mild
        else if (localizedTemp < 34) color = '#f59e0b'; // Warm

        L.circle([gridLat, gridLon], {
          color: 'transparent',
          fillColor: color,
          fillOpacity: 0.22,
          radius: 4000
        }).addTo(layerGroup);
      }
    }
  }
}
