import requests
from itertools import permutations

def get_all_rates(base_currency="USD"):
    """Fetch rates for all currencies"""
    url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
    response = requests.get(url)
    return response.json()["rates"]

def find_arbitrage_opportunities(currencies=None, min_profit=0.5):
    """
    Find profitable currency conversion chains.

    Args:
        currencies: List of currencies to check
        min_profit: Minimum profit % to report

    Returns:
        List of arbitrage opportunities
    """
    if currencies is None:
        currencies = ["USD", "EUR", "GBP", "INR", "JPY"]

    opportunities = []

    # Get rates for each currency
    all_rates = {}
    for currency in currencies:
        try:
            all_rates[currency] = get_all_rates(currency)
        except Exception:
            continue

    # Check all 3-currency combinations
    for combo in permutations(currencies, 3):
        curr1, curr2, curr3 = combo

        try:
            # Start with 100 units of curr1
            amount = 100

            # curr1 -> curr2
            rate1 = all_rates[curr1][curr2]
            amount_after_1 = amount * rate1

            # curr2 -> curr3
            rate2 = all_rates[curr2][curr3]
            amount_after_2 = amount_after_1 * rate2

            # curr3 -> curr1 (back to original)
            rate3 = all_rates[curr3][curr1]
            final_amount = amount_after_2 * rate3

            # Calculate profit
            profit_percent = ((final_amount - amount) / amount) * 100

            # If profitable, add to opportunities
            if profit_percent > min_profit:
                opportunities.append({
                    "chain": f"{curr1} -> {curr2} -> {curr3} -> {curr1}",
                    "start_amount": amount,
                    "final_amount": round(final_amount, 2),
                    "profit_percent": round(profit_percent, 2),
                    "rates": {
                        f"{curr1}/{curr2}": rate1,
                        f"{curr2}/{curr3}": rate2,
                        f"{curr3}/{curr1}": rate3
                    }
                })
        except Exception:
            continue

    # Sort by profit (highest first)
    opportunities.sort(key=lambda x: x["profit_percent"], reverse=True)

    return opportunities

# Test
if __name__ == "__main__":
    print("Finding arbitrage opportunities...")
    opportunities = find_arbitrage_opportunities()

    if opportunities:
        print(f"\nFound {len(opportunities)} opportunities:")
        for opp in opportunities[:3]:
            print(f"\n{opp['chain']}")
            print(f"Profit: {opp['profit_percent']}%")
    else:
        print("No arbitrage opportunities found (rates are balanced)")