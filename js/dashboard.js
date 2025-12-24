/* Dashboard.js - Où part mon argent ? */
(function() {
  'use strict';

  var ICONS = { revenu: '💵', epargne: '💎', essentiel: '🏠', 'non-essentiel': '🛍️', imprevu: '🚨' };
  var LABELS = { revenu: 'Revenu', epargne: 'Épargne', essentiel: 'Dépense essentielle', 'non-essentiel': 'Dépense non essentielle', imprevu: 'Imprévu' };
  var state = { selectedType: null, currentFilter: 'all', editingId: null };

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function formatMoney(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0); }
  function formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function formatDateShort(d) { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
  function getData(key, def) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch(e) { return def; } }
  function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function getPlan() { return getData('plan', 'free'); }
  function hasFeature(f) { var p = getPlan(); if (p === 'complete') return true; if (p === 'essential' && (f === 'comparateur' || f === 'prelevements')) return true; return false; }
  function getCurrentMonth() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function getDaysLeft() { var n = new Date(); var l = new Date(n.getFullYear(), n.getMonth() + 1, 0); return l.getDate() - n.getDate(); }

  function getMovements() { return getData('movements', []); }
  function getMovementsThisMonth() { var m = getCurrentMonth(); return getMovements().filter(function(x) { return x.date && x.date.startsWith(m); }); }

  function calculateStats() {
    var mvs = getMovementsThisMonth();
    var s = { revenus: 0, essentielles: 0, nonEssentielles: 0, epargne: 0, imprevu: 0 };
    mvs.forEach(function(m) {
      var a = Math.abs(m.amount || 0);
      if (m.type === 'revenu') s.revenus += a;
      else if (m.type === 'essentiel') s.essentielles += a;
      else if (m.type === 'non-essentiel') s.nonEssentielles += a;
      else if (m.type === 'epargne') s.epargne += a;
      else if (m.type === 'imprevu') s.imprevu += a;
    });
    s.totalDepenses = s.essentielles + s.nonEssentielles + s.imprevu;
    s.resteAVivre = s.revenus - s.totalDepenses - s.epargne;
    s.totalSorties = s.totalDepenses + s.epargne;
    return s;
  }

  function calculateScore(stats) {
    if (stats.revenus <= 0) return { score: 0, factors: [] };
    var score = 0, factors = [];
    var rr = stats.resteAVivre / stats.revenus;
    if (rr >= 0.20) { score += 40; factors.push({ t: 'Reste à vivre > 20%', p: true }); }
    else if (rr >= 0.10) { score += 25; factors.push({ t: 'Reste à vivre 10-20%', p: true }); }
    else if (rr >= 0) { score += 10; factors.push({ t: 'Reste à vivre faible', p: false }); }
    else { factors.push({ t: 'Budget en déficit', p: false }); }
    
    var er = stats.epargne / stats.revenus;
    if (er >= 0.15) { score += 30; factors.push({ t: 'Épargne > 15%', p: true }); }
    else if (er >= 0.10) { score += 20; factors.push({ t: 'Épargne 10-15%', p: true }); }
    else if (er > 0) { score += 10; factors.push({ t: 'Épargne présente', p: true }); }
    else { factors.push({ t: 'Pas d\'épargne', p: false }); }
    
    if (stats.nonEssentielles / stats.revenus <= 0.15) { score += 15; factors.push({ t: 'Non-ess. maîtrisées', p: true }); }
    else if (stats.nonEssentielles / stats.revenus > 0.25) { factors.push({ t: 'Non-ess. élevées', p: false }); }
    
    if (stats.imprevu === 0) { score += 10; factors.push({ t: 'Pas d\'imprévu', p: true }); }
    else { factors.push({ t: 'Imprévu: ' + formatMoney(stats.imprevu), p: false }); }
    
    if (getMovementsThisMonth().length >= 5) score += 5;
    return { score: Math.min(100, Math.max(0, score)), factors: factors };
  }

  function getScoreInfo(s) {
    if (s >= 70) return { label: 'Excellente santé', cls: 'success' };
    if (s >= 50) return { label: 'Bonne gestion', cls: 'success' };
    if (s >= 30) return { label: 'À surveiller', cls: 'warning' };
    return { label: 'Attention requise', cls: 'danger' };
  }

  function generateDiagnostic(stats, score) {
    var d = { icon: '🎯', text: '', sub: '', cls: '' };
    if (stats.revenus === 0) { d.icon = '📝'; d.text = 'Commencez par ajouter vos revenus'; d.sub = 'Ajoutez un mouvement Revenu pour voir votre situation.'; }
    else if (stats.resteAVivre < 0) { d.icon = '🚨'; d.text = 'Attention : déficit de ' + formatMoney(Math.abs(stats.resteAVivre)); d.sub = 'Réduisez les non-essentielles (' + formatMoney(stats.nonEssentielles) + ') en priorité.'; d.cls = 'danger'; }
    else if (stats.resteAVivre / stats.revenus < 0.10) { d.icon = '⚠️'; d.text = 'Budget serré : ' + formatMoney(stats.resteAVivre) + ' de marge'; d.sub = 'Un imprévu de 300€ vous mettrait en difficulté.'; d.cls = 'warning'; }
    else if (stats.epargne === 0) { d.icon = '💡'; d.text = 'Marge de ' + formatMoney(stats.resteAVivre) + ' disponible'; d.sub = 'Vous pourriez épargner une partie chaque mois.'; }
    else { d.icon = '✅'; d.text = 'Situation saine : ' + formatMoney(stats.resteAVivre) + ' dispo'; d.sub = 'Vous épargnez ' + formatMoney(stats.epargne) + ' ce mois. Continuez !'; }
    return d;
  }

  function renderAll() {
    var stats = calculateStats();
    var scoreData = calculateScore(stats);
    var diag = generateDiagnostic(stats, scoreData.score);
    
    // Diagnostic
    var dc = $('diagnostic-card');
    if (dc) { dc.className = 'diagnostic-card' + (diag.cls ? ' ' + diag.cls : ''); }
    if ($('diagnostic-icon')) $('diagnostic-icon').textContent = diag.icon;
    if ($('diagnostic-text')) $('diagnostic-text').textContent = diag.text;
    if ($('diagnostic-sub')) $('diagnostic-sub').textContent = diag.sub;
    
    // Stats
    if ($('stat-revenus')) $('stat-revenus').textContent = formatMoney(stats.revenus);
    if ($('stat-essentielles')) $('stat-essentielles').textContent = formatMoney(stats.essentielles);
    if ($('stat-non-essentielles')) $('stat-non-essentielles').textContent = formatMoney(stats.nonEssentielles);
    var re = $('stat-reste');
    if (re) { re.textContent = formatMoney(stats.resteAVivre); re.className = 'stat-value ' + (stats.resteAVivre >= 0 ? 'positive' : 'negative'); }
    
    // Score
    var info = getScoreInfo(scoreData.score);
    if ($('score-number')) $('score-number').textContent = scoreData.score;
    var circ = $('score-circle');
    if (circ) { var c = 2 * Math.PI * 70; circ.style.strokeDashoffset = c - (scoreData.score / 100) * c; circ.className = 'score-circle-fill' + (scoreData.score < 50 ? (scoreData.score < 30 ? ' danger' : ' warning') : ''); }
    var badge = $('score-badge');
    if (badge) { badge.textContent = info.label; badge.className = 'badge ' + info.cls; }
    var fl = $('score-factors-list');
    if (fl) { var h = ''; scoreData.factors.forEach(function(f) { h += '<div class="score-factor ' + (f.p ? 'positive' : 'negative') + '">' + (f.p ? '✓ ' : '✗ ') + f.t + '</div>'; }); fl.innerHTML = h; }
    
    // Missions
    var mvs = getMovementsThisMonth();
    var missions = [
      { text: 'Ajouter vos revenus', impact: '+20 pts', done: stats.revenus > 0, pts: 20 },
      { text: 'Enregistrer 5 mouvements', impact: 'Meilleure visibilité', done: mvs.length >= 5, pts: 15 },
      { text: 'Épargner ce mois', impact: '+30 pts max', done: stats.epargne > 0, pts: 25 }
    ];
    var ml = $('missions-list');
    if (ml) {
      var mh = '', mc = 0;
      missions.forEach(function(m) { if (m.done) mc++; mh += '<div class="mission' + (m.done ? ' completed' : '') + '"><div class="mission-check">' + (m.done ? '✓' : '') + '</div><div class="mission-content"><div class="mission-text">' + m.text + '</div><div class="mission-impact">' + m.impact + '</div></div><div class="mission-points">+' + m.pts + '</div></div>'; });
      ml.innerHTML = mh;
      if ($('missions-progress')) $('missions-progress').textContent = mc + '/3 complétées';
    }
    
    // Épargne
    var obj = getData('epargneObjectif', { nom: '', montant: 0, dejaEpargne: 0 });
    var te = (obj.dejaEpargne || 0) + stats.epargne;
    if ($('epargne-objectif-text')) $('epargne-objectif-text').textContent = obj.nom ? obj.nom + ' — ' + formatMoney(obj.montant) : 'Aucun objectif défini';
    var pct = obj.montant > 0 ? Math.min(100, Math.round((te / obj.montant) * 100)) : 0;
    if ($('epargne-progress')) $('epargne-progress').style.width = pct + '%';
    if ($('epargne-total')) $('epargne-total').textContent = formatMoney(te);
    if ($('epargne-mois')) $('epargne-mois').textContent = formatMoney(stats.epargne);
    var rest = Math.max(0, (obj.montant || 0) - te);
    if ($('epargne-restant')) $('epargne-restant').textContent = formatMoney(rest);
    if ($('epargne-conseille')) $('epargne-conseille').textContent = formatMoney(rest > 0 ? Math.ceil(rest / 12) : 0);
    
    // Last test
    renderLastTest();
    
    // Movements
    renderMovements();
    
    // Month summary
    if ($('resume-entrees')) $('resume-entrees').textContent = '+' + formatMoney(stats.revenus);
    if ($('resume-sorties')) $('resume-sorties').textContent = '-' + formatMoney(stats.totalSorties);
    var sol = $('resume-solde');
    if (sol) { var sv = stats.revenus - stats.totalSorties; sol.textContent = formatMoney(sv); sol.className = 'summary-value ' + (sv >= 0 ? 'positive' : 'negative'); }
    
    // Projection
    var pc = $('projection-container');
    if (pc && mvs.length >= 3 && stats.revenus > 0) {
      pc.style.display = 'block';
      var dp = new Date().getDate();
      var dr = (stats.totalDepenses / dp) * getDaysLeft();
      var pr = stats.revenus - stats.totalDepenses - dr - stats.epargne;
      if ($('projection-value')) { $('projection-value').textContent = formatMoney(pr); $('projection-value').className = 'projection-value ' + (pr >= 0 ? 'positive' : 'negative'); }
      if ($('projection-days')) $('projection-days').textContent = getDaysLeft() + ' jours restants';
    } else if (pc) { pc.style.display = 'none'; }
    
    // Tool access
    if ($('tool-comparateur')) $('tool-comparateur').classList.toggle('locked', !hasFeature('comparateur'));
    if ($('tool-simulateur')) $('tool-simulateur').classList.toggle('locked', !hasFeature('simulateur'));
    if ($('tool-prelevements')) $('tool-prelevements').classList.toggle('locked', !hasFeature('prelevements'));
    
    // Prélèvements
    renderPrelevements();
  }

  function renderLastTest() {
    var c = $('last-test-container');
    if (!c) return;
    var t = getData('lastTest', null);
    if (!t) {
      c.innerHTML = '<div class="last-test-empty"><div style="font-size:48px;margin-bottom:16px">📝</div><p style="font-weight:600;margin-bottom:8px">Aucun test réalisé</p><p style="margin-bottom:16px">Faites le test gratuit pour une première évaluation</p><a href="test.html" class="btn btn-primary">Faire le test</a></div>';
      return;
    }
    var si = getScoreInfo(t.score);
    var h = '<div class="last-test-header"><h3>📊 Dernier test</h3><span class="last-test-date">' + formatDate(t.date) + '</span></div>';
    h += '<div class="grid-4" style="gap:12px;margin-bottom:16px"><div class="mini-card"><div class="mini-title">Revenus</div><div class="mini-value">' + formatMoney(t.revenus) + '</div></div><div class="mini-card"><div class="mini-title">Essentielles</div><div class="mini-value" style="color:var(--text-primary)">' + formatMoney(t.depensesEssentielles) + '</div></div><div class="mini-card"><div class="mini-title">Non-ess.</div><div class="mini-value" style="color:var(--warning)">' + formatMoney(t.depensesNonEssentielles) + '</div></div><div class="mini-card"><div class="mini-title">Reste</div><div class="mini-value">' + formatMoney(t.resteAVivre) + '</div></div></div>';
    h += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px"><div style="text-align:center"><div style="font-size:32px;font-weight:800">' + t.score + '</div><div style="font-size:11px;color:var(--text-muted)">/100</div></div><div style="flex:1"><span class="badge ' + si.cls + '">' + si.label + '</span><p style="font-size:14px;color:var(--text-muted);margin-top:8px">' + (t.conseil || '') + '</p></div></div>';
    h += '<div style="display:flex;gap:12px;flex-wrap:wrap"><a href="test.html" class="btn btn-primary">🔄 Refaire le test</a><button class="btn btn-ghost" onclick="Dashboard.deleteTest()">🗑️ Supprimer</button></div>';
    c.innerHTML = h;
  }

  function renderMovements() {
    var mvs = getMovementsThisMonth();
    if (state.currentFilter !== 'all') mvs = mvs.filter(function(m) { return m.type === state.currentFilter; });
    mvs.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    var c = $('movement-list');
    if (!c) return;
    if (mvs.length === 0) {
      c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p class="empty-state-title">Aucun mouvement</p><p>Commencez à ajouter vos revenus et dépenses</p><button class="btn btn-primary" style="margin-top:16px" onclick="Dashboard.openModal(\'modal-movement\')">+ Ajouter</button></div>';
      return;
    }
    var h = '';
    mvs.forEach(function(m) {
      var ip = m.type === 'revenu';
      h += '<div class="movement"><div class="movement-icon ' + m.type + '">' + (ICONS[m.type] || '📦') + '</div><div class="movement-info"><div class="movement-title">' + (m.desc || LABELS[m.type]) + '</div><div class="movement-meta">' + LABELS[m.type] + ' · ' + formatDateShort(m.date) + '</div></div><div class="movement-amount ' + (ip ? 'positive' : 'negative') + '">' + (ip ? '+' : '-') + formatMoney(Math.abs(m.amount)) + '</div><div class="movement-actions"><button class="movement-btn" onclick="Dashboard.editMovement(\'' + m.id + '\')">✏️</button><button class="movement-btn delete" onclick="Dashboard.removeMovement(\'' + m.id + '\')">🗑️</button></div></div>';
    });
    c.innerHTML = h;
  }

  function renderPrelevements() {
    var list = getData('prelevements', []);
    var c = $('prelevements-list');
    if (!c) return;
    if (list.length === 0) { c.innerHTML = '<div class="empty-state" style="padding:24px"><p>Aucun prélèvement</p></div>'; if ($('prelevements-total')) $('prelevements-total').textContent = '0 €'; return; }
    list.sort(function(a, b) { return a.jour - b.jour; });
    var mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    var now = new Date(), total = 0, h = '';
    list.forEach(function(p, i) { total += p.montant; h += '<div class="prelevement"><div class="prelevement-date"><div class="prelevement-day">' + p.jour + '</div><div class="prelevement-month">' + mois[now.getMonth()] + '</div></div><div class="prelevement-info"><div class="prelevement-name">' + p.nom + '</div></div><div class="prelevement-amount">-' + formatMoney(p.montant) + '</div><button class="movement-btn delete" onclick="Dashboard.removePrelevement(' + i + ')">🗑️</button></div>'; });
    c.innerHTML = h;
    if ($('prelevements-total')) $('prelevements-total').textContent = formatMoney(total);
  }

  function openModal(id) { var m = $(id); if (m) m.classList.add('open'); if (id === 'modal-movement') { $('movement-date').value = new Date().toISOString().split('T')[0]; state.editingId = null; $('modal-movement-title').textContent = 'Ajouter un mouvement'; } if (id === 'modal-epargne') { var o = getData('epargneObjectif', {}); $('epargne-nom').value = o.nom || ''; $('epargne-objectif-input').value = o.montant || ''; $('epargne-deja').value = o.dejaEpargne || ''; } }
  function closeModal(id) { var m = $(id); if (m) m.classList.remove('open'); if (id === 'modal-movement') { state.selectedType = null; state.editingId = null; $$('.type-option').forEach(function(o) { o.classList.remove('selected'); }); $('movement-desc').value = ''; $('movement-amount').value = ''; } }
  function selectType(t) { state.selectedType = t; $$('.type-option').forEach(function(o) { o.classList.toggle('selected', o.dataset.type === t); }); }

  function saveMovement() {
    if (!state.selectedType) { alert('Sélectionnez un type'); return; }
    var d = $('movement-desc').value.trim(), a = parseFloat($('movement-amount').value) || 0, dt = $('movement-date').value;
    if (a <= 0) { alert('Entrez un montant valide'); return; }
    if (!dt) { alert('Sélectionnez une date'); return; }
    var mvs = getMovements();
    if (state.editingId) { var idx = mvs.findIndex(function(m) { return m.id === state.editingId; }); if (idx !== -1) mvs[idx] = { id: state.editingId, type: state.selectedType, desc: d || LABELS[state.selectedType], amount: a, date: dt }; }
    else { mvs.push({ id: 'mv_' + Date.now(), type: state.selectedType, desc: d || LABELS[state.selectedType], amount: a, date: dt }); }
    setData('movements', mvs);
    closeModal('modal-movement');
    renderAll();
  }

  function editMovement(id) {
    var mvs = getMovements(), m = mvs.find(function(x) { return x.id === id; });
    if (!m) return;
    state.editingId = id; state.selectedType = m.type;
    $('modal-movement-title').textContent = 'Modifier le mouvement';
    $('movement-desc').value = m.desc || '';
    $('movement-amount').value = m.amount || '';
    $('movement-date').value = m.date || '';
    $$('.type-option').forEach(function(o) { o.classList.toggle('selected', o.dataset.type === m.type); });
    openModal('modal-movement');
  }

  function removeMovement(id) { if (!confirm('Supprimer ?')) return; var mvs = getMovements().filter(function(m) { return m.id !== id; }); setData('movements', mvs); renderAll(); }
  function saveEpargne() { var n = $('epargne-nom').value.trim(), m = parseFloat($('epargne-objectif-input').value) || 0, d = parseFloat($('epargne-deja').value) || 0; setData('epargneObjectif', { nom: n, montant: m, dejaEpargne: d }); closeModal('modal-epargne'); renderAll(); }
  function savePrelevement() { var n = $('prelevement-nom').value.trim(), m = parseFloat($('prelevement-montant').value) || 0, j = parseInt($('prelevement-jour').value) || 1; if (!n || m <= 0) { alert('Remplissez tous les champs'); return; } var l = getData('prelevements', []); l.push({ nom: n, montant: m, jour: j }); setData('prelevements', l); $('prelevement-nom').value = ''; $('prelevement-montant').value = ''; $('prelevement-jour').value = ''; closeModal('modal-prelevement'); renderAll(); }
  function removePrelevement(i) { if (!confirm('Supprimer ?')) return; var l = getData('prelevements', []); l.splice(i, 1); setData('prelevements', l); renderAll(); }
  function deleteTest() { if (!confirm('Supprimer le dernier test ?')) return; localStorage.removeItem('lastTest'); var t = getData('tests', []); if (t.length > 0) { t.pop(); setData('tests', t); if (t.length > 0) setData('lastTest', t[t.length - 1]); } renderAll(); }
  function filterMovements(f) { state.currentFilter = f; $$('.filter-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.filter === f); }); renderMovements(); }
  function showTab(n) { $$('.tab').forEach(function(t) { t.classList.remove('active'); }); $$('.tab-content').forEach(function(c) { c.classList.remove('active'); }); var tab = document.querySelector('.tab[data-tab="' + n + '"]'), cnt = $('tab-' + n); if (tab) tab.classList.add('active'); if (cnt) cnt.classList.add('active'); }

  function comparer() {
    var nA = $('compare-a-nom').value || 'Choix A', cA = parseFloat($('compare-a-cout').value) || 0, dA = parseInt($('compare-a-duree').value) || 1;
    var nB = $('compare-b-nom').value || 'Choix B', cB = parseFloat($('compare-b-cout').value) || 0, dB = parseInt($('compare-b-duree').value) || 1;
    var tA = cA * dA, tB = cB * dB, diff = Math.abs(tA - tB);
    var stats = calculateStats(), nrA = stats.resteAVivre - cA, nrB = stats.resteAVivre - cB;
    var h = '<h4 style="margin-bottom:16px">📊 Résultat</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px"><div style="text-align:center;padding:16px;background:var(--accent-subtle);border-radius:8px"><div style="font-size:12px">' + nA + '</div><div style="font-size:24px;font-weight:700;color:var(--accent)">' + formatMoney(tA) + '</div></div><div style="text-align:center;padding:16px;background:rgba(59,130,246,0.1);border-radius:8px"><div style="font-size:12px">' + nB + '</div><div style="font-size:24px;font-weight:700;color:#3b82f6">' + formatMoney(tB) + '</div></div></div>';
    h += '<div style="text-align:center;padding:16px;background:#fff;border:1px solid var(--border-light);border-radius:8px"><div style="font-size:12px;color:var(--text-muted)">Différence</div><div style="font-size:28px;font-weight:700">' + formatMoney(diff) + '</div>';
    if (tA !== tB) h += '<div style="color:var(--accent);font-weight:600;margin-top:8px">✅ ' + (tA < tB ? nA : nB) + ' est plus économique</div>';
    h += '</div><div style="margin-top:16px;padding:16px;background:var(--bg-subtle);border-radius:8px"><div style="font-size:12px;font-weight:600;margin-bottom:8px">IMPACT BUDGET</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>' + nA + ': <strong style="color:' + (nrA >= 0 ? 'var(--accent)' : 'var(--danger)') + '">' + formatMoney(nrA) + '</strong>/mois</div><div>' + nB + ': <strong style="color:' + (nrB >= 0 ? 'var(--accent)' : 'var(--danger)') + '">' + formatMoney(nrB) + '</strong>/mois</div></div></div>';
    $('compare-result').innerHTML = h; $('compare-result').style.display = 'block';
  }

  function simuler() {
    var stats = calculateStats();
    if (stats.revenus <= 0) { alert('Ajoutez d\'abord vos revenus'); return; }
    var m = parseFloat($('imprevu-montant').value) || 0, ms = parseInt($('imprevu-mois').value) || 1;
    if (m <= 0) { alert('Entrez un montant'); return; }
    var cm = m / ms, nr = stats.resteAVivre - cm;
    var st, ic, ti, msg;
    if (nr >= stats.resteAVivre * 0.5) { st = 'success'; ic = '✅'; ti = 'Absorbable'; msg = 'Votre budget peut absorber cet imprévu.'; }
    else if (nr >= 0) { st = 'warning'; ic = '⚠️'; ti = 'Tendu'; msg = 'Faisable mais marge réduite.'; }
    else { st = 'danger'; ic = '❌'; ti = 'Critique'; msg = 'Dépasse votre capacité actuelle.'; }
    var h = '<div class="simulation-result ' + st + '"><div class="simulation-header"><span class="simulation-icon">' + ic + '</span><div><div class="simulation-title">' + ti + '</div><div class="simulation-message">' + msg + '</div></div></div><div class="simulation-comparison"><div class="comparison-item"><div style="font-size:11px">Reste actuel</div><div style="font-size:20px;font-weight:700">' + formatMoney(stats.resteAVivre) + '</div></div><div class="comparison-item"><div style="font-size:11px">Coût/mois</div><div style="font-size:20px;font-weight:700;color:var(--danger)">-' + formatMoney(cm) + '</div></div><div class="comparison-item"><div style="font-size:11px">Nouveau reste</div><div style="font-size:20px;font-weight:700;color:' + (nr >= 0 ? 'var(--accent)' : 'var(--danger)') + '">' + formatMoney(nr) + '</div></div></div></div>';
    $('simulateur-result').innerHTML = h;
  }

  function init() {
    try { var s = JSON.parse(localStorage.getItem('auth_session_v1')); if (!s || !s.email) { window.location.replace('login.html'); return; } } catch(e) { window.location.replace('login.html'); return; }
    renderAll();
    $$('.tab').forEach(function(t) { t.addEventListener('click', function() { showTab(this.dataset.tab); }); });
    $$('.filter-btn').forEach(function(b) { b.addEventListener('click', function() { filterMovements(this.dataset.filter); }); });
    $$('.type-option').forEach(function(o) { o.addEventListener('click', function() { selectType(this.dataset.type); }); });
    $$('[data-close]').forEach(function(b) { b.addEventListener('click', function() { closeModal(this.dataset.close); }); });
    $$('.modal').forEach(function(m) { m.addEventListener('click', function(e) { if (e.target === this) closeModal(this.id); }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Dashboard = { openModal: openModal, closeModal: closeModal, saveMovement: saveMovement, editMovement: editMovement, removeMovement: removeMovement, saveEpargne: saveEpargne, savePrelevement: savePrelevement, removePrelevement: removePrelevement, deleteTest: deleteTest, comparer: comparer, simuler: simuler, filterMovements: filterMovements, showTab: showTab };
})();