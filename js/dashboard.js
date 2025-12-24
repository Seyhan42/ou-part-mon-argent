// ============================================
// DASHBOARD.JS - Où part mon argent ?
// ============================================

const PLANS = {
  free: { name: 'Gratuit', features: ['resume', 'historique'], color: '#6b7280' },
  essential: { name: 'Essentiel', features: ['resume', 'historique', 'epargne', 'fuites', 'comparateur', 'rappels'], color: '#0d9f6f' },
  complete: { name: 'Complet', features: ['resume', 'historique', 'epargne', 'fuites', 'comparateur', 'imprevu', 'rappels'], color: '#3b82f6' }
};

// === UTILITAIRES ===
function formatMoney(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; }
function getData(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
function setData(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function getScoreInfo(s) { if (s >= 70) return { label: 'Bonne santé', class: 'success', title: 'Bonne gestion', desc: 'Continuez !' }; if (s >= 40) return { label: 'À surveiller', class: 'warning', title: 'Peut mieux faire', desc: 'Optimisez.' }; return { label: 'Attention', class: 'danger', title: 'Budget tendu', desc: 'Réduisez.' }; }
function calculateScore(d) { if (!d || !d.revenus || d.revenus <= 0) return 0; const r = d.resteAVivre / d.revenus; if (r >= 0.25) return Math.min(100, Math.round(70 + r * 100)); if (r >= 0.10) return Math.round(40 + r * 200); return r > 0 ? Math.max(10, Math.round(r * 400)) : 0; }

// === NAVIGATION ===
function showSection(id) { document.querySelectorAll('.section').forEach(s => s.classList.remove('active')); document.getElementById('section-' + id)?.classList.add('active'); document.querySelectorAll('.sidebar-link').forEach(l => { l.classList.remove('active'); if (l.dataset.section === id) l.classList.add('active'); }); }

// === MODALS ===
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.classList.remove('open'); });

// === INITIALISATION ===
function initDashboard() {
  const plan = getData('plan', 'free');
  const lastTest = getData('lastTest', null);
  const tests = getData('tests', []);
  const savingsGoal = getData('savingsGoal', { objectif: 0, epargne: 0 });
  const subscriptions = getData('subscriptions', []);
  const gambling = getData('gambling', 0);
  const planConfig = PLANS[plan] || PLANS.free;
  const hasPremium = plan !== 'free';

  // Sidebar
  document.getElementById('sidebar-plan').textContent = planConfig.name;
  document.getElementById('sidebar-plan').style.color = planConfig.color;

  // Badges menu
  ['epargne', 'fuites', 'comparateur', 'rappels'].forEach(f => { const b = document.getElementById('badge-' + f); if (b && planConfig.features.includes(f)) b.style.display = 'none'; });
  if (plan === 'complete') { const b = document.getElementById('badge-imprevu'); if (b) b.style.display = 'none'; }

  // Accès sections
  ['epargne', 'fuites', 'comparateur', 'imprevu', 'rappels'].forEach(f => {
    const c = document.getElementById(f + '-content'), l = document.getElementById(f + '-locked'), has = planConfig.features.includes(f);
    if (c) c.style.display = has ? 'block' : 'none';
    if (l) l.style.display = has ? 'none' : 'block';
  });

  // Stats premium row
  const premiumRow = document.getElementById('premium-stats-row');
  if (premiumRow) {
    if (hasPremium) {
      premiumRow.style.display = 'grid';
      const p = savingsGoal.objectif > 0 ? Math.round((savingsGoal.epargne / savingsGoal.objectif) * 100) : 0;
      document.getElementById('stat-epargne').textContent = formatMoney(savingsGoal.epargne);
      document.getElementById('stat-objectif').textContent = formatMoney(savingsGoal.objectif);
      document.getElementById('resume-progress-fill').style.width = p + '%';
      const tf = subscriptions.reduce((s, a) => s + (a.montant || 0), 0) + gambling;
      document.getElementById('stat-fuites').textContent = formatMoney(tf);
    } else {
      premiumRow.style.display = 'none';
    }
  }

  // Résumé financier
  if (!lastTest) {
    document.getElementById('no-test-message').style.display = 'block';
    document.getElementById('stats-grid').style.opacity = '0.5';
    document.getElementById('test-badge').textContent = '—';
    document.getElementById('score-value').textContent = '—';
    document.getElementById('test-title').textContent = 'Aucun test';
    document.getElementById('test-conseil').textContent = 'Faites un test.';
    document.getElementById('test-date').textContent = '';
    if (hasPremium) { document.getElementById('stat-score').textContent = '—'; document.getElementById('stat-score-badge').textContent = '—'; }
  } else {
    document.getElementById('no-test-message').style.display = 'none';
    document.getElementById('stats-grid').style.opacity = '1';
    document.getElementById('stat-revenus').textContent = formatMoney(lastTest.revenus);
    document.getElementById('stat-dep-ess').textContent = formatMoney(lastTest.depensesEssentielles);
    document.getElementById('stat-dep-non-ess').textContent = formatMoney(lastTest.depensesNonEssentielles);
    document.getElementById('stat-reste').textContent = formatMoney(lastTest.resteAVivre);
    
    const score = lastTest.score || calculateScore(lastTest);
    const si = getScoreInfo(score);
    document.getElementById('test-badge').textContent = si.label;
    document.getElementById('test-badge').className = 'badge ' + si.class;
    document.getElementById('score-value').textContent = score;
    document.getElementById('test-title').textContent = si.title;
    document.getElementById('test-conseil').textContent = lastTest.conseil || si.desc;
    document.getElementById('test-date').textContent = 'Test: ' + formatDate(lastTest.date);
    setTimeout(() => { document.getElementById('score-circle').style.strokeDashoffset = 220 - (score / 100) * 220; }, 300);
    
    if (hasPremium) {
      document.getElementById('stat-score').textContent = score + '/100';
      document.getElementById('stat-score-badge').textContent = si.label;
      document.getElementById('stat-score-badge').className = 'badge ' + si.class;
    }
  }

  renderHistorique(tests);
  if (planConfig.features.includes('epargne')) renderEpargne(savingsGoal);
  if (planConfig.features.includes('fuites')) renderFuites(subscriptions, gambling);
}

// === HISTORIQUE ===
function renderHistorique(tests) {
  const tbody = document.getElementById('historique-table');
  document.getElementById('historique-count').textContent = tests.length + ' test' + (tests.length > 1 ? 's' : '');
  if (tests.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Aucun test. <a href="test.html">Faire un test</a></td></tr>'; return; }
  tbody.innerHTML = tests.slice().reverse().map((t, i) => {
    const score = t.score || calculateScore(t), si = getScoreInfo(score), dep = (t.depensesEssentielles || 0) + (t.depensesNonEssentielles || 0);
    return `<tr style="border-bottom:1px solid var(--border-light)"><td style="padding:var(--space-sm)">${formatDate(t.date)}</td><td style="padding:var(--space-sm);text-align:right">${formatMoney(t.revenus)}</td><td style="padding:var(--space-sm);text-align:right">${formatMoney(dep)}</td><td style="padding:var(--space-sm);text-align:right;font-weight:600;color:${t.resteAVivre >= 0 ? 'var(--accent)' : '#dc2626'}">${formatMoney(t.resteAVivre)}</td><td style="padding:var(--space-sm);text-align:center"><span class="badge ${si.class}">${score}</span></td><td style="padding:var(--space-sm)"><button onclick="deleteTest(${tests.length - 1 - i})" style="background:none;border:none;color:#dc2626;cursor:pointer">🗑️</button></td></tr>`;
  }).join('');
}

function deleteTest(i) { if (!confirm('Supprimer ?')) return; const tests = getData('tests', []); tests.splice(i, 1); setData('tests', tests); if (tests.length > 0) setData('lastTest', tests[tests.length - 1]); else localStorage.removeItem('lastTest'); initDashboard(); }

// === ÉPARGNE ===
function renderEpargne(g) {
  if (!g || g.objectif <= 0) { document.getElementById('objectif-montant').textContent = '0 €'; document.getElementById('epargne-actuelle').textContent = '0 €'; document.getElementById('epargne-restante').textContent = '0 €'; document.getElementById('epargne-mensuelle').textContent = '0 €'; document.getElementById('progress-percent').textContent = '0%'; document.getElementById('progress-fill').style.width = '0%'; return; }
  const p = Math.min(100, Math.round((g.epargne / g.objectif) * 100)), r = Math.max(0, g.objectif - g.epargne);
  document.getElementById('objectif-montant').textContent = formatMoney(g.objectif);
  document.getElementById('epargne-actuelle').textContent = formatMoney(g.epargne);
  document.getElementById('epargne-restante').textContent = formatMoney(r);
  document.getElementById('epargne-mensuelle').textContent = formatMoney(r > 0 ? Math.ceil(r / 12) : 0);
  document.getElementById('progress-percent').textContent = p + '%';
  setTimeout(() => { document.getElementById('progress-fill').style.width = p + '%'; }, 300);
}

function saveVersement() { const m = parseFloat(document.getElementById('versement-montant').value) || 0; if (m <= 0) return alert('Montant invalide'); const g = getData('savingsGoal', { objectif: 0, epargne: 0 }); g.epargne = (g.epargne || 0) + m; setData('savingsGoal', g); document.getElementById('versement-montant').value = ''; closeModal('modal-versement'); initDashboard(); }
function saveObjectif() { const o = parseFloat(document.getElementById('objectif-input').value) || 0, e = parseFloat(document.getElementById('epargne-input').value) || 0; setData('savingsGoal', { objectif: o, epargne: e }); closeModal('modal-objectif'); initDashboard(); }

// === FUITES ===
function renderFuites(subs, g) {
  const list = document.getElementById('subscriptions-list');
  if (!subs || subs.length === 0) list.innerHTML = '<li style="color:var(--text-muted)">Aucun</li>';
  else list.innerHTML = subs.map((s, i) => `<li style="display:flex;justify-content:space-between"><span>${s.nom}</span><span><strong>${formatMoney(s.montant)}</strong> <button onclick="deleteAbo(${i})" style="background:none;border:none;color:#dc2626;cursor:pointer">✕</button></span></li>`).join('');
  document.getElementById('gambling-amount').textContent = formatMoney(g);
  document.getElementById('total-fuites').textContent = formatMoney((subs || []).reduce((a, b) => a + (b.montant || 0), 0) + (g || 0));
}

function saveAbonnement() { const n = document.getElementById('abo-nom').value.trim(), m = parseFloat(document.getElementById('abo-montant').value) || 0; if (!n || m <= 0) return alert('Champs invalides'); const subs = getData('subscriptions', []); subs.push({ nom: n, montant: m }); setData('subscriptions', subs); document.getElementById('abo-nom').value = ''; document.getElementById('abo-montant').value = ''; closeModal('modal-abonnement'); initDashboard(); }
function deleteAbo(i) { const subs = getData('subscriptions', []); subs.splice(i, 1); setData('subscriptions', subs); initDashboard(); }
function saveJeux() { setData('gambling', parseFloat(document.getElementById('jeux-montant').value) || 0); closeModal('modal-jeux'); initDashboard(); }
function saveRappel() { setData('rappelConfig', { active: document.getElementById('rappel-toggle').checked, email: document.getElementById('rappel-email').value.trim() }); alert('Enregistré !'); }

// === COMPARATEUR (Essentiel+) ===
function comparerChoix() {
  const plan = getData('plan', 'free');
  if (!PLANS[plan]?.features.includes('comparateur')) { window.location.href = 'tarifs.html'; return; }
  
  const nomA = document.getElementById('choix-a-nom').value || 'Choix A';
  const coutA = parseFloat(document.getElementById('choix-a-cout').value) || 0;
  const dureeA = parseInt(document.getElementById('choix-a-duree').value) || 1;
  const impactA = document.getElementById('choix-a-impact').value;
  const nomB = document.getElementById('choix-b-nom').value || 'Choix B';
  const coutB = parseFloat(document.getElementById('choix-b-cout').value) || 0;
  const dureeB = parseInt(document.getElementById('choix-b-duree').value) || 1;
  const impactB = document.getElementById('choix-b-impact').value;
  
  const totalA = coutA * dureeA, totalB = coutB * dureeB, diff = Math.abs(totalA - totalB);
  
  document.getElementById('result-a-mensuel').textContent = formatMoney(coutA);
  document.getElementById('result-b-mensuel').textContent = formatMoney(coutB);
  document.getElementById('result-a-total').textContent = formatMoney(totalA);
  document.getElementById('result-b-total').textContent = formatMoney(totalB);
  document.getElementById('result-difference').textContent = formatMoney(diff);
  
  let reco = '';
  const box = document.getElementById('recommendation-box');
  if (totalA < totalB) {
    reco = `<strong style="color:var(--accent)">"${nomA}"</strong> coûte ${formatMoney(diff)} de moins.`;
    if (impactA === 'positif') reco += ' Impact positif. Bon choix !';
    box.style.borderColor = 'var(--accent)';
  } else if (totalB < totalA) {
    reco = `<strong style="color:#3b82f6">"${nomB}"</strong> coûte ${formatMoney(diff)} de moins.`;
    if (impactB === 'positif') reco += ' Impact positif. Bon choix !';
    box.style.borderColor = '#3b82f6';
  } else {
    reco = 'Même coût. Choisissez selon préférences.';
    box.style.borderColor = '#6b7280';
  }
  document.getElementById('recommendation-text').innerHTML = reco;
  document.getElementById('compare-result').style.display = 'block';
  document.getElementById('compare-result').scrollIntoView({ behavior: 'smooth' });
}

// === SIMULATEUR IMPRÉVU (Complet uniquement) ===
function simulerImprevu() {
  const plan = getData('plan', 'free');
  if (!PLANS[plan]?.features.includes('imprevu')) { window.location.href = 'tarifs.html'; return; }
  
  const lastTest = getData('lastTest', null);
  if (!lastTest) { alert('Faites d\'abord un test.'); return; }
  
  const montant = parseFloat(document.getElementById('imprevu-montant').value) || 0;
  const mois = parseInt(document.getElementById('imprevu-mois').value) || 1;
  if (montant <= 0) { alert('Montant invalide.'); return; }
  
  const resteActuel = lastTest.resteAVivre || 0;
  const coutMensuel = montant / mois;
  const nouveauReste = resteActuel - coutMensuel;
  const savingsGoal = getData('savingsGoal', { objectif: 0, epargne: 0 });
  
  let status, icon, title, message, impactEpargne;
  const result = document.getElementById('simulator-result');
  
  if (nouveauReste >= resteActuel * 0.5) {
    status = 'success'; icon = '✅'; title = 'Budget absorbable';
    message = `Votre budget absorbe cet imprévu de ${formatMoney(montant)}.`;
    impactEpargne = savingsGoal.epargne >= montant ? `Épargne (${formatMoney(savingsGoal.epargne)}) suffit.` : `Capacité épargne réduite de ${formatMoney(coutMensuel)}/mois.`;
  } else if (nouveauReste >= 0) {
    status = 'warning'; icon = '⚠️'; title = 'Tension financière';
    message = `Imprévu de ${formatMoney(montant)} met budget sous tension.`;
    impactEpargne = 'Pas d\'épargne possible pendant ' + mois + ' mois.';
  } else {
    status = 'danger'; icon = '❌'; title = 'Situation critique';
    message = `Imprévu de ${formatMoney(montant)} dépasse capacité.`;
    impactEpargne = savingsGoal.epargne > 0 ? `Puiser dans épargne (${formatMoney(savingsGoal.epargne)}).` : 'Solution alternative nécessaire.';
  }
  
  result.className = 'simulator-result ' + status;
  document.getElementById('simulator-icon').textContent = icon;
  document.getElementById('simulator-title').textContent = title;
  document.getElementById('simulator-message').textContent = message;
  document.getElementById('sim-reste-actuel').textContent = formatMoney(resteActuel);
  document.getElementById('sim-cout-mensuel').textContent = '-' + formatMoney(coutMensuel);
  document.getElementById('sim-nouveau-reste').textContent = formatMoney(nouveauReste);
  document.getElementById('sim-nouveau-reste').style.color = nouveauReste >= 0 ? 'var(--accent)' : '#dc2626';
  document.getElementById('sim-impact-epargne').textContent = impactEpargne;
  result.style.display = 'block';
  result.scrollIntoView({ behavior: 'smooth' });
}

// === DÉMARRAGE ===
document.addEventListener('DOMContentLoaded', function() {
  initDashboard();
  
  // === EVENT LISTENERS POUR MOBILE ===
  
  // Navigation sidebar - utiliser click uniquement (fonctionne sur mobile aussi)
  document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var section = this.getAttribute('data-section');
      if (section) showSection(section);
    });
  });
  
  // Actions rapides
  document.querySelectorAll('.action-link[data-target]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var target = this.getAttribute('data-target');
      if (target) showSection(target);
    });
  });
  
  // Boutons modals
  var btnVersement = document.getElementById('btn-versement');
  var btnObjectif = document.getElementById('btn-objectif');
  var btnAbonnement = document.getElementById('btn-abonnement');
  var btnJeux = document.getElementById('btn-jeux');
  
  if (btnVersement) btnVersement.addEventListener('click', function() { openModal('modal-versement'); });
  if (btnObjectif) btnObjectif.addEventListener('click', function() { openModal('modal-objectif'); });
  if (btnAbonnement) btnAbonnement.addEventListener('click', function() { openModal('modal-abonnement'); });
  if (btnJeux) btnJeux.addEventListener('click', function() { openModal('modal-jeux'); });
  
  // Boutons save
  var btnSaveVersement = document.getElementById('btn-save-versement');
  var btnSaveObjectif = document.getElementById('btn-save-objectif');
  var btnSaveAbonnement = document.getElementById('btn-save-abonnement');
  var btnSaveJeux = document.getElementById('btn-save-jeux');
  
  if (btnSaveVersement) btnSaveVersement.addEventListener('click', saveVersement);
  if (btnSaveObjectif) btnSaveObjectif.addEventListener('click', saveObjectif);
  if (btnSaveAbonnement) btnSaveAbonnement.addEventListener('click', saveAbonnement);
  if (btnSaveJeux) btnSaveJeux.addEventListener('click', saveJeux);
  
  // Boutons fermer modals
  document.querySelectorAll('[data-close]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var modalId = this.getAttribute('data-close');
      if (modalId) closeModal(modalId);
    });
  });
  
  // Comparateur et Simulateur
  var btnComparer = document.getElementById('btn-comparer');
  var btnSimuler = document.getElementById('btn-simuler');
  var btnRappel = document.getElementById('btn-rappel');
  
  if (btnComparer) btnComparer.addEventListener('click', comparerChoix);
  if (btnSimuler) btnSimuler.addEventListener('click', simulerImprevu);
  if (btnRappel) btnRappel.addEventListener('click', saveRappel);
  
  // Fermer modal en cliquant sur le fond
  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeModal(this.id);
    });
  });
  
  console.log('Dashboard initialisé');
});