/* CaterFlow — panel va mijoz sayti bitta brauzer xotirasidan foydalanadi: boshqa oynada o‘zgarsa, shu yerda ham yangilanadi */
"use strict";
let _syncDirty = false;
window.addEventListener("storage", e => {
  if (e.key !== KEY || !e.newValue) return;
  let d; try { d = JSON.parse(e.newValue); } catch (x) { return; }
  if (!d || d.v !== DBV || !d.db) return;
  const media = {}, rec = {}; (db.sets || []).forEach(s => (s.media || []).forEach(m => { if (m.src) (media[s.id] = media[s.id] || []).push(m); })); (db.purchases || []).forEach(x => { if (x.receipt) rec[x.id] = x.receipt; });
  db = d.db; resetCache();
  db.sets.forEach(s => (media[s.id] || []).forEach(m => { if (!s.media.some(y => y.id === m.id)) s.media.push(m); })); db.purchases.forEach(x => { if (rec[x.id]) x.receipt = rec[x.id]; });
  if (sitePanelSync()) save();
  if (!ui.modal) render(); else _syncDirty = true;
});
const _closeModal = closeModal;
closeModal = function () { _closeModal(); if (_syncDirty) { _syncDirty = false; render(); } };
const _commit = commit;
commit = function () { siteSyncShared(); sitePanelSync(); _commit(); };
