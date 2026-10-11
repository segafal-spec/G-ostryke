import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  BarChart2,
  X,
  Save,
  Globe2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAllQuestionsAdmin,
  saveQuestionAdmin,
  deleteQuestionAdmin,
  fetchQuestionPerformanceStats,
  syncCatalogQuestionsAdmin,
} from '../../services/firebase';
import questionsPool from '../../../data/questions.json';


const CATEGORIES = [
  { id: 'all', label: 'Toutes les catégories' },
  { id: 'tech', label: 'Tech & Semi-conducteurs' },
  { id: 'finance', label: 'Finance & Bourses' },
  { id: 'luxe', label: 'Luxe & Mode' },
  { id: 'auto', label: 'Automobile & Mobilité' },
  { id: 'energie', label: 'Énergie & Pétrole' },
  { id: 'industrie', label: 'Industrie & Défense' },
  { id: 'aero', label: 'Aéronautique & Spatial' },
  { id: 'agro', label: 'Agroalimentaire & FMCG' },
  { id: 'commerce', label: 'E-Commerce & Retail' },
  { id: 'sante', label: 'Santé & Pharma' },
  { id: 'mines', label: 'Mines & Métaux' },
  { id: 'transport', label: 'Transport & Logistique' },
];

export default function AdminQuestions({ onOpenValidation }) {
  const [questions, setQuestions] = useState([]);
  const [perfStats, setPerfStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  // Question en cours d'édition (null si aucune)
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allQ, stats] = await Promise.all([
        fetchAllQuestionsAdmin(),
        fetchQuestionPerformanceStats(),
      ]);
      setQuestions(allQ);
      setPerfStats(stats);
    } catch (err) {
      console.error('Erreur chargement questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Questions filtrées
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Catégorie
      if (categoryFilter !== 'all' && q.categorie !== categoryFilter) return false;
      // 2. Difficulté
      if (diffFilter !== 'all' && q.difficulte !== diffFilter) return false;
      // 3. Statut validation
      if (statusFilter !== 'all' && (q.statut_validation || 'validee') !== statusFilter) return false;
      // 4. Actif
      if (activeFilter === 'actif' && q.actif === false) return false;
      if (activeFilter === 'inactif' && q.actif !== false) return false;
      // 5. Recherche texte
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = (q.texte || '').toLowerCase().includes(query);
        const placeMatch = (q.lieu_nom || '').toLowerCase().includes(query);
        const countryMatch = (q.pays || '').toLowerCase().includes(query);
        const idMatch = (q.id || '').toLowerCase().includes(query);
        if (!textMatch && !placeMatch && !countryMatch && !idMatch) return false;
      }
      return true;
    });
  }, [questions, categoryFilter, diffFilter, statusFilter, activeFilter, searchQuery]);

  // Répartition par catégorie
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.filter((c) => c.id !== 'all').forEach((c) => {
      counts[c.id] = 0;
    });
    questions.forEach((q) => {
      const cat = q.categorie || 'autre';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Synchroniser le catalogue local (231 questions) vers Firestore
  const handleSyncCatalog = async () => {
    if (!questionsPool || questionsPool.length === 0) {
      alert('Catalogue local introuvable.');
      return;
    }
    const count = questionsPool.length;
    if (
      !window.confirm(
        `Voulez-vous synchroniser les ${count} questions du catalogue officiel vers la base Firestore ?\n\n` +
        `• Statut : Validées et actives immédiatement\n` +
        `• Secteurs : Tech, Finance, Luxe, Auto, Énergie, Aéronautique, etc.\n` +
        `• Permettra d'auto-générer les rounds quotidiens des 30 prochains jours dans le calendrier.`
      )
    ) {
      return;
    }

    setIsSyncingCatalog(true);
    setSyncProgress({ current: 0, total: count });
    try {
      const res = await syncCatalogQuestionsAdmin(questionsPool, (current, total) => {
        setSyncProgress({ current, total });
      });
      setFeedbackMsg(`⚡ Succès : ${res.count} questions synchronisées dans Firestore !`);
      setTimeout(() => setFeedbackMsg(''), 6000);
      await loadData();
    } catch (err) {
      console.error('Erreur synchronisation catalogue :', err);
      alert('Erreur lors de la synchronisation : ' + err.message);
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  // Sauvegarder question (création ou édition)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestion.texte || !editingQuestion.lieu_nom) {
      alert('Veuillez renseigner au moins l’énoncé et le lieu.');
      return;
    }
    setSavingQuestion(true);
    try {
      const formatted = {
        ...editingQuestion,
        reponse_lat: Number(editingQuestion.reponse_lat) || 0,
        reponse_lng: Number(editingQuestion.reponse_lng) || 0,
        actif: editingQuestion.actif !== false,
        statut_validation: editingQuestion.statut_validation || 'validee',
      };
      await saveQuestionAdmin(formatted);
      setFeedbackMsg('Question enregistrée avec succès dans Firestore !');
      setTimeout(() => setFeedbackMsg(''), 3000);
      setEditingQuestion(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  // Basculer l'état actif / inactif en 1 clic
  const handleToggleActive = async (q) => {
    try {
      const updated = { ...q, actif: !q.actif };
      await saveQuestionAdmin(updated);
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? updated : item)));
    } catch (err) {
      console.error(err);
    }
  };

  // Supprimer une question
  const handleDelete = async (questionId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette question ?')) return;
    try {
      await deleteQuestionAdmin(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. Header Row */}
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.pageTitle}>Gestion du Vivier de Questions</h1>
          <p style={styles.pageSubtitle}>
            {questions.length} questions au total • {questions.filter((q) => q.actif !== false).length} actives • {questions.filter((q) => q.statut_validation === 'validee').length} validées
          </p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={handleSyncCatalog}
            disabled={isSyncingCatalog}
            style={{
              ...styles.syncBtn,
              ...(isSyncingCatalog ? styles.syncBtnDisabled : {}),
            }}
            title="Synchroniser le catalogue officiel de 231 questions vers Firestore"
          >
            <RefreshCw size={15} className={isSyncingCatalog ? 'spin' : ''} />
            <span>
              {isSyncingCatalog
                ? `Synchronisation (${syncProgress.current}/${syncProgress.total})...`
                : `Synchroniser catalogue (${questionsPool?.length || 231})`}
            </span>
          </button>

          <button
            onClick={() =>
              setEditingQuestion({
                id: `q_${Date.now()}`,
                texte: '',
                categorie: 'tech',
                difficulte: 'moyen',
                reponse_lat: 48.8566,
                reponse_lng: 2.3522,
                lieu_nom: '',
                pays: 'France',
                region: 'Europe',
                explication: '',
                source: '',
                actif: true,
                statut_validation: 'validee',
                soumis_par: 'admin',
              })
            }
            style={styles.addBtn}
          >
            <Plus size={16} />
            <span>Créer une question</span>
          </button>
        </div>
      </div>


      {feedbackMsg && (
        <div style={styles.toastSuccess}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 2. Visualisation des trous dans le vivier (Jauges par catégorie) */}
      <div style={styles.categoryCard}>
        <div style={styles.categoryHeader}>
          <h3 style={styles.categoryTitle}>Répartition par secteur économique</h3>
          <span style={styles.categoryHint}>Objectif : &gt; 15 questions par catégorie</span>
        </div>
        <div style={styles.catGrid}>
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isLow = count < 10;
            const pct = Math.min(100, Math.round((count / 20) * 100));
            return (
              <div
                key={cat.id}
                onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                style={{
                  ...styles.catItem,
                  ...(categoryFilter === cat.id ? styles.catItemActive : {}),
                }}
              >
                <div style={styles.catItemTop}>
                  <strong style={styles.catItemName}>{cat.label}</strong>
                  <span style={{ ...styles.catItemCount, color: isLow ? '#f87171' : '#34d399' }}>
                    {count}
                  </span>
                </div>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${pct}%`,
                      background: isLow ? '#ef4444' : count < 15 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Barre de recherche et Filtres */}
      <div style={styles.filterBar}>
        {/* Recherche texte */}
        <div style={styles.searchWrapper}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Rechercher par mot-clé, lieu, entreprise, pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sélecteurs de filtre */}
        <div style={styles.selectGroup}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.select}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">Toutes difficultés</option>
            <option value="facile">Facile</option>
            <option value="moyen">Moyen</option>
            <option value="difficile">Difficile</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">Tous statuts validation</option>
            <option value="validee">Validées</option>
            <option value="en_attente">En attente</option>
            <option value="rejetee">Rejetées</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">Toutes (Actives / Inactives)</option>
            <option value="actif">Actives uniquement</option>
            <option value="inactif">Inactives uniquement</option>
          </select>
        </div>
      </div>

      {/* 4. Table / Liste des questions */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <span>{filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''} trouvée{filteredQuestions.length > 1 ? 's' : ''}</span>
        </div>

        <div style={styles.questionsContainer}>
          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(16,185,129,0.2)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '14px',
                }}
              />
              <div style={{ fontSize: '14px', color: '#cbd5e1' }}>Chargement des questions depuis Firestore...</div>
            </div>
          ) : questions.length === 0 ? (
            <div style={styles.emptyCatalogCard}>
              <div style={styles.emptyIconCircle}>
                <Sparkles size={32} color="#10b981" />
              </div>
              <h3 style={styles.emptyTitle}>Base Firestore vide : 0 question enregistrée</h3>
              <p style={styles.emptyDesc}>
                Le catalogue officiel BizGames intègre <strong>{questionsPool?.length || 231} questions géographiques et économiques</strong> vérifiées et calibrées (Tech, Finance, Luxe, Auto, Énergie, Aéronautique, Mines, etc.).
              </p>
              <p style={styles.emptySubdesc}>
                Cliquez ci-dessous pour injecter l'intégralité du catalogue dans Firestore. Cela permettra également d'auto-générer les 30 prochains jours de rounds quotidiens dans le calendrier.
              </p>
              <button
                onClick={handleSyncCatalog}
                disabled={isSyncingCatalog}
                style={{
                  ...styles.syncPrimaryBtn,
                  ...(isSyncingCatalog ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                }}
              >
                <RefreshCw size={18} className={isSyncingCatalog ? 'spin' : ''} />
                <span>
                  {isSyncingCatalog
                    ? `Synchronisation en cours (${syncProgress.current}/${syncProgress.total})...`
                    : `Injecter les ${questionsPool?.length || 231} questions du catalogue`}
                </span>
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div style={styles.emptyFiltered}>
              <AlertCircle size={32} color="#94a3b8" />
              <p style={{ margin: '12px 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#e2e8f0' }}>
                Aucune question ne correspond à vos filtres
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Essayez d'élargir vos filtres ou de modifier la catégorie sélectionnée.
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setDiffFilter('all');
                  setStatusFilter('all');
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                style={styles.resetFilterBtn}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const stat = perfStats[q.id];
              const statut = q.statut_validation || 'validee';
              return (
                <div key={q.id} style={styles.questionRow}>
                  {/* Gauche : info question */}
                  <div style={styles.questionLeft}>
                    <div style={styles.tagsRow}>
                      <span style={styles.categoryTag}>{q.categorie || 'business'}</span>
                      <span style={{
                        ...styles.diffTag,
                        ...(q.difficulte === 'difficile' ? styles.diffHard : q.difficulte === 'moyen' ? styles.diffMed : styles.diffEasy)
                      }}>
                        {q.difficulte || 'moyen'}
                      </span>
                      <span style={styles.locationTag}>
                        <MapPin size={11} />
                        {q.lieu_nom}, {q.pays}
                      </span>
                      {/* Statut validation */}
                      <span style={{
                        ...styles.statusBadge,
                        ...(statut === 'validee' ? styles.statusVal : statut === 'en_attente' ? styles.statusPend : styles.statusRej)
                      }}>
                        {statut === 'validee' ? '✓ Validée' : statut === 'en_attente' ? '⏳ En attente' : '✕ Rejetée'}
                      </span>
                      {q.actif === false && (
                        <span style={styles.inactiveBadge}>Désactivée</span>
                      )}
                    </div>

                    <p style={styles.rowQuestionText}>{q.texte}</p>

                    <div style={styles.explicationSnippet}>
                      <span style={{ color: '#94a3b8' }}>Explication : </span>
                      <span>{q.explication || '—'}</span>
                    </div>

                    {/* Coordonnées & Stats de performance joueurs */}
                    <div style={styles.statsRow}>
                      <span style={styles.coordText}>
                        GPS: [{Number(q.reponse_lat || 0).toFixed(4)}, {Number(q.reponse_lng || 0).toFixed(4)}]
                      </span>
                      {stat ? (
                        <>
                          <span style={styles.dotSeparator}>•</span>
                          <span style={styles.perfStatPill}>
                            <BarChart2 size={12} color="#34d399" />
                            <span>Jouée {stat.playedCount} fois</span>
                          </span>
                          <span style={styles.dotSeparator}>•</span>
                          <span style={styles.perfStatPill}>
                            <span>Distance moy. : <strong>{stat.avgDistanceKm} km</strong></span>
                          </span>
                          <span style={styles.dotSeparator}>•</span>
                          <span style={styles.perfStatPill}>
                            <span>Score moy. : <strong>{stat.avgScore > 10 ? stat.avgScore : Math.round((stat.avgScore || 0) * 100)} / 1 000</strong></span>
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>• Pas encore de parties jouées</span>
                      )}
                    </div>
                  </div>

                  {/* Droite : Actions */}
                  <div style={styles.questionActions}>
                    <button
                      onClick={() => handleToggleActive(q)}
                      style={{
                        ...styles.actionToggleBtn,
                        ...(q.actif !== false ? styles.actionToggleActive : styles.actionToggleInactive)
                      }}
                      title={q.actif !== false ? 'Désactiver cette question' : 'Activer cette question'}
                    >
                      {q.actif !== false ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      style={styles.actionIconBtn}
                      title="Modifier la question"
                    >
                      <Edit3 size={15} color="#38bdf8" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      style={styles.actionIconBtn}
                      title="Supprimer la question"
                    >
                      <Trash2 size={15} color="#f87171" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* 5. Modale d'édition / création de Question */}
      {editingQuestion && (
        <div style={styles.modalBackdrop} onClick={() => setEditingQuestion(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit3 size={18} color="#10b981" />
                <h3 style={styles.modalHeading}>
                  {editingQuestion.id?.startsWith('q_') && !editingQuestion.texte
                    ? 'Créer une Nouvelle Question'
                    : `Édition : ${editingQuestion.id}`}
                </h3>
              </div>
              <button onClick={() => setEditingQuestion(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Énoncé de la question *</label>
                <textarea
                  rows={3}
                  value={editingQuestion.texte || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, texte: e.target.value })}
                  style={styles.formTextarea}
                  placeholder="Ex : Dans quelle ville se situe le siège mondial de TSMC ?"
                  required
                />
              </div>

              <div style={styles.formGrid2}>
                <div>
                  <label style={styles.formLabel}>Catégorie</label>
                  <select
                    value={editingQuestion.categorie || 'tech'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, categorie: e.target.value })}
                    style={styles.formInput}
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.formLabel}>Difficulté</label>
                  <select
                    value={editingQuestion.difficulte || 'moyen'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulte: e.target.value })}
                    style={styles.formInput}
                  >
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGrid3}>
                <div>
                  <label style={styles.formLabel}>Lieu / Ville / Siège *</label>
                  <input
                    type="text"
                    value={editingQuestion.lieu_nom || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, lieu_nom: e.target.value })}
                    style={styles.formInput}
                    placeholder="Hsinchu"
                    required
                  />
                </div>
                <div>
                  <label style={styles.formLabel}>Pays *</label>
                  <input
                    type="text"
                    value={editingQuestion.pays || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, pays: e.target.value })}
                    style={styles.formInput}
                    placeholder="Taïwan"
                    required
                  />
                </div>
                <div>
                  <label style={styles.formLabel}>Région</label>
                  <input
                    type="text"
                    value={editingQuestion.region || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, region: e.target.value })}
                    style={styles.formInput}
                    placeholder="Asie"
                  />
                </div>
              </div>

              <div style={styles.formGrid2}>
                <div>
                  <label style={styles.formLabel}>Latitude décimale (WGS84) *</label>
                  <input
                    type="number"
                    step="any"
                    value={editingQuestion.reponse_lat ?? ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, reponse_lat: e.target.value })}
                    style={styles.formInput}
                    placeholder="24.780"
                    required
                  />
                </div>
                <div>
                  <label style={styles.formLabel}>Longitude décimale (WGS84) *</label>
                  <input
                    type="number"
                    step="any"
                    value={editingQuestion.reponse_lng ?? ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, reponse_lng: e.target.value })}
                    style={styles.formInput}
                    placeholder="120.995"
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.formLabel}>Explication pédagogique après réponse</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explication || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explication: e.target.value })}
                  style={styles.formTextarea}
                  placeholder="Contexte, chiffres clés ou anecdote économique..."
                />
              </div>

              <div style={styles.formGrid2}>
                <div>
                  <label style={styles.formLabel}>Source / Référence URL</label>
                  <input
                    type="text"
                    value={editingQuestion.source || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, source: e.target.value })}
                    style={styles.formInput}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label style={styles.formLabel}>Statut de Validation</label>
                  <select
                    value={editingQuestion.statut_validation || 'validee'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, statut_validation: e.target.value })}
                    style={styles.formInput}
                  >
                    <option value="validee">Validée (jouable)</option>
                    <option value="en_attente">En attente de modération</option>
                    <option value="rejetee">Rejetée</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalCheckboxRow}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingQuestion.actif !== false}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, actif: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>
                    Question active (disponible pour sélection dans les rounds)
                  </span>
                </label>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditingQuestion(null)} style={styles.cancelBtn}>
                  Annuler
                </button>
                <button type="submit" disabled={savingQuestion} style={styles.submitBtn}>
                  <Save size={15} />
                  <span>{savingQuestion ? 'Enregistrement...' : 'Enregistrer dans Firestore'}</span>
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
  },
  pageSubtitle: {
    margin: '6px 0 0 0',
    fontSize: '14px',
    color: '#94a3b8',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    background: '#10b981',
    color: '#03120e',
    fontSize: '13px',
    fontWeight: '800',
    border: 'none',
    cursor: 'pointer',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  syncBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.45)',
    color: '#34d399',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  syncBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
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
  categoryCard: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  categoryTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
  },
  categoryHint: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
  },
  catItem: {
    background: 'rgba(3, 18, 14, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  catItemActive: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.12)',
  },
  catItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  catItemName: {
    fontSize: '12px',
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px',
  },
  catItemCount: {
    fontSize: '13px',
    fontWeight: '800',
  },
  progressBarBg: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
  },
  searchWrapper: {
    flex: '1 1 300px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '8px 14px',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  selectGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  select: {
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  tableCard: {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
  },
  tableHeaderRow: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  questionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(3, 18, 14, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  questionLeft: {
    flex: 1,
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  categoryTag: {
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#e2e8f0',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  diffTag: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'capitalize',
  },
  diffEasy: { background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' },
  diffMed: { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' },
  diffHard: { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' },
  locationTag: {
    fontSize: '11px',
    color: '#cbd5e1',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  statusVal: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  statusPend: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  statusRej: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  inactiveBadge: {
    fontSize: '11px',
    fontWeight: '700',
    background: 'rgba(148, 163, 184, 0.15)',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  rowQuestionText: {
    margin: '0 0 6px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: '1.4',
  },
  explicationSnippet: {
    fontSize: '12px',
    color: '#cbd5e1',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  },
  coordText: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
  dotSeparator: {
    color: '#475569',
  },
  perfStatPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#e2e8f0',
  },
  questionActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  actionToggleBtn: {
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    border: 'none',
  },
  actionToggleActive: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  actionToggleInactive: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  actionIconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
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
    borderRadius: '18px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    color: '#ffffff',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalHeading: {
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
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formGrid3: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '12px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  formInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  formTextarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  modalCheckboxRow: {
    padding: '8px 0',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    background: '#10b981',
    border: 'none',
    color: '#03120e',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  emptyCatalogCard: {
    padding: '52px 24px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
    borderRadius: '16px',
    border: '1px dashed rgba(16, 185, 129, 0.35)',
    margin: '16px',
  },
  emptyIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.15)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 10px 0',
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyDesc: {
    maxWidth: '580px',
    margin: '0 auto 10px auto',
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: '1.5',
  },
  emptySubdesc: {
    maxWidth: '560px',
    margin: '0 auto 22px auto',
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  syncPrimaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    color: '#03120e',
    fontSize: '14px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
    transition: 'all 0.2s ease',
  },
  emptyFiltered: {
    padding: '48px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFilterBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#38bdf8',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

