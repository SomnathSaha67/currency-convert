"""
WHAT: This file implements 'Arbitrage' detection.
WHY: Arbitrage is a way to make profit by converting money through a series of different currencies 
     (e.g., USD -> EUR -> GBP -> USD) because the exchange rates aren't perfectly aligned.
HOW: It fetches live rates and simulates converting 100 units through 'cycles' of 3 currencies.
"""
import requests
from itertools import permutations

def get_all_rates(base_currency="USD"):
    """
    Fetches the latest exchange rates for a specific 'base' currency from a public API.
    """
    url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
    response = requests.get(url)
    return response.json()["rates"]

def find_arbitrage_opportunities(currencies=None, min_profit=0.5, include_currencies=None):
    """
    The main logic to find profitable conversion loops.
    
    1. It picks a list of currencies to check.
    2. It fetches the prices for every currency.
    3. It tries every possible combination of 3 currencies (a 'triangle').
    4. If the final amount is higher than the starting amount, it's an 'opportunity'.
    """
    # Default list of major world currencies to check if none are provided
    if currencies is None:
        currencies = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "BRL", "MXN", "ZAR"]

    # If the user selected specific currencies in the app, we make sure they are included
    if include_currencies:
        for curr in include_currencies:
            if curr not in currencies:
                currencies.append(curr)

    opportunities = []

    # Step 1: Get rates for each currency so we can simulate conversions
    all_rates = {}
    for currency in currencies:
        try:
            all_rates[currency] = get_all_rates(currency)
        except Exception:
            continue

    # Step 2: Check all 3-currency 'triangles' (permutations)
    for combo in permutations(currencies, 3):
        curr1, curr2, curr3 = combo

        try:
            # We start with 100 units of the first currency
            amount = 100

            # Convert: Currency 1 -> Currency 2
            rate1 = all_rates[curr1][curr2]
            amount_after_1 = amount * rate1

            # Convert: Currency 2 -> Currency 3
            rate2 = all_rates[curr2][curr3]
            amount_after_2 = amount_after_1 * rate2

            # Convert: Currency 3 -> back to Currency 1
            rate3 = all_rates[curr3][curr1]
            final_amount = amount_after_2 * rate3

            # Calculate if we made a profit (e.g., started with 100, ended with 101 = 1% profit)
            profit_percent = ((final_amount - amount) / amount) * 100

            # Only report it if the profit is above our minimum (e.g., 0.5%)
            if profit_percent > min_profit:
                # Deduplication logic: We don't want to show A->B->C and B->C->A as separate things.
                # We create a 'canonical' version of the cycle to identify duplicates.
                cycle = [curr1, curr2, curr3]
                min_idx = cycle.index(min(cycle))
                canonical_cycle = tuple(cycle[min_idx:] + cycle[:min_idx])
                
                opportunities.append({
                    "chain": f"{curr1} -> {curr2} -> {curr3} -> {curr1}",
                    "start_amount": amount,
                    "final_amount": round(final_amount, 2),
                    "profit_percent": round(profit_percent, 2),
                    "canonical": canonical_cycle,  # Used internally to remove duplicates
                    "rates": {
                        f"{curr1}/{curr2}": rate1,
                        f"{curr2}/{curr3}": rate2,
                        f"{curr3}/{curr1}": rate3
                    }
                })
        except Exception:
            continue

    # Step 3: Remove duplicate cycles (different starting points for the same loop)
    unique_opportunities = {}
    for opp in opportunities:
        if opp["canonical"] not in unique_opportunities:
             unique_opportunities[opp["canonical"]] = opp
        else:
             # If we find the same cycle again, keep the one with higher profit
             if opp["profit_percent"] > unique_opportunities[opp["canonical"]]["profit_percent"]:
                 unique_opportunities[opp["canonical"]] = opp
                 
    deduped_opportunities = list(unique_opportunities.values())

    # Step 4: Sort the results so the most relevant ones appear first
    if include_currencies:
        def priority_sort(opp):
            # Prioritize loops that contain the currencies the user is interested in
            matches = sum(1 for c in include_currencies if c in opp["canonical"])
            return (-matches, -opp["profit_percent"])
        
        deduped_opportunities.sort(key=priority_sort)
    else:
        # Otherwise, just sort by highest profit
        deduped_opportunities.sort(key=lambda x: x["profit_percent"], reverse=True)
    
    # Remove the internal 'canonical' key before sending to the frontend
    for opp in deduped_opportunities:
        if "canonical" in opp:
            del opp["canonical"]

    return deduped_opportunities

# This block only runs if you run THIS file directly (e.g., 'python arbitrage.py')
if __name__ == "__main__":
    print("Finding arbitrage opportunities...")
    opportunities = find_arbitrage_opportunities()

    if opportunities:
        print(f"\nFound {len(opportunities)} unique opportunities:")
        for opp in opportunities[:3]:
            print(f"\n{opp['chain']}")
            print(f"Profit: {opp['profit_percent']}%")
    else:
        print("No arbitrage opportunities found (rates are balanced)")