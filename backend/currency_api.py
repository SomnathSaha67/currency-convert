import requests
from datetime import date, timedelta

def fetch_timeseries_rates(base="USD", symbols=None, days=7):
    """
    Fetch daily exchange rates for the last N days.
    Uses frankfurter.app (free, no key).
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    params = {"from": base}
    if symbols:
        params["to"] = ",".join(symbols)

    url = f"https://api.frankfurter.app/{start_date.isoformat()}..{end_date.isoformat()}"
    response = requests.get(url, params=params, timeout=10)
    data = response.json()
    return data.get("rates", {})

def compute_volatility(rates_by_date):
    """
    Compute average daily % change (volatility) for each currency.
    """
    dates = sorted(rates_by_date.keys())
    if len(dates) < 2:
        return {}

    currencies = rates_by_date[dates[0]].keys()
    volatility = {}

    for currency in currencies:
        changes = []
        for i in range(1, len(dates)):
            prev_rate = rates_by_date[dates[i - 1]].get(currency)
            curr_rate = rates_by_date[dates[i]].get(currency)

            if prev_rate and curr_rate:
                pct_change = abs((curr_rate - prev_rate) / prev_rate * 100)
                changes.append(pct_change)

        if changes:
            volatility[currency] = round(sum(changes) / len(changes), 3)

    return volatility