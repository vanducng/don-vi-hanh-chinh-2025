// Global variables
let data = null;
let map = null;
let provincesLayer = null;
let searchTimeout = null;
let searchIndex = null; // Pre-built search index for performance
let currentFilters = new Set(); // Current merger filters (inclusive)

// Vietnam provinces coordinates (simplified for demonstration)
const provinceCoordinates = {
  "Hà Nội": [21.0285, 105.8542],
  "TP HCM": [10.8231, 106.6297],
  "Đà Nẵng": [16.0544, 108.2022],
  "Hải Phòng": [20.8449, 106.6881],
  "Cần Thơ": [10.0452, 105.7469],
  "An Giang": [10.5216, 105.1259],
  "Bà Rịa - Vũng Tàu": [10.5417, 107.2429],
  "Bắc Giang": [21.2819, 106.1975],
  "Bắc Kạn": [22.1443, 105.8345],
  "Bạc Liêu": [9.294, 105.7215],
  "Bắc Ninh": [21.1214, 106.111],
  "Bến Tre": [10.2415, 106.3759],
  "Bình Định": [13.783, 109.2197],
  "Bình Dương": [11.1654, 106.6518],
  "Bình Phước": [11.7512, 106.7235],
  "Bình Thuận": [10.9279, 108.0721],
  "Cà Mau": [9.1771, 105.1522],
  "Cao Bằng": [22.6356, 106.2522],
  "Đắk Lắk": [12.71, 108.2378],
  "Đắk Nông": [12.2646, 107.6098],
  "Điện Biên": [21.386, 103.0166],
  "Đồng Nai": [10.9467, 107.2429],
  "Đồng Tháp": [10.4938, 105.6882],
  "Gia Lai": [13.9833, 108.0],
  "Hà Giang": [22.8026, 104.9784],
  "Hà Nam": [20.5835, 105.923],
  "Hà Tĩnh": [18.342, 105.9057],
  "Hải Dương": [20.9373, 106.3146],
  "Hậu Giang": [9.7579, 105.6412],
  "Hòa Bình": [20.8133, 105.3384],
  "Hưng Yên": [20.6464, 106.0514],
  "Khánh Hòa": [12.2388, 109.1967],
  "Kiên Giang": [10.0125, 105.0809],
  "Kon Tum": [14.3498, 108.0005],
  "Lai Châu": [22.3864, 103.4703],
  "Lâm Đồng": [11.9405, 108.4419],
  "Lạng Sơn": [21.8537, 106.7617],
  "Lào Cai": [22.481, 103.9755],
  "Long An": [10.6956, 106.2431],
  "Nam Định": [20.4174, 106.1682],
  "Nghệ An": [18.6701, 105.6813],
  "Ninh Bình": [20.2539, 105.9745],
  "Ninh Thuận": [11.5753, 108.9889],
  "Phú Thọ": [21.3014, 105.2417],
  "Phú Yên": [13.0955, 109.3207],
  "Quảng Bình": [17.4694, 106.6226],
  "Quảng Nam": [15.5394, 108.0191],
  "Quảng Ngãi": [15.1203, 108.8044],
  "Quảng Ninh": [21.0064, 107.2925],
  "Quảng Trị": [16.8169, 107.1],
  "Sóc Trăng": [9.6004, 105.98],
  "Sơn La": [21.3256, 103.9188],
  "Tây Ninh": [11.3135, 106.098],
  "Thái Bình": [20.4463, 106.3366],
  "Thái Nguyên": [21.5928, 105.8442],
  "Thanh Hóa": [19.8067, 105.7851],
  "Thừa Thiên Huế": [16.4674, 107.5905],
  "Tiền Giang": [10.4493, 106.342],
  "Trà Vinh": [9.9347, 106.3455],
  "Tuyên Quang": [21.8237, 105.214],
  "Vĩnh Long": [10.2395, 105.9722],
  "Vĩnh Phúc": [21.3089, 105.6047],
  "Yên Bái": [21.7168, 104.8986],
};

// Initialize the application
async function init() {
  try {
    // Show loading
    document.getElementById("loading").style.display = "flex";

    // Load data
    const response = await fetch("data.json");
    data = await response.json();

    // Update statistics
    updateStatistics();

    // Initialize map
    initMap();

    // Build search index for performance
    buildSearchIndex();

    // Initialize charts
    initCharts();

    // Setup search
    setupSearch();

    // Setup download functionality
    setupDownload();

    // Setup filter functionality
    setupFilter();

    // Setup fullscreen map
    setupFullscreenMap();

    // Hide loading
    document.getElementById("loading").style.display = "none";
  } catch (error) {
    console.error("Error initializing app:", error);
    alert("Lỗi khi tải dữ liệu. Vui lòng thử lại!");
  }
}

// Update statistics cards
function updateStatistics() {
  document.getElementById("total-units").textContent =
    data.statistics.total_units.toLocaleString("vi-VN");
  document.getElementById("total-provinces").textContent =
    data.statistics.total_provinces;
  document.getElementById("merged-units").textContent =
    data.statistics.total_merged.toLocaleString("vi-VN");
  document.getElementById("unchanged-units").textContent =
    data.statistics.total_unchanged;
}

// Initialize map
function initMap() {
  // Create map with proper bounds for Vietnam and custom zoom control position
  map = L.map("map", {
    zoomControl: false, // Disable default zoom control
  });

  // Add zoom control to bottom-right
  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  // Set bounds to show entire Vietnam (from north to south)
  const vietnamBounds = [
    [8.0, 102.0], // Southwest coordinates
    [23.5, 110.0], // Northeast coordinates
  ];

  map.fitBounds(vietnamBounds);
  map.setMaxBounds(vietnamBounds);

  // Add tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Add province markers
  addProvinceMarkers();
}

// Add province markers to map
function addProvinceMarkers() {
  provincesLayer = L.layerGroup().addTo(map);

  // Find max units for color scaling
  const maxUnits = Math.max(...data.provinces.map((p) => p.total_units));

  // Use requestAnimationFrame for better performance
  let index = 0;
  function addBatch() {
    const batchSize = 5; // Add 5 provinces at a time
    for (
      let i = 0;
      i < batchSize && index < data.provinces.length;
      i++, index++
    ) {
      const province = data.provinces[index];
      const coords = provinceCoordinates[province.name];
      if (coords) {
        // Calculate color intensity based on number of units
        const intensity = province.total_units / maxUnits;
        const color = getColorForIntensity(intensity);

        // Create circle marker
        const marker = L.circleMarker(coords, {
          radius: 8 + (province.total_units / maxUnits) * 15,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        // Add popup
        const popupContent = `
                    <div class="popup-content">
                        <div class="popup-title">${province.name}</div>
                        <div class="popup-stat">
                            <span>Tổng đơn vị:</span>
                            <strong>${province.total_units}</strong>
                        </div>
                        <div class="popup-stat">
                            <span>Sáp nhập:</span>
                            <strong>${province.merged_units}</strong>
                        </div>
                        <div class="popup-stat">
                            <span>Không đổi:</span>
                            <strong>${province.unchanged_units}</strong>
                        </div>
                        <button class="popup-button" onclick="showProvinceDetails('${province.id}')">
                            Xem chi tiết
                        </button>
                    </div>
                `;

        marker.bindPopup(popupContent);
        marker.addTo(provincesLayer);
      }
    }

    if (index < data.provinces.length) {
      requestAnimationFrame(addBatch);
    }
  }

  requestAnimationFrame(addBatch);
}

// Get color based on intensity
function getColorForIntensity(intensity) {
  if (intensity > 0.7) return "#8B0000";
  if (intensity > 0.4) return "#FF6B6B";
  return "#FFE5E5";
}

// Initialize charts
function initCharts() {
  // Top provinces chart
  const topProvinces = data.provinces.slice(0, 15);
  const topProvincesCtx = document
    .getElementById("top-provinces-chart")
    .getContext("2d");

  const topProvincesChart = new Chart(topProvincesCtx, {
    type: "bar",
    data: {
      labels: topProvinces.map((p) => p.name),
      datasets: [
        {
          label: "Số đơn vị hành chính",
          data: topProvinces.map((p) => p.total_units),
          backgroundColor: topProvinces.map((p, index) => {
            if (index < 3) return "#e74c3c"; // Top 3 in red
            if (index < 10) return "#3498db"; // Top 4-10 in blue
            return "#95a5a6"; // Top 11-15 in gray
          }),
          borderColor: topProvinces.map((p, index) => {
            if (index < 3) return "#c0392b"; // Top 3 in dark red
            if (index < 10) return "#2980b9"; // Top 4-10 in dark blue
            return "#7f8c8d"; // Top 11-15 in dark gray
          }),
          borderWidth: 1,
          hoverBackgroundColor: topProvinces.map((p, index) => {
            if (index < 3) return "#d62c1a"; // Top 3 hover
            if (index < 10) return "#2471a3"; // Top 4-10 hover
            return "#85929e"; // Top 11-15 hover
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return `${context[0].label}`;
            },
            label: function (context) {
              const province = topProvinces[context.dataIndex];
              return [
                `Tổng đơn vị: ${context.parsed.y}`,
                `Sáp nhập: ${province.merged_units}`,
                `Không đổi: ${province.unchanged_units}`,
              ];
            },
          },
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 12 },
          padding: 12,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Số lượng đơn vị",
          },
        },
        x: {
          title: {
            display: true,
            text: "Tỉnh/Thành phố",
          },
        },
      },
      layout: {
        padding: 10,
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor =
          activeElements.length > 0 ? "pointer" : "default";
      },
      onClick: (event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const province = topProvinces[index];
          showProvinceDetails(province.id);

          // Scroll to province details
          setTimeout(() => {
            document.getElementById("province-details").scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      },
    },
  });

  // Merger distribution chart
  const mergerData = data.statistics.merger_distribution;
  const mergerLabels = Object.keys(mergerData).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );
  const mergerValues = mergerLabels.map((key) => mergerData[key]);

  const mergerCtx = document
    .getElementById("merger-distribution-chart")
    .getContext("2d");

  const mergerChart = new Chart(mergerCtx, {
    type: "pie",
    data: {
      labels: mergerLabels.map((label) => `${label} đơn vị`),
      datasets: [
        {
          data: mergerValues,
          backgroundColor: [
            "#3498db",
            "#e74c3c",
            "#f39c12",
            "#2ecc71",
            "#9b59b6",
            "#1abc9c",
            "#34495e",
            "#e67e22",
            "#95a5a6",
            "#16a085",
          ],
          hoverBackgroundColor: [
            "#2980b9",
            "#c0392b",
            "#e67e22",
            "#27ae60",
            "#8e44ad",
            "#17a2b8",
            "#2c3e50",
            "#d35400",
            "#7f8c8d",
            "#138d75",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 8,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      layout: {
        padding: 10,
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor =
          activeElements.length > 0 ? "pointer" : "default";
      },
      onClick: (event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const mergerSize = parseInt(mergerLabels[index]);
          applyMergerFilter(mergerSize);
        }
      },
    },
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.style.display = "none";
      return;
    }

    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 150); // Reduced delay for faster response
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-section")) {
      searchResults.style.display = "none";
    }
  });
}

// Remove Vietnamese accents for search
function removeAccents(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Build search index for better performance
function buildSearchIndex() {
  searchIndex = data.units.map((unit, index) => ({
    index: index,
    unit: unit,
    searchText: removeAccents(
      `${unit.new_name} ${unit.province} ${unit.old_units.join(" ")}`,
    ).toLowerCase(),
  }));
}

// Perform search
function performSearch(query) {
  const searchResults = document.getElementById("search-results");
  searchResults.innerHTML = "";

  const normalizedQuery = removeAccents(query.toLowerCase());

  // Use pre-built search index for better performance
  const results = searchIndex
    .filter((item) => item.searchText.includes(normalizedQuery))
    .map((item) => {
      const unitNewName = removeAccents(item.unit.new_name.toLowerCase());
      const relevance = unitNewName.startsWith(normalizedQuery)
        ? 2
        : unitNewName.includes(normalizedQuery)
          ? 1
          : 0;
      return {
        type: "unit",
        data: item.unit,
        relevance: relevance,
      };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10);

  if (results.length === 0) {
    searchResults.innerHTML =
      '<div class="search-result-item">Không tìm thấy kết quả</div>';
  } else {
    results.forEach((result) => {
      const item = document.createElement("div");
      item.className = "search-result-item";

      if (result.type === "unit") {
        const oldUnitsText = result.data.is_unchanged
          ? "Không sáp nhập"
          : result.data.old_units.join(", ");

        item.innerHTML = `
                    <strong>${result.data.new_name}</strong> - ${result.data.province}<br>
                    <small>${oldUnitsText}</small>
                `;

        item.addEventListener("click", () => {
          const province = data.provinces.find(
            (p) => p.name === result.data.province,
          );
          if (province) {
            showProvinceDetails(province.id);
          }
          searchResults.style.display = "none";
        });
      }

      searchResults.appendChild(item);
    });
  }

  searchResults.style.display = "block";
}

// Show province details
function showProvinceDetails(provinceId) {
  const province = data.provinces.find((p) => p.id === provinceId);
  if (!province) return;

  // Update province details section
  document.getElementById("province-details").style.display = "block";
  document.getElementById("province-name").textContent =
    `Chi tiết ${province.name}`;
  document.getElementById("province-total").textContent = province.total_units;
  document.getElementById("province-merged").textContent =
    province.merged_units;
  document.getElementById("province-unchanged").textContent =
    province.unchanged_units;

  // Update units table
  const tbody = document.getElementById("units-tbody");
  tbody.innerHTML = "";

  province.units.forEach((unit, index) => {
    const row = document.createElement("tr");
    const typeText = unit.is_unchanged
      ? "Không đổi"
      : `Sáp nhập ${unit.old_units.length} đơn vị`;
    const oldUnitsText = unit.is_unchanged
      ? "Không sáp nhập"
      : unit.old_units.join(", ");

    row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${unit.new_name}</strong></td>
            <td>${oldUnitsText}</td>
            <td>${typeText}</td>
        `;

    tbody.appendChild(row);
  });

  // Scroll to details
  document
    .getElementById("province-details")
    .scrollIntoView({ behavior: "smooth" });

  // Close map popup if open
  map.closePopup();
}

// Setup download functionality
function setupDownload() {
  const downloadBtn = document.getElementById("download-csv");
  downloadBtn.addEventListener("click", downloadCSV);
}

// Escape CSV field - handle quotes and commas properly
function escapeCSVField(field) {
  if (field == null) return '""';

  // Convert to string and handle quotes
  const str = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

// Download data as CSV
function downloadCSV() {
  try {
    // Create CSV header
    const headers = ["Tỉnh", "Phường, xã mới", "Phường, xã trước sáp nhập"];

    // Create CSV rows with proper escaping
    const csvRows = [headers.map((h) => escapeCSVField(h)).join(",")];

    data.units.forEach((unit) => {
      const oldUnitsText = unit.is_unchanged
        ? "Không sáp nhập"
        : unit.old_units.join(", ");
      const row = [
        escapeCSVField(unit.province),
        escapeCSVField(unit.new_name),
        escapeCSVField(oldUnitsText),
      ];
      csvRows.push(row.join(","));
    });

    // Create CSV content
    const csvContent = csvRows.join("\r\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    // Generate filename with current date
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    link.setAttribute("download", `don-vi-hanh-chinh-2025_${dateStr}.csv`);

    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    showNotification("✅ Tải xuống thành công!", "success");
  } catch (error) {
    console.error("Error downloading CSV:", error);
    showNotification("❌ Lỗi khi tải xuống!", "error");
  }
}

// Show notification
function showNotification(message, type = "info") {
  // Remove existing notification
  const existing = document.querySelector(".notification");
  if (existing) {
    existing.remove();
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add styles
  const bgColor =
    type === "success" ? "#27ae60" : type === "info" ? "#3498db" : "#e74c3c";

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 20px",
    backgroundColor: bgColor,
    color: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: "10000",
    fontSize: "14px",
    fontWeight: "500",
  });

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Setup filter functionality
function setupFilter() {
  const clearFilterBtn = document.getElementById("clear-filter");
  clearFilterBtn.addEventListener("click", clearMergerFilter);
}

// Apply merger filter (inclusive)
function applyMergerFilter(mergerSize) {
  // Toggle filter (inclusive behavior)
  if (currentFilters.has(mergerSize)) {
    currentFilters.delete(mergerSize);
    showNotification(
      `➖ Đã bỏ: ${mergerSize === 1 ? "Không sáp nhập" : `Sáp nhập ${mergerSize} đơn vị`}`,
      "info",
    );
  } else {
    currentFilters.add(mergerSize);
    showNotification(
      `➕ Đã thêm: ${mergerSize === 1 ? "Không sáp nhập" : `Sáp nhập ${mergerSize} đơn vị`}`,
      "info",
    );
  }

  // Update filter status
  updateFilterStatus();

  // Filter and update the province details table
  updateFilteredView();
}

// Update filter status display
function updateFilterStatus() {
  const filterStatus = document.getElementById("filter-status");
  const filterText = document.getElementById("filter-text");

  if (currentFilters.size === 0) {
    filterStatus.style.display = "none";
    return;
  }

  const filterArray = Array.from(currentFilters).sort((a, b) => a - b);
  const filterLabels = filterArray.map((size) =>
    size === 1 ? "Không sáp nhập" : `${size} đơn vị`,
  );

  filterText.textContent = `Hiển thị: ${filterLabels.join(", ")}`;
  filterStatus.style.display = "flex";
}

// Clear merger filter
function clearMergerFilter() {
  currentFilters.clear();

  // Hide filter status
  document.getElementById("filter-status").style.display = "none";

  // Reset view
  updateFilteredView();

  // Show notification
  showNotification("✅ Đã bỏ tất cả lọc", "success");
}

// Update filtered view
function updateFilteredView() {
  // Create filtered summary data
  let filteredUnits = data.units;

  if (currentFilters.size > 0) {
    filteredUnits = data.units.filter((unit) => {
      for (const filterSize of currentFilters) {
        if (filterSize === 1 && unit.is_unchanged) {
          return true; // Show unchanged units
        } else if (
          filterSize !== 1 &&
          !unit.is_unchanged &&
          unit.old_units.length === filterSize
        ) {
          return true; // Show matching merger size
        }
      }
      return false;
    });
  }

  // Group by province for summary
  const provinceSummary = {};
  filteredUnits.forEach((unit) => {
    if (!provinceSummary[unit.province]) {
      provinceSummary[unit.province] = {
        name: unit.province,
        units: [],
        total_units: 0,
        merged_units: 0,
        unchanged_units: 0,
      };
    }

    provinceSummary[unit.province].units.push(unit);
    provinceSummary[unit.province].total_units++;

    if (unit.is_unchanged) {
      provinceSummary[unit.province].unchanged_units++;
    } else {
      provinceSummary[unit.province].merged_units++;
    }
  });

  // Sort provinces by total units (descending)
  const sortedProvinces = Object.values(provinceSummary).sort(
    (a, b) => b.total_units - a.total_units,
  );

  // Show filtered data in province details
  if (sortedProvinces.length > 0) {
    const topProvince = sortedProvinces[0];
    showFilteredResults(sortedProvinces, filteredUnits.length);
  } else {
    showFilteredResults([], 0);
  }
}

// Show filtered results
function showFilteredResults(provinces, totalUnits) {
  const provinceDetails = document.getElementById("province-details");

  if (totalUnits === 0) {
    provinceDetails.style.display = "block";
    document.getElementById("province-name").textContent =
      "Không tìm thấy dữ liệu";
    document.getElementById("province-total").textContent = "0";
    document.getElementById("province-merged").textContent = "0";
    document.getElementById("province-unchanged").textContent = "0";
    document.getElementById("units-tbody").innerHTML =
      '<tr><td colspan="4">Không có dữ liệu phù hợp với bộ lọc</td></tr>';
    return;
  }

  provinceDetails.style.display = "block";

  if (currentFilters.size > 0) {
    const filterArray = Array.from(currentFilters).sort((a, b) => a - b);
    const filterLabels = filterArray.map((size) =>
      size === 1 ? "Không sáp nhập" : `${size} đơn vị`,
    );
    document.getElementById("province-name").textContent =
      `Kết quả lọc: ${filterLabels.join(", ")}`;
  } else {
    document.getElementById("province-name").textContent = "Tất cả dữ liệu";
  }

  // Calculate totals
  const totalMerged = provinces.reduce((sum, p) => sum + p.merged_units, 0);
  const totalUnchanged = provinces.reduce(
    (sum, p) => sum + p.unchanged_units,
    0,
  );

  document.getElementById("province-total").textContent = totalUnits;
  document.getElementById("province-merged").textContent = totalMerged;
  document.getElementById("province-unchanged").textContent = totalUnchanged;

  // Update table with all filtered units
  const tbody = document.getElementById("units-tbody");
  tbody.innerHTML = "";

  let unitIndex = 1;
  provinces.forEach((province) => {
    province.units.forEach((unit) => {
      const row = document.createElement("tr");
      const typeText = unit.is_unchanged
        ? "Không đổi"
        : `Sáp nhập ${unit.old_units.length} đơn vị`;
      const oldUnitsText = unit.is_unchanged
        ? "Không sáp nhập"
        : unit.old_units.join(", ");

      row.innerHTML = `
                <td>${unitIndex}</td>
                <td><strong>${unit.new_name}</strong><br><small>${unit.province}</small></td>
                <td>${oldUnitsText}</td>
                <td>${typeText}</td>
            `;

      tbody.appendChild(row);
      unitIndex++;
    });
  });

  // Scroll to results
  provinceDetails.scrollIntoView({ behavior: "smooth" });
}

// Setup fullscreen map
function setupFullscreenMap() {
  const expandBtn = document.getElementById("expand-map");
  const mapModal = document.getElementById("map-modal");
  const closeBtn = document.getElementById("close-map");
  let fullscreenMap = null;

  expandBtn.addEventListener("click", () => {
    // Show modal
    mapModal.style.display = "flex";

    // Create fullscreen map
    setTimeout(() => {
      if (fullscreenMap) {
        fullscreenMap.remove();
      }

      fullscreenMap = L.map("map-fullscreen");

      // Set bounds to show entire Vietnam
      const vietnamBounds = [
        [8.0, 102.0], // Southwest coordinates
        [23.5, 110.0], // Northeast coordinates
      ];

      fullscreenMap.fitBounds(vietnamBounds);
      fullscreenMap.setMaxBounds(vietnamBounds);

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(fullscreenMap);

      // Add zoom control to bottom-right
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(fullscreenMap);

      // Add province markers
      addProvinceMarkersToMap(fullscreenMap);

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        fullscreenMap.invalidateSize();
      }, 100);
    }, 100);
  });

  closeBtn.addEventListener("click", () => {
    mapModal.style.display = "none";
    if (fullscreenMap) {
      fullscreenMap.remove();
      fullscreenMap = null;
    }
  });

  // Close on background click
  mapModal.addEventListener("click", (e) => {
    if (e.target === mapModal) {
      closeBtn.click();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mapModal.style.display === "flex") {
      closeBtn.click();
    }
  });
}

// Add province markers to a specific map instance
function addProvinceMarkersToMap(mapInstance) {
  const provincesLayer = L.layerGroup().addTo(mapInstance);

  // Find max units for color scaling
  const maxUnits = Math.max(...data.provinces.map((p) => p.total_units));

  // Use requestAnimationFrame for better performance
  let index = 0;
  function addBatch() {
    const batchSize = 5; // Add 5 provinces at a time
    for (
      let i = 0;
      i < batchSize && index < data.provinces.length;
      i++, index++
    ) {
      const province = data.provinces[index];
      const coords = provinceCoordinates[province.name];
      if (coords) {
        // Calculate color intensity based on number of units
        const intensity = province.total_units / maxUnits;
        const color = getColorForIntensity(intensity);

        // Create circle marker
        const marker = L.circleMarker(coords, {
          radius: 12 + (province.total_units / maxUnits) * 25, // Larger for fullscreen
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        // Add popup
        const popupContent = `
                    <div class="popup-content">
                        <div class="popup-title">${province.name}</div>
                        <div class="popup-stat">
                            <span>Tổng đơn vị:</span>
                            <strong>${province.total_units}</strong>
                        </div>
                        <div class="popup-stat">
                            <span>Sáp nhập:</span>
                            <strong>${province.merged_units}</strong>
                        </div>
                        <div class="popup-stat">
                            <span>Không đổi:</span>
                            <strong>${province.unchanged_units}</strong>
                        </div>
                        <button class="popup-button" onclick="showProvinceDetails('${province.id}')">
                            Xem chi tiết
                        </button>
                    </div>
                `;

        marker.bindPopup(popupContent);
        marker.addTo(provincesLayer);
      }
    }

    if (index < data.provinces.length) {
      requestAnimationFrame(addBatch);
    }
  }

  requestAnimationFrame(addBatch);
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
