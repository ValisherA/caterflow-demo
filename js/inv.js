/* CaterFlow prototip — ombor yadrosi: rezerv, chiqindi, muddat, audit, ogohlantirishlar, manfiy qoldiqdan himoya */
"use strict";
const WASTE_REASONS = ["Muddati o‘tdi", "Ortiqcha tayyorlandi", "Bekor qilindi", "Oshxona xatosi", "Shikastlandi", "Boshqa"];
const SHELF = { "Go‘sht": 5, "Baliq": 3, "Sut va tuxum": 7, "Sabzavot va meva": 10, "Non": 2, "Muzlatilgan": 60 };
const MOVE_T = { kirim: ["Kirim", "good"], chiqim: ["Tayyorlash", "saffron"], kitchen: ["Oshxonaga", "saffron"], order: ["Tadbir sarfi", "saffron"], adjust: ["Qo‘lda tuzatish", "info"], waste: ["Chiqindi", "bad"], admin: ["Admin tuzatish", "ig"], ret: ["Qaytarildi", "good"] };
const SEV = { critical: ["Jiddiy", "bad"], warning: ["Ogohlantirish", "saffron"], info: ["Ma’lumot", "info"] };
const invS = () => db.settings.inv;
const pcats = () => (db.icats || []).filter(c => c.active).map(c => c.name);
const MST = id => (db.ingredients || []).find(m => m.id === id);
const pName = p => p ? p.name : "—";

/* ---------- audit (o‘zgarmaydi: tahrirlash va o‘chirish yo‘q) ---------- */
function actorNow() { if (!ui.session || ui.session.role === "admin") return { actor: "admin", actorName: "CaterFlow admin" }; const m = me(); return { actor: m.id, actorName: `${m.name} (${VROLES[m.role].name})` }; }
function audit(o) { db.audit.unshift(Object.freeze(Object.assign({ id: uid("au"), at: Date.now() }, actorNow(), o))); }
function moveRec(vid, p, type, qty, extra = {}) { const m = Object.assign({ id: uid("mv"), vendorId: vid, productId: p.id, date: today(), at: Date.now(), qty, type, by: ui.session && ui.session.role === "vendor" ? me().id : "admin" }, extra); db.moves.push(m); return m; }
function moveBy(m) { if (!m.by) return "—"; if (m.by === "admin") return "CaterFlow admin"; const s = STF(m.by); return s ? s.name : "—"; }

/* ---------- rezervlar ---------- */
const activeRes = (vid, pid) => db.reservations.filter(r => r.status === "active" && r.vendorId === vid && (!pid || r.productId === pid));
const reservedQty = p => activeRes(p.vendorId, p.id).reduce((a, r) => a + r.qty, 0);
const availQty = p => p.stock - reservedQty(p);
function reserveOrder(o, vid, force) {
  if (!force && !invS().autoReserve) return 0;
  db.reservations.forEach(r => { if (r.orderId === o.id && r.status === "active") r.status = "released"; });
  const rows = planCalc(orderPlan(o, vid)).rows;
  rows.forEach(x => db.reservations.push({ id: uid("rs"), vendorId: vid, orderId: o.id, productId: x.p.id, qty: x.qty, at: Date.now(), status: "active" }));
  return rows.length;
}
function releaseOrder(o, force) { if (!force && !invS().autoRelease) return 0; let n = 0; db.reservations.forEach(r => { if (r.orderId === o.id && r.status === "active") { r.status = "released"; n++; } }); return n; }
function consumeOrder(o) { db.reservations.forEach(r => { if (r.orderId === o.id && r.status === "active") r.status = "consumed"; }); }
function resAnomaly(r) {
  const o = ORD(r.orderId); if (!o) return "Buyurtma topilmadi";
  if (o.status === "bekor") return "Bekor qilingan buyurtma hali rezerv ushlab turibdi";
  if (o.status === "yakunlandi") return "Yakunlangan buyurtma rezervi yopilmagan";
  if (o.date < dAdd(-1)) return "Tadbir sanasi o‘tgan, rezerv yopilmagan";
  return "";
}
function liveOrders(vid) { return [...db.orders.filter(o => o.vendorId && ["tasdiqlandi", "bajarilmoqda"].includes(o.status)), ...db.ownOrders.filter(o => ["tasdiqlandi", "bajarilmoqda"].includes(o.status))].filter(o => !vid || o.vendorId === vid); }
const hasRes = o => db.reservations.some(r => r.orderId === o.id && ["active", "consumed"].includes(r.status));

/* ---------- muddat, chiqindi, tuzatish ---------- */
function expInfo(p) { if (!p.exp || p.stock <= 0) return null; const d = daysBetween(today(), p.exp); if (d < 0) return { st: "expired", d }; if (d <= invS().expiryDays) return { st: "soon", d }; return null; }
const wasteVal = m => Math.abs(m.qty) * avgP(m.productId);
const wasteMoves = (vid, from) => db.moves.filter(m => m.type === "waste" && (!vid || m.vendorId === vid) && (!from || m.date >= from));
const purchVal = (vid, from) => db.purchases.filter(x => (!vid || x.vendorId === vid) && (!from || x.date >= from)).reduce((a, x) => a + x.total, 0);
function suspicious(m) {
  if (m.type !== "adjust" && m.type !== "admin") return "";
  const n24 = db.moves.filter(x => x.type === "adjust" && x.vendorId === m.vendorId && Math.abs((x.at || 0) - (m.at || 0)) < 864e5).length;
  const val = Math.abs(m.qty) * avgP(m.productId), r = [];
  if (n24 > invS().suspiciousN) r.push(`24 soatda ${n24} ta tuzatish`);
  if (val > 1e6) r.push(`qiymati ${mln(val)} so‘m`);
  if (m.before > 0 && Math.abs(m.qty) / m.before > 0.3) r.push(`qoldiqning ${pct(Math.abs(m.qty) / m.before)}`);
  return r.join(" · ");
}

/* ---------- ogohlantirishlar ---------- */
function invAlerts(vf) {
  const A = [], add = (sev, type, vid, text, go) => A.push({ sev, type, vid, text, go });
  db.vendors.filter(v => !vf || v.id === vf).forEach(v => {
    const ps = db.products.filter(p => p.vendorId === v.id), used = new Set(db.dishes.filter(d => d.vendorId === v.id).flatMap(d => d.ing.map(i => i.p)));
    ps.forEach(p => {
      if (p.stock < 0) add("critical", "Manfiy qoldiq", v.id, `${p.name}: ${fmtQty(p, p.stock)}`, "stock");
      else if (p.stock === 0 && used.has(p.id)) add("critical", "Tugagan", v.id, `${p.name} omborda yo‘q`, "low");
      else if (p.stock < p.min) add("warning", "Kam qolgan", v.id, `${p.name}: ${fmtQty(p, p.stock)} (min ${p.min} ${p.unit})`, "low");
      const e = expInfo(p); if (e) add(e.st === "expired" ? "critical" : "warning", e.st === "expired" ? "Muddati o‘tgan" : "Muddati yaqin", v.id, `${p.name}: ${e.st === "expired" ? `${-e.d} kun oldin tugagan` : `${e.d} kun qoldi`} · ${fmtQty(p, p.stock)}`, "stock");
      if (!p.mid) add("info", "Moslashtirilmagan", v.id, `“${p.name}” master katalogga bog‘lanmagan`, "ingredients");
    });
    const wm = wasteMoves(v.id, monthKeys()[2] + "-01").reduce((a, m) => a + wasteVal(m), 0), pv = purchVal(v.id, dAdd(-30));
    if (wm > 2e6 || (pv && wm / pv > 0.05)) add("warning", "Katta chiqindi", v.id, `Shu oy chiqindi ${mln(wm)} so‘m${pv ? ` (xaridning ${pct(wm / pv)})` : ""}`, "waste");
    const sus = db.moves.filter(m => m.vendorId === v.id && m.at > Date.now() - 7 * 864e5 && suspicious(m));
    if (sus.length) add("warning", "G‘ayrioddiy tuzatish", v.id, `7 kunda ${sus.length} ta shubhali qo‘lda tuzatish`, "adjust");
    liveOrders(v.id).filter(o => o.date >= today() && daysBetween(today(), o.date) <= 3).forEach(o => { const sh = planCalc(orderPlan(o, v.id)).short; if (sh.length) add(daysBetween(today(), o.date) <= 1 ? "critical" : "warning", "Buyurtmaga yetmaydi", v.id, `${o.id} (${fDate(o.date)}, ${o.guests} kishi): ${sh.slice(0, 3).map(x => `${x.p.name} ${fmtQty(x.p, x.short)}`).join(", ")}${sh.length > 3 ? "…" : ""}`, "risk"); });
    activeRes(v.id).filter(resAnomaly).reduce((acc, r) => { if (!acc.includes(r.orderId)) acc.push(r.orderId); return acc; }, []).forEach(oid => add("warning", "Rezerv muammosi", v.id, `${oid}: ${resAnomaly(activeRes(v.id).find(r => r.orderId === oid))}`, "res"));
    liveOrders(v.id).filter(o => !hasRes(o)).forEach(o => add("info", "Rezervsiz buyurtma", v.id, `${o.id} (${fDate(o.date)}) uchun masalliq rezerv qilinmagan`, "res"));
    db.dishes.filter(d => d.vendorId === v.id && !d.ing.length).forEach(d => add("info", "Texkarta to‘liq emas", v.id, `“${d.name}” taomida masalliq yo‘q`, "recipes"));
  });
  const order = { critical: 0, warning: 1, info: 2 };
  return A.sort((a, b) => order[a.sev] - order[b.sev]);
}
function invProblems(vf) {
  const al = invAlerts(vf), c = t => al.filter(a => a.type === t).length;
  return [
    ["Manfiy qoldiqlar", c("Manfiy qoldiq"), "critical", "stock"], ["Rezervsiz buyurtmalar", c("Rezervsiz buyurtma"), "warning", "res"], ["Masalliqsiz texkartalar", c("Texkarta to‘liq emas"), "info", "recipes"],
    ["Masalliq yetmaydigan buyurtmalar", c("Buyurtmaga yetmaydi"), "critical", "risk"], ["Rezervi yopilmagan bekor/eski buyurtmalar", c("Rezerv muammosi"), "warning", "res"],
    ["G‘ayrioddiy tuzatishlar", db.moves.filter(m => (!vf || m.vendorId === vf) && m.at > Date.now() - 7 * 864e5 && suspicious(m)).length, "warning", "adjust"], ["Moslashtirilmagan mahsulotlar", c("Moslashtirilmagan"), "info", "ingredients"]
  ];
}

/* ---------- qoldiq yetmasa: himoya ---------- */
let _guardFn = null;
function guardOut(vid, rows, label, fn) {
  const bad = rows.filter(r => r.qty > r.p.stock + 1e-6);
  if (!bad.length) return fn(rows, {});
  const S = invS();
  if (S.allowNegative) return fn(rows, { negative: true });
  if (S.overrideReason) { _guardFn = reason => fn(rows, { reason, bad }); openModal({ type: "stockGuard", rows: bad.map(r => ({ pid: r.p.id, qty: r.qty })), label }); return; }
  toast(`Omborda yetarli emas: ${bad.map(r => r.p.name).join(", ")}. Admin sozlamasi bo‘yicha chiqim taqiqlangan`);
}
function applyOut(vid, rows, type, opt, extra = {}) {
  rows.forEach(r => { const before = r.p.stock, q = opt.negative ? r.qty : Math.min(r.qty, Math.max(0, before)); r.p.stock = Math.round((opt.negative ? before - r.qty : Math.max(0, before - r.qty)) * 10) / 10; moveRec(vid, r.p, type, q, Object.assign({ before, after: r.p.stock }, r.expected != null ? { expected: r.expected } : {}, extra)); });
  if (opt.reason) audit({ vendorId: vid, action: "Qoldiq yetmasa ham chiqim (sabab bilan)", target: extra.note || type, before: opt.bad.map(r => `${r.p.name}: kerak ${fmtQty(r.p, r.qty)}`).join("; "), after: "qoldiq 0 ga tushirildi", reason: opt.reason });
}
MODALS.stockGuard = m => mHead("Omborda yetarli emas", esc(m.label)) + `<form data-form="stock-guard"><div class="m-body">
  <div class="tbl"><table><thead><tr><th>Mahsulot</th><th class="r">Kerak</th><th class="r">Omborda</th></tr></thead><tbody>${m.rows.map(r => { const p = P(r.pid); return `<tr><td>${esc(p.name)}</td><td class="num r">${fmtQty(p, r.qty)}</td><td class="num r bad-t">${fmtQty(p, p.stock)}</td></tr>`; }).join("")}</tbody></table></div>
  <div class="note warn">${ic("alert", 16)}<span>Manfiy qoldiq admin sozlamasi bo‘yicha o‘chirilgan. Davom etsangiz, qoldiq 0 ga tushiriladi va bu harakat sababi bilan audit logga yoziladi.</span></div>
  <div class="field"><label for="sg-r">Sabab (majburiy)</label><textarea id="sg-r" name="reason" required placeholder="Masalan: kirim hali tizimga kiritilmagan, mahsulot keldi"></textarea></div>
</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Sabab bilan davom etish</button></footer></form>`;
MODALS.waste = m => {
  const vid = ui.session.vendorId, ps = db.products.filter(p => p.vendorId === vid);
  if (!ps.length) return mHead("Chiqindi qayd etish", "") + `<div class="m-body">${empty("Omborda mahsulot yo‘q")}</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button></footer>`;
  return mHead("Chiqindi qayd etish", "Buzilgan, muddati o‘tgan yoki ortiqcha tayyorlangan mahsulot") + `<form data-form="waste" data-live="waste"><div class="m-body">
    <div class="f-grid"><div class="field"><label for="ws-p">Mahsulot</label><select id="ws-p" name="pid">${ps.map(p => opt(p.id, `${p.name} (${p.unit})`, m.pid)).join("")}</select></div><div class="field"><label for="ws-q">Miqdor</label><input id="ws-q" name="qty" type="number" min="0.1" step="0.1" value="1" required></div><div class="field"><label for="ws-r">Sabab</label><select id="ws-r" name="reason">${WASTE_REASONS.map(r => opt(r, r)).join("")}</select></div></div>
    <div class="field"><label for="ws-n">Izoh</label><input id="ws-n" name="note" placeholder="Ixtiyoriy: masalan, CF-1044 dan ortib qoldi"></div><div class="live" id="ws-live"></div>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-danger" type="submit">Chiqindi sifatida yozish</button></footer></form>`;
};
const MARKET = mid => { const ps = db.products.filter(p => p.mid === mid), byV = ps.map(p => ({ p, v: V(p.vendorId), avg: avgP(p.id) })).filter(x => x.avg > 0); return { rows: byV, avg: byV.length ? byV.reduce((a, x) => a + x.avg, 0) / byV.length : 0 }; };
