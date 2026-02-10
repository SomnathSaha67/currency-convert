const mlFeatures = document.getElementById("mlFeatures");

// Backend base URL (no trailing slash)
const BACKEND_BASE_URL = "https://crispy-sniffle-69xpv4p96vxxf4vjp-5000.app.github.dev";

mlFeatures.innerHTML = `
  <div class="feature-box">
    <h2>🔍 Arbitrage Detector</h2>
    <p class="subtext">Find currency loops that might give profit.</p>
    <button id="arbBtn">Check Arbitrage</button>
    <div id="arbResult" class="result" style="margin-top: 10px;"></div>
  </div>

  <div class="feature-box">
    <h2>🌡️ Volatility Heat Map</h2>
    <p class="subtext">Hotter colors = higher daily movement.</p>
    <button id="heatmapBtn">Load Heat Map</button>
    <div id="heatmapGrid" class="heatmap-grid"></div>
    <div id="heatmapMsg" class="subtext" style="margin-top: 10px;"></div>
  </div>

  <div class="feature-box">
    <h2>🧳 Travel Budget Planner</h2>
    <p class="subtext">Estimate how much base currency you need today.</p>

    <div class="planner-grid">
      <div>
        <label for="tripBudget">Trip budget (target currency)</label>
        <input type="number" id="tripBudget" placeholder="e.g. 1500" />
      </div>

      <div>
        <label for="tripDays">Days until trip</label>
        <input type="number" id="tripDays" placeholder="e.g. 14" />
      </div>
    </div>

    <button id="planBtn">Plan Budget</button>
    <div id="planResult" class="result" style="margin-top: 10px;"></div>
  </div>

  <div class="feature-box">
    <h2>📈 7-Day Rate Prediction</h2>
    <p class="subtext">Simple ML forecast based on recent trends.</p>
    <button id="predictBtn">Predict Next 7 Days</button>
    <div id="predictResult" class="result" style="margin-top: 10px;"></div>
  </div>
`;

// Arbitrage
const arbBtn = document.getElementById("arbBtn");
const arbResult = document.getElementById("arbResult");

arbBtn.addEventListener("click", async function () {
  arbResult.textContent = "⏳ Checking...";
  arbResult.style.color = "#667eea";

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/arbitrage`);
    const data = await response.json();

    if (data.count === 0) {
      arbResult.textContent = "No arbitrage opportunities right now.";
      arbResult.style.color = "#333";
      return;
    }

    const top = data.opportunities.slice(0, 3);
    const lines = top.map(
      (opp) => `${opp.chain} | Profit: ${opp.profit_percent}%`
    );

    arbResult.textContent = lines.join(" • ");
    arbResult.style.color = "green";
  } catch (error) {
    arbResult.textContent = "❌ Error fetching arbitrage data.";
    arbResult.style.color = "red";
    console.error(error);
  }
});

// Heat Map
const heatmapBtn = document.getElementById("heatmapBtn");
const heatmapGrid = document.getElementById("heatmapGrid");
const heatmapMsg = document.getElementById("heatmapMsg");

function renderHeatmap(data) {
  heatmapGrid.innerHTML = "";
  const entries = Object.entries(data);
  if (entries.length === 0) {
    heatmapMsg.textContent = "No data available.";
    return;
  }

  const maxVal = Math.max(...entries.map(([, v]) => v));
  entries.forEach(([currency, value]) => {
    const intensity = maxVal === 0 ? 0 : value / maxVal;
    const r = Math.round(80 + 175 * intensity);
    const g = Math.round(200 - 120 * intensity);
    const b = Math.round(120 - 40 * intensity);

    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

    cell.innerHTML = `
      <div class="heatmap-label">${currency}</div>
      <div class="heatmap-value">${value}%</div>
    `;
    heatmapGrid.appendChild(cell);
  });
}

heatmapBtn.addEventListener("click", async function () {
  heatmapMsg.textContent = "⏳ Loading heat map...";
  heatmapGrid.innerHTML = "";

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/volatility`);
    const data = await response.json();
    renderHeatmap(data);
    heatmapMsg.textContent = "";
  } catch (error) {
    heatmapMsg.textContent = "❌ Error loading heat map.";
    console.error(error);
  }
});

// Travel Budget Planner
const planBtn = document.getElementById("planBtn");
const planResult = document.getElementById("planResult");
const tripBudget = document.getElementById("tripBudget");
const tripDays = document.getElementById("tripDays");

planBtn.addEventListener("click", async function () {
  const budget = Number(tripBudget.value);
  const days = Number(tripDays.value);
  const base = document.getElementById("fromCurrency").value;
  const target = document.getElementById("toCurrency").value;

  if (!budget || budget <= 0 || !days || days <= 0) {
    planResult.textContent = "⚠️ Please enter valid budget and days.";
    planResult.style.color = "red";
    return;
  }

  planResult.textContent = "⏳ Planning...";
  planResult.style.color = "#667eea";

  try {
    const rateRes = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );
    const rateData = await rateRes.json();
    const rate = rateData.rates[target];

    if (!rate) {
      planResult.textContent = "❌ Rate not available for selected currency.";
      planResult.style.color = "red";
      return;
    }

    const baseNeeded = (budget / rate).toFixed(2);

    let suggestion = "Suggestion: Convert now for safety.";
    try {
      const volRes = await fetch(`${BACKEND_BASE_URL}/api/volatility`);
      const volData = await volRes.json();
      const vol = volData[target];

      if (vol !== undefined) {
        if (vol < 0.2) {
          suggestion = "Suggestion: Low volatility. You can wait or convert later.";
        } else if (vol < 0.4) {
          suggestion = "Suggestion: Medium volatility. Convert part now, part later.";
        } else {
          suggestion = "Suggestion: High volatility. Consider converting early.";
        }
      }
    } catch (e) {
      // Keep default suggestion
    }

    planResult.textContent =
      `You need about ${baseNeeded} ${base} for a ${budget} ${target} trip. ` +
      suggestion;
    planResult.style.color = "green";
  } catch (error) {
    planResult.textContent = "❌ Error planning budget.";
    planResult.style.color = "red";
    console.error(error);
  }
});

// 7-Day Prediction
const predictBtn = document.getElementById("predictBtn");
const predictResult = document.getElementById("predictResult");

predictBtn.addEventListener("click", async function () {
  const base = document.getElementById("fromCurrency").value;
  const target = document.getElementById("toCurrency").value;

  predictResult.textContent = "⏳ Predicting...";
  predictResult.style.color = "#667eea";

  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/predict?base=${base}&target=${target}`
    );
    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      predictResult.textContent = "No prediction available.";
      predictResult.style.color = "#333";
      return;
    }

    const values = data.predictions.map((p) => p.toFixed(4)).join(" → ");
    predictResult.textContent = `Next 7 days (${base}/${target}): ${values}`;
    predictResult.style.color = "green";
  } catch (error) {
    predictResult.textContent = "❌ Error loading prediction.";
    predictResult.style.color = "red";
    console.error(error);
  }
});