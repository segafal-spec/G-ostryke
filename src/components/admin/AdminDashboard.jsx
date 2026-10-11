import React, { useState, useEffect } from 'react';
import {
  Globe2,
  BarChart3,
  Layers,
  CheckCircle2,
  Calendar,
  LogOut,
  ExternalLink,
  Shield,
  KeyRound,
  Bell,
  Menu,
  X,
  Sparkles,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { logoutUser, fetchAdminOverviewStats } from '../../services/firebase';
import AdminOverview from './AdminOverview';
import AdminPlayers from './AdminPlayers';
import AdminContactsExport from './AdminContactsExport';
import AdminQuestions from './AdminQuestions';
import AdminValidation from './AdminValidation';
import AdminCalendar from './AdminCalendar';
import AdminAccountModal from './AdminAccountModal';

export default function AdminDashboard({ authInfo, onGoHome }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'players' | 'questions' | 'validation' | 'calendar'
  const [pendingCount, setPendingCount] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const user = authInfo?.user;
  const adminEmail = user?.email || 'segafal@gmail.com';

  // Charger le compteur des questions en attente pour le badge de la sidebar
  const loadPendingCount = async () => {
    try {
      const stats = await fetchAdminOverviewStats(todayDateStr);
      setPendingCount(stats.pendingCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadPendingCount();
  }, [activeTab]);

  const handleSignOut = async () => {
    await logoutUser();
    if (onGoHome) onGoHome();
  };

  return (
    <div style={styles.shell}>
      {/* 1. TOP HEADER */}
      <header style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.mobileBurgerBtn}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={styles.brandGroup}>
            <div style={styles.logoCircle}>
              <Globe2 size={20} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.brandTitle}>BIZGAMES</span>
                <span style={styles.adminPill}>ADMINISTRATION</span>
              </div>
              <span style={styles.brandSubtitle}>Supervision & Modération Officielle</span>
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* Bouton Paramètres Compte */}
          <button
            onClick={() => setShowAccountModal(true)}
            style={styles.accountBtn}
            title="Modifier l'email ou le mot de passe admin"
          >
            <KeyRound size={15} color="#f59e0b" />
            <span style={styles.accountEmailText}>{adminEmail}</span>
          </button>

          {/* Bouton Voir le Site */}
          <button
            onClick={onGoHome}
            style={styles.viewSiteBtn}
            title="Retourner sur l'application publique"
          >
            <ExternalLink size={14} />
            <span className="small-screen-hide">Voir le Site</span>
          </button>

          {/* Déconnexion */}
          <button
            onClick={handleSignOut}
            style={styles.logoutBtn}
            title="Déconnexion"
          >
            <LogOut size={15} />
            <span className="small-screen-hide">Quitter</span>
          </button>
        </div>
      </header>

      {/* 2. BODY AVEC SIDEBAR LATÉRALE & ZONE DE CONTENU */}
      <div style={styles.bodyLayout}>
        {/* BARRE LATÉRALE */}
        <aside
          style={{
            ...styles.sidebar,
            ...(mobileMenuOpen ? styles.sidebarMobileOpen : {}),
          }}
        >
          <div style={styles.sidebarSectionTitle}>MENU ADMINISTRATION</div>

          <nav style={styles.navList}>
            {/* 1. Vue d'ensemble */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'overview' ? styles.navBtnActive : {}),
              }}
            >
              <div style={styles.navBtnLeft}>
                <BarChart3 size={18} color={activeTab === 'overview' ? '#10b981' : '#94a3b8'} />
                <span>Vue d'ensemble</span>
              </div>
            </button>

            {/* 2. Joueurs & Positions par Pays */}
            <button
              onClick={() => {
                setActiveTab('players');
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'players' ? styles.navBtnActive : {}),
              }}
            >
              <div style={styles.navBtnLeft}>
                <Users size={18} color={activeTab === 'players' ? '#10b981' : '#94a3b8'} />
                <span>Joueurs & Pays</span>
              </div>
            </button>

            {/* 3. Export Contacts (CSV & PDF) */}
            <button
              onClick={() => {
                setActiveTab('exports');
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'exports' ? styles.navBtnActive : {}),
              }}
            >
              <div style={styles.navBtnLeft}>
                <FileSpreadsheet size={18} color={activeTab === 'exports' ? '#10b981' : '#94a3b8'} />
                <span>Export Contacts</span>
              </div>
              <span style={styles.exportPillBadge}>CSV / PDF</span>
            </button>

            {/* 4. Gestion des questions */}
            <button
              onClick={() => {
                setActiveTab('questions');
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'questions' ? styles.navBtnActive : {}),
              }}
            >
              <div style={styles.navBtnLeft}>
                <Layers size={18} color={activeTab === 'questions' ? '#10b981' : '#94a3b8'} />
                <span>Questions</span>
              </div>
            </button>

            {/* 4. File de validation */}
            <button
              onClick={() => {
                setActiveTab('validation');
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'validation' ? styles.navBtnActive : {}),
              }}
            >
              <div style={styles.navBtnLeft}>
                <CheckCircle2 size={18} color={activeTab === 'validation' ? '#10b981' : '#94a3b8'} />
                <span>Validation</span>
              </div>
              {pendingCount > 0 && (
                <span style={styles.pendingBadge}>{pendingCount}</span>
              )}
            </button>

            {/* 5. Calendrier des rounds */}
            <button
              onClick={() => {
                setActiveTab('calendar');
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'calendar' ? styles.navBtnActive : {}),
              }}
            >
              <div style={styles.navBtnLeft}>
                <Calendar size={18} color={activeTab === 'calendar' ? '#10b981' : '#94a3b8'} />
                <span>Calendrier</span>
              </div>
            </button>
          </nav>

          {/* Carte récap en bas de sidebar */}
          <div style={styles.sidebarFooterCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Shield size={14} color="#10b981" />
              <strong style={{ fontSize: '12px', color: '#ffffff' }}>Espace Sécurisé</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
              Modifications répercutées en temps réel sur Firestore.
            </p>
          </div>
        </aside>

        {/* CONTENU DE L'ÉCRAN SÉLECTIONNÉ */}
        <main style={styles.mainContent}>
          {activeTab === 'overview' && (
            <AdminOverview
              onNavigate={(tab) => setActiveTab(tab)}
              todayDateStr={todayDateStr}
            />
          )}

          {activeTab === 'players' && (
            <AdminPlayers
              currentUserEmail={adminEmail}
            />
          )}

          {activeTab === 'exports' && (
            <AdminContactsExport />
          )}

          {activeTab === 'questions' && (
            <AdminQuestions
              onOpenValidation={() => setActiveTab('validation')}
            />
          )}

          {activeTab === 'validation' && (
            <AdminValidation />
          )}

          {activeTab === 'calendar' && (
            <AdminCalendar
              user={user}
              todayDateStr={todayDateStr}
            />
          )}
        </main>
      </div>

      {/* 3. MODALE PARAMÈTRES DU COMPTE ADMIN (CHANGEMENT EMAIL / MOT DE PASSE) */}
      <AdminAccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        user={user}
      />
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#020b08',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  topHeader: {
    height: '68px',
    backgroundColor: '#03140e',
    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  mobileBurgerBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#e2e8f0',
    cursor: 'pointer',
    padding: '6px',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  adminPill: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontSize: '9px',
    fontWeight: '900',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'block',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  accountBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  accountEmailText: {
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  viewSiteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  bodyLayout: {
    flex: 1,
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#03100b',
    borderRight: '1px solid rgba(16, 185, 129, 0.15)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarMobileOpen: {
    display: 'flex',
    position: 'fixed',
    top: '68px',
    left: 0,
    bottom: 0,
    zIndex: 99,
  },
  sidebarSectionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.8px',
    marginBottom: '14px',
    paddingLeft: '8px',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  navBtnActive: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    fontWeight: '800',
    boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.3)',
  },
  navBtnLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pendingBadge: {
    background: '#f59e0b',
    color: '#03120e',
    fontSize: '11px',
    fontWeight: '900',
    padding: '2px 7px',
    borderRadius: '20px',
  },
  exportPillBadge: {
    fontSize: '9.5px',
    fontWeight: '800',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    padding: '2px 6px',
    borderRadius: '6px',
    letterSpacing: '0.4px',
  },
  sidebarFooterCard: {
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
    padding: '14px',
    marginTop: 'auto',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#020b08',
  },
};
