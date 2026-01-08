import requests
import pandas as pd
import numpy as np
import json
import time
import os
import math
from datetime import datetime

def get_futures_symbols():
    url = "https://fapi.binance.com/fapi/v1/exchangeInfo"
    data = requests.get(url).json()
    symbols = [s["symbol"] for s in data["symbols"]
             if s["contractType"] == "PERPETUAL" and s["quoteAsset"] == "USDT"]
    return symbols

def get_klines(symbol, interval="1h", limit=50):
    url = f"https://fapi.binance.com/fapi/v1/klines?symbol={symbol}&interval={interval}&limit={limit}"
    data = requests.get(url).json()
    df = pd.DataFrame(data, columns=[
        "OpenTime", "Open", "High", "Low", "Close", "Volume",
        "CloseTime", "QuoteVolume", "Trades", "BaseBuyVolume",
        "QuoteBuyVolume", "Ignore"
    ])
    df["Close"] = df["Close"].astype(float)
    df["Volume"] = df["Volume"].astype(float)
    return df

def calc_rsi(prices, period=14):
    delta = prices.diff()
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)
    avg_gain = pd.Series(gain).rolling(period).mean()
    avg_loss = pd.Series(loss).rolling(period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def analyze_symbol(symbol):
    try:
        df = get_klines(symbol)
        df["RSI"] = calc_rsi(df["Close"])
        rsi = df["RSI"].iloc[-1]
        price = df["Close"].iloc[-1]
        price_change = (df["Close"].iloc[-1] / df["Close"].iloc[-2] - 1) * 100
        volume_change = (df["Volume"].iloc[-1] / df["Volume"].iloc[-2] - 1) * 100
        score = price_change + (70 - abs(rsi - 50)) / 5 + volume_change / 10

        if rsi > 65:
            position = "Short"
        elif rsi < 35:
            position = "Long"
        else:
            position = "Bekle"

        return {
            "symbol": symbol,
            "price": round(price, 4),
            "rsi": round(rsi, 2),
            "price_change": round(price_change, 2),
            "volume_change": round(volume_change, 2),
            "score": round(score, 2),
            "position": position
        }
    except Exception as e:
        print(f"{symbol} hata: {e}")
        return None

def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Analiz başladı...")
    symbols = get_futures_symbols()
    results = []

    for s in symbols:
        r = analyze_symbol(s)
        if r:
            results.append(r)
        time.sleep(0.2)  # Binance API limiti

    # NaN ve sonsuz değerleri temizle
    for r in results:
        for k, v in r.items():
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                r[k] = None

    # 🔥 DÜZELTİLDİ: data.json'u script'in yanına kaydet
    output_path = os.path.join(os.path.dirname(__file__), "data.json")

    data = {
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "coins": results
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"✅ data.json oluşturuldu: {output_path}")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Analiz bitti. Çıkılıyor.")

# Script'in çalışmasını başlat
if __name__ == "__main__":
    main()

