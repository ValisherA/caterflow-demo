/* CaterFlow prototip — admin: moliya, vendorlar ro‘yxati (viloyat bo‘yicha) */
"use strict";
function vendorStats(v, mk) {
  const sales = cfSales(v.id, mk), gmv = sales.reduce((a, s) => a + saleRev(s), 0), guests = sales.reduce((a, s) => a + s.guests, 0);
  return { v, id: v.id, name: v.name, region: v.region, since: v.since, orders: sales.length, gmv, aov: sales.length ? gmv / sales.length : 0, pp: guests ? gmv / guests : 0, comm: commOf(gmv), bonusM: bonusUsed(v.id, mk), bonus: bonusLedger(v.id).left, debt: commDebt(v.id), active: isActiveVendor(v) ? 1 : 0, rating: avgRating(fbFor(v.id)) };
}
function regionsUsed() { return VILOYATLAR.filter(r => db.vendors.some(v => v.region === r)); }
function regionChips(cur, act) { return chips([["all", "Barcha viloyatlar", db.vendors.length], ...regionsUsed().map(r => [r, r, db.vendors.filter(v => v.region === r).length])], cur, act); }
function vendorStatus(v) { return v.closed ? `<span class="pill t-bad">Yopiq</span>` : isActiveVendor(v) ? `<span class="pill t-good">Faol</span>` : `<span class="pill t-neutral">Sust</span>`; }

/* ---------- Vendorlar ro‘yxati ---------- */
function vVendors() {
  const R = ui.vRegion, s = ui.vSort;
  const rows = db.vendors.filter(v => R === "all" || v.region === R).map(v => {
    const cs = db.customers.filter(c => c.vendorId === v.id), ps = db.products.filter(p => p.vendorId === v.id);
    return { v, name: v.name, region: v.region, since: v.since, gmv: cfSales(v.id).reduce((a, x) => a + saleRev(x), 0),
      act: db.orders.filter(o => o.vendorId === v.id && ["tasdiqlandi", "bajarilmoqda"].includes(o.status)).length,
      resp: respRate(v.id), cust: cs.filter(c => custStats(c).active).length, custAll: cs.length, stock: ps.length, low: ps.filter(p => p.stock < p.min).length,
      ol: db.ownLeads.filter(l => l.vendorId === v.id && VL_OPEN(l.status)).length, rating: avgRating(fbFor(v.id)) };
  });
  sortBy(rows, s);
  const th = (l, k, c) => thSort(l, k, s, "v-sort", c);
  const newCount = db.vendors.filter(v => daysBetween(v.since, today()) <= 30).length;
  return page(head("Vendorlar", `${db.vendors.length} ta vendor, ${regionsUsed().length} ta viloyatda. Oxirgi 30 kunda ${newCount} ta yangi vendor qo‘shildi. Ustun nomini bosib saralang.`, `<button class="btn btn-primary" data-act="vendor-new">${ic("plus", 16)} Vendor qo‘shish</button>`),
    regionChips(R, "v-region") +
    `<div class="tbl"><table><thead><tr>${th("Vendor", "name")}${th("Viloyat", "region")}${th("Qo‘shilgan", "since")}<th>Holat</th>${th("CaterFlow aylanmasi", "gmv", "r")}${th("Faol buyurtma", "act", "r")}${th("Javob berish", "resp", "r")}${th("Faol mijozlar", "cust", "r")}${th("Ombor", "stock", "r")}${th("O‘z leadlari", "ol", "r")}${th("Reyting", "rating", "r")}</tr></thead><tbody>${rows.map(x => `<tr class="click" data-act="open-vendor" data-id="${x.v.id}"><td><strong>${esc(x.name)}</strong><small>${esc(x.v.contact)} · ${esc(x.v.district)}</small></td><td>${esc(x.region)}</td><td class="num">${fDate(x.since)}${daysBetween(x.since, today()) <= 30 ? `<small class="good-t">yangi</small>` : ""}</td><td>${vendorStatus(x.v)}</td><td class="num r">${mln(x.gmv)}</td><td class="num r">${x.act}</td><td class="num r">${pct(x.resp)}</td><td class="num r">${x.cust} / ${x.custAll}</td><td class="num r">${x.stock}${x.low ? `<small class="warn-t">${x.low} tasi kam</small>` : ""}</td><td class="num r">${x.ol}</td><td class="num r">${x.rating ? x.rating.toFixed(1).replace(".", ",") : "—"}</td></tr>`).join("")}</tbody></table></div>`);
}

/* ---------- Admin moliya ---------- */
function afOverview() {
  const mks = monthKeys(), mk = mks.includes(ui.afMonth) ? ui.afMonth : mks[2], R = ui.afRegion;
  const vs = db.vendors.filter(v => R === "all" || v.region === R);
  const st = vs.map(v => vendorStats(v, mk));
  const sum = (arr, k) => arr.reduce((a, x) => a + x[k], 0);
  const gmv = sum(st, "gmv"), orders = sum(st, "orders"), comm = sum(st, "comm");
  const isNow = mk === mks[2], dayCut = pad(new Date().getDate()), prevMk = mks[mks.indexOf(mk) - 1];
  const gmvPrev = prevMk ? vs.reduce((a, v) => a + cfSales(v.id, prevMk).filter(x => !isNow || x.date.slice(8) <= dayCut).reduce((s, x) => s + saleRev(x), 0), 0) : 0;
  const debt = vs.reduce((a, v) => a + commDebt(v.id), 0);
  const paidM = db.payments.filter(p => vs.some(v => v.id === p.vendorId) && p.date.slice(0, 7) === mk).reduce((a, p) => a + p.amount, 0);
  const active = vs.filter(isActiveVendor).length;
  const recent = vs.filter(v => daysBetween(v.since, today()) <= 90), activated = recent.filter(v => db.sales.some(s => s.vendorId === v.id)).length;
  const pipe = db.orders.filter(o => ["tasdiqlandi", "bajarilmoqda"].includes(o.status) && vs.some(v => v.id === o.vendorId)).reduce((a, o) => a + orderValue(o), 0);
  const delta = gmvPrev ? (gmv - gmvPrev) / gmvPrev : 0;
  // 6 oylik yangi vendorlar
  const six = []; { const d = new Date(); for (let i = 5; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); six.push(x.getFullYear() + "-" + pad(x.getMonth() + 1)); } }
  const newChart = barChart(six.map(k => ({ label: mShort(k), values: [vs.filter(v => v.since.slice(0, 7) === k).length] })), [{ name: "Yangi vendorlar", c: "--series-1" }], "Oylar bo‘yicha yangi vendorlar", n => n + " ta vendor");
  const trend = barChart(mks.map(k => { const g = vs.reduce((a, v) => a + cfSales(v.id, k).reduce((s, x) => s + saleRev(x), 0), 0); return { label: mLabel(k), values: [g, commOf(g)] }; }), [{ name: "GMV (aylanma)", c: "--series-1" }, { name: "CaterFlow daromadi", c: "--series-2" }], "Oylik aylanma va komissiya daromadi");
  // vendorlar jadvali
  const s = ui.afSort; sortBy(st, s);
  const th = (l, k, c) => thSort(l, k, s, "af-sort", c);
  const vrows = st.map(x => `<tr><td><button type="button" class="link" data-act="open-vendor" data-id="${x.id}">${esc(x.name)}</button></td><td>${esc(x.region)}</td><td class="num r">${x.orders}</td><td class="num r">${mln(x.gmv)}</td><td class="num r">${x.aov ? mln(x.aov) : "—"}</td><td class="num r">${x.pp ? num(x.pp) : "—"}</td><td class="num r">${num(x.comm)}${x.bonusM ? `<small class="good-t">bonusdan ${num(x.bonusM)}</small>` : ""}</td><td class="num r ${x.bonus ? "" : "faint"}">${x.bonus ? num(x.bonus) : "—"}</td><td class="num r ${x.debt ? "warn-t" : "faint"}">${x.debt ? num(x.debt) : "—"}</td><td>${vendorStatus(x.v)}</td><td><div class="row nowrap"><button type="button" class="btn btn-sm btn-ghost" data-act="bonus" data-id="${x.id}">Bonus</button>${x.debt ? `<button type="button" class="btn btn-sm" data-act="pay" data-id="${x.id}">To‘lov</button>` : ""}</div></td></tr>`).join("");
  // viloyatlar jadvali
  const rs = ui.rSort, regs = regionsUsed().filter(r => R === "all" || r === R).map(r => { const rv = db.vendors.filter(v => v.region === r), rst = rv.map(v => vendorStats(v, mk)); return { region: r, vendors: rv.length, active: rv.filter(isActiveVendor).length, fresh: rv.filter(v => daysBetween(v.since, today()) <= 90).length, orders: sum(rst, "orders"), gmv: sum(rst, "gmv") }; });
  sortBy(regs, rs);
  const allG = sum(regs, "gmv"), rth = (l, k, c) => thSort(l, k, rs, "r-sort", c);
  const empty14 = VILOYATLAR.length - regionsUsed().length;
  const pays = db.payments.filter(p => vs.some(v => v.id === p.vendorId)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  return page(`<div class="row" style="justify-content:flex-end"><div class="field"><label for="af-r" class="vh">Viloyat</label><select id="af-r" data-change="af-region" style="width:auto">${opt("all", "Barcha viloyatlar", R)}${regionsUsed().map(r => opt(r, r, R)).join("")}</select></div></div>`,
    `<div class="row between"><div class="seg">${mks.map(k => `<button type="button" class="${k === mk ? "on" : ""}" data-act="af-month" data-k="${k}" aria-pressed="${k === mk}">${mLabel(k)}</button>`).join("")}</div>${mk === mks[2] ? `<span class="small muted">Joriy oy: ${new Date().getDate()}-kungacha</span>` : ""}</div>
    <div class="g g-kpi4">
      ${kpi("GMV (aylanma)", mln(gmv), gmvPrev ? `${delta >= 0 ? "▲" : "▼"} ${pct(Math.abs(delta))} ${isNow ? `o‘tgan oyning 1–${+dayCut}-kunlariga` : "o‘tgan oyga"} nisbatan` : "CaterFlow orqali bajarilgan buyurtmalar")}
      ${kpi("CaterFlow daromadi", mln(comm), `take rate ${pct(gmv ? comm / gmv : 0)} · komissiya ${String(db.settings.commission).replace(".", ",")}%${sum(st, "bonusM") ? ` · bonusdan ${mln(sum(st, "bonusM"))}, real ${mln(comm - sum(st, "bonusM"))}` : ""}`)}
      ${kpi("O‘rtacha buyurtma", orders ? mln(gmv / orders) : "—", `${orders} ta buyurtma`)}
      ${kpi("Komissiya qarzi", mln(debt), `shu oy to‘langan: ${mln(paidM)}`)}
      ${kpi("Faol vendorlar", `${active} / ${vs.length}`, "oxirgi 30 kunda buyurtma yoki taklif")}
      ${kpi("Yangi vendorlar", recent.length, `90 kunda · ${activated} tasi birinchi buyurtmani olgan`)}
      ${kpi("Kutilayotgan tushum", mln(pipe), `komissiya ≈ ${mln(commOf(pipe))} · tasdiqlangan buyurtmalar`)}
      ${(() => { const L = vs.map(v => bonusLedger(v.id)), g = L.reduce((a, x) => a + x.granted, 0), u = L.reduce((a, x) => a + x.used, 0); return kpi("Bonus qoldig‘i", mln(g - u), `berilgan ${mln(g)} · ishlatilgan ${mln(u)} · ${L.filter(x => x.left > 0).length} ta vendorda`); })()}
    </div>
    <div class="g g-2"><section class="card stack"><h2>Aylanma va daromad</h2>${trend}</section><section class="card stack"><h2>Yangi vendorlar, 6 oy</h2>${newChart}</section></div>
    <section class="card"><div class="card-h"><div><h2>Vendorlar: ${mLabel(mk)}</h2><p class="small muted">Qaysi vendorga qanchadan buyurtma tushyapti. Ustun nomini bosib saralang.</p></div></div>
      <div class="tbl"><table><thead><tr>${th("Vendor", "name")}${th("Viloyat", "region")}${th("Buyurtma", "orders", "r")}${th("GMV", "gmv", "r")}${th("O‘rtacha buyurtma", "aov", "r")}${th("Narx / kishi", "pp", "r")}${th("Komissiya", "comm", "r")}${th("Bonus qoldig‘i", "bonus", "r")}${th("Qarz", "debt", "r")}<th>Holat</th><th></th></tr></thead><tbody>${vrows}</tbody></table></div></section>
    <div class="g g-21"><section class="card"><div class="card-h"><div><h2>Viloyatlar</h2><p class="small muted">${empty14 ? `Yana ${empty14} ta viloyatda hali vendor yo‘q` : "Hamma viloyatda vendor bor"}</p></div></div>
      <div class="tbl"><table><thead><tr>${rth("Viloyat", "region")}${rth("Vendorlar", "vendors", "r")}${rth("Faol", "active", "r")}${rth("Yangi (90 kun)", "fresh", "r")}${rth("Buyurtma", "orders", "r")}${rth("GMV", "gmv", "r")}<th class="r">Ulush</th></tr></thead><tbody>${regs.map(x => `<tr class="click" data-act="af-pick-region" data-k="${esc(x.region)}"><td>${esc(x.region)}</td><td class="num r">${x.vendors}</td><td class="num r">${x.active}</td><td class="num r">${x.fresh}</td><td class="num r">${x.orders}</td><td class="num r">${mln(x.gmv)}</td><td class="num r faint">${allG ? pct(x.gmv / allG) : "—"}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="card"><div class="card-h"><h2>So‘nggi to‘lovlar</h2></div>${pays.length ? `<ul class="feed">${pays.map(p => `<li><span><strong>${esc(V(p.vendorId).name)}</strong> · ${esc(p.method)}<span class="block tiny faint">${esc(p.note || "")}</span></span><time class="num">${som(p.amount)}<span class="block">${fDate(p.date)}</span></time></li>`).join("")}</ul>` : `<p class="small faint">To‘lov yo‘q</p>`}</section></div>`);
}
MODALS.payment = m => {
  const v = V(m.id), debt = commDebt(v.id), bl = bonusLedger(v.id);
  return mHead(`${esc(v.name)}: to‘lovni qayd etish`, `Komissiya ${som(commAccrued(v.id))}${bl.used ? ` − bonusdan ${som(bl.used)}` : ""} · to‘langan ${som(commPaid(v.id))} · qarz ${som(debt)}`) + `<form data-form="payment" data-id="${v.id}"><div class="m-body"><div class="f-grid">
    <div class="field"><label for="py-a">Summa, so‘m</label><input id="py-a" name="amount" type="number" min="1000" step="1000" value="${debt}" required></div>
    <div class="field"><label for="py-d">Sana</label><input id="py-d" name="date" type="date" value="${today()}" required></div>
    <div class="field"><label for="py-m">To‘lov usuli</label><select id="py-m" name="method">${PAY_METHODS.map(x => opt(x, x)).join("")}</select></div></div>
    <div class="field"><label for="py-n">Izoh</label><input id="py-n" name="note" placeholder="Masalan: sentabr komissiyasi"></div></div>
    <footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`;
};

/* ---------- bonuslar va yangi vendor ---------- */
function bonusCard(vid, admin) {
  const b = bonusLedger(vid); if (!b.granted && !admin) return "";
  const pctUsed = b.granted ? b.used / b.granted : 0, rate = String(db.settings.commission).replace(".", ",");
  return `<section class="card"><div class="card-h"><div><h2>${admin ? "Bonus" : "Xush kelibsiz bonusi"}</h2><p class="small muted">CaterFlow buyurtmalarining ${rate}% komissiyasi avval bonusdan yechiladi. Bonus tugagach komissiyani ${admin ? "vendor o‘zi to‘laydi" : "o‘zingiz to‘laysiz"}.</p></div>${admin ? `<button type="button" class="btn btn-sm btn-primary" data-act="bonus" data-id="${vid}">${ic("plus", 16)} Bonus berish</button>` : (b.left > 0 ? `<span class="pill t-good">Faol</span>` : `<span class="pill t-neutral">Tugagan</span>`)}</div>
    ${b.granted ? `<div class="live">${money("Berilgan", som(b.granted))}${money("Komissiyaga ishlatildi", som(b.used))}${money("Qoldi", som(b.left), b.left > 0 ? "good" : "")}</div><div class="prog" style="margin-top:12px"><span style="width:${pctUsed * 100}%;background:var(--saffron)"></span></div>
    <p class="small" style="margin-top:8px">${b.left > 0 ? `Qoldiq taxminan <strong>${mln(b.left / (db.settings.commission / 100))} so‘m</strong>lik CaterFlow buyurtmasi komissiyasini qoplaydi.` : `Bonus to‘liq ishlatilgan — endi komissiya ${rate}% ${admin ? "vendordan" : "sizdan"} olinadi.`}</p>
    <ul class="feed" style="margin-top:8px">${b.grants.map(g => `<li><span>${esc(g.note || "Bonus")}<span class="block tiny faint">${esc(byName(g.by))}</span></span><time class="num">${som(g.amount)}<span class="block">${fDate(g.date)}</span></time></li>`).join("")}</ul>` : empty("Bu vendorga hali bonus berilmagan")}</section>`;
}
MODALS.bonus = m => {
  const v = V(m.id), b = bonusLedger(v.id);
  return mHead(`${esc(v.name)}: bonus berish`, `Hozirgi qoldiq ${som(b.left)} · berilgan ${som(b.granted)}`) + `<form data-form="bonus" data-id="${v.id}"><div class="m-body">
    <div class="f-grid"><div class="field"><label for="bn-a">Bonus summasi, so‘m</label><input id="bn-a" name="amount" type="number" min="10000" step="10000" value="${db.settings.bonusAmount || 500000}" required></div><div class="field"><label for="bn-d">Qachondan</label><input id="bn-d" name="date" type="date" value="${today()}" required></div></div>
    <div class="field"><label for="bn-n">Sabab</label><input id="bn-n" name="note" value="${b.granted ? "Qo‘shimcha bonus" : "Xush kelibsiz bonusi"}"></div>
    <p class="small muted">Shu sanadan keyingi CaterFlow buyurtmalarining ${String(db.settings.commission).replace(".", ",")}% komissiyasi avval shu bonusdan yechiladi. Vendorga bildirishnoma boradi.</p>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Bonus berish</button></footer></form>`;
};
MODALS.newVendor = () => mHead("Vendor qo‘shish", "Yangi catering kompaniyasi va uning rahbari uchun akkaunt") + `<form data-form="vendor-new"><div class="m-body">
  <div class="f-grid"><div class="field"><label for="nv-n">Kompaniya nomi</label><input id="nv-n" name="name" required></div><div class="field"><label for="nv-c">Rahbar</label><input id="nv-c" name="contact" required></div><div class="field"><label for="nv-p">Telefon</label><input id="nv-p" name="phone" type="tel" placeholder="+998 __ ___ __ __"></div></div>
  <div class="f-grid"><div class="field"><label for="nv-r">Viloyat</label><select id="nv-r" name="region">${VILOYATLAR.map(r => opt(r, r)).join("")}</select></div><div class="field"><label for="nv-d">Tuman / shahar</label><input id="nv-d" name="district"></div></div>
  <div class="f-grid"><div class="field"><label for="nv-l">Login</label><input id="nv-l" name="login" required autocomplete="off"></div><div class="field"><label for="nv-pw">Parol</label><div class="pass-wrap"><input id="nv-pw" name="pass" type="password" required autocomplete="new-password" value="${Math.random().toString(36).slice(2, 10)}"><button type="button" class="eye" data-act="toggle-pass" data-target="nv-pw" aria-label="Parolni ko‘rsatish" aria-pressed="false">${ic("eye")}</button></div></div></div>
  <label class="vrow"><input type="checkbox" name="bonus" ${db.settings.bonusAuto ? "checked" : ""}><span class="grow"><strong>Xush kelibsiz bonusi: ${som(db.settings.bonusAmount || 500000)}</strong><span class="block small muted">Birinchi CaterFlow buyurtmalarining komissiyasi shu bonusdan yechiladi</span></span></label>
</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Qo‘shish</button></footer></form>`;
