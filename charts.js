// ==========================================================================
// AeroCast AI - Data Visualization Engine (ApexCharts)
// ==========================================================================

// Chart instances list
const chartInstances = {};

/**
 * Returns common chart theme options based on current HTML theme
 */
function getChartThemeOptions() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    mode: isDark ? 'dark' : 'light',
    foreColor: isDark ? '#94a3b8' : '#475569',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
  };
}

/**
 * Update all charts to match the current theme
 */
function updateChartsTheme() {
  const t = getChartThemeOptions();
  Object.keys(chartInstances).forEach(key => {
    const chart = chartInstances[key];
    if (chart && typeof chart.updateOptions === 'function') {
      chart.updateOptions({
        theme: {
          mode: t.mode
        },
        grid: {
          borderColor: t.gridColor
        },
        tooltip: {
          theme: t.mode
        }
      });
    }
  });
}

/**
 * Initialize all charts with empty/dummy data
 */
function initCharts() {
  const t = getChartThemeOptions();

  // 1. Dashboard Main Quick Chart (Spline Area)
  const dashboardMainEl = document.querySelector("#dashboard-main-chart");
  if (dashboardMainEl) {
    const options = {
      series: [
        { name: 'Temperature', data: [20, 21, 23, 22, 21, 24, 25] },
        { name: 'Rain Probability', data: [10, 15, 8, 45, 12, 5, 2] }
      ],
      chart: {
        type: 'area',
        height: 250,
        background: 'transparent',
        toolbar: { show: false },
        parentHeightOffset: 0,
      },
      colors: ['#3B82F6', '#22D3EE'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: { borderColor: t.gridColor, strokeDashArray: 4 },
      theme: { mode: t.mode },
      xaxis: {
        categories: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'],
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: function (value) { return Math.round(value); }
        }
      },
      tooltip: { theme: t.mode }
    };
    chartInstances.dashboardMain = new ApexCharts(dashboardMainEl, options);
    chartInstances.dashboardMain.render();
  }

  // 2. Full Analytics Temp Trend Chart (Daily Min / Max)
  const analyticsTempEl = document.querySelector("#analytics-temp-chart");
  if (analyticsTempEl) {
    const options = {
      series: [
        { name: 'Max Temperature', data: [21, 24, 25, 22, 20, 23, 26] },
        { name: 'Min Temperature', data: [12, 14, 15, 13, 11, 12, 14] }
      ],
      chart: {
        type: 'line',
        height: 330,
        background: 'transparent',
        toolbar: { show: false }
      },
      colors: ['#EF4444', '#3B82F6'],
      stroke: { curve: 'smooth', width: 3, dashArray: [0, 5] },
      dataLabels: { enabled: false },
      markers: { size: 4, hover: { sizeOffset: 3 } },
      grid: { borderColor: t.gridColor, strokeDashArray: 4 },
      theme: { mode: t.mode },
      xaxis: {
        categories: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']
      },
      yaxis: {
        title: { text: 'Temperature (°C)' }
      },
      tooltip: { theme: t.mode }
    };
    chartInstances.analyticsTemp = new ApexCharts(analyticsTempEl, options);
    chartInstances.analyticsTemp.render();
  }

  // 3. Analytics Humidity & Rainfall Composite Chart
  const analyticsHumidityEl = document.querySelector("#analytics-humidity-chart");
  if (analyticsHumidityEl) {
    const options = {
      series: [
        { name: 'Relative Humidity', type: 'line', data: [62, 58, 65, 85, 70, 55, 52] },
        { name: 'Rainfall Volume (mm)', type: 'bar', data: [0, 0, 0.2, 8.4, 1.2, 0, 0] }
      ],
      chart: {
        height: 330,
        type: 'line',
        background: 'transparent',
        toolbar: { show: false }
      },
      colors: ['#60A5FA', '#22C55E'],
      stroke: { width: [3, 0] },
      grid: { borderColor: t.gridColor, strokeDashArray: 4 },
      theme: { mode: t.mode },
      labels: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'],
      xaxis: { type: 'category' },
      yaxis: [
        { title: { text: 'Humidity (%)' }, min: 0, max: 100 },
        { opposite: true, title: { text: 'Rainfall (mm)' } }
      ],
      tooltip: { theme: t.mode }
    };
    chartInstances.analyticsHumidity = new ApexCharts(analyticsHumidityEl, options);
    chartInstances.analyticsHumidity.render();
  }

  // 4. Analytics Wind Speed & Gusts Chart
  const analyticsWindEl = document.querySelector("#analytics-wind-chart");
  if (analyticsWindEl) {
    const options = {
      series: [
        { name: 'Wind Speed', data: [14, 18, 12, 28, 22, 10, 12] },
        { name: 'Wind Gusts', data: [22, 28, 19, 44, 34, 15, 18] }
      ],
      chart: {
        type: 'area',
        height: 280,
        background: 'transparent',
        toolbar: { show: false }
      },
      colors: ['#60A5FA', '#F59E0B'],
      stroke: { curve: 'straight', width: 2 },
      dataLabels: { enabled: false },
      grid: { borderColor: t.gridColor, strokeDashArray: 4 },
      theme: { mode: t.mode },
      xaxis: {
        categories: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']
      },
      yaxis: {
        title: { text: 'Wind Speed (km/h)' }
      },
      tooltip: { theme: t.mode }
    };
    chartInstances.analyticsWind = new ApexCharts(analyticsWindEl, options);
    chartInstances.analyticsWind.render();
  }

  // 5. Analytics Historical Comparison Chart
  const analyticsHistEl = document.querySelector("#analytics-historical-chart");
  if (analyticsHistEl) {
    const options = {
      series: [
        { name: 'June Historical Average', data: [19.5, 19.6, 19.8, 19.9, 20.1, 20.2, 20.3] },
        { name: 'Current Forecast Cycle', data: [21, 24, 25, 22, 20, 23, 26] }
      ],
      chart: {
        type: 'line',
        height: 280,
        background: 'transparent',
        toolbar: { show: false }
      },
      colors: ['#64748b', '#3B82F6'],
      stroke: { curve: 'smooth', width: [2, 3], dashArray: [5, 0] },
      dataLabels: { enabled: false },
      grid: { borderColor: t.gridColor, strokeDashArray: 4 },
      theme: { mode: t.mode },
      xaxis: {
        categories: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']
      },
      yaxis: {
        title: { text: 'Temperature (°C)' }
      },
      tooltip: { theme: t.mode }
    };
    chartInstances.analyticsHistorical = new ApexCharts(analyticsHistEl, options);
    chartInstances.analyticsHistorical.render();
  }
}

/**
 * Update the charts with new values fetched from the API
 * @param {Object} forecastData - The structured output forecast data
 */
function updateChartsWithWeatherData(forecastData) {
  const days = forecastData.dailyLabels;
  const maxTemps = forecastData.dailyTempMax;
  const minTemps = forecastData.dailyTempMin;
  const humidities = forecastData.dailyHumidity; // Simulated or calculated avg daily
  const rainProb = forecastData.dailyRainProbability;
  const rainSums = forecastData.dailyRainSum;
  const windMax = forecastData.dailyWindMax;
  const windGusts = forecastData.dailyWindGusts; // Computed gusts
  const historicalAvg = forecastData.dailyHistoricalAvg;

  // 1. Update Dashboard Main Quick Chart
  if (chartInstances.dashboardMain) {
    chartInstances.dashboardMain.updateOptions({
      xaxis: { categories: days }
    });
    chartInstances.dashboardMain.updateSeries([
      { name: 'Max Temp (°C)', data: maxTemps },
      { name: 'Rain Probability (%)', data: rainProb }
    ]);
  }

  // 2. Update Full Analytics Temp Chart
  if (chartInstances.analyticsTemp) {
    chartInstances.analyticsTemp.updateOptions({
      xaxis: { categories: days }
    });
    chartInstances.analyticsTemp.updateSeries([
      { name: 'Max Temperature', data: maxTemps },
      { name: 'Min Temperature', data: minTemps }
    ]);
  }

  // 3. Update Humidity & Rainfall Composite
  if (chartInstances.analyticsHumidity) {
    chartInstances.analyticsHumidity.updateOptions({
      labels: days
    });
    chartInstances.analyticsHumidity.updateSeries([
      { name: 'Relative Humidity', type: 'line', data: humidities },
      { name: 'Rainfall Volume (mm)', type: 'bar', data: rainSums }
    ]);
  }

  // 4. Update Wind chart
  if (chartInstances.analyticsWind) {
    chartInstances.analyticsWind.updateOptions({
      xaxis: { categories: days }
    });
    chartInstances.analyticsWind.updateSeries([
      { name: 'Wind Speed', data: windMax },
      { name: 'Wind Gusts', data: windGusts }
    ]);
  }

  // 5. Update Historical comparison chart
  if (chartInstances.analyticsHistorical) {
    chartInstances.analyticsHistorical.updateOptions({
      xaxis: { categories: days }
    });
    chartInstances.analyticsHistorical.updateSeries([
      { name: 'Historical Average', data: historicalAvg },
      { name: 'Current Forecast Cycle', data: maxTemps }
    ]);
  }
}

// ==========================================================================
// Chart Zoom Overlay System
// ==========================================================================

// Global container for the zoomed chart instance
window.zoomedChartInstance = null;

/**
 * Open the fullscreen modal and duplicate the requested chart options
 */
function openZoomedChart(chartKey, titleText) {
  const sourceChart = chartInstances[chartKey];
  if (!sourceChart) return;

  const modal = document.getElementById("chart-zoom-modal");
  const modalTitle = document.getElementById("zoom-modal-title");
  const container = document.getElementById("zoomed-chart-container");
  
  if (!modal || !container) return;

  modalTitle.innerText = titleText;
  container.innerHTML = "";
  modal.classList.add("active");

  // Fetch the configuration of the original ApexCharts instance
  const orig = sourceChart.w.config;
  
  // Clone options
  const zoomedOptions = {
    series: JSON.parse(JSON.stringify(orig.series)),
    chart: {
      type: orig.chart.type,
      height: '100%',
      background: 'transparent',
      toolbar: { show: true },
      animations: { enabled: true }
    },
    colors: orig.colors,
    stroke: orig.stroke,
    fill: orig.fill,
    grid: orig.grid,
    xaxis: orig.xaxis,
    yaxis: orig.yaxis,
    theme: orig.theme,
    labels: orig.labels,
    tooltip: orig.tooltip
  };

  // Render the zoomed duplicate chart
  const zoomedChart = new ApexCharts(container, zoomedOptions);
  zoomedChart.render();
  window.zoomedChartInstance = zoomedChart;
}

/**
 * Close the zoom overlay modal and dispose chart resource
 */
function closeZoomedChart() {
  const modal = document.getElementById("chart-zoom-modal");
  if (modal) modal.classList.remove("active");
  
  if (window.zoomedChartInstance) {
    window.zoomedChartInstance.destroy();
    window.zoomedChartInstance = null;
  }
}

// Initialise zoom listeners on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Bind close buttons
  const closeBtn = document.getElementById("close-zoom-modal-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeZoomedChart);
  }

  const modal = document.getElementById("chart-zoom-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeZoomedChart();
    });
  }

  // Hook desktop analytics full cards
  const fullCards = document.querySelectorAll(".chart-full-card");
  fullCards.forEach(card => {
    card.addEventListener("click", (e) => {
      const chartEl = card.querySelector("[id]");
      if (!chartEl) return;
      
      let key = "";
      if (chartEl.id === "analytics-temp-chart") key = "analyticsTemp";
      else if (chartEl.id === "analytics-humidity-chart") key = "analyticsHumidity";
      else if (chartEl.id === "analytics-wind-chart") key = "analyticsWind";
      else if (chartEl.id === "analytics-historical-chart") key = "analyticsHistorical";
      
      if (!key) return;
      const title = card.querySelector("h3").innerText;
      openZoomedChart(key, title);
    });
  });

  // Hook dashboard summary chart body
  const snapCard = document.querySelector(".chart-snapshot-card");
  if (snapCard) {
    const body = snapCard.querySelector(".card-body");
    if (body) {
      body.addEventListener("click", () => {
        openZoomedChart("dashboardMain", "AI Temperature & Precipitation Forecast");
      });
    }
  }
});
