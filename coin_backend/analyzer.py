import requests
import pandas as pd
import numpy as np
import os

def run_analysis():
    print("Analiz başlıyor...")
    # Binance'den sadece USDT çiftlerini çek (Sınırlandırılmış liste)
    url = "https://api.binance.com/api/v3/ticker/24hr"
    try:
        response = requests.get(url, timeout=10) # 10 saniye sınırı koyduk
        data = response.json()
    except Exception as e:
        print(f"Hata: {e}")
        return

    df = pd.DataFrame(data)
    # Sadece USDT olanları ve hacmi yüksek olanları al (Hızlandırmak için)
    df = df[df['symbol'].str.endswith('USDT')]
    df['quoteVolume'] = df['quoteVolume'].astype(float)
    df = df.nlargest(150, 'quoteVolume') # En yüksek hacimli 150 taneye odaklan

    results = []
    for index, row in df.iterrows():
        results.append({
            "symbol": row['symbol'],
            "price": row['lastPrice'],
            "change": row['priceChangePercent'],
            "volume": row['quoteVolume']
        })

    # Dosyayı kaydet
    output_path = os.path.join(os.path.dirname(__file__), "data.json")
    pd.DataFrame(results).to_json(output_path, orient='records')
    print(f"Analiz tamamlandı. {len(results)} coin kaydedildi.")

if __name__ == "__main__":
    run_analysis()
