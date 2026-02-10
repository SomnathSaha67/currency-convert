import requests
from datetime import date, timedelta
from sklearn.linear_model import LinearRegression
import numpy as np

def fetch_last_n_days(base="USD", target="EUR", days=30):
    """
    Fetch last N days of rates for base -> target.
    Uses frankfurter.app (free, no key).
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    url = f"https://api.frankfurter.app/{start_date.isoformat()}..{end_date.isoformat()}"
    params = {"from": base, "to": target}
    response = requests.get(url, params=params, timeout=10)
    data = response.json()
    rates_by_date = data.get("rates", {})

    # Convert to sorted list of (day_index, rate)
    dates = sorted(rates_by_date.keys())
    rates = [rates_by_date[d][target] for d in dates if target in rates_by_date[d]]
    return rates

def predict_next_7_days(base="USD", target="EUR"):
    """
    Train a simple linear model and predict the next 7 days.
    """
    rates = fetch_last_n_days(base, target, days=30)

    if len(rates) < 10:
        return []

    # X = day index, y = rate
    X = np.array(range(len(rates))).reshape(-1, 1)
    y = np.array(rates)

    model = LinearRegression()
    model.fit(X, y)

    # Predict next 7 days
    future_X = np.array(range(len(rates), len(rates) + 7)).reshape(-1, 1)
    predictions = model.predict(future_X)

    # Round to 4 decimals for display
    return [round(float(p), 4) for p in predictions]