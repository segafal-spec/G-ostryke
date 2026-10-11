import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Search,
  Replace,
  Save,
  X,
  Plus,
  Trash2,
  MapPin,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  fetchDailyRoundsRange,
  fetchAllQuestionsAdmin,
  saveDailyRound,
  autoGenerateUpcomingRounds,
  autoEnsureDailyRoundsBuffer,
  syncCatalogQuestionsAdmin,
} from '../../services/firebase';
import questionsPool from '../../../data/questions.json';


const CATEGORY_COLORS = {
  tech: '#38bdf8',
  finance: '#f59e0b',
  luxe: '#e879f9',
  auto: '#fb923c',
  energie: '#facc15',
  industrie: '#94a3b8',
  aero: '#818cf8',
  agro: '#4ade80',
  commerce: '#2dd4bf',
  sante: '#f43f5e',
  mines: '#d97706',
  transport: '#60a5fa',
};

export default function AdminCalendar({ user, todayDateStr }) {
  const [roundsMap, setRoundsMap] = useState({});
  const [questionsMap, setQuestionsMap] = useState({});
  const [validatedQuestions, setValidatedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date sélectionnée pour édition
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Modale de remplacement d'une question
  const [replacingSlotIndex, setReplacingSlotIndex] = useState(null); // 0..4
  const [replaceSearch, setReplaceSearch] = useState('');
  const [replaceCategory, setReplaceCategory] = useState('all');

  const adminUid = user?.uid || 'admin';

  // Calcul de la plage de dates (aujourd'hui - 3 jours jusqu'à aujourd'hui + 35 jours)
  const dateRange = useMemo(() => {
    const list = [];
    const base = new Date(todayDateStr + 'T00:00:00');
    // 3 jours passés
    for (let i = -3; i <= 32; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [todayDateStr]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rounds, allQ] = await Promise.all([
        fetchDailyRoundsRange(dateRange[0], dateRange[dateRange.length - 1]),
        fetchAllQuestionsAdmin(),
      ]);

      const rMap = {};
      rounds.forEach((r) => {
        rMap[r.date] = r;
      });
      setRoundsMap(rMap);

      const qMap = {};
      allQ.forEach((q) => {
        qMap[q.id] = q;
      });
      setQuestionsMap(qMap);

      // Questions validées et actives pour le remplacement
      const valids = allQ.filter((q) => q.actif !== false && q.statut_validation === 'validee');
      setValidatedQuestions(valids);

      // Auto-renouvellement transparent si moins de 7 jours de rounds d'avance
      if (valids.length >= 5) {
        autoEnsureDailyRoundsBuffer(todayDateStr, 7, 35, adminUid).then((res) => {
          if (res?.triggered) {
            showToast(`⚡ Renouvellement automatique : ${res.generatedCount} rounds planifiés pour maintenir le cycle !`);
            // Recharger la plage de dates mise à jour
            fetchDailyRoundsRange(dateRange[0], dateRange[dateRange.length - 1]).then((freshRounds) => {
              const freshMap = {};
              freshRounds.forEach((r) => { freshMap[r.date] = r; });
              setRoundsMap(freshMap);
            });
          }
        }).catch((e) => console.warn('Auto-buffer check error:', e));
      }
    } catch (err) {
      console.error('Erreur chargement AdminCalendar :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayDateStr]);

  const [isSyncingFromCal, setIsSyncingFromCal] = useState(false);

  const showToast = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // Synchroniser le catalogue local (231 questions) directement depuis le calendrier
  const handleSyncCatalog = async () => {
    if (!questionsPool || questionsPool.length === 0) {
      alert('Catalogue local introuvable.');
      return;
    }
    setIsSyncingFromCal(true);
    try {
      const res = await syncCatalogQuestionsAdmin(questionsPool);
      showToast(`⚡ ${res.count} questions du catalogue synchronisées dans Firestore !`);
      await loadData();
      return true;
    } catch (err) {
      console.error('Erreur synchronisation catalogue depuis calendrier :', err);
      alert('Erreur lors de la synchronisation : ' + err.message);
      return false;
    } finally {
      setIsSyncingFromCal(false);
    }
  };

  // Auto-génération des 30 prochains jours
  const handleAutoGenerate = async () => {
    // Si le vivier contient moins de 5 questions validées, proposer la synchronisation immédiate
    if (validatedQuestions.length < 5) {
      const confirmSync = window.confirm(
        `Le vivier Firestore ne contient que ${validatedQuestions.length} question(s) validée(s) (minimum 5 requises pour planifier des rounds).\n\n` +
        `Souhaitez-vous synchroniser automatiquement les ${questionsPool?.length || 231} questions du catalogue officiel maintenant pour débloquer la planification ?`
      );
      if (confirmSync) {
        const ok = await handleSyncCatalog();
        if (!ok) return;
      } else {
        return;
      }
    }

    if (!window.confirm('Voulez-vous auto-générer les rounds des 30 prochains jours ? Les rounds passés ne seront pas écrasés.')) {
      return;
    }
    setIsGenerating(true);
    try {
      const count = await autoGenerateUpcomingRounds(todayDateStr, 31, adminUid);
      showToast(`⚡ ${count} rounds quotidiens ont été générés et planifiés avec succès !`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération automatique : ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };


  // Round actuellement sélectionné
  const currentRound = roundsMap[selectedDate];
  const currentRoundQuestions = (currentRound?.ids_questions || []).map(
    (id) => questionsMap[id] || { id, texte: `Question [${id}]`, categorie: 'business', difficulte: 'moyen' }
  );

  // Remplacer une question du round
  const handleSelectReplacement = async (newQ) => {
    if (replacingSlotIndex === null) return;
    const currentIds = [...(currentRound?.ids_questions || [])];
    currentIds[replacingSlotIndex] = newQ.id;

    const updatedRound = {
      date: selectedDate,
      ids_questions: currentIds,
      statut: currentIds.length === 5 ? 'planifie' : 'incomplet',
      modifie_par: adminUid,
    };

    try {
      await saveDailyRound(updatedRound);
      setRoundsMap((prev) => ({ ...prev, [selectedDate]: updatedRound }));
      showToast(`Question #${replacingSlotIndex + 1} remplacée par "${newQ.lieu_nom || newQ.id}" !`);
      setReplacingSlotIndex(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du remplacement : ' + err.message);
    }
  };

  // Questions candidates pour le remplacement
  const filteredReplacementCandidates = useMemo(() => {
    return validatedQuestions.filter((q) => {
      // Exclure les questions déjà dans ce round
      if ((currentRound?.ids_questions || []).includes(q.id)) return false;
      // Catégorie
      if (replaceCategory !== 'all' && q.categorie !== replaceCategory) return false;
      // Recherche
      if (replaceSearch.trim()) {
        const query = replaceSearch.toLowerCase();
        return (
          (q.texte || '').toLowerCase().includes(query) ||
          (q.lieu_nom || '').toLowerCase().includes(query) ||
          (q.pays || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [validatedQuestions, currentRound, replaceCategory, replaceSearch]);

  return (
    <div style={styles.container}>
      {/* 1. Header Row */}
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.pageTitle}>Calendrier des Rounds (30 Jours)</h1>
          <p style={styles.pageSubtitle}>
            Planifiez, inspectez et modifiez les rounds quotidiens officiels de BizGames
          </p>
        </div>

        <button
          onClick={handleAutoGenerate}
          disabled={isGenerating}
          style={styles.autoGenBtn}
        >
          <Sparkles size={16} />
          <span>{isGenerating ? 'Génération en cours...' : 'Auto-générer les 30 prochains jours'}</span>
        </button>
      </div>

      {toastMsg && (
        <div style={styles.toastSuccess}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Alerte vivier insuffisant si < 5 questions */}
      {validatedQuestions.length < 5 && !loading && (
        <div style={styles.insufficientPoolBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#fbbf24', fontSize: '14px', display: 'block' }}>
                Vivier Firestore insuffisant ({validatedQuestions.length}/5 questions validées)
              </strong>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Pour générer automatiquement les 30 prochains jours de rounds quotidiens, synchronisez les {questionsPool?.length || 231} questions du catalogue officiel.
              </span>
            </div>
          </div>
          <button
            onClick={handleSyncCatalog}
            disabled={isSyncingFromCal}
            style={styles.syncFromCalBtn}
          >
            <RefreshCw size={15} className={isSyncingFromCal ? 'spin' : ''} />
            <span>{isSyncingFromCal ? 'Synchronisation...' : `Synchroniser catalogue (${questionsPool?.length || 231})`}</span>
          </button>
        </div>
      )}


      {/* Légende des statuts */}
      <div style={styles.legendRow}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: '#10b981' }} />
          <span>Complet (5 questions planifiées)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: '#f59e0b' }} />
          <span>Incomplet (&lt; 5 questions)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: '#3b82f6' }} />
          <span>Déjà joué (date passée)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: '#475569' }} />
          <span>Non généré</span>
        </div>
      </div>

      {/* 2. Layout principal : Grille Calendrier à gauche, Panneau d'édition du jour à droite */}
      <div style={styles.mainLayout}>
        {/* Grille Calendrier (CSS Grid) */}
        <div style={styles.calendarCard}>
          <div style={styles.gridContainer}>
            {dateRange.map((dateStr) => {
              const r = roundsMap[dateStr];
              const isPast = dateStr < todayDateStr;
              const isToday = dateStr === todayDateStr;
              const isSelected = dateStr === selectedDate;
              const count = r?.ids_questions?.length || 0;

              let statusColor = '#475569'; // gris par défaut (non généré)
              if (isPast) statusColor = '#3b82f6'; // bleu : date passée
              else if (count === 5) statusColor = '#10b981'; // vert : complet
              else if (count > 0) statusColor = '#f59e0b'; // orange : incomplet

              const dObj = new Date(dateStr + 'T00:00:00');
              const dayName = dObj.toLocaleDateString('fr-FR', { weekday: 'short' });
              const dayNum = dObj.getDate();
              const monthName = dObj.toLocaleDateString('fr-FR', { month: 'short' });

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    ...styles.dayCell,
                    borderColor: isSelected ? '#10b981' : isToday ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.08)',
                    background: isSelected
                      ? 'rgba(16, 185, 129, 0.12)'
                      : isToday
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(15, 23, 42, 0.6)',
                  }}
                >
                  <div style={styles.dayTopRow}>
                    <span style={styles.dayName}>{dayName}</span>
                    <span
                      style={{
                        ...styles.statusPill,
                        backgroundColor: statusColor,
                      }}
                    />
                  </div>

                  <div style={styles.dayNumRow}>
                    <span style={{ ...styles.dayNum, color: isToday ? '#fbbf24' : '#ffffff' }}>
                      {dayNum}
                    </span>
                    <span style={styles.monthName}>{monthName}</span>
                  </div>

                  {/* Badges de catégories des 5 questions */}
                  <div style={styles.categoryDotsRow}>
                    {r?.ids_questions && r.ids_questions.length > 0 ? (
                      r.ids_questions.slice(0, 5).map((qid, idx) => {
                        const q = questionsMap[qid];
                        const catColor = CATEGORY_COLORS[q?.categorie] || '#94a3b8';
                        return (
                          <span
                            key={idx}
                            title={`${idx + 1}. ${q?.categorie || 'question'} - ${q?.lieu_nom || qid}`}
                            style={{
                              ...styles.catDot,
                              backgroundColor: catColor,
                            }}
                          />
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Vide</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panneau d'inspection & édition du round sélectionné */}
        <div style={styles.sidebarPanel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelDateRow}>
                <CalendarIcon size={16} color="#10b981" />
                <h3 style={styles.panelDateHeading}>Round du {selectedDate}</h3>
                {selectedDate === todayDateStr && (
                  <span style={styles.todayBadge}>Aujourd'hui</span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Statut : <strong>{currentRound?.statut || 'Non généré'}</strong> • {currentRoundQuestions.length}/5 questions
              </span>
            </div>
          </div>

          <div style={styles.roundQuestionsList}>
            {currentRoundQuestions.length > 0 ? (
              currentRoundQuestions.map((q, idx) => (
                <div key={idx} style={styles.assignedQuestionCard}>
                  <div style={styles.assignedTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.slotBadge}>#{idx + 1}</span>
                      <span style={{
                        ...styles.catTag,
                        color: CATEGORY_COLORS[q.categorie] || '#ffffff',
                        background: `${CATEGORY_COLORS[q.categorie] || '#ffffff'}22`,
                      }}>
                        {q.categorie || 'business'}
                      </span>
                      <span style={styles.diffPill}>{q.difficulte || 'moyen'}</span>
                    </div>

                    <button
                      onClick={() => {
                        setReplacingSlotIndex(idx);
                        setReplaceSearch('');
                        setReplaceCategory('all');
                      }}
                      style={styles.replaceBtn}
                      title="Remplacer par une autre question validée"
                    >
                      <Replace size={13} />
                      <span>Remplacer</span>
                    </button>
                  </div>

                  <p style={styles.assignedText}>{q.texte}</p>

                  <div style={styles.assignedBottom}>
                    <span style={{ color: '#34d399', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} />
                      {q.lieu_nom}, {q.pays}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                      [{Number(q.reponse_lat || 0).toFixed(2)}, {Number(q.reponse_lng || 0).toFixed(2)}]
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyPanelBox}>
                <AlertTriangle size={28} color="#f59e0b" />
                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
                  Aucun round planifié pour cette date. Utilisez le bouton "Auto-générer" ou assignez manuellement des questions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALE DE REMPLACEMENT D'UNE QUESTION */}
      {replacingSlotIndex !== null && (
        <div style={styles.modalBackdrop} onClick={() => setReplacingSlotIndex(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Replace size={18} color="#34d399" />
                <h3 style={styles.modalTitle}>
                  Remplacer la question #{replacingSlotIndex + 1} du {selectedDate}
                </h3>
              </div>
              <button onClick={() => setReplacingSlotIndex(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Barre de filtre pour sélection */}
            <div style={styles.modalSearchRow}>
              <div style={styles.searchBox}>
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Rechercher par lieu, entreprise, mot-clé..."
                  value={replaceSearch}
                  onChange={(e) => setReplaceSearch(e.target.value)}
                  style={styles.modalSearchInput}
                  autoFocus
                />
              </div>

              <select
                value={replaceCategory}
                onChange={(e) => setReplaceCategory(e.target.value)}
                style={styles.modalSelect}
              >
                <option value="all">Toutes catégories</option>
                {Object.keys(CATEGORY_COLORS).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <span style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 12px 0', display: 'block' }}>
              {filteredReplacementCandidates.length} questions validées disponibles
            </span>

            {/* Liste des candidates */}
            <div style={styles.candidatesList}>
              {filteredReplacementCandidates.slice(0, 50).map((cand) => (
                <div key={cand.id} style={styles.candidateRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        color: CATEGORY_COLORS[cand.categorie] || '#ffffff',
                      }}>
                        {cand.categorie}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>• {cand.difficulte}</span>
                      <span style={{ fontSize: '11px', color: '#34d399', marginLeft: '6px' }}>
                        {cand.lieu_nom} ({cand.pays})
                      </span>
                    </div>
                    <p style={styles.candidateText}>{cand.texte}</p>
                  </div>
                  <button
                    onClick={() => handleSelectReplacement(cand)}
                    style={styles.chooseCandidateBtn}
                  >
                    <span>Choisir</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '28px 36px',
    maxWidth: '1350px',
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '900',
    color: '#ffffff',
  },
  pageSubtitle: {
    margin: '6px 0 0 0',
    fontSize: '14px',
    color: '#94a3b8',
  },
  autoGenBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
  },
  toastSuccess: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#a7f3d0',
    padding: '12px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
  },
  insufficientPoolBanner: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  syncFromCalBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    whiteSpace: 'nowrap',
  },

  legendRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px',
    marginBottom: '20px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px',
  },
  calendarCard: {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '10px',
  },
  dayCell: {
    borderRadius: '10px',
    border: '1px solid',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '85px',
    transition: 'all 0.15s ease',
  },
  dayTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  statusPill: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  dayNumRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    margin: '4px 0',
  },
  dayNum: {
    fontSize: '18px',
    fontWeight: '800',
  },
  monthName: {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  categoryDotsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '10px',
  },
  catDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  sidebarPanel: {
    background: 'rgba(15, 23, 42, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
    height: 'fit-content',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '16px',
  },
  panelDateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  panelDateHeading: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '800',
    color: '#ffffff',
  },
  todayBadge: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  roundQuestionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  assignedQuestionCard: {
    background: 'rgba(3, 18, 14, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '14px',
  },
  assignedTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  slotBadge: {
    fontSize: '11px',
    fontWeight: '900',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  catTag: {
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  diffPill: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  replaceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  assignedText: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#f8fafc',
    lineHeight: '1.4',
  },
  assignedBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyPanelBox: {
    padding: '30px 16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(2, 6, 23, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalCard: {
    background: '#041712',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    color: '#ffffff',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalSearchRow: {
    display: 'flex',
    gap: '10px',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  modalSearchInput: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  },
  modalSelect: {
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '8px 12px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  candidatesList: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
  },
  candidateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  candidateText: {
    margin: 0,
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: '1.4',
  },
  chooseCandidateBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#10b981',
    color: '#03120e',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
