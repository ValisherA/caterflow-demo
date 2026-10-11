/* CaterFlow mijoz sayti — sahifalarni chizish va ishga tushirish */
"use strict";
function pOffer(token) { const o = db.orders.find(x => x.token && x.token === token); return `<section class="section-sm"><div class="wrap stack">${orderView(o, "guest")}</div></section>`; }
function render() {
  const p = RT.path[0] || "", app = document.getElementById("app");
  if (p === "rsvp") { app.innerHTML = pRSVP(RT.path[1]) + footer(); renderAI(); return; }
  if (p === "share") { app.innerHTML = pShare(RT.path[1]) + footer(); renderAI(); return; }
  if (!document.querySelector(".ai, .ai-fab")) renderAI();
  S.cartPop = S.cartPop && Date.now() - S.cartPop < 900 ? S.cartPop : 0;
  const pages = { tasdiq: () => pConfirm(RT.path[1]), "": pHome, login: pHome, catering: pCatalog, v: () => pVendor(RT.path[1], RT.path[2]), yigish: pBuildPick, ijara: pRentals, savat: pCart, sorov: pRFQ, menejer: pManagers, korporativ: pCorporate, kabinet: pCabinet, offer: () => pOffer(RT.path[1]) };
  const ae = document.activeElement, fid = ae && ae.id && app.contains(ae) ? ae.id : null, sel = fid && ae.setSelectionRange && ["text", "search", "tel"].includes(ae.type) ? [ae.selectionStart, ae.selectionEnd] : null;
  const showBar = cartCount() > 0 && !["savat", "kabinet", "tasdiq"].includes(p) && !(p === "v" && RT.path[2] === "yigish");
  app.innerHTML = header() + `<main id="main">${(pages[p] || pNotFound)()}</main>` + footer() + (showBar ? cartBar() : "");
  document.body.classList.toggle("has-cartbar", showBar); document.body.classList.toggle("has-sumbar", !!app.querySelector(".sum-bar"));
  if (fid) { const n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); if (sel) try { n.setSelectionRange(...sel); } catch (e) { /* tanlov yo‘q */ } } }
}
function cartBar() { const k = cartCalc(); if (!k) return ""; const n = cartCount(); return `<div class="cartbar ${S.cartPop ? "pop" : ""}" role="region" aria-label="${L("Savat", "Корзина", "Cart")}">${ic("cart", 18)}<span class="small">${n} ${L("ta pozitsiya", "поз.", n === 1 ? "item" : "items")}</span><b>${smM(k.sub)}</b><button type="button" class="btn btn-gold btn-sm" data-a="go" data-to="savat">${L("Savatni ko‘rish", "Открыть корзину", "View cart")} →</button></div>`; }
// sayt yaratgan id’lar panel id’lari bilan to‘qnashmasin (ikki oyna bir vaqtda ishlaydi)
_uid = 5e8 + Math.floor(Math.random() * 4e8);
sLoadUI();
// yuklanganda faqat haqiqatan o‘zgarish bo‘lsa yozamiz (panel oynasidagi rasmlarni bekorga qayta yuklatmaslik uchun)
load(); { const before = JSON.stringify(db); let had = false; try { had = !!localStorage.getItem(KEY); } catch (e) { had = false; } ensureSiteData(); siteSyncShared(); if (!had || JSON.stringify(db) !== before) sSaveDb(); }
parseHash();
if (RT.q.ref) S.refCode = RT.q.ref.toUpperCase();
document.documentElement.lang = S.lang;
render(); renderAI();
if (RT.path[0] === "login" && !cli()) openM("login", { then: "kabinet" });
