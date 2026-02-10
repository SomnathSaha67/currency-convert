// Get HTML elements
const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const convertBtn = document.getElementById("convertBtn");
const result = document.getElementById("result");

// When convert button is clicked
convertBtn.addEventListener("click", async function () {
    // Get values from inputs
    const amount = amountInput.value;
    const from = fromCurrency.value;
    const to = toCurrency.value;

    // Validate amount
    if (amount === "" || amount <= 0) {
        result.textContent = "⚠️ Please enter a valid amount";
        result.style.color = "red";
        return;
    }

    // Show loading
    result.textContent = "⏳ Converting...";
    result.style.color = "#667eea";
    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";

    try {
        // Call API to get exchange rate
        const apiURL = `https://api.exchangerate-api.com/v4/latest/${from}`;
        const response = await fetch(apiURL);
        const data = await response.json();

        // Get rate for target currency
        const rate = data.rates[to];

        // Calculate converted amount
        const convertedAmount = (amount * rate).toFixed(2);

        // Display result
        result.textContent = `${amount} ${from} = ${convertedAmount} ${to}`;
        result.style.color = "green";

        // Store rate for later use
        window.currentRate = rate;
        window.currentPair = `${from}/${to}`;
    } catch (error) {
        result.textContent = "❌ Error fetching rates. Check internet connection.";
        result.style.color = "red";
        console.error("Error:", error);
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert";
    }
});

// Add Enter key support
amountInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        convertBtn.click();
    }
});