const ordersBtn = document.getElementById("ordersBtn");
const itemsBtn = document.getElementById("itemsBtn");
const productsBtn = document.getElementById("productsBtn");

const ordersInput = document.getElementById("ordersInput");
const itemsInput = document.getElementById("itemsInput");
const productsInput = document.getElementById("productsInput");

const ordersStatus = document.getElementById("ordersStatus");
const itemsStatus = document.getElementById("itemsStatus");
const productsStatus = document.getElementById("productsStatus");

const topStatus = document.getElementById("topStatus");
const generateBtn = document.getElementById("generateBtn");

const totalPurchasesEl = document.getElementById("totalPurchases");
const totalCustomersEl = document.getElementById("totalCustomers");
const totalRevenueEl = document.getElementById("totalRevenue");
const totalCategoriesEl = document.getElementById("totalCategories");

const uploadedData = {
  orders: null,
  items: null,
  products: null
};

ordersBtn.addEventListener("click", () => ordersInput.click());
itemsBtn.addEventListener("click", () => itemsInput.click());
productsBtn.addEventListener("click", () => productsInput.click());

ordersInput.addEventListener("change", () => parseCsvFile("orders", ordersInput, ordersStatus));
itemsInput.addEventListener("change", () => parseCsvFile("items", itemsInput, itemsStatus));
productsInput.addEventListener("change", () => parseCsvFile("products", productsInput, productsStatus));

generateBtn.addEventListener("click", generateDashboard);

function parseCsvFile(type, inputEl, statusEl) {
  const file = inputEl.files[0];
  if (!file) return;

  statusEl.textContent = "Loading...";

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      uploadedData[type] = results.data;
      const rowCount = results.data.length;
      statusEl.textContent = `${rowCount.toLocaleString()} ROWS`;
      statusEl.classList.add("file-ready");
      updateOverallStatus();
      console.log(`${type} loaded`, results.data.slice(0, 3));
      console.log(`${type} columns`, Object.keys(results.data[0] || {}));
    },
    error: function(error) {
      statusEl.textContent = "FAILED TO LOAD";
      console.error(`Error parsing ${type}:`, error);
    }
  });
}

function updateOverallStatus() {
  const allConnected =
    uploadedData.orders &&
    uploadedData.items &&
    uploadedData.products;

  if (allConnected) {
    topStatus.textContent = "ALL DATASETS CONNECTED";
    topStatus.classList.add("connected");
    generateBtn.disabled = false;
  } else {
    topStatus.textContent = "WAITING FOR FILES...";
    topStatus.classList.remove("connected");
    generateBtn.disabled = true;
  }
}

function generateDashboard() {
  const orders = uploadedData.orders || [];
  const items = uploadedData.items || [];
  const products = uploadedData.products || [];

  if (!orders.length || !items.length || !products.length) return;

  updateKpis(orders, items, products);

  const orderMonthMap = buildMonthlyOrderVolume(orders);
  const salesMonthMap = buildMonthlySales(orders, items);
  const topCategoryMap = buildTopCategories(items, products);
  const heatmapData = buildOrderingHeatmap(orders);

  renderOrderVolumeChart(orderMonthMap);
  renderSalesByMonthChart(salesMonthMap);
  renderTopCategoriesChart(topCategoryMap);
  renderHeatmapChart(heatmapData);
}

function updateKpis(orders, items, products) {
  const totalPurchases = getDistinctCount(orders, "order_id");
  const totalCustomers = getDistinctCount(orders, "customer_id");
  const totalRevenue = calculateTotalRevenue(items);
  const totalCategories = getDistinctCount(products, "product_category_name");

  totalPurchasesEl.textContent = formatInteger(totalPurchases);
  totalCustomersEl.textContent = formatInteger(totalCustomers);
  totalRevenueEl.textContent = formatCurrency(totalRevenue);
  totalCategoriesEl.textContent = formatInteger(totalCategories);
}

function getDistinctCount(data, columnName) {
  const values = data
    .map(row => row[columnName])
    .filter(value => value !== undefined && value !== null && value !== "");
  return new Set(values).size;
}

function calculateTotalRevenue(items) {
  let total = 0;
  for (const row of items) {
    const price = parseNumber(row.price);
    const shipping = parseNumber(row.shipping_charges || row.freight_value);
    total += price + shipping;
  }
  return total;
}

function buildMonthlyOrderVolume(orders) {
  const monthMap = {};

  for (const row of orders) {
    const timestamp = row.order_purchase_timestamp;
    if (!timestamp) continue;

    const monthKey = timestamp.slice(0, 7);
    monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
  }

  return sortObjectByMonth(monthMap);
}

function buildMonthlySales(orders, items) {
  const orderToMonth = {};
  for (const row of orders) {
    const timestamp = row.order_purchase_timestamp;
    if (!timestamp || !row.order_id) continue;
    orderToMonth[row.order_id] = timestamp.slice(0, 7);
  }

  const salesMap = {};
  for (const row of items) {
    const orderId = row.order_id;
    const monthKey = orderToMonth[orderId];
    if (!monthKey) continue;

    const price = parseNumber(row.price);
    const shipping = parseNumber(row.shipping_charges || row.freight_value);
    const revenue = price + shipping;

    salesMap[monthKey] = (salesMap[monthKey] || 0) + revenue;
  }

  return sortObjectByMonth(salesMap);
}

function buildTopCategories(items, products) {
  const productToCategory = {};
  for (const row of products) {
    if (!row.product_id) continue;
    productToCategory[row.product_id] = row.product_category_name || "unknown";
  }

  const categoryCount = {};
  for (const row of items) {
    const category = productToCategory[row.product_id] || "unknown";
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  }

  const sortedEntries = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return Object.fromEntries(sortedEntries);
}

function buildOrderingHeatmap(orders) {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const matrix = weekdays.map(() => Array(24).fill(0));

  for (const row of orders) {
    const timestamp = row.order_purchase_timestamp;
    if (!timestamp) continue;

    const date = new Date(timestamp.replace(" ", "T"));
    if (isNaN(date)) continue;

    const jsDay = date.getDay();
    const weekdayIndex = jsDay === 0 ? 6 : jsDay - 1;
    const hour = date.getHours();

    matrix[weekdayIndex][hour] += 1;
  }

  return { weekdays, hours, matrix };
}

function sortObjectByMonth(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]))
  );
}

function renderOrderVolumeChart(monthMap) {
  const x = Object.keys(monthMap);
  const y = Object.values(monthMap);

  Plotly.newPlot(
    "orderVolumeChart",
    [
      {
        x,
        y,
        type: "scatter",
        mode: "lines+markers",
        line: { width: 3 },
        marker: { size: 7 },
        hovertemplate: "Month: %{x}<br>Orders: %{y}<extra></extra>"
      }
    ],
    getCommonLayout("Orders", "Month", "Order Count"),
    { responsive: true, displayModeBar: false }
  );
}

function renderSalesByMonthChart(monthMap) {
  const x = Object.keys(monthMap);
  const y = Object.values(monthMap).map(v => Math.round(v));

  Plotly.newPlot(
    "salesByMonthChart",
    [
      {
        x,
        y,
        type: "scatter",
        mode: "lines+markers",
        line: { width: 3 },
        marker: { size: 7 },
        hovertemplate: "Month: %{x}<br>Sales: $%{y:,}<extra></extra>"
      }
    ],
    getCommonLayout("Revenue", "Month", "Sales ($)"),
    { responsive: true, displayModeBar: false }
  );
}

function renderTopCategoriesChart(categoryMap) {
  const entries = Object.entries(categoryMap);
  const labels = entries.map(entry => formatCategoryLabel(entry[0]));
  const values = entries.map(entry => entry[1]);

  Plotly.newPlot(
    "topCategoriesChart",
    [
      {
        x: values.slice().reverse(),
        y: labels.slice().reverse(),
        type: "bar",
        orientation: "h",
        hovertemplate: "%{y}<br>Orders: %{x}<extra></extra>"
      }
    ],
    {
      margin: { l: 160, r: 20, t: 10, b: 50 },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: {
        title: "Order Count",
        gridcolor: "#eef2f7",
        zeroline: false
      },
      yaxis: {
        automargin: true
      }
    },
    { responsive: true, displayModeBar: false }
  );
}

function renderHeatmapChart(heatmapData) {
  Plotly.newPlot(
    "heatmapChart",
    [
      {
        z: heatmapData.matrix,
        x: heatmapData.hours,
        y: heatmapData.weekdays,
        type: "heatmap",
        hovertemplate: "Day: %{y}<br>Hour: %{x}:00<br>Orders: %{z}<extra></extra>"
      }
    ],
    {
      margin: { l: 70, r: 20, t: 10, b: 50 },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: {
        title: "Hour of Day",
        dtick: 1
      },
      yaxis: {
        title: "Day of Week"
      }
    },
    { responsive: true, displayModeBar: false }
  );
}

function getCommonLayout(seriesName, xTitle, yTitle) {
  return {
    margin: { l: 60, r: 20, t: 10, b: 50 },
    paper_bgcolor: "white",
    plot_bgcolor: "white",
    xaxis: {
      title: xTitle,
      gridcolor: "#eef2f7",
      zeroline: false
    },
    yaxis: {
      title: yTitle,
      gridcolor: "#eef2f7",
      zeroline: false
    },
    showlegend: false
  };
}

function parseNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString();
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

function formatCategoryLabel(text) {
  if (!text) return "unknown";
  return text
    .replaceAll("_", " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}
