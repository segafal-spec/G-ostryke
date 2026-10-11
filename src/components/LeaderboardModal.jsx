import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Calendar,
  Flame,
  Clock,
  User,
  Medal,
  Crown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Loader2,
  LogIn,
} from 'lucide-react';
import {
  getDailyLeaderboard,
  getGlobalLeaderboard,
  getUserScoreHistory,
} from '../services/firebase';
import PlayerAvatar from './PlayerAvatar';

export default function LeaderboardModal({
  isOpen,
  onClose,
  todayDateStr,
  currentRoundScore,
  authInfo,
  onOpenAuth,
}) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'global' | 'history'
  const [loading, setLoading] = useState(true);
  const [dailyScores, setDailyScores] = useState([]);
  const [globalScores, setGlobalScores] = useState([]);
  const [userHistory, setUserHistory] = useState([]);

  const currentUserId = authInfo?.user?.uid;
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;

  // Charger les classements à l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [daily, global, history] = await Promise.all([
          getDailyLeaderboard(todayDateStr, currentRoundScore),
          getGlobalLeaderboard(),
          currentUserId ? getUserScoreHistory(currentUserId) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setDailyScores(daily);
          setGlobalScores(global);
          setUserHistory(history);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Erreur chargement classements :', err);
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, todayDateStr, currentUserId, currentRoundScore]);

  if (!isOpen) return null;

  // Trouver le rang du joueur courant dans le classement du jour
  const myDailyEntry = dailyScores.find(
    (s) => s.user_id === currentUserId || (currentRoundScore && s.user_id === currentRoundScore.user_id)
  );

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          style={styles.closeBtn}
          title="Fermer"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* En-tête */}
        <div style={styles.header}>
          <div style={styles.trophyIconBox}>
            <Trophy size={26} color="#10b981" />
          </div>
          <h2 style={styles.title}>Palmarès des Éco-Titans 2085</h2>
          <p style={styles.subtitle}>
            Comparez votre impact énergétique et mesurez votre intuition géostratégique mondiale.
          </p>
        </div>

        {/* Onglets */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'daily' ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab('daily')}
          >
            <Calendar size={14} />
            <span>Round du Jour</span>
          </button>

          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'global' ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab('global')}
          >
            <Crown size={14} />
            <span>Classement Final</span>
          </button>

          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'history' ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab('history')}
          >
            <User size={14} />
            <span>Mes Scores</span>
          </button>
        </div>

        {/* CONTENU SELON L'ONGLET ACTIF */}
        <div style={styles.contentBody}>
          {loading ? (
            <div style={styles.loadingBox}>
              <Loader2 size={32} className="spin" color="#f59e0b" />
              <span style={styles.loadingText}>Chargement des scores...</span>
            </div>
          ) : activeTab === 'daily' ? (
            /* ONGLET 1 : CLASSEMENT DU JOUR */
            <div style={styles.tabContent}>
              {/* Bannière Date */}
              <div style={styles.dateBanner}>
                <Calendar size={14} color="#f59e0b" />
                <span>Round Officiel du <strong>{todayDateStr}</strong></span>
              </div>

              {/* Ligne personnalisée si le joueur a joué */}
              {myDailyEntry && (
                <div style={styles.myRankCard}>
                  <div style={styles.myRankBadge}>
                    <span>#{myDailyEntry.rank}</span>
                  </div>
                  <PlayerAvatar
                    photoUrl={myDailyEntry.photo_url || authInfo?.user?.photoURL || authInfo?.stats?.photo_url}
                    pseudo={myDailyEntry.pseudo || authInfo?.user?.displayName || authInfo?.stats?.pseudo}
                    size={42}
                    borderColor="#10b981"
                  />
                  <div style={styles.myRankInfo}>
                    <span style={styles.myRankName}>Votre Performance du Jour</span>
                    <span style={styles.myRankDetails}>
                      {myDailyEntry.grille_emoji || '🟩🟩🟩'}
                    </span>
                  </div>
                  <div style={styles.myRankScore}>
                    <strong>{(myDailyEntry.score_total || 0).toLocaleString('fr-FR')}</strong>
                    <span style={styles.myRankScoreSub}>pts</span>
                  </div>
                </div>
              )}

              {/* Podium Top 3 */}
              {dailyScores.length >= 3 && (
                <div style={styles.podiumContainer}>
                  {/* 2ème place */}
                  <div style={{ ...styles.podiumStep, ...styles.podiumSilver }}>
                    <div style={styles.medalCircleSilver}>🥈</div>
                    <PlayerAvatar
                      photoUrl={dailyScores[1].photo_url || (dailyScores[1].user_id === currentUserId ? (authInfo?.user?.photoURL || authInfo?.stats?.photo_url) : '')}
                      pseudo={dailyScores[1].pseudo}
                      size={46}
                      borderColor="#94a3b8"
                      style={{ margin: '4px 0 6px 0' }}
                    />
                    <span style={styles.podiumName}>{dailyScores[1].pseudo?.split(' ')[0] || 'Joueur'}</span>
                    <strong style={styles.podiumScore}>
                      {dailyScores[1].score_total.toLocaleString('fr-FR')}
                    </strong>
                  </div>

                  {/* 1ère place */}
                  <div style={{ ...styles.podiumStep, ...styles.podiumGold }}>
                    <Crown size={20} color="#f59e0b" style={styles.podiumCrown} />
                    <div style={styles.medalCircleGold}>🥇</div>
                    <PlayerAvatar
                      photoUrl={dailyScores[0].photo_url || (dailyScores[0].user_id === currentUserId ? (authInfo?.user?.photoURL || authInfo?.stats?.photo_url) : '')}
                      pseudo={dailyScores[0].pseudo}
                      size={54}
                      borderColor="#f59e0b"
                      style={{ margin: '4px 0 6px 0', boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)' }}
                    />
                    <span style={styles.podiumName}>{dailyScores[0].pseudo?.split(' ')[0] || 'Joueur'}</span>
                    <strong style={{ ...styles.podiumScore, color: '#f59e0b' }}>
                      {dailyScores[0].score_total.toLocaleString('fr-FR')}
                    </strong>
                  </div>

                  {/* 3ème place */}
                  <div style={{ ...styles.podiumStep, ...styles.podiumBronze }}>
                    <div style={styles.medalCircleBronze}>🥉</div>
                    <PlayerAvatar
                      photoUrl={dailyScores[2].photo_url || (dailyScores[2].user_id === currentUserId ? (authInfo?.user?.photoURL || authInfo?.stats?.photo_url) : '')}
                      pseudo={dailyScores[2].pseudo}
                      size={46}
                      borderColor="#d97706"
                      style={{ margin: '4px 0 6px 0' }}
                    />
                    <span style={styles.podiumName}>{dailyScores[2].pseudo?.split(' ')[0] || 'Joueur'}</span>
                    <strong style={styles.podiumScore}>
                      {dailyScores[2].score_total.toLocaleString('fr-FR')}
                    </strong>
                  </div>
                </div>
              )}

              {/* Liste de tous les scores */}
              <div style={styles.scoresList}>
                <span style={styles.listSectionTitle}>CLASSEMENT GÉNÉRAL DU ROUND</span>
                {dailyScores.map((item, idx) => {
                  const isMe = item.user_id === currentUserId;
                  const itemPhoto = item.photo_url || (isMe ? (authInfo?.user?.photoURL || authInfo?.stats?.photo_url) : '');
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        ...styles.scoreRow,
                        ...(isMe ? styles.scoreRowMe : {}),
                      }}
                    >
                      <div style={styles.rankNum}>
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                      </div>

                      <PlayerAvatar
                        photoUrl={itemPhoto}
                        pseudo={item.pseudo}
                        size={38}
                        borderColor={isMe ? '#10b981' : null}
                      />

                      <div style={styles.playerInfo}>
                        <div style={styles.nameRow}>
                          <span style={styles.playerName}>
                            {item.pseudo || 'Joueur Anonyme'}
                          </span>
                          {isMe && <span style={styles.youBadge}>VOUS</span>}
                        </div>
                        <span style={styles.playerEmojiGrid}>
                          {item.grille_emoji || '🟩🟩🟩'}
                        </span>
                      </div>

                      <div style={styles.playerScore}>
                        <span style={styles.scoreVal}>
                          {(item.score_total || 0).toLocaleString('fr-FR')}
                        </span>
                        <span style={styles.scoreUnit}>pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'global' ? (
            /* ONGLET 2 : CLASSEMENT FINAL / CUMUL DES POINTS */
            <div style={styles.tabContent}>
              <div style={styles.dateBanner}>
                <Flame size={15} color="#f59e0b" />
                <span>Classement Final • Cumul des points de chaque jour joué</span>
              </div>

              <div style={styles.scoresList}>
                {globalScores.map((item, idx) => {
                  const isMe = item.id === currentUserId;
                  const totalCumule = item.score_total_cumule || item.total_points || item.meilleur_score || 0;
                  const itemPhoto = item.photo_url || (isMe ? (authInfo?.user?.photoURL || authInfo?.stats?.photo_url) : '');
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        ...styles.scoreRow,
                        ...(isMe ? styles.scoreRowMe : {}),
                      }}
                    >
                      <div style={styles.rankNum}>
                        {item.rank === 1 ? '👑' : `#${item.rank}`}
                      </div>

                      <PlayerAvatar
                        photoUrl={itemPhoto}
                        pseudo={item.pseudo}
                        size={38}
                        borderColor={isMe ? '#10b981' : null}
                      />

                      <div style={styles.playerInfo}>
                        <div style={styles.nameRow}>
                          <span style={styles.playerName}>
                            {item.pseudo || 'Joueur BizGames'}
                          </span>
                          {isMe && <span style={styles.youBadge}>VOUS</span>}
                        </div>
                        <span style={styles.playerEmojiGrid}>
                          {item.parties_jouees || 1} jours joués • Record : {(item.meilleur_score || 0).toLocaleString('fr-FR')} pts • {item.streak_actuel || 0} 🔥
                        </span>
                      </div>

                      <div style={styles.playerScore}>
                        <span style={styles.scoreVal}>
                          {totalCumule.toLocaleString('fr-FR')}
                        </span>
                        <span style={styles.scoreUnit}>pts cumulés</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ONGLET 3 : MES SCORES & HISTORIQUE */
            <div style={styles.tabContent}>
              {/* Fiche Statut Utilisateur */}
              <div style={styles.userStatsBox}>
                <div style={styles.userProfileHeader}>
                  <div style={styles.avatarCircle}>
                    {authInfo?.user?.photoURL || authInfo?.stats?.photo_url ? (
                      <img src={authInfo?.user?.photoURL || authInfo?.stats?.photo_url} alt="Avatar" style={styles.avatarPic} />
                    ) : (
                      <span>{(authInfo?.user?.displayName || authInfo?.stats?.pseudo || authInfo?.user?.email || 'J')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 style={styles.userProfileTitle}>
                      {authInfo?.user?.displayName || 'Joueur Invité'}
                    </h3>
                    <span style={styles.userProfileStatus}>
                      {isUserLoggedIn ? 'Compte vérifié' : 'Mode Invité (local)'}
                    </span>
                  </div>
                </div>

                <div style={styles.userStatsRow}>
                  <div style={styles.userStatItem}>
                    <span style={styles.userStatNum}>
                      {(authInfo?.stats?.score_total_cumule || authInfo?.stats?.total_points || (userHistory.length > 0 ? userHistory.reduce((acc, h) => acc + (h.score_total || 0), 0) : (authInfo?.stats?.meilleur_score || 0))).toLocaleString('fr-FR')}
                    </span>
                    <span style={styles.userStatLabel}>Points cumulés</span>
                  </div>
                  <div style={styles.userStatItem}>
                    <span style={styles.userStatNum}>
                      {(authInfo?.stats?.meilleur_score || (currentRoundScore ? currentRoundScore.score_total : 0)).toLocaleString('fr-FR')}
                    </span>
                    <span style={styles.userStatLabel}>Record manche</span>
                  </div>
                  <div style={styles.userStatItem}>
                    <span style={styles.userStatNum}>{authInfo?.stats?.streak_actuel || 1} 🔥</span>
                    <span style={styles.userStatLabel}>Série active</span>
                  </div>
                  <div style={styles.userStatItem}>
                    <span style={styles.userStatNum}>
                      {authInfo?.stats?.parties_jouees || (userHistory.length || (currentRoundScore ? 1 : 0))}
                    </span>
                    <span style={styles.userStatLabel}>Jours joués</span>
                  </div>
                </div>

                {/* Si invité : invitation à se connecter */}
                {!isUserLoggedIn && onOpenAuth && (
                  <div style={styles.guestCtaCard} onClick={() => { onClose(); onOpenAuth(); }}>
                    <LogIn size={16} color="#f59e0b" />
                    <span>Connectez-vous pour ne jamais perdre vos scores</span>
                    <ChevronRight size={14} color="#f59e0b" />
                  </div>
                )}
              </div>

              {/* Historique chronologique des parties */}
              <div style={styles.scoresList}>
                <span style={styles.listSectionTitle}>HISTORIQUE DE VOS SESSIONS</span>
                {userHistory.length > 0 ? (
                  userHistory.map((item, idx) => (
                    <div key={item.id || idx} style={styles.scoreRow}>
                      <div style={styles.historyDateBadge}>
                        <span>{item.date || 'Récents'}</span>
                      </div>
                      <div style={styles.playerInfo}>
                        <span style={styles.playerEmojiGrid}>{item.grille_emoji || '🟩🟩🟩'}</span>
                        <span style={styles.historyTime}>{formatSeconds(item.temps_total_secondes)}</span>
                      </div>
                      <div style={styles.playerScore}>
                        <span style={styles.scoreVal}>
                          {(item.score_total || 0).toLocaleString('fr-FR')}
                        </span>
                        <span style={styles.scoreUnit}>pts</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyHistory}>
                    <p>Aucune session enregistrée sur ce compte pour l'instant.</p>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>
                      Jouez votre round quotidien de 5 questions pour voir votre historique s'afficher ici !
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSeconds(sec) {
  if (!sec && sec !== 0) return '—';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2500,
    background: 'rgba(2, 9, 7, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    background: 'rgba(3, 18, 14, 0.96)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.15)',
    position: 'relative',
    animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    cursor: 'pointer',
    zIndex: 10,
  },
  header: {
    padding: '24px 24px 16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
  },
  trophyIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: '12px',
    color: '#a7f3d0',
    maxWidth: '380px',
    lineHeight: '1.4',
  },
  tabs: {
    display: 'flex',
    padding: '10px 18px',
    background: 'rgba(6, 27, 21, 0.5)',
    borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
    gap: '8px',
  },
  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 10px',
    borderRadius: '10px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    background: 'rgba(16, 185, 129, 0.22)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    color: '#34d399',
    fontWeight: '800',
  },
  contentBody: {
    padding: '16px 20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    gap: '12px',
  },
  loadingText: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  dateBanner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '5px 12px',
    fontSize: '11px',
    color: '#cbd5e1',
    alignSelf: 'center',
  },
  myRankCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    borderRadius: '14px',
    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)',
  },
  myRankBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: '#f59e0b',
    color: '#0b0f19',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '15px',
    fontFamily: 'var(--font-heading)',
  },
  myRankInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  myRankName: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#f8fafc',
  },
  myRankDetails: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  myRankScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '3px',
    color: '#f59e0b',
    fontSize: '18px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading)',
  },
  myRankScoreSub: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  podiumContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    alignItems: 'end',
    marginTop: '6px',
    marginBottom: '8px',
  },
  podiumStep: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '12px 6px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    textAlign: 'center',
    position: 'relative',
  },
  podiumGold: {
    background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0.04) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingBottom: '16px',
    transform: 'translateY(-6px)',
  },
  podiumSilver: {
    background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.1) 0%, rgba(203, 213, 225, 0.02) 100%)',
    borderColor: 'rgba(203, 213, 225, 0.25)',
  },
  podiumBronze: {
    background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.02) 100%)',
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  podiumCrown: {
    position: 'absolute',
    top: '-12px',
  },
  medalCircleGold: {
    fontSize: '22px',
  },
  medalCircleSilver: {
    fontSize: '18px',
  },
  medalCircleBronze: {
    fontSize: '18px',
  },
  podiumName: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#f8fafc',
    maxWidth: '90px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  podiumScore: {
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    color: '#e2e8f0',
  },
  podiumTime: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  scoresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  listSectionTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    marginTop: '6px',
    marginBottom: '2px',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    transition: 'background 0.15s ease',
  },
  scoreRowMe: {
    background: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  rankNum: {
    width: '26px',
    fontSize: '13px',
    fontWeight: '800',
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: 'var(--font-heading)',
  },
  playerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  playerName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  youBadge: {
    fontSize: '9px',
    fontWeight: '800',
    background: '#f59e0b',
    color: '#0b0f19',
    padding: '1px 5px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
  },
  playerEmojiGrid: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  playerScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '3px',
  },
  scoreVal: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)',
  },
  scoreUnit: {
    fontSize: '10px',
    color: '#64748b',
  },
  userStatsBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  userProfileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0b0f19',
    fontWeight: '900',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPic: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userProfileTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#f8fafc',
  },
  userProfileStatus: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  userStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  userStatItem: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    padding: '10px 6px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userStatNum: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)',
  },
  userStatLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  guestCtaCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#f59e0b',
    cursor: 'pointer',
  },
  historyDateBadge: {
    background: 'rgba(255, 255, 255, 0.06)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  historyTime: {
    fontSize: '10px',
    color: '#64748b',
  },
  emptyHistory: {
    textAlign: 'center',
    padding: '24px 12px',
    color: '#94a3b8',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
};
