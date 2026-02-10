/**
 * WHAT: This is the main screen of the application.
 * WHY: It contains all the buttons, inputs, and logic for the currency tools.
 * HOW: It uses 'React State' (useState) to remember what the user types and 
 *      'Async Functions' to talk to the backend server.
 */
import { useState } from "react";
import { currencyList } from "@/lib/currencies";

// This is the address of our Backend server
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ConverterApp() {
  /** 
   * STATE: Think of these as the 'memory' of the app. 
   * When you type in a box, React saves it here. 
   */
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [arbResult, setArbResult] = useState("");
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [heatmapMsg, setHeatmapMsg] = useState("");

  const [tripBudget, setTripBudget] = useState("");
  const [tripDays, setTripDays] = useState("");
  const [planResult, setPlanResult] = useState("");

  const [predictResult, setPredictResult] = useState("");

  /**
   * FUNCTION: convert()
   * WHAT: Calculates the simple exchange rate (e.g., $1 = ₹83).
   */
  async function convert() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setResult("⚠️ Please enter a valid amount");
      return;
    }

    setLoading(true);
    setResult("⏳ Converting...");

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await response.json();
      const rate = data.rates[to];

      if (!rate) {
        setResult("❌ Rate not available.");
        return;
      }

      const converted = (value * rate).toFixed(2);
      setResult(`${value} ${from} = ${converted} ${to}`);
    } catch (e) {
      setResult("❌ Error fetching rates.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * FUNCTION: checkArbitrage()
   * WHAT: Asks the backend to find 'money-making' conversion loops.
   */
  async function checkArbitrage() {
    setArbResult("⏳ Checking...");
    try {
      const response = await fetch(`${BACKEND_URL}/api/arbitrage?base=${from}&target=${to}`);
      const data = await response.json();

      if (data.count === 0) {
        setArbResult("No arbitrage opportunities right now.");
        return;
      }

      const top = data.opportunities.slice(0, 3);
      const lines = top.map((opp: any) => `${opp.chain} | Profit: ${opp.profit_percent}%`);
      setArbResult(lines.join(" • "));
    } catch (e) {
      setArbResult("❌ Error fetching arbitrage data.");
    }
  }

  /**
   * FUNCTION: loadHeatmap()
   * WHAT: Loads colors representing how much currencies are 'bouncing' in price.
   */
  async function loadHeatmap() {
    setHeatmapMsg("⏳ Loading heat map...");
    setHeatmap({});
    try {
      const response = await fetch(`${BACKEND_URL}/api/volatility`);
      const data = await response.json();
      setHeatmap(data);
      setHeatmapMsg("");
    } catch (e) {
      setHeatmapMsg("❌ Error loading heat map.");
    }
  }

  /**
   * FUNCTION: planBudget()
   * WHAT: Tells you how much money you need for a trip and if today is a good day to buy.
   */
  async function planBudget() {
    const budget = Number(tripBudget);
    const days = Number(tripDays);

    if (!budget || budget <= 0 || !days || days <= 0) {
      setPlanResult("⚠️ Please enter valid budget and days.");
      return;
    }

    setPlanResult("⏳ Planning...");

    try {
      const rateRes = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const rateData = await rateRes.json();
      const rate = rateData.rates[to];

      if (!rate) {
        setPlanResult("❌ Rate not available.");
        return;
      }

      const baseNeeded = (budget / rate).toFixed(2);

      let suggestion = "Suggestion: Convert now for safety.";
      try {
        const volRes = await fetch(`${BACKEND_URL}/api/volatility`);
        const volData = await volRes.json();
        const vol = volData[to];

        if (vol !== undefined) {
          if (vol < 0.2) {
            suggestion = "Suggestion: Low volatility. You can wait or convert later.";
          } else if (vol < 0.4) {
            suggestion = "Suggestion: Medium volatility. Convert part now, part later.";
          } else {
            suggestion = "Suggestion: High volatility. Consider converting early.";
          }
        }
      } catch {
        // keep default
      }

      setPlanResult(`You need about ${baseNeeded} ${from} for a ${budget} ${to} trip. ${suggestion}`);
    } catch (e) {
      setPlanResult("❌ Error planning budget.");
    }
  }

  /**
   * FUNCTION: predict()
   * WHAT: Asks the backend AI to guess the price for the next 7 days.
   */
  async function predict() {
    setPredictResult("⏳ Predicting...");
    try {
      const response = await fetch(`${BACKEND_URL}/api/predict?base=${from}&target=${to}`);
      const data = await response.json();

      if (!data.predictions || data.predictions.length === 0) {
        setPredictResult("No prediction available.");
        return;
      }

      const values = data.predictions.map((p: number) => p.toFixed(4)).join(" → ");
      setPredictResult(`Next 7 days (${from}/${to}): ${values}`);
    } catch (e) {
      setPredictResult("❌ Error loading prediction.");
    }
  }

  // Logic to calculate colors for the Heatmap (Green = Stable, Red = Unstable)
  const heatmapEntries = Object.entries(heatmap);
  const maxVal = heatmapEntries.length ? Math.max(...heatmapEntries.map(([, v]) => v)) : 0;

  return (
    <div className="w-full px-4 py-12 text-white relative z-10 h-screen overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold">💱 Smart Currency Converter</h2>
        <p className="text-zinc-400">Real-time conversion + ML insights</p>
      </div>

      {/* MAIN CONVERTER SECTION */}
      <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <input
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={from}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white [&>option]:text-black"
            onChange={(e) => setFrom(e.target.value)}
          >
            {currencyList.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>

          <select
            value={to}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white [&>option]:text-black"
            onChange={(e) => setTo(e.target.value)}
          >
            {currencyList.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <button
          className="rounded-lg bg-white text-zinc-950 py-3 font-semibold hover:bg-zinc-200 transition"
          onClick={convert}
          disabled={loading}
        >
          {loading ? "Converting..." : "Convert Now"}
        </button>

        <div className="rounded-lg bg-zinc-900/70 px-4 py-3 text-center text-lg font-medium">
          {result || "Result will appear here"}
        </div>
      </div>

      {/* ADDITIONAL TOOLS (Grid of Cards) */}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">

        {/* CARD 1: Arbitrage */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">🔍 Arbitrage Detector</h3>
          <p className="text-xs text-zinc-400 mb-4">Find 'free money' loops between currencies.</p>
          <button className="w-full rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={checkArbitrage}>
            Scan Markets
          </button>
          <div className="mt-3 text-sm italic">{arbResult}</div>
        </div>

        {/* CARD 2: Volatility Heatmap */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">🌡️ Market Heat Map</h3>
          <p className="text-xs text-zinc-400 mb-4">Green is calm, Red is moving fast.</p>
          <button className="w-full rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={loadHeatmap}>
            Refresh Rates
          </button>
          <div className="mt-3 text-sm">{heatmapMsg}</div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 gap-2">
            {heatmapEntries.map(([currency, value]) => {
              const intensity = maxVal === 0 ? 0 : value / maxVal;
              const r = Math.round(80 + 175 * intensity);
              const g = Math.round(200 - 120 * intensity);
              const b = Math.round(120 - 40 * intensity);
              return (
                <div
                  key={currency}
                  className="rounded-lg p-2 text-center font-semibold"
                  style={{ backgroundColor: `rgb(${r}, ${g}, ${b})`, color: "#111" }}
                >
                  <div className="text-xs">{currency}</div>
                  <div className="text-[10px] opacity-70">{value}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 3: Travel Planner */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">🧳 Trip Budgeting</h3>
          <div className="grid gap-3 mb-4">
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              type="number"
              value={tripBudget}
              onChange={(e) => setTripBudget(e.target.value)}
              placeholder="Total budget needed"
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
              type="number"
              value={tripDays}
              onChange={(e) => setTripDays(e.target.value)}
              placeholder="Trip duration (days)"
            />
          </div>
          <button className="w-full rounded-lg bg-white text-zinc-950 py-2 px-4 text-sm" onClick={planBudget}>
            Calculate Costs
          </button>
          <div className="mt-3 text-xs leading-relaxed">{planResult}</div>
        </div>

        {/* CARD 4: ML Prediction */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">📈 AI Predictions</h3>
          <p className="text-xs text-zinc-400 mb-4">Where will the price be in 7 days?</p>
          <button className="w-full rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={predict}>
            Run AI Forecast
          </button>
          <div className="mt-3 text-xs font-mono">{predictResult}</div>
        </div>
      </div>
    </div>
  );
}