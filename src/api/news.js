export function newsQueryForSymbol(symbolRaw) {
  const raw = (symbolRaw || "").trim().toUpperCase();
  if (!raw) return "";

  // Indexes
  if (raw.startsWith("^")) {
    const name = raw.slice(1).replace(/[^A-Z0-9]/g, "");
    const names = {
      GSPC: "S&P 500",
      DJI: "Dow Jones",
      IXIC: "Nasdaq",
      N225: "Nikkei",
      FTSE: "FTSE 100",
      DAX: "DAX",
      GDAXI: "DAX",
      HSI: "Hang Seng",
      VI: "VIX",
    };
    return names[name] || `${name} index`;
  }

  // Work with the raw symbol, only removing $ and the FX/futures tax suffix
  const stripped = raw.replace(/\$/g, "").replace(/(=F|=X|=N)$/, "");

  // Gold / silver / metals
  if (/^(XAU|GC|MGC)/.test(stripped)) return "gold price news";
  if (/^(XAG|SI|MSI)/.test(stripped)) return "silver price news";
  if (/^(XPT|PL)/.test(stripped)) return "platinum price news";
  if (/^(XPD|PA)/.test(stripped)) return "palladium price news";

  // Oil / gas / energy
  if (/^(CL|BRN|QM|RB|BZ)/.test(stripped)) return "crude oil price news";
  if (/^(NG|QG)/.test(stripped)) return "natural gas price news";

  // Crypto
  const CRYPTO = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", XRP: "XRP", ADA: "Cardano", DOGE: "Dogecoin", AVAX: "Avalanche", LINK: "Chainlink", BNB: "BNB", DOT: "Polkadot", LTC: "Litecoin", MATIC: "Polygon", SHIB: "Shiba Inu", TON: "Toncoin", ARB: "Arbitrum", OP: "Optimism", ATOM: "Cosmos", XLM: "Stellar" };
  const coin = Object.keys(CRYPTO).find((c) => stripped === c || stripped.startsWith(c));
  if (coin && /(USD|USDT|EUR|BTC|ETH)$/.test(stripped)) {
    return `${CRYPTO[coin]} cryptocurrency news`;
  }

  // Forex pair: map readable base currency
  const FX_NAMES = { USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CHF: "Swiss Franc", CAD: "Canadian Dollar", AUD: "Australian Dollar", NZD: "New Zealand Dollar", CNY: "Chinese Yuan", MXN: "Mexican Peso", HKD: "Hong Kong Dollar", SGD: "Singapore Dollar", ZAR: "South African Rand", TRY: "Turkish Lira", SEK: "Swedish Krona", NOK: "Norwegian Krone", DKK: "Danish Krone", PLN: "Polish Zloty", INR: "Indian Rupee", BRL: "Brazilian Real", RUB: "Russian Ruble" };
  const upper = stripped.replace(/[^A-Z0-9]/g, "");

  // If it looks like a 6-char FX pair
  if (/^[A-Z]{6}$/.test(upper)) {
    const base = upper.slice(0, 3);
    const quote = upper.slice(3);
    if (FX_NAMES[base] && FX_NAMES[quote]) {
      return `${FX_NAMES[quote]} ${FX_NAMES[base]} forex news`;
    }
    return `${base}/${quote} forex news`;
  }

  return `${upper || stripped} stock news`;
}

function googleNewsUrl(query, limit) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
    num: String(limit),
  });
  return `/__news/rss/search?${params.toString()}`;
}

function parseRss(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(doc.querySelectorAll("item"));
  return items
    .map((it) => {
      const title = it.querySelector("title")?.textContent?.trim() || "";
      const link = it.querySelector("link")?.textContent?.trim() || "";
      const source = it.querySelector("source")?.textContent?.trim() || "";
      const pubDate = it.querySelector("pubDate")?.textContent?.trim() || "";
      return { title, link, publisher: source, time: pubDate ? Date.parse(pubDate) / 1000 : 0 };
    })
    .filter((n) => n.title && n.link);
}

export async function fetchNews(symbolRaw, limit = 8) {
  const query = newsQueryForSymbol(symbolRaw) || (symbolRaw || "").trim();
  if (!query) return [];

  try {
    const url = googleNewsUrl(query, limit);
    const res = await fetch(url, { headers: { "Accept": "application/rss+xml, text/xml, application/xml;q=0.9, */*;q=0.8" } });
    if (!res.ok) throw new Error(`News fetch failed (${res.status})`);
    const xml = await res.text();
    const items = parseRss(xml);
    if (items.length === 0) throw new Error("No news items returned");
    return items.slice(0, limit);
  } catch (err) {
    console.warn("News fetch failed:", err.message);
    return [];
  }
}
