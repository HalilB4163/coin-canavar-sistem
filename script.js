// ====== GLOBAL DEĞİŞKENLER ======
let favorites = JSON.parse(localStorage.getItem('coin_favs')) || [];
let allCoins = []; 

// ====== ANA VERİ YÜKLEME ======
async function loadCoinData() {
    const tbody = document.querySelector("#coinTable tbody");
    const updateText = document.getElementById("lastUpdateText");

    try {
        const url = "coin_backend/data.json?t=" + Date.now(); 
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Dosya yüklenemedi!");
        
        const analysisData = await response.json();
        console.log("Gelen Veri:", analysisData); 

        // 🔥 ESNEK VERİ YAKALAMA: Veri her nerede olursa olsun bulur
        if (analysisData.coins && Array.isArray(analysisData.coins)) {
            allCoins = analysisData.coins;
        } else if (Array.isArray(analysisData)) {
            allCoins = analysisData;
        } else if (typeof analysisData === 'object') {
            // Eğer veri objeyse ama liste içindeyse (örnek: data: { ... })
            const firstKey = Object.keys(analysisData).find(key => Array.isArray(analysisData[key]));
            allCoins = firstKey ? analysisData[firstKey] : [];
        }

        renderTable(allCoins);
        
        if (updateText) {
            updateText.textContent = analysisData.last_update || new Date().toLocaleString();
        }

    } catch (error) {
        console.error("HATA:", error);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">Veri hatası: ${error.message}</td></tr>`;
    }
}

// ====== TABLOYU ÇİZDİRME ======
function renderTable(data) {
    const tbody = document.querySelector("#coinTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">⚠️ Liste boş veya format uyumsuz.</td></tr>`;
        return;
    }
    
    data.forEach((c) => {
        const row = document.createElement("tr");
        const positionColor = c.position === "Long" ? "#00ff88" : c.position === "Short" ? "#ff4444" : "#aaa";
        const star = favorites.includes(c.symbol) ? "⭐" : "☆";

        row.innerHTML = `
            <td class="fav-cell" style="cursor:pointer; text-align:center;">${star}</td>
            <td style="font-weight:bold; color:#00d4ff;">${c.symbol || "Bilinmiyor"}</td>
            <td>${c.price || "-"}</td>
            <td>${c.rsi || "-"}</td>
            <td style="color:${parseFloat(c.price_change) >= 0 ? '#00ff88' : '#ff4444'}">${c.price_change || "0"}%</td>
            <td style="color:${parseFloat(c.volume_change) >= 0 ? '#00ff88' : '#ff4444'}">${c.volume_change || "0"}%</td>
            <td>${c.score || "0"}</td>
            <td style="color:${positionColor}; font-weight:bold;">${c.position || "-"}</td>
        `;

        row.querySelector(".fav-cell").onclick = () => toggleFavorite(c.symbol);
        tbody.appendChild(row);
    });
}

function toggleFavorite(symbol) {
    if (favorites.includes(symbol)) favorites = favorites.filter(f => f !== symbol);
    else favorites.push(symbol);
    localStorage.setItem('coin_favs', JSON.stringify(favorites));
    renderTable(allCoins); 
}

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
});
