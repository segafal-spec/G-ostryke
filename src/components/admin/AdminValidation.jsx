import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Save,
  X,
  Check,
  Send,
} from 'lucide-react';
import {
  fetchAllQuestionsAdmin,
  updateQuestionValidation,
  saveQuestionAdmin,
} from '../../services/firebase';
import LeafletMiniMap from './LeafletMiniMap';

export default function AdminValidation() {
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejet modal
  const [rejectingQuestion, setRejectingQuestion] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Édition & Validation modal
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });

  const loadData = async () => {
    setLoading(true);
    try {
      const allQ = await fetchAllQuestionsAdmin();
      // Filtrer questions en attente et trier par soumis_le ascendant
      const pending = allQ
        .filter((q) => q.statut_validation === 'en_attente')
        .sort((a, b) => {
          const tA = a.soumis_le?.seconds ? a.soumis_le.seconds * 1000 : new Date(a.soumis_le || 0).getTime();
          const tB = b.soumis_le?.seconds ? b.soumis_le.seconds * 1000 : new Date(b.soumis_le || 0).getTime();
          return tA - tB;
        });
      setPendingQuestions(pending);
    } catch (err) {
      console.error('Erreur chargement file de validation :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 4000);
  };

  // 1. Valider directement
  const handleValidate = async (q) => {
    try {
      await updateQuestionValidation(q.id, 'validee');
      setPendingQuestions((prev) => prev.filter((item) => item.id !== q.id));
      showToast(`Question "${q.lieu_nom}" validée avec succès ! Elle est désormais disponible pour les rounds.`);
    } catch (err) {
      console.error(err);
      alert('Erreur validation : ' + err.message);
    }
  };

  // 2. Rejeter avec note obligatoire
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Une note d’explication est obligatoire pour motiver le rejet.');
      return;
    }
    setIsSubmittingReject(true);
    try {
      await updateQuestionValidation(rejectingQuestion.id, 'rejetee', rejectReason.trim());
      setPendingQuestions((prev) => prev.filter((item) => item.id !== rejectingQuestion.id));
      showToast(`Question rejetée (motif enregistré).`, 'info');
      setRejectingQuestion(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      alert('Erreur rejet : ' + err.message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // 3. Modifier puis Valider
  const handleSaveAndValidate = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const formatted = {
        ...editingQuestion,
        reponse_lat: Number(editingQuestion.reponse_lat) || 0,
        reponse_lng: Number(editingQuestion.reponse_lng) || 0,
        statut_validation: 'validee',
        actif: true,
      };
      await saveQuestionAdmin(formatted);
      await updateQuestionValidation(formatted.id, 'validee');
      setPendingQuestions((prev) => prev.filter((item) => item.id !== editingQuestion.id));
      showToast(`Question "${formatted.lieu_nom}" corrigée et validée avec succès (+500 pts crédités à l'auteur) !`);
      setEditingQuestion(null);
    } catch (err) {
      console.error(err);
      alert('Erreur enregistrement & validation : ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.pageTitle}>File de Validation</h1>
          <p style={styles.pageSubtitle}>
            Modérez et vérifiez visuellement les coordonnées géographiques avant inclusion dans les rounds officiels
          </p>
        </div>
        <div style={styles.badgeCount}>
          <span>{pendingQuestions.length} en attente</span>
        </div>
      </div>

      {toastMsg.text && (
        <div style={{ ...styles.toast, ...(toastMsg.type === 'info' ? styles.toastInfo : styles.toastSuccess) }}>
          <CheckCircle2 size={16} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Chargement de la file de modération...</span>
        </div>
      ) : pendingQuestions.length === 0 ? (
        <div style={styles.emptyCard}>
          <CheckCircle2 size={42} color="#10b981" />
          <h3 style={styles.emptyTitle}>Toutes les questions sont à jour !</h3>
          <p style={styles.emptyText}>
            Aucune question n'est actuellement en attente de modération. Toutes les propositions soumises ont été traitées.
          </p>
        </div>
      ) : (
        <div style={styles.queueList}>
          {pendingQuestions.map((q, idx) => (
            <div key={q.id} style={styles.validationCard}>
              <div style={styles.cardHeader}>
                <div style={styles.headerLeft}>
                  <span style={styles.orderIndex}>#{idx + 1}</span>
                  <span style={styles.categoryBadge}>{q.categorie || 'business'}</span>
                  <span style={styles.diffBadge}>{q.difficulte || 'moyen'}</span>
                  <span style={styles.submitterBadge}>
                    Soumis par : <strong>{q.auteur_pseudo || q.soumis_par || 'utilisateur'}</strong>
                    {q.soumis_par && q.soumis_par !== 'catalogue_officiel' && (
                      <span style={{ marginLeft: '6px', color: '#10b981', fontWeight: '700' }}>(Joueur)</span>
                    )}
                  </span>
                </div>
                <div style={styles.cardHeaderRight}>
                  <Clock size={13} color="#94a3b8" />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {q.soumis_le?.seconds
                      ? new Date(q.soumis_le.seconds * 1000).toLocaleDateString('fr-FR')
                      : 'Récemment'}
                  </span>
                </div>
              </div>

              {/* Contenu principal : 2 colonnes (Détails à gauche, Mini-carte Leaflet à droite) */}
              <div style={styles.cardBody}>
                {/* Colonne gauche */}
                <div style={styles.bodyLeft}>
                  <h3 style={styles.questionHeading}>{q.texte}</h3>

                  <div style={styles.locationBanner}>
                    <MapPin size={16} color="#10b981" />
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '14px' }}>{q.lieu_nom}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>
                        ({q.pays}{q.region ? ` • ${q.region}` : ''})
                      </span>
                    </div>
                  </div>

                  {q.explication && (
                    <div style={styles.infoBlock}>
                      <span style={styles.infoTitle}>Explication pédagogique :</span>
                      <p style={styles.infoText}>{q.explication}</p>
                    </div>
                  )}

                  {q.source && (
                    <div style={styles.sourceRow}>
                      <span style={styles.infoTitle}>Source :</span>
                      <a href={q.source} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
                        <span>{q.source}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  <div style={styles.coordDisplay}>
                    <span>Coordonnées cibles :</span>
                    <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>
                      {Number(q.reponse_lat || 0).toFixed(5)}, {Number(q.reponse_lng || 0).toFixed(5)}
                    </strong>
                  </div>
                </div>

                {/* Colonne droite : Mini-carte Leaflet */}
                <div style={styles.bodyRight}>
                  <div style={styles.mapLabelRow}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Vérification satellite / Leaflet
                    </span>
                    <span style={{ fontSize: '11px', color: '#10b981' }}>Pin de réponse</span>
                  </div>
                  <LeafletMiniMap
                    lat={q.reponse_lat}
                    lng={q.reponse_lng}
                    label={`${q.lieu_nom} (${q.pays})`}
                    height="200px"
                  />
                </div>
              </div>

              {/* Barre d'action basse : 3 actions obligatoires */}
              <div style={styles.cardActionsRow}>
                <button
                  onClick={() => setEditingQuestion(q)}
                  style={styles.btnEdit}
                >
                  <Edit3 size={15} />
                  <span>Modifier puis valider</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setRejectingQuestion(q);
                      setRejectReason('');
                    }}
                    style={styles.btnReject}
                  >
                    <XCircle size={15} />
                    <span>Rejeter</span>
                  </button>

                  <button
                    onClick={() => handleValidate(q)}
                    style={styles.btnValidate}
                  >
                    <Check size={16} />
                    <span>Valider la question</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE REJET (MOTIF OBLIGATOIRE) */}
      {rejectingQuestion && (
        <div style={styles.modalBackdrop} onClick={() => setRejectingQuestion(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={20} color="#ef4444" />
                <h3 style={styles.modalTitle}>Rejeter la question</h3>
              </div>
              <button onClick={() => setRejectingQuestion(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <p style={styles.modalDesc}>
                Veuillez indiquer le motif du rejet (ex : coordonnées GPS erronées, doublon, question ambiguë).
                Cette note sera conservée dans <code>note_admin</code>.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motif obligatoire du rejet..."
                  style={styles.textarea}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setRejectingQuestion(null)} style={styles.cancelBtn}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject || !rejectReason.trim()}
                  style={styles.confirmRejectBtn}
                >
                  <Send size={14} />
                  <span>{isSubmittingReject ? 'Rejet en cours...' : 'Confirmer le rejet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE MODIFIER PUIS VALIDER */}
      {editingQuestion && (
        <div style={styles.modalBackdrop} onClick={() => setEditingQuestion(null)}>
          <div style={{ ...styles.modalCard, maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit3 size={18} color="#34d399" />
                <h3 style={styles.modalTitle}>Modifier puis Valider</h3>
              </div>
              <button onClick={() => setEditingQuestion(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAndValidate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.fieldLabel}>Énoncé</label>
                <textarea
                  rows={3}
                  value={editingQuestion.texte || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, texte: e.target.value })}
                  style={styles.inputArea}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>Lieu / Siège</label>
                  <input
                    type="text"
                    value={editingQuestion.lieu_nom || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, lieu_nom: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Pays</label>
                  <input
                    type="text"
                    value={editingQuestion.pays || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, pays: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>Latitude décimale</label>
                  <input
                    type="number"
                    step="any"
                    value={editingQuestion.reponse_lat ?? ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, reponse_lat: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Longitude décimale</label>
                  <input
                    type="number"
                    step="any"
                    value={editingQuestion.reponse_lng ?? ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, reponse_lng: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Explication pédagogique</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explication || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explication: e.target.value })}
                  style={styles.inputArea}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditingQuestion(null)} style={styles.cancelBtn}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={styles.confirmValidateBtn}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSavingEdit ? 'Enregistrement...' : 'Sauvegarder & Valider'}</span>
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
    maxWidth: '1200px',
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  badgeCount: {
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#fbbf24',
    padding: '6px 14px',
    borderRadius: '20px',
    fontWeight: '800',
    fontSize: '13px',
  },
  toast: {
    padding: '12px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
  },
  toastSuccess: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#a7f3d0',
  },
  toastInfo: {
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#fde68a',
  },
  loadingBox: {
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#94a3b8',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyCard: {
    padding: '50px 30px',
    textAlign: 'center',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
    maxWidth: '450px',
    lineHeight: '1.5',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  validationCard: {
    background: 'rgba(15, 23, 42, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  orderIndex: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.12)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  diffBadge: {
    fontSize: '11px',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  submitterBadge: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardBody: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    marginBottom: '18px',
  },
  bodyLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionHeading: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: '1.4',
  },
  locationBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '8px 12px',
    borderRadius: '8px',
  },
  infoBlock: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  infoTitle: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '700',
    display: 'block',
    marginBottom: '3px',
  },
  infoText: {
    margin: 0,
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  sourceRow: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sourceLink: {
    color: '#38bdf8',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    wordBreak: 'break-all',
  },
  coordDisplay: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bodyRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  mapLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  cardActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  btnEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnReject: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnValidate: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#10b981',
    border: 'none',
    color: '#03120e',
    fontSize: '12px',
    fontWeight: '800',
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
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
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
  modalDesc: {
    margin: '0 0 14px 0',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  inputArea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '4px',
    display: 'block',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  cancelBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  confirmRejectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#ef4444',
    border: 'none',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  confirmValidateBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#10b981',
    border: 'none',
    color: '#03120e',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
};
