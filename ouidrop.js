/* ------------------------------------------------------------------
   Ouidrop — fonctions partagées par les pages (aucune dépendance)
   - messages prédéfinis (config.js)
   - transmission maintenance -> affichage (localStorage + IndexedDB)
   - résolution des liens (Google Drive, Dropbox, URL directes)
   - affichage d’un média avec solutions de repli
   ------------------------------------------------------------------ */
(function (global) {
  'use strict';

  const CFG = Object.assign(
    { supportPhone: '', driveFolderUrl: '', maxFileMB: 200, messages: {} },
    global.OUIDROP_CONFIG || {}
  );

  const KEY_DISPLAY = 'ouidropDisplay';   // contenu validé (texte + description du média)
  const KEY_PRESET = 'ouidropPreset';     // message prérempli depuis l’accueil (un seul passage)
  const DB_NAME = 'ouidrop', DB_STORE = 'media', DB_KEY = 'current';

  const IMG_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i;
  const VID_EXT = /\.(mp4|m4v|webm|ogv|mov)$/i;

  /* ---------- messages ---------- */
  function message(key) {
    const t = (CFG.messages && CFG.messages[key]) || '';
    return t.replace(/\{phone\}/g, CFG.supportPhone);
  }

  /* ---------- stockage (jamais d’exception qui remonte) ---------- */
  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  const lsGet = k => safe(() => localStorage.getItem(k), null);
  const lsSet = (k, v) => safe(() => { localStorage.setItem(k, v); return true; }, false);
  const ssGet = k => safe(() => sessionStorage.getItem(k), null);
  const ssSet = (k, v) => safe(() => { sessionStorage.setItem(k, v); return true; }, false);
  const ssDel = k => safe(() => { sessionStorage.removeItem(k); return true; }, false);

  function setPreset(text) { ssSet(KEY_PRESET, text); }
  function takePreset() {
    const v = ssGet(KEY_PRESET);
    if (v !== null) ssDel(KEY_PRESET);
    return v;
  }

  // Contenu validé : { text:string, media:null | {origin:'file',kind,name,type} | {origin:'url',url,hint} }
  function loadDisplay() {
    const raw = lsGet(KEY_DISPLAY);
    if (raw) {
      try {
        const o = JSON.parse(raw);
        if (o && typeof o === 'object') return { text: String(o.text || ''), media: o.media || null };
      } catch (e) { /* contenu illisible : on repart de zéro */ }
    }
    return { text: '', media: null };
  }
  function saveDisplay(payload) { return lsSet(KEY_DISPLAY, JSON.stringify(payload)); }

  /* ---------- IndexedDB : un seul fichier média (Blob), sans limite de 5 Mo ---------- */
  function idb(mode, fn) {
    return new Promise((resolve, reject) => {
      if (!global.indexedDB) { reject(new Error('IndexedDB indisponible')); return; }
      let open;
      try { open = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
      open.onupgradeneeded = () => { open.result.createObjectStore(DB_STORE); };
      open.onerror = () => reject(open.error || new Error('IndexedDB'));
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(DB_STORE, mode);
        const req = fn(tx.objectStore(DB_STORE));
        tx.oncomplete = () => { db.close(); resolve(req && req.result); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('IndexedDB')); };
      };
    });
  }
  const putBlob = blob => idb('readwrite', s => s.put(blob, DB_KEY));
  const getBlob = () => idb('readonly', s => s.get(DB_KEY));
  const clearBlob = () => idb('readwrite', s => s.delete(DB_KEY));

  /* ---------- type d’un fichier local ----------
     Sous Linux minimal, file.type est parfois vide : on se rabat sur l’extension. */
  function kindOfFile(file) {
    const t = (file.type || '').toLowerCase();
    if (t.indexOf('image/') === 0) return 'image';
    if (t.indexOf('video/') === 0) return 'video';
    if (IMG_EXT.test(file.name || '')) return 'image';
    if (VID_EXT.test(file.name || '')) return 'video';
    return null; // inconnu : on essaiera image puis vidéo
  }
  function fileCandidates(kind, url) {
    return kind
      ? [{ kind: kind, src: url }]
      : [{ kind: 'image', src: url }, { kind: 'video', src: url }];
  }

  /* ---------- liens ----------
     Renvoie { ok:true, candidates:[{kind,src}…], label } ou { ok:false, error } */
  function resolveLink(raw, hint) {
    hint = hint || 'auto';
    raw = (raw || '').trim();
    if (!raw) return { ok: false, error: 'Collez un lien.' };
    if (!/^https?:\/\//i.test(raw)) {
      if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(raw)) raw = 'https://' + raw;
      else return { ok: false, error: 'Lien invalide : il doit commencer par http:// ou https://' };
    }
    let u;
    try { u = new URL(raw); } catch (e) { return { ok: false, error: 'Lien invalide.' }; }
    // Page en https : un média en http serait bloqué, on tente la version https.
    if (global.location && location.protocol === 'https:' && u.protocol === 'http:') u.protocol = 'https:';

    // Google Drive
    if (/^(drive\.google\.com|drive\.usercontent\.google\.com)$/.test(u.hostname)) {
      if (/\/folders\//.test(u.pathname)) {
        return { ok: false, error: 'Ce lien désigne un dossier Drive. Ouvrez le dossier, faites un clic droit sur la photo ou la vidéo → Partager → Copier le lien, puis collez ce lien.' };
      }
      const m = u.pathname.match(/\/file\/d\/([\w-]+)/);
      const id = m ? m[1] : u.searchParams.get('id');
      if (!id) return { ok: false, error: 'Lien Google Drive non reconnu. Utilisez « Copier le lien » sur un fichier précis.' };
      const images = [
        { kind: 'image', src: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w2000' },
        { kind: 'image', src: 'https://lh3.googleusercontent.com/d/' + id + '=w2000' }
      ];
      const embed = { kind: 'embed', src: 'https://drive.google.com/file/d/' + id + '/preview' };
      let candidates;
      if (hint === 'video') candidates = [embed];
      else if (hint === 'image') candidates = images;
      else candidates = images.concat([embed]);
      return { ok: true, candidates: candidates, label: 'Google Drive' };
    }

    // Dropbox : ?dl=0 renvoie une page web, raw=1 renvoie le fichier
    if (/(^|\.)dropbox\.com$/.test(u.hostname)) {
      u.searchParams.delete('dl');
      u.searchParams.set('raw', '1');
    }

    // URL directe : on se base sur l’extension, sinon on essaie image puis vidéo
    const isVid = VID_EXT.test(u.pathname), isImg = IMG_EXT.test(u.pathname);
    let candidates;
    if (hint === 'video' || (hint === 'auto' && isVid)) candidates = [{ kind: 'video', src: u.href }];
    else if (hint === 'image' || (hint === 'auto' && isImg)) candidates = [{ kind: 'image', src: u.href }];
    else candidates = [{ kind: 'image', src: u.href }, { kind: 'video', src: u.href }];
    return { ok: true, candidates: candidates, label: u.hostname };
  }

  /* ---------- affichage d’un média ----------
     Essaie les candidats dans l’ordre jusqu’à ce que l’un se charge.
     opts : { autoplay, loop, controls, alt, onStatus('loading'|'ok'|'error') }
     Renvoie une fonction d’annulation. */
  function build(c, opts) {
    if (c.kind === 'image') {
      const img = document.createElement('img');
      img.alt = opts.alt || '';
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';
      img.src = c.src;
      return img;
    }
    if (c.kind === 'video') {
      const v = document.createElement('video');
      v.muted = true; v.setAttribute('muted', '');          // requis pour l’autoplay
      v.loop = !!opts.loop;
      v.autoplay = !!opts.autoplay;
      v.controls = !!opts.controls;
      v.playsInline = true;
      v.preload = 'auto';
      v.src = c.src;
      return v;
    }
    const f = document.createElement('iframe');
    f.title = opts.alt || 'Média';
    f.allow = 'autoplay; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'no-referrer';
    f.setAttribute('frameborder', '0');
    f.src = c.src;
    return f;
  }

  function mountMedia(container, candidates, opts) {
    opts = opts || {};
    const token = {};
    container._ouidropToken = token;
    container.textContent = '';
    let i = 0;
    const live = () => container._ouidropToken === token;
    const status = s => { if (live() && opts.onStatus) opts.onStatus(s); };

    function next() {
      if (!live()) return;
      if (i >= candidates.length) { status('error'); return; }
      const c = candidates[i++];
      const el = build(c, opts);
      let settled = false;
      const ok = () => { if (!live() || settled) return; settled = true; status('ok'); };
      const ko = () => { if (!live() || settled) return; settled = true; el.remove(); next(); };
      if (c.kind === 'image') { el.addEventListener('load', ok); el.addEventListener('error', ko); }
      else if (c.kind === 'video') { el.addEventListener('loadeddata', ok); el.addEventListener('error', ko); }
      container.appendChild(el);
      if (c.kind === 'embed') status('ok');                  // pas de détection d’erreur possible
      if (c.kind === 'video' && opts.autoplay) {
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
      }
    }
    status('loading');
    next();
    return function cancel() { if (live()) container._ouidropToken = null; };
  }

  global.Ouidrop = {
    config: CFG,
    maxBytes: CFG.maxFileMB * 1024 * 1024,
    message, setPreset, takePreset,
    loadDisplay, saveDisplay,
    putBlob, getBlob, clearBlob,
    kindOfFile, fileCandidates, resolveLink, mountMedia
  };
})(window);
