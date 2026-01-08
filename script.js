// ====== GLOBAL DEĞİŞKENLER ======
let favorites = JSON.parse(localStorage.getItem('coin_favs')) || [];
let allCoins = []; 

// Manuel Logo Eşleşmeleri
const manualLogoMap = {
    "TURTLEUSDT": "https://assets.coingecko.com/coins/images/69595/standard/OUDzqTkE_400x400.png?1759166194",
    "C98USDT": "https://assets.coingecko.com/coins/images/17117/standard/logo.png?1696516677",
    "MASKUSDT": "https://assets.coingecko.com/coins/images/14051/standard/Mask_Network.jpg?1696513776"
};

// Logo URL Oluşturucu
function getLogoUrl(symbol) {
    let base = symbol.replace(/USDT$|BUSD$|USDC$/g, "");
    base = base.replace(/^1000000|^100000|^1000|^100/g, "");
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${base.toLowerCase()}.svg`;
}

// ====== ANA VERİ YÜKLEME ======
async function loadCoinData() {
    const tbody = document.querySelector("#coinTable tbody");
    const updateText = document.getElementById("lastUpdateText");

    try {
        const url = "coin_backend/data.json?t=" + Date.now(); 
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Veri dosyasına ulaşılamıyor!");
        
        const analysisData = await response.json();
        console.log("Gelen Veri:", analysisData); // Konsoldaki 'Object'

        // 🔥 ESNEK VERİ YAKALAMA: Veri paketi (Object) içindeki listeyi bulur 🔥
        if (analysisData.coins && Array.isArray(analysisData.coins)) {
            allCoins = analysisData.coins;
        } else if (Array.isArray(analysisData)) {
            allCoins = analysisData;
        } else if (typeof analysisData === 'object') {
            // Eğer veri objeyse, içindeki ilk liste olan anahtarı bul (Örn: 'coins', 'data' vb.)
            const listKey = Object.keys(analysisData).find(key => Array.isArray(analysisData[key]));
            allCoins = listKey ? analysisData[listKey] : [];
        }

        renderTable(allCoins);
        
        if (updateText) {
            updateText.textContent = analysisData.last_update || new Date().toLocaleString();
        }

    } catch (error) {
        console.error("KRİTİK HATA:", error);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="color:#ff4444; text-align:center;">Hata: ${error.message}</td></tr>`;
    }
}

// ====== TABLOYU ÇİZDİRME ======
function renderTable(data) {
    const tbody = document.querySelector("#coinTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">⚠️ GitHub'daki data.json'un içine veri yazılmamış.</td></tr>`;
        return;
    }
    
    data.forEach((c) => {
        const row = document.createElement("tr");
        const positionColor = c.position === "Long" ? "#00ff88" : c.position === "Short" ? "#ff4444" : "#aaa";
        const star = favorites.includes(c.symbol) ? "⭐" : "☆";
        const logoUrl = manualLogoMap[c.symbol] || getLogoUrl(c.symbol);

        row.innerHTML = `
            <td class="fav-cell" style="cursor:pointer; text-align:center; font-size:1.2rem;">${star}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${logoUrl}" width="24" height="24" onerror="this.style.visibility='hidden'">
                    <span class="coin-symbol" style="cursor:pointer; font-weight:bold; color:#00d4ff;">${c.symbol}</span>
                </div>
            </td>
            <td>${c.price || "-"}</td>
            <td>${c.rsi || "-"}</td>
            <td style="color:${parseFloat(c.price_change) >= 0 ? '#00ff88' : '#ff4444'}">${c.price_change || "0"}%</td>
            <td style="color:${parseFloat(c.volume_change) >= 0 ? '#00ff88' : '#ff4444'}">${c.volume_change || "0"}%</td>
            <td>${c.score || "0"}</td>
            <td style="color:${positionColor}; font-weight:bold;">${c.position || "-"}</td>
        `;

        row.querySelector(".fav-cell").onclick = () => toggleFavorite(c.symbol);
        row.querySelector(".coin-symbol").onclick = () => {
            window.open(`https://www.tradingview.com/chart/?symbol=BINANCE:${c.symbol}`, '_blank');
        };

        tbody.appendChild(row);
    });
}

function toggleFavorite(symbol) {
    if (favorites.includes(symbol)) favorites = favorites.filter(f => f !== symbol);
    else favorites.push(symbol);
    localStorage.setItem('coin_favs', JSON.stringify(favorites));
    renderTable(allCoins); 
}

// ====== BAŞLATMA ======
document.addEventListener("DOMContentLoaded", () => {
    loadCoinData();
    setInterval(loadCoinData, 15 * 60 * 1000);
    
    const searchInput = document.getElementById("coinSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toUpperCase();
            renderTable(allCoins.filter(c => c.symbol.includes(term)));
        });
    }

    const analyzeBtn = document.getElementById("analyzeBtn");
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", () => {
            analyzeBtn.textContent = "⌛ Güncelleniyor...";
            loadCoinData().finally(() => {
                setTimeout(() => { analyzeBtn.textContent = "⚡ Analizi Güncelle ve Yenile"; }, 1000);
            });
        });
    }
});

