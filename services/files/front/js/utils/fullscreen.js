document.addEventListener('DOMContentLoaded', () => {
    const fullscreenCheckbox = document.getElementById('fullscreenMode');
    
    if (!fullscreenCheckbox) return;

    // Fonctions Fullscreen avec gestion d'erreurs
    async function enterFullscreen() {
        try {
            const el = document.documentElement;
            
            if (el.requestFullscreen) {
                await el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                await el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                await el.msRequestFullscreen();
            }
            
            fullscreenCheckbox.checked = true;
        } catch (err) {
            console.warn('Fullscreen request failed:', err);
            fullscreenCheckbox.checked = false;
        }
    }

    async function exitFullscreen() {
        try {
            // Vérifie qu'on est réellement en fullscreen
            if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            }
            
            fullscreenCheckbox.checked = false;
        } catch (err) {
            console.warn('Exit fullscreen failed:', err);
        }
    }

    // Synchroniser la checkbox avec l'état réel du fullscreen
    function syncCheckboxWithFullscreenState() {
        const isCurrentlyFullscreen = !!(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.msFullscreenElement
        );
        
        fullscreenCheckbox.checked = isCurrentlyFullscreen;
    }

    // Écouter les changements de fullscreen (y compris ESC)
    document.addEventListener('fullscreenchange', syncCheckboxWithFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncCheckboxWithFullscreenState);
    document.addEventListener('msfullscreenchange', syncCheckboxWithFullscreenState);

    // Checkbox toggle
    fullscreenCheckbox.addEventListener('change', () => {
        if (fullscreenCheckbox.checked) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    });

    // Fullscreen avant navigation sur mode de jeu (page d'accueil uniquement)
    const modeCards = document.querySelectorAll('.mode-card:not(.mode-card-disabled)');
    modeCards.forEach(card => {
        card.addEventListener('click', async (e) => {
            if (fullscreenCheckbox.checked) {
                e.preventDefault();
                
                try {
                    await enterFullscreen();
                    // Petit délai pour s'assurer que le fullscreen est actif
                    setTimeout(() => {
                        window.location.href = card.href;
                    }, 100);
                } catch (err) {
                    // Si le fullscreen échoue, naviguer quand même
                    console.warn('Fullscreen before navigation failed:', err);
                    window.location.href = card.href;
                }
            }
        });
    });

    // Synchronisation initiale
    syncCheckboxWithFullscreenState();
});