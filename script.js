// ====== GLOBAL ======
let favorites = [];
let currentUserEmail = "";
let showingFavorites = false;

const manualLogoMap = {
    "TURTLEUSDT": "https://assets.coingecko.com/coins/images/69595/standard/OUDzqTkE_400x400.png?1759166194",
    "C98USDT": "https://assets.coingecko.com/coins/images/17117/standard/logo.png?1696516677",
    "MASKUSDT": "https://assets.coingecko.com/coins/images/14051/standard/Mask_Network.jpg?1696513776"
};

// ====== FİYAT FORMATLAMA ======
function formatPrice(price) {
    if (price == null || isNaN(price)) { return "-"; }
    if (price < 0.001 && price > 0) { return price.toFixed(8); }
    if (price < 1 && price > 0) { return price.toFixed(4); }
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ====== LOGO YÖNETİMİ ======
function getBaseSymbol(symbol) {
    let base = symbol;
    const quotes = ["USDT", "BUSD", "USDC", "TUSD", "FDUSD", "ETH", "BTC"];
    for (const quote of quotes) { if (base.endsWith(quote) && base.length > quote.length) { base = base.substring(0, base.length - quote.length); break; } }
    const prefixes = ["1000000", "100000", "1000", "100"];
    for (const prefix of prefixes) { if (base.startsWith(prefix)) { base = base.substring(prefix.length); break; } }
    return base.toLowerCase();
}

function getLogoUrl(symbol) {
    const baseSymbol = getBaseSymbol(symbol);
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${baseSymbol}.svg`;
}

// ====== OTOMATİK YENİLEME (15 DK) ======
function setupSyncRefresh() {
    const now = new Date();
    const mins = now.getMinutes();
    const nextInterval = 15 - (mins % 15);
    const msToWait = (nextInterval * 60 - now.getSeconds()) * 1000;
    setTimeout(() => {
        loadCoinData(); 
        setInterval(loadCoinData, 15 * 60 * 1000); 
    }, msToWait);
}

// ====== ANA VERİ YÜKLEME ======
async function loadCoinData() {
    const tbody = document.querySelector("#coinTable tbody");
    if (tbody && tbody.innerHTML.trim() === "") {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#aaa;">⏳ Veriler çekiliyor...</td></tr>`;
    }

    try {
        // Netlify ve Klasör yapısına uygun yol
        const url = `${window.location.origin}/coin_backend/data.json?t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Veri dosyası (data.json) bulunamadı!`);
        const analysisData = await response.json();

        tbody.innerHTML = ""; 
        analysisData.coins.forEach((c) => {
            const row = document.createElement("tr");
            const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${c.symbol}`;
            const positionColor = c.position === "Long" ? "limegreen" : c.position === "Short" ? "red" : "gray";
            const star = favorites.includes(c.symbol) ? "⭐" : "☆";
            let logoUrl = manualLogoMap[c.symbol] || getLogoUrl(c.symbol);

            row.innerHTML = `
                <td class="fav-cell" style="cursor:pointer">${star}</td>
                <td>
                    <div class="coin-cell-content" style="display:flex; align-items:center; gap:8px;">
                        <img src="${logoUrl}" class="coin-logo" width="24" onerror="this.style.visibility='hidden'">
                        <span class="coin-symbol" style="cursor:pointer; text-decoration:underline; color:#79c0ff">${c.symbol}</span>
                    </div>
                </td>
                <td>${formatPrice(c.price)}</td>
                <td>${c.rsi ?? "-"}</td>
                <td style="color:${c.price_change >= 0 ? 'limegreen' : 'red'}">${c.price_change?.toFixed(2)}%</td>
                <td>${c.volume_change?.toFixed(2)}%</td>
                <td>${c.score}</td>
                <td style="color:${positionColor}; font-weight:bold;">${c.position}</td>
            `;
            tbody.appendChild(row);

            // Tıklama olayları
            row.querySelector(".fav-cell").onclick = () => toggleFavorite(c.symbol);
            row.querySelector(".coin-symbol").onclick = () => window.open(tradingViewUrl, '_blank');
        });

        // Güncelleme Saatini Yaz
        let updateText = document.getElementById("lastUpdate");
        if (updateText) updateText.textContent = `🕒 Son Güncelleme: ${analysisData.last_update}`;

    } catch (error) {
        if(tbody) tbody.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">Hata: ${error.message}</td></tr>`;
    }
}

// ====== FAVORİ VE ARAMA SİSTEMİ ======
function toggleFavorite(symbol) {
    if (favorites.includes(symbol)) {
        favorites = favorites.filter(f => f !== symbol);
    } else {
        favorites.push(symbol);
    }
    loadCoinData(); // Tabloyu tazele
}

// Başlat
document.addEventListener("DOMContentLoaded", () => {
    loadCoinData();
    setupSyncRefresh();
});
