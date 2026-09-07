(function () {
  "use strict";

  const REFRESH_MS = 60000;
  const SOURCES = ["./book.json", "../scans/book.json"];

  const $ = (id) => document.getElementById(id);

  function money(n, digits = 2) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    const sign = v < 0 ? "-" : "";
    return sign + "$" + Math.abs(v).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function px(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function normalize(raw) {
    const b = raw || {};
    const posIn = b.position || {};
    const residuals = b.residuals;
    let residualsUsd = b.residualsUsd;
    let residualsNote = b.residualsNote || "";
    if (residuals && typeof residuals === "object") {
      const bits = [];
      if (residuals.arb_eth != null) bits.push("Arb ETH " + Number(residuals.arb_eth).toFixed(4));
      if (residuals.arb_usdc != null) bits.push("Arb USDC $" + Number(residuals.arb_usdc).toFixed(2));
      if (residuals.base_eth != null) bits.push("Base ETH " + Number(residuals.base_eth).toFixed(4));
      if (residuals.base_usdc != null) bits.push("Base USDC $" + Number(residuals.base_usdc).toFixed(2));
      residualsNote = bits.join(" · ") || residualsNote;
      residualsUsd = (Number(residuals.arb_usdc || 0) + Number(residuals.base_usdc || 0));
    }
    const position = Object.keys(posIn).length
      ? {
          side: posIn.side,
          market: posIn.market,
          leverage: posIn.leverage,
          collateralUsd: posIn.collateralUsd ?? posIn.collateral_usd,
          collateralToken: posIn.collateralToken || posIn.collateral_token || "",
          sizeUsd: posIn.sizeUsd ?? posIn.size_usd,
          entry: posIn.entry,
          mark: posIn.mark,
          sl: posIn.sl,
          tp: posIn.tp,
          slOnChain: posIn.slOnChain ?? posIn.sl_on_chain,
          tpOnChain: posIn.tpOnChain ?? posIn.tp_on_chain,
        }
      : null;
    return {
      status: b.status || posIn.status || (position && position.side ? "LIVE" : "FLAT"),
      updatedEt: b.updatedEt || b.updated_et || b.updatedAt || "",
      liquidUsd: b.liquidUsd ?? b.liquid_usd,
      openUpnlUsd: b.openUpnlUsd ?? b.upnl_usd ?? b.open_upnl_usd,
      equityUsd: b.equityUsd ?? b.equity_usd,
      residualsUsd: residualsUsd,
      residualsNote: residualsNote || b.notes || "",
      wallet: b.wallet || "0x425F91cFebFD8979c21008806403379390900052",
      venue: b.venue || posIn.venue || "GMX",
      chain: b.chain || "Arbitrum",
      notes: b.notes || "",
      position,
    };
  }

  function truncAddr(a) {
    if (!a || typeof a !== "string") return "—";
    if (!a.startsWith("0x") || a.length < 10) return a;
    return "0x…" + a.slice(-4);
  }

  function setTone(el, n) {
    el.classList.remove("up", "down");
    if (n == null || Number.isNaN(Number(n))) return;
    if (Number(n) > 0) el.classList.add("up");
    if (Number(n) < 0) el.classList.add("down");
  }

  function setBadge(status) {
    const el = $("badge");
    const s = String(status || "FLAT").toUpperCase();
    el.textContent = s;
    el.className = "badge";
    if (s === "LIVE") el.classList.add("badge--live");
    else if (s === "RISK") el.classList.add("badge--risk");
    else el.classList.add("badge--flat");
  }

  function renderTherm(pos) {
    const wrap = $("therm-wrap");
    const empty = $("therm-empty");
    if (!pos || pos.sl == null || pos.tp == null || pos.mark == null) {
      wrap.hidden = true;
      empty.hidden = false;
      return;
    }
    wrap.hidden = false;
    empty.hidden = true;

    const sl = Number(pos.sl);
    const tp = Number(pos.tp);
    const mark = Number(pos.mark);
    const lo = Math.min(sl, tp);
    const hi = Math.max(sl, tp);
    const span = hi - lo || 1;
    const pct = Math.min(1, Math.max(0, (mark - lo) / span));

    $("therm-fill").style.width = (pct * 100).toFixed(2) + "%";
    $("tick-sl").style.left = ((sl - lo) / span * 100).toFixed(2) + "%";
    $("tick-tp").style.left = ((tp - lo) / span * 100).toFixed(2) + "%";
    $("tick-m").style.left = (pct * 100).toFixed(2) + "%";
    $("tick-sl").textContent = "SL " + px(sl);
    $("tick-tp").textContent = "TP " + px(tp);
    $("tick-m").textContent = "M " + px(mark);

    const toSl = ((mark - sl) / mark) * 100;
    const toTp = ((tp - mark) / mark) * 100;
    $("dist-sl").textContent = "→ SL " + (toSl >= 0 ? "+" : "") + toSl.toFixed(2) + "%";
    $("dist-tp").textContent = "→ TP " + (toTp >= 0 ? "+" : "") + toTp.toFixed(2) + "%";
  }

  function render(book, source) {
    $("err").hidden = true;
    setBadge(book.status);
    $("clock").textContent = book.updatedEt || book.updatedAt || "—";

    $("liquid").textContent = money(book.liquidUsd);
    $("upnl").textContent = money(book.openUpnlUsd);
    setTone($("upnl"), book.openUpnlUsd);
    $("equity").textContent = money(book.equityUsd);

    const pos = book.position;
    const flat = !pos || book.status === "FLAT" || !pos.side;
    $("pos-empty").hidden = !flat;
    $("pos-body").hidden = flat;

    const venueBits = [book.venue, book.chain, pos && pos.market].filter(Boolean);
    $("venue").textContent = venueBits.join(" · ") || "—";

    if (!flat) {
      const sideEl = $("side");
      sideEl.textContent = pos.side;
      sideEl.className = "v " + (String(pos.side).toUpperCase() === "LONG" ? "long" : "short");
      $("lev").textContent = pos.leverage != null ? Number(pos.leverage).toFixed(1) + "×" : "—";
      $("coll").textContent =
        pos.collateralUsd != null
          ? money(pos.collateralUsd) + (pos.collateralToken ? " " + pos.collateralToken : "")
          : "—";
      $("size").textContent = money(pos.sizeUsd);
      $("entry").textContent = px(pos.entry);
      $("mark-px").textContent = px(pos.mark);

      const flags = [];
      if (pos.slOnChain === true) flags.push("SL on-chain");
      else if (pos.slOnChain === false) flags.push("SL missing");
      if (pos.tpOnChain === true) flags.push("TP on-chain");
      else if (pos.tpOnChain === false) flags.push("TP missing");
      $("chain-flags").textContent = flags.join(" · ") || "—";
      renderTherm(pos);
    } else {
      $("chain-flags").textContent = "—";
      renderTherm(null);
    }

    $("residuals").textContent = money(book.residualsUsd);
    $("residuals-note").textContent = book.residualsNote || "—";
    $("wallet").textContent = truncAddr(book.wallet);
    $("notes").textContent = book.notes || "—";
    $("src").textContent = "src " + source;
  }

  function showError(msg) {
    const el = $("err");
    el.hidden = false;
    el.textContent = msg;
    setBadge("RISK");
  }

  async function loadOne(url) {
    const res = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(url + " → HTTP " + res.status);
    return res.json();
  }

  async function refresh() {
    let lastErr = null;
    for (const src of SOURCES) {
      try {
        const book = normalize(await loadOne(src));
        render(book, src);
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    showError("book.json unreachable — " + (lastErr && lastErr.message ? lastErr.message : "fetch failed"));
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
})();
