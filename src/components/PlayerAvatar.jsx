import React, { useState, useEffect } from 'react';

/**
 * Composant Avatar Joueur BizGames
 * Affiche la photo officielle du compte (Google ou téléversée dans les paramètres)
 * ou un avatar stylisé avec la première lettre et un dégradé unique si aucune photo n'est disponible.
 */
export default function PlayerAvatar({
  photoUrl,
  pseudo = 'Joueur',
  size = 36,
  borderColor = null,
  borderWidth = 2,
  style = {},
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  // Réinitialiser l'état d'erreur si l'URL de la photo change
  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const cleanPseudo = (pseudo || 'Joueur').trim();
  const initial = (cleanPseudo[0] || 'J').toUpperCase();

  // Palette de dégradés modernes et harmonieux pour les comptes sans photo
  const gradients = [
    'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Émeraude
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Bleu Roi
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Violet
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Ambre / Or
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Rose
    'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', // Cyan
    'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', // Teal
    'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', // Orange
  ];

  // Déterminer un dégradé stable basé sur le pseudo
  let hash = 0;
  for (let i = 0; i < cleanPseudo.length; i++) {
    hash = cleanPseudo.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bgGradient = gradients[Math.abs(hash) % gradients.length];

  const border = borderColor
    ? `${borderWidth}px solid ${borderColor}`
    : '1.5px solid rgba(255, 255, 255, 0.15)';

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    maxWidth: `${size}px`,
    maxHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border,
    boxSizing: 'border-box',
    userSelect: 'none',
    ...style,
  };

  if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim() && !imgError) {
    return (
      <div style={containerStyle} className={className} title={cleanPseudo}>
        <img
          src={photoUrl.trim()}
          alt={cleanPseudo}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...containerStyle,
        background: bgGradient,
        color: '#ffffff',
        fontWeight: '800',
        fontSize: `${Math.max(11, Math.round(size * 0.44))}px`,
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
      }}
      className={className}
      title={cleanPseudo}
    >
      {initial}
    </div>
  );
}
