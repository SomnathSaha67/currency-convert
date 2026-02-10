import React, { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const currencyList = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "INR", label: "INR - Indian Rupee" },
  { code: "JPY", label: "JPY - Japanese Yen" }
];

export default function ConverterApp() {
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

  async function checkArbitrage() {
    setArbResult("⏳ Checking...");
    try {
      const response = await fetch(`${BACKEND_URL}/api/arbitrage`);
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

  const heatmapEntries = Object.entries(heatmap);
  const maxVal = heatmapEntries.length ? Math.max(...heatmapEntries.map(([, v]) => v)) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-white">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold">💱 Smart Currency Converter</h2>
        <p className="text-zinc-400">Real-time conversion + ML insights</p>
      </div>

      <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <input
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />

        <select
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          {currencyList.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>

        <select
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          {currencyList.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>

        <button
          className="rounded-lg bg-white text-zinc-950 py-3 font-semibold"
          onClick={convert}
          disabled={loading}
        >
          {loading ? "Converting..." : "Convert"}
        </button>

        <div className="rounded-lg bg-zinc-900/70 px-4 py-3">
          {result || "Result will appear here"}
        </div>
      </div>

      <div className="mt-10 grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">🔍 Arbitrage Detector</h3>
          <button className="rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={checkArbitrage}>
            Check Arbitrage
          </button>
          <div className="mt-3 text-sm">{arbResult}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">🌡️ Volatility Heat Map</h3>
          <button className="rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={loadHeatmap}>
            Load Heat Map
          </button>
          <div className="mt-3 text-sm">{heatmapMsg}</div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {heatmapEntries.map(([currency, value]) => {
              const intensity = maxVal === 0 ? 0 : value / maxVal;
              const r = Math.round(80 + 175 * intensity);
              const g = Math.round(200 - 120 * intensity);
              const b = Math.round(120 - 40 * intensity);
              return (
                <div
                  key={currency}
                  className="rounded-lg p-3 text-center font-semibold"
                  style={{ backgroundColor: `rgb(${r}, ${g}, ${b})`, color: "#111" }}
                >
                  <div>{currency}</div>
                  <div className="text-xs">{value}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">🧳 Travel Budget Planner</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              type="number"
              value={tripBudget}
              onChange={(e) => setTripBudget(e.target.value)}
              placeholder="Trip budget (target currency)"
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              type="number"
              value={tripDays}
              onChange={(e) => setTripDays(e.target.value)}
              placeholder="Days until trip"
            />
          </div>
          <button className="mt-3 rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={planBudget}>
            Plan Budget
          </button>
          <div className="mt-3 text-sm">{planResult}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-xl font-semibold mb-2">📈 7-Day Rate Prediction</h3>
          <button className="rounded-lg bg-white text-zinc-950 py-2 px-4" onClick={predict}>
            Predict Next 7 Days
          </button>
          <div className="mt-3 text-sm">{predictResult}</div>
        </div>
      </div>
    </div>
  );
}