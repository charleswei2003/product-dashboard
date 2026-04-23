<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
<script src="script.js"></script>

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

const uploadedFiles = {
  orders: null,
  items: null,
  products: null
};

ordersBtn.addEventListener("click", () => ordersInput.click());
itemsBtn.addEventListener("click", () => itemsInput.click());
productsBtn.addEventListener("click", () => productsInput.click());

ordersInput.addEventListener("change", () => handleFileSelect("orders", ordersInput, ordersStatus));
itemsInput.addEventListener("change", () => handleFileSelect("items", itemsInput, itemsStatus));
productsInput.addEventListener("change", () => handleFileSelect("products", productsInput, productsStatus));

function handleFileSelect(type, inputEl, statusEl) {
  const file = inputEl.files[0];
  if (!file) return;

  uploadedFiles[type] = file;
  statusEl.textContent = file.name;
  statusEl.classList.add("file-ready");

  updateOverallStatus();
}

function updateOverallStatus() {
  const allConnected =
    uploadedFiles.orders &&
    uploadedFiles.items &&
    uploadedFiles.products;

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
