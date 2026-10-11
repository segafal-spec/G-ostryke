import React from 'react';
import { CheckCircle2, Navigation } from 'lucide-react';

export default function ValidationBar({ hasGuess, onValidate, isSubmitting }) {
  return (
    <div style={styles.container}>
      <button
        onClick={onValidate}
        disabled={!hasGuess || isSubmitting}
        className={hasGuess ? 'geo-btn-green' : ''}
        style={{
          ...styles.buttonBase,
          ...(hasGuess ? styles.buttonActive : styles.buttonDisabled),
        }}
      >
        {hasGuess ? (
          <>
            <CheckCircle2 size={20} />
            <span>CONFIRMER L'ESTIMATION</span>
          </>
        ) : (
          <>
            <Navigation size={18} style={styles.iconPulse} />
            <span>CLIQUEZ SUR LE GLOBE POUR VISER</span>
          </>
        )}
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: 'calc(var(--safe-bottom) + 20px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 999,
    width: 'calc(100% - 24px)',
    maxWidth: '440px',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  buttonBase: {
    pointerEvents: 'auto',
    width: '100%',
    padding: '15px 24px',
    borderRadius: '9999px',
    fontSize: '15px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    background: 'var(--geo-green)',
    color: '#122803',
    boxShadow: '0 5px 0 var(--geo-green-shadow), 0 10px 24px rgba(104, 222, 24, 0.45)',
  },
  buttonDisabled: {
    background: 'rgba(32, 27, 63, 0.95)',
    color: '#7a71a3',
    border: '1px solid #352d62',
    cursor: 'not-allowed',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
  },
  iconPulse: {
    opacity: 0.85,
    animation: 'spin 4s linear infinite',
  },
};
