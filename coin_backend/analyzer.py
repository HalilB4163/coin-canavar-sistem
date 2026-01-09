import requests
import json
import os
from datetime import datetime

def run_analysis():
    print("🚀 Veri toplama başladı...")
    results = []

    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        # ✅ SPOT (market-data-only) base URL
        base = "https://data-api.binance.vision"

        # 1) Spot exchangeInfo
        info_url = f"{base}/api/v3/exchangeInfo"
        symbols_data = requests.get(info_url, headers=headers, timeout=20).json()

        if "symbols" not in symbols_data:
            raise Exception(f"exchangeInfo beklenen formatta değil: {symbols_data}")

        # Sadece USDT ve TRADING olanlar
        symbols = [
            s["symbol"]
            for s in symbols_data["symbols"]
            if s.get("quoteAsset") == "USDT" and s.get("status") == "TRADING"
        ]

        # 2) Spot 24hr ticker
        ticker_url = f"{base}/api/v3/ticker/24hr"
        tickers = requests.get(ticker_url, headers=headers, timeout=20).json()

        if not isinstance(tickers, list):
            raise Exception(f"ticker/24hr liste dönmedi: {tickers}")

        ticker_map = {t["symbol"]: t for t in tickers if "symbol" in t}

        for s in symbols:
            t = ticker_map.get(s)
            if not t:
                continue

            price = float(t["lastPrice"])
            change = float(t["priceChangePercent"])

            results.append({
                "symbol": s,
                "price": round(price, 6) if price < 1 else round(price, 2),
                "rsi": 50.0,
                "price_change": round(change, 2),
                "volume_change": 0.00,
                "score": round(abs(change), 2),
                "position": "Long" if change > 0 else "Short"
            })

    except Exception as e:
        print(f"❌ HATA OLUŞTU: {e}")

    # Dosya yolu: coin_backend/data.json
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, "data.json")

    final_data = {
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "coins": results
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=4, ensure_ascii=False)

    print(f"✅ BİTTİ! {len(results)} adet coin dosyaya yazıldı -> {output_path}")

if __name__ == "__main__":
    run_analysis()




