/* Carnet de voyage. Le mot de passe est demandé dès l'ouverture : il déchiffre les billets, les références et les frais
   (AES-GCM, clé dérivée par PBKDF2). Tout se passe dans le navigateur. */
(function () {
  'use strict';
  var D = window.CARNET;
  var secret = null;
  var cle = null;
  var ongletActif = 'aller';
  var horsLigneFait = false;

  function el(tag, attrs, enfants) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (enfants || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function euros(v) { return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }

  /* ---------- Liens de carte ---------- */
  function lienCarte(q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }
  function lienChemin(i) { return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(i.de) + '&destination=' + encodeURIComponent(i.a) + '&travelmode=' + (i.mode || 'transit'); }
  function lien(texte, href, classe) { return el('a', { class: 'btn ' + (classe || 'btn-secondaire'), href: href, target: '_blank', rel: 'noopener', text: texte }); }
  function bouton(texte, classe, fn) { return el('button', { type: 'button', class: 'btn ' + (classe || 'btn-secondaire'), text: texte, onclick: fn }); }

  /* ---------- Étapes ---------- */
  function docsDe(id) { return secret.docs.filter(function (d) { return d.step === id; }); }

  function blocLieu(h, jourDefaut) {
    return el('div', { class: 'lieu-bloc' }, [
      el('p', { class: 'heure', text: h.heure }),
      el('p', { class: 'ville', text: h.lieu }),
      h.jour ? el('p', { class: 'jour-suivant', text: h.jour }) : null
    ]);
  }

  function carteEtape(e) {
    var docs = docsDe(e.id);
    var principal = docs.filter(function (d) { return d.kind === 'pdf'; })[0];
    var c = el('article', { class: 'etape', id: 'e-' + e.id });
    c.appendChild(el('div', { class: 'etape-haut' }, [
      el('p', { class: 'label', text: e.jour }),
      el('h3', { class: 'mode', text: e.mode }),
      el('p', { class: 'label', text: e.marque })
    ]));
    c.appendChild(el('div', { class: 'deux' }, [blocLieu(e.de), blocLieu(e.a)]));
    c.appendChild(el('p', { class: 'duree', text: 'Trajet de ' + e.duree }));

    if (e.jambes) {
      var j = el('div', { class: 'jambes' });
      e.jambes.forEach(function (x) {
        j.appendChild(el('div', { class: 'jambe' + (x.titre.indexOf('change') >= 0 ? ' changement' : '') }, [
          el('p', { class: 'jambe-titre', text: x.titre }), el('p', { class: 'jambe-texte', text: x.texte })
        ]));
      });
      c.appendChild(j);
    }

    var actions = el('div', { class: 'actions' });
    if (principal) actions.appendChild(bouton('Ouvrir le billet', 'btn-principal', function () { ouvrir(principal); }));
    actions.appendChild(lien(e.boutonCarte || 'Voir sur la carte', lienCarte(e.de.carte)));
    c.appendChild(actions);

    /* Plus d'infos : adresses, à savoir, références, fichiers, Wallet */
    var plus = el('div', { class: 'plus' });
    plus.appendChild(el('div', {}, [el('h3', { text: 'Départ' }), el('p', { class: 'texte', text: e.de.ou }), lien('Départ sur la carte', lienCarte(e.de.carte), 'btn-secondaire btn-petit')]));
    plus.appendChild(el('div', {}, [el('h3', { text: 'Arrivée' }), el('p', { class: 'texte', text: e.a.ou }), lien('Arrivée sur la carte', lienCarte(e.a.carte), 'btn-secondaire btn-petit')]));
    if (e.savoir && e.savoir.length) {
      var ul = el('ul', { class: 'plus-liste' });
      e.savoir.forEach(function (t) { ul.appendChild(el('li', { text: t })); });
      plus.appendChild(el('div', {}, [el('h3', { text: 'À savoir' }), ul]));
    }
    var refs = (secret.refs && secret.refs[e.id]) || [];
    if (refs.length) {
      var r = el('div', {}, [el('h3', { text: 'Numéros de réservation' })]);
      refs.forEach(function (x) { r.appendChild(el('div', { class: 'ref' }, [el('span', { text: x.label }), el('b', { text: x.value })])); });
      plus.appendChild(r);
    }
    var liens = (secret.liens && secret.liens[e.id]) || [];
    liens.forEach(function (l) { plus.appendChild(lien(l.label, l.url, 'btn-secondaire btn-petit')); });
    var autres = docs.filter(function (d) { return d !== principal && d.kind !== 'pkpass'; });
    if (autres.length) {
      var f = el('div', { class: 'jambes' }, [el('h3', { text: 'Autres fichiers' })]);
      autres.forEach(function (d) { f.appendChild(ligneFichier(d)); });
      plus.appendChild(f);
    }
    var tel = [];
    if (principal) tel.push(principal);
    if (tel.length) plus.appendChild(el('div', { class: 'ligne-fichier' }, [el('p', { class: 'label', text: 'Télécharger le billet' }), bouton('Télécharger le PDF', 'btn-secondaire btn-petit', function () { telecharger(principal); })]));
    var wallets = docs.filter(function (d) { return d.kind === 'pkpass'; });
    if (wallets.length) {
      var w = el('div', { class: 'jambes' }, [el('h3', { text: 'Apple Wallet' }), el('p', { class: 'label', text: 'Sur iPhone, ouvrir cette page dans Safari.' })]);
      wallets.forEach(function (d) { w.appendChild(bouton('Wallet de ' + d.who, 'btn-secondaire btn-petit', function () { ajouterWallet(d); })); });
      plus.appendChild(w);
    }
    c.appendChild(el('details', {}, [el('summary', { text: "Plus d'infos" }), plus]));
    return c;
  }

  function ligneFichier(d) {
    return el('div', { class: 'ligne-fichier' }, [
      el('p', { class: 'label', text: d.label }),
      el('div', { class: 'deux-boutons' }, [bouton('Ouvrir', 'btn-principal', function () { ouvrir(d); }), bouton('Télécharger', 'btn-secondaire', function () { telecharger(d); })])
    ]);
  }

  function cartePause(e) {
    var c = el('div', { class: 'pause' }, [
      el('p', { class: 'pause-texte', text: e.texte }),
      el('p', { class: 'pause-duree', text: e.duree })
    ]);
    var href = e.itineraire ? lienChemin(e.itineraire) : lienCarte(e.lieu);
    c.appendChild(lien(e.boutonCarte || 'Voir sur la carte', href, 'btn-secondaire btn-petit'));
    return c;
  }

  function carteSejour() {
    var s = D.sejour;
    var c = el('div', { class: 'sejour' }, [el('h3', { text: s.titre }), el('p', { class: 'texte', text: s.texte })]);
    if (s.manque && s.manque.length) {
      var m = el('div', { class: 'manque' }, [el('p', { class: 'label', text: 'Pas encore écrit dans ce carnet' })]);
      var ul = el('ul');
      s.manque.forEach(function (t) { ul.appendChild(el('li', { text: t })); });
      m.appendChild(ul); c.appendChild(m);
    }
    c.appendChild(lien('Valmorel sur la carte', lienCarte(s.lieu), 'btn-secondaire'));
    return c;
  }

  /* ---------- Onglets ---------- */
  function panneau(nom) {
    var main = document.getElementById('contenu');
    main.textContent = '';
    if (nom === 'aller' || nom === 'retour') {
      D.etapes.filter(function (e) { return e.onglet === nom; }).forEach(function (e) {
        main.appendChild(e.type === 'trajet' ? carteEtape(e) : cartePause(e));
      });
      if (nom === 'aller') main.appendChild(carteSejour());
    } else if (nom === 'argent') {
      panneauArgent(main);
    } else {
      panneauInfos(main);
    }
  }

  function panneauArgent(main) {
    var f = secret.frais;
    var total = f.lignes.reduce(function (s, l) { return s + l.paye; }, 0);
    main.appendChild(el('div', { class: 'grand-chiffre' }, [
      el('p', { class: 'label', text: 'Jules rembourse à ' + f.payePar }),
      el('p', { class: 'nombre', text: euros(total / 2) })
    ]));
    f.lignes.forEach(function (l) {
      var recu = secret.docs.filter(function (d) { return d.id === l.recu; })[0];
      var carte = el('div', { class: 'achat' }, [
        el('div', { class: 'achat-tete' }, [el('span', { class: 'achat-nom', text: l.label }), el('span', { class: 'achat-prix', text: euros(l.paye) })]),
        el('p', { class: 'label', text: l.date + '. ' + l.note })
      ]);
      if (recu) carte.appendChild(el('div', { class: 'deux-boutons ligne-fichier' }, [bouton('Ouvrir le reçu', 'btn-principal', function () { ouvrir(recu); }), bouton('Télécharger', 'btn-secondaire', function () { telecharger(recu); })]));
      main.appendChild(carte);
    });
    main.appendChild(el('div', { class: 'total-ligne' }, [el('span', { text: 'Total payé par ' + f.payePar }), el('span', { text: euros(total) })]));
    main.appendChild(el('p', { class: 'label', text: 'Chacun paie la moitié, à confirmer entre vous. Les prix affichés avant les bons d’achat FlixBus faisaient ' + euros(f.lignes.reduce(function (s, l) { return s + l.affiche; }, 0)) + '.' }));
  }

  function panneauInfos(main) {
    D.infos.forEach(function (i) {
      var b = el('div', { class: 'bloc' }, [el('h3', { text: i.titre }), el('p', { text: i.texte })]);
      if (i.lien) b.appendChild(lien(i.lien.texte, i.lien.url, 'btn-secondaire btn-petit'));
      main.appendChild(b);
    });
    var a = secret.assurance;
    if (a) {
      var b = el('div', { class: 'bloc' }, [
        el('h3', { text: 'Assurance du train du 28 décembre' }),
        el('p', { text: a.garantie + ', pour ' + a.voyageurs + ' (' + euros(a.prime) + ').' }),
        el('div', { class: 'ref' }, [el('span', { text: 'Numéro de contrat' }), el('b', { text: a.contrat })])
      ]);
      var ul = el('ul', { class: 'plus-liste' });
      a.couvre.forEach(function (t) { ul.appendChild(el('li', { text: t })); });
      b.appendChild(el('p', { text: 'Elle prend en charge :' })); b.appendChild(ul);
      var un = el('ul', { class: 'plus-liste' });
      a.necouvre.forEach(function (t) { un.appendChild(el('li', { text: t })); });
      b.appendChild(el('p', { text: 'Elle ne prend pas en charge :' })); b.appendChild(un);
      b.appendChild(lien('Faire une demande de remboursement', a.lien, 'btn-secondaire btn-petit'));
      b.appendChild(lien('Appeler ' + a.tel, 'tel:' + a.tel.replace(/\s/g, ''), 'btn-secondaire btn-petit'));
      main.appendChild(b);
    }
    main.appendChild(bouton('Verrouiller le carn’s sur cet appareil', 'btn-secondaire', verrouiller));
  }

  function choisirOnglet(nom) {
    ongletActif = nom;
    var bs = document.querySelectorAll('.onglet');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-selected', bs[i].getAttribute('data-onglet') === nom ? 'true' : 'false');
    panneau(nom);
    window.scrollTo(0, 0);
  }

  /* ---------- En-tête ---------- */
  function entete() {
    document.getElementById('hero-sous').textContent = D.sous;
    document.getElementById('hero-titre').textContent = D.titre;
    var maintenant = new Date(), depart = new Date(D.depart), fin = new Date(D.fin);
    var g = document.getElementById('hero-grand'), p = document.getElementById('hero-petit');
    if (maintenant < depart) {
      var jours = Math.ceil((depart - maintenant) / 86400000);
      g.textContent = 'Départ dans ' + jours + (jours > 1 ? ' jours' : ' jour');
      p.textContent = 'Dimanche 27 décembre à 21h55, boulevard de Turin à Lille';
    } else if (maintenant <= fin) {
      var s = D.etapes.filter(function (e) { return e.type === 'trajet' && new Date(e.quand) > maintenant; })[0];
      g.textContent = s ? 'Prochain trajet : ' + s.de.heure : 'Voyage en cours';
      p.textContent = s ? s.jour + ', ' + s.mode + ' de ' + s.de.lieu + ' à ' + s.a.lieu : '';
    } else {
      g.textContent = 'Voyage terminé'; p.textContent = '';
    }
  }

  /* ---------- Chiffrement ---------- */
  function b64(s) { var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function deriver(mdp, meta) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(mdp), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(meta.sel), iterations: meta.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    });
  }
  function dechiffrer(octets) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: octets.slice(0, 12) }, cle, octets.slice(12)); }
  function recupere(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.arrayBuffer(); }); }

  function deverrouiller(mdp, zoneErreur) {
    if (zoneErreur) zoneErreur.textContent = 'Vérif’s…';
    return fetch('data/meta.json').then(function (r) { return r.json(); })
      .then(function (meta) { return deriver(mdp, meta); })
      .then(function (k) { cle = k; return recupere('data/secret.enc'); })
      .then(function (buf) { return dechiffrer(new Uint8Array(buf)); })
      .then(function (clair) {
        secret = JSON.parse(new TextDecoder().decode(clair));
        ecrire('carnet-mdp', mdp);
        document.getElementById('porte').hidden = true;
        document.getElementById('appli').hidden = false;
        entete();
        choisirOnglet(ongletActif);
        preparerHorsLigne();
        return true;
      })
      .catch(function () {
        cle = null; secret = null;
        document.getElementById('porte').hidden = false;
        document.getElementById('appli').hidden = true;
        if (zoneErreur) zoneErreur.textContent = 'Mauvais mot de pass’s, c’est le binz. Réessaie, Gadz’Arts.';
        return false;
      });
  }
  function verrouiller() {
    ecrire('carnet-mdp', null); secret = null; cle = null;
    document.getElementById('appli').hidden = true;
    document.getElementById('porte').hidden = false;
    document.getElementById('mdp').value = '';
  }

  function contenuDoc(d) { return recupere('files/' + d.id + '.enc').then(function (buf) { return dechiffrer(new Uint8Array(buf)); }); }
  var HORS = 'Ce fichier n’est pas encore sur ton téléphone. Ouvre-le une première fois avec du réseau.';
  function ouvrir(d) {
    if (d.kind === 'image') {
      return contenuDoc(d).then(function (clair) {
        var url = URL.createObjectURL(new Blob([clair], { type: d.mime }));
        var v = document.getElementById('visionneuse');
        document.getElementById('visionneuse-img').src = url;
        document.getElementById('visionneuse-img').alt = d.label;
        document.getElementById('visionneuse-titre').textContent = d.label;
        if (typeof v.showModal === 'function') v.showModal(); else v.setAttribute('open', '');
      }).catch(function () { alert(HORS); });
    }
    var fenetre = window.open('', '_blank');
    return contenuDoc(d).then(function (clair) {
      var url = URL.createObjectURL(new Blob([clair], { type: d.mime }));
      if (fenetre) fenetre.location.href = url; else window.location.href = url;
    }).catch(function () { if (fenetre) fenetre.close(); alert(HORS); });
  }
  function telecharger(d) {
    return contenuDoc(d).then(function (clair) {
      var url = URL.createObjectURL(new Blob([clair], { type: d.mime }));
      var a = document.createElement('a');
      a.href = url; a.download = d.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    }).catch(function () { alert(HORS); });
  }
  function ajouterWallet(d) {
    return contenuDoc(d).then(function (clair) {
      window.location.href = URL.createObjectURL(new Blob([clair], { type: 'application/vnd.apple.pkpass' }));
    }).catch(function () { alert(HORS); });
  }

  function preparerHorsLigne() {
    if (horsLigneFait || !secret || !('caches' in window)) return;
    horsLigneFait = true;
    var urls = secret.docs.map(function (d) { return 'files/' + d.id + '.enc'; });
    caches.open('carnet-fichiers-v1').then(function (c) { return Promise.all(urls.map(function (u) { return c.add(u).catch(function () {}); })); }).catch(function () {});
  }

  /* ---------- Démarrage ---------- */
  document.getElementById('visionneuse-fermer').addEventListener('click', function () { document.getElementById('visionneuse').close(); });
  document.getElementById('porte-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    deverrouiller(document.getElementById('mdp').value, document.getElementById('erreur')).then(function (ok) { if (!ok) document.getElementById('mdp').focus(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.onglet'), function (b) {
    b.addEventListener('click', function () { choisirOnglet(b.getAttribute('data-onglet')); });
  });
  var memorise = lire('carnet-mdp');
  if (memorise) deverrouiller(memorise, null);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
