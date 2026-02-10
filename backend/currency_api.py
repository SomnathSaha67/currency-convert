"""
WHAT: This file handles fetching historical currency data and calculating volatility.
WHY: We need historical data to show how much currencies 'bounced' (for the heatmap).
HOW: It uses the 'Frankfurter API' (a free service) to get exchange rates for the last 7 days.
"""
import requests
from datetime import date, timedelta

def fetch_timeseries_rates(base="USD", symbols=None, days=7):
    """
    Fetches daily exchange rates for the last N days.
    
    1. It calculates the date range (e.g., today minus 7 days).
    2. It asks the API for the rates of specific currencies (symbols) during that time.
    3. It returns a dictionary where each date has a list of prices.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    params = {"from": base}
    if symbols:
        params["to"] = ",".join(symbols)

    # The URL looks like: https://api.frankfurter.app/2023-01-01..2023-01-08
    url = f"https://api.frankfurter.app/{start_date.isoformat()}..{end_date.isoformat()}"
    response = requests.get(url, params=params, timeout=10)
    data = response.json()
    return data.get("rates", {})

def compute_volatility(rates_by_date):
    """
    Calculates how much a currency's price changed on average each day.
    
    1. 'Volatility' means how much the price moves up or down.
    2. We look at the price for Day 1 and Day 2, calculate the % difference.
    3. We do this for all 7 days and take the average.
    4. Higher number = More unstable/risky currency.
    """
    # Sort dates to ensure we compare Day 1 to Day 2, then Day 2 to Day 3, etc.
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
                # Formula: abs(Absolute Difference / Previous Price * 100)
                pct_change = abs((curr_rate - prev_rate) / prev_rate * 100)
                changes.append(pct_change)

        if changes:
            # Average the daily changes
            volatility[currency] = round(sum(changes) / len(changes), 3)

    return volatility