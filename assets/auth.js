/**
 * nav-auth.js
 * Gestion de l'authentification et de la navigation
 * À inclure sur toutes les pages du site
 */

(function() {
    'use strict';

    // Vérifie si l'utilisateur est connecté
    function isAuthenticated() {
        return localStorage.getItem('auth') === '1';
    }

    // Met à jour l'affichage de la navigation selon l'état de connexion
    function updateNavigation() {
        const authLinks = document.querySelectorAll('[data-auth]');
        const isLoggedIn = isAuthenticated();

        authLinks.forEach(link => {
            const authType = link.getAttribute('data-auth');
            
            if (authType === 'logged-in') {
                // Afficher uniquement si connecté
                link.style.display = isLoggedIn ? '' : 'none';
            } else if (authType === 'logged-out') {
                // Afficher uniquement si déconnecté
                link.style.display = isLoggedIn ? 'none' : '';
            }
        });
    }

    // Fonction de déconnexion
    function logout() {
        localStorage.removeItem('auth');
        window.location.href = '/index.html';
    }

    // Fonction de connexion (à appeler depuis la page login)
    function login() {
        localStorage.setItem('auth', '1');
    }

    // Exposer les fonctions globalement
    window.authManager = {
        isAuthenticated: isAuthenticated,
        updateNavigation: updateNavigation,
        logout: logout,
        login: login
    };

    // Initialiser au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        updateNavigation();

        // Attacher l'événement de déconnexion aux boutons
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        });
    });
})();
