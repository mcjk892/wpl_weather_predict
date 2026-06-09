# AeroCast AI - Weather Prediction & Analytics Dashboard

AeroCast AI is a premium, responsive meteorological dashboard and data science application built to deliver real-time forecast analytics, simulated AI weather models, interactive weather maps, and search history tracking. It features a secure login gateway, automated GPS user logging to a private spreadsheet, and high-fidelity ApexCharts visualizations.

---

## 🌟 Key Features

1. **Email Authorization Gateway:** Requires email validation to access the app, featuring glassmorphic forms and email format validation.
2. **Private Access Logs (`server.py`):** User logins (email, date, day, exact timestamp, coordinates, and reverse-geocoded GPS location name) are logged securely to a private local spreadsheet (`login_logs.csv`) suitable for Excel.
3. **Responsive SaaS Dashboard Layout:** Supports Dark and Light themes with fluid CSS layouts, glassmorphic styling, and auto-collapsing sidebars.
4. **Meteorological AI Forecast:** Locally computes tomorrow's forecast narrative, rain probability, temperature deltas, and prediction confidence levels.
5. **Interactive Weather Maps (Leaflet.js):** Centered on your coordinate view with overlays representing Clouds, Rain Radar, Wind Vectors, and Temperature Heatmaps.
6. **ApexCharts Visualizations:** Composite trend graphs analyzing Temperature trends, Humidity/Precipitation correlation, Wind gusts, and Historical average variance.
7. **Search History Database:** Dynamically stores search records in local storage. Focus on the search input to see your last 8 searched locations along with date and time stamps.
8. **On-Demand GPS Locate:** Dedicated locate buttons to refresh the weather using live coordinates on demand.

---

## 🎨 Technology Stack & Design System

- **Front-End**: Semantic HTML5, Vanilla CSS3 (Custom Glassmorphism and variables).
- **Backend / API Server**: Lightweight custom Python 3 server (`server.py`).
- **Icons**: Lucide Icons (Web CDN).
- **Charts**: ApexCharts (Splines, Areas, composite bar charts, and custom sparkline overlays).
- **Mapping**: Leaflet.js (Vector polygons, markers, and heatmap layer simulators).
- **APIs**:
  - Weather Feed: [Open-Meteo API](https://open-meteo.com/) (Real-time and 7-day outlooks).
  - Geocoding Search: [Nominatim OSM API](https://nominatim.org/) + major capitals local index fallback.

---

## 📁 File Structure

```
├── index.html       # Primary layout, sidebar tabs, mobile menus, and authorization overlay
├── style.css        # Responsive layouts, glassmorphism tokens, keyframe animations, and transitions
├── app.js           # Main state, API controllers, sparklines, search history, and authorization logic
├── charts.js        # High-resolution ApexCharts configurations & updates
├── map.js           # Leaflet Map initialiser and overlay renders (clouds, rain, wind, heat)
├── server.py        # Custom python server serving static files and handling POST logging requests
├── login_logs.csv   # Private CSV log database (excluded from git via .gitignore)
└── .gitignore       # Excludes local databases, CSV files, and logs from git control
```

---

## ⚙️ How to Run Locally

1. Make sure you have Python 3 installed.
2. Open your terminal in the project directory.
3. Start the custom server:
   ```bash
   python server.py
   ```
4. Open your web browser and navigate to `http://localhost:8080`.
5. Enter any valid email (e.g. `jenkins@aerocast.ai`) to log in. Allow GPS location permissions when prompted to automatically load local weather and write to the local Excel-compatible sheet.
