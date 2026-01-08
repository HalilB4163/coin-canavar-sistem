import requests
import pandas as pd
import json
import os
import math
import warnings
from datetime import datetime

warnings.filterwarnings("ignore", category=RuntimeWarning)

def get_futures_symbols():
    try:
        url = "https://fapi.binance.com/fapi/v1/exchangeInfo"
        response = requests.get(url, timeout=20)
        data = response.json()
        # Sadece USDT çiftli vadeli sembolleri al
        return [s["symbol"] for s in data["symbols"] if s["quoteAsset"] == "USDT"]
    except Exception as e:
        print(f"❌ Sembol listesi alınamadı: {e}")
        return []

def get_klines(symbol):
    try:
        url = f"https://fapi.binance.com/fapi/v1/klines?symbol={symbol}&interval=1h&limit=50"
        response = requests.get(url, timeout=10)
        data = response.json()
        if not isinstance(data, list) or len(data) < 20: return None
        df = pd.DataFrame(data, columns=["OT","O","H","L","C","V","CT","QV","T","BBV","QBV","I"])
        df["C"] = df["C"].astype(float)
        df["V"] = df["V"].astype(float)
        return df
    except: return None

def analyze_symbol(symbol):
    df = get_klines(symbol)
    if df is None: return None
    
    # RSI Hesaplama (14 periyot)
    delta = df["C"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss.replace(0, 0.000001)
    rsi = 100 - (100 / (1 + rs)).iloc[-1]
    
    price = df["C"].iloc[-1]
    price_change = (price / df["C"].iloc[-2] - 1) * 100
    
    v_now = df["V"].iloc[-1]
    v_prev = df["V"].iloc[-2] if df["V"].iloc[-2] != 0 else 0.000001
    volume_change = (v_now / v_prev - 1) * 100
    
    # 🚫 SADECE HACMİ BİTMİŞ (-%100) COİNLERİ ELİYORUZ
    if volume_change <= -99.9:
        return None
    
    # RSI SINIRI YOK: Her RSI değerine bir etiket veriyoruz
    if rsi > 70: pos = "Aşırı Alım"
    elif rsi > 55: pos = "Short"
    elif rsi < 30: pos = "Aşırı Satım"
    elif rsi < 45: pos = "Long"
    else: pos = "Nötr"
    
    # Skor hesaplama (Değişim ve RSI ağırlıklı)
    score = price_change + (volume_change / 20)
    
    return {
        "symbol": symbol, 
        "price": round(price, 6) if price < 1 else round(price, 2),
        "rsi": round(rsi, 2) if not math.isnan(rsi) else 50,
        "price_change": round(price_change, 2),
        "volume_change": round(volume_change, 2),
        "score": round(score, 2),
        "position": pos
    }

def run_analysis():
    print(f"🚀 Analiz başladı: {datetime.now()}")
    symbols = get_futures_symbols()
    results = []
    
    # Tüm sembolleri tara (Hız için ilk 100 tanesini çok hızlı yapar, hepsini istersen [:100] sil)
    for s in symbols:
        r = analyze_symbol(s)
        if r: results.append(r)
        
    # Dosya yolu (coin_backend/data.json)
    # GitHub Actions ana dizinden çalıştığı için yol bu şekilde:
    output_path = "coin_backend/data.json"
    
    # Klasör yoksa oluştur
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    data = {
        "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "coins": results
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        
    print(f"✅ İşlem tamam! {len(results)} coin kaydedildi.")

if __name__ == "__main__":
    run_analysis()
