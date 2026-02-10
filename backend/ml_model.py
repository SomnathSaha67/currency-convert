"""
WHAT: This is the 'AI' part of the app. It predicts future currency prices.
WHY: Users want to know if a currency will go up or down in the next week.
HOW: It uses 'Linear Regression' (drawing a straight line through past prices to see where it points).
"""
import yfinance as yf
from datetime import date, timedelta
from sklearn.linear_model import LinearRegression
import numpy as np
import pandas as pd

def fetch_last_n_days(base="USD", target="EUR", days=60):
    """
    Fetches historical price data from Yahoo Finance.
    
    This is tricky because not all currency pairs are traded directly.
    Example: To get 'INR to IDR', we might need to go 'INR -> USD' then 'USD -> IDR'.
    """
    if base == target:
        return [1.0] * days

    # We fetch a bit more than 'days' to account for weekends when markets are closed.
    end_date = date.today()
    start_date = end_date - timedelta(days=days + 60) 

    def get_close(symbol):
        """Helper to download and clean data for a specific ticker symbol (like 'USDEUR=X')."""
        try:
            df = yf.download(symbol, start=start_date, end=end_date, progress=False)
            if df.empty or 'Close' not in df.columns:
                return None
            
            # yfinance sometimes returns complex data; we just want the 'Close' prices.
            close = df['Close']
            if isinstance(close, pd.DataFrame):
                close = close.iloc[:, 0]
            
            return close.dropna()
        except Exception as e:
            print(f"Warning: Failed to fetch {symbol}: {e}")
            return None

    # Step 1: Try the direct pair (e.g., USDEUR=X)
    s1 = get_close(f"{base}{target}=X")
    if s1 is not None and len(s1) >= 10:
        return s1.tolist()[-days:]

    # Step 2: Try the inverted pair (e.g., EURUSD=X) and flip the price
    s2 = get_close(f"{target}{base}=X")
    if s2 is not None and len(s2) >= 10:
        return (1 / s2).tolist()[-days:]

    # Step 3: Use USD as a 'Bridge'
    # Many niche currencies are only traded against the US Dollar.
    # Logic: (A -> USD) * (USD -> B) = A -> B
    
    # a) Get Base -> USD
    base_to_usd = None
    if base == "USD":
        base_to_usd = pd.Series(1.0, index=pd.date_range(start=start_date, end=end_date))
    else:
        base_to_usd = get_close(f"{base}USD=X")
        if base_to_usd is None or len(base_to_usd) < 5:
            usd_base = get_close(f"USD{base}=X")
            if usd_base is not None:
                base_to_usd = 1 / usd_base
    
    # b) Get USD -> Target
    usd_to_target = None
    if target == "USD":
        usd_to_target = pd.Series(1.0, index=pd.date_range(start=start_date, end=end_date))
    else:
        usd_to_target = get_close(f"USD{target}=X")
        if usd_to_target is None or len(usd_to_target) < 5:
            target_usd = get_close(f"{target}USD=X")
            if target_usd is not None:
                usd_to_target = 1 / target_usd

    # c) Combine them
    if base_to_usd is not None and usd_to_target is not None:
        # We align the dates (e.g., multiply Monday's INR price by Monday's IDR price)
        combined = pd.concat([base_to_usd, usd_to_target], axis=1, join='inner')
        combined.columns = ['B', 'T']
        cross_rate = combined['B'] * combined['T']
        if len(cross_rate) >= 10:
            return cross_rate.tolist()[-days:]

    return []

def predict_next_7_days(base="USD", target="EUR"):
    """
    Trains the AI model and generates a 7-day forecast.
    """
    # 1. Get past data (60 days)
    rates = fetch_last_n_days(base, target, days=60)

    if len(rates) < 10:
        return []

    # 2. Prepare data for the model
    # X = The day number (0, 1, 2...), Y = The price on that day
    X = np.array(range(len(rates))).reshape(-1, 1)
    y = np.array(rates)

    # 3. 'Train' the Linear Regression model
    model = LinearRegression()
    model.fit(X, y)

    # 4. Ask the model: 'What will the price be for days 61, 62, 63...?'
    future_X = np.array(range(len(rates), len(rates) + 7)).reshape(-1, 1)
    predictions = model.predict(future_X)

    # Round results so they are easy to read (e.g., 1.2345)
    return [round(float(p), 4) for p in predictions]