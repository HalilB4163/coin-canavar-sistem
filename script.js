// ====== GLOBAL DEĞİŞKENLER ======
let favorites = JSON.parse(localStorage.getItem("coin_favs")) || [];
let allCoins = [];
let logoMap = {}; // CryptoCompare coinlist cache

// ====== LOGO MAP (tek sefer / cache) ======
async function loadLogoMap() {
  const cacheKey = "cc_logo_map_v1";
  const cacheTimeKey = "cc_logo_map_time_v1";
  const cached = localStorage.getItem(cacheKey);
  const cachedTime = Number(localStorage.getItem(cacheTimeKey) || 0);

  // 24 saatte bir yenile
  if (cached && Date.now() - cachedTime < 24 * 60 * 60 * 1000) {
    try {
      logoMap = JSON.parse(cached) || {};
      return;
    } catch {
      // bozuk cache varsa devam
    }
  }

  try {
    const res = await fetch(
      "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
    );
    const json = await res.json();

    logoMap = (json && json.Data) ? json.Data : {};

    localStorage.setItem(cacheKey, JSON.stringify(logoMap));
    localStorage.setItem(cacheTimeKey, String(Date.now()));
  } catch (e) {
    console.warn("Logo listesi alınamadı (önemli değil):", e);
    logoMap = {};
  }
}

// ====== ANA VERİ YÜKLEME ======
async function loadCoinData() {
  const tbody = document.querySelector("#coinTable tbody");
  const updateText = document.getElementById("lastUpdateText");

  try {
    // Timestamp ile cache sorununu çözüyoruz
    const url = "coin_backend/data.json?t=" + Date.now();
    const response = await fetch(url);

    if (!response.ok) throw new Error("Veri dosyasına ulaşılamıyor!");

    const data = await response.json();
    console.log("Gelen Veri Kontrolü:", data);

    // Format yakalama
    if (data && data.coins && Array.isArray(data.coins)) {
      allCoins = data.coins;
    } else if (Array.isArray(data)) {
      allCoins = data;
    } else if (data && data.data && Array.isArray(data.data)) {
      allCoins = data.data;
    } else if (typeof data === "object" && data) {
      const listKey = Object.keys(data).find((key) => Array.isArray(data[key]));
      allCoins = listKey ? data[listKey] : [];
    } else {
      allCoins = [];
    }

    renderTable(allCoins);

    if (updateText && data && data.last_update) {
      updateText.textContent = data.last_update;
    }
  } catch (error) {
    console.error("HATA:", error);
    if (tbody)
      tbody.innerHTML = `<tr><td colspan="8" style="color:#ff4444; text-align:center;">Hata: ${error.message}</td></tr>`;
  }
}

// ====== TABLOYU ÇİZDİRME ======
function renderTable(data) {
  const tbody = document.querySelector("#coinTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">⚠️ GitHub'daki data.json dosyasının içini kontrol et, liste boş geliyor!</td></tr>`;
    return;
  }

  data.forEach((c) => {
    const row = document.createElement("tr");
    const positionColor =
      c.position === "Long" ? "#00ff88" : c.position === "Short" ? "#ff4444" : "#aaa";
    const star = favorites.includes(c.symbol) ? "⭐" : "☆";

    // ✅ Logo URL (CryptoCompare)
    const base = (c.base || "").toUpperCase(); // analyzer artık base gönderiyor
    const imgPath = logoMap && logoMap[base] ? logoMap[base].ImageUrl : "";
    const logoUrl = imgPath ? "https://www.cryptocompare.com" + imgPath : "";

    row.innerHTML = `
      <td class="fav-cell" style="cursor:pointer; text-align:center; font-size:1.2rem;">${star}</td>

      <td style="font-weight:bold; color:#00d4ff; cursor:pointer;"
          onclick="window.open('https://www.tradingview.com/chart/?symbol=BINANCE:${c.symbol}')">
        <div style="display:flex; align-items:center; gap:8px;">
          ${
            logoUrl
              ? `<img src="${logoUrl}" style="width:22px;height:22px;border-radius:50%;"
                      onerror="this.style.display='none'">`
              : ``
          }
          <span>${c.symbol || "Bilinmiyor"}</span>
        </div>
      </td>

      <td>${c.price ?? "-"}</td>
      <td>${c.rsi ?? "-"}</td>
      <td style="color:${parseFloat(c.price_change) >= 0 ? "#00ff88" : "#ff4444"}">${
        c.price_change ?? "0"
      }%</td>
      <td style="color:${parseFloat(c.volume_change) >= 0 ? "#00ff88" : "#ff4444"}">${
        c.volume_change ?? "0"
      }%</td>
      <td>${c.score ?? "0"}</td>
      <td style="color:${positionColor}; font-weight:bold;">${c.position ?? "-"}</td>
    `;

    row.querySelector(".fav-cell").onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(c.symbol);
    };

    tbody.appendChild(row);
  });
}

function toggleFavorite(symbol) {
  if (favorites.includes(symbol)) favorites = favorites.filter((f) => f !== symbol);
  else favorites.push(symbol);
  localStorage.setItem("coin_favs", JSON.stringify(favorites));
  renderTable(allCoins);
}

// ====== BAŞLATMA ======
document.addEventListener("DOMContentLoaded", async () => {
  await loadLogoMap();     // ✅ logoları bir kere hazırla
  loadCoinData();          // ✅ sonra coin verisini çek
  setInterval(loadCoinData, 15 * 60 * 1000);

  const searchInput = document.getElementById("coinSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toUpperCase();
      renderTable(allCoins.filter((c) => (c.symbol || "").includes(term)));
    });
  }
});
