// ====== GLOBAL DEĞİŞKENLER ======
let favorites = JSON.parse(localStorage.getItem('coin_favs')) || [];
let allCoins = []; 

const manualLogoMap = {
    "TURTLEUSDT": "https://assets.coingecko.com/coins/images/69595/standard/OUDzqTkE_400x400.png?1759166194",
    "C98USDT": "https://assets.coingecko.com/coins/images/17117/standard/logo.png?1696516677",
    "MASKUSDT": "https://assets.coingecko.com/coins/images/14051/standard/Mask_Network.jpg?1696513776"
};

// ====== YARDIMCI FONKSİYONLAR ======
function formatPrice(price) {
    if (price == null || isNaN(price)) return "-";
    const p = parseFloat(price);
    if (p < 0.001) return p.toFixed(8);
    if (p < 1) return p.toFixed(4);
    return p.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getLogoUrl(symbol) {
    let base = symbol.replace(/USDT$|BUSD$|USDC$/g, "");
    base = base.replace(/^1000000|^100000|^1000|^100/g, "");
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${base.toLowerCase()}.svg`;
}

// ====== ANA VERİ YÜKLEME ======
async function loadCoinData() {
    const tbody = document.querySelector("#coinTable tbody");
    const updateText = document.getElementById("lastUpdateText"); // Index'teki span ID'sine uygun hale getirildi

    try {
        // 🔥 Netlify ve GitHub Pages için en güvenli dosya yolu 🔥
        const url = "coin_backend/data.json?t=" + Date.now(); 
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Veri dosyası yüklenemedi! (Durum: ${response.status})`);
        }
        
        const analysisData = await response.json();
        
        // Veri yapısı kontrolü
        if (!analysisData || !analysisData.coins) {
            throw new Error("JSON verisi beklenen formatta değil!");
        }

        allCoins = analysisData.coins;
        renderTable(allCoins);
        
        if (updateText) {
            updateText.textContent = analysisData.last_update || "Bilinmiyor";
        }

    } catch (error) {
        console.error("KRİTİK HATA:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="color:#ff4444; text-align:center; padding: 20px;">
                ⚠️ Veriler şu an yüklenemiyor. <br> 
                <small>Hata Detayı: ${error.message}</small>
            </td></tr>`;
        }
    }
}

// ====== TABLOYU ÇİZDİRME ======
function renderTable(data) {
    const tbody = document.querySelector("#coinTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Aranan kriterde coin bulunamadı.</td></tr>`;
        return;
    }
    
    data.forEach((c) => {
        const row = document.createElement("tr");
        const positionColor = c.position === "Long" ? "#00ff88" : c.position === "Short" ? "#ff4444" : "#aaa";
        const star = favorites.includes(c.symbol) ? "⭐" : "☆";
        const logoUrl = manualLogoMap[c.symbol] || getLogoUrl(c.symbol);

        row.innerHTML = `
            <td class="fav-cell" style="cursor:pointer; font-size:1.2rem; text-align:center;">${star}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${logoUrl}" width="24" height="24" onerror="this.style.display='none'">
                    <span class="coin-symbol" style="cursor:pointer; font-weight:bold; color:#00d4ff;">${c.symbol}</span>
                </div>
            </td>
            <td>${formatPrice(c.price)}</td>
            <td>${c.rsi || "-"}</td>
            <td style="color:${c.price_change >= 0 ? '#00ff88' : '#ff4444'}">${c.price_change ? c.price_change.toFixed(2) + '%' : '0.00%'}</td>
            <td style="color:${c.volume_change >= 0 ? '#00ff88' : '#ff4444'}">${c.volume_change ? c.volume_change.toFixed(2) + '%' : '0.00%'}</td>
            <td>${c.score || "0"}</td>
            <td style="color:${positionColor}; font-weight:bold;">${c.position || "Nötr"}</td>
        `;

        row.querySelector(".fav-cell").onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(c.symbol);
        };
        
        row.querySelector(".coin-symbol").onclick = () => {
            window.open(`https://www.tradingview.com/chart/?symbol=BINANCE:${c.symbol}`, '_blank');
        };

        tbody.appendChild(row);
    });
}

// ====== FAVORİ SİSTEMİ ======
function toggleFavorite(symbol) {
    if (favorites.includes(symbol)) {
        favorites = favorites.filter(f => f !== symbol);
    } else {
        favorites.push(symbol);
    }
    localStorage.setItem('coin_favs', JSON.stringify(favorites));
    renderTable(allCoins); 
}

// ====== BAŞLATMA ======
document.addEventListener("DOMContentLoaded", () => {
    loadCoinData();
    
    // 15 dakikada bir güncelle
    setInterval(loadCoinData, 15 * 60 * 1000);

    const searchInput = document.getElementById("coinSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toUpperCase();
            const filtered = allCoins.filter(c => c.symbol.includes(term));
            renderTable(filtered);
        });
    }

    // Analiz Butonu Desteği
    const analyzeBtn = document.getElementById("analyzeBtn");
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", () => {
            analyzeBtn.textContent = "⏳ Güncelleniyor...";
            loadCoinData().finally(() => {
                setTimeout(() => { analyzeBtn.textContent = "⚡ Analizi Güncelle ve Yenile"; }, 1000);
            });
        });
    }
});
