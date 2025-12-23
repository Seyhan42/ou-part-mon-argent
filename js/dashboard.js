// ============================================
// DASHBOARD.JS - Où part mon argent ?
// ============================================

// ============================================
// PROTECTION AUTH - BLOQUE L'ACCÈS SI NON CONNECTÉ
// ============================================
(function() {
  function isLoggedIn() {
    try {
      const s = JSON.parse(localStorage.getItem("auth_session_v1"));
      return !!(s && s.email);
    } catch { 
      return false; 
    }
  }
  
  // Si pas connecté -> redirection immédiate
  if (!isLoggedIn()) {
    // Empêcher tout affichage de la page
    document.documentElement.style.display = 'none';
    window.location.replace('login.html');
    return;
  }
})();

// Configuration Plans
const PLANS = {
  free: { name: 'Gratuit', epargne: false, fuites: false, rappels: false },
  essential: { name: 'Essentiel', epargne: true, fuites: true, rappels: true },
  complete: { name: 'Complet', epargne: true, fuites: true, rappels: true }
};

// ============================================
// UTILITAIRES
// ============================================
function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getScoreInfo(score) {
  if (score >= 70) return { label: 'Bonne santé', class: 'success', title: 'Bonne gestion budgétaire', desc: 'Votre situation financière est saine. Continuez à épargner régulièrement.' };
  if (score >= 40) return { label: 'À surveiller', class: 'warning', title: 'Budget à optimiser', desc: 'Quelques ajustements peuvent améliorer votre situation.' };
  return { label: 'Attention', class: 'danger', title: 'Budget tendu', desc: 'Votre reste à vivre est faible. Identifiez les dépenses à réduire.' };
}

function calculateScore(data) {
  const ratio = data.resteAVivre / data.revenus;
  if (ratio >= 0.25) return Math.min(100, Math.round(70 + ratio * 100));
  if (ratio >= 0.10) return Math.round(40 + ratio * 200);
  return Math.max(0, Math.round(ratio * 400));
}

function getData(key, defaultValue) {
  try { 
    const val = localStorage.getItem(key); 
    console.log(`[DEBUG] getData('${key}'):`, val);
    if (!val) return defaultValue;
    const parsed = JSON.parse(val);
    console.log(`[DEBUG] Parsed:`, parsed);
    return parsed;
  } 
  catch (e) { 
    console.error(`[DEBUG] Error parsing ${key}:`, e);
    return defaultValue; 
  }
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// INITIALISATION
// ============================================
function initDashboard() {
  console.log('=== INIT DASHBOARD ===');
  
  const plan = getData('plan', 'free');
  const lastTest = getData('lastTest', null);
  const tests = getData('tests', []);
  const savingsGoal = getData('savingsGoal', { objectif: 0, epargne: 0 });
  const subscriptions = getData('subscriptions', []);
  const gambling = getData('gambling', 0);

  console.log('[DEBUG] plan:', plan);
  console.log('[DEBUG] lastTest:', lastTest);
  console.log('[DEBUG] tests:', tests);

  // Plan
  const planName = PLANS[plan]?.name || 'Gratuit';
  console.log('[DEBUG] planName:', planName);
  document.getElementById('user-plan').textContent = planName;
  const hasPremium = plan !== 'free';

  // Gestion accès premium
  togglePremiumSection('epargne', hasPremium);
  togglePremiumSection('fuites', hasPremium);
  togglePremiumSection('rappels', hasPremium);

  // Badges
  document.getElementById('savings-badge').textContent = hasPremium ? 'En cours' : '🔒';
  document.getElementById('savings-badge').className = 'badge ' + (hasPremium ? 'warning' : 'locked');
  document.getElementById('fuites-badge').textContent = hasPremium ? 'Actif' : '🔒';
  document.getElementById('fuites-badge').className = 'badge ' + (hasPremium ? 'success' : 'locked');
  document.getElementById('rappels-badge').textContent = hasPremium ? 'Disponible' : '🔒';
  document.getElementById('rappels-badge').className = 'badge ' + (hasPremium ? 'success' : 'locked');

  // Pas de test ?
  if (!lastTest) {
    console.log('[DEBUG] Pas de lastTest trouvé - affichage message');
    document.getElementById('no-test-message').style.display = 'block';
    document.getElementById('test-badge').textContent = '—';
    renderHistorique([]);
    document.getElementById('year').textContent = new Date().getFullYear();
    return;
  }

  console.log('[DEBUG] lastTest trouvé, affichage des données');
  document.getElementById('no-test-message').style.display = 'none';

  // Résumé financier
  document.getElementById('revenus').textContent = formatMoney(lastTest.revenus);
  document.getElementById('depenses-essentielles').textContent = formatMoney(lastTest.depensesEssentielles);
  document.getElementById('depenses-non-essentielles').textContent = formatMoney(lastTest.depensesNonEssentielles);
  document.getElementById('reste-a-vivre').textContent = formatMoney(lastTest.resteAVivre);

  // Score
  const score = lastTest.score || calculateScore(lastTest);
  const scoreInfo = getScoreInfo(score);
  
  document.getElementById('test-badge').textContent = scoreInfo.label;
  document.getElementById('test-badge').className = 'badge ' + scoreInfo.class;
  document.getElementById('score-value').textContent = score;
  document.getElementById('test-title').textContent = scoreInfo.title;
  document.getElementById('test-description').textContent = lastTest.conseil || scoreInfo.desc;
  document.getElementById('test-date').textContent = 'Dernier test : ' + formatDate(lastTest.date);

  // Animation cercle
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (score / 100) * circumference;
  setTimeout(() => { document.getElementById('score-circle').style.strokeDashoffset = offset; }, 200);

  // Épargne
  if (hasPremium && savingsGoal.objectif > 0) {
    const percent = Math.round((savingsGoal.epargne / savingsGoal.objectif) * 100);
    const restant = savingsGoal.objectif - savingsGoal.epargne;
    const mensuel = Math.ceil(restant / 12);
    
    document.getElementById('objectif-montant').textContent = formatMoney(savingsGoal.objectif);
    document.getElementById('epargne-actuelle').textContent = formatMoney(savingsGoal.epargne);
    document.getElementById('epargne-restante').textContent = formatMoney(restant);
    document.getElementById('epargne-mensuelle').textContent = formatMoney(mensuel);
    document.getElementById('progress-percent').textContent = percent + '%';
    setTimeout(() => { document.getElementById('progress-fill').style.width = percent + '%'; }, 200);
  }

  // Fuites
  if (hasPremium) {
    renderSubscriptions(subscriptions);
    document.getElementById('gambling-amount').textContent = formatMoney(gambling);
    updateTotalFuites(subscriptions, gambling);
  }

  // Historique
  renderHistorique(tests);

  // Footer
  document.getElementById('year').textContent = new Date().getFullYear();
}

function togglePremiumSection(name, hasPremium) {
  const content = document.getElementById(name + '-content');
  const locked = document.getElementById(name + '-locked');
  if (content) content.style.display = hasPremium ? 'block' : 'none';
  if (locked) locked.style.display = hasPremium ? 'none' : 'block';
}

// ============================================
// ABONNEMENTS
// ============================================
function renderSubscriptions(subs) {
  const list = document.getElementById('subscriptions-list');
  if (subs.length === 0) {
    list.innerHTML = '<li>Aucun abonnement</li>';
    return;
  }
  list.innerHTML = subs.map((s, i) => `
    <li style="display: flex; justify-content: space-between;">
      <span>${s.nom}</span>
      <span style="display: flex; align-items: center; gap: 8px;">
        <strong>${formatMoney(s.montant)}</strong>
        <button onclick="deleteAbonnement(${i})" style="background: none; border: none; color: #dc2626; cursor: pointer;">✕</button>
      </span>
    </li>
  `).join('');
}

function updateTotalFuites(subs, gambling) {
  const total = subs.reduce((sum, s) => sum + s.montant, 0) + gambling;
  document.getElementById('total-fuites').textContent = formatMoney(total);
}

function ajouterAbonnement() { document.getElementById('modal-abonnement').style.display = 'flex'; }
function closeAbonnement() { document.getElementById('modal-abonnement').style.display = 'none'; }

function saveAbonnement() {
  const nom = document.getElementById('abo-nom').value.trim();
  const montant = parseFloat(document.getElementById('abo-montant').value) || 0;
  if (!nom || montant <= 0) return alert('Remplissez tous les champs');
  
  const subs = getData('subscriptions', []);
  subs.push({ nom, montant });
  setData('subscriptions', subs);
  document.getElementById('abo-nom').value = '';
  document.getElementById('abo-montant').value = '';
  closeAbonnement();
  initDashboard();
}

function deleteAbonnement(index) {
  const subs = getData('subscriptions', []);
  subs.splice(index, 1);
  setData('subscriptions', subs);
  initDashboard();
}

// ============================================
// JEUX D'ARGENT
// ============================================
function modifierJeux() {
  document.getElementById('jeux-montant').value = getData('gambling', 0);
  document.getElementById('modal-jeux').style.display = 'flex';
}
function closeJeux() { document.getElementById('modal-jeux').style.display = 'none'; }

function saveJeux() {
  const montant = parseFloat(document.getElementById('jeux-montant').value) || 0;
  setData('gambling', montant);
  closeJeux();
  initDashboard();
}

// ============================================
// OBJECTIF ÉPARGNE
// ============================================
function modifierObjectif() {
  const goal = getData('savingsGoal', { objectif: 0, epargne: 0 });
  document.getElementById('objectif-input').value = goal.objectif;
  document.getElementById('epargne-input').value = goal.epargne;
  document.getElementById('modal-objectif').style.display = 'flex';
}
function closeObjectif() { document.getElementById('modal-objectif').style.display = 'none'; }

function saveObjectif() {
  const objectif = parseFloat(document.getElementById('objectif-input').value) || 0;
  const epargne = parseFloat(document.getElementById('epargne-input').value) || 0;
  setData('savingsGoal', { objectif, epargne });
  closeObjectif();
  initDashboard();
}

function ajouterVersement() {
  document.getElementById('versement-montant').value = '';
  document.getElementById('modal-versement').style.display = 'flex';
}
function closeVersement() { document.getElementById('modal-versement').style.display = 'none'; }

function saveVersement() {
  const montant = parseFloat(document.getElementById('versement-montant').value) || 0;
  if (montant <= 0) return alert('Entrez un montant valide');
  
  const goal = getData('savingsGoal', { objectif: 0, epargne: 0 });
  goal.epargne += montant;
  setData('savingsGoal', goal);
  closeVersement();
  initDashboard();
}

// ============================================
// RAPPELS
// ============================================
function saveRappel() {
  const active = document.getElementById('rappel-toggle').checked;
  const email = document.getElementById('rappel-email').value.trim();
  setData('rappelConfig', { active, email });
  alert('Enregistré ! (fonctionnalité bientôt disponible)');
}

// ============================================
// HISTORIQUE
// ============================================
function renderHistorique(tests) {
  const tbody = document.getElementById('historique-table');
  document.getElementById('historique-count').textContent = tests.length + ' test' + (tests.length > 1 ? 's' : '');
  
  if (tests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: var(--space-lg); color: var(--text-muted);">Aucun test</td></tr>';
    return;
  }

  tbody.innerHTML = tests.slice().reverse().map((t, i) => {
    const score = t.score || calculateScore(t);
    const scoreInfo = getScoreInfo(score);
    const totalDep = t.depensesEssentielles + t.depensesNonEssentielles;
    const realIndex = tests.length - 1 - i;
    return `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: var(--space-sm);">${formatDate(t.date)}</td>
        <td style="padding: var(--space-sm); text-align: right;">${formatMoney(t.revenus)}</td>
        <td style="padding: var(--space-sm); text-align: right;">${formatMoney(totalDep)}</td>
        <td style="padding: var(--space-sm); text-align: right; font-weight: 600;">${formatMoney(t.resteAVivre)}</td>
        <td style="padding: var(--space-sm); text-align: center;"><span class="badge ${scoreInfo.class}">${score}</span></td>
        <td style="padding: var(--space-sm); text-align: center;">
          <button onclick="deleteTest(${realIndex})" style="background: none; border: none; color: #dc2626; cursor: pointer;">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function deleteTest(index) {
  if (!confirm('Supprimer ce test ?')) return;
  const tests = getData('tests', []);
  tests.splice(index, 1);
  setData('tests', tests);
  
  if (tests.length > 0) {
    setData('lastTest', tests[tests.length - 1]);
  } else {
    localStorage.removeItem('lastTest');
  }
  initDashboard();
}

function openHistorique() {
  const tests = getData('tests', []);
  const content = document.getElementById('modal-historique-content');
  
  if (tests.length === 0) {
    content.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Aucun test</p>';
  } else {
    content.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: var(--text-sm);">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-light);">
            <th style="text-align: left; padding: var(--space-sm);">Date</th>
            <th style="text-align: right; padding: var(--space-sm);">Revenus</th>
            <th style="text-align: right; padding: var(--space-sm);">Dép. Ess.</th>
            <th style="text-align: right; padding: var(--space-sm);">Dép. Non Ess.</th>
            <th style="text-align: right; padding: var(--space-sm);">Reste</th>
            <th style="text-align: center; padding: var(--space-sm);">Score</th>
          </tr>
        </thead>
        <tbody>
          ${tests.slice().reverse().map(t => {
            const score = t.score || calculateScore(t);
            const scoreInfo = getScoreInfo(score);
            return `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: var(--space-sm);">${formatDate(t.date)}</td>
                <td style="padding: var(--space-sm); text-align: right;">${formatMoney(t.revenus)}</td>
                <td style="padding: var(--space-sm); text-align: right;">${formatMoney(t.depensesEssentielles)}</td>
                <td style="padding: var(--space-sm); text-align: right;">${formatMoney(t.depensesNonEssentielles)}</td>
                <td style="padding: var(--space-sm); text-align: right; font-weight: 600;">${formatMoney(t.resteAVivre)}</td>
                <td style="padding: var(--space-sm); text-align: center;"><span class="badge ${scoreInfo.class}">${score}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
  document.getElementById('modal-historique').style.display = 'flex';
}

function closeHistorique() { document.getElementById('modal-historique').style.display = 'none'; }

// Fermer modals en cliquant dehors
document.addEventListener('click', (e) => {
  ['modal-historique', 'modal-versement', 'modal-objectif', 'modal-abonnement', 'modal-jeux'].forEach(id => {
    if (e.target.id === id) document.getElementById(id).style.display = 'none';
  });
});

// Démarrage
document.addEventListener('DOMContentLoaded', initDashboard);