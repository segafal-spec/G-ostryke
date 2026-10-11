import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Plus,
  Loader2,
  Award,
  ShieldCheck,
  Lock,
  Search,
  Globe2,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { submitQuestionPlayer, fetchUserSubmittedQuestions } from '../services/firebase';

// Fix icônes par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORIES = [
  { id: 'tech', label: 'Tech & Semi-conducteurs', color: '#6366f1' },
  { id: 'finance', label: 'Finance & Bourses', color: '#10b981' },
  { id: 'luxe', label: 'Luxe & Mode', color: '#f59e0b' },
  { id: 'auto', label: 'Automobile & Mobilité', color: '#06b6d4' },
  { id: 'energie', label: 'Énergie & Pétrole', color: '#f97316' },
  { id: 'industrie', label: 'Industrie & Défense', color: '#64748b' },
  { id: 'aero', label: 'Aéronautique & Spatial', color: '#0ea5e9' },
  { id: 'agro', label: 'Agroalimentaire & FMCG', color: '#84cc16' },
  { id: 'commerce', label: 'E-Commerce & Retail', color: '#ec4899' },
  { id: 'sante', label: 'Santé & Pharma', color: '#14b8a6' },
  { id: 'mines', label: 'Mines & Métaux', color: '#eab308' },
  { id: 'transport', label: 'Transport & Logistique', color: '#a855f7' },
];

const REGIONS = ['Europe', 'Amériques', 'Asie', 'Afrique', 'Moyen-Orient', 'Océanie'];

/**
 * Mini-carte interactive pour sélectionner un point par clic ou recherche
 */
function LeafletPickerMap({ lat, lng, onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const initialLat = Number(lat) || 48.8566;
    const initialLng = Number(lng) || 2.3522;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: lat && lng ? 7 : 3,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      if (lat && lng) {
        const m = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        m.on('dragend', () => {
          const pos = m.getLatLng();
          onLocationSelect(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
        });
        markerRef.current = m;
      }

      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const roundedLat = Number(clickLat.toFixed(5));
        const roundedLng = Number(clickLng.toFixed(5));

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const m = L.marker([roundedLat, roundedLng], { draggable: true }).addTo(map);
          m.on('dragend', () => {
            const pos = m.getLatLng();
            onLocationSelect(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
          });
          markerRef.current = m;
        }
        onLocationSelect(roundedLat, roundedLng);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleSearchCity = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const sLat = Number(parseFloat(data[0].lat).toFixed(5));
        const sLng = Number(parseFloat(data[0].lon).toFixed(5));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([sLat, sLng], 8);
          if (markerRef.current) {
            markerRef.current.setLatLng([sLat, sLng]);
          } else {
            const m = L.marker([sLat, sLng], { draggable: true }).addTo(mapInstanceRef.current);
            m.on('dragend', () => {
              const pos = m.getLatLng();
              onLocationSelect(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
            });
            markerRef.current = m;
          }
        }
        onLocationSelect(sLat, sLng);
      } else {
        alert('Ville ou lieu non trouvé. Vous pouvez directement cliquer sur la carte.');
      }
    } catch (err) {
      console.warn('Erreur géocodage Nominatim :', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une ville pour centrer la carte (ex: Cupertino, Veldhoven...)"
          style={styles.searchInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearchCity(e);
          }}
        />
        <button
          type="button"
          onClick={handleSearchCity}
          disabled={isSearching}
          style={styles.searchBtn}
        >
          {isSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
          <span>Centrer</span>
        </button>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          cursor: 'crosshair',
        }}
      />
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
        💡 <strong>Cliquez sur la carte</strong> pour poser le repère ou déplacez le marqueur à la souris/au doigt.
      </span>
    </div>
  );
}

export default function PlayerContributionsTab({
  authInfo,
  onOpenAuth,
  history = [],
}) {
  const user = authInfo?.user;
  const stats = authInfo?.stats;
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;
  const isAdmin = Boolean(
    authInfo?.isAdmin === true ||
    authInfo?.stats?.is_admin === true ||
    authInfo?.user?.email?.trim().toLowerCase() === 'segafal@gmail.com' ||
    authInfo?.user?.uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2'
  );

  // 1. Calcul d'éligibilité (30 jours d'ancienneté OU 10 manches jouées)
  const accountAgeDays = (() => {
    if (!user) return 0;
    const creationTime = user.metadata?.creationTime;
    if (creationTime) {
      const created = new Date(creationTime).getTime();
      return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
    }
    if (stats?.cree_le?.seconds) {
      return Math.max(0, Math.floor((Date.now() - stats.cree_le.seconds * 1000) / (1000 * 60 * 60 * 24)));
    }
    return 0;
  })();

  const gamesPlayed = stats?.parties_jouees || history?.length || 0;
  const isEligible = isAdmin || accountAgeDays >= 30 || gamesPlayed >= 10;

  // 2. État du formulaire et de la liste
  const [submissions, setSubmissions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });

  // Champs du formulaire
  const [formData, setFormData] = useState({
    texte: '',
    categorie: 'tech',
    difficulte: 'moyen',
    lieu_nom: '',
    pays: '',
    region: 'Europe',
    reponse_lat: '',
    reponse_lng: '',
    explication: '',
    source: '',
  });

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 5000);
  };

  const loadSubmissions = async () => {
    if (!user?.uid) {
      setLoadingList(false);
      return;
    }
    try {
      const list = await fetchUserSubmittedQuestions(user.uid);
      setSubmissions(list);
    } catch (e) {
      console.warn('Erreur chargement questions joueur :', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.texte.trim()) {
      alert('Veuillez renseigner le texte de la question.');
      return;
    }
    if (!formData.lieu_nom.trim() || !formData.pays.trim()) {
      alert('Veuillez renseigner le lieu exact et le pays.');
      return;
    }
    if (formData.reponse_lat === '' || formData.reponse_lng === '') {
      alert('Veuillez cliquer sur la carte pour définir les coordonnées exactes du lieu.');
      return;
    }
    if (!formData.explication.trim()) {
      alert('Une brève explication économique est obligatoire pour instruire les joueurs.');
      return;
    }
    if (!formData.source.trim()) {
      alert('Veuillez fournir un lien source vérifiable (article de presse, site officiel).');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuestionPlayer(formData, user, stats);
      showToast('Votre question a été soumise avec succès ! Elle est désormais en examen dans la file admin.');
      setShowFormModal(false);
      setFormData({
        texte: '',
        categorie: 'tech',
        difficulte: 'moyen',
        lieu_nom: '',
        pays: '',
        region: 'Europe',
        reponse_lat: '',
        reponse_lng: '',
        explication: '',
        source: '',
      });
      loadSubmissions();
    } catch (err) {
      alert('Erreur soumission : ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatedCount = submissions.filter((s) => s.statut_validation === 'validee').length;
  const pendingCount = submissions.filter((s) => s.statut_validation === 'en_attente').length;
  const bonusEarned = validatedCount * 500;

  if (!isUserLoggedIn) {
    return (
      <div style={styles.cardShell}>
        <div style={styles.guestLockedCard}>
          <div style={styles.lockCircle}>
            <Lock size={32} color="#f59e0b" />
          </div>
          <h2 style={styles.lockedHeading}>Connectez-vous pour proposer des questions</h2>
          <p style={styles.lockedSub}>
            Le programme Contributeur Éco permet aux joueurs d’enrichir la base de questions officielle,
            de voir leur pseudo crédité en jeu et de remporter +500 points au classement général par question validée.
          </p>
          <button onClick={onOpenAuth} style={styles.primaryActionBtn}>
            <Sparkles size={16} />
            <span>Créer un compte ou se connecter</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {toastMsg.text && (
        <div style={{ ...styles.toast, ...(toastMsg.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* EN-TÊTE DU PROGRAMME CONTRIBUTEUR */}
      <div style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <div style={styles.badgeEligibleRow}>
            {isEligible ? (
              <span style={styles.eligibleBadge}>
                <ShieldCheck size={13} color="#10b981" />
                <span>Statut Contributeur Actif</span>
              </span>
            ) : (
              <span style={styles.lockedBadge}>
                <Lock size={13} color="#f59e0b" />
                <span>Accès en cours de déblocage</span>
              </span>
            )}
            <span style={styles.bonusTag}>+500 PTS / QUESTION VALIDÉE</span>
          </div>

          <h1 style={styles.heroTitle}>Programme Contributeur Éco</h1>
          <p style={styles.heroDesc}>
            Proposez des questions portant sur des sièges mondiaux, des giga-usines, des hubs financiers ou des sites stratégiques.
            Chaque proposition validée par l'administrateur vous rapporte <strong>+500 points bonus</strong> et affiche fièrement votre signature en jeu.
          </p>
        </div>

        {isEligible && (
          <button
            onClick={() => setShowFormModal(true)}
            style={styles.proposeMainBtn}
          >
            <Plus size={18} />
            <span>Proposer une question</span>
          </button>
        )}
      </div>

      {/* SECTION BLOCAGE PÉDAGOGIQUE SI NON ÉLIGIBLE */}
      {!isEligible && (
        <div style={styles.lockInfoBox}>
          <div style={styles.lockInfoHeader}>
            <Award size={22} color="#f59e0b" />
            <div>
              <h3 style={styles.lockInfoTitle}>Condition de déblocage du statut Contributeur</h3>
              <p style={styles.lockInfoDesc}>
                Afin de préserver la qualité et la véracité des données géopolitiques, la soumission de questions est débloquée dès <strong>30 jours d’ancienneté</strong> OU après <strong>10 manches jouées</strong>.
              </p>
            </div>
          </div>

          <div style={styles.progressRow}>
            {/* Jauge 1 : Ancienneté */}
            <div style={styles.progressCard}>
              <div style={styles.progressMeta}>
                <span style={styles.progressLabel}>Ancienneté du compte</span>
                <strong style={styles.progressVal}>{accountAgeDays} / 30 jours</strong>
              </div>
              <div style={styles.progressBarBg}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${Math.min(100, Math.round((accountAgeDays / 30) * 100))}%`,
                    backgroundColor: accountAgeDays >= 30 ? '#10b981' : '#f59e0b',
                  }}
                />
              </div>
            </div>

            {/* Jauge 2 : Manches jouées */}
            <div style={styles.progressCard}>
              <div style={styles.progressMeta}>
                <span style={styles.progressLabel}>Manches officielles jouées</span>
                <strong style={styles.progressVal}>{gamesPlayed} / 10 manches</strong>
              </div>
              <div style={styles.progressBarBg}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${Math.min(100, Math.round((gamesPlayed / 10) * 100))}%`,
                    backgroundColor: gamesPlayed >= 10 ? '#10b981' : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={styles.lockMotivationFootnote}>
            <Sparkles size={14} color="#10b981" />
            <span>Continuez à jouer les rounds quotidiens pour débloquer votre badge créateur !</span>
          </div>
        </div>
      )}

      {/* KPI STATISTIQUES DES CONTRIBUTIONS DU JOUEUR */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Questions soumises</span>
          <span style={styles.kpiValue}>{submissions.length}</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Validées par l'admin</span>
          <span style={{ ...styles.kpiValue, color: '#10b981' }}>{validatedCount}</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Points bonus gagnés</span>
          <span style={{ ...styles.kpiValue, color: '#f59e0b' }}>
            +{bonusEarned.toLocaleString('fr-FR')} pts
          </span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>En attente d'examen</span>
          <span style={{ ...styles.kpiValue, color: '#38bdf8' }}>{pendingCount}</span>
        </div>
      </div>

      {/* LISTE DES PROPOSITIONS DU JOUEUR */}
      <div style={styles.listSection}>
        <div style={styles.listHeader}>
          <h2 style={styles.listTitle}>Mes questions proposées ({submissions.length})</h2>
          {isEligible && submissions.length > 0 && (
            <button
              onClick={() => setShowFormModal(true)}
              style={styles.smallAddBtn}
            >
              <Plus size={14} />
              <span>Nouvelle question</span>
            </button>
          )}
        </div>

        {loadingList ? (
          <div style={styles.loadingBox}>
            <Loader2 size={24} className="spin" color="#10b981" />
            <span>Chargement de vos contributions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div style={styles.emptyCard}>
            <Send size={36} color="#34d399" />
            <h3 style={styles.emptyTitle}>Vous n'avez pas encore proposé de question</h3>
            <p style={styles.emptyDesc}>
              {isEligible
                ? "Vous avez le statut Contributeur actif ! Proposez votre premier lieu stratégique pour enrichir le jeu."
                : "Dès que vous aurez atteint 30 jours d’ancienneté ou 10 manches jouées, vous pourrez soumettre vos questions ici."}
            </p>
            {isEligible && (
              <button
                onClick={() => setShowFormModal(true)}
                style={styles.proposeMainBtn}
              >
                <Plus size={16} />
                <span>Créer ma première question</span>
              </button>
            )}
          </div>
        ) : (
          <div style={styles.submissionsList}>
            {submissions.map((q) => {
              const isValidated = q.statut_validation === 'validee';
              const isRejected = q.statut_validation === 'rejetee';
              const isPending = !isValidated && !isRejected;

              return (
                <div key={q.id} style={styles.submissionCard}>
                  <div style={styles.subCardTop}>
                    <div style={styles.subCardBadges}>
                      <span
                        style={{
                          ...styles.catBadge,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          color: '#34d399',
                        }}
                      >
                        {(q.categorie || 'tech').toUpperCase()}
                      </span>
                      <span style={styles.diffBadge}>
                        {(q.difficulte || 'moyen').toUpperCase()}
                      </span>
                    </div>

                    {/* Statut de validation */}
                    {isValidated && (
                      <span style={styles.statusValidated}>
                        <CheckCircle2 size={13} />
                        <span>Validée (+500 pts)</span>
                      </span>
                    )}
                    {isPending && (
                      <span style={styles.statusPending}>
                        <Clock size={13} />
                        <span>En examen admin</span>
                      </span>
                    )}
                    {isRejected && (
                      <span style={styles.statusRejected}>
                        <XCircle size={13} />
                        <span>Refusée</span>
                      </span>
                    )}
                  </div>

                  <h3 style={styles.subQuestionText}>{q.texte}</h3>

                  <div style={styles.subLocationRow}>
                    <MapPin size={15} color="#10b981" />
                    <strong>{q.lieu_nom}</strong>
                    <span style={{ color: '#94a3b8' }}>({q.pays}{q.region ? ` • ${q.region}` : ''})</span>
                    <span style={styles.coordPill}>
                      {Number(q.reponse_lat || 0).toFixed(4)}, {Number(q.reponse_lng || 0).toFixed(4)}
                    </span>
                  </div>

                  {q.explication && (
                    <p style={styles.subExpl}>{q.explication}</p>
                  )}

                  {/* Note admin si refusée */}
                  {isRejected && q.note_admin && (
                    <div style={styles.rejectNoteBox}>
                      <AlertCircle size={14} color="#f87171" />
                      <div>
                        <strong>Motif du refus de l'administrateur :</strong>
                        <p style={{ margin: '2px 0 0', color: '#fca5a5', fontSize: '12px' }}>{q.note_admin}</p>
                      </div>
                    </div>
                  )}

                  {isValidated && (
                    <div style={styles.validatedNotice}>
                      <CheckCircle2 size={14} color="#34d399" />
                      <span>Cette question est désormais active dans le catalogue des rounds officiels avec votre signature !</span>
                    </div>
                  )}

                  <div style={styles.subCardFoot}>
                    <span style={styles.dateLabel}>
                      Soumis le : {q.cree_le?.seconds ? new Date(q.cree_le.seconds * 1000).toLocaleDateString('fr-FR') : 'Récemment'}
                    </span>
                    {q.source && (
                      <a href={q.source} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
                        <span>Source vérifiée</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DU FORMULAIRE DE PROPOSITION */}
      {showFormModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} color="#10b981" />
                <h2 style={styles.modalTitle}>Proposer une question officielle</h2>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                style={styles.closeBtn}
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.formContent}>
              {/* Info banner */}
              <div style={styles.formIntroBanner}>
                <Sparkles size={16} color="#f59e0b" />
                <span>
                  Chaque question validée par l'administrateur vous octroie <strong>+500 points au classement général</strong> et affiche <em>"Proposée par @{stats?.pseudo || user.displayName || 'Vous'}"</em> lors du round quotidien.
                </span>
              </div>

              {/* Ligne 1 : Catégorie & Difficulté */}
              <div style={styles.formRow2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Secteur d'activité</label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    style={styles.selectInput}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Niveau de difficulté</label>
                  <select
                    value={formData.difficulte}
                    onChange={(e) => setFormData({ ...formData, difficulte: e.target.value })}
                    style={styles.selectInput}
                  >
                    <option value="facile">Facile (Entreprise très connue)</option>
                    <option value="moyen">Moyen (Siège ou usine spécifique)</option>
                    <option value="difficile">Difficile (Hub pointu / Géopolitique)</option>
                  </select>
                </div>
              </div>

              {/* Ligne 2 : Intitulé de la question */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Intitulé exact de la question <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Où se trouve l'Apple Park, le siège mondial circulaire d'Apple inauguré en 2017 ?"
                  value={formData.texte}
                  onChange={(e) => setFormData({ ...formData, texte: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              {/* Ligne 3 : Nom du lieu & Pays & Région */}
              <div style={styles.formRow3}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lieu exact / Nom du site <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Cupertino, Californie"
                    value={formData.lieu_nom}
                    onChange={(e) => setFormData({ ...formData, lieu_nom: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Pays <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : États-Unis"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Zone géographique</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    style={styles.selectInput}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne 4 : Carte interactive Leaflet Picker */}
              <div style={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>
                    Position géographique sur la carte <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {formData.reponse_lat && formData.reponse_lng && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                      ✓ Point fixé : {formData.reponse_lat}, {formData.reponse_lng}
                    </span>
                  )}
                </div>

                <LeafletPickerMap
                  lat={formData.reponse_lat}
                  lng={formData.reponse_lng}
                  onLocationSelect={(lat, lng) => {
                    setFormData((prev) => ({
                      ...prev,
                      reponse_lat: lat,
                      reponse_lng: lng,
                    }));
                  }}
                />
              </div>

              {/* Ligne 5 : Explication pédagogique */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Explication & Contexte business <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex : Conçu avec Norman Foster, ce campus de 71 hectares a coûté 5 milliards de dollars et abrite plus de 12 000 ingénieurs sous un anneau solaire de verre."
                  value={formData.explication}
                  onChange={(e) => setFormData({ ...formData, explication: e.target.value })}
                  style={styles.textareaInput}
                />
              </div>

              {/* Ligne 6 : Source officielle */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Lien source vérifiée (presse, site officiel) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="Ex : https://www.apple.com/newsroom/..."
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              {/* Boutons d'action */}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={styles.cancelBtn}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Soumettre à l'administrateur</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '4px',
  },
  cardShell: {
    padding: '20px',
  },
  guestLockedCard: {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'rgba(3, 18, 14, 0.9)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '18px',
    maxWidth: '560px',
    margin: '40px auto',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
  },
  lockCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  lockedHeading: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '10px',
  },
  lockedSub: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  primaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
  toastSuccess: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid #10b981',
    color: '#6ee7b7',
  },
  toastError: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
  },
  heroBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    padding: '24px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(3, 18, 14, 0.95) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
  },
  heroLeft: {
    flex: '1 1 320px',
  },
  badgeEligibleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  eligibleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '14px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.35)',
  },
  lockedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '14px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.35)',
  },
  bonusTag: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    padding: '3px 8px',
    borderRadius: '8px',
    letterSpacing: '0.4px',
  },
  heroTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 8px',
    letterSpacing: '-0.3px',
  },
  heroDesc: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.5',
    margin: 0,
  },
  proposeMainBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
    transition: 'all 0.2s',
  },
  lockInfoBox: {
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(245, 158, 11, 0.06)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  lockInfoHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  lockInfoTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#fbbf24',
    margin: '0 0 4px',
  },
  lockInfoDesc: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.45',
    margin: 0,
  },
  progressRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
  },
  progressCard: {
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(3, 18, 14, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  progressVal: {
    fontSize: '12px',
    color: '#ffffff',
  },
  progressBarBg: {
    width: '100%',
    height: '7px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  lockMotivationFootnote: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6ee7b7',
    fontWeight: '600',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(3, 18, 14, 0.75)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  smallAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '13px',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '40px 20px',
    borderRadius: '16px',
    background: 'rgba(3, 18, 14, 0.6)',
    border: '1px dashed rgba(16, 185, 129, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#94a3b8',
    maxWidth: '460px',
    margin: 0,
    lineHeight: '1.45',
  },
  submissionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  submissionCard: {
    padding: '16px 18px',
    borderRadius: '14px',
    background: 'rgba(3, 18, 14, 0.85)',
    border: '1px solid rgba(16, 185, 129, 0.22)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  subCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  subCardBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  catBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid',
  },
  diffBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  statusValidated: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    fontSize: '11px',
    fontWeight: '700',
  },
  statusPending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: '12px',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    fontSize: '11px',
    fontWeight: '700',
  },
  statusRejected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontSize: '11px',
    fontWeight: '700',
  },
  subQuestionText: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    lineHeight: '1.4',
  },
  subLocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  coordPill: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '1px 6px',
    borderRadius: '6px',
    marginLeft: 'auto',
  },
  subExpl: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.45',
    margin: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: '8px 10px',
    borderRadius: '8px',
  },
  rejectNoteBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontSize: '12px',
    color: '#fca5a5',
  },
  validatedNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    fontSize: '12px',
    color: '#34d399',
    fontWeight: '600',
  },
  subCardFoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    fontSize: '11px',
  },
  dateLabel: {
    color: '#64748b',
  },
  sourceLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: '600',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '680px',
    maxHeight: '92vh',
    overflowY: 'auto',
    backgroundColor: '#03140e',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formIntroBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    fontSize: '12px',
    color: '#fde68a',
    lineHeight: '1.4',
  },
  formRow2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  formRow3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#cbd5e1',
  },
  textInput: {
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  selectInput: {
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: '#041712',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  textareaInput: {
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: '12px',
    outline: 'none',
  },
  searchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
  },
};
