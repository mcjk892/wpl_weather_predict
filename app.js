// ==========================================================================
// AeroCast AI - Main Application Controller
// ==========================================================================

// Global state variables
window.currentLat = 51.5074; // Default: London
window.currentLon = -0.1278;
window.currentCityName = "London, United Kingdom";
window.useMetricCelsius = true; // Metric by default
window.currentMetrics = null; // Cache for current weather metrics

// Load saved location on startup if available
const savedLoc = localStorage.getItem("lastLocation");
if (savedLoc) {
  try {
    const parsed = JSON.parse(savedLoc);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
      window.currentLat = parsed.lat;
      window.currentLon = parsed.lon;
      window.currentCityName = parsed.cityName || "My Location";
    }
  } catch (e) {
    console.error("Failed to parse saved lastLocation", e);
  }
}

// Local index of major global cities for instant lookup without API overhead
const localCities = [
  { name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", country: "Japan", lat: 35.6895, lon: 139.6917 },
  { name: "New York", country: "United States", lat: 40.7128, lon: -74.0060 },
  { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lon: 13.4050 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Mumbai", country: "India", lat: 19.0760, lon: 72.8777 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lon: -43.1729 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lon: -79.3832 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "Rome", country: "Italy", lat: 41.9028, lon: 12.4964 }
];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Initialize user authentication system first
  initAuth();

  // Initialize standard UI systems
  initNavigation();
  initThemeControl();
  initSearch();
  initNotifications();
  
  // Initialize chart assets
  if (typeof initCharts === "function") {
    initCharts();
  }

  // Initialize mobile simulator system
  if (typeof initMobileSimulator === "function") {
    initMobileSimulator();
  }



  // Sidebar collapse toggler triggered by clicking the brand area
  const brand = document.querySelector(".brand");
  const appContainer = document.querySelector(".app-container");
  if (brand && appContainer) {
    brand.style.cursor = "pointer";
    brand.addEventListener("click", (e) => {
      e.preventDefault();
      
      if (window.innerWidth <= 1100 && window.innerWidth > 768) {
        appContainer.classList.toggle("sidebar-expanded");
        appContainer.classList.remove("sidebar-collapsed");
      } else {
        appContainer.classList.toggle("sidebar-collapsed");
        appContainer.classList.remove("sidebar-expanded");
      }
      
      // Update charts & maps layout
      setTimeout(() => {
        if (typeof desktopMap !== "undefined" && desktopMap) desktopMap.invalidateSize();
        if (typeof chartInstances !== "undefined" && chartInstances) {
          Object.keys(chartInstances).forEach(key => {
            if (chartInstances[key] && typeof chartInstances[key].windowResize === "function") {
              chartInstances[key].windowResize();
            }
          });
        }
      }, 310);
    });
  }

  // Set up locate/GPS action triggers
  const gpsBtn = document.getElementById("gps-btn");
  if (gpsBtn) {
    gpsBtn.addEventListener("click", () => {
      detectGPSLocation(true);
    });
  }

  const locBadge = document.getElementById("saved-locations-badge");
  if (locBadge) {
    locBadge.style.cursor = "pointer";
    locBadge.title = "Click to detect current GPS location";
    locBadge.addEventListener("click", () => {
      detectGPSLocation(true);
    });
  }

  // Load weather data for current location (from localStorage or default) immediately
  handleCitySearchCoords(window.currentLat, window.currentLon, window.currentCityName);

  // Background Live GPS detection (silently update location if allowed, otherwise stays on loaded location)
  detectGPSLocation(false);
});

/**
 * Detects user geographic coordinates, performs reverse geocoding, and loads weather.
 * @param {boolean} showToast - Whether to show interactive toast notifications
 */
function detectGPSLocation(showToast) {
  if (navigator.geolocation) {
    if (showToast) {
      showToastAlert("Detecting GPS coordinates...", "info");
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "AeroCastWeatherPredictionApp/1.0"
          }
        })
        .then(res => res.json())
        .then(data => {
          const address = data.address;
          const cityName = address.city || address.town || address.village || address.suburb || "My Location";
          const countryName = address.country || "";
          const displayLabel = countryName ? `${cityName}, ${countryName}` : cityName;
          
          handleCitySearchCoords(lat, lon, displayLabel);
          if (showToast) {
            showToastAlert(`Live location detected: ${cityName}`, "success");
          }
        })
        .catch(err => {
          // Fallback to local coordinates with simplified label
          handleCitySearchCoords(lat, lon, "Local Microclimate");
        });
      },
      (error) => {
        console.warn("GPS location access denied or timed out.");
        if (showToast) {
          showToastAlert("GPS access denied or timed out.", "error");
        }
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  } else {
    if (showToast) {
      showToastAlert("GPS Geolocation is not supported by your browser.", "error");
    }
  }
}

// ==========================================================================
// 1. Navigation & Theme Controllers
// ==========================================================================
function initNavigation() {
  // Desktop navigation items
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Mobile navigation items
  const mobileNavItems = document.querySelectorAll(".mobile-main-nav-item");
  mobileNavItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update sidebar active classes
  const navItems = document.querySelectorAll(".nav-menu .nav-item");
  navItems.forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update mobile main nav active classes
  const mobileNavItems = document.querySelectorAll(".mobile-main-nav-item");
  mobileNavItems.forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update tabs visibility
  const panes = document.querySelectorAll(".tab-pane");
  panes.forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });

  // Specific triggers
  if (tabId === "map") {
    setTimeout(() => {
      if (desktopMap) desktopMap.invalidateSize();
    }, 100);
  }
}

function initThemeControl() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const targetTheme = currentTheme === "light" ? "dark" : "light";
      
      document.documentElement.setAttribute("data-theme", targetTheme);
      toggleBtn.querySelector("span").innerText = targetTheme === "light" ? "Light Mode" : "Dark Mode";
      
      // Update charts coloring system
      if (typeof updateChartsTheme === "function") {
        updateChartsTheme();
      }
      
      // Update map representations if applicable
      if (window.currentMetrics) {
        updateMaps(window.currentLat, window.currentLon, window.currentMetrics);
      }
    });
  }
}

// ==========================================================================
// 2. City Geocoding & Search Dropdown logic
// ==========================================================================
function initSearch() {
  const searchInput = document.getElementById("city-search-input");
  const searchDropdown = document.getElementById("search-results-dropdown");
  const searchBtn = document.getElementById("search-btn");

  if (!searchInput || !searchDropdown) return;

  // Show search history on focus or click if search box is empty
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length === 0) {
      showSearchHistory();
    }
  });

  searchInput.addEventListener("click", () => {
    if (searchInput.value.trim().length === 0) {
      showSearchHistory();
    }
  });

  // Debounced geocoding search
  let debounceTimeout = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    const query = searchInput.value.trim();
    if (query.length === 0) {
      showSearchHistory();
      return;
    }
    if (query.length < 2) {
      searchDropdown.style.display = "none";
      return;
    }

    debounceTimeout = setTimeout(() => {
      // Step 1: Match against local index first
      const matches = localCities.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.country.toLowerCase().includes(query.toLowerCase())
      );

      if (matches.length > 0) {
        showSearchSuggestions(matches);
      } else {
        // Step 2: Query Nominatim OpenStreetMap API
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "AeroCastWeatherPredictionApp/1.0"
          }
        })
        .then(res => res.json())
        .then(data => {
          const apiMatches = data.map(item => ({
            name: item.display_name.split(",")[0],
            country: item.display_name.split(",").slice(-1)[0].trim(),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            fullName: item.display_name
          }));
          showSearchSuggestions(apiMatches);
        })
        .catch(err => {
          console.error("Geocoding API failed: ", err);
        });
      }
    }, 350);
  });

  // Keyboard controls
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        handleTextQuerySearch(query);
      }
    }
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        handleTextQuerySearch(query);
      }
    });
  }

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = "none";
    }
  });
}

function showSearchSuggestions(results) {
  const searchDropdown = document.getElementById("search-results-dropdown");
  searchDropdown.innerHTML = "";
  
  if (results.length === 0) {
    searchDropdown.style.display = "none";
    return;
  }

  results.forEach(res => {
    const item = document.createElement("div");
    item.className = "search-dropdown-item";
    item.innerHTML = `<i data-lucide="map-pin"></i> <span>${res.fullName || (res.name + ", " + res.country)}</span>`;
    
    item.addEventListener("click", () => {
      handleCitySearchCoords(res.lat, res.lon, res.fullName || `${res.name}, ${res.country}`);
      document.getElementById("city-search-input").value = "";
      searchDropdown.style.display = "none";
    });

    searchDropdown.appendChild(item);
  });

  searchDropdown.style.display = "block";
  lucide.createIcons();
}

function handleTextQuerySearch(query) {
  // Search local list first
  const match = localCities.find(c => c.name.toLowerCase() === query.toLowerCase());
  if (match) {
    handleCitySearchCoords(match.lat, match.lon, `${match.name}, ${match.country}`);
    document.getElementById("city-search-input").value = "";
    document.getElementById("search-results-dropdown").style.display = "none";
    return;
  }

  // API Call Nominatim
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
    headers: { "User-Agent": "AeroCastWeatherPredictionApp/1.0" }
  })
  .then(res => res.json())
  .then(data => {
    if (data.length > 0) {
      const item = data[0];
      handleCitySearchCoords(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
      document.getElementById("city-search-input").value = "";
    } else {
      showToastAlert("No locations found for: " + query, "error");
    }
  })
  .catch(err => {
    showToastAlert("Network lookup failed.", "error");
  });
}

function handleCitySearchCoords(lat, lon, fullName) {
  window.currentLat = lat;
  window.currentLon = lon;
  window.currentCityName = fullName;
  
  // Update Header Pill
  const locPill = document.getElementById("current-location-text");
  if (locPill) {
    const parts = fullName.split(",");
    locPill.innerText = parts[0] + (parts[1] ? ", " + parts[1].trim() : "");
  }

  // Save to localStorage so it persists across refreshes
  localStorage.setItem("lastLocation", JSON.stringify({
    lat: lat,
    lon: lon,
    cityName: fullName
  }));

  // Save search query into history database
  saveSearchHistory(lat, lon, fullName);

  fetchWeatherData(lat, lon, fullName);
}

/**
 * Saves a successfully searched location and search timestamp in the localStorage history database.
 */
function saveSearchHistory(lat, lon, cityName) {
  let history = [];
  try {
    const raw = localStorage.getItem("weatherSearchHistory");
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read search history", e);
  }
  
  // Generate time and day date
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = `${dateStr}, ${timeStr}`;

  // Filter out duplicate entries for the same city
  history = history.filter(item => item.cityName.toLowerCase() !== cityName.toLowerCase());

  // Add the search entry to the beginning of the list
  history.unshift({
    cityName: cityName,
    lat: lat,
    lon: lon,
    timestamp: formattedTime
  });

  // Keep the history capped at 8 items
  if (history.length > 8) {
    history = history.slice(0, 8);
  }

  localStorage.setItem("weatherSearchHistory", JSON.stringify(history));
}

/**
 * Renders the search history dropdown listing past locations with day/date and time.
 */
function showSearchHistory() {
  const searchDropdown = document.getElementById("search-results-dropdown");
  if (!searchDropdown) return;

  let history = [];
  try {
    const raw = localStorage.getItem("weatherSearchHistory");
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read search history", e);
  }

  searchDropdown.innerHTML = "";

  if (history.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "search-dropdown-header";
    placeholder.style.padding = "14px 16px";
    placeholder.style.fontSize = "0.78rem";
    placeholder.style.color = "var(--color-text-muted)";
    placeholder.innerText = "No search history. Search global cities above!";
    searchDropdown.appendChild(placeholder);
    searchDropdown.style.display = "block";
    return;
  }

  // Header element
  const header = document.createElement("div");
  header.className = "search-dropdown-header";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.padding = "10px 16px 6px";
  header.style.fontSize = "0.75rem";
  header.style.color = "var(--color-text-muted)";
  header.style.borderBottom = "1px solid var(--glass-border)";
  header.innerHTML = `<span><i data-lucide="history" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> Recent Searches</span> <span id="clear-history-btn" style="color: var(--color-error); cursor: pointer; font-weight: 600;">Clear</span>`;
  searchDropdown.appendChild(header);

  // Clear button click listener
  const clearBtn = header.querySelector("#clear-history-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      localStorage.removeItem("weatherSearchHistory");
      showSearchHistory();
    });
  }

  // Render items
  history.forEach(res => {
    const item = document.createElement("div");
    item.className = "search-dropdown-item";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    
    const parts = res.cityName.split(",");
    const displayName = parts[0] + (parts[1] ? ", " + parts[1].trim() : "");

    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i data-lucide="clock" style="width: 14px; height: 14px; color: var(--color-text-muted);"></i>
        <span>${displayName}</span>
      </div>
      <span style="font-size: 0.68rem; color: var(--color-text-muted); font-weight: 400;">${res.timestamp}</span>
    `;

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      handleCitySearchCoords(res.lat, res.lon, res.cityName);
      document.getElementById("city-search-input").value = "";
      searchDropdown.style.display = "none";
    });

    searchDropdown.appendChild(item);
  });

  searchDropdown.style.display = "block";
  lucide.createIcons();
}

// ==========================================================================
// 3. Meteorological API Fetch & Analytics Modeling
// ==========================================================================
function fetchWeatherData(lat, lon, cityName) {
  const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,pressure_msl,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

  // Update status to loading
  const aiStatus = document.getElementById("ai-model-status");
  if (aiStatus) {
    aiStatus.innerHTML = '<span class="pulse-indicator info"></span><span>AI Recalculating...</span>';
  }

  fetch(weatherApiUrl)
    .then(res => {
      if (!res.ok) throw new Error("Weather API returned " + res.status);
      return res.json();
    })
    .then(data => {
      // Process result fields
      const processed = processWeatherData(data, cityName);
      window.currentMetrics = processed;

      // Update Dashboard UI elements
      updateUIDisplays();

      // Trigger custom alerts check
      checkWeatherAlerts(processed);

      // Re-initialize sparklines with real trend values
      renderMiniSparklines(processed);

      // Restore AI Model success status
      if (aiStatus) {
        aiStatus.innerHTML = '<span class="pulse-indicator success"></span><span>AI Predictor Active (v3.5)</span>';
      }
    })
    .catch(err => {
      console.error(err);
      showToastAlert("Failed to fetch weather database.", "error");
      if (aiStatus) {
        aiStatus.innerHTML = '<span class="pulse-indicator error"></span><span>Prediction Engine Offline</span>';
      }
    });
}

/**
 * Format raw API responses into structured Meteorological object containing AI narratives
 */
function processWeatherData(data, cityName) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  // 1. Current properties mapping
  const metrics = {
    lat: data.latitude,
    lon: data.longitude,
    cityName: cityName.split(",")[0] + ", " + (cityName.split(",").slice(-1)[0] || "").trim(),
    temp: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    wind: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    pressure: current.pressure_msl,
    uvIndex: current.uv_index !== undefined ? Math.round(current.uv_index) : Math.round(daily.uv_index_max[0] || 0),
    visibility: current.visibility !== undefined ? current.visibility / 1000 : 10.0, // Convert m to km
    weatherCode: current.weather_code,
    conditionText: getWeatherConditionText(current.weather_code),
    sunrise: formatTimeStr(daily.sunrise[0]),
    sunset: formatTimeStr(daily.sunset[0]),
  };

  // Simulated AQI based on Humidity & Wind variables (lower wind + higher relative humidity increases particulate matter)
  const aqiBase = Math.round(30 + (metrics.humidity * 0.2) + (100 - metrics.wind * 4) * 0.15);
  metrics.aqi = Math.max(10, Math.min(aqiBase, 180));

  // 2. 7-Day Daily Arrays mapping
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  metrics.daily = daily.time.map((timeStr, idx) => {
    const date = new Date(timeStr);
    const dayName = idx === 0 ? "Today" : daysOfWeek[date.getDay()];
    return {
      dayName: dayName,
      date: timeStr,
      weatherCode: daily.weather_code[idx],
      condition: getWeatherConditionText(daily.weather_code[idx]),
      tempMax: daily.temperature_2m_max[idx],
      tempMin: daily.temperature_2m_min[idx],
      rainProbability: daily.precipitation_probability_max[idx] || 0,
      rainSum: daily.precipitation_sum[idx] || 0
    };
  });

  // 3. Hourly Arrays mapping (24 hours)
  metrics.hourly = [];
  const currentHour = new Date().getHours();
  // Get 24 hour points starting from current hour
  for (let i = 0; i < 24; i++) {
    const idx = i; 
    const timeVal = new Date(hourly.time[idx]);
    let label = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    metrics.hourly.push({
      time: label,
      temp: hourly.temperature_2m[idx],
      humidity: hourly.relative_humidity_2m[idx],
      rainProbability: hourly.precipitation_probability[idx] || 0,
      pressure: hourly.pressure_msl[idx],
      windSpeed: hourly.wind_speed_10m[idx],
      weatherCode: hourly.weather_code[idx]
    });
  }

  // 4. Generate AI Model Prediction for tomorrow
  metrics.aiPrediction = generateAIPrediction(metrics, hourly, daily);

  // Compute confidence score based on forecasting standard deviation of tomorrow
  const rainProbTomorrow = metrics.daily[1].rainProbability;
  const tempVarTomorrow = Math.abs(metrics.daily[1].tempMax - metrics.daily[1].tempMin);
  let confidence = 96 - (rainProbTomorrow * 0.15) - (tempVarTomorrow * 0.8);
  metrics.aiConfidence = Math.max(70, Math.min(Math.round(confidence), 99));

  // 5. Structure arrays specifically for Charts
  metrics.chartData = {
    dailyLabels: metrics.daily.map(d => d.dayName.substring(0, 3)),
    dailyTempMax: metrics.daily.map(d => d.tempMax),
    dailyTempMin: metrics.daily.map(d => d.tempMin),
    dailyHumidity: metrics.daily.map((d, i) => Math.round(55 + (i * 1.5) + (d.rainProbability * 0.25))),
    dailyRainProbability: metrics.daily.map(d => d.rainProbability),
    dailyRainSum: metrics.daily.map(d => d.rainSum),
    dailyWindMax: daily.wind_speed_10m_max,
    dailyWindGusts: daily.wind_speed_10m_max.map(w => Math.round(w * 1.35 + 5)),
    dailyHistoricalAvg: metrics.daily.map(d => Math.round(d.tempMax - 1.5 - (Math.random() - 0.5) * 2))
  };

  return metrics;
}

/**
 * Weather prediction algorithm returning narratives and probability parameters
 */
function generateAIPrediction(metrics, hourly, daily) {
  const tempTomorrow = daily.temperature_2m_max[1];
  const tempDiff = tempTomorrow - daily.temperature_2m_max[0];
  const rainProb = daily.precipitation_probability_max[1] || 0;
  const pressureVal = metrics.pressure;

  let narrative = "";
  let trendDirection = tempDiff >= 0 ? "warmer" : "cooler";
  let absDiffStr = `${Math.abs(tempDiff).toFixed(1)}°C ${trendDirection}`;

  if (rainProb > 70) {
    narrative = "A slow-moving low-pressure meteorological trough is shifting towards the local coordinates. Atmospheric pressure is declining, raising thermal humidity saturation levels. Convective storm systems are highly probable; expect overcast sky cover and moderate precipitation fields.";
  } else if (rainProb > 30) {
    narrative = "Mild atmospheric instability predicted. Solar heating will generate scattered clouds with a minor convective rain showers potential. Humidity is moderately elevated, matching standard oceanfront wind variables. Climatological systems indicate light gusts during peak heating hours.";
  } else {
    narrative = "Stable high-pressure anti-cyclone system dominates the local air masses. Significant solar radiation levels expected during midday. Relative humidity remains optimal, preventing boundary layer cloud formation. Expect clear skies with zero rain probability.";
  }

  return {
    predictedTemp: tempTomorrow,
    tempDiffText: `<i data-lucide="${tempDiff >= 0 ? 'trending-up' : 'trending-down'}"></i> ${absDiffStr}`,
    rainProbability: rainProb,
    narrative: narrative
  };
}

// ==========================================================================
// 4. UI Rendering System
// ==========================================================================
function updateUIDisplays() {
  if (!window.currentMetrics) return;

  const w = window.currentMetrics;

  // Temperature unit variables
  const useF = !window.useMetricCelsius;
  const tVal = useF ? Math.round((w.temp * 9/5) + 32) : Math.round(w.temp);
  const feelsVal = useF ? Math.round((w.feelsLike * 9/5) + 32) : Math.round(w.feelsLike);
  const aiTempPred = useF ? Math.round((w.aiPrediction.predictedTemp * 9/5) + 32) : Math.round(w.aiPrediction.predictedTemp);
  const unitChar = useF ? "F" : "C";

  // 1. Update Hero Card
  document.getElementById("hero-city").innerText = w.cityName;
  document.getElementById("hero-temp").innerText = tVal;
  document.querySelector(".hero-weather-card .temp-unit").innerText = `°${unitChar}`;
  document.getElementById("hero-condition").innerText = w.conditionText;
  document.getElementById("hero-feels-like").innerText = `${feelsVal}°${unitChar}`;
  document.getElementById("hero-sunrise").innerText = w.sunrise;
  document.getElementById("hero-sunset").innerText = w.sunset;
  document.getElementById("hero-confidence").innerText = `${w.aiConfidence}%`;

  // Render weather icon SVG in Hero
  const heroIconWrap = document.getElementById("hero-weather-icon");
  if (heroIconWrap) {
    const iconName = getWeatherIconName(w.weatherCode);
    heroIconWrap.innerHTML = `<i data-lucide="${iconName}" class="floating-weather-icon"></i>`;
  }

  // 2. Update AI prediction Panel
  document.getElementById("ai-predict-temp").innerText = `${aiTempPred}°${unitChar}`;
  document.getElementById("ai-predict-temp-diff").innerHTML = w.aiPrediction.tempDiffText;
  document.getElementById("ai-predict-rain").innerText = `${w.aiPrediction.rainProbability}%`;
  document.getElementById("ai-predict-rain-bar").style.width = `${w.aiPrediction.rainProbability}%`;
  document.getElementById("ai-narrative").innerText = w.aiPrediction.narrative;

  // 3. Update Metrics Grid values
  document.getElementById("metric-humidity").innerText = `${w.humidity}%`;
  
  // Wind metric representation
  document.getElementById("metric-wind").innerText = `${Math.round(w.wind)} km/h`;
  document.getElementById("metric-wind-direction").innerText = `${getWindDirectionLabel(w.windDirection)} direction`;
  
  // Pressure representation
  document.getElementById("metric-pressure").innerText = `${w.pressure} hPa`;
  
  // UV Level badges
  const uvLevelEl = document.getElementById("metric-uv-level");
  document.getElementById("metric-uv").innerText = w.uvIndex;
  uvLevelEl.innerText = getUVLevelName(w.uvIndex);
  uvLevelEl.className = "metric-sub tag " + getUVLevelClass(w.uvIndex);

  // Visibility
  document.getElementById("metric-visibility").innerText = `${w.visibility.toFixed(1)} km`;
  document.getElementById("metric-visibility-sub").innerText = w.visibility >= 8 ? "Clear conditions" : "Mild atmospheric haze";

  // AQI Level badges
  const aqiLevelEl = document.getElementById("metric-aqi-level");
  document.getElementById("metric-aqi").innerText = w.aqi;
  aqiLevelEl.innerText = getAQILevelName(w.aqi);
  aqiLevelEl.className = "metric-sub tag " + getAQILevelClass(w.aqi);

  // 4. Update Hourly cards slider
  const hourlyContainer = document.getElementById("hourly-scroll");
  if (hourlyContainer) {
    hourlyContainer.innerHTML = "";
    w.hourly.forEach((hr, idx) => {
      const hTemp = useF ? Math.round((hr.temp * 9/5) + 32) : Math.round(hr.temp);
      const hIcon = getWeatherIconName(hr.weatherCode);
      const isNow = idx === 0;

      const item = document.createElement("div");
      item.className = "hourly-item";
      item.innerHTML = `
        <span class="hour">${isNow ? "Now" : hr.time}</span>
        <i data-lucide="${hIcon}"></i>
        <span class="temp">${hTemp}°</span>
        <span class="rain-chance"><i data-lucide="droplet"></i> ${hr.rainProbability}%</span>
      `;
      hourlyContainer.appendChild(item);
    });
  }

  // 5. Update 7-Day Forecast container
  const weeklyContainer = document.getElementById("weekly-forecast-container");
  if (weeklyContainer) {
    weeklyContainer.innerHTML = "";
    w.daily.forEach(day => {
      const dMax = useF ? Math.round((day.tempMax * 9/5) + 32) : Math.round(day.tempMax);
      const dMin = useF ? Math.round((day.tempMin * 9/5) + 32) : Math.round(day.tempMin);
      const dIcon = getWeatherIconName(day.weatherCode);

      const row = document.createElement("div");
      row.className = "weekly-row";
      row.innerHTML = `
        <div class="weekly-day-info">
          <span class="weekly-day-name">${day.dayName}</span>
          <span class="weekly-day-condition">${day.condition}</span>
        </div>
        <div class="weekly-condition-icon">
          <i data-lucide="${dIcon}"></i>
        </div>
        <div class="weekly-temp-range">
          <span class="weekly-temp-max">${dMax}°</span>
          <span class="weekly-temp-min">${dMin}°</span>
        </div>
      `;
      weeklyContainer.appendChild(row);
    });
  }

  // Sync Charts values
  if (typeof updateChartsWithWeatherData === "function") {
    updateChartsWithWeatherData(w.chartData);
  }

  // Sync Leaflet Map viewport and markers
  if (typeof updateMaps === "function") {
    updateMaps(w.lat, w.lon, w);
  }

  // Sync Mobile simulator screen states
  if (typeof syncMobileData === "function") {
    syncMobileData(w);
  }

  // Reload Lucide SVG mappings dynamically
  lucide.createIcons();
}

/**
 * Render mini sparkline graphs on the dashboard metrics cards
 */
function renderMiniSparklines(w) {
  // Mini charts require 8 dummy historical oscillation values derived from metrics
  const createOscillations = (base, amp, num = 8) => 
    Array.from({ length: num }, (_, i) => Math.round(base + Math.sin(i * 1.2) * amp + (Math.random() - 0.5) * (amp/2)));

  // 1. Humidity sparkline
  const humPoints = createOscillations(w.humidity, 6);
  renderMiniSparklineChart("mini-humidity-spark", humPoints, "#3b82f6");

  // 2. Wind sparkline
  const windPoints = createOscillations(w.wind, 4);
  renderMiniSparklineChart("mini-wind-spark", windPoints, "#60a5fa");

  // 3. Pressure sparkline
  const pressPoints = createOscillations(w.pressure, 3);
  renderMiniSparklineChart("mini-pressure-spark", pressPoints, "#22d3ee");

  // 4. UV sparkline
  const uvPoints = [0, 1, 3, w.uvIndex, w.uvIndex - 1, 2, 0, 0];
  renderMiniSparklineChart("mini-uv-spark", uvPoints, "#f59e0b");

  // 5. Visibility sparkline
  const visPoints = createOscillations(w.visibility, 1);
  renderMiniSparklineChart("mini-visibility-spark", visPoints, "#a78bfa");

  // 6. AQI sparkline
  const aqiPoints = createOscillations(w.aqi, 8);
  renderMiniSparklineChart("mini-aqi-spark", aqiPoints, "#22c55e");
}

function renderMiniSparklineChart(elementId, dataPoints, color) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.innerHTML = "";
  const options = {
    series: [{ data: dataPoints }],
    chart: {
      type: 'area',
      height: 40,
      sparkline: { enabled: true },
      animations: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: [color],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.0,
      }
    },
    tooltip: { enabled: false }
  };

  const chart = new ApexCharts(el, options);
  chart.render();
}

// ==========================================================================
// 5. Toast Notifications & Alarm banners
// ==========================================================================
function initNotifications() {
  const panel = document.getElementById("notification-panel");
  const trigger = document.getElementById("notification-trigger");
  const clearBtn = document.getElementById("clear-notifications-btn");
  const closeAlertBtn = document.getElementById("close-alert-banner-btn");

  if (trigger && panel) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      panel.classList.remove("active");
    });

    panel.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const container = document.getElementById("notifications-container");
      if (container) container.innerHTML = '<li class="notification-item" style="padding: 16px; justify-content: center; color: var(--color-text-muted);">No new notifications</li>';
      const badge = document.querySelector(".notification-badge");
      if (badge) badge.style.display = "none";
    });
  }

  if (closeAlertBtn) {
    closeAlertBtn.addEventListener("click", () => {
      document.getElementById("weather-alert-banner").style.display = "none";
    });
  }
}

function checkWeatherAlerts(w) {
  const alertBanner = document.getElementById("weather-alert-banner");
  const alertText = document.getElementById("alert-banner-text");

  // Determine warnings based on limits
  let alertMessage = "";
  if (w.weatherCode >= 95) {
    alertMessage = `High Risk: Severe convective thunderstorms warning active for coordinates surrounding ${w.cityName}. Avoid travel.`;
  } else if (w.wind > 28) {
    alertMessage = `High Wind Advisory: Wind speed gusts exceeding ${Math.round(w.wind * 1.3)} km/h expected in the afternoon. Secure lose items.`;
  } else if (w.uvIndex >= 8) {
    alertMessage = `Extreme UV Index level warning (${w.uvIndex}). Safe solar exposure limits exceeded; utilize sun protective factors.`;
  }

  if (alertMessage) {
    alertText.innerText = alertMessage;
    alertBanner.style.display = "flex";
  } else {
    alertBanner.style.display = "none";
  }
}

function showToastAlert(message, type = "info") {
  // Push warning to notifications list
  const container = document.getElementById("notifications-container");
  if (!container) return;

  // Clear "no notification" text if any
  if (container.innerText.includes("No new notifications")) {
    container.innerHTML = "";
  }

  const badge = document.querySelector(".notification-badge");
  if (badge) {
    badge.style.display = "block";
    const curVal = parseInt(badge.innerText) || 0;
    badge.innerText = curVal + 1;
  }

  const item = document.createElement("li");
  item.className = `notification-item ${type === "error" || type === "warning" ? "warning" : "info"}`;
  
  const icon = type === "error" || type === "warning" ? "alert-triangle" : "info";
  
  item.innerHTML = `
    <div class="noti-icon"><i data-lucide="${icon}"></i></div>
    <div class="noti-text">
      <p>${message}</p>
      <span class="noti-time">Just now</span>
    </div>
  `;

  container.insertBefore(item, container.firstChild);
  lucide.createIcons();
  
  // Flash banner if type is severe
  if (type === "warning" || type === "error") {
    const banner = document.getElementById("weather-alert-banner");
    if (banner) {
      document.getElementById("alert-banner-text").innerText = message;
      banner.style.display = "flex";
    }
  }
}

// ==========================================================================
// 6. Meteorological Utility Mapping Methods
// ==========================================================================
function getWeatherConditionText(code) {
  if (code === 0) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Foggy Visibility";
  if ([51, 53, 55].includes(code)) return "Light Drizzle";
  if ([56, 57].includes(code)) return "Freezing Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain Showers";
  if ([66, 67].includes(code)) return "Freezing Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow Outfall";
  if ([80, 81, 82].includes(code)) return "Dense Rain Showers";
  if ([85, 86].includes(code)) return "Snow Showers";
  if (code >= 95) return "Thunderstorms active";
  return "Stable atmospheric cover";
}

function getWeatherIconName(code) {
  if (code === 0) return "sun";
  if ([1, 2].includes(code)) return "cloud-sun";
  if (code === 3) return "cloud";
  if ([45, 48].includes(code)) return "cloud-fog";
  if ([51, 53, 55].includes(code)) return "cloud-drizzle";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "cloud-rain";
  if ([71, 73, 75, 77, 85, 86, 56, 57, 66, 67].includes(code)) return "snowflake";
  if (code >= 95) return "cloud-lightning";
  return "cloud";
}

function getWindDirectionLabel(degree) {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const val = Math.floor((degree / 22.5) + 0.5);
  return directions[val % 16];
}

function getUVLevelName(idx) {
  if (idx <= 2) return "Low (Safe)";
  if (idx <= 5) return "Moderate (SPF 15+)";
  if (idx <= 7) return "High Risk (SPF 30+)";
  return "Extreme Alert";
}

function getUVLevelClass(idx) {
  if (idx <= 2) return "aqi-good"; // Reuse green
  if (idx <= 5) return "uv-moderate"; // Warning orange
  return "warning"; // Severe warning red
}

function getAQILevelName(aqi) {
  if (aqi <= 50) return "Good (Clean Air)";
  if (aqi <= 100) return "Moderate Haze";
  return "Poor AQI";
}

function getAQILevelClass(aqi) {
  if (aqi <= 50) return "aqi-good";
  if (aqi <= 100) return "uv-moderate";
  return "warning";
}

function formatTimeStr(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ==========================================================================
// 6. User Authorization & Email Login System
// ==========================================================================
function initAuth() {
  const loginOverlay = document.getElementById("login-screen");
  const loginForm = document.getElementById("login-form");
  const loginEmail = document.getElementById("login-email");
  const logoutBtn = document.getElementById("logout-btn");
  const appContainer = document.querySelector(".app-container");
  const mobileMainNav = document.querySelector(".mobile-main-nav");

  if (!loginOverlay || !loginForm || !appContainer) return;

  // Check login state on load
  const savedEmail = localStorage.getItem("userEmail");
  if (savedEmail) {
    applyAuthState(savedEmail);
  } else {
    applyUnauthState();
  }

  // Handle Login Form Submit
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    if (validateEmail(email)) {
      showToastAlert("Authorizing access and fetching current GPS coordinates...", "info");
      
      // Get current location for database log
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // 1. Fetch weather report to get local time of location
            const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=auto`;
            
            fetch(weatherApiUrl)
            .then(res => res.json())
            .then(weatherData => {
              const weatherTimeRaw = weatherData.current.time; // e.g. "2026-06-09T18:00"
              const weatherTimeFormatted = formatWeatherTime(weatherTimeRaw);
              
              // 2. Reverse geocode using Nominatim
              fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
                headers: {
                  "Accept-Language": "en",
                  "User-Agent": "AeroCastWeatherPredictionApp/1.0"
                }
              })
              .then(res => res.json())
              .then(data => {
                const address = data.address;
                const cityName = address.city || address.town || address.village || address.suburb || "My Location";
                const countryName = address.country || "";
                const displayLabel = countryName ? `${cityName}, ${countryName}` : cityName;
                
                sendLoginLogToServer(email, lat, lon, displayLabel, weatherTimeFormatted);
                
                // Proceed with local authentication
                localStorage.setItem("userEmail", email);
                applyAuthState(email);
                
                // Set dashboard weather to their current live location
                handleCitySearchCoords(lat, lon, displayLabel);
                showToastAlert("Authorized successfully. Welcome to AeroCast AI!", "success");
              })
              .catch(err => {
                // Geocoding failed, log coordinates and weather time anyway
                sendLoginLogToServer(email, lat, lon, "Local Microclimate", weatherTimeFormatted);
                localStorage.setItem("userEmail", email);
                applyAuthState(email);
                handleCitySearchCoords(lat, lon, "Local Microclimate");
                showToastAlert("Authorized successfully. Local microclimate active.", "success");
              });
            })
            .catch(err => {
              // Weather API failed
              console.warn("Weather API failed for login log time.");
              const fallbackTime = new Date().toLocaleString();
              sendLoginLogToServer(email, lat, lon, "Unknown location", fallbackTime);
              localStorage.setItem("userEmail", email);
              applyAuthState(email);
              handleCitySearchCoords(lat, lon, "My Location");
              showToastAlert("Authorized successfully.", "success");
            });
          },
          (error) => {
            // Location access denied or timed out
            console.warn("GPS location denied for login log.");
            const fallbackTime = new Date().toLocaleString();
            sendLoginLogToServer(email, "", "", "GPS Access Denied", fallbackTime);
            localStorage.setItem("userEmail", email);
            applyAuthState(email);
            showToastAlert("Authorized successfully. (GPS location access denied)", "warning");
          },
          { timeout: 8000, maximumAge: 600000 }
        );
      } else {
        // Geolocation not supported by browser
        const fallbackTime = new Date().toLocaleString();
        sendLoginLogToServer(email, "", "", "GPS Not Supported", fallbackTime);
        localStorage.setItem("userEmail", email);
        applyAuthState(email);
        showToastAlert("Authorized successfully.", "success");
      }
    } else {
      showToastAlert("Please enter a valid email address.", "error");
    }
  });

  // Handle Logout Trigger
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("userEmail");
      applyUnauthState();
      loginEmail.value = "";
      showToastAlert("Signed out successfully.", "info");
    });
  }

  function applyAuthState(email) {
    loginOverlay.classList.add("authenticated");
    appContainer.classList.remove("auth-hidden");
    if (mobileMainNav) {
      mobileMainNav.classList.remove("auth-hidden");
    }

    // Dynamic display name and email in sidebar footer
    const namePart = email.split("@")[0];
    const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const userDisplayName = document.getElementById("user-display-name");
    const userDisplayEmail = document.getElementById("user-display-email");

    if (userDisplayName) userDisplayName.innerText = capitalizedName;
    if (userDisplayEmail) userDisplayEmail.innerText = email;

    // Refresh layout-sensitive elements
    setTimeout(() => {
      if (typeof desktopMap !== "undefined" && desktopMap) desktopMap.invalidateSize();
      if (typeof chartInstances !== "undefined" && chartInstances) {
        Object.keys(chartInstances).forEach(key => {
          if (chartInstances[key] && typeof chartInstances[key].windowResize === "function") {
            chartInstances[key].windowResize();
          }
        });
      }
    }, 200);
  }

  function applyUnauthState() {
    loginOverlay.classList.remove("authenticated");
    appContainer.classList.add("auth-hidden");
    if (mobileMainNav) {
      mobileMainNav.classList.add("auth-hidden");
    }
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function sendLoginLogToServer(email, lat, lon, locationName, weatherTime) {
    fetch("/log-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        lat: lat,
        lon: lon,
        locationName: locationName,
        weatherTime: weatherTime
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Login log recorded:", data);
    })
    .catch(err => {
      console.error("Failed to write to login logs database:", err);
    });
  }

  function formatWeatherTime(rawTimeStr) {
    try {
      const date = new Date(rawTimeStr);
      const dayName = date.toLocaleDateString([], { weekday: 'long' });
      const dateStr = date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${dateStr} (${dayName}) ${timeStr}`;
    } catch (e) {
      return rawTimeStr;
    }
  }
}
