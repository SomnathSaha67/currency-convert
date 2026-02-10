from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from arbitrage import find_arbitrage_opportunities
from currency_api import fetch_timeseries_rates, compute_volatility
from ml_model import predict_next_7_days

app = Flask(__name__)
CORS(app)

@app.route("/api/arbitrage", methods=["GET"])
@cross_origin()
def get_arbitrage():
    opportunities = find_arbitrage_opportunities()
    return jsonify({
        "count": len(opportunities),
        "opportunities": opportunities
    })

@app.route("/api/volatility", methods=["GET"])
@cross_origin()
def get_volatility():
    symbols = ["EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "SEK", "NOK"]
    rates = fetch_timeseries_rates(base="USD", symbols=symbols, days=7)
    volatility = compute_volatility(rates)
    return jsonify(volatility)

@app.route("/api/predict", methods=["GET"])
@cross_origin()
def get_prediction():
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
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)