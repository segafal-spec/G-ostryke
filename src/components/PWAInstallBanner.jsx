import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'application est déjà lancée en mode autonome (PWA installée)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Vérifier si l'utilisateur a fermé la bannière pour cette session
    if (sessionStorage.getItem('bizgames_pwa_dismissed') === 'true') {
      setDismissed(true);
    }

    // Détection iOS (Safari ne supporte pas beforeinstallprompt, mais supporte l'ajout à l'écran d'accueil)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Écouteur standard pour Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setDismissed(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('bizgames_pwa_dismissed', 'true');
  };

  // Ne pas afficher si déjà en PWA, si masqué, ou si pas installable (et pas iOS)
  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <aside
        style={styles.bannerContainer}
        aria-label="Installer BizGames sur votre smartphone"
      >
        <div style={styles.bannerInner}>
          <div style={styles.iconWrapper}>
            <img
              src="/icons/icon-192.png"
              alt="BizGames App Icon"
              style={styles.appIcon}
            />
          </div>

          <div style={styles.textWrapper}>
            <div style={styles.titleRow}>
              <strong style={styles.title}>Installer l'App BizGames</strong>
              <span style={styles.badgeFree}>100% Gratuit</span>
            </div>
            <p style={styles.subtitle}>
              Plein écran, accès instantané & manche du jour en 1 clic.
            </p>
          </div>

          <div style={styles.actionsWrapper}>
            {installed ? (
              <div style={styles.installedBadge}>
                <Check size={16} />
                <span>Installé !</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                style={styles.installBtn}
                title="Installer sur votre smartphone"
              >
                <Download size={15} style={{ marginRight: '6px' }} />
                <span>Installer</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              style={styles.closeBtn}
              title="Fermer"
              aria-label="Fermer la suggestion d'installation"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Guide modal pour iOS Safari */}
      {showIOSGuide && (
        <div style={styles.modalOverlay} onClick={() => setShowIOSGuide(false)}>
          <div
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>
                <Smartphone size={24} color="#38bdf8" />
              </div>
              <h3 style={styles.modalTitle}>Installer sur iPhone / iPad</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <p style={styles.modalDesc}>
              Pour installer BizGames comme une vraie application sur votre écran d'accueil iOS :
            </p>

            <ol style={styles.stepList}>
              <li style={styles.stepItem}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepContent}>
                  Appuyez sur le bouton <strong>Partager</strong> <Share size={15} style={{ verticalAlign: 'middle', margin: '0 4px', color: '#38bdf8' }} /> en bas de votre écran dans Safari.
                </div>
              </li>
              <li style={styles.stepItem}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepContent}>
                  Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong> <PlusSquare size={15} style={{ verticalAlign: 'middle', margin: '0 4px', color: '#10b981' }} />.
                </div>
              </li>
              <li style={styles.stepItem}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepContent}>
                  Appuyez sur <strong>Ajouter</strong> en haut à droite. BizGames apparaîtra directement avec ses icônes d'application !
                </div>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              style={styles.modalGotItBtn}
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  bannerContainer: {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    width: 'calc(100% - 32px)',
    maxWidth: '520px',
    animation: 'slideUp 0.3s ease-out',
  },
  bannerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
  },
  iconWrapper: {
    flexShrink: 0,
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  appIcon: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  textWrapper: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.2px',
  },
  badgeFree: {
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '6px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    textTransform: 'uppercase',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.74rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actionsWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  installBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 14px',
    backgroundColor: '#0284c7',
    backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '700',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
    transition: 'all 0.2s ease',
  },
  installedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    fontSize: '0.78rem',
    fontWeight: '700',
    borderRadius: '10px',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    borderRadius: '6px',
    padding: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 10000,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  modalIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  modalCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  modalDesc: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  stepList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  stepNumber: {
    flexShrink: 0,
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    fontSize: '0.82rem',
    color: '#e2e8f0',
    lineHeight: '1.4',
  },
  modalGotItBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0284c7',
    backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
  },
};
