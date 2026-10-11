/* CaterFlow prototip — oddiy menyular: admin (yoki vendor) mijozga ko‘rsatish uchun taomlar va narxdan iborat menyu yaratadi.
   Masalliq va texkarta shart emas; vendor keyin taomni texkartaga bog‘lasa, tannarx avtomatik hisoblanadi. */
"use strict";
const isAdm = () => !!ui.session && ui.session.role === "admin";
const menuEditor = () => !!ui.session && (ui.session.role === "admin" || (ui.session.role === "vendor" && can("menu")));
const SEC_ALIAS = [[/salat|салат|salad/i, "Salatlar"], [/gazak|закуск|starter|appetizer/i, "Sovuq gazaklar"], [/birinchi|suyuq|sho.rva|суп|первое|soup/i, "Birinchi taom"], [/issiq|asosiy|горяч|основн|main|hot/i, "Issiq taomlar"], [/shirin|desert|десерт|dessert|sweet/i, "Shirinliklar"], [/meva|фрукт|fruit/i, "Mevalar"], [/ichimlik|напит|drink|beverage/i, "Ichimliklar"], [/^non\b|хлеб|bread/i, "Non va boshqalar"]];
const normName = s => String(s || "").toLowerCase().replace(/[‘’'`ʻʼ]/g, "").replace(/\s+/g, " ").trim();
const matchSec = h => (SEC_ALIAS.find(([re]) => re.test(h)) || [])[1] || h;
const isHeading = s => /[:：]$/.test(s) || MENU_SECS.some(x => normName(x) === normName(s)) || /^(salatlar|салаты|закуски|горячие блюда|десерты|напитки|фрукты|desertlar|ichimliklar)$/i.test(s.trim());
function autoDish(vid, name) { const n = normName(name), d = db.dishes.find(x => x.vendorId === vid && normName(x.name) === n); return d ? d.id : null; }
// matndan menyu: "Salatlar:" — bo‘lim, "Achchiq-chuchuk — 150 g" — taom va miqdor; ro‘yxat belgilari (-, •, 1.) olib tashlanadi
function parseMenuText(txt, vid, sec0) {
  let sec = sec0 || MENU_SECS[0]; const out = [];
  String(txt || "").split(/\r?\n/).forEach(raw => {
    const s = raw.trim().replace(/^#+\s*/, "").replace(/^(\d+[.)]\s+|[-•*·–—]\s*)/, "").trim(); if (!s) return;
    if (/^#/.test(raw.trim()) || isHeading(s)) { sec = matchSec(s.replace(/[:：]$/, "").trim()); return; }
    const [name, qty] = s.split(/\s+[—–-]\s+|\t|\s{2,}/);
    const d = autoDish(vid, name); out.push({ id: uid("ml"), sec, name: name.trim(), qty: (qty || "").trim() || (d ? D(d).portion : ""), d });
  });
  return out;
}
const blankLine = sec => ({ id: uid("ml"), sec: sec || MENU_SECS[0], name: "", qty: "", d: null });
function smDraft(vid, src) {
  const base = { vendorId: vid || "", name: "", desc: "", price: 150000, minGuests: "", includes: INCLUDES.slice(0, 2), visible: true, estCost: "", lines: [blankLine("Salatlar")] };
  if (!src) return base;
  const same = !vid || vid === src.vendorId, to = vid || src.vendorId;
  return Object.assign(base, { vendorId: to, name: src.name, desc: src.desc || "", price: src.price, minGuests: src.minGuests || "", includes: [...(src.includes || base.includes)], visible: src.visible !== false, estCost: src.estCost || "",
    lines: setLines(src).map(l => ({ id: uid("ml"), sec: l.sec, name: l.name, qty: l.qty || "", d: same ? l.d || null : autoDish(to, l.name) })) });
}
const setUsed = s => db.orders.some(o => (o.requests || []).some(r => r.quote && r.quote.setId === s.id)) || db.ownOrders.some(o => o.quote && o.quote.setId === s.id) || db.sales.some(x => x.setId === s.id) || db.feedback.some(f => f.setId === s.id);
const setBy = s => s.by === "admin" ? "CaterFlow" : s.by ? (STF(s.by) || {}).name || "Vendor" : "Vendor";
const kindPill = s => isSimple(s) ? `<span class="pill t-accent">Oddiy menyu</span>` : `<span class="pill t-neutral">Texkartali set</span>`;
const visPill = s => s.visible === false ? `<span class="pill t-neutral">Qoralama</span>` : `<span class="pill t-good">Mijozlarga ko‘rinadi</span>`;
function costLine(s) {
  if (!isSimple(s)) return "";
  const n = (s.lines || []).length, k = (s.lines || []).filter(l => l.d).length;
  return k === n ? `<span class="good-t">Hamma taom texkartaga bog‘langan</span>` : s.estCost > 0 ? `Tannarx vendor kiritgan taxminiy summa · ${k}/${n} taom texkartada` : `<span class="warn-t">Tannarx noma’lum · ${k}/${n} taom texkartada</span>`;
}

/* ---------- muharrir ---------- */
function syncSM() {
  const f = $('#modal-root form[data-form="smenu"]'); if (!f) return; const d = ui.modal.draft, fd = new FormData(f);
  if (f.elements.vendorId) d.vendorId = fd.get("vendorId");
  d.name = fd.get("name") || ""; d.desc = fd.get("desc") || ""; d.price = +fd.get("price") || 0; d.minGuests = fd.get("minGuests") || ""; d.estCost = fd.get("estCost") || "";
  d.includes = fd.getAll("inc"); d.visible = fd.get("visible") === "on";
  const groups = groupLines(d.lines);
  groups.forEach((g, gi) => { const nv = String(fd.get("sec-" + gi) ?? g.sec).trim() || g.sec; g.lines.forEach(l => { l.sec = nv; }); });
  d.lines.forEach((l, k) => { if (fd.has("ml-n-" + k)) { l.name = fd.get("ml-n-" + k); l.qty = fd.get("ml-q-" + k) || ""; if (fd.has("ml-d-" + k)) l.d = fd.get("ml-d-" + k) || null; } });
}
function smPreview(d) {
  const lines = d.lines.filter(l => String(l.name).trim());
  return `<span class="eyebrow">Mijoz shunday ko‘radi</span><article class="card setc sm-card"><div class="row between"><h3>${esc(d.name || "Menyu nomi")}</h3>${d.visible ? `<span class="pill t-good">Ko‘rinadi</span>` : `<span class="pill t-neutral">Qoralama</span>`}</div>${d.desc ? `<p class="small muted">${esc(d.desc)}</p>` : ""}${menuHTML(lines) || `<p class="small faint">Taomlar shu yerda chiqadi</p>`}${d.includes.length ? `<p class="small"><span class="muted">Narxga kiradi:</span> ${d.includes.map(esc).join(", ")}</p>` : ""}<p><strong class="num">${som(+d.price || 0)}</strong> <span class="small muted">/ kishi${+d.minGuests ? ` · kamida ${+d.minGuests} mehmon` : ""}</span></p></article>`;
}
function smLive(d) {
  const n = d.lines.filter(l => String(l.name).trim()).length, linked = d.lines.filter(l => l.d && String(l.name).trim()), all = n && linked.length === n;
  const c = all ? linked.reduce((a, l) => a + dishCost(D(l.d)), 0) : +d.estCost || 0, pr = +d.price || 0;
  return money("Taomlar", `${n} ta`) + money("Texkartada", `${linked.length} / ${n}`, all ? "good" : "") + (c ? money(all ? "Tannarx / kishi" : "Taxminiy tannarx", som(c)) + money("Marja", pct(margin(pr, c)), marginTone(margin(pr, c))) : money("Tannarx", "kiritilmagan", "warn"));
}
MODALS.smenu = m => {
  const d = m.draft, adm = isAdm(), dishes = d.vendorId ? db.dishes.filter(x => x.vendorId === d.vendorId) : [];
  d.lines = groupLines(d.lines).flatMap(g => g.lines);
  const groups = groupLines(d.lines); let k = -1;
  const line = l => { k++; return `<div class="ml-row ${dishes.length ? "" : "nod"}"><input name="ml-n-${k}" id="ml-n-${k}" value="${esc(l.name)}" placeholder="Taom nomi, masalan: To‘y oshi" aria-label="Taom nomi"><input name="ml-q-${k}" value="${esc(l.qty)}" placeholder="350 g" aria-label="Miqdor yoki porsiya">${dishes.length ? `<select name="ml-d-${k}" class="ml-d" aria-label="Texkarta">${opt("", "Texkartasiz", l.d || "")}${dishes.map(x => opt(x.id, x.name, l.d || "")).join("")}</select>` : ""}<span class="ml-btns"><button type="button" class="icon-btn" data-act="sm-mv" data-i="${k}" data-k="-1" aria-label="Yuqoriga">${ic("up", 16)}</button><button type="button" class="icon-btn" data-act="sm-mv" data-i="${k}" data-k="1" aria-label="Pastga">${ic("down", 16)}</button><button type="button" class="icon-btn" data-act="sm-rm" data-i="${k}" aria-label="Taomni o‘chirish">${ic("x", 16)}</button></span></div>`; };
  const secBlocks = groups.map((g, gi) => `<div class="ml-sec"><div class="ml-sec-h"><input name="sec-${gi}" value="${esc(g.sec)}" list="sm-secs" aria-label="Bo‘lim nomi" class="ml-sec-n"><span class="ml-btns"><button type="button" class="icon-btn" data-act="sm-sec-mv" data-i="${gi}" data-k="-1" aria-label="Bo‘limni yuqoriga">${ic("up", 16)}</button><button type="button" class="icon-btn" data-act="sm-sec-mv" data-i="${gi}" data-k="1" aria-label="Bo‘limni pastga">${ic("down", 16)}</button><button type="button" class="icon-btn" data-act="sm-sec-rm" data-i="${gi}" aria-label="Bo‘limni o‘chirish">${ic("trash", 16)}</button></span></div>${g.lines.map(line).join("")}<button type="button" class="btn btn-sm btn-ghost" data-act="sm-add" data-i="${gi}" style="align-self:flex-start">${ic("plus", 14)} Taom qo‘shish</button></div>`).join("");
  const unusedSecs = MENU_SECS.filter(x => !groups.some(g => g.sec === x));
  const vSel = adm && !m.id ? `<div class="field"><label for="sm-v">Vendor</label><select id="sm-v" name="vendorId" data-sm-v required>${opt("", "Tanlang", d.vendorId)}${db.vendors.map(v => opt(v.id, `${v.name} · ${v.region}`, d.vendorId)).join("")}</select></div>` : `<div class="field"><span class="lbl">Vendor</span><p><strong>${esc(vName(d.vendorId))}</strong></p></div>`;
  return mHead(m.id ? "Menyuni tahrirlash" : m.copy ? "Menyu nusxasi" : "Yangi menyu", "Mijozga ko‘rinadigan menyu: bo‘limlar, taomlar va kishi boshiga narx. Masalliq va texkarta shart emas.") + `<form data-form="smenu" data-live="smenu"${m.id ? ` data-id="${m.id}"` : ""}><div class="m-body"><div class="sm-grid"><div class="stack">
    <div class="f-grid">${vSel}<div class="field"><label for="sm-n">Menyu nomi</label><input id="sm-n" name="name" value="${esc(d.name)}" required placeholder="Masalan: Klassik to‘y menyusi"></div></div>
    <div class="f-grid"><div class="field"><label for="sm-p">Narx, so‘m / kishi</label><input id="sm-p" name="price" type="number" min="1000" step="1000" value="${d.price}" required></div><div class="field"><label for="sm-g">Kamida mehmon <span class="faint">(ixtiyoriy)</span></label><input id="sm-g" name="minGuests" type="number" min="0" value="${esc(d.minGuests)}" placeholder="100"></div></div>
    <div class="field"><label for="sm-d">Qisqa tavsif</label><input id="sm-d" name="desc" value="${esc(d.desc)}" placeholder="Masalan: To‘y oshi, ikki xil salat, shashlik, choy va meva"></div>
    <div class="stack-s"><div class="row between"><span class="lbl">Taomlar bo‘limlar bo‘yicha</span>${dishes.length ? `<span class="tiny muted">Texkartaga bog‘lansa tannarx hisoblanadi</span>` : ""}</div>${secBlocks}
      <datalist id="sm-secs">${MENU_SECS.map(x => `<option value="${esc(x)}"></option>`).join("")}</datalist>
      <div class="row">${unusedSecs.slice(0, 4).map(x => `<button type="button" class="chip" data-act="sm-sec-add" data-k="${esc(x)}">${ic("plus", 12)} ${esc(x)}</button>`).join("")}<button type="button" class="chip" data-act="sm-sec-add" data-k="">${ic("plus", 12)} Boshqa bo‘lim</button></div></div>
    <details class="sm-paste"${m.paste ? " open" : ""}><summary class="small">Matndan tez kiritish — vendor yuborgan menyuni joylashtiring</summary><div class="stack-s" style="margin-top:8px"><textarea name="paste" id="sm-paste" rows="6" placeholder="Salatlar:\nAchchiq-chuchuk — 150 g\nOlivye — 150 g\nIssiq taomlar:\nTo‘y oshi — 350 g\nShashlik — 2 six"></textarea><p class="tiny muted">Oxiri “:” bilan tugagan qator — bo‘lim. “Taom — miqdor” ko‘rinishida yozing. Vendorda bir xil nomli texkarta bo‘lsa, avtomatik bog‘lanadi.</p><button type="button" class="btn btn-sm" data-act="sm-paste" style="align-self:flex-start">${ic("list", 16)} Ro‘yxatga qo‘shish</button></div></details>
    ${dishes.length ? `<details><summary class="small">Vendor texkartalaridan qo‘shish (${dishes.length})</summary><div class="chips" style="margin-top:8px">${dishes.map(x => `<button type="button" class="chip" data-act="sm-dish" data-id="${x.id}">${ic("plus", 12)} ${esc(x.name)}</button>`).join("")}</div></details>` : ""}
    <div><span class="lbl">Narxga kiradi</span><div class="row">${INCLUDES.map((x, i) => `<label class="check"><input type="checkbox" name="inc" value="${esc(x)}" id="sm-inc${i}" ${d.includes.includes(x) ? "checked" : ""}> ${esc(x)}</label>`).join("")}</div></div>
    <div class="f-grid"><div class="field"><label for="sm-c">Taxminiy tannarx / kishi <span class="faint">(ixtiyoriy, mijozga ko‘rinmaydi)</span></label><input id="sm-c" name="estCost" type="number" min="0" step="1000" value="${esc(d.estCost)}" placeholder="Vendor keyin to‘ldiradi"></div></div>
    <label class="check"><input type="checkbox" name="visible" ${d.visible ? "checked" : ""}> Mijozlarga ko‘rsatish: ochiq sahifa va takliflarda chiqadi</label>
    <div class="live" id="sm-live"></div>
  </div><aside class="sm-prev" id="sm-prev"></aside></div>
  ${adm ? `<p class="tiny muted">Saqlanganda vendorga bildirishnoma boradi va amal audit logga yoziladi.${m.id ? "" : " Rasm va videolarni saqlagandan keyin menyu kartasiga tashlab qo‘shasiz."}</p>` : ""}
  </div><footer class="m-foot">${m.id ? (setUsed(SET(m.id)) ? `<span class="tiny muted grow">Buyurtmalarda ishlatilgan — o‘chirib bo‘lmaydi, qoralamaga o‘tkazing</span>` : `<button type="button" class="btn btn-danger btn-ghost" data-act="sm-del" data-id="${m.id}">${ic("trash", 16)} O‘chirish</button>`) : ""}<button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`;
};
LIVE.smenu = (f, e) => {
  if (e && e.target.name === "vendorId") { syncSM(); const d = ui.modal.draft; d.lines.forEach(l => { l.d = autoDish(d.vendorId, l.name); }); renderModal(); return; }
  syncSM(); const d = ui.modal.draft; $("#sm-prev").innerHTML = smPreview(d); $("#sm-live").innerHTML = smLive(d);
};
function smFocus(k) { const el = $("#ml-n-" + k); if (el) el.focus(); }
Object.assign(ACT, {
  "sm-new": el => { if (!menuEditor()) return; const vid = isAdm() ? (el.dataset.vid || (ui.amV && ui.amV !== "all" ? ui.amV : "")) : ui.session.vendorId; openModal({ type: "smenu", wide: true, xwide: true, draft: smDraft(vid), paste: el.dataset.k === "paste" }); },
  "sm-edit": el => { const s = SET(el.dataset.id); if (!s || !menuEditor()) return; if (!isSimple(s)) { ACT["edit-set"](el); return; } openModal({ type: "smenu", id: s.id, wide: true, xwide: true, draft: smDraft(null, s) }); },
  "sm-copy": el => { const s = SET(el.dataset.id); const d = smDraft(null, s); d.name += " (nusxa)"; d.visible = false; openModal({ type: "smenu", wide: true, xwide: true, copy: true, draft: d }); },
  "sm-add": el => { syncSM(); const d = ui.modal.draft, g = groupLines(d.lines)[+el.dataset.i], last = g.lines[g.lines.length - 1], at = d.lines.indexOf(last) + 1; d.lines.splice(at, 0, blankLine(g.sec)); renderModal(); smFocus(at); },
  "sm-rm": el => { syncSM(); const d = ui.modal.draft; d.lines.splice(+el.dataset.i, 1); if (!d.lines.length) d.lines.push(blankLine("Salatlar")); renderModal(); },
  "sm-mv": el => { syncSM(); const d = ui.modal.draft, i = +el.dataset.i, j = i + +el.dataset.k; if (j < 0 || j >= d.lines.length) return; if (d.lines[j].sec !== d.lines[i].sec) { d.lines[i].sec = d.lines[j].sec; } else { [d.lines[i], d.lines[j]] = [d.lines[j], d.lines[i]]; } renderModal(); },
  "sm-sec-mv": el => { syncSM(); const d = ui.modal.draft, g = groupLines(d.lines), i = +el.dataset.i, j = i + +el.dataset.k; if (j < 0 || j >= g.length) return; [g[i], g[j]] = [g[j], g[i]]; d.lines = g.flatMap(x => x.lines); renderModal(); },
  "sm-sec-rm": el => { syncSM(); const d = ui.modal.draft, g = groupLines(d.lines)[+el.dataset.i]; d.lines = d.lines.filter(l => !g.lines.includes(l)); if (!d.lines.length) d.lines.push(blankLine("Salatlar")); renderModal(); },
  "sm-sec-add": el => { syncSM(); const d = ui.modal.draft, sec = el.dataset.k || "Yangi bo‘lim"; if (d.lines.length === 1 && !String(d.lines[0].name).trim()) d.lines[0].sec = sec; else d.lines.push(blankLine(sec)); renderModal(); smFocus(d.lines.length - 1); },
  "sm-paste": () => { syncSM(); const d = ui.modal.draft, txt = $("#sm-paste").value; if (!d.vendorId && isAdm()) { toast("Avval vendorni tanlang"); return; } const groups = groupLines(d.lines), add = parseMenuText(txt, d.vendorId, groups.length ? groups[groups.length - 1].sec : null); if (!add.length) { toast("Matnda taom topilmadi"); return; } d.lines = d.lines.filter(l => String(l.name).trim()).concat(add); ui.modal.paste = false; renderModal(); toast(`${add.length} ta taom qo‘shildi${add.some(l => l.d) ? `, ${add.filter(l => l.d).length} tasi texkartaga bog‘landi` : ""}`); },
  "sm-dish": el => { syncSM(); const d = ui.modal.draft, x = D(el.dataset.id), sec = DISH_SEC[x.cat] || x.cat, empty1 = d.lines.findIndex(l => !String(l.name).trim()); const ln = { id: uid("ml"), sec, name: x.name, qty: x.portion, d: x.id }; if (empty1 >= 0) d.lines.splice(empty1, 1, ln); else d.lines.push(ln); renderModal(); },
  "sm-del": el => { const s = SET(el.dataset.id); openModal({ type: "confirm", title: "Menyuni o‘chirish", text: `«${esc(s.name)}» (${esc(vName(s.vendorId))}) butunlay o‘chiriladi. Hali hech qaysi buyurtma yoki fikrda ishlatilmagan.`, yes: "O‘chirish", danger: true, key: "setRm", id: s.id }); },
  "set-vis": el => { const s = SET(el.dataset.id); if (!s || !menuEditor()) return; const was = s.visible !== false; s.visible = !was; if (isAdm()) { audit({ vendorId: s.vendorId, action: "Menyu ko‘rinishi", target: s.name, before: was ? "Ko‘rinadi" : "Qoralama", after: was ? "Qoralama" : "Ko‘rinadi", reason: "" }); notify(s.vendorId, `CaterFlow «${s.name}» menyusini ${was ? "mijozlardan yashirdi (qoralama)" : "mijozlarga ochdi"}`, { view: "menu" }); } else log(s.vendorId, `«${s.name}» ${was ? "qoralamaga o‘tkazildi" : "mijozlarga ochildi"}`); commit(); toast(was ? "Qoralamaga o‘tkazildi — mijozlar ko‘rmaydi" : "Mijozlarga ko‘rinadi"); },
  "sm-prev": el => openModal({ type: "smPrev", id: el.dataset.id, noFocus: true }),
  "am-t": el => { ui.amT = el.dataset.k; render(); },
  "am-s": el => { ui.amS = el.dataset.k; render(); },
});
CONFIRM.setRm = id => { const s = SET(id); db.sets = db.sets.filter(x => x.id !== id); if (isAdm()) audit({ vendorId: s.vendorId, action: "Menyu o‘chirildi", target: s.name, before: som(s.price), after: "", reason: "" }); log(isAdm() ? "admin" : s.vendorId, `Menyu o‘chirildi: ${s.name}`); commit(); toast("Menyu o‘chirildi"); };
CHANGE["am-v"] = el => { ui.amV = el.value; render(); };
FORMS.smenu = (f, fd) => {
  syncSM(); const d = ui.modal.draft, adm = isAdm(), vid = adm ? d.vendorId : ui.session.vendorId;
  if (!vid) { toast("Vendorni tanlang"); return; }
  const lines = d.lines.map(l => ({ id: l.id, sec: String(l.sec || "").trim() || "Boshqa", name: String(l.name).trim(), qty: String(l.qty || "").trim(), d: l.d && D(l.d) && D(l.d).vendorId === vid ? l.d : null })).filter(l => l.name);
  if (!lines.length) { toast("Kamida bitta taom yozing"); smFocus(0); return; }
  if (!(+d.price > 0)) { toast("Kishi boshiga narxni kiriting"); return; }
  const data = { name: String(d.name).trim(), desc: String(d.desc).trim(), price: +d.price, minGuests: +d.minGuests || 0, includes: d.includes, visible: !!d.visible, estCost: +d.estCost || 0, lines, items: lines.filter(l => l.d).map(l => ({ d: l.d, n: 1 })), updatedAt: Date.now(), updatedBy: adm ? "admin" : me().id };
  let s = f.dataset.id ? SET(f.dataset.id) : null; const was = s ? { price: s.price, visible: s.visible !== false, n: (s.lines || []).length } : null;
  if (s) Object.assign(s, data); else { s = Object.assign({ id: uid(vid + "-s"), vendorId: vid, kind: "simple", by: adm ? "admin" : me().id, createdAt: Date.now(), media: [] }, data); db.sets.push(s); }
  if (adm) {
    audit({ vendorId: vid, action: was ? "Menyu tahrirlandi" : "Menyu yaratildi", target: s.name, before: was ? `${som(was.price)} · ${was.n} ta taom${was.visible ? "" : " · qoralama"}` : "", after: `${som(s.price)} · ${lines.length} ta taom${s.visible ? "" : " · qoralama"}`, reason: "" });
    notify(vid, `CaterFlow ${was ? "menyuni yangiladi" : "yangi menyu qo‘shdi"}: «${s.name}» — ${som(s.price)} / kishi. Tekshirib chiqing va rasm qo‘shing.`, { view: "menu" });
  }
  log(adm ? "admin" : vid, `Menyu ${was ? "yangilandi" : "yaratildi"}: ${s.name}`);
  closeModal(); if (adm && ui.view === "vendor") ui.vTab = "menyu"; commit(); toast(was ? "Menyu saqlandi" : s.visible ? "Menyu yaratildi va mijozlarga ko‘rinadi" : "Menyu qoralama sifatida saqlandi");
};
MODALS.smPrev = m => {
  const s = SET(m.id), v = V(s.vendorId);
  return mHead(esc(s.name), `${esc(v.name)} · ${som(s.price)} / kishi`) + `<div class="m-body"><div class="row">${kindPill(s)}${visPill(s)}<span class="tiny muted">Yaratgan: ${esc(setBy(s))}${s.updatedAt ? ` · yangilangan ${ago(s.updatedAt)}` : ""}</span></div>
    ${s.media.length ? `<div class="media-strip lg">${s.media.map(x => mediaTile(x, s)).join("")}</div>` : `<div class="note warn">${ic("camera", 16)}<span>Rasm yoki video yo‘q — rasmsiz menyular kamroq tanlanadi.</span></div>`}
    ${s.desc ? `<p class="small muted">${esc(s.desc)}</p>` : ""}${menuHTML(setLines(s))}
    ${(s.includes || []).length ? `<p class="small"><span class="muted">Narxga kiradi:</span> ${s.includes.map(esc).join(", ")}</p>` : ""}
    <p><strong class="num">${som(s.price)}</strong> <span class="small muted">/ kishi${s.minGuests ? ` · kamida ${s.minGuests} mehmon` : ""}</span></p>${isSimple(s) ? `<p class="tiny muted">${costLine(s)}</p>` : ""}</div>
    <footer class="m-foot"><button type="button" class="btn" data-act="cust-vendor" data-id="${v.id}">${ic("globe", 16)} Ochiq sahifada</button>${menuEditor() ? `<button type="button" class="btn" data-act="sm-copy" data-id="${s.id}">${ic("copy", 16)} Nusxa</button>${isSimple(s) ? `<button type="button" class="btn btn-primary" data-act="sm-edit" data-id="${s.id}">Tahrirlash</button>` : ""}` : ""}<button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};

/* ---------- Admin → Menyular ---------- */
function vAdminMenus() {
  const fv = ui.amV || "all", ft = ui.amT || "all", fs = ui.amS || "all";
  const all = db.sets.filter(s => V(s.vendorId)), shown = all.filter(setShown);
  const list = all.filter(s => (fv === "all" || s.vendorId === fv) && (ft === "all" || (ft === "simple") === isSimple(s)) && (fs === "all" || (fs === "on") === (s.visible !== false)))
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0) || vName(a.vendorId).localeCompare(vName(b.vendorId)));
  const noMenu = db.vendors.filter(v => !shown.some(s => s.vendorId === v.id)), noMedia = shown.filter(s => !s.media.length);
  const rows = list.map(s => { const n = setLines(s).length; return `<tr><td><button type="button" class="link" data-act="sm-prev" data-id="${s.id}"><strong>${esc(s.name)}</strong></button><small>${esc(s.desc || "")}</small></td><td><button type="button" class="link" data-act="open-vendor" data-id="${s.vendorId}">${esc(vName(s.vendorId))}</button><small>${esc(V(s.vendorId).region)}</small></td><td>${kindPill(s)}</td><td class="num r">${n}</td><td class="num r">${num(s.price)}${s.minGuests ? `<small>${s.minGuests}+ kishi</small>` : ""}</td><td class="num r">${s.media.length ? s.media.length : `<span class="warn-t">0</span>`}</td><td>${visPill(s)}</td><td class="small">${esc(setBy(s))}<small>${s.updatedAt ? ago(s.updatedAt) : ""}</small></td>
    <td><div class="row nowrap">${isSimple(s) ? `<button type="button" class="btn btn-sm" data-act="sm-edit" data-id="${s.id}">Tahrirlash</button>` : `<button type="button" class="btn btn-sm btn-ghost" data-act="sm-prev" data-id="${s.id}" title="Texkartali setni vendor o‘zi tahrirlaydi">Ko‘rish</button>`}<button type="button" class="icon-btn" data-act="set-vis" data-id="${s.id}" aria-label="${s.visible === false ? "Mijozlarga ko‘rsatish" : "Qoralamaga o‘tkazish"}" title="${s.visible === false ? "Mijozlarga ko‘rsatish" : "Qoralamaga o‘tkazish"}">${ic(s.visible === false ? "eye" : "eyeoff", 16)}</button><button type="button" class="icon-btn" data-act="sm-copy" data-id="${s.id}" aria-label="Nusxa olish" title="Nusxa olish (boshqa vendorga ham)">${ic("copy", 16)}</button></div></td></tr>`; }).join("");
  return page(head("Menyular", "Barcha vendorlarning mijozga ko‘rinadigan menyulari. Oddiy menyu — faqat taomlar va narx: vendor yuborgan menyuni shu yerda kiritasiz, tannarxni vendor keyin texkarta orqali bog‘laydi.", `<button class="btn" data-act="sm-new" data-k="paste">${ic("list", 16)} Matndan kiritish</button><button class="btn btn-primary" data-act="sm-new">${ic("plus", 16)} Menyu yaratish</button>`),
    `<div class="g g-kpi">${kpi("Jami menyular", all.length, `${all.filter(isSimple).length} tasi oddiy menyu`)}${kpi("Mijozlarga ko‘rinadi", shown.length, `${all.length - shown.length} tasi qoralama`)}${kpi("CaterFlow yaratgan", all.filter(s => s.by === "admin").length)}${kpi("Rasmsiz menyular", noMedia.length, noMedia.length ? "mijozga ko‘rinadiganlardan" : "hammasida rasm bor")}</div>
    ${noMenu.length ? `<div class="note warn">${ic("alert", 16)}<span class="grow">Mijozga ko‘rinadigan menyusi yo‘q vendorlar — ular saytda chiqmaydi: ${noMenu.map(v => `<button type="button" class="link" data-act="sm-new" data-vid="${v.id}">${esc(v.name)}</button>`).join(", ")}</span></div>` : ""}
    <section class="card"><div class="card-h"><div class="row"><label class="vh" for="am-v">Vendor</label><select id="am-v" data-change="am-v" style="width:auto">${opt("all", "Barcha vendorlar", fv)}${db.vendors.map(v => opt(v.id, v.name, fv)).join("")}</select>${chips([["all", "Hammasi"], ["simple", "Oddiy menyu"], ["tech", "Texkartali"]], ft, "am-t")}${chips([["all", "Har qanday"], ["on", "Ko‘rinadi"], ["off", "Qoralama"]], fs, "am-s")}</div><input id="amq" type="search" placeholder="Menyu yoki vendor" data-search="amtable" style="width:200px" autocomplete="off"></div>
    ${list.length ? `<div class="tbl"><table id="amtable"><thead><tr><th>Menyu</th><th>Vendor</th><th>Turi</th><th class="r">Taomlar</th><th class="r">Narx / kishi</th><th class="r">Media</th><th>Holat</th><th>Yaratgan</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : empty("Filtr bo‘yicha menyu yo‘q")}</section>`);
}
