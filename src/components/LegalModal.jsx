import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Users,
  Lock,
  Mail,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Globe2,
} from 'lucide-react';

export default function LegalModal({ initialTab = 'mentions', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'mentions');

  const tabs = [
    { id: 'mentions', label: 'Mentions Légales', icon: <FileText size={16} /> },
    { id: 'about', label: 'Qui sommes-nous ?', icon: <Users size={16} /> },
    { id: 'privacy', label: 'Confidentialité & RGPD', icon: <Lock size={16} /> },
    { id: 'cgu', label: 'Conditions Générales (CGU)', icon: <ShieldCheck size={16} /> },
    { id: 'contact', label: 'Contact & Support', icon: <Mail size={16} /> },
  ];

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div style={styles.header}>
          <div style={styles.headerTitleRow}>
            <div style={styles.headerIconWrap}>
              <Globe2 size={20} color="#10b981" />
            </div>
            <div>
              <h2 style={styles.title}>BizGames — Informations Légales</h2>
              <p style={styles.subtitle}>Plateforme de géographie business et culture économique mondiale</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Fermer la fenêtre">
            <X size={20} />
          </button>
        </div>

        {/* Barre d'onglets */}
        <div style={styles.tabBar}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  ...styles.tabBtn,
                  ...(isActive ? styles.tabBtnActive : {}),
                }}
              >
                <span style={{ color: isActive ? '#10b981' : '#94a3b8' }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenu déroulant */}
        <div style={styles.contentBody}>
          {/* 1. MENTIONS LÉGALES */}
          {activeTab === 'mentions' && (
            <div style={styles.section}>
              <h3 style={styles.sectionHeading}>1. Éditeur de la Plateforme</h3>
              <p style={styles.paragraph}>
                Le site web <strong>BizGames</strong> (accessible à l'adresse <code>https://bizgames-game.web.app</code>) est une plateforme ludique et éducative consacrée à la découverte des hubs économiques, sièges sociaux et acteurs majeurs du business mondial.
              </p>
              <div style={styles.infoBox}>
                <div><strong>Nom du projet :</strong> BizGames</div>
                <div><strong>Directeur de la publication :</strong> Équipe BizGames</div>
                <div><strong>Contact de publication :</strong> contact@bizgames.app / support@bizgames.app</div>
                <div><strong>Nature du service :</strong> Jeu en ligne gratuit d'apprentissage et de culture économique générale</div>
              </div>

              <h3 style={styles.sectionHeading}>2. Hébergement</h3>
              <p style={styles.paragraph}>
                La plateforme BizGames est hébergée sur l'infrastructure sécurisée de haute disponibilité de :
              </p>
              <div style={styles.infoBox}>
                <div><strong>Hébergeur :</strong> Google Cloud Platform / Firebase Hosting</div>
                <div><strong>Fournisseur :</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande</div>
                <div><strong>Datacenters :</strong> Union Européenne (RGPD compliant) & distribution CDN mondiale SSL/TLS</div>
              </div>

              <h3 style={styles.sectionHeading}>3. Propriété Intellectuelle</h3>
              <p style={styles.paragraph}>
                L'ensemble des éléments composant le site BizGames (structure, textes, graphismes, codes sources, bases de données de questions, visualisations 3D) sont protégés par les lois en vigueur relatives au droit d'auteur et à la propriété intellectuelle.
              </p>
              <p style={styles.paragraph}>
                Les marques, logos et noms d'entreprises cités dans le cadre des questions culturelles demeurent la propriété exclusive de leurs détenteurs respectifs et sont utilisés à des fins purement pédagogiques et illustratives de culture générale.
              </p>
            </div>
          )}

          {/* 2. QUI SOMMES-NOUS ? */}
          {activeTab === 'about' && (
            <div style={styles.section}>
              <h3 style={styles.sectionHeading}>Notre Mission : Rendre la Culture Économique Accessible & Captivante</h3>
              <p style={styles.paragraph}>
                <strong>BizGames</strong> est né d'une passion commune pour la géographie économique, l'entrepreneuriat et les jeux d'investigation cartographique.
              </p>
              <p style={styles.paragraph}>
                À l'ère où l'économie mondiale façonne notre quotidien, situer les places financières, les giga-usines de haute technologie, les fleurons industriels et les empires du luxe mondial reste souvent abstrait. BizGames transforme cette découverte en un rituel quotidien de <strong>5 minutes par jour</strong>, simple, interactif et stimulant.
              </p>

              <div style={styles.cardsGrid}>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconWrap}>🌍</div>
                  <h4 style={styles.featureTitle}>Exploration 3D & Cartographique</h4>
                  <p style={styles.featureDesc}>
                    Visualisez la Terre sur un globe 3D interactif et zoomez sur les frontières détaillées, les régions et les hubs économiques avec une précision au kilomètre.
                  </p>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureIconWrap}>⚡</div>
                  <h4 style={styles.featureTitle}>100% Gratuit & Sans Barrière</h4>
                  <p style={styles.featureDesc}>
                    Aucun abonnement, aucun paywall, aucun achat intégré. BizGames est pensé pour être accessible à chaque étudiant, professionnel ou passionné.
                  </p>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureIconWrap}>🏆</div>
                  <h4 style={styles.featureTitle}>Fair-play & Esprit de Défi</h4>
                  <p style={styles.featureDesc}>
                    Un défi officiel par jour, un score calculé scientifiquement selon la formule Haversine, des badges et un classement partagé sans spoiler.
                  </p>
                </div>
              </div>

              <div style={{ ...styles.infoBox, marginTop: '20px' }}>
                <strong>Vous avez une idée de question ou un partenariat ?</strong>
                <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
                  Nous enrichissons constamment notre base de données économique avec des entreprises de toutes les régions du monde. Écrivez-nous à <code>contact@bizgames.app</code> !
                </p>
              </div>
            </div>
          )}

          {/* 3. CONFIDENTIALITÉ & RGPD */}
          {activeTab === 'privacy' && (
            <div style={styles.section}>
              <h3 style={styles.sectionHeading}>1. Respect de Votre Vie Privée & Données Personnelles</h3>
              <p style={styles.paragraph}>
                Chez BizGames, nous appliquons le principe de <strong>minimisation stricte des données</strong> (RGPD / GDPR). Nous ne demandons et ne stockons que les informations strictement nécessaires au bon déroulement du jeu :
              </p>

              <ul style={styles.bulletList}>
                <li><strong>Identifiant de joueur :</strong> Pseudo choisi par vous-même et avatar sélectionné.</li>
                <li><strong>Scores et séries :</strong> Vos points, distances calculées et séries quotidiennes (streaks) pour l'affichage de vos statistiques et du classement.</li>
                <li><strong>Authentification (optionnelle) :</strong> Adresse email uniquement si vous choisissez d'enregistrer votre compte pour synchroniser votre progression entre vos appareils.</li>
              </ul>

              <h3 style={styles.sectionHeading}>2. Zéro Vente de Données Personnelles</h3>
              <p style={styles.paragraph}>
                <strong>Nous ne vendons, ne louons et ne commercialisons aucune de vos données personnelles à des tiers.</strong> Vos données de jeu servent exclusivement à l'expérience BizGames et au classement des joueurs.
              </p>

              <h3 style={styles.sectionHeading}>3. Cookies & Stockage Local</h3>
              <p style={styles.paragraph}>
                BizGames utilise le <code>localStorage</code> de votre navigateur pour conserver votre progression locale et garantir que votre partie ne soit pas perdue en cas d'interruption. Aucun traceur publicitaire intrusif n'est déposé.
              </p>

              <h3 style={styles.sectionHeading}>4. Vos Droits (Accès, Rectification, Suppression)</h3>
              <p style={styles.paragraph}>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit permanent d'accès, de rectification et de suppression totale de vos données. Vous pouvez supprimer votre compte à tout moment directement depuis vos paramètres ou en adressant une demande par email à <code>dpo@bizgames.app</code>.
              </p>
            </div>
          )}

          {/* 4. CGU */}
          {activeTab === 'cgu' && (
            <div style={styles.section}>
              <h3 style={styles.sectionHeading}>Conditions Générales d'Utilisation (CGU)</h3>
              <p style={styles.paragraph}>
                L'utilisation du service BizGames implique l'acceptation pleine et entière des conditions d'utilisation décrites ci-après.
              </p>

              <h4 style={styles.subHeading}>Article 1 — Accès au Service</h4>
              <p style={styles.paragraph}>
                BizGames est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Le service est ouvert à tous sans distinction. L'éditeur s'efforce de garantir une disponibilité 24/7 mais ne saurait être tenu responsable d'interruptions techniques liées à la maintenance ou au réseau.
              </p>

              <h4 style={styles.subHeading}>Article 2 — Règles du Jeu & Fair-Play</h4>
              <p style={styles.paragraph}>
                Chaque joueur s'engage à respecter les principes de loyauté et de fair-play :
              </p>
              <ul style={styles.bulletList}>
                <li>Une seule participation par joueur et par jour pour le Défi Quotidien officiel.</li>
                <li>Interdiction absolue de recourir à des scripts, robots automatisés ou exploits techniques pour fausser les scores ou les classements.</li>
                <li>Choix d'un pseudo respectueux : tout pseudonyme haineux, diffamatoire ou illégal pourra être supprimé sans préavis.</li>
              </ul>

              <h4 style={styles.subHeading}>Article 3 — Limitation de Responsabilité</h4>
              <p style={styles.paragraph}>
                Les informations géographiques et économiques fournies dans le cadre des quiz sont vérifiées avec le plus grand soin par notre équipe. Cependant, des évolutions d'actualité (déménagements de sièges, fusions-acquisitions) peuvent survenir. L'éditeur ne saurait être tenu responsable d'éventuelles inexactitudes mineures.
              </p>
            </div>
          )}

          {/* 5. CONTACT & SUPPORT */}
          {activeTab === 'contact' && (
            <div style={styles.section}>
              <h3 style={styles.sectionHeading}>Besoin d'aide, une suggestion ou une question ?</h3>
              <p style={styles.paragraph}>
                L'équipe BizGames est à votre écoute pour améliorer constamment le jeu, corriger un bug ou accueillir vos propositions d'énigmes économiques.
              </p>

              <div style={styles.contactGrid}>
                <div style={styles.contactCard}>
                  <Mail size={22} color="#10b981" />
                  <h4 style={styles.contactTitle}>Support Joueurs & Technique</h4>
                  <p style={styles.contactDesc}>Une question sur votre compte, un bug d'affichage ou un score ?</p>
                  <a href="mailto:support@bizgames.app" style={styles.contactLink}>support@bizgames.app</a>
                </div>

                <div style={styles.contactCard}>
                  <Users size={22} color="#f59e0b" />
                  <h4 style={styles.contactTitle}>Partenariats & Écoles</h4>
                  <p style={styles.contactDesc}>Vous souhaitez utiliser BizGames dans votre école de commerce ou entreprise ?</p>
                  <a href="mailto:partenariats@bizgames.app" style={styles.contactLink}>partenariats@bizgames.app</a>
                </div>

                <div style={styles.contactCard}>
                  <ShieldCheck size={22} color="#38bdf8" />
                  <h4 style={styles.contactTitle}>Délégué aux Données (DPO)</h4>
                  <p style={styles.contactDesc}>Exercer vos droits RGPD, demander l'export ou la suppression de vos données :</p>
                  <a href="mailto:dpo@bizgames.app" style={styles.contactLink}>dpo@bizgames.app</a>
                </div>
              </div>

              <div style={{ ...styles.infoBox, marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', marginBottom: '4px' }}>
                  <CheckCircle2 size={16} />
                  <span>Délai moyen de réponse</span>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                  Notre équipe répond généralement sous 24 à 48 heures ouvrées.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pied du modal */}
        <div style={styles.footer}>
          <span style={styles.footerNote}>© 2026 BizGames • Plateforme 100% Gratuite • Tous droits réservés</span>
          <button onClick={onClose} style={styles.closeActionBtn}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#0a0f1d',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '820px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.1)',
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
  },
  subtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '3px 0 0',
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  tabBtnActive: {
    background: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    color: '#34d399',
  },
  contentBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    color: '#cbd5e1',
    lineHeight: '1.65',
    fontSize: '14px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeading: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '12px 0 4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  subHeading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#34d399',
    margin: '8px 0 2px',
  },
  paragraph: {
    margin: '0 0 8px',
    color: '#cbd5e1',
    fontSize: '13.5px',
  },
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  bulletList: {
    margin: '4px 0 12px',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13.5px',
    color: '#cbd5e1',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginTop: '12px',
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '16px',
  },
  featureIconWrap: {
    fontSize: '24px',
    marginBottom: '8px',
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 6px',
  },
  featureDesc: {
    fontSize: '12.5px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.5',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginTop: '10px',
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  contactTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  contactDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.4',
  },
  contactLink: {
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    gap: '12px',
    flexWrap: 'wrap',
  },
  footerNote: {
    fontSize: '12px',
    color: '#64748b',
  },
  closeActionBtn: {
    padding: '8px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#03120e',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
