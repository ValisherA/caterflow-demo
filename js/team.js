/* CaterFlow prototip — vendor jamoasi: rollar, ruxsatlar, xodimlar, vazifalar */
"use strict";
const VROLES = {
  owner: { name: "Rahbar", tone: "accent", desc: "Hamma bo‘limlar, moliya, jamoa va vazifalar", views: ["vdash", "vorders", "vorder", "tasks", "kitchen", "recipes", "myleads", "customers", "menu", "stock", "finance", "stats", "team"] },
  manager: { name: "Menejer", tone: "info", desc: "Buyurtmalar, leadlar, mijozlar, menyu va oshxona rejasi. Moliya va statistikani ko‘rmaydi", views: ["vdash", "vorders", "vorder", "tasks", "kitchen", "recipes", "myleads", "customers", "menu"] },
  store: { name: "Omborchi", tone: "saffron", desc: "Ombor, kirim-chiqim, xarid ro‘yxati va oshxonaga berish. Daromad va mijozlarni ko‘rmaydi", views: ["sdash", "stock", "tasks"] },
  cook: { name: "Oshpaz", tone: "good", desc: "Kunlik ish: necha kishiga, qaysi taom, qancha masalliq va texkartalar. Pul summalarini ko‘rmaydi", views: ["kitchen", "recipes", "tasks"] },
  acct: { name: "Hisobchi", tone: "ig", desc: "Moliya, statistika, xaridlar va ombor qiymati. Omborni o‘zgartirmaydi", views: ["finance", "stats", "stock", "tasks"] }
};
const ROLE_ORDER = ["owner", "manager", "store", "cook", "acct"];
const PRIO = { oddiy: ["Oddiy", "neutral"], muhim: ["Muhim", "saffron"], shosh: ["Shoshilinch", "bad"] };
const TASK_ST = { yangi: ["Yangi", "info"], jarayonda: ["Jarayonda", "saffron"], bajarildi: ["Bajarildi", "good"] };
const ROLE_SECTIONS = [["Holat paneli", "vdash"], ["Buyurtmalar va takliflar", "vorders"], ["Oshxona: kunlik reja", "kitchen"], ["Texkartalar", "recipes"], ["Leadlar va mijozlar", "myleads"], ["Menyu va setlar", "menu"], ["Ombor va kirim-chiqim", "stock"], ["Ombor holati (omborchi sahifasi)", "sdash"], ["Moliya (P&L)", "finance"], ["Statistika", "stats"], ["Jamoa", "team"], ["Vazifalar", "tasks"]];

/* ---------- joriy foydalanuvchi ---------- */
function me() { const s = ui.session; if (!s || s.role !== "vendor") return null; return db.staff.find(x => x.id === s.staffId) || db.staff.find(x => x.vendorId === s.vendorId && x.role === "owner"); }
const myRole = () => (me() || { role: "owner" }).role;
function roleViews(r) { if (r === "owner") return VROLES.owner.views; const o = db.settings.perm && db.settings.perm[r]; return o || VROLES[r].views; }
const can = view => roleViews(myRole()).includes(view);
const seesMoney = () => myRole() === "owner";
const seesPrices = () => myRole() !== "cook";
const homeView = () => { const pref = ({ owner: "vdash", manager: "vdash", store: "sdash", cook: "kitchen", acct: "finance" })[myRole()]; return can(pref) ? pref : (roleViews(myRole())[0] || "tasks"); };
const staffOf = vid => db.staff.filter(x => x.vendorId === vid && x.active !== false);
const STF = id => db.staff.find(x => x.id === id);
const initials = n => String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const avatar = s => `<span class="ava t-${VROLES[s.role].tone}" title="${esc(s.name)} · ${VROLES[s.role].name}">${esc(initials(s.name))}</span>`;
const rolePill = r => `<span class="pill t-${VROLES[r].tone}">${VROLES[r].name}</span>`;
function byName(by) { if (by === "admin") return "CaterFlow admin"; if (by === "system") return "CaterFlow tizimi"; const s = STF(by); return s ? s.name : "—"; }

/* ---------- Jamoa ---------- */
function vTeam(vid) {
  const st = staffOf(vid);
  const rows = st.map(s => { const open = db.tasks.filter(t => t.to === s.id && t.status !== "bajarildi").length; return `<tr><td><span class="row">${avatar(s)}<span><strong>${esc(s.name)}</strong><small>${esc(s.phone || "")}</small></span></span></td><td>${s.role === "owner" ? rolePill("owner") : `<select data-change="staff-role" data-id="${s.id}" aria-label="${esc(s.name)} roli">${ROLE_ORDER.filter(r => r !== "owner").map(r => opt(r, VROLES[r].name, s.role)).join("")}</select>`}</td><td class="mono">${esc(s.login)}</td><td><span class="pass-view"><input type="password" value="${esc(s.pass)}" readonly id="pw-${s.id}" aria-label="${esc(s.name)} paroli"><button type="button" class="eye" data-act="toggle-pass" data-target="pw-${s.id}" aria-label="Parolni ko‘rsatish" aria-pressed="false">${ic("eye", 16)}</button></span></td><td class="num r">${open}</td><td>${s.role === "owner" ? "" : `<div class="row nowrap"><button type="button" class="btn btn-sm" data-act="task-new" data-to="${s.id}">Vazifa berish</button><button type="button" class="icon-btn" data-act="staff-off" data-id="${s.id}" aria-label="${esc(s.name)}ni o‘chirish">${ic("trash", 16)}</button></div>`}</td></tr>`; }).join("");
  const matrix = `<div class="tbl"><table><thead><tr><th>Bo‘lim</th>${ROLE_ORDER.map(r => `<th class="r">${VROLES[r].name}</th>`).join("")}</tr></thead><tbody>${ROLE_SECTIONS.map(([l, v]) => `<tr><td>${l}</td>${ROLE_ORDER.map(r => `<td class="r">${roleViews(r).includes(v) ? `<span class="good-t">${ic("check", 16)}</span>` : `<span class="faint">—</span>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return page(head("Jamoa", "Har bir xodim o‘z login-paroli bilan kiradi va faqat o‘z roliga tegishli bo‘limlarni ko‘radi.", `<button class="btn btn-primary" data-act="staff-new">${ic("plus", 16)} Xodim qo‘shish</button>`),
    `<div class="tbl"><table><thead><tr><th>Xodim</th><th>Rol</th><th>Login</th><th>Parol</th><th class="r">Ochiq vazifalar</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="g g-2"><section class="card"><div class="card-h"><h2>Rollar</h2></div><div class="stack-s">${ROLE_ORDER.map(r => `<div class="row">${rolePill(r)}<span class="small muted grow">${VROLES[r].desc}</span></div>`).join("")}</div></section>
    <section class="card"><div class="card-h"><h2>Kim nimani ko‘radi</h2></div>${matrix}</section></div>`);
}
MODALS.staff = () => mHead("Xodim qo‘shish", "Xodim o‘z login-paroli bilan kiradi") + `<form data-form="staff"><div class="m-body">
  <div class="f-grid"><div class="field"><label for="sf-n">Ism familiya</label><input id="sf-n" name="name" required></div><div class="field"><label for="sf-p">Telefon</label><input id="sf-p" name="phone" type="tel" placeholder="+998 __ ___ __ __"></div></div>
  <div class="field"><span class="lbl">Rol</span><div class="stack-s">${ROLE_ORDER.filter(r => r !== "owner").map((r, i) => `<label class="vrow"><input type="radio" name="role" value="${r}" ${i === 1 ? "checked" : ""}><span class="grow"><strong>${VROLES[r].name}</strong><span class="block small muted">${VROLES[r].desc}</span></span></label>`).join("")}</div></div>
  <div class="f-grid"><div class="field"><label for="sf-l">Login</label><input id="sf-l" name="login" required autocomplete="off"></div><div class="field"><label for="sf-pw">Parol</label><div class="pass-wrap"><input id="sf-pw" name="pass" type="password" required autocomplete="new-password" value="${Math.random().toString(36).slice(2, 10)}"><button type="button" class="eye" data-act="toggle-pass" data-target="sf-pw" aria-label="Parolni ko‘rsatish" aria-pressed="false">${ic("eye")}</button></div></div></div>
  <p class="tiny muted">Parol avtomatik yaratildi — ko‘z belgisini bosib ko‘ring va xodimga bering. Haqiqiy tizimda parol shifrlangan saqlanadi.</p>
</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Qo‘shish</button></footer></form>`;

/* ---------- Vazifalar ---------- */
function tasksFor(vid) { return db.tasks.filter(t => t.vendorId === vid); }
function vTasksPage(vid) {
  const m = me(), boss = ["owner", "manager"].includes(m.role), f = ui.taskF || (boss ? "all" : "mine");
  let list = tasksFor(vid);
  if (f === "mine") list = list.filter(t => t.to === m.id); else if (f === "byme") list = list.filter(t => t.by === m.id); else if (f.startsWith("u:")) list = list.filter(t => t.to === f.slice(2));
  const col = st => { const ts = list.filter(t => t.status === st).sort((a, b) => (a.due || "9").localeCompare(b.due || "9")); return `<div class="kcol"><div class="kcol-h">${pill(TASK_ST, st)}<span class="faint num small">${ts.length}</span></div>${ts.map(taskCard).join("") || `<p class="tiny faint">Bo‘sh</p>`}</div>`; };
  const opts = boss ? [["all", "Hammasi"], ["mine", "Menga berilgan"], ["byme", "Men bergan"], ...staffOf(vid).filter(s => s.id !== m.id).map(s => ["u:" + s.id, s.name])] : [["mine", "Mening vazifalarim"], ["byme", "Men bergan"]];
  return page(head(boss ? "Vazifalar" : "Mening vazifalarim", boss ? "Xodimlarga vazifa bering — ularga darhol bildirishnoma boradi. Bajarilganda sizga xabar keladi." : "Sizga berilgan vazifalar. Boshlaganingizda va bajarganingizda rahbaringiz ko‘radi.", `<button class="btn btn-primary" data-act="task-new">${ic("plus", 16)} ${boss ? "Vazifa berish" : "So‘rov yuborish"}</button>`),
    chips(opts.map(([k, l]) => [k, l]), f, "task-f") + `<div class="kanban tasks-board">${["yangi", "jarayonda", "bajarildi"].map(col).join("")}</div>`);
}
function taskCard(t) {
  const to = STF(t.to), m = me(), mine = m && t.to === m.id, boss = m && ["owner", "manager"].includes(m.role);
  const next = t.status === "yangi" ? ["jarayonda", "Boshlash"] : t.status === "jarayonda" ? ["bajarildi", "Bajarildi"] : null;
  return `<div class="lcard tcard" data-act="task-open" data-id="${t.id}" role="button" tabindex="0"><span class="top"><strong>${esc(t.title)}</strong>${pill(PRIO, t.prio)}</span>
    ${t.note ? `<span class="msg">${esc(t.note)}</span>` : ""}
    <span class="row between"><span class="row small">${to ? avatar(to) : ""}<span class="muted">${to ? esc(to.name) : "—"}</span></span>${t.due ? (t.status === "bajarildi" ? `<span class="tiny faint">${fDate(t.due)}</span>` : duePill(t.due)) : ""}</span>
    <span class="row between tiny faint"><span>${esc(byName(t.by))} · ${ago(t.at)}${(t.comments || []).length ? ` · ${t.comments.length} izoh` : ""}</span>${next && (mine || boss) ? `<button type="button" class="btn btn-sm ${next[0] === "bajarildi" ? "btn-primary" : ""}" data-act="task-st" data-id="${t.id}" data-st="${next[0]}">${next[1]}</button>` : ""}</span></div>`;
}
MODALS.task = m => {
  const vid = m.vid || ui.session.vendorId, isAdmin = ui.session.role === "admin", mm = me(), boss = isAdmin || (mm && ["owner", "manager"].includes(mm.role));
  let targets = staffOf(vid).filter(s => isAdmin || s.id !== mm.id);
  if (!boss) targets = targets.filter(s => ["owner", "manager", "store"].includes(s.role));
  const sel = m.to || (targets.find(s => s.role === (m.role || "")) || targets[0] || {}).id;
  const orders = vItems(vid).filter(x => ["confirmed", "prep", "new", "quoted"].includes(x.stage)).map(x => x.o);
  return mHead(isAdmin ? `${esc(V(vid).name)}ga vazifa` : boss ? "Vazifa berish" : "So‘rov yuborish", "Xodimga darhol bildirishnoma boradi") + `<form data-form="task" data-vid="${vid}"><div class="m-body">
    <div class="f-grid"><div class="field"><label for="tk-to">Kimga</label><select id="tk-to" name="to">${targets.map(s => opt(s.id, `${s.name} — ${VROLES[s.role].name}`, sel)).join("")}</select></div><div class="field"><label for="tk-d">Muddat</label><input id="tk-d" name="due" type="date" value="${m.due || dAdd(1)}"></div><div class="field"><label for="tk-p">Muhimlik</label><select id="tk-p" name="prio">${Object.keys(PRIO).map(k => opt(k, PRIO[k][0], m.prio || "oddiy")).join("")}</select></div></div>
    <div class="field"><label for="tk-t">Vazifa</label><input id="tk-t" name="title" required value="${esc(m.title || "")}" placeholder="Masalan: ertangi to‘y uchun 15 kg guruch olish"></div>
    <div class="field"><label for="tk-n">Batafsil</label><textarea id="tk-n" name="note" placeholder="Ixtiyoriy">${esc(m.note || "")}</textarea></div>
    ${orders.length && !isAdmin ? `<div class="field"><label for="tk-o">Buyurtmaga bog‘lash</label><select id="tk-o" name="order">${opt("", "Bog‘lanmagan")}${orders.map(o => opt(o.id, `${o.id} · ${o.eventType}, ${o.guests} kishi, ${fDate(o.date)}`, m.order)).join("")}</select></div>` : ""}
    ${m.linkView ? `<input type="hidden" name="linkView" value="${m.linkView}">` : ""}
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">${ic("send", 16)} Yuborish</button></footer></form>`;
};
MODALS.taskView = m => {
  const t = db.tasks.find(x => x.id === m.id), to = STF(t.to), mm = me(), isAdmin = ui.session.role === "admin", mine = mm && t.to === mm.id, boss = isAdmin || (mm && ["owner", "manager"].includes(mm.role));
  const btns = [];
  if (mine || boss) { if (t.status === "yangi") btns.push(["jarayonda", "Boshlash", ""]); if (t.status !== "bajarildi") btns.push(["bajarildi", "Bajarildi", "btn-primary"]); else btns.push(["yangi", "Qayta ochish", ""]); }
  return mHead(esc(t.title), `${pill(PRIO, t.prio)} ${pill(TASK_ST, t.status)}`) + `<div class="m-body">
    <div class="facts">${fact("Kimga", to ? `${esc(to.name)} · ${VROLES[to.role].name}` : "—")}${fact("Kim berdi", esc(byName(t.by)))}${fact("Muddat", t.due ? fDateY(t.due) : "—")}${fact("Berilgan", ago(t.at))}</div>
    ${t.note ? `<p class="pre">${esc(t.note)}</p>` : ""}
    ${t.link ? `<button type="button" class="btn btn-sm" data-act="task-link" data-id="${t.id}">${ic("link", 16)} ${t.link.param ? esc(t.link.param) : "Bog‘langan sahifa"} ni ochish</button>` : ""}
    <div><span class="lbl">Izohlar</span>${(t.comments || []).map(c => `<div class="fb"><span class="tiny faint">${esc(byName(c.by))} · ${fDT(c.at)}</span><p class="small">${esc(c.text)}</p></div>`).join("") || `<p class="small faint">Izoh yo‘q</p>`}
    <form data-form="task-cm" data-id="${t.id}" class="row" style="margin-top:8px"><input name="text" class="grow" placeholder="Izoh yozing" aria-label="Izoh" required><button class="btn" type="submit">Yuborish</button></form></div>
  </div><footer class="m-foot">${btns.map(([st, l, c]) => `<button type="button" class="btn ${c}" data-act="task-st" data-id="${t.id}" data-st="${st}">${l}</button>`).join("")}<button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};
function setTaskStatus(t, st) {
  const by = ui.session.role === "admin" ? "admin" : me().id;
  t.status = st; if (st === "bajarildi") t.doneAt = Date.now();
  (t.comments = t.comments || []).push({ at: Date.now(), by, text: `Holat: ${TASK_ST[st][0]}` });
  if (by !== t.by && t.by !== "admin") notify(t.vendorId, `${byName(by)}: “${t.title}” — ${TASK_ST[st][0].toLowerCase()}`, { view: "tasks" }, { to: t.by });
  if (t.by === "admin" && st === "bajarildi") log(t.vendorId, `CaterFlow vazifasini bajardi: ${t.title}`);
}
