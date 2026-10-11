import React, { useState, useEffect } from 'react';
import {
  Shield,
  X,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Globe2,
  BarChart2,
  Users,
  Settings,
  Clock,
  Star,
  Layers,
  Search,
  Filter,
  Edit3,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import questionsPool from '../../data/questions.json';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Génère le round du jour déterministement (même logique que geo.js) */
function getDailyRound(pool, dateStr) {
  const seed = dateStr.replace(/-/g, '');
  const n = parseInt(seed, 10);
  const shuffled = [...pool].sort((a, b) => {
    const ha = ((n * 1234567 + a.id * 7654321) % pool.length + pool.length) % pool.length;
    const hb = ((n * 1234567 + b.id * 7654321) % pool.length + pool.length) % pool.length;
    return ha - hb;
  });
  return shuffled.slice(0, 5);
}

/** Génère les rounds pour les N prochains jours */
function getUpcomingRounds(pool, startDate, days = 31) {
  const rounds = [];
  for (let i = 0; i < days; i++) {
    const dateStr = addDays(startDate, i);
    const questions = getDailyRound(pool, dateStr);
    rounds.push({ date: dateStr, questions });
  }
  return rounds;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminPanel({ isOpen, onClose, authInfo }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingRounds, setUpcomingRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [users, setUsers] = useState([]);
  const [scores, setScores] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading] = useState(false);

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'upcoming') loadUpcoming();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'scores') loadScores();
  }, [isOpen, activeTab]);

  function loadUpcoming() {
    const today = todayStr();
    const rounds = getUpcomingRounds(questionsPool, today, 31);
    setUpcomingRounds(rounds);
    setSelectedRound(rounds[0] || null);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('cree_le', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function loadScores() {
    setLoading(true);
    try {
      const today = todayStr();
      const q = query(
        collection(db, 'scores'),
        where('date', '==', today),
        where('is_official', '==', true),
        orderBy('score_total', 'desc')
      );
      const snap = await getDocs(q);
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // Questions filtrées pour la vue "questions"
  const filteredQuestions = questionsPool
    .filter(q => {
      const matchSearch = !searchQ || 
        q.texte?.toLowerCase().includes(searchQ.toLowerCase()) ||
        q.lieu_nom?.toLowerCase().includes(searchQ.toLowerCase()) ||
        q.pays?.toLowerCase().includes(searchQ.toLowerCase());
      const matchCat = filterCat === 'all' || q.categorie === filterCat;
      return matchSearch && matchCat;
    });

  const categories = ['all', ...new Set(questionsPool.map(q => q.categorie).filter(Boolean))];

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>

        {/* ── En-tête ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.adminBadge}>
              <Shield size={16} color="#f59e0b" />
              <span>ADMIN PANEL</span>
            </div>
            <div>
              <h1 style={styles.headerTitle}>BizGames Administration</h1>
              <p style={styles.headerSub}>{authInfo?.user?.email} • Superadmin</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav style={styles.nav}>
          {[
            { id: 'upcoming', icon: <Calendar size={15} />, label: 'Questions à venir (31j)' },
            { id: 'questions', icon: <Layers size={15} />, label: `Toutes les questions (${questionsPool.length})` },
            { id: 'users', icon: <Users size={15} />, label: 'Utilisateurs' },
            { id: 'scores', icon: <BarChart2 size={15} />, label: "Scores d'aujourd'hui" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ ...styles.navTab, ...(activeTab === tab.id ? styles.navTabActive : {}) }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Contenu ── */}
        <div style={styles.content}>

          {/* ════ ONGLET : QUESTIONS À VENIR (31 jours) ════ */}
          {activeTab === 'upcoming' && (
            <div style={styles.upcomingLayout}>

              {/* Calendrier latéral */}
              <div style={styles.calendarSidebar}>
                <div style={styles.calendarTitle}>
                  <Calendar size={14} color="#10b981" />
                  <span>31 prochains jours</span>
                </div>
                <div style={styles.calendarList}>
                  {upcomingRounds.map((round, idx) => {
                    const isToday = round.date === todayStr();
                    const isSelected = selectedRound?.date === round.date;
                    return (
                      <button
                        key={round.date}
                        onClick={() => setSelectedRound(round)}
                        style={{
                          ...styles.calendarItem,
                          ...(isSelected ? styles.calendarItemSelected : {}),
                          ...(isToday ? styles.calendarItemToday : {}),
                        }}
                      >
                        <div style={styles.calendarItemDate}>
                          <span style={styles.calendarDay}>
                            {isToday ? '📅' : `J+${idx}`}
                          </span>
                          <span style={styles.calendarDateStr}>{formatDate(round.date)}</span>
                        </div>
                        <div style={styles.calendarItemMeta}>
                          {round.questions.map((q, qi) => (
                            <span key={qi} style={styles.calendarDot} title={q.lieu_nom} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Détail du round sélectionné */}
              {selectedRound && (
                <div style={styles.roundDetail}>
                  <div style={styles.roundDetailHeader}>
                    <div>
                      <div style={styles.roundDateBadge}>
                        {selectedRound.date === todayStr() ? (
                          <span style={{ color: '#10b981' }}>📅 AUJOURD'HUI</span>
                        ) : (
                          <span>Round du {formatDate(selectedRound.date)}</span>
                        )}
                      </div>
                      <h2 style={styles.roundDetailTitle}>
                        5 Questions Business — {formatDate(selectedRound.date)}
                      </h2>
                    </div>
                    <div style={styles.roundStats}>
                      <span style={styles.roundStatPill}>5 questions</span>
                      <span style={styles.roundStatPill}>5 000 pts max (1 000/q)</span>
                    </div>
                  </div>

                  <div style={styles.questionsList}>
                    {selectedRound.questions.map((q, idx) => (
                      <div key={q.id} style={styles.questionCard}>
                        <div style={styles.questionCardHeader}>
                          <div style={styles.qNumBadge}>Q{idx + 1}</div>
                          <div style={styles.qMeta}>
                            {q.categorie && (
                              <span style={styles.qCatTag}>{q.categorie}</span>
                            )}
                            {q.difficulte && (
                              <span style={{
                                ...styles.qDiffTag,
                                background: q.difficulte === 'facile' ? 'rgba(16,185,129,0.2)' :
                                            q.difficulte === 'moyen' ? 'rgba(245,158,11,0.2)' :
                                            'rgba(239,68,68,0.2)',
                                color: q.difficulte === 'facile' ? '#10b981' :
                                       q.difficulte === 'moyen' ? '#f59e0b' : '#ef4444',
                              }}>
                                {q.difficulte}
                              </span>
                            )}
                            <span style={styles.qIdTag}>ID #{q.id}</span>
                          </div>
                        </div>

                        <p style={styles.questionTexte}>
                          &ldquo;{q.texte}&rdquo;
                        </p>

                        <div style={styles.questionAnswer}>
                          <div style={styles.answerRow}>
                            <MapPin size={13} color="#10b981" />
                            <strong style={{ color: '#f8fafc' }}>{q.lieu_nom}</strong>
                            <span style={{ color: '#64748b' }}>•</span>
                            <span style={{ color: '#94a3b8' }}>{q.pays}</span>
                            {q.region && (
                              <>
                                <span style={{ color: '#64748b' }}>•</span>
                                <span style={{ color: '#94a3b8' }}>{q.region}</span>
                              </>
                            )}
                          </div>
                          <div style={styles.answerRow}>
                            <Globe2 size={13} color="#60a5fa" />
                            <span style={{ color: '#60a5fa', fontSize: '12px' }}>
                              {q.reponse_lat?.toFixed(4)}, {q.reponse_lng?.toFixed(4)}
                            </span>
                          </div>
                          {q.explication && (
                            <p style={styles.explication}>{q.explication}</p>
                          )}
                          {q.source && (
                            <p style={styles.source}>Source : {q.source}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ ONGLET : TOUTES LES QUESTIONS ════ */}
          {activeTab === 'questions' && (
            <div style={styles.questionsView}>
              {/* Barre de recherche & filtres */}
              <div style={styles.searchBar}>
                <div style={styles.searchInput}>
                  <Search size={15} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Rechercher une question, un lieu, un pays…"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.filterRow}>
                  <Filter size={14} color="#64748b" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      style={{
                        ...styles.filterTag,
                        ...(filterCat === cat ? styles.filterTagActive : {}),
                      }}
                    >
                      {cat === 'all' ? 'Tous' : cat}
                    </button>
                  ))}
                </div>
                <span style={styles.resultCount}>
                  {filteredQuestions.length} / {questionsPool.length} questions
                </span>
              </div>

              {/* Table des questions */}
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Question</th>
                      <th style={styles.th}>Lieu / Réponse</th>
                      <th style={styles.th}>Pays</th>
                      <th style={styles.th}>Catégorie</th>
                      <th style={styles.th}>Difficulté</th>
                      <th style={styles.th}>Coords</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((q, i) => (
                      <tr key={q.id} style={{ ...styles.tr, ...(i % 2 === 0 ? styles.trEven : {}) }}>
                        <td style={styles.td}>
                          <span style={styles.idBadge}>#{q.id}</span>
                        </td>
                        <td style={{ ...styles.td, maxWidth: '320px' }}>
                          <p style={styles.qTextTrunc}>{q.texte}</p>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                            {q.lieu_nom}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{q.pays}</span>
                        </td>
                        <td style={styles.td}>
                          {q.categorie && (
                            <span style={styles.qCatTag}>{q.categorie}</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {q.difficulte && (
                            <span style={{
                              ...styles.qDiffTag,
                              background: q.difficulte === 'facile' ? 'rgba(16,185,129,0.15)' :
                                          q.difficulte === 'moyen' ? 'rgba(245,158,11,0.15)' :
                                          'rgba(239,68,68,0.15)',
                              color: q.difficulte === 'facile' ? '#10b981' :
                                     q.difficulte === 'moyen' ? '#f59e0b' : '#ef4444',
                            }}>
                              {q.difficulte}
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                            {q.reponse_lat?.toFixed(2)}, {q.reponse_lng?.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ ONGLET : UTILISATEURS ════ */}
          {activeTab === 'users' && (
            <div style={styles.usersView}>
              <div style={styles.sectionTitle}>
                <Users size={16} color="#10b981" />
                <span>{users.length} utilisateurs inscrits</span>
              </div>
              {loading ? (
                <div style={styles.loading}>Chargement…</div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Rang</th>
                        <th style={styles.th}>Pseudo</th>
                        <th style={styles.th}>Pays</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Parties</th>
                        <th style={styles.th}>Meilleur score</th>
                        <th style={styles.th}>Streak</th>
                        <th style={styles.th}>Inscrit le</th>
                        <th style={styles.th}>Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} style={{ ...styles.tr, ...(i % 2 === 0 ? styles.trEven : {}) }}>
                          <td style={styles.td}>
                            <span style={{ fontWeight: '800', color: i === 0 ? '#fbbf24' : i === 1 ? '#e2e8f0' : i === 2 ? '#f59e0b' : '#94a3b8' }}>
                              #{i + 1}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.userRow}>
                              {u.photo_url ? (
                                <img src={u.photo_url} alt="" style={styles.avatar} />
                              ) : (
                                <div style={styles.avatarPlaceholder}>
                                  {(u.pseudo || u.email || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '13px' }}>
                                {u.pseudo || '—'}
                              </span>
                              {u.isAdmin && (
                                <span style={styles.adminBadgeSmall}>
                                  <Shield size={10} /> admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '13px', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span>{u.country_flag || '🌍'}</span>
                              <span>{u.country || 'Non renseigné'}</span>
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{u.email || '—'}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#f8fafc' }}>{u.parties_jouees || 0}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#fbbf24', fontWeight: '700' }}>
                              {(u.meilleur_score || 0).toLocaleString('fr-FR')} pts
                            </span>
                          </td>
                          <td style={styles.td}>
                            {(u.streak_actuel || 0) > 0 ? (
                              <span style={{ color: '#f59e0b' }}>🔥 {u.streak_actuel}</span>
                            ) : (
                              <span style={{ color: '#334155' }}>—</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              {u.cree_le?.toDate ? u.cree_le.toDate().toLocaleDateString('fr-FR') : '—'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {u.isAdmin ? (
                              <CheckCircle2 size={14} color="#10b981" />
                            ) : (
                              <span style={{ color: '#334155', fontSize: '11px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════ ONGLET : SCORES DU JOUR ════ */}
          {activeTab === 'scores' && (
            <div style={styles.scoresView}>
              <div style={styles.sectionTitle}>
                <BarChart2 size={16} color="#10b981" />
                <span>Classement officiel — {formatDate(todayStr())}</span>
              </div>
              {loading ? (
                <div style={styles.loading}>Chargement…</div>
              ) : scores.length === 0 ? (
                <div style={styles.emptyState}>
                  <Clock size={32} color="#334155" />
                  <p>Aucun score enregistré aujourd'hui.</p>
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Rang</th>
                        <th style={styles.th}>Joueur</th>
                        <th style={styles.th}>Score</th>
                        <th style={styles.th}>Temps</th>
                        <th style={styles.th}>Grille</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((s, i) => (
                        <tr key={s.id} style={{ ...styles.tr, ...(i % 2 === 0 ? styles.trEven : {}) }}>
                          <td style={styles.td}>
                            <span style={styles.rankBadge}>
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '13px' }}>
                              {s.pseudo || 'Anonyme'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '15px' }}>
                              {(s.score_total || 0).toLocaleString('fr-FR')} pts
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#94a3b8' }}>
                              <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                              {' '}{s.temps_total_secondes || 0}s
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '16px', letterSpacing: '2px' }}>
                              {s.grille_emoji || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 9, 7, 0.97)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-body)',
    overflowY: 'auto',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    padding: '0 0 40px',
  },

  /* Header */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
    background: 'rgba(4, 20, 15, 0.9)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  adminBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: '1px',
  },
  headerTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  headerSub: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
    marginTop: '2px',
  },
  closeBtn: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer',
    color: '#f87171',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Nav */
  nav: {
    display: 'flex',
    gap: '4px',
    padding: '12px 24px',
    borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
    overflowX: 'auto',
  },
  navTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  navTabActive: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#10b981',
  },

  /* Content */
  content: {
    flex: 1,
    padding: '20px 24px',
  },

  /* Upcoming rounds layout */
  upcomingLayout: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: '20px',
    alignItems: 'flex-start',
  },
  calendarSidebar: {
    background: 'rgba(6, 27, 21, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'sticky',
    top: '80px',
  },
  calendarTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '12px 14px',
    borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
    fontSize: '11px',
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  calendarList: {
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
  },
  calendarItem: {
    width: '100%',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background 0.1s ease',
  },
  calendarItemSelected: {
    background: 'rgba(16, 185, 129, 0.15)',
    borderLeft: '3px solid #10b981',
  },
  calendarItemToday: {
    background: 'rgba(245, 158, 11, 0.1)',
    borderLeft: '3px solid #f59e0b',
  },
  calendarItemDate: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    alignItems: 'flex-start',
  },
  calendarDay: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.3px',
  },
  calendarDateStr: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  calendarItemMeta: {
    display: 'flex',
    gap: '3px',
  },
  calendarDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.5)',
    display: 'block',
  },

  /* Round detail */
  roundDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  roundDetailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(6, 27, 21, 0.7)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '14px',
  },
  roundDateBadge: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '4px',
  },
  roundDetailTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  roundStats: {
    display: 'flex',
    gap: '8px',
  },
  roundStatPill: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#6ee7b7',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questionCard: {
    background: 'rgba(6, 27, 21, 0.85)',
    border: '1px solid rgba(16, 185, 129, 0.18)',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  qNumBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '900',
    color: '#10b981',
    flexShrink: 0,
  },
  qMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  qCatTag: {
    background: 'rgba(96, 165, 250, 0.15)',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#93c5fd',
    textTransform: 'uppercase',
  },
  qDiffTag: {
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    border: '1px solid transparent',
  },
  qIdTag: {
    fontSize: '10px',
    color: '#334155',
    fontFamily: 'monospace',
  },
  questionTexte: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    lineHeight: '1.5',
    margin: 0,
    padding: '10px 14px',
    background: 'rgba(2, 9, 7, 0.5)',
    borderRadius: '10px',
    borderLeft: '3px solid rgba(16, 185, 129, 0.4)',
  },
  questionAnswer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  answerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  },
  explication: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.45',
    margin: 0,
    padding: '8px 12px',
    background: 'rgba(2, 9, 7, 0.3)',
    borderRadius: '8px',
  },
  source: {
    fontSize: '11px',
    color: '#475569',
    margin: 0,
    fontStyle: 'italic',
  },

  /* Questions view */
  questionsView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  searchBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px',
    background: 'rgba(6, 27, 21, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '12px',
  },
  searchInput: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(2, 9, 7, 0.6)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  input: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#f8fafc',
    fontSize: '13px',
    flex: 1,
    fontFamily: 'var(--font-body)',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterTag: {
    background: 'none',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '6px',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  filterTagActive: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#10b981',
  },
  resultCount: {
    fontSize: '11px',
    color: '#334155',
    fontWeight: '600',
  },

  /* Table */
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  thead: {
    background: 'rgba(4, 20, 15, 0.9)',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(16, 185, 129, 0.12)',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid rgba(16, 185, 129, 0.06)',
    transition: 'background 0.1s ease',
  },
  trEven: {
    background: 'rgba(6, 27, 21, 0.3)',
  },
  td: {
    padding: '10px 14px',
    color: '#cbd5e1',
    verticalAlign: 'middle',
  },
  idBadge: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#475569',
    background: 'rgba(2, 9, 7, 0.5)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  qTextTrunc: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: '1.4',
  },

  /* Users */
  usersView: { display: 'flex', flexDirection: 'column', gap: '14px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #10b981)',
    color: '#03120e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '900',
    flexShrink: 0,
  },
  adminBadgeSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '4px',
    padding: '1px 5px',
    fontSize: '9px',
    fontWeight: '800',
    color: '#fbbf24',
  },

  /* Scores */
  scoresView: { display: 'flex', flexDirection: 'column', gap: '14px' },
  rankBadge: { fontSize: '18px' },

  /* Generic */
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#f8fafc',
    padding: '12px 16px',
    background: 'rgba(6, 27, 21, 0.7)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '10px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#334155',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '60px 20px',
    color: '#334155',
    fontSize: '14px',
  },
};
