import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Trophy,
  Flame,
  Calendar,
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { fetchAdminOverviewStats, fetchAllQuestionsAdmin } from '../../services/firebase';

export default function AdminOverview({ onNavigate, todayDateStr }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roundQuestions, setRoundQuestions] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOverviewStats(todayDateStr);
      setStats(data);

      if (data.todayRound && data.todayRound.ids_questions) {
        const allQ = await fetchAllQuestionsAdmin();
        const matched = data.todayRound.ids_questions.map((id) =>
          allQ.find((q) => q.id === id) || { id, texte: `Question ${id}`, categorie: 'business' }
        );
        setRoundQuestions(matched);
      }
    } catch (err) {
      console.error('Erreur chargement AdminOverview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayDateStr]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>
          Chargement des indicateurs en temps réel...
        </span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 1. Header Section */}
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.pageTitle}>Vue d'ensemble</h1>
          <p style={styles.pageSubtitle}>
            Supervision de l'activité, des joueurs et du round actif ({todayDateStr})
          </p>
        </div>
        <button onClick={loadData} style={styles.refreshBtn} title="Actualiser les indicateurs">
          <RefreshCw size={15} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* 2. Alerte Vivier vide ou Questions en attente */}
      {stats?.totalQuestionsCount === 0 ? (
        <div
          style={{
            ...styles.alertCard,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
          }}
          onClick={() => onNavigate('questions')}
        >
          <div style={styles.alertLeft}>
            <div style={{ ...styles.alertIcon, background: 'rgba(16, 185, 129, 0.25)' }}>
              <Sparkles size={22} color="#10b981" />
            </div>
            <div>
              <strong style={{ ...styles.alertTitle, color: '#34d399' }}>
                Vivier de questions Firestore vide (0 question)
              </strong>
              <p style={styles.alertDesc}>
                Le catalogue contient 231 questions officielles. Cliquez ici pour les synchroniser en un clic et activer le calendrier.
              </p>
            </div>
          </div>
          <button style={{ ...styles.alertActionBtn, background: '#10b981', color: '#03120e' }}>
            <span>Synchroniser</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : stats?.pendingCount > 0 ? (
        <div style={styles.alertCard} onClick={() => onNavigate('validation')}>
          <div style={styles.alertLeft}>
            <div style={styles.alertIcon}>
              <AlertCircle size={22} color="#f59e0b" />
            </div>
            <div>
              <strong style={styles.alertTitle}>
                {stats.pendingCount} question{stats.pendingCount > 1 ? 's' : ''} en attente de validation
              </strong>
              <p style={styles.alertDesc}>
                De nouvelles questions nécessitent une vérification géographique avant de pouvoir être planifiées.
              </p>
            </div>
          </div>
          <button style={styles.alertActionBtn}>
            <span>Examiner</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={styles.alertCardSuccess}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span style={{ fontSize: '13px', color: '#a7f3d0' }}>
              Vivier opérationnel ({stats?.totalQuestionsCount || 0} questions) • Aucune question en attente de modération.
            </span>
          </div>
        </div>
      )}


      {/* 3. Grille des 4 indicateurs clés */}
      <div style={styles.kpiGrid}>
        {/* Parties aujourd'hui */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Parties jouées aujourd'hui</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(16, 185, 129, 0.15)' }}>
              <Flame size={18} color="#10b981" />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {(stats?.gamesToday || 0).toLocaleString('fr-FR')}
          </div>
          <div style={styles.kpiFooter}>
            <span style={styles.kpiSubtext}>
              {stats?.gamesWeek || 0} parties cette semaine (7j)
            </span>
          </div>
        </div>

        {/* Joueurs actifs uniques */}
        <div
          style={{ ...styles.kpiCard, cursor: 'pointer', transition: 'border-color 0.2s ease' }}
          onClick={() => onNavigate('players')}
          title="Cliquez pour ouvrir l'annuaire complet des joueurs et positions par pays"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Joueurs uniques aujourd'hui</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(59, 130, 246, 0.15)' }}>
              <Users size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {stats?.uniquePlayersToday || 0}
          </div>
          <div style={styles.kpiSplitRow}>
            <span style={styles.pillGreen}>
              {stats?.registeredPlayersToday || 0} inscrits
            </span>
            <span style={styles.pillGray}>
              {stats?.anonymousPlayersToday || 0} invités
            </span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#60a5fa', fontWeight: '700' }}>
            <span>Voir l'annuaire & positions par pays</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Score moyen du jour */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Score moyen du jour</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(245, 158, 11, 0.15)' }}>
              <Trophy size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {(stats?.avgScoreToday || 0).toLocaleString('fr-FR')} <span style={{ fontSize: '15px', color: '#94a3b8' }}>/ 5 000 pts</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={styles.kpiSubtext}>
              {stats?.avgScoreToday > 3800 || (stats?.avgScoreToday <= 50 && stats?.avgScoreToday > 38) ? '🔥 Niveau global très élevé' : '⚖️ Calibrage standard'}
            </span>
          </div>
        </div>

        {/* Calendrier / Statut round du jour */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Statut du Round Quotidien</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(168, 85, 247, 0.15)' }}>
              <Calendar size={18} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: stats?.todayRound ? '#34d399' : '#f59e0b', margin: '8px 0' }}>
            {stats?.todayRound ? '✓ Round Officiel Actif' : '⚠️ Non planifié'}
          </div>
          <button onClick={() => onNavigate('calendar')} style={styles.linkTextBtn}>
            <span>Ouvrir le calendrier 30 jours</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 4. Round du jour actif en détail */}
      <div style={styles.roundSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Les 5 questions du round aujourd'hui</h2>
            <p style={styles.sectionDesc}>
              Série active affichée aux joueurs connectés pour la date du {todayDateStr}
            </p>
          </div>
          <button onClick={() => onNavigate('questions')} style={styles.viewAllBtn}>
            <span>Toutes les questions</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {roundQuestions.length > 0 ? (
          <div style={styles.questionsList}>
            {roundQuestions.map((q, idx) => (
              <div key={q.id || idx} style={styles.questionCard}>
                <div style={styles.questionCardNumber}>#{idx + 1}</div>
                <div style={styles.questionCardContent}>
                  <div style={styles.questionMetaRow}>
                    <span style={styles.categoryBadge}>{q.categorie || 'business'}</span>
                    <span style={{ ...styles.diffBadge, ...(q.difficulte === 'difficile' ? styles.diffHard : q.difficulte === 'moyen' ? styles.diffMed : styles.diffEasy) }}>
                      {q.difficulte || 'moyen'}
                    </span>
                    <span style={styles.countryBadge}>
                      <MapPin size={11} style={{ marginRight: '3px' }} />
                      {q.pays || q.region || 'Monde'}
                    </span>
                  </div>
                  <h4 style={styles.questionText}>{q.texte}</h4>
                  <div style={styles.questionSubInfo}>
                    <span style={{ color: '#34d399' }}>Lieu : {q.lieu_nom || 'Coordonnées exactes'}</span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                      [{Number(q.reponse_lat || 0).toFixed(3)}, {Number(q.reponse_lng || 0).toFixed(3)}]
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyRoundBox}>
            <AlertCircle size={24} color="#f59e0b" />
            <span>Aucune question attribuée au round du jour. Rendez-vous dans le Calendrier pour auto-générer.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '28px 36px',
    maxWidth: '1300px',
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    margin: '6px 0 0 0',
    fontSize: '14px',
    color: '#94a3b8',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  alertCard: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '14px',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  alertLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  alertIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(245, 158, 11, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: '15px',
    color: '#fbbf24',
    display: 'block',
    marginBottom: '2px',
  },
  alertDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#cbd5e1',
  },
  alertActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f59e0b',
    color: '#03120e',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  alertCardSuccess: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    padding: '12px 18px',
    marginBottom: '24px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '18px',
    marginBottom: '32px',
  },
  kpiCard: {
    background: 'rgba(15, 23, 42, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  kpiLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  kpiIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
  },
  kpiFooter: {
    fontSize: '12px',
    color: '#64748b',
  },
  kpiSubtext: {
    color: '#94a3b8',
  },
  kpiSplitRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
  },
  pillGreen: {
    fontSize: '11px',
    fontWeight: '700',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  pillGray: {
    fontSize: '11px',
    fontWeight: '600',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  linkTextBtn: {
    background: 'none',
    border: 'none',
    color: '#c084fc',
    fontSize: '12px',
    fontWeight: '700',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  roundSection: {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '18px',
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionDesc: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8',
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px 18px',
    background: 'rgba(3, 18, 14, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    alignItems: 'center',
  },
  questionCardNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    fontWeight: '900',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  questionCardContent: {
    flex: 1,
  },
  questionMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#e2e8f0',
    padding: '2px 7px',
    borderRadius: '4px',
  },
  diffBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '4px',
    textTransform: 'capitalize',
  },
  diffEasy: { background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' },
  diffMed: { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' },
  diffHard: { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' },
  countryBadge: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
  },
  questionText: {
    margin: '0 0 6px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
    lineHeight: '1.4',
  },
  questionSubInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  },
  emptyRoundBox: {
    padding: '30px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    color: '#f59e0b',
    fontSize: '14px',
  },
  loadingContainer: {
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
