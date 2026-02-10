"""
WHAT: This is the main Backend server file.
WHY: It acts as the 'brain' of the application, handling requests from the frontend and returning data.
HOW: It uses the Flask framework to create API endpoints (URLs) that the frontend can call.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from arbitrage import find_arbitrage_opportunities
from currency_api import fetch_timeseries_rates, compute_volatility
from ml_model import predict_next_7_days

app = Flask(__name__)
# CORS (Cross-Origin Resource Sharing) allows the frontend (port 5173) to talk to the backend (port 5000)
CORS(app)

@app.route("/api/arbitrage", methods=["GET"])
@cross_origin()
def get_arbitrage():
    """
    Endpoint to find arbitrage opportunities.
    It checks if converting through 3 currencies can result in more money than you started with.
    """
    base = request.args.get("base")
    target = request.args.get("target")
    
    # If user provided specific currencies in the UI, we prioritize them in the search
    user_currencies = []
    if base: user_currencies.append(base)
    if target: user_currencies.append(target)
    
    opportunities = find_arbitrage_opportunities(include_currencies=user_currencies)
    return jsonify({
        "count": len(opportunities),
        "opportunities": opportunities
    })

@app.route("/api/volatility", methods=["GET"])
@cross_origin()
def get_volatility():
    """
    Endpoint for the Heatmap.
    It calculates how much 20 major currencies have 'bounced around' (volatility) in the last 7 days.
    """
    symbols = [
        "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "HKD", "NZD", "KRW", 
        "SGD", "NOK", "MXN", "INR", "BRL", "ZAR", "TRY", "SEK", "IDR", "MYR"
    ]
    rates = fetch_timeseries_rates(base="USD", symbols=symbols, days=7)
    volatility = compute_volatility(rates)
    return jsonify(volatility)

@app.route("/api/predict", methods=["GET"])
@cross_origin()
def get_prediction():
    """
    Endpoint for the 7-day prediction.
    It uses historical data and Linear Regression (a type of AI) to guess future prices.
    """
    base = request.args.get("base", "USD")
    target = request.args.get("target", "EUR")
    predictions = predict_next_7_days(base, target)
    return jsonify({
        "base": base,
        "target": target,
        "predictions": predictions
    })

@app.route("/api/health", methods=["GET"])
@cross_origin()
def health():
    """Simple check to see if the server is running."""
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    # host='0.0.0.0' makes the server visible on your local network/IP
    app.run(debug=True, host="0.0.0.0")