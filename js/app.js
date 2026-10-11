/* CaterFlow prototip — kirish, navigatsiya va hodisalar */
"use strict";
const NAV_A = [["dash", "Holat paneli", "grid"], ["leads", "Leadlar", "inbox", () => db.leads.filter(l => l.status === "yangi").length], ["orders", "Buyurtmalar", "clipboard", () => db.orders.filter(o => o.status === "yangi" || o.status === "takliflar").length], ["vendors", "Vendorlar", "users"], ["amenus", "Menyular", "list"], ["inventory", "Ombor nazorati", "box", () => invAlerts().filter(a => a.sev === "critical").length], ["afinance", "Moliya", "trend"], ["vleads", "Vendor leadlari", "activity"], ["afeedback", "Fikrlar", "star", () => db.feedback.filter(f => f.status === "pending").length], ["settings", "Sozlamalar", "sliders"]];
const NAV_V_ALL = [["vdash", "Holat paneli", "grid"], ["sdash", "Ombor holati", "grid"], ["kitchen", "Oshxona", "pot"], ["vorders", "Buyurtmalar", "clipboard", () => vItems(ui.session.vendorId).filter(x => x.stage === "new").length], ["tasks", "Vazifalar", "check", () => { const m = me(); return m ? db.tasks.filter(t => t.to === m.id && t.status !== "bajarildi").length : 0; }], ["recipes", "Texkartalar", "book"], ["myleads", "Mening leadlarim", "activity"], ["customers", "Mijozlar bazasi", "users"], ["menu", "Menyu va setlar", "book"], ["stock", "Ombor", "box"], ["finance", "Moliya (P&L)", "trend"], ["stats", "Statistika", "bar"], ["team", "Jamoa", "users"]];
const NAV_V = () => NAV_V_ALL.filter(x => can(x[0]));
const USERS = () => [{ login: db.admin.login, pass: db.admin.pass, role: "admin", label: "Admin" }, ...db.staff.filter(x => x.active !== false).map(x => ({ login: x.login, pass: x.pass, role: "vendor", vendorId: x.vendorId, staffId: x.id, label: x.role === "owner" ? V(x.vendorId).name : `${V(x.vendorId).name.split(" ")[0]} · ${VROLES[x.role].name.toLowerCase()}` }))];
const DEMO_CHIPS = () => USERS().filter(u => u.role === "admin" || ["v1", "v2"].includes(u.vendorId) || (u.staffId || "").endsWith("-u0") && u.vendorId === "v3");

function vLogin() {
  return `<div class="login"><div class="login-main"><div class="login-card">
    <div class="brand">${logo(34)}<span>CaterFlow</span></div>
    <div class="stack-s"><h1>Panelga kirish</h1><p class="muted">Admin va vendorlar bitta sahifadan kiradi, har kim faqat o‘ziga tegishli ma’lumotni ko‘radi.</p></div>
    <form data-form="login" class="stack" autocomplete="on">
      <div class="field"><label for="lg-user">Login</label><input id="lg-user" name="user" autocomplete="username" required></div>
      <div class="field"><label for="lg-pass">Parol</label><div class="pass-wrap"><input id="lg-pass" name="pass" type="password" autocomplete="current-password" required><button type="button" class="eye" data-act="toggle-pass" data-target="lg-pass" aria-label="Parolni ko‘rsatish" aria-pressed="false">${ic("eye")}</button></div></div>
      <p class="err" id="lg-err" hidden>Login yoki parol noto‘g‘ri. Ko‘z belgisini bosib parolni tekshiring.</p>
      <button class="btn btn-primary btn-block" type="submit">Kirish</button>
    </form>
    <div class="demo-acc"><span class="eyebrow">Demo akkauntlar</span><div class="chips">${DEMO_CHIPS().map(u => `<button type="button" class="chip" data-act="fill-login" data-user="${esc(u.login)}">${esc(u.label)}</button>`).join("")}</div><p class="tiny muted">Tugmani bossangiz login va parol to‘ldiriladi. Omborchi va oshpaz faqat o‘z bo‘limlarini ko‘radi.</p></div>
    <div class="demo-acc"><span class="eyebrow">Mijozlar uchun</span><div class="row"><button type="button" class="btn btn-sm" data-act="p-home">${ic("globe", 16)} Ochiq saytni ochish</button><button type="button" class="btn btn-sm" data-act="c-login">Mijoz kabinetiga kirish</button>${CUST_EXT() ? "" : `<button type="button" class="chip" data-act="c-demo" data-id="cl1">Demo: Aziza</button>`}</div><p class="tiny muted">O‘zbek, rus va ingliz tillarida. Kirish SMS kod bilan (demo: kod ekranda ko‘rinadi).</p></div>
  </div></div>
  <aside class="login-side"><h2>Sizdan xizmat, bizdan mijoz.</h2><div class="cols">
    <div><h3>Admin panel</h3><ul><li>Instagram leadlari va statuslari</li><li>Buyurtmani vendorlarga yuborish, takliflarni mijozga jo‘natish</li><li>Qaysi vendor qaysi buyurtma bilan band</li><li>Vendorlarning mijozlari, ombori va o‘z leadlari</li><li>Avto rad etish sozlamalari</li></ul></div>
    <div><h3>Vendor panel</h3><ul><li>So‘rovlarga taklif berish</li><li>Ombor: 1 kg va 1 gramm narxi</li><li>Menyu texkartasi va tannarx</li><li>Rasm-video setlar va mijoz fikrlari</li><li>Moliya: P&amp;L va 1 kishilik tannarx</li></ul></div>
  </div></aside></div>`;
}
function shell() {
  const isA = ui.session.role === "admin", ven = isA ? null : V(ui.session.vendorId), u = isA ? null : me(), nav = isA ? NAV_A : NAV_V(), un = isA ? 0 : unread();
  const activeKey = { order: "orders", vendor: "vendors", vorder: "vorders", requests: "vorders" }[ui.view] || ui.view;
  if (!isA && !nav.some(x => x[0] === activeKey)) ui.view = homeView();
  return `<div class="shell"><aside class="side">
    <div class="brand-row"><div class="brand">${logo()}<span>CaterFlow</span></div>${isA ? "" : `<button type="button" class="bell" data-act="notifs" aria-label="Bildirishnomalar: ${un} ta o‘qilmagan">${ic("bell")}${un ? `<em class="badge">${un}</em>` : ""}</button>`}</div>
    ${isA ? `<div class="gsearch"><label class="vh" for="gsearch">Global qidiruv</label><input id="gsearch" type="search" placeholder="Qidirish: CF-1049, vendor, mahsulot…" autocomplete="off" data-gsearch></div>` : ""}
    <div class="role-card"><span class="eyebrow">${isA ? "Admin panel" : esc(ven.name)}</span><strong>${isA ? "CaterFlow jamoasi" : esc(u.name)}</strong>${isA ? "" : `<span>${rolePill(u.role)}</span>`}</div>
    <nav class="nav" aria-label="Bo‘limlar">${nav.map(([k, label, icon, b]) => { const n = b ? b() : 0; return `<button type="button" class="nav-i ${activeKey === k ? "on" : ""}" data-act="go" data-view="${k}" ${activeKey === k ? 'aria-current="page"' : ""}>${ic(icon)}<span>${label}</span>${n ? `<em class="badge">${n}</em>` : ""}</button>`; }).join("")}</nav>
    <div class="side-foot"><label class="lbl" for="role-switch">Demo: rolni almashtirish</label><select id="role-switch" data-change="switch-role">${opt("admin", "CaterFlow admin", isA ? "admin" : "")}${CUST_EXT() ? "" : `<optgroup label="Mijoz tomoni">${opt("pub", "Ochiq sayt (mehmon)")}${(db.clients || []).map(c => opt(c.id, `Mijoz: ${c.name}`)).join("")}</optgroup>`}${db.vendors.map(v => `<optgroup label="${esc(v.name)}">${staffOf(v.id).map(x => opt(x.id, `${x.name} — ${VROLES[x.role].name}`, isA ? "" : (u && u.id))).join("")}</optgroup>`).join("")}</select><button type="button" class="btn btn-ghost btn-sm" data-act="logout">${ic("logout", 16)} Chiqish</button></div>
  </aside><main class="main" id="main">${view()}</main></div>`;
}
function view() {
  const a = ui.session.role === "admin", vid = ui.session.vendorId;
  if (a) switch (ui.view) {
    case "leads": return vLeads(); case "orders": return vOrders(); case "order": return vOrder(ui.param);
    case "vendors": return vVendors(); case "vendor": return vVendorDetail(ui.param); case "vleads": return vVLeads();
    case "settings": return vSettings(); case "afinance": return vAdminFinanceTabs(); case "inventory": return vInventory(); case "afeedback": return vFeedbackAdmin(); case "amenus": return vAdminMenus(); default: return vAdminDash();
  }
  const gate = ui.view === "vorder" || ui.view === "requests" ? "vorders" : ui.view;
  if (!can(gate)) ui.view = homeView();
  switch (ui.view) {
    case "sdash": return vStoreDash(vid); case "kitchen": return vKitchen(vid); case "recipes": return vRecipes(vid); case "tasks": return vTasksPage(vid); case "team": return vTeam(vid);
    case "requests": case "vorders": return vOrdersV(vid); case "vorder": return vVOrder(ui.param); case "stats": return vStats(vid); case "myleads": return vMyLeads(vid, false);
    case "customers": return vCustomers(vid, false); case "menu": return vMenu(vid, false); case "stock": return vStock(vid, false);
    case "finance": return vFinance(vid, false); default: return vVendorDash(vid);
  }
}
function render() {
  resetCache();
  const app = $("#app");
  const v = ui.view || "";
  if (ui.session && ui.session.role === "client") app.innerHTML = clientView();
  else if (v === "c-offer") app.innerHTML = cFrame(cOrder(ui.param, "guest"));
  else if (v === "c-vendor" || v === "p-vendor") app.innerHTML = cFrame(pVendor(ui.param));
  else if (v === "p-home") app.innerHTML = cFrame(pHome());
  else if (!ui.session) app.innerHTML = vLogin();
  else app.innerHTML = shell();
  hideTip();
}
function commit() { save(); render(); if (ui.modal) renderModal(); }
function nav(view, param = null) { ui.view = view; ui.param = param; closeModal(); save(); render(); window.scrollTo(0, 0); }
function openModal(m) { ui.modal = m; renderModal(); const f = $("#modal-root input:not([type=hidden]):not([type=checkbox]):not([type=radio]), #modal-root select, #modal-root textarea"); if (f && !m.noFocus) f.focus({ preventScroll: true }); }
function closeModal() { ui.modal = null; renderModal(); }
function renderModal() {
  const root = $("#modal-root");
  if (!ui.modal) { root.innerHTML = ""; document.body.classList.remove("modal-open"); return; }
  root.innerHTML = `<div class="overlay" data-act="overlay"><div class="modal ${ui.modal.wide ? "wide" : ""} ${ui.modal.xwide ? "xwide" : ""}" role="dialog" aria-modal="true" aria-labelledby="m-title">${MODALS[ui.modal.type](ui.modal)}</div></div>`;
  document.body.classList.add("modal-open");
  root.querySelectorAll("form[data-live]").forEach(f => LIVE[f.dataset.live] && LIVE[f.dataset.live](f, null));
}
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
const tipEl = () => $("#tip");
function hideTip() { const t = tipEl(); if (t) t.classList.remove("show"); }

/* ---------- tugmalar ---------- */
const ACT = {
  go: el => { if (el.dataset.k && el.dataset.view === "menu") ui.menuTab = el.dataset.k; nav(el.dataset.view, el.dataset.param || null); },
  close: () => closeModal(),
  overlay: (el, e) => { if (e.target === el) closeModal(); },
  "toggle-pass": el => { const inp = document.getElementById(el.dataset.target), show = inp.type === "password"; inp.type = show ? "text" : "password"; el.setAttribute("aria-pressed", String(show)); el.setAttribute("aria-label", show ? "Parolni yashirish" : "Parolni ko‘rsatish"); el.innerHTML = ic(show ? "eyeoff" : "eye"); },
  "fill-login": el => { const u = USERS().find(x => x.login === el.dataset.user); $("#lg-user").value = u.login; $("#lg-pass").value = u.pass; $("#lg-err").hidden = true; },
  logout: () => { ui.session = null; ui.modal = null; closeModal(); save(); render(); },
  "reset-ask": () => openModal({ type: "confirm", title: "Demo ma’lumotlarni qaytarish", text: "Prototipda qilgan barcha o‘zgarishlaringiz o‘chadi va namuna ma’lumotlar qayta yuklanadi.", yes: "Qaytarish", danger: true, key: "reset" }),
  "confirm-yes": () => { const m = ui.modal; closeModal(); CONFIRM[m.key](m.id); },
  // leadlar
  "lead-src": el => { ui.leadSrc = el.dataset.k; render(); },
  "open-lead": el => openModal({ type: "lead", id: el.dataset.id, noFocus: true }),
  "new-lead": () => openModal({ type: "newLead" }),
  "lead-status": el => { const l = LEAD(el.dataset.id), st = el.dataset.st; if (l.status === st) return; l.status = st; l.history.push({ at: Date.now(), text: `Holat: ${LEAD_ST[st][0]}` }); log("admin", `“${l.name}” leadini ${LEAD_ST[st][0]} holatiga o‘tkazdi`); commit(); },
  "lead-to-order": el => openModal({ type: "newOrder", leadId: el.dataset.id }),
  "sim-lead": () => {
    const T = [["Shahzoda Ortiqova", "@shahzoda.o", "Assalomu alaykum, 150 kishilik nikoh to‘yiga osh va 3 xil salat narxini bilsam bo‘ladimi?", "Nikoh to‘yi", 150], ["Asilbek Murodov", "@asil_mrd", "Ofisimizda 45 kishilik yangi yil kechasi uchun fursat kerak.", "Korporativ", 45], ["Nodira Hakimova", "@nodira.hk", "Qizimning tug‘ilgan kuniga 30 kishi, shirinliklar ham kerak.", "Tug‘ilgan kun", 30]];
    const t = T[db.leads.length % T.length], l = { id: uid("l"), src: "ig_dm", name: t[0], handle: t[1], phone: "", msg: t[2], ev: t[3], guests: t[4], date: dAdd(30), status: "yangi", at: Date.now(), orderId: null, history: [{ at: Date.now(), text: "Instagram Direct orqali keldi" }] };
    db.leads.unshift(l); log("instagram", `Yangi lead: ${l.name} (Direct)`); commit(); toast(`Instagram’dan yangi lead: ${l.name}`);
  },
  // buyurtmalar
  "ord-filter": el => { ui.ordFilter = el.dataset.k; render(); },
  "open-order": el => { if (ui.session.role !== "admin") return; nav("order", el.dataset.id); },
  "new-order": () => openModal({ type: "newOrder" }),
  dispatch: el => openModal({ type: "dispatch", id: el.dataset.id, noFocus: true }),
  "send-customer": el => {
    const o = ORD(el.dataset.id), ids = [...document.querySelectorAll('input[name="tocust"]:checked')].map(b => b.value);
    if (!ids.length) { toast("Kamida bitta taklifni belgilang"); return; }
    o.requests.forEach(r => { if (r.status === "javob") { r.toCustomer = ids.includes(r.vendorId); if (r.toCustomer) notify(r.vendorId, `${o.id}: taklifingiz mijozga yuborildi`, { view: "vorder", param: o.id }); } });
    o.token = o.token || Math.random().toString(36).slice(2, 8); o.status = "mijozda";
    cnotifyL(o.clientId, { uz: `Takliflar tayyor: ${ids.length} ta — solishtirib tanlang`, ru: `Предложения готовы: ${ids.length} — сравните и выберите`, en: `${ids.length} offers are ready — compare and choose` }, { view: "c-order", param: o.id });
    hist(o, `${ids.length} ta taklif mijozga yuborildi`); log("admin", `${o.id}: ${ids.length} ta taklif mijozga yuborildi`); commit(); toast("Takliflar mijozga yuborildi, havola tayyor");
  },
  copy: el => { const t = el.dataset.text; try { navigator.clipboard.writeText(t).then(() => toast("Nusxalandi"), () => toast("Nusxalab bo‘lmadi, havolani qo‘lda belgilang")); } catch (e) { toast("Nusxalab bo‘lmadi, havolani qo‘lda belgilang"); } },
  "cust-view": el => { const o = ORD(el.dataset.id); if (openCust("offer", { token: o && o.token, order: el.dataset.id })) return; ui.prev = { view: ui.view, param: ui.param }; nav("c-offer", el.dataset.id); },
  "cust-vendor": el => { if (openCust("vendor", { id: el.dataset.id })) return; if (!ui.view.startsWith("c-")) ui.prev = { view: ui.view, param: ui.param }; nav("c-vendor", el.dataset.id); },
  "cust-back": () => { const p = ui.prev || { view: ui.session.role === "admin" ? "dash" : "vdash", param: null }; nav(p.view, p.param); },
  "cust-pick": el => { const o = ORD(el.dataset.order), v = V(el.dataset.vendor); o.vendorId = v.id; o.status = "tasdiqlandi"; reserveOrder(o, v.id); cnotifyL(o.clientId, { uz: `Tanlovingiz qabul qilindi: ${v.name}. Telefon raqamlari ochildi`, ru: `Выбор принят: ${v.name}. Контакты открыты`, en: `Your choice is confirmed: ${v.name}. Contacts are shared` }, { view: "c-order", param: o.id }); hist(o, `Mijoz ${v.name} taklifini tanladi`); o.requests.forEach(r => { if (r.status === "javob") notify(r.vendorId, r.vendorId === v.id ? `Mijoz sizni tanladi: ${o.id} — ${o.eventType}, ${o.guests} kishi, ${fDate(o.date)}` : `${o.id}: mijoz boshqa taklifni tanladi`, { view: "vorder", param: o.id }); }); log("mijoz", `${o.id}: ${v.name} taklifini tanladi`); commit(); toast(`${v.name} tanlandi. Vendor va admin xabardor bo‘ldi`); },
  assign: el => { const o = ORD(el.dataset.id), vid = $("#assign-" + o.id).value; if (!vid) { toast("Vendorni tanlang"); return; } const v = V(vid); o.vendorId = vid; o.status = "tasdiqlandi"; if (!o.requests.find(r => r.vendorId === vid)) o.requests.push({ vendorId: vid, status: "javob", reason: "", sentAt: Date.now(), toCustomer: false, quote: { setId: db.sets.find(s => s.vendorId === vid).id, pp: o.budget, includes: [], note: "Admin qo‘lda biriktirdi", at: Date.now() } }); hist(o, `Admin ${v.name}ni ijrochi qilib biriktirdi`); reserveOrder(o, vid); notify(vid, `Admin sizni ${o.id} buyurtmasiga biriktirdi`, { view: "vorder", param: o.id }); log("admin", `${o.id}: ${v.name} biriktirildi`); commit(); toast(`${v.name} biriktirildi`); },
  "cancel-order": el => openModal({ type: "confirm", title: `${el.dataset.id}ni bekor qilish`, text: "Buyurtma “Bekor qilindi” holatiga o‘tadi. Vendorlar yangi taklif bera olmaydi.", yes: "Bekor qilish", danger: true, key: "cancel", id: el.dataset.id }),
  // vendorlar (admin)
  "open-vendor": el => { if (ui.session.role !== "admin") return; ui.vTab = "umumiy"; nav("vendor", el.dataset.id); },
  vtab: el => { ui.vTab = el.dataset.k; render(); },
  "open-vlead": el => openModal({ type: "vlead", id: el.dataset.id, noFocus: ui.session.role === "admin" }),
  "ig-connect": () => openModal({ type: "ig" }),
  "ig-on": () => { db.settings.igConnected = true; closeModal(); log("admin", "Instagram’ni demo rejimda uladi"); commit(); toast("Instagram demo rejimda ulandi"); },
  "ig-off": () => { db.settings.igConnected = false; log("admin", "Instagram’ni uzdi"); commit(); toast("Instagram uzildi"); },
  "add-blocked": el => { const v = V(el.dataset.id), d = $("#bd-" + v.id).value; if (!d) { toast("Avval sanani tanlang"); return; } if (!v.rules.blocked.includes(d)) v.rules.blocked.push(d); v.rules.blocked.sort(); commit(); toast(`${v.name}: ${fDate(d)} band qilindi`); },
  "rm-blocked": el => { const v = V(el.dataset.id); v.rules.blocked = v.rules.blocked.filter(x => x !== el.dataset.date); commit(); },
  // vendor
  "req-tab": el => { ui.reqTab = el.dataset.k; render(); },
  quote: el => openModal({ type: "quote", id: el.dataset.id, noFocus: true }),
  reject: el => openModal({ type: "reject", id: el.dataset.id }),
  "new-vlead": () => openModal({ type: "newVLead" }),
  "cust-filter": el => { ui.custFilter = el.dataset.k; render(); },
  "new-customer": () => openModal({ type: "customer" }),
  "open-product": el => openModal({ type: "product", id: el.dataset.id, wide: true, noFocus: true }),
  "new-purchase": el => openModal({ type: "purchase", pid: el.dataset.id || null }),
  "new-product": () => openModal({ type: "newProduct" }),
  "menu-tab": el => { ui.menuTab = el.dataset.k; render(); },
  "cost-basis": el => { ui.costBasis = el.dataset.k; save(); render(); },
  "new-set": () => openModal({ type: "set", wide: true }),
  "edit-set": el => openModal({ type: "set", id: el.dataset.id, wide: true }),
  "set-feedback": el => openModal({ type: "setFb", id: el.dataset.id }),
  "view-media": el => openModal({ type: "media", set: el.dataset.set, id: el.dataset.id, wide: true, noFocus: true }),
  "media-rm": el => { const s = SET(el.dataset.set); s.media = s.media.filter(m => m.id !== el.dataset.id); closeModal(); commit(); toast("Media o‘chirildi"); },
  "new-dish": () => { const vid = ui.session.vendorId; if (!db.products.some(p => p.vendorId === vid)) { toast("Avval omborga mahsulot qo‘shing — texkarta masalliqlari shundan olinadi"); return; } openModal({ type: "dish", wide: true, draft: { name: "", cat: "Asosiy", portion: "", price: 20000, ing: [{ p: db.products.find(p => p.vendorId === vid).id, q: 100 }] } }); },
  "edit-dish": el => { const d = D(el.dataset.id); openModal({ type: "dish", id: d.id, wide: true, draft: JSON.parse(JSON.stringify(d)) }); },
  "dish-add-ing": () => { syncDish(); const vid = ui.session.vendorId; ui.modal.draft.ing.push({ p: db.products.find(p => p.vendorId === vid).id, q: 100 }); renderModal(); },
  "dish-rm-ing": el => { syncDish(); ui.modal.draft.ing.splice(+el.dataset.i, 1); renderModal(); },
  "fin-month": el => { ui.finMonth = el.dataset.k; render(); },
  "set-lang": el => { ui.lang = el.dataset.k; const c = meC(); if (c) c.lang = ui.lang; save(); if (ui.modal) renderModal(); render(); },
  "c-go": el => nav(el.dataset.v),
  "c-how": () => { if (ui.view !== "p-home") nav("p-home"); setTimeout(() => { const h = document.getElementById("how"); if (h) h.scrollIntoView({ behavior: "smooth" }); }, 30); },
  "p-home": () => { if (openCust("home")) return; nav("p-home"); },
  "p-vendor": el => { if (ui.session && ui.session.role !== "client" && !ui.view.startsWith("c-") && !ui.view.startsWith("p-")) ui.prev = { view: ui.view, param: ui.param }; nav("p-vendor", el.dataset.id); },
  "p-req": el => openModal({ type: "preq", vid: el.dataset.id || "", wide: true }),
  "c-login": el => openCust("login") || openModal({ type: "clogin", phone: el.dataset.phone || "" }),
  "c-demo": el => { ui.session = { role: "client", clientId: el.dataset.id }; ui.lang = CLI(el.dataset.id).lang || "uz"; nav("c-orders"); },
  "c-logout": () => { ui.session = null; nav("p-home"); },
  "c-staff": () => { ui.session = null; nav("dash"); },
  "c-open": el => nav("c-order", el.dataset.id),
  "c-pick": el => openModal({ type: "cpick", order: el.dataset.order, vendor: el.dataset.vendor }),
  "c-pick-yes": el => { closeModal(); ACT["cust-pick"](el); if (meC()) nav("c-order", el.dataset.order); },
  "c-notifs": () => openModal({ type: "cnotifs", noFocus: true }),
  "c-notif-open": el => { const n = db.cnotifs.find(x => x.id === el.dataset.id); n.read = true; save(); if (n.link) nav(n.link.view, n.link.param || null); else { closeModal(); render(); } },
  "tg-toggle": () => { const c = meC(); c.tg = !c.tg; if (c.tg) db.tglog.unshift({ id: uid("tg"), clientId: c.id, at: Date.now(), text: { uz: "CaterFlow bot ulandi. Xabarlar shu yerga ham keladi.", ru: "Бот CaterFlow подключён. Сообщения будут приходить сюда.", en: "CaterFlow bot connected. Messages will arrive here too." }[c.lang || "uz"] }); commit(); toast(c.tg ? t("tg_on") : t("tg_off")); },
  "cpay-new": el => openModal({ type: "cpay", id: el.dataset.id }),
  "fb-mode": el => { db.settings.fbMode = el.dataset.k; audit({ vendorId: null, action: "Fikr moderatsiyasi rejimi", target: el.dataset.k, before: "", after: el.dataset.k, reason: "" }); commit(); toast("Saqlandi"); },
  "fb-f": el => { ui.fbF = el.dataset.k; render(); },
  "fb-set": el => { const f = db.feedback.find(x => x.id === el.dataset.id), b = f.status || "published"; f.status = el.dataset.k; audit({ vendorId: f.vendorId, action: "Fikr moderatsiyasi", target: `${f.author}: ${f.text.slice(0, 40)}`, before: FB_ST[b][0], after: FB_ST[f.status][0], reason: "" }); if (f.status === "hidden") notify(f.vendorId, `CaterFlow bir fikrni yashirdi (${f.author})`, { view: "menu", tab: "feedback" }); commit(); toast(FB_ST[f.status][0]); },
  "fb-reply": el => openModal({ type: "fbReply", id: el.dataset.id }),
  "af-tab": el => { ui.afTab = el.dataset.k; if (ui.view !== "afinance") nav("afinance"); else { closeModal(); render(); window.scrollTo(0, 0); } },
  "cf-comm": el => openModal({ type: "cfComm", k: el.dataset.k, wide: true, noFocus: true }),
  "cfexp-new": el => openModal({ type: "cfExpense", k: el.dataset.k }),
  "cfexp-rm": el => { const e = db.cfExpenses.find(x => x.id === el.dataset.id); openModal({ type: "confirm", title: "Xarajatni o‘chirish", text: `${esc(e.cat)}: ${som(e.amount)} (${mLabel(e.month)}) o‘chiriladi.`, yes: "O‘chirish", danger: true, key: "cfExpRm", id: e.id }); },
  "biz-per": el => { ui.bizPer = el.dataset.k; render(); },
  "biz-sort": el => { const s = ui.bizSort || { k: "rev", d: -1 }; ui.bizSort = s.k === el.dataset.k ? { k: s.k, d: -s.d } : { k: el.dataset.k, d: el.dataset.k === "name" ? 1 : -1 }; render(); },
  "biz-open": el => { ui.vTab = el.dataset.k || "umumiy"; nav("vendor", el.dataset.id); },
  "ca-src": el => { ui.caSrc = el.dataset.k; render(); },
  "ca-act": el => { ui.caAct = el.dataset.k; render(); },
  "reveal-phone": el => { const c = db.customers.find(x => x.id === el.dataset.id); ui.revealed = Object.assign({}, ui.revealed, { [c.id]: true }); audit({ vendorId: c.vendorId, action: "Admin mijoz kontaktini ko‘rdi", target: c.name, before: "", after: "", reason: "Mijozlar bazasi" }); save(); render(); },
  "inv-tab": el => { ui.invTab = el.dataset.k; closeModal(); render(); window.scrollTo(0, 0); },
  "inv-v": el => { ui.invV = el.dataset.k || null; ui.invTab = "overview"; if (ui.view !== "inventory") nav("inventory"); else { closeModal(); render(); window.scrollTo(0, 0); } },
  "inv-go": el => { ui.invV = el.dataset.v || null; const k = el.dataset.k, map = { ingredients: ui.invV ? "stock" : "ingredients", low: "risk" }; ui.invTab = map[k] || k; if (k === "ingredients") ui.ingSub = "map"; if (ui.view !== "inventory") nav("inventory"); else { closeModal(); render(); window.scrollTo(0, 0); } },
  "ing-sub": el => { ui.ingSub = el.dataset.k; render(); },
  "ing-cat": el => { ui.ingCat = el.dataset.k; render(); },
  "mst-open": el => openModal({ type: "master", id: el.dataset.id, wide: true, noFocus: true }),
  "mst-new": () => openModal({ type: "masterNew" }),
  "map-do": el => { const mid = $("#map-" + el.dataset.id).value; if (!mid) { toast("Master ingredientni tanlang"); return; } openModal({ type: "override", k: "map", id: el.dataset.id, mid }); },
  "adj-f": el => { ui.adjSus = el.dataset.k === "sus"; render(); },
  "res-f": el => { ui.resAn = el.dataset.k === "an"; render(); },
  "risk-d": el => { ui.riskD = +el.dataset.k; render(); },
  "al-sev": el => { ui.alSev = el.dataset.k; render(); },
  "w-per": el => { ui.wPer = el.dataset.k; render(); },
  "au-f": el => { ui.auF = el.dataset.k; render(); },
  "perm-reset": () => { db.settings.perm = null; audit({ vendorId: null, action: "Vendor rollari ruxsati standartga qaytarildi", target: "Sozlamalar", before: "", after: "standart", reason: "" }); commit(); toast("Ruxsatlar standartga qaytarildi"); },
  ovr: el => openModal({ type: "override", k: el.dataset.k, id: el.dataset.id }),
  "waste-new": el => openModal({ type: "waste", pid: el.dataset.id || null }),
  "r-f": el => { ui.rF = el.dataset.k; render(); },
  "recipes-due": () => { ui.rF = "due"; nav("recipes"); },
  "recipe-ok": el => { const d = D(el.dataset.id); (d.versions = d.versions || []).push({ at: Date.now(), by: me().id, note: "Oylik tekshiruv: o‘zgarishsiz", cost: Math.round(dishCost(d)), price: d.price, ing: d.ing.map(i => ({ p: i.p, q: i.q })) }); d.reviewedAt = today(); log(d.vendorId, `Texkarta tekshirildi: ${d.name}`); commit(); toast(`${d.name}: tasdiqlandi (v${d.versions.length})`); },
  "recipe-hist": el => openModal({ type: "recipeHist", id: el.dataset.id, wide: true, noFocus: true }),
  "recipe-suggest": el => { const d = D(el.dataset.id); openModal({ type: "task", role: "owner", title: `Texkartani yangilash: ${d.name}`, note: "Taklif: ", prio: "oddiy", linkView: "recipes" }); },
  vstage: el => { ui.vstage = el.dataset.k; render(); },
  "vstage-go": el => { ui.vstage = el.dataset.k; nav("vorders"); },
  "open-vorder": el => nav("vorder", el.dataset.id),
  "vo-start": el => { const vid = ui.session.vendorId, o = ORD(el.dataset.id); o.status = "bajarilmoqda"; cnotifyL(o.clientId, { uz: "Tadbiringizga tayyorgarlik boshlandi", ru: "Подготовка к вашему событию началась", en: "Preparation for your event has started" }, { view: "c-order", param: o.id }); if (o.own) hist(o, "Tayyorlash boshlandi"); else { hist(o, `${V(vid).name}: tayyorlash boshlandi`); (o.vlog = o.vlog || []).push({ at: Date.now(), vid, text: "Tayyorlash boshlandi" }); } log(vid, `${o.id}: tayyorlash boshlandi`); commit(); toast("Tayyorlash boshlandi — admin ham ko‘radi"); },
  "vo-complete": el => { const o = ORD(el.dataset.id); if (o.date > today()) { toast(`Tadbir ${fDate(o.date)} da — undan keyin yakunlanadi`); return; } openModal({ type: "complete", id: o.id, noFocus: true }); },
  "vo-plan": el => { ui.plan = orderPlan(ORD(el.dataset.id), ui.session.vendorId); ui.stockTab = "plan"; nav("stock"); },
  "new-own-order": () => openModal({ type: "ownOrder", wide: true }),
  "shop-agg": () => openModal({ type: "shop" }),
  notifs: () => openModal({ type: "notifs", noFocus: true }),
  "notif-open": el => { const n = db.notifs.find(x => x.id === el.dataset.id); n.read = true; save(); if (n.link && can(n.link.view === "vorder" ? "vorders" : n.link.view)) { if (n.link.tab) ui.menuTab = n.link.tab; nav(n.link.view, n.link.param || null); } else { closeModal(); render(); } },
  "notifs-read": () => { db.notifs.forEach(n => { if (visibleN(n)) n.read = true; }); commit(); },
  "task-new": el => openModal({ type: "task", vid: el.dataset.vid, to: el.dataset.to, order: el.dataset.order, title: el.dataset.title || "", role: el.dataset.role }),
  "task-f": el => { ui.taskF = el.dataset.k; render(); },
  "task-open": (el, e) => { if (e.target.closest("button") && e.target.closest("button") !== el) return; openModal({ type: "taskView", id: el.dataset.id, noFocus: true }); },
  "task-st": el => { const t = db.tasks.find(x => x.id === el.dataset.id); setTaskStatus(t, el.dataset.st); commit(); toast(`“${t.title}” — ${TASK_ST[t.status][0].toLowerCase()}`); },
  "task-link": el => { const t = db.tasks.find(x => x.id === el.dataset.id); if (ui.session.role === "admin" || !can(t.link.view === "vorder" ? "vorders" : t.link.view)) { toast("Bu sahifa sizning rolingizga ochiq emas"); return; } nav(t.link.view, t.link.param || null); },
  "staff-new": () => openModal({ type: "staff" }),
  "staff-off": el => openModal({ type: "confirm", title: "Xodimni o‘chirish", text: `${esc(STF(el.dataset.id).name)} tizimga kira olmaydi. Uning vazifalari saqlanib qoladi.`, yes: "O‘chirish", danger: true, key: "staffOff", id: el.dataset.id }),
  "k-date": el => { ui.kDate = el.dataset.k; render(); },
  "k-print-ask": () => { const d = ui.kDate || today(), k = kitchenDay(ui.session.vendorId, d, ui.kBuf ?? 5), sh = k.rows.filter(r => r.short > 0.0005), list = (sh.length ? sh : k.rows).map(r => `- ${r.p.name}: ${fmtQty(r.p, sh.length ? r.short : r.qty)}`).join("\n"); openModal({ type: "task", role: "store", title: `Oshxonaga masalliq: ${fDate(d)}, ${k.people} kishi`, note: (sh.length ? "Omborda yetmaydi, xarid qiling:\n" : "Oshxonaga berish kerak:\n") + list, due: d, prio: "muhim", linkView: "sdash" }); },
  "k-issue": () => { const vid = ui.session.vendorId, k = kitchenDay(vid, today()), label = `Oshxonaga: ${k.people} kishi`; guardOut(vid, k.rows, label, (rows, opt) => { applyOut(vid, rows, "kitchen", opt, { note: label }); notify(vid, `Omborchi bugungi masalliqlarni oshxonaga berdi (${k.rows.length} xil)`, { view: "kitchen" }, { roles: ["cook", "owner"] }); log(vid, `Oshxonaga chiqim: ${k.people} kishi`); closeModal(); commit(); toast("Chiqim qilindi, oshpazga xabar ketdi"); }); },
  "buy-all": () => { const vid = ui.session.vendorId, sh = shortAgg(vid, 3); openModal({ type: "purchase", wide: true, lines: sh.rows.map(x => purchaseLine(vid, x.p, x.short)), supplier: (sh.rows[0] || {}).supplier }); },
  "buy-plan": () => { const vid = ui.session.vendorId, r = planCalc(ui.plan); openModal({ type: "purchase", wide: true, lines: r.short.map(x => purchaseLine(vid, x.p, x.short)), supplier: (r.short[0] || {}).supplier }); },
  "pl-add": () => { syncPurchase(); const vid = ui.session.vendorId, used = new Set(ui.modal.lines.map(l => l.p)), p = db.products.find(x => x.vendorId === vid && !used.has(x.id)) || db.products.find(x => x.vendorId === vid); ui.modal.lines.push(purchaseLine(vid, p, 10)); renderModal(); },
  "pl-rm": el => { syncPurchase(); ui.modal.lines.splice(+el.dataset.i, 1); renderModal(); },
  pf: el => { ui.pf = el.dataset.k; render(); },
  "mv-f": el => { ui.mvF = el.dataset.k; render(); },
  adjust: el => openModal({ type: "adjust", id: el.dataset.id || null }),
  "p-edit": el => openModal({ type: "productEdit", id: el.dataset.id }),
  "fin-drill": el => { const mk = el.dataset.m, s = stState(); Object.assign(s, { period: "custom", from: mk + "-01", to: mk + "-31", src: "all", set: "all" }); openModal({ type: "drill", wide: true, noFocus: true, stack: [{ k: el.dataset.k, key: el.dataset.key }] }); },
  "exp-rm": el => { const e = db.expenses.find(x => x.id === el.dataset.id); openModal({ type: "confirm", title: "Xarajatni o‘chirish", text: `${esc(e.cat)}: ${som(e.amount)} (${mLabel(e.month)}) o‘chiriladi.`, yes: "O‘chirish", danger: true, key: "expRm", id: e.id }); },
  "st-open": el => { const s = stState(); s.tab = el.dataset.k || "rev"; if (el.dataset.p) s.period = el.dataset.p; nav("stats"); },
  "st-period": el => { stState().period = el.dataset.k; render(); },
  "st-tab": el => { stState().tab = el.dataset.k; render(); },
  "st-group": el => { const s = stState(); s.group[s.tab] = el.dataset.k; render(); },
  drill: el => openModal({ type: "drill", wide: true, noFocus: true, stack: [{ k: el.dataset.k, key: el.dataset.key }] }),
  "drill-push": el => { ui.modal.stack.push({ k: el.dataset.k, key: el.dataset.key }); renderModal(); const ov = $("#modal-root .overlay"); if (ov) ov.scrollTop = 0; },
  "drill-back": el => { ui.modal.stack.length = +el.dataset.i + 1; renderModal(); },
  "drill-order": el => nav(ui.session.role === "admin" ? "order" : "vorder", el.dataset.id),
  "copy-table": el => { const root = el.closest(".modal") || el.closest(".card"), t = root && root.querySelector("table"); if (!t) { toast("Jadval yo‘q"); return; } try { navigator.clipboard.writeText(tableTSV(t)).then(() => toast("Jadval nusxalandi — Excel yoki Google Sheets’ga joylashtiring"), () => toast("Nusxalab bo‘lmadi")); } catch (e) { toast("Nusxalab bo‘lmadi"); } },
  "stock-tab": el => { ui.stockTab = el.dataset.k; render(); },
  "plan-day": el => { const vid = ui.vTab === "ombor" && ui.view === "vendor" ? ui.param : ui.session.vendorId, k = +el.dataset.k; ui.plan = planFor(vid, k || 0); if (el.dataset.go) ui.stockTab = "plan"; render(); if (el.dataset.go) window.scrollTo(0, 0); },
  "copy-shop": () => { const t = shopText(ui.plan); try { navigator.clipboard.writeText(t).then(() => toast("Xarid ro‘yxati nusxalandi — Telegram’ga joylashingiz mumkin"), () => toast("Nusxalab bo‘lmadi")); } catch (e) { toast("Nusxalab bo‘lmadi"); } },
  "plan-out": () => { const r = planCalc(ui.plan); if (!r.rows.length) { toast("Avval taom va kishi sonini kiriting"); return; } openModal({ type: "confirm", title: "Ombordan chiqim qilish", text: `${r.people} kishilik tayyorlash uchun ${r.rows.length} xil mahsulot ombordan ayiriladi (jami ${som(r.total)}).${r.short.length ? ` ${r.short.length} ta mahsulot yetarli emas — ularning qoldig‘i 0 bo‘ladi.` : ""}`, yes: "Chiqim qilish", key: "planOut" }); },
  "week-rm": el => { const w = db.weekMenus[ui.session.vendorId][el.dataset.day]; w.dishes = w.dishes.filter(x => x !== el.dataset.id); commit(); },
  "receipt-rm": () => { ui.modal.receipt = null; $("#pu-rc").innerHTML = ""; },
  "v-region": el => { ui.vRegion = el.dataset.k; render(); },
  "v-sort": el => { ui.vSort = ui.vSort.k === el.dataset.k ? { k: el.dataset.k, d: -ui.vSort.d } : { k: el.dataset.k, d: ["name", "region"].includes(el.dataset.k) ? 1 : -1 }; render(); },
  "af-month": el => { ui.afMonth = el.dataset.k; render(); },
  "af-sort": el => { ui.afSort = ui.afSort.k === el.dataset.k ? { k: el.dataset.k, d: -ui.afSort.d } : { k: el.dataset.k, d: ["name", "region"].includes(el.dataset.k) ? 1 : -1 }; render(); },
  "r-sort": el => { ui.rSort = ui.rSort.k === el.dataset.k ? { k: el.dataset.k, d: -ui.rSort.d } : { k: el.dataset.k, d: el.dataset.k === "region" ? 1 : -1 }; render(); },
  "af-pick-region": el => { ui.afRegion = el.dataset.k; render(); },
  pay: el => openModal({ type: "payment", id: el.dataset.id }),
  bonus: el => openModal({ type: "bonus", id: el.dataset.id }),
  "vendor-new": () => openModal({ type: "newVendor", wide: true }),
  "new-expense": () => openModal({ type: "expense" })
};
const CONFIRM = {
  reset: () => { db = seed(); postLoad(); const s = ui.session; ui = uiDefault(); ui.session = s; ui.view = s && s.role === "vendor" ? homeView() : "dash"; commit(); toast("Demo ma’lumotlar qaytarildi"); },
  expRm: id => { db.expenses = db.expenses.filter(x => x.id !== id); commit(); toast("Xarajat o‘chirildi"); },
  cfExpRm: id => { const e = db.cfExpenses.find(x => x.id === id); db.cfExpenses = db.cfExpenses.filter(x => x.id !== id); audit({ vendorId: null, action: "CaterFlow xarajati o‘chirildi", target: e.cat, before: som(e.amount), after: "", reason: "" }); commit(); toast("Xarajat o‘chirildi"); },
  staffOff: id => { const x = STF(id); x.active = false; commit(); toast(`${x.name} o‘chirildi`); },
  planOut: () => { const pl = ui.plan, r = planCalc(pl), vid = pl.vid, label = `Tayyorlash: ${r.people} kishi${pl.day ? ", " + DOW[pl.day - 1] : ""}`; guardOut(vid, r.rows, label, (rows, opt) => { applyOut(vid, rows, pl.orderId ? "order" : "chiqim", opt, Object.assign({ note: label }, pl.orderId ? { orderId: pl.orderId } : {})); log(vid, `Ombordan chiqim: ${r.people} kishilik tayyorlash (${som(r.total)})`); closeModal(); commit(); toast("Chiqim qilindi, qoldiqlar yangilandi"); }); },
  cancel: id => { const o = ORD(id); o.status = "bekor"; releaseOrder(o); cnotifyL(o.clientId, { uz: "Buyurtma bekor qilindi", ru: "Заказ отменён", en: "Order cancelled" }, { view: "c-order", param: o.id }); o.requests.forEach(r => { if (r.status === "kutilmoqda") { r.status = "rad"; r.reason = "Buyurtma bekor qilindi"; } }); hist(o, "Admin buyurtmani bekor qildi"); o.requests.forEach(r => notify(r.vendorId, `${o.id} buyurtmasi bekor qilindi`, { view: "vorder", param: o.id })); log("admin", `${o.id} bekor qilindi`); commit(); toast(`${o.id} bekor qilindi`); }
};
function syncDish() {
  const f = $('#modal-root form[data-form="dish"]'); if (!f) return; const d = ui.modal.draft, fd = new FormData(f);
  d.name = fd.get("name"); d.cat = fd.get("cat"); d.portion = fd.get("portion"); d.price = +fd.get("price") || 0;
  d.ing = d.ing.map((i, k) => ({ p: fd.get("ing-p-" + k) || i.p, q: +fd.get("ing-q-" + k) || 0 }));
}

/* ---------- formalar ---------- */
const FORMS = {
  login: (f, fd) => { const u = USERS().find(x => x.login === String(fd.get("user")).trim() && x.pass === fd.get("pass")); if (!u) { $("#lg-err").hidden = false; return; } ui.session = { role: u.role, vendorId: u.vendorId || null, staffId: u.staffId || null }; ui.view = u.role === "admin" ? "dash" : homeView(); ui.param = null; save(); render(); window.scrollTo(0, 0); if (u.staffId) toast(`${STF(u.staffId).name} · ${VROLES[myRole()].name}`); },
  "lead-note": (f, fd) => { const l = LEAD(f.dataset.id); l.history.push({ at: Date.now(), text: fd.get("text") }); commit(); },
  "new-lead": (f, fd) => { const c = String(fd.get("contact") || ""), l = { id: uid("l"), src: fd.get("src"), name: fd.get("name"), handle: c.startsWith("@") ? c : "", phone: c.startsWith("@") ? "" : c, msg: fd.get("msg") || "", ev: fd.get("ev"), guests: +fd.get("guests") || 0, date: fd.get("date"), status: "yangi", at: Date.now(), orderId: null, history: [{ at: Date.now(), text: "Admin qo‘lda qo‘shdi" }] }; db.leads.unshift(l); log("admin", `“${l.name}” leadini qo‘shdi`); closeModal(); commit(); toast("Lead qo‘shildi"); },
  "new-order": (f, fd) => {
    const max = Math.max(...db.orders.map(o => +o.id.split("-")[1])), id = "CF-" + (max + 1), lead = f.dataset.lead ? LEAD(f.dataset.lead) : null;
    const o = { id, clientId: lead && lead.clientId ? lead.clientId : ((db.clients || []).find(c => c.phone.replace(/\D/g, "") === String(fd.get("phone")).replace(/\D/g, "")) || {}).id || null, leadId: lead ? lead.id : null, customer: fd.get("customer"), phone: fd.get("phone"), eventType: fd.get("eventType"), date: fd.get("date"), guests: +fd.get("guests"), budget: +fd.get("budget"), area: fd.get("area"), venue: fd.get("venue"), notes: fd.get("notes"), status: "yangi", vendorId: null, createdAt: Date.now(), requests: [], token: null, history: [{ at: Date.now(), text: lead ? "Leaddan buyurtma yaratildi" : "Buyurtma yaratildi" }] };
    db.orders.push(o); if (lead) { lead.status = "buyurtma"; lead.orderId = id; lead.history.push({ at: Date.now(), text: `${id} buyurtmasi yaratildi` }); }
    log("admin", `${id} buyurtmasini yaratdi`); ui.modal = null; renderModal(); nav("order", id); toast(`${id} yaratildi. Endi vendorlarga yuboring`);
  },
  dispatch: (f, fd) => {
    const o = ORD(f.dataset.id), ids = fd.getAll("v"); if (!ids.length) { toast("Kamida bitta vendorni tanlang"); return; }
    let auto = 0;
    ids.forEach(vid => { const reasons = ruleCheck(V(vid), o); if (reasons.length) auto++; o.requests.push({ vendorId: vid, status: reasons.length ? "avto" : "kutilmoqda", reason: reasons.join("; "), sentAt: Date.now(), quote: null, toCustomer: false }); notify(vid, reasons.length ? `${o.id} so‘rovi avtomatik rad etildi: ${reasons.join("; ")}` : `Yangi so‘rov: ${o.id} — ${o.eventType}, ${o.guests} kishi, ${fDate(o.date)}`, { view: "vorder", param: o.id }); });
    if (o.status === "yangi") o.status = "vendorlarda";
    hist(o, `${ids.length} ta vendorga yuborildi${auto ? `, ${auto} tasi avtomatik rad etildi` : ""}`); log("admin", `${o.id} buyurtmasini ${ids.map(i => V(i).name).join(", ")} ga yubordi`);
    closeModal(); commit(); toast(`${ids.length - auto} ta vendorga yuborildi${auto ? `, ${auto} tasi avtomatik rad etildi` : ""}`);
  },
  quote: (f, fd) => {
    const o = ORD(f.dataset.id), vid = ui.session.vendorId, r = o.requests.find(x => x.vendorId === vid);
    const was = !!r.quote; if (r.toCustomer) { toast("Taklif mijozga yuborilgan — endi o‘zgartirib bo‘lmaydi"); return; }
    r.status = "javob"; r.quote = { setId: fd.get("setId"), pp: +fd.get("pp"), includes: fd.getAll("inc"), note: fd.get("note") || "", at: Date.now() };
    if (o.status === "vendorlarda") o.status = "takliflar";
    hist(o, `${V(vid).name} ${was ? "taklifini yangiladi" : "taklif berdi"}`); log(vid, `${o.id} uchun ${was ? "taklifni yangiladi" : "taklif berdi"}: ${num(r.quote.pp)} so‘m/kishi`); closeModal(); commit(); toast(was ? "Taklif yangilandi" : "Taklif adminga yuborildi. Mijoz tanlasa, bildirishnoma keladi");
  },
  reject: (f, fd) => { const o = ORD(f.dataset.id), vid = ui.session.vendorId, r = o.requests.find(x => x.vendorId === vid); r.status = "rad"; r.reason = fd.get("reason") + (fd.get("note") ? ": " + fd.get("note") : ""); hist(o, `${V(vid).name} rad etdi`); log(vid, `${o.id} so‘rovini rad etdi (${r.reason})`); closeModal(); commit(); toast("So‘rov rad etildi"); },
  "vlead-note": (f, fd) => { const l = VLEAD(f.dataset.id); l.log.push({ at: Date.now(), text: fd.get("text") }); l.updatedAt = Date.now(); log(l.vendorId, `“${l.name}” leadiga izoh: ${fd.get("text")}`); commit(); },
  vlead: (f, fd) => { const vid = ui.session.vendorId, l = { id: uid(vid + "-l"), vendorId: vid, name: fd.get("name"), phone: fd.get("phone"), source: fd.get("source"), ev: fd.get("ev"), guests: +fd.get("guests"), date: fd.get("date"), value: +fd.get("value"), status: "yangi", at: Date.now(), updatedAt: Date.now(), log: [{ at: Date.now(), text: fd.get("text") || "Lead qo‘shildi" }] }; db.ownLeads.push(l); log(vid, `“${l.name}” leadini qo‘shdi`); closeModal(); commit(); toast("Lead qo‘shildi, admin ham ko‘radi"); },
  customer: (f, fd) => { db.customers.push({ id: uid("c"), vendorId: ui.session.vendorId, name: fd.get("name"), phone: fd.get("phone"), source: fd.get("source"), since: today() }); closeModal(); commit(); toast("Mijoz qo‘shildi"); },
  purchase: () => {
    syncPurchase(); const m = ui.modal, lines = m.lines.filter(l => l.qty > 0 && l.total > 0);
    if (!lines.length) { toast("Kamida bitta qatorga miqdor va summa kiriting"); return; }
    lines.forEach(l => { const p = P(l.p); db.purchases.push(Object.assign({ id: uid("b"), vendorId: p.vendorId, productId: p.id, date: m.date, supplier: m.supplier, qty: l.qty, total: l.total }, m.receipt ? { receipt: m.receipt.src } : {})); p.stock = Math.round((p.stock + l.qty) * 10) / 10; });
    const vid = ui.session.vendorId; log(vid, `${m.supplier}dan ${lines.length} xil mahsulot kirim qilindi (${som(lines.reduce((a, l) => a + l.total, 0))})`);
    if (myRole() === "store") notify(vid, `Omborchi ${lines.length} xil mahsulotni kirim qildi: ${som(lines.reduce((a, l) => a + l.total, 0))}`, { view: "stock" }, { roles: ["owner"] });
    closeModal(); commit(); toast(lines.length === 1 ? `${P(lines[0].p).name}: 1 ${P(lines[0].p).unit} = ${som(lines[0].total / lines[0].qty)}` : `${lines.length} xil mahsulot kirim qilindi`);
  },
  adjust: (f, fd) => { const p = P(fd.get("pid")), q = Math.max(0, +fd.get("qty") || 0), diff = Math.round((q - p.stock) * 10) / 10, before = p.stock, reason = fd.get("reason") + (fd.get("note") ? ": " + fd.get("note") : ""); if (!diff) { closeModal(); toast("Farq yo‘q — qoldiq to‘g‘ri"); return; } if (diff < 0 && fd.get("reason") === "Buzildi / chiqindi") moveRec(p.vendorId, p, "waste", -diff, { reason: "Shikastlandi", note: reason, before, after: q }); else { moveRec(p.vendorId, p, "adjust", diff, { before, after: q, note: reason, reason }); audit({ vendorId: p.vendorId, action: "Qoldiq qo‘lda tuzatildi", target: p.name, before: fmtQty(p, before), after: fmtQty(p, q), reason }); } p.stock = q; log(p.vendorId, `Inventarizatsiya: ${p.name} ${diff > 0 ? "+" : "−"}${fmtQty(p, Math.abs(diff))}`); closeModal(); commit(); toast(`${p.name}: qoldiq ${fmtQty(p, q)} (${diff > 0 ? "+" : "−"}${fmtQty(p, Math.abs(diff))})`); },
  "product-edit": (f, fd) => { const p = P(f.dataset.id); p.name = fd.get("name"); p.cat = fd.get("cat"); p.min = Math.max(0, +fd.get("min") || 0); closeModal(); commit(); toast("Saqlandi"); },
  staff: (f, fd) => { const vid = ui.session.vendorId, login = String(fd.get("login")).trim(); if (USERS().some(x => x.login === login)) { toast("Bu login band — boshqasini kiriting"); return; } const x = { id: uid(vid + "-u"), vendorId: vid, name: fd.get("name"), phone: fd.get("phone"), role: fd.get("role"), login, pass: fd.get("pass") }; db.staff.push(x); notify(vid, `CaterFlow’ga xush kelibsiz! Rolingiz: ${VROLES[x.role].name}`, { view: "tasks" }, { to: x.id }); closeModal(); commit(); toast(`${x.name} qo‘shildi. Login: ${login}`); },
  task: (f, fd) => { const vid = f.dataset.vid, by = ui.session.role === "admin" ? "admin" : me().id, to = fd.get("to"), order = fd.get("order"); if (!to) { toast("Kimga ekanini tanlang"); return; } const t = { id: uid("t"), vendorId: vid, title: fd.get("title"), note: fd.get("note") || "", to, by, due: fd.get("due"), prio: fd.get("prio"), status: "yangi", link: order ? { view: "vorder", param: order } : (fd.get("linkView") ? { view: fd.get("linkView") } : null), at: Date.now(), comments: [] }; db.tasks.unshift(t); notify(vid, `Yangi vazifa${by === "admin" ? " (CaterFlow)" : ` — ${byName(by)}`}: ${t.title}`, { view: "tasks" }, { to }); log(by === "admin" ? "admin" : vid, `${STF(to).name}ga vazifa: ${t.title}`); closeModal(); commit(); toast(`${STF(to).name}ga yuborildi — bildirishnoma ketdi`); },
  "task-cm": (f, fd) => { const t = db.tasks.find(x => x.id === f.dataset.id), by = ui.session.role === "admin" ? "admin" : me().id; (t.comments = t.comments || []).push({ at: Date.now(), by, text: fd.get("text") }); const other = by === t.to ? t.by : t.to; if (other && other !== "admin" && other !== by) notify(t.vendorId, `${byName(by)} izoh yozdi: “${t.title}”`, { view: "tasks" }, { to: other }); commit(); },
  product: (f, fd) => { const vid = ui.session.vendorId, mid = fd.get("mid") || null, m = mid && MST(mid); db.products.push({ id: uid(vid + "-p"), vendorId: vid, mid, name: fd.get("name"), unit: m ? m.unit : fd.get("unit"), cat: m ? m.cat : fd.get("cat"), stock: 0, min: +fd.get("min") || 0, exp: null }); closeModal(); commit(); toast("Mahsulot qo‘shildi. Endi kirim kiriting"); },
  set: (f, fd) => {
    const vid = ui.session.vendorId, items = db.dishes.filter(d => d.vendorId === vid).map(d => ({ d: d.id, n: +fd.get("n-" + d.id) || 0 })).filter(i => i.n > 0);
    if (!items.length) { toast("Kamida bitta taom qo‘shing"); return; }
    const visible = fd.get("visible") === "on";
    if (f.dataset.id) Object.assign(SET(f.dataset.id), { name: fd.get("name"), desc: fd.get("desc"), price: +fd.get("price"), items, visible, updatedAt: Date.now(), updatedBy: me().id });
    else db.sets.push({ id: uid(vid + "-s"), vendorId: vid, name: fd.get("name"), desc: fd.get("desc"), price: +fd.get("price"), items, media: [], visible, by: me().id, createdAt: Date.now() });
    closeModal(); commit(); toast("Set saqlandi");
  },
  dish: (f, fd) => { syncDish(); const d = ui.modal.draft, vid = ui.session.vendorId, note = String(fd.get("vnote") || "").trim(); d.ing = d.ing.filter(i => i.q > 0); if (!d.ing.length) { toast("Kamida bitta masalliq kiriting"); return; } let x; if (f.dataset.id) { x = D(f.dataset.id); Object.assign(x, d); } else { x = Object.assign({ id: uid(vid + "-d"), vendorId: vid, versions: [] }, d); db.dishes.push(x); } (x.versions = x.versions || []).push({ at: Date.now(), by: me().id, note: note || (f.dataset.id ? "Tahrirlandi" : "Yaratildi"), cost: Math.round(dishCost(x)), price: x.price, ing: x.ing.map(i => ({ p: i.p, q: i.q })) }); x.reviewedAt = today(); log(vid, `Texkarta ${f.dataset.id ? "yangilandi" : "yaratildi"}: ${x.name}`); closeModal(); commit(); toast(`Texkarta saqlandi (v${x.versions.length}) — tannarx va ombor hisobi yangilandi`); },
  expense: (f, fd) => { db.expenses.push({ id: uid("e"), vendorId: ui.session.vendorId, month: fd.get("month"), cat: fd.get("cat"), amount: +fd.get("amount"), note: fd.get("note") }); ui.finMonth = fd.get("month"); closeModal(); commit(); toast("Xarajat qo‘shildi"); },
  noop: () => {},
  psearch: (f, fd) => { ui.psearch = { ev: fd.get("ev"), date: fd.get("date"), guests: fd.get("guests"), area: fd.get("area"), budget: fd.get("budget") }; render(); const el = document.getElementById("vendors"); if (el) el.scrollIntoView({ behavior: "smooth" }); },
  "p-request": (f, fd) => {
    const phone = String(fd.get("phone")).trim(), name = String(fd.get("name")).trim(), pref = fd.get("vendor"), ph = phone.replace(/\D/g, "");
    let c = meC() || (db.clients || []).find(x => x.phone.replace(/\D/g, "") === ph) || null;
    if (!c && fd.get("cabinet")) { c = { id: uid("cl"), name, phone, lang: ui.lang || "uz", tg: false, createdAt: Date.now() }; db.clients.push(c); }
    const l = { id: uid("l"), src: "sayt", name, handle: "", phone, msg: `${fd.get("notes") || ""}${pref ? ` · Afzal vendor: ${vName(pref)}` : ""} · byudjet ${num(+fd.get("budget") || 0)} so‘m/kishi · ${fd.get("area")}`.replace(/^ · /, ""), ev: fd.get("ev"), guests: +fd.get("guests") || 0, date: fd.get("date"), status: "yangi", at: Date.now(), orderId: null, clientId: c ? c.id : null, budget: +fd.get("budget") || 0, area: fd.get("area"), prefVendor: pref || null, history: [{ at: Date.now(), text: `Saytdan so‘rov (${(ui.lang || "uz").toUpperCase()})` }] };
    db.leads.unshift(l); log("mijoz", `Saytdan yangi so‘rov: ${name}, ${l.guests} kishi, ${fDate(l.date)}`);
    if (c) cnotifyL(c.id, { uz: "So‘rovingiz qabul qilindi. CaterFlow menejeri tez orada bog‘lanadi", ru: "Заявка принята. Менеджер CaterFlow скоро свяжется", en: "Request received. A CaterFlow manager will contact you soon" }, { view: "c-orders" });
    closeModal(); commit(); toast(t("req_sent"));
    if (c && !meC()) openModal({ type: "cverify", phone: c.phone, code: String(1000 + Math.floor(Math.random() * 9000)), cid: c.id });
  },
  "c-code": (f, fd) => { const ph = String(fd.get("phone")).replace(/\D/g, ""), c = (db.clients || []).find(x => x.phone.replace(/\D/g, "") === ph); if (!c) { toast(t("no_client")); return; } openModal({ type: "cverify", phone: c.phone, code: String(1000 + Math.floor(Math.random() * 9000)), cid: c.id }); },
  "c-verify": (f, fd) => { const m = ui.modal; if (String(fd.get("code")).trim() !== m.code) { toast(t("wrong_code")); return; } const c = CLI(m.cid); ui.session = { role: "client", clientId: c.id }; c.lang = c.lang || ui.lang; ui.lang = c.lang; closeModal(); nav("c-orders"); toast(`${c.name}`); },
  "c-review": (f, fd) => { const o = ORD(f.dataset.id), c = meC(), q = orderQuote(o); const fb = { id: uid("f"), vendorId: o.vendorId, setId: q ? q.setId : null, orderId: o.id, author: shortName(c ? c.name : o.customer), rating: +fd.get("rating") || 5, text: fd.get("text"), at: Date.now(), via: "kabinet", status: db.settings.fbMode === "pre" ? "pending" : "published" }; db.feedback.push(fb); notify(o.vendorId, `Yangi fikr: ${fb.rating}★ — ${o.id} (tasdiqlangan mijoz)`, { view: "menu", tab: "feedback" }); commit(); toast(fb.status === "pending" ? t("moderation") : t("saved")); },
  "p-review": (f, fd) => { const fb = { id: uid("f"), vendorId: f.dataset.vendor, setId: fd.get("setId"), orderId: null, author: shortName(fd.get("author")), rating: +fd.get("rating") || 5, text: fd.get("text"), at: Date.now(), via: "profil", status: db.settings.fbMode === "pre" ? "pending" : "published" }; db.feedback.push(fb); notify(fb.vendorId, `Yangi fikr: ${fb.rating}★ (ochiq sahifadan)`, { view: "menu", tab: "feedback" }); commit(); toast(fb.status === "pending" ? t("moderation") : t("saved")); },
  chat: (f, fd) => { const o = ORD(f.dataset.id), text = String(fd.get("text") || "").trim(); if (!text) return; chatSend(o, f.dataset.from === "guest" ? "client" : f.dataset.from, text); commit(); const box = document.getElementById("chat-" + o.id); if (box) box.scrollTop = box.scrollHeight; const inp = document.getElementById("ch-" + o.id); if (inp) inp.focus(); },
  cpay: (f, fd) => { const o = ORD(f.dataset.id), amount = +fd.get("amount"); if (!(amount > 0)) { toast("Summani kiriting"); return; } const x = { id: uid("cp"), orderId: o.id, vendorId: o.vendorId, amount, kind: fd.get("kind"), method: fd.get("method"), date: fd.get("date"), note: fd.get("note") || "", by: ui.session.role === "vendor" ? me().id : "admin" }; db.custPays.push(x); if (o.own) hist(o, `To‘lov: ${PAY_KIND[x.kind][0]} ${som(amount)}`); else (o.vlog = o.vlog || []).push({ at: Date.now(), vid: o.vendorId, text: `Mijoz to‘lovi: ${PAY_KIND[x.kind][0]} ${som(amount)}` }); cnotifyL(o.clientId, { uz: `To‘lov qayd etildi: ${som(amount)} (${x.method})`, ru: `Оплата зафиксирована: ${num(amount)} сум (${x.method})`, en: `Payment recorded: ${num(amount)} UZS (${x.method})` }, { view: "c-order", param: o.id }); log(o.vendorId, `${o.id}: mijoz to‘lovi ${som(amount)}`); closeModal(); commit(); toast("To‘lov saqlandi — mijoz ham ko‘radi"); },
  "fb-reply": (f, fd) => { const fb = db.feedback.find(x => x.id === f.dataset.id); fb.reply = { text: fd.get("text"), at: Date.now() }; closeModal(); commit(); toast("Javob saqlandi — ochiq sahifada ko‘rinadi"); },
  "c-profile": (f, fd) => { const c = meC(); c.name = fd.get("name"); c.lang = fd.get("lang"); ui.lang = c.lang; commit(); toast(t("saved")); },
  "cf-expense": (f, fd) => { const amount = +fd.get("amount"); if (!(amount > 0)) { toast("Summani kiriting"); return; } db.cfExpenses.push({ id: uid("cfe"), month: fd.get("month"), cat: fd.get("cat"), amount, note: fd.get("note") || "" }); ui.afMonth = fd.get("month"); audit({ vendorId: null, action: "CaterFlow xarajati qo‘shildi", target: fd.get("cat"), before: "", after: som(amount), reason: fd.get("note") || "" }); closeModal(); commit(); toast("Xarajat qo‘shildi"); },
  "stock-guard": (f, fd) => { const r = String(fd.get("reason") || "").trim(); if (r.length < 5) { toast("Sababni aniqroq yozing"); return; } const fn = _guardFn; _guardFn = null; if (fn) fn(r); },
  waste: (f, fd) => { const p = P(fd.get("pid")), q = Math.max(0, +fd.get("qty") || 0); if (!q) { toast("Miqdorni kiriting"); return; } const before = p.stock; p.stock = Math.round(Math.max(0, p.stock - q) * 10) / 10; moveRec(p.vendorId, p, "waste", Math.min(q, Math.max(0, before)), { reason: fd.get("reason"), note: fd.get("note") || fd.get("reason"), before, after: p.stock }); log(p.vendorId, `Chiqindi: ${p.name} ${fmtQty(p, q)} (${fd.get("reason")})`); closeModal(); commit(); toast(`Chiqindi yozildi: ${p.name} ${fmtQty(p, q)} ≈ ${som(q * avgP(p.id))}`); },
  master: (f, fd) => { const m = MST(f.dataset.id), b = `${m.name} · ${m.cat} · ${m.unit} · ${m.active ? "faol" : "o‘chirilgan"}`; m.name = fd.get("name"); m.cat = fd.get("cat"); m.unit = fd.get("unit"); m.active = !!fd.get("active"); audit({ vendorId: null, action: "Master ingredient o‘zgartirildi", target: m.id, before: b, after: `${m.name} · ${m.cat} · ${m.unit} · ${m.active ? "faol" : "o‘chirilgan"}`, reason: "" }); closeModal(); commit(); toast("Saqlandi"); },
  "master-new": (f, fd) => { const id = "m" + (db.ingredients.length + Math.floor(Math.random() * 1000)); db.ingredients.push({ id, name: fd.get("name"), cat: fd.get("cat"), unit: fd.get("unit"), active: true }); audit({ vendorId: null, action: "Master ingredient qo‘shildi", target: fd.get("name"), before: "", after: `${fd.get("cat")} · ${fd.get("unit")}`, reason: "" }); closeModal(); commit(); toast("Katalogga qo‘shildi — vendorlar endi tanlay oladi"); },
  icat: (f, fd) => { const n = String(fd.get("name")).trim(); if (db.icats.some(c => c.name.toLowerCase() === n.toLowerCase())) { toast("Bunday kategoriya bor"); return; } db.icats.push({ id: uid("ic"), name: n, active: true }); audit({ vendorId: null, action: "Kategoriya qo‘shildi", target: n, before: "", after: "", reason: "" }); commit(); toast("Kategoriya qo‘shildi"); },
  unit: (f, fd) => { const id = String(fd.get("id")).trim().toLowerCase(); if (!id || db.units.some(u => u.id === id)) { toast("Bunday birlik bor yoki belgi bo‘sh"); return; } db.units.push({ id, name: fd.get("name"), base: fd.get("base"), factor: Math.max(1, +fd.get("factor") || 1), active: true, core: false }); audit({ vendorId: null, action: "O‘lchov birligi qo‘shildi", target: id, before: "", after: `1 ${id} = ${fd.get("factor")} ${fd.get("base")}`, reason: "" }); commit(); toast("Birlik qo‘shildi"); },
  override: (f, fd) => {
    const k = f.dataset.k, id = f.dataset.id, reason = String(fd.get("reason") || "").trim(); if (reason.length < 5) { toast("Sababni aniqroq yozing — u audit logga yoziladi"); return; }
    if (k === "stock") { const p = P(id), before = p.stock, q = +fd.get("qty"); p.stock = q; moveRec(p.vendorId, p, "admin", Math.round((q - before) * 10) / 10, { before, after: q, note: reason, reason }); audit({ vendorId: p.vendorId, action: "Admin override: qoldiq tuzatildi", target: p.name, before: fmtQty(p, before), after: fmtQty(p, q), reason }); notify(p.vendorId, `CaterFlow admini ${p.name} qoldig‘ini tuzatdi: ${fmtQty(p, before)} → ${fmtQty(p, q)}`, { view: "stock" }, { roles: ["owner", "store"] }); }
    if (k === "release") { const o = ORD(id), n = releaseOrder(o, true); audit({ vendorId: o.vendorId, action: "Admin override: rezerv bo‘shatildi", target: o.id, before: `${n} ta faol rezerv`, after: "bo‘shatildi", reason }); notify(o.vendorId, `CaterFlow admini ${o.id} rezervini bo‘shatdi`, { view: "stock" }, { roles: ["owner", "store"] }); }
    if (k === "reserve") { const o = ORD(id), n = reserveOrder(o, o.vendorId, true); audit({ vendorId: o.vendorId, action: "Admin override: rezerv qilindi", target: o.id, before: "rezerv yo‘q", after: `${n} ta mahsulot`, reason }); }
    if (k === "map") { const p = P(id), m = MST(f.dataset.mid); p.mid = m.id; p.cat = m.cat; audit({ vendorId: p.vendorId, action: "Admin override: ingredient moslashtirildi", target: p.name, before: "bog‘lanmagan", after: m.name, reason }); }
    closeModal(); commit(); toast("Bajarildi — audit logga yozildi");
  },
  bonus: (f, fd) => { const v = V(f.dataset.id), amount = +fd.get("amount"); if (!(amount > 0)) { toast("Bonus summasini kiriting"); return; } db.bonuses.push({ id: uid("bn"), vendorId: v.id, amount, date: fd.get("date") || today(), note: fd.get("note") || "Bonus", by: "admin" }); notify(v.id, `CaterFlow sizga ${som(amount)} bonus berdi — keyingi CaterFlow buyurtmalari komissiyasi avval shundan yechiladi`, { view: "finance" }, { roles: ["owner"] }); log("admin", `${v.name}ga ${som(amount)} bonus berdi`); closeModal(); commit(); toast(`${v.name}: ${som(amount)} bonus berildi, vendorga xabar ketdi`); },
  "vendor-new": (f, fd) => {
    const login = String(fd.get("login")).trim(); if (USERS().some(x => x.login === login)) { toast("Bu login band — boshqasini kiriting"); return; }
    let n = db.vendors.length + 1; while (V("v" + n)) n++; const id = "v" + n, region = fd.get("region"), withBonus = !!fd.get("bonus"), amt = db.settings.bonusAmount || 500000;
    const v = { id, name: fd.get("name"), contact: fd.get("contact"), phone: fd.get("phone") || "", district: fd.get("district") || region, region, since: today(), login, pass: fd.get("pass"), size: 2, closed: false, closedReason: "", closedUntil: "", rules: { minGuests: 30, maxGuests: 400, minPP: 100000, areas: [region], blocked: [] } };
    db.vendors.push(v); db.staff.push({ id: `${id}-u0`, vendorId: id, name: v.contact, phone: v.phone, role: "owner", login, pass: v.pass });
    db.weekMenus[id] = {}; for (let d = 1; d <= 7; d++) db.weekMenus[id][d] = { dishes: [], people: 0 };
    if (withBonus) db.bonuses.push({ id: uid("bn"), vendorId: id, amount: amt, date: today(), note: "Xush kelibsiz bonusi", by: "admin" });
    notify(id, `CaterFlow’ga xush kelibsiz!${withBonus ? ` Sizga ${som(amt)} bonus berildi: birinchi buyurtmalar komissiyasi shundan yechiladi.` : ""} Profilingizni to‘ldiring.`, { view: "vdash" }, { roles: ["owner"] });
    log("admin", `Yangi vendor qo‘shildi: ${v.name}${withBonus ? ` (${som(amt)} bonus)` : ""}`); closeModal(); commit(); toast(`${v.name} qo‘shildi. Login: ${login}`);
  },
  complete: (f, fd) => {
    const vid = ui.session.vendorId, o = ORD(f.dataset.id), q = oQuote(o, vid), guests = Math.max(1, +fd.get("guests") || o.guests);
    if (o.date > today()) { toast("Tadbir kuni hali kelmagan — yakunlab bo‘lmaydi"); return; }
    const finish = () => {
    o.guests = guests; o.status = "yakunlandi"; consumeOrder(o); cnotifyL(o.clientId, { uz: "Tadbir bo‘lib o‘tdi — fikringizni qoldiring", ru: "Событие состоялось — оставьте отзыв", en: "Your event is done — please leave a review" }, { view: "c-order", param: o.id });
    let c = (o.customerId && db.customers.find(x => x.id === o.customerId)) || db.customers.find(x => x.vendorId === vid && x.phone === o.phone);
    if (!c) { c = { id: uid("c"), vendorId: vid, name: o.customer, phone: o.phone, source: o.own ? "O‘zi" : "CaterFlow", since: today() }; db.customers.push(c); }
    resetCache(); const bBefore = bonusLedger(vid).left;
    if (!db.sales.find(s => s.orderId === o.id)) db.sales.push({ id: uid("x"), vendorId: vid, date: o.date, customerId: c.id, customer: o.customer, source: o.own ? "O‘zi" : "CaterFlow", channel: o.own ? (o.channel || c.channel || "Telefon") : ((o.leadId && (LEAD(o.leadId) || {}).src) || c.channel || "sayt"), setId: q.setId, guests, pp: q.pp, orderId: o.id });
    resetCache(); const bAfter = bonusLedger(vid).left;
    if (bBefore > 0 && bAfter <= 0) { notify(vid, `Bonus tugadi — endi CaterFlow komissiyasi ${String(db.settings.commission).replace(".", ",")}% sizdan olinadi`, { view: "finance" }, { roles: ["owner"] }); log(vid, "xush kelibsiz bonusi tugadi"); }
    else if (bBefore >= 100000 && bAfter > 0 && bAfter < 100000) notify(vid, `Bonus qoldig‘i oz qoldi: ${som(bAfter)}`, { view: "finance" }, { roles: ["owner"] });
    if (o.own) hist(o, "Tadbir yakunlandi"); else { hist(o, `${V(vid).name}: yakunlandi`); (o.vlog = o.vlog || []).push({ at: Date.now(), vid, text: "Tadbir yakunlandi" }); }
    log(vid, `${o.id}: tadbir yakunlandi`); closeModal(); commit(); toast("Yakunlandi: sotuv moliyaga, mijoz bazaga yozildi");
    };
    if (fd.get("deduct")) { const pl = orderPlan(o, vid); pl.people = guests; pl.buffer = 0; const rows = planCalc(pl).rows, label = `${o.id}: ${guests} kishi`; guardOut(vid, rows, label, (rs, opt) => { rs.forEach(x => { x.expected = x.qty; }); applyOut(vid, rs, "order", opt, { orderId: o.id, note: label }); finish(); }); }
    else finish();
  },
  "own-order": (f, fd) => {
    const vid = ui.session.vendorId, lead = f.dataset.lead ? VLEAD(f.dataset.lead) : null;
    let c = fd.get("cust") !== "new" ? db.customers.find(x => x.id === fd.get("cust")) : null;
    if (!c) { const name = String(fd.get("name") || "").trim(); if (!name) { toast("Mijoz ismini kiriting"); return; } c = { id: uid("c"), vendorId: vid, name, phone: fd.get("phone") || "", source: "O‘zi", channel: fd.get("channel") || "Telefon", since: today() }; db.customers.push(c); }
    const id = "OZ-" + (101 + db.ownOrders.length);
    db.ownOrders.push({ id, own: true, vendorId: vid, customerId: c.id, customer: c.name, phone: c.phone, eventType: fd.get("eventType"), date: fd.get("date"), guests: +fd.get("guests"), budget: +fd.get("pp"), area: V(vid).region, venue: fd.get("venue"), notes: fd.get("notes"), channel: fd.get("channel") || "Telefon", status: "tasdiqlandi", quote: { setId: fd.get("setId"), pp: +fd.get("pp"), includes: [], note: "", at: Date.now() }, createdAt: Date.now(), history: [{ at: Date.now(), text: lead ? "Leaddan buyurtma yaratildi" : "Buyurtma qo‘shildi" }], vcheck: {}, vnotes: [] });
    reserveOrder(db.ownOrders[db.ownOrders.length - 1], vid);
    if (lead) { lead.orderId = id; lead.status = "kelishildi"; lead.updatedAt = Date.now(); lead.log.push({ at: Date.now(), text: `${id} buyurtmasi rasmiylashtirildi` }); }
    log(vid, `${id}: o‘z buyurtmasi qo‘shildi`); ui.modal = null; renderModal(); nav("vorder", id); toast(`${id} saqlandi. Tadbir kuni yakunlang — moliyaga yoziladi`);
  },
  "vo-note": (f, fd) => { const o = ORD(f.dataset.id); (o.vnotes = o.vnotes || []).push({ at: Date.now(), vid: ui.session.vendorId, text: fd.get("text") }); commit(); },
  payment: (f, fd) => { const v = V(f.dataset.id), amount = +fd.get("amount"); db.payments.push({ id: uid("pay"), vendorId: v.id, date: fd.get("date"), amount, method: fd.get("method"), note: fd.get("note") || "Komissiya to‘lovi" }); notify(v.id, `Komissiya to‘lovi qayd etildi: ${som(amount)}`, { view: "finance" }); log("admin", `${v.name}dan ${som(amount)} komissiya to‘lovi qayd etildi`); closeModal(); commit(); toast(`${v.name}: to‘lov saqlandi`); },
  feedback: (f, fd) => { db.feedback.push({ id: uid("f"), vendorId: f.dataset.vendor, setId: fd.get("setId"), author: shortName(fd.get("author")), rating: +fd.get("rating") || 5, text: fd.get("text"), at: Date.now(), via: f.dataset.via }); notify(f.dataset.vendor, `Yangi fikr: ${+fd.get("rating") || 5}★ — ${(SET(fd.get("setId")) || {}).name || ""}`, { view: "menu", tab: "feedback" }); log("mijoz", `${V(f.dataset.vendor).name} haqida fikr qoldirdi`); commit(); toast("Rahmat! Fikringiz vendor va adminga ko‘rinadi"); }
};

/* ---------- jonli hisob ---------- */
const LIVE = {
  quote: (f, e) => {
    const s = SET(f.setId.value), o = ORD(f.dataset.id);
    if (e && e.target.name === "setId") f.pp.value = s.price;
    const pp = +f.pp.value || 0, c = setCost(s), comG = pp * db.settings.commission / 100, bl = bonusLedger(ui.session.vendorId).left, bonTot = Math.min(bl, comG * o.guests), com = comG - (o.guests ? bonTot / o.guests : 0);
    const cp = $("#q-comp"); if (cp) cp.innerHTML = `${isSimple(s) ? "Menyu" : "Set"} tarkibi: ${setLines(s).map(l => esc(l.name)).join(", ")} · ${s.media.length} ta rasm/video${costKnown(s) ? "" : ` · <span class="warn-t">tannarx noma’lum — foyda taxminiy</span>`}`;
    const ck = costKnown(s); $("#q-live").innerHTML = money("Jami narx", som(pp * o.guests)) + money("Tannarx / kishi", ck ? som(c) : "noma’lum", ck ? "" : "warn") + money("Foyda / kishi (komissiyadan keyin)", ck ? som(pp - c - com) : "—", ck ? marginTone(margin(pp, c + com)) : "") + money("Byudjetga nisbatan", (pp > o.budget ? "+" : "") + pct((pp - o.budget) / o.budget), pp > o.budget ? "warn" : "good") + (bl > 0 ? money("Komissiya bonusdan", `${som(bonTot)} · qoldiq ${som(bl)}`, "good") : "");
  },
  purchase: (f, e) => {
    syncPurchase(); const m = ui.modal; let sum = 0, upN = 0;
    m.lines.forEach((l, k) => { const p = P(l.p), up = l.qty ? l.total / l.qty : 0, lp = lastP(p.id), el = f.querySelector(`[data-up="${k}"]`); sum += l.total; if (lp && up > lp * 1.001) upN++;
      if (e && e.target.name === "lp-" + k) { const inp = f.elements["lt-" + k]; inp.value = Math.round(lastP(p.id) * l.qty / 1000) * 1000; l.total = +inp.value; }
      if (el) el.innerHTML = up ? `${num(up)} / ${p.unit}${lp ? ` <span class="${up > lp * 1.001 ? "bad-t" : up < lp * 0.999 ? "good-t" : "faint"}">${up > lp ? "▲" : up < lp ? "▼" : ""}${pct(Math.abs(up - lp) / lp)}</span>` : ""}` : "—"; });
    $("#pu-live").innerHTML = money("Jami summa", som(m.lines.reduce((a, l) => a + l.total, 0))) + money("Mahsulotlar", m.lines.length + " xil") + money("Narxi oshgan", upN ? upN + " ta" : "yo‘q", upN ? "warn" : "good");
  },
  adjust: f => { const p = P(f.elements.pid.value), q = +f.elements.qty.value || 0, d = q - p.stock; $("#ad-live").innerHTML = money("Tizimda", fmtQty(p, p.stock)) + money("Haqiqiy", fmtQty(p, q)) + money("Farq", (d >= 0 ? "+" : "−") + fmtQty(p, Math.abs(d)), Math.abs(d) < 0.05 ? "good" : "warn") + money("Farq qiymati", som(Math.abs(d) * avgP(p.id))); },
  set: f => {
    const vid = ui.session.vendorId; let c = 0;
    db.dishes.filter(d => d.vendorId === vid).forEach(d => { c += dishCost(d) * (+f.elements["n-" + d.id].value || 0); });
    const pr = +f.price.value || 0, mg = margin(pr, c);
    $("#st-live").innerHTML = money("Tannarx / kishi", som(c)) + money("Foyda / kishi", som(pr - c)) + money("Marja", pct(mg), marginTone(mg));
  },
  dish: f => {
    syncDish(); const d = ui.modal.draft; let c = 0;
    d.ing.forEach((i, k) => { const v = ingCost(i); c += v; const el = f.querySelector(`[data-ic="${k}"]`); if (el) el.textContent = num(v); });
    const mg = margin(d.price, c);
    const lv = (d.versions || [])[(d.versions || []).length - 1];
    $("#ds-live").innerHTML = money("Tannarx / porsiya", som(c)) + money("Sotuv narxi", som(d.price)) + money("Marja", pct(mg), marginTone(mg)) + (lv && lv.cost ? money("Oxirgi versiyada", som(lv.cost) + ` (${c >= lv.cost ? "+" : "−"}${pct(Math.abs(c - lv.cost) / lv.cost)})`) : "");
  },
  ownorder: (f, e) => { const s = SET(f.elements.setId.value); if (!s) return; if (e && e.target.name === "setId") f.elements.pp.value = s.price; const old = f.elements.cust.value !== "new"; f.elements["name"].disabled = old; f.elements.phone.disabled = old; const pp = +f.elements.pp.value || 0, g = +f.elements.guests.value || 0, c = setCost(s); $("#oo-live").innerHTML = money("Jami", som(pp * g)) + money("Tannarx", som(c * g)) + money("Yalpi foyda", som((pp - c) * g), marginTone(margin(pp, c))); },
  waste: f => { const p = P(f.elements.pid.value), q = +f.elements.qty.value || 0; $("#ws-live").innerHTML = money("Omborda", fmtQty(p, p.stock)) + money("Chiqindi qiymati", som(q * avgP(p.id)), "bad") + money("Qoladi", fmtQty(p, Math.max(0, p.stock - q))); },
  newprod: (f, e) => { if (!e || e.target.name !== "mid") return; const m = MST(f.elements.mid.value); if (!m) return; if (!f.elements["name"].value) f.elements["name"].value = m.name; f.elements.unit.value = m.unit; if (f.elements.cat) f.elements.cat.value = m.cat; },
  calc: f => { $("#fc-out").innerHTML = calcOut(f.setId.value, +f.guests.value || 0, +f.pp.value || 0); },
  plan: f => { const pl = ui.plan, fd = new FormData(f); pl.people = Math.max(0, +fd.get("people") || 0); pl.buffer = Math.max(0, +fd.get("buffer") || 0); pl.items.forEach((it, k) => { it.on = fd.get("on-" + k) === "on"; it.n = Math.max(0, +fd.get("n-" + k) || 0); const el = f.querySelector(`[data-pp="${k}"]`); if (el) el.textContent = num(dishCost(D(it.d)) * it.n); }); $("#plan-out").innerHTML = planOut(pl, ui.session.role === "admin"); }
};

/* ---------- select va boshqa o‘zgarishlar ---------- */
const CHANGE = {
  "switch-role": el => { const v = el.value; if (v === "pub") { ui.session = null; nav("p-home"); return; } if (CLI(v)) { ui.session = { role: "client", clientId: v }; ui.lang = CLI(v).lang || ui.lang; nav("c-orders"); return; } const x = STF(v); ui.session = v === "admin" ? { role: "admin", vendorId: null, staffId: null } : { role: "vendor", vendorId: x.vendorId, staffId: x.id }; ui.plan = null; ui.taskF = null; nav(v === "admin" ? "dash" : homeView()); toast(v === "admin" ? "CaterFlow admin sifatida" : `${x.name} · ${VROLES[x.role].name}`); },
  "staff-role": el => { const x = STF(el.dataset.id); x.role = el.value; notify(x.vendorId, `Rolingiz o‘zgardi: ${VROLES[x.role].name}`, { view: "tasks" }, { to: x.id }); commit(); toast(`${x.name}: ${VROLES[x.role].name}`); },
  "k-src": el => { const d = ui.kDate || today(); ui.kOff = ui.kOff || {}; ui.kOff[d] = ui.kOff[d] || {}; ui.kOff[d][el.dataset.k] = !el.checked; render(); },
  "k-done": el => { db.kdone = db.kdone || {}; db.kdone[`${ui.session.vendorId}|${ui.kDate || today()}|${el.dataset.k}`] = el.checked; commit(); },
  "k-date-in": el => { ui.kDate = el.value || today(); render(); },
  "ca-v": el => { ui.caV = el.value; render(); },
  "fb-v": el => { ui.fbV = el.value; render(); },
  "mv-v": el => { ui.mvV = el.value; render(); },
  "mv-type": el => { ui.mvType = el.value; render(); },
  "mv-sus": el => { ui.mvSus = el.checked; render(); },
  "al-type": el => { ui.alType = el.value; render(); },
  "p-mst": el => { ui.pMst = el.value; render(); },
  "au-v": el => { ui.auV = el.value; render(); },
  "inv-set": el => { const k = el.dataset.key, b = invS()[k]; invS()[k] = el.checked; audit({ vendorId: null, action: "Ombor sozlamasi o‘zgartirildi", target: k, before: String(b), after: String(el.checked), reason: "" }); commit(); toast("Saqlandi"); },
  "inv-num": el => { const k = el.dataset.key, b = invS()[k]; invS()[k] = Math.max(0, +el.value || 0); audit({ vendorId: null, action: "Ombor sozlamasi o‘zgartirildi", target: k, before: String(b), after: String(invS()[k]), reason: "" }); commit(); toast("Saqlandi"); },
  perm: el => { const r = el.dataset.role, v = el.dataset.view; db.settings.perm = db.settings.perm || {}; const cur = new Set(roleViews(r)); if (el.checked) cur.add(v); else cur.delete(v); if (v === "vorders") { if (el.checked) cur.add("vorder"); else cur.delete("vorder"); } db.settings.perm[r] = [...cur]; audit({ vendorId: null, action: "Vendor roli ruxsati o‘zgartirildi", target: `${VROLES[r].name}: ${v}`, before: el.checked ? "yopiq" : "ochiq", after: el.checked ? "ochiq" : "yopiq", reason: "" }); commit(); toast(`${VROLES[r].name}: ${el.checked ? "ruxsat berildi" : "yopildi"}`); },
  "icat-name": el => { const c = db.icats.find(x => x.id === el.dataset.id), old = c.name, nw = el.value.trim(); if (!nw || nw === old) return; c.name = nw; db.ingredients.forEach(m => { if (m.cat === old) m.cat = nw; }); db.products.forEach(p => { if (p.cat === old) p.cat = nw; }); audit({ vendorId: null, action: "Kategoriya nomi o‘zgartirildi", target: nw, before: old, after: nw, reason: "" }); commit(); toast("Saqlandi"); },
  "icat-active": el => { const c = db.icats.find(x => x.id === el.dataset.id); c.active = el.checked; audit({ vendorId: null, action: el.checked ? "Kategoriya yoqildi" : "Kategoriya o‘chirildi", target: c.name, before: "", after: "", reason: "" }); commit(); },
  "unit-factor": el => { const u = db.units.find(x => x.id === el.dataset.id), b = u.factor; u.factor = Math.max(1, +el.value || 1); audit({ vendorId: null, action: "Birlik konversiyasi o‘zgartirildi", target: u.id, before: `1 ${u.id} = ${b} ${u.base}`, after: `1 ${u.id} = ${u.factor} ${u.base}`, reason: "" }); commit(); toast("Saqlandi"); },
  "unit-active": el => { const u = db.units.find(x => x.id === el.dataset.id); u.active = el.checked; commit(); },
  "k-buf": el => { ui.kBuf = Math.max(0, +el.value || 0); render(); },
  "r-por": el => { ui.rPor = Math.max(1, +el.value || 1); render(); },
  "vorder-status": el => {
    const o = ORD(el.dataset.id), st = el.value, vid = o.vendorId; o.status = st; hist(o, `${V(vid).name}: ${ORD_ST[st][0]}`); log(vid, `${o.id}: ${ORD_ST[st][0]}`);
    if (st === "yakunlandi") {
      const q = orderQuote(o); let c = db.customers.find(x => x.vendorId === vid && x.phone === o.phone);
      if (!c) { c = { id: uid("c"), vendorId: vid, name: o.customer, phone: o.phone, source: "CaterFlow", since: today() }; db.customers.push(c); }
      if (q && !db.sales.find(s => s.orderId === o.id)) db.sales.push({ id: uid("x"), vendorId: vid, date: o.date > today() ? today() : o.date, customerId: c.id, customer: o.customer, source: "CaterFlow", setId: q.setId, guests: o.guests, pp: q.pp, orderId: o.id });
      toast("Yakunlandi: sotuv moliyaga, mijoz bazaga yozildi");
    } else toast(`${o.id}: ${ORD_ST[st][0]}`);
    commit();
  },
  "vl-st": el => { const l = VLEAD(el.dataset.id); l.status = el.value; l.updatedAt = Date.now(); l.log.push({ at: Date.now(), text: `Holat: ${VL_ST[l.status][0]}` }); log(l.vendorId, `“${l.name}” leadini ${VL_ST[l.status][0]} holatiga o‘tkazdi`); commit(); if (l.status === "kelishildi" && !l.orderId) { openModal({ type: "ownOrder", leadId: l.id, wide: true }); toast("Kelishildi! Endi buyurtmani rasmiylashtiring"); } else toast("Holat yangilandi, admin ko‘radi"); },
  "vo-check": el => { const o = ORD(el.dataset.id); (o.vcheck = o.vcheck || {})[el.dataset.i] = el.checked; commit(); },
  "st-src": el => { stState().src = el.value; render(); },
  "st-set": el => { stState().set = el.value; render(); },
  "st-from": el => { stState().from = el.value; render(); },
  "st-to": el => { stState().to = el.value; render(); },
  "vl-vendor": el => { ui.vlVendor = el.value; render(); },
  "vl-status": el => { ui.vlStatus = el.value; render(); },
  setting: el => { db.settings[el.dataset.key] = el.checked; commit(); toast("Saqlandi"); },
  "setting-num": el => { db.settings[el.dataset.key] = Math.max(0, +el.value || 0); commit(); toast("Komissiya saqlandi"); },
  rule: el => { const v = V(el.dataset.id), k = el.dataset.key; if (k === "closedReason" || k === "closedUntil") v[k] = el.value; else v.rules[k] = Math.max(0, +el.value || 0); log("admin", `${v.name} qoidalarini o‘zgartirdi`); commit(); toast(`${v.name}: saqlandi`); },
  "rule-area": el => { const v = V(el.dataset.id), a = el.dataset.area; v.rules.areas = el.checked ? [...new Set([...v.rules.areas, a])] : v.rules.areas.filter(x => x !== a); commit(); toast(`${v.name}: hududlar saqlandi`); },
  "rule-closed": el => { const v = V(el.dataset.id); v.closed = el.checked; if (v.closed && !v.closedReason) v.closedReason = "Vaqtincha band"; if (v.closed && !v.closedUntil) v.closedUntil = dAdd(7); notify(v.id, v.closed ? `Admin sizni vaqtincha yopdi: ${v.closedReason}. Yangi so‘rovlar avtomatik rad etiladi.` : "Siz qayta ochildingiz — yangi so‘rovlar keladi", { view: "vdash" }); log("admin", v.closed ? `${v.name}ni vaqtincha yopdi` : `${v.name}ni qayta ochdi`); commit(); toast(v.closed ? `${v.name} yopildi — yangi so‘rovlar avtomatik rad etiladi` : `${v.name} qayta ochildi`); },
  "media-upload": el => addMedia(SET(el.dataset.set), [...el.files]),
  "receipt-file": el => setReceipt([...el.files]),
  "week-add": el => { if (!el.value) return; const w = db.weekMenus[ui.session.vendorId][el.dataset.day]; w.dishes.push(el.value); commit(); },
  "week-people": el => { db.weekMenus[ui.session.vendorId][el.dataset.day].people = Math.max(0, +el.value || 0); commit(); toast("Kishi soni saqlandi"); },
  "af-region": el => { ui.afRegion = el.value; render(); }
};

/* ---------- hodisalar ---------- */
document.addEventListener("click", e => { const el = e.target.closest("[data-act]"); if (!el) return; const fn = ACT[el.dataset.act]; if (fn) fn(el, e); });
document.addEventListener("submit", e => { const f = e.target.closest("form[data-form]"); if (!f) return; e.preventDefault(); const fn = FORMS[f.dataset.form]; if (fn) fn(f, new FormData(f)); });
document.addEventListener("input", e => {
  if (e.target.matches && e.target.matches("[data-search]")) { const q = e.target.value.trim().toLowerCase(), t = document.getElementById(e.target.dataset.search); if (!t) return; let grp = null, any = false; [...t.tBodies[0].rows].forEach(r => { if (r.classList.contains("grp")) { if (grp) grp.hidden = !any; grp = r; any = false; return; } const show = !q || (r.dataset.name || "").includes(q); r.hidden = !show; if (show) any = true; }); if (grp) grp.hidden = !any; return; }
  const f = e.target.closest("form[data-live]"); if (f && LIVE[f.dataset.live]) LIVE[f.dataset.live](f, e);
});
document.addEventListener("change", e => {
  const el = e.target.closest("[data-change]"); if (el && CHANGE[el.dataset.change]) { CHANGE[el.dataset.change](el, e); return; }
  const f = e.target.closest("form[data-live]"); if (f && LIVE[f.dataset.live]) LIVE[f.dataset.live](f, e);
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && ui.modal) closeModal(); if (e.key === "Enter" && e.target.matches && e.target.matches("[data-gsearch]")) { e.preventDefault(); openModal({ type: "gsearch", q: e.target.value, wide: true, noFocus: true }); } });
document.addEventListener("mouseover", e => { const t = e.target.closest && e.target.closest("[data-tip]"); const tip = tipEl(); if (!t) { tip.classList.remove("show"); return; } tip.textContent = t.getAttribute("data-tip"); tip.classList.add("show"); });
document.addEventListener("mousemove", e => { const tip = tipEl(); if (!tip.classList.contains("show")) return; const w = tip.offsetWidth; let x = e.clientX + 14; if (x + w > window.innerWidth - 8) x = e.clientX - w - 14; tip.style.left = Math.max(8, x) + "px"; tip.style.top = (e.clientY + 16) + "px"; });

/* ---------- drag & drop ---------- */
function addMedia(s, files) {
  const ok = files.filter(f => /^(image|video)\//.test(f.type));
  if (!ok.length) { toast("Faqat rasm yoki video yuklash mumkin"); return; }
  ok.forEach((f, i) => s.media.push({ id: uid("m"), t: f.type.startsWith("video") ? "video" : "photo", label: f.name.replace(/\.[^.]+$/, ""), tone: (s.media.length + i) % 6, src: URL.createObjectURL(f) }));
  log(s.vendorId, `“${s.name}” setiga ${ok.length} ta media qo‘shdi`); commit(); toast(`${ok.length} ta fayl qo‘shildi${ok.length < files.length ? `, ${files.length - ok.length} tasi rasm/video emas` : ""} (prototipda sahifa yangilansa o‘chadi)`);
}
function setReceipt(files) {
  const f = files.find(x => x.type.startsWith("image/")); if (!f) { toast("Chek uchun rasm fayl tanlang"); return; }
  if (!ui.modal) return; ui.modal.receipt = { src: URL.createObjectURL(f), name: f.name }; $("#pu-rc").innerHTML = receiptPreview(ui.modal.receipt);
}
const DROP = { "set-media": (z, files) => addMedia(SET(z.dataset.set), files), receipt: (z, files) => setReceipt(files) };
const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
document.addEventListener("dragover", e => {
  if (!hasFiles(e)) return; e.preventDefault();
  const z = e.target.closest && e.target.closest("[data-drop]");
  document.querySelectorAll("[data-drop].over").forEach(x => { if (x !== z) x.classList.remove("over"); });
  if (z) { z.classList.add("over"); e.dataTransfer.dropEffect = "copy"; } else e.dataTransfer.dropEffect = "none";
});
document.addEventListener("dragleave", e => { const z = e.target.closest && e.target.closest("[data-drop]"); if (z && !z.contains(e.relatedTarget)) z.classList.remove("over"); });
document.addEventListener("drop", e => {
  if (!hasFiles(e)) return; e.preventDefault();
  const z = e.target.closest && e.target.closest("[data-drop]");
  document.querySelectorAll("[data-drop].over").forEach(x => x.classList.remove("over"));
  if (z && DROP[z.dataset.drop]) DROP[z.dataset.drop](z, [...e.dataTransfer.files]);
});

function invInit() {
  if (db.resInit) return;
  liveOrders().forEach(o => { if (o.id !== "OZ-102") reserveOrder(o, o.vendorId, true); });
  const oz = db.ownOrders.find(o => o.id === "OZ-099"); if (oz) reserveOrder(oz, oz.vendorId, true);
  db.sales.filter(s => s.date >= dAdd(-14)).forEach(s => { const set = SET(s.setId); if (!set) return; const need = {}; set.items.forEach(it => { const d = D(it.d); if (d) d.ing.forEach(g => { need[g.p] = (need[g.p] || 0) + g.q * it.n * s.guests; }); }); const by = (db.staff.find(x => x.vendorId === s.vendorId && x.role === "store") || db.staff.find(x => x.vendorId === s.vendorId && x.role === "owner") || {}).id; Object.entries(need).forEach(([pid, q], k) => { const p = P(pid); if (!p) return; const ex = isMass(p.unit) ? q / 1000 : q, f = 1 + (((k * 7 + s.guests) % 15) - 4) / 100; db.moves.push({ id: uid("mv"), vendorId: s.vendorId, productId: pid, date: s.date, at: new Date(s.date + "T15:00").getTime(), qty: Math.round(ex * f * 10) / 10, expected: Math.round(ex * 10) / 10, type: "order", orderId: s.orderId || null, note: `Tadbir: ${s.customer}`, by }); }); });
  db.resInit = true;
}
function postLoad() { resetCache(); invInit(); db.dishes.forEach(d => (d.versions || []).forEach(v => { if (v.cost == null) { v.cost = Math.round(dishCost(d) * (v.f || 1)); delete v.f; } })); db.vendors.forEach(v => ensureMonthlyReview(v.id)); }
