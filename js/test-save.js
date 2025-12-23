// ============================================
// SNIPPET À AJOUTER À TEST.HTML
// À placer après le calcul des résultats
// ============================================

// Fonction pour sauvegarder le test dans localStorage
function saveTestToHistory(testData) {
  // Récupérer l'historique existant
  let tests = [];
  try {
    const stored = localStorage.getItem('tests');
    if (stored) tests = JSON.parse(stored);
  } catch (e) {}

  // Créer l'objet test
  const newTest = {
    date: new Date().toISOString(),
    revenus: testData.revenus,
    depensesEssentielles: testData.depensesEssentielles,
    depensesNonEssentielles: testData.depensesNonEssentielles,
    resteAVivre: testData.resteAVivre,
    score: testData.score || calculateTestScore(testData),
    conseil: testData.conseil || ''
  };

  // Ajouter à l'historique
  tests.push(newTest);
  localStorage.setItem('tests', JSON.stringify(tests));

  // Mettre à jour le dernier test
  localStorage.setItem('lastTest', JSON.stringify(newTest));

  return newTest;
}

// Calcul du score basé sur le reste à vivre
function calculateTestScore(data) {
  const ratio = data.resteAVivre / data.revenus;
  if (ratio >= 0.25) return Math.min(100, Math.round(70 + ratio * 100));
  if (ratio >= 0.10) return Math.round(40 + ratio * 200);
  return Math.max(0, Math.round(ratio * 400));
}

// Générer un conseil basé sur le score
function generateConseil(score) {
  if (score >= 70) return 'Votre situation financière est saine. Continuez à épargner régulièrement pour atteindre vos objectifs.';
  if (score >= 40) return 'Quelques ajustements peuvent améliorer votre situation financière. Identifiez les dépenses non essentielles à réduire.';
  return 'Votre reste à vivre est faible. Identifiez les dépenses à réduire en priorité et établissez un budget strict.';
}

// ============================================
// EXEMPLE D'UTILISATION
// À adapter selon la structure de ton test.html
// ============================================

/*
// Quand l'utilisateur soumet le formulaire de test :

function onTestSubmit() {
  // Récupérer les valeurs du formulaire
  const revenus = parseFloat(document.getElementById('revenus').value) || 0;
  const depEss = parseFloat(document.getElementById('depenses-essentielles').value) || 0;
  const depNonEss = parseFloat(document.getElementById('depenses-non-essentielles').value) || 0;
  const resteAVivre = revenus - depEss - depNonEss;

  // Créer l'objet test
  const testData = {
    revenus: revenus,
    depensesEssentielles: depEss,
    depensesNonEssentielles: depNonEss,
    resteAVivre: resteAVivre
  };

  // Calculer le score
  testData.score = calculateTestScore(testData);
  testData.conseil = generateConseil(testData.score);

  // Sauvegarder
  saveTestToHistory(testData);

  // Si connecté, rediriger vers dashboard
  const isLoggedIn = (() => {
    try {
      const s = JSON.parse(localStorage.getItem("auth_session_v1"));
      return !!(s && s.email);
    } catch { return false; }
  })();

  if (isLoggedIn) {
    // Redirection vers le dashboard
    window.location.href = 'dashboard.html';
  } else {
    // Afficher les résultats sur la page
    showResults(testData);
  }
}
*/

// ============================================
// VERSION COMPLÈTE - REMPLACE TON CODE TEST
// ============================================

// Si ton test.html utilise un formulaire, voici comment l'intégrer :
// Ajoute ceci après ton <script> existant ou remplace la logique de calcul

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Adapter ces IDs selon ton formulaire
    const revenus = parseFloat(document.getElementById('revenus')?.value) || 0;
    
    // Si tu as des champs individuels pour les dépenses
    // const loyer = parseFloat(document.getElementById('loyer')?.value) || 0;
    // const transport = parseFloat(document.getElementById('transport')?.value) || 0;
    // etc.

    // Exemple avec champs génériques
    const depEss = parseFloat(document.getElementById('depenses-essentielles')?.value) || 0;
    const depNonEss = parseFloat(document.getElementById('depenses-non-essentielles')?.value) || 0;
    
    const resteAVivre = revenus - depEss - depNonEss;

    const testData = {
      revenus: revenus,
      depensesEssentielles: depEss,
      depensesNonEssentielles: depNonEss,
      resteAVivre: resteAVivre
    };

    testData.score = calculateTestScore(testData);
    testData.conseil = generateConseil(testData.score);

    // Sauvegarder
    saveTestToHistory(testData);

    // Vérifier si connecté
    let isLoggedIn = false;
    try {
      const s = JSON.parse(localStorage.getItem("auth_session_v1"));
      isLoggedIn = !!(s && s.email);
    } catch {}

    // Afficher résultats ou rediriger
    if (isLoggedIn) {
      // Option 1: Rediriger vers dashboard
      // window.location.href = 'dashboard.html';
      
      // Option 2: Afficher résultats puis proposer d'aller au dashboard
      // showResults(testData);
    }
  });
});
