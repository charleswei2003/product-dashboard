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
      console.log(`${type} loaded:`, results.data);
      console.log(`${type} columns:`, Object.keys(results.data[0] || {}));
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
    const price = parseFloat(row.price || 0);
    const freight = parseFloat(row.freight_value || row.shipping_charges || 0);
    total += price + freight;
  }

  return total;
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
