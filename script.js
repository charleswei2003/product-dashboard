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
