import requests
import json
import os
from datetime import datetime

def run_analysis():
    print("🚀 Veri toplama başladı...")
    results = []
    
    try:
        # 1. Binance vadeli sembollerini çek (Güncel FAPI v1 ExchangeInfo)
        info_url = "https://fapi.binance.com/fapi/v1/exchangeInfo"
        symbols_data = requests.get(info_url, timeout=15).json()
        
        # Sadece USDT çiftlerini ve aktif olanları filtrele
        symbols = [s["symbol"] for s in symbols_data["symbols"] 
                   if s["quoteAsset"] == "USDT" and s["status"] == "TRADING"][:150] # İlk 150 coin

        # 2. Mevcut 24s fiyat değişimlerini çek (Toplu çekim daha güvenlidir)
        ticker_url = "https://fapi.binance.com/fapi/v1/ticker/24hr"
        tickers = requests.get(ticker_url, timeout=15).json()
        ticker_map = {t["symbol"]: t for t in tickers}

        for s in symbols:
            if s in ticker_map:
                t = ticker_map[s]
                price = float(t["lastPrice"])
                change = float(t["priceChangePercent"])
                
                # Hiçbir filtre yok! Canlı olan her şeyi ekle.
                results.append({
                    "symbol": s,
                    "price": round(price, 6) if price < 1 else round(price, 2),
                    "rsi": 50.0, # Analiz hatası olmaması için varsayılan değer
                    "price_change": round(change, 2),
                    "volume_change": 0.00,
                    "score": round(abs(change), 2),
                    "position": "Long" if change > 0 else "Short"
                })

    except Exception as e:
        print(f"❌ HATA OLUŞTU: {e}")

    # DOSYA YOLU: GitHub Actions için tam uyumlu
    output_path = "coin_backend/data.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    final_data = {
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "coins": results
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=4)
    
    print(f"✅ BİTTİ! {len(results)} adet coin dosyaya yazıldı.")

if __name__ == "__main__":
    run_analysis()
