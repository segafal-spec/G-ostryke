import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Trophy,
  Flame,
  Globe2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  ArrowUpDown,
  Download,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Mail,
  Copy,
  Check,
  BarChart2,
  Award,
  Sparkles,
  TrendingUp,
  KeyRound,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchAllPlayersWithStatsAdmin,
  updateUserAdminStatusAdmin,
  deleteUserScoreAdmin,
  sendUserPasswordResetEmail,
  fetchDeletedAccountsAdmin,
  deleteDeletedAccountAdmin,
  deleteMultipleDeletedAccountsAdmin,
} from '../../services/firebase';
import { AGE_RANGE_OPTIONS, PROFESSION_OPTIONS } from '../../utils/geo';


export default function AdminPlayers({ currentUserEmail }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all'); // 'all' | 'admin' | 'player' | 'active'
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [sortBy, setSortBy] = useState('globalRank'); // 'globalRank' | 'countryRank' | 'bestScore' | 'avgScore' | 'gamesCount' | 'streak' | 'recent' | 'lastActive'

  // Comptes supprimés archivés & Onglet actif
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('active'); // 'active' | 'deleted'
  const [deletedSearch, setDeletedSearch] = useState('');
  const [selectedDeletedIds, setSelectedDeletedIds] = useState([]);
  const [deletedActionLoading, setDeletedActionLoading] = useState(false);
  const [deletedActionFeedback, setDeletedActionFeedback] = useState({ type: '', text: '' });

  // Modale d'inspection de joueur
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '' });
  const [copiedKey, setCopiedKey] = useState(null);

  // Charger les données
  const loadPlayersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deleted] = await Promise.all([
        fetchAllPlayersWithStatsAdmin(),
        fetchDeletedAccountsAdmin(),
      ]);
      setData(res);
      setDeletedAccounts(deleted || []);
      // Mettre à jour le joueur sélectionné s'il est ouvert
      if (selectedPlayer) {
        const updated = res.players.find((p) => p.id === selectedPlayer.id);
        if (updated) setSelectedPlayer(updated);
      }
    } catch (err) {
      console.error('Erreur chargement joueurs admin:', err);
      setError(err.message || 'Impossible de charger les joueurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayersData();
  }, []);

  // Copier dans le presse-papier
  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Basculer le rôle Admin
  const handleToggleAdmin = async (player) => {
    const isDemotingSelf = player.email?.trim().toLowerCase() === currentUserEmail?.trim().toLowerCase();
    if (isDemotingSelf && player.isAdmin) {
      alert('Action impossible : Vous ne pouvez pas vous retirer vous-même vos propres droits administrateur.');
      return;
    }

    const actionName = player.isAdmin ? 'révoquer les droits administrateur de' : 'promouvoir administrateur';
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir ${actionName} "${player.pseudo}" (${player.email || player.uid}) ?`);
    if (!confirmed) return;

    setActionLoading(true);
    setActionFeedback({ type: '', text: '' });
    try {
      await updateUserAdminStatusAdmin(player.uid, !player.isAdmin);
      setActionFeedback({
        type: 'success',
        text: `Statut administrateur ${!player.isAdmin ? 'accordé' : 'révoqué'} avec succès !`,
      });
      await loadPlayersData();
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message || 'Erreur lors de la modification du rôle.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Envoyer un email de réinitialisation de mot de passe
  const handleSendPasswordReset = async (player) => {
    if (!player.email) {
      alert('Aucune adresse email valide associée à ce compte.');
      return;
    }
    const confirmed = window.confirm(`Envoyer un email officiel de réinitialisation de mot de passe à ${player.email} ?`);
    if (!confirmed) return;

    setActionLoading(true);
    setActionFeedback({ type: '', text: '' });
    try {
      await sendUserPasswordResetEmail(player.email);
      setActionFeedback({
        type: 'success',
        text: `Email de réinitialisation envoyé à ${player.email} !`,
      });
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message || 'Erreur envoi email.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un score anomalie
  const handleDeleteScore = async (scoreId) => {
    const confirmed = window.confirm('Supprimer définitivement ce score de la base de données ?');
    if (!confirmed) return;

    setActionLoading(true);
    setActionFeedback({ type: '', text: '' });
    try {
      await deleteUserScoreAdmin(scoreId);
      setActionFeedback({ type: 'success', text: 'Score supprimé avec succès.' });
      await loadPlayersData();
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message || 'Erreur suppression score.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.players || data.players.length === 0) return;

    const headers = [
      'Rang Mondial',
      'Rang Pays',
      'Pseudo',
      'Email',
      'UID',
      'Pays',
      'Tranche d\'Âge',
      'Profession / Domaine',
      'Meilleur Score (/50)',
      'Score Moyen (/50)',
      'Parties Jouées',
      'Points Cumulés',
      'Streak (Jours)',
      'Secteur Favori',
      'Statut Admin',
      'Dernière Partie',
      'Date Inscription',
    ];

    const rows = filteredPlayers.map((p) => {
      const ageLabel = AGE_RANGE_OPTIONS.find((a) => a.id === p.ageRange)?.label || p.ageRange || 'Non renseignée';
      const profLabel = PROFESSION_OPTIONS.find((prof) => prof.id === p.profession)?.label || p.profession || 'Non renseignée';

      return [
        p.globalRank || '',
        p.countryRank ? `${p.countryRank}/${p.countryTotalPlayers || 1}` : '',
        `"${(p.pseudo || '').replace(/"/g, '""')}"`,
        `"${(p.email || '').replace(/"/g, '""')}"`,
        p.uid || '',
        `"${(p.country || '').replace(/"/g, '""')}"`,
        `"${ageLabel.replace(/"/g, '""')}"`,
        `"${profLabel.replace(/"/g, '""')}"`,
        p.bestScore || 0,
        p.avgScore || 0,
        p.gamesCount || 0,
        p.totalPoints || 0,
        p.streak || 0,
        `"${(p.favoriteSector || '').replace(/"/g, '""')}"`,
        p.isAdmin ? 'OUI' : 'NON',
        p.lastPlayedDate || '',
        p.cree_le?.toDate ? p.cree_le.toDate().toLocaleDateString('fr-FR') : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bizgames_joueurs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF rapide pour impression ou téléchargement
  const handleExportPDF = () => {
    const list = sortedPlayers || [];
    if (list.length === 0) {
      alert('Aucun joueur à exporter.');
      return;
    }

    const today = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const rowsHtml = list.map((p, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:bold;">${p.pseudo || '-'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;color:#047857;font-family:monospace;font-size:11px;">${p.email || 'Non renseigné'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${p.country || '-'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-weight:bold;">${(p.totalPoints || 0).toLocaleString('fr-FR')}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center;">${p.gamesCount || 0}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center;">${p.streak || 0}j</td>
      </tr>
    `).join('');

    const w = window.open('', '_blank');
    if (!w) {
      alert('Veuillez autoriser les fenêtres popups pour générer le PDF.');
      return;
    }

    w.document.open();
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>BizGames - Export Joueurs (${list.length})</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: system-ui, sans-serif; font-size: 11px; padding: 15px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 15px; }
          .logo { font-size: 20px; font-weight: bold; color: #047857; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f172a; color: #ffffff; padding: 8px 10px; text-align: left; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><div class="logo">BIZGAMES 🌍</div><div>Export des Joueurs & Contacts</div></div>
          <div style="text-align:right;"><div>Généré le ${today}</div><div>Total : ${list.length} joueurs</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Pseudo</th><th>Email</th><th>Pays</th><th style="text-align:right;">Points</th><th style="text-align:center;">Parties</th><th style="text-align:center;">Série</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  // Export CSV des emails et données des comptes supprimés (RGPD)
  const handleExportDeletedCSV = () => {
    if (!deletedAccounts || deletedAccounts.length === 0) {
      alert('Aucun compte supprimé archivé pour le moment.');
      return;
    }

    const headers = [
      'Date de Suppression',
      'Email',
      'Ancien Pseudo',
      'Pays',
      'Parties Jouees',
      'Points Cumules',
      'Meilleur Score (/5000)',
      'Streak Max',
      'UID Utilisateur',
      'Raison',
    ];

    const rows = deletedAccounts.map((a) => {
      const dateStr = a.deleted_at?.toDate
        ? a.deleted_at.toDate().toLocaleString('fr-FR')
        : a.deleted_at_iso || '';
      return [
        `"${dateStr}"`,
        `"${(a.email || '').replace(/"/g, '""')}"`,
        `"${(a.pseudo || '').replace(/"/g, '""')}"`,
        `"${(a.pays || '').replace(/"/g, '""')}"`,
        a.parties_jouees || 0,
        a.score_cumule || 0,
        a.meilleur_score || 0,
        a.streak_max || 0,
        `"${(a.user_id || '').replace(/"/g, '""')}"`,
        `"${(a.raison || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `bizgames_emails_comptes_supprimes_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copier tous les emails des comptes supprimés
  const handleCopyDeletedEmails = () => {
    const emails = deletedAccounts
      .map((a) => a.email)
      .filter((em) => em && !em.includes('Non renseigné'))
      .join(', ');
    if (!emails) {
      alert('Aucune adresse email valide disponible.');
      return;
    }
    navigator.clipboard.writeText(emails);
    alert(`${deletedAccounts.length} adresse(s) email(s) copiée(s) dans le presse-papier !`);
  };

  // Détection des doublons d'email dans deletedAccounts
  const emailCountMap = useMemo(() => {
    const counts = {};
    deletedAccounts.forEach((acc) => {
      const em = (acc.email || '').trim().toLowerCase();
      if (em && !em.includes('non renseigné')) {
        counts[em] = (counts[em] || 0) + 1;
      }
    });
    return counts;
  }, [deletedAccounts]);

  // Liste des IDs d'entrées doublons à supprimer (toutes sauf la plus récente pour chaque email)
  const duplicateDocIds = useMemo(() => {
    const byEmail = {};
    deletedAccounts.forEach((acc) => {
      const em = (acc.email || '').trim().toLowerCase();
      if (em && !em.includes('non renseigné')) {
        if (!byEmail[em]) byEmail[em] = [];
        byEmail[em].push(acc);
      }
    });

    const toRemove = [];
    Object.entries(byEmail).forEach(([, items]) => {
      if (items.length > 1) {
        // Trier décroissant par date de suppression (le plus récent en tête)
        const sorted = [...items].sort((a, b) => {
          const da = a.deleted_at?.toDate ? a.deleted_at.toDate() : new Date(a.deleted_at_iso || 0);
          const db = b.deleted_at?.toDate ? b.deleted_at.toDate() : new Date(b.deleted_at_iso || 0);
          return db - da;
        });
        // Conserver sorted[0] (le plus récent), marquer tous les autres pour suppression
        for (let i = 1; i < sorted.length; i++) {
          toRemove.push(sorted[i].id);
        }
      }
    });
    return toRemove;
  }, [deletedAccounts]);

  // Supprimer définitivement un enregistrement d'archive
  const handleDeleteSingleDeletedAccount = async (acc) => {
    const emailLabel = acc.email || acc.pseudo || 'Anonyme';
    const confirmMsg = `Supprimer définitivement l'archive du compte "${emailLabel}" de Firebase ?\n\nAttention : Cette action est irréversible et supprimera totalement cette entrée de la base de données.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletedActionLoading(true);
    setDeletedActionFeedback({ type: '', text: '' });
    try {
      await deleteDeletedAccountAdmin(acc.id);
      setDeletedAccounts((prev) => prev.filter((a) => a.id !== acc.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => id !== acc.id));
      setDeletedActionFeedback({
        type: 'success',
        text: `L'archive du compte ${emailLabel} a été définitivement supprimée de Firebase.`,
      });
    } catch (err) {
      console.error('Erreur suppression compte archivé:', err);
      setDeletedActionFeedback({
        type: 'error',
        text: err.message || 'Erreur lors de la suppression définitive.',
      });
    } finally {
      setDeletedActionLoading(false);
    }
  };

  // Nettoyer automatiquement tous les doublons (conserver l'archive la plus récente de chaque email)
  const handleCleanDuplicates = async () => {
    if (duplicateDocIds.length === 0) {
      alert("Aucun doublon d'email détecté dans l'archive.");
      return;
    }
    const confirmMsg = `Nettoyage des doublons :\n${duplicateDocIds.length} doublon(s) d'email détecté(s).\n\nVoulez-vous supprimer définitivement ces ${duplicateDocIds.length} enregistrements en double de Firebase tout en conservant l'enregistrement le plus récent pour chaque adresse email ?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletedActionLoading(true);
    setDeletedActionFeedback({ type: '', text: '' });
    try {
      await deleteMultipleDeletedAccountsAdmin(duplicateDocIds);
      const count = duplicateDocIds.length;
      setDeletedAccounts((prev) => prev.filter((a) => !duplicateDocIds.includes(a.id)));
      setSelectedDeletedIds((prev) => prev.filter((id) => !duplicateDocIds.includes(id)));
      setDeletedActionFeedback({
        type: 'success',
        text: `${count} doublon(s) supprimé(s) définitivement de Firebase ! Chaque adresse email est désormais unique.`,
      });
    } catch (err) {
      console.error('Erreur nettoyage doublons:', err);
      setDeletedActionFeedback({
        type: 'error',
        text: err.message || 'Erreur lors du nettoyage des doublons.',
      });
    } finally {
      setDeletedActionLoading(false);
    }
  };

  // Supprimer définitivement la sélection multiple
  const handleDeleteSelectedDeletedAccounts = async () => {
    if (selectedDeletedIds.length === 0) return;
    const confirmMsg = `Êtes-vous sûr de vouloir supprimer définitivement ${selectedDeletedIds.length} archive(s) sélectionnée(s) de Firebase ?\n\nCette action est irréversible.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletedActionLoading(true);
    setDeletedActionFeedback({ type: '', text: '' });
    try {
      await deleteMultipleDeletedAccountsAdmin(selectedDeletedIds);
      const count = selectedDeletedIds.length;
      setDeletedAccounts((prev) => prev.filter((a) => !selectedDeletedIds.includes(a.id)));
      setSelectedDeletedIds([]);
      setDeletedActionFeedback({
        type: 'success',
        text: `${count} archive(s) supprimée(s) définitivement de Firebase.`,
      });
    } catch (err) {
      console.error('Erreur suppression sélection:', err);
      setDeletedActionFeedback({
        type: 'error',
        text: err.message || 'Erreur lors de la suppression de la sélection.',
      });
    } finally {
      setDeletedActionLoading(false);
    }
  };

  // Gestion sélection checkboxes
  const handleToggleSelectAllDeleted = () => {
    if (selectedDeletedIds.length === filteredDeletedAccounts.length && filteredDeletedAccounts.length > 0) {
      setSelectedDeletedIds([]);
    } else {
      setSelectedDeletedIds(filteredDeletedAccounts.map((a) => a.id));
    }
  };

  const handleToggleSelectOneDeleted = (id) => {
    setSelectedDeletedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtrage des comptes supprimés
  const filteredDeletedAccounts = useMemo(() => {
    if (!deletedSearch.trim()) return deletedAccounts;
    const q = deletedSearch.toLowerCase().trim();
    return deletedAccounts.filter(
      (a) =>
        (a.email || '').toLowerCase().includes(q) ||
        (a.pseudo || '').toLowerCase().includes(q) ||
        (a.user_id || '').toLowerCase().includes(q)
    );
  }, [deletedAccounts, deletedSearch]);

  // Filtrage et Tri
  const filteredPlayers = useMemo(() => {
    if (!data?.players) return [];

    let list = [...data.players];

    // Recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.pseudo || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.uid || '').toLowerCase().includes(q) ||
          (p.country || '').toLowerCase().includes(q)
      );
    }

    // Filtre Pays
    if (selectedCountry !== 'all') {
      list = list.filter((p) => p.country === selectedCountry);
    }

    // Filtre Secteur
    if (selectedSector !== 'all') {
      list = list.filter((p) => p.favoriteSector === selectedSector);
    }

    // Filtre Rôle
    if (selectedRole === 'admin') {
      list = list.filter((p) => p.isAdmin);
    } else if (selectedRole === 'player') {
      list = list.filter((p) => !p.isAdmin);
    } else if (selectedRole === 'active') {
      list = list.filter((p) => p.gamesCount > 0);
    }

    // Filtre Tranche d'Âge
    if (selectedAgeRange !== 'all') {
      list = list.filter((p) => p.ageRange === selectedAgeRange);
    }

    // Filtre Profession / Secteur d'activité
    if (selectedProfession !== 'all') {
      list = list.filter((p) => p.profession === selectedProfession);
    }

    // Tri
    list.sort((a, b) => {
      switch (sortBy) {
        case 'globalRank':
          return (a.globalRank || 9999) - (b.globalRank || 9999);
        case 'countryRank':
          return (a.countryRank || 9999) - (b.countryRank || 9999);
        case 'totalPoints':
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        case 'bestScore':
          return (b.bestScore || 0) - (a.bestScore || 0);
        case 'avgScore':
          return (b.avgScore || 0) - (a.avgScore || 0);
        case 'gamesCount':
          return (b.gamesCount || 0) - (a.gamesCount || 0);
        case 'streak':
          return (b.streak || 0) - (a.streak || 0);
        case 'recent':
          const da = a.cree_le?.toDate ? a.cree_le.toDate().getTime() : 0;
          const db_ = b.cree_le?.toDate ? b.cree_le.toDate().getTime() : 0;
          return db_ - da;
        case 'lastActive':
          return (b.lastPlayedDate || '').localeCompare(a.lastPlayedDate || '');
        default:
          return (a.globalRank || 9999) - (b.globalRank || 9999);
      }
    });

    return list;
  }, [data?.players, searchQuery, selectedCountry, selectedSector, selectedRole, selectedAgeRange, selectedProfession, sortBy]);

  // Formater date
  const formatDate = (val) => {
    if (!val) return '—';
    if (val.toDate) {
      return val.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return String(val);
  };

  if (loading && !data) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>
          Chargement des joueurs et calcul des positions par pays...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={32} color="#ef4444" />
        <h3 style={{ color: '#ffffff', margin: '10px 0 6px 0' }}>Erreur de chargement</h3>
        <p style={{ color: '#94a3b8', margin: 0 }}>{error}</p>
        <button onClick={loadPlayersData} style={styles.retryBtn}>
          <RefreshCw size={14} />
          <span>Réessayer</span>
        </button>
      </div>
    );
  }

  const { globalStats, countryStats } = data || {};

  return (
    <div style={styles.container}>
      {/* 1. Header & Actions rapides */}
      <div style={styles.topRow}>
        <div>
          <div style={styles.titleBadge}>
            <Users size={14} color="#10b981" />
            <span>COMMUNAUTÉ & CLASSEMENTS OFFICIELS</span>
          </div>
          <h1 style={styles.pageTitle}>Joueurs & Positions par Pays</h1>
          <p style={styles.pageSubtitle}>
            Supervision de tous les joueurs inscrits, classements mondiaux et performances locales par pays
          </p>
        </div>

        <div style={styles.headerBtnGroup}>
          <button onClick={handleExportCSV} style={styles.exportBtn} title="Exporter tous les joueurs au format CSV">
            <Download size={15} />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            style={{
              ...styles.exportBtn,
              background: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#f87171',
            }}
            title="Exporter tous les joueurs au format PDF (Imprimer / Télécharger)"
          >
            <FileText size={15} />
            <span>Exporter PDF</span>
          </button>
          <button onClick={loadPlayersData} style={styles.refreshBtn} title="Actualiser les données" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* 2. KPIs synthétiques en haut de page */}
      <div style={styles.kpiGrid}>
        {/* Total Inscrits */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total Joueurs Inscrits</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(59, 130, 246, 0.15)' }}>
              <Users size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={styles.kpiValue}>{(globalStats?.totalPlayers || 0).toLocaleString('fr-FR')}</div>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#10b981', fontWeight: '700' }}>
              {globalStats?.activePlayers || 0} actifs
            </span>
            <span style={{ color: '#64748b' }}> • </span>
            <span style={{ color: '#94a3b8' }}>
              {globalStats?.totalPlayers ? Math.round(((globalStats?.activePlayers || 0) / globalStats.totalPlayers) * 100) : 0}% taux d'activité
            </span>
          </div>
        </div>

        {/* Pays Représentés */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Pays Représentés</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(16, 185, 129, 0.15)' }}>
              <Globe2 size={18} color="#10b981" />
            </div>
          </div>
          <div style={styles.kpiValue}>{globalStats?.countriesCount || 0}</div>
          <div style={styles.kpiFooter}>
            {countryStats && countryStats[0] ? (
              <span style={{ color: '#cbd5e1' }}>
                Top pays : <strong>{countryStats[0].flag} {countryStats[0].country}</strong> ({countryStats[0].playerCount} joueurs)
              </span>
            ) : (
              <span style={{ color: '#94a3b8' }}>International</span>
            )}
          </div>
        </div>

        {/* Record Mondial */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Record Score Mondial</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(245, 158, 11, 0.15)' }}>
              <Trophy size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {globalStats?.globalRecordScore || 0}{' '}
            <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>/ 5 000 pts</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#fbbf24' }}>
              🥇 Détenu par <strong>{globalStats?.recordHolder}</strong>
            </span>
          </div>
        </div>

        {/* Score Moyen Communauté */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Moyenne Globale</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(168, 85, 247, 0.15)' }}>
              <TrendingUp size={18} color="#c084fc" />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {globalStats?.globalAvgScore || 0}{' '}
            <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>/ 5 000 pts</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#94a3b8' }}>
              Sur {globalStats?.totalCommunityGames || 0} parties enregistrées
            </span>
          </div>
        </div>

        {/* Comptes Supprimés (Archive Emails RGPD) */}
        <div
          style={{ ...styles.kpiCard, cursor: 'pointer' }}
          onClick={() => setActiveSubTab('deleted')}
          title="Consulter les emails et comptes supprimés conservés"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Comptes Supprimés</span>
            <div style={{ ...styles.kpiIconBox, background: 'rgba(239, 68, 68, 0.15)' }}>
              <Trash2 size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: '#f87171' }}>
            {deletedAccounts.length}{' '}
            <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>archivé{deletedAccounts.length > 1 ? 's' : ''}</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ color: '#fca5a5' }}>
              📥 Emails conservés & téléchargeables
            </span>
          </div>
        </div>
      </div>

      {/* 2b. Sélecteur d'onglet : Joueurs Actifs vs Comptes Supprimés */}
      <div style={styles.subTabsRow}>
        <button
          type="button"
          onClick={() => setActiveSubTab('active')}
          style={{
            ...styles.subTabBtn,
            ...(activeSubTab === 'active' ? styles.subTabBtnActive : {}),
          }}
        >
          <Users size={16} />
          <span>Joueurs Actifs ({data?.players?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('deleted')}
          style={{
            ...styles.subTabBtn,
            ...(activeSubTab === 'deleted' ? styles.subTabBtnActiveRed : {}),
          }}
        >
          <Trash2 size={16} />
          <span>Comptes Supprimés & Archive Emails</span>
          <span style={styles.deletedCountBadge}>{deletedAccounts.length}</span>
          {duplicateDocIds.length > 0 && (
            <span style={styles.duplicateCountBadge} title={`${duplicateDocIds.length} doublon(s) d'email détecté(s)`}>
              ⚠️ {duplicateDocIds.length} doublon{duplicateDocIds.length > 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* CONTENU ONGLET 1 : JOUEURS ACTIFS */}
      {activeSubTab === 'active' && (
        <>
      {/* 3. Sélecteur rapide des pays (Analytics pills) */}
      <div style={styles.countryBar}>
        <div style={styles.countryBarTitle}>
          <Globe2 size={15} color="#10b981" />
          <span>RÉPARTITION PAR PAYS :</span>
        </div>
        <div style={styles.countryPillsList}>
          <button
            onClick={() => setSelectedCountry('all')}
            style={{
              ...styles.countryPill,
              ...(selectedCountry === 'all' ? styles.countryPillActive : {}),
            }}
          >
            <span>🌍 Tous les pays</span>
            <span style={styles.pillCount}>{globalStats?.totalPlayers || 0}</span>
          </button>
          {countryStats?.map((c) => (
            <button
              key={c.country}
              onClick={() => setSelectedCountry(c.country)}
              style={{
                ...styles.countryPill,
                ...(selectedCountry === c.country ? styles.countryPillActive : {}),
              }}
              title={`${c.country} : ${c.playerCount} joueur(s) • Meilleur score : ${c.bestScore}/5 000 pts • Moyenne : ${c.avgScore} pts`}
            >
              <span>{c.flag} {c.country}</span>
              <span style={styles.pillCount}>{c.playerCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Barre de Filtres & Recherche */}
      <div style={styles.controlsCard}>
        {/* Recherche texte */}
        <div style={styles.searchBox}>
          <Search size={16} color="#64748b" style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par pseudo, email, UID, pays..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtres dropdown */}
        <div style={styles.filterGroup}>
          {/* Rôle / Statut */}
          <div style={styles.selectWrap}>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">Tous les profils</option>
              <option value="active">Ayant déjà joué (Actifs)</option>
              <option value="admin">Administrateurs uniquement</option>
              <option value="player">Joueurs réguliers</option>
            </select>
          </div>

          {/* Secteur favori */}
          <div style={styles.selectWrap}>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">Tous les secteurs</option>
              <option value="tech">💻 Tech, IA & Big Tech</option>
              <option value="finance">🏦 Wall Street & Finance</option>
              <option value="luxe">💎 Luxe & Haute Horlogerie</option>
              <option value="energie">⚡ Énergie & Gigafactories</option>
              <option value="auto">🚗 Automobile & Aéro</option>
            </select>
          </div>

          {/* Tranche d'Âge */}
          <div style={styles.selectWrap}>
            <select
              value={selectedAgeRange}
              onChange={(e) => setSelectedAgeRange(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">Toutes les tranches d'âge</option>
              {AGE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Métier / Domaine */}
          <div style={styles.selectWrap}>
            <select
              value={selectedProfession}
              onChange={(e) => setSelectedProfession(e.target.value)}
              style={styles.selectInput}
            >
              <option value="all">Tous les métiers / domaines</option>
              {PROFESSION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tri */}
          <div style={styles.selectWrap}>
            <div style={styles.sortPrefix}>
              <ArrowUpDown size={13} color="#10b981" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...styles.selectInput, paddingLeft: '32px' }}
            >
              <option value="globalRank">🏆 Rang Mondial (Points Cumulés)</option>
              <option value="countryRank">🌍 Rang par Pays</option>
              <option value="totalPoints">💰 Total Points Cumulés</option>
              <option value="bestScore">⭐ Record Manche (/ 5 000)</option>
              <option value="avgScore">📈 Score Moyen</option>
              <option value="gamesCount">🎮 Jours / Parties Jouées</option>
              <option value="streak">🔥 Série active (Streak)</option>
              <option value="recent">📅 Date d'inscription (Récents)</option>
              <option value="lastActive">🕒 Dernière activité</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Compteur & indicateur de filtre */}
      <div style={styles.resultsInfoRow}>
        <span style={styles.resultsCount}>
          Affichage de <strong>{filteredPlayers.length}</strong> joueur{filteredPlayers.length > 1 ? 's' : ''}
          {selectedCountry !== 'all' && (
            <span style={{ color: '#10b981' }}> en {selectedCountry}</span>
          )}
          {searchQuery && (
            <span style={{ color: '#94a3b8' }}> pour &ldquo;{searchQuery}&rdquo;</span>
          )}
        </span>
        {(searchQuery || selectedCountry !== 'all' || selectedSector !== 'all' || selectedRole !== 'all' || selectedAgeRange !== 'all' || selectedProfession !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCountry('all');
              setSelectedSector('all');
              setSelectedRole('all');
              setSelectedAgeRange('all');
              setSelectedProfession('all');
            }}
            style={styles.resetFiltersBtn}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* 6. Tableau complet des joueurs */}
      <div style={styles.tableCard}>
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={{ ...styles.th, width: '80px', textAlign: 'center' }}>Rang Final</th>
                <th style={styles.th}>Joueur</th>
                <th style={styles.th}>Pays & Position Nationale</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Points Cumulés</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Record Manche</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Score Moyen</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Parties</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Streak</th>
                <th style={styles.th}>Dernière Activité</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="10" style={styles.emptyTd}>
                    <Users size={36} color="#334155" style={{ marginBottom: '10px' }} />
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                      Aucun joueur ne correspond à vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const isTop1 = player.globalRank === 1;
                  const isTop2 = player.globalRank === 2;
                  const isTop3 = player.globalRank === 3;
                  const isTopCountry1 = player.countryRank === 1;

                  return (
                    <tr
                      key={player.id}
                      style={styles.tr}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      {/* Rang Mondial */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {isTop1 ? (
                          <div style={{ ...styles.rankBadge, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                            🥇 #1
                          </div>
                        ) : isTop2 ? (
                          <div style={{ ...styles.rankBadge, background: 'rgba(148, 163, 184, 0.2)', color: '#e2e8f0', border: '1px solid rgba(148, 163, 184, 0.4)' }}>
                            🥈 #2
                          </div>
                        ) : isTop3 ? (
                          <div style={{ ...styles.rankBadge, background: 'rgba(217, 119, 6, 0.2)', color: '#f59e0b', border: '1px solid rgba(217, 119, 6, 0.4)' }}>
                            🥉 #3
                          </div>
                        ) : (
                          <span style={styles.normalRank}>#{player.globalRank}</span>
                        )}
                      </td>

                      {/* Identité Joueur */}
                      <td style={styles.td}>
                        <div style={styles.playerInfoRow}>
                          {player.photo_url ? (
                            <img src={player.photo_url} alt="" style={styles.avatarImg} />
                          ) : (
                            <div style={styles.avatarFallback}>
                              {(player.pseudo || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div style={styles.playerNameCol}>
                            <div style={styles.nameLine}>
                              <strong style={styles.playerPseudo}>{player.pseudo}</strong>
                              {player.isAdmin && (
                                <span style={styles.adminTag} title="Administrateur officiel">
                                  <Shield size={10} />
                                  <span>ADMIN</span>
                                </span>
                              )}
                              {player.isFounder && (
                                <span style={styles.founderTag} title="Compte fondateur">
                                  Fondateur
                                </span>
                              )}
                            </div>
                            <span style={styles.playerEmail}>
                              {player.email || 'Pas d\'email (Compte invité)'}
                            </span>
                            <div style={styles.uidLine}>
                              <span style={styles.uidText}>UID: {player.uid?.slice(0, 10)}...</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(player.uid, `uid_${player.uid}`);
                                }}
                                style={styles.copyUidBtn}
                                title="Copier l'UID"
                              >
                                {copiedKey === `uid_${player.uid}` ? (
                                  <Check size={11} color="#10b981" />
                                ) : (
                                  <Copy size={11} color="#64748b" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position par pays */}
                      <td style={styles.td}>
                        <div style={styles.countryCell}>
                          <div style={styles.countryNameRow}>
                            <span style={styles.countryFlag}>{player.countryFlag || '🌍'}</span>
                            <span style={styles.countryName}>{player.country || 'Non renseigné'}</span>
                          </div>
                          {player.country && player.country !== 'Non renseigné' ? (
                            <div
                              style={{
                                ...styles.countryRankPill,
                                ...(isTopCountry1 ? styles.countryRankPillTop : {}),
                              }}
                            >
                              {isTopCountry1 ? '🥇 ' : ''}
                              <strong>{player.countryRank}e</strong> sur {player.countryTotalPlayers || 1} en {player.country}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Position non calculée</span>
                          )}
                        </div>
                      </td>

                      {/* Points Cumulés (Total) */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={styles.scoreCell}>
                          <strong
                            style={{
                              fontSize: '15px',
                              fontWeight: '800',
                              color: '#fbbf24',
                            }}
                          >
                            {(player.totalPoints || player.score_total_cumule || player.bestScore || 0).toLocaleString('fr-FR')}
                          </strong>
                          <span style={styles.scoreMax}>pts</span>
                        </div>
                      </td>

                      {/* Meilleur Score */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={styles.scoreCell}>
                          <span
                            style={{
                              ...styles.scoreNumber,
                              color: (player.bestScore >= 4000 || (player.bestScore <= 50 && player.bestScore >= 40)) ? '#34d399' : (player.bestScore >= 2400 || (player.bestScore <= 50 && player.bestScore >= 24)) ? '#fbbf24' : '#f87171',
                            }}
                          >
                            {player.bestScore || 0}
                          </span>
                          <span style={styles.scoreMax}>/ 5 000</span>
                        </div>
                      </td>

                      {/* Score Moyen */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.avgScoreText}>
                          {player.avgScore > 0 ? `${player.avgScore} pts` : '—'}
                        </span>
                      </td>

                      {/* Parties Jouées */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.gamesCountBadge}>
                          {player.gamesCount || 0}
                        </span>
                      </td>

                      {/* Streak */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {(player.streak || 0) > 0 ? (
                          <span style={styles.streakBadge}>
                            🔥 {player.streak} j
                          </span>
                        ) : (
                          <span style={{ color: '#475569', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* Dernière Activité */}
                      <td style={styles.td}>
                        <div style={styles.dateCol}>
                          <span style={styles.dateText}>
                            {formatDate(player.lastPlayedDate || player.date_derniere_partie)}
                          </span>
                          <span style={styles.inscriptionText}>
                            Inscrit : {formatDate(player.cree_le)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(player);
                          }}
                          style={styles.inspectBtn}
                          title="Inspecter le profil et l'historique complet"
                        >
                          <span>Fiche</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* CONTENU ONGLET 2 : COMPTES SUPPRIMÉS & ARCHIVE EMAILS */}
      {activeSubTab === 'deleted' && (
        <div style={styles.deletedSectionCard}>
          <div style={styles.deletedHeaderRow}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} color="#ef4444" />
                <h3 style={styles.deletedSectionTitle}>
                  Archive des Comptes & Emails Supprimés
                </h3>
              </div>
              <p style={styles.deletedSectionSubtitle}>
                Conformité RGPD : Les comptes et scores ont été purgés de l'application, mais les adresses e-mails et historiques clés sont conservés de manière sécurisée ici pour l'administration.
              </p>
            </div>

            <div style={styles.deletedActionBtns}>
              {duplicateDocIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleCleanDuplicates}
                  disabled={deletedActionLoading}
                  style={styles.cleanDuplicatesBtn}
                  title={`Supprimer définitivement ${duplicateDocIds.length} doublon(s) d'email de Firebase tout en conservant l'archive la plus récente`}
                >
                  <AlertTriangle size={15} color="#fbbf24" />
                  <span>Nettoyer les doublons ({duplicateDocIds.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyDeletedEmails}
                style={styles.copyAllEmailsBtn}
                title="Copier toutes les adresses emails dans le presse-papier"
                disabled={deletedAccounts.length === 0}
              >
                <Copy size={15} />
                <span>Copier les emails</span>
              </button>
              <button
                type="button"
                onClick={handleExportDeletedCSV}
                style={styles.downloadCsvBtn}
                title="Télécharger la liste complète au format CSV"
                disabled={deletedAccounts.length === 0}
              >
                <Download size={15} />
                <span>Télécharger CSV ({deletedAccounts.length})</span>
              </button>
            </div>
          </div>

          {/* Message de notification d'action (Succès / Erreur) */}
          {deletedActionFeedback.text && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background:
                  deletedActionFeedback.type === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${
                  deletedActionFeedback.type === 'error'
                    ? 'rgba(239, 68, 68, 0.4)'
                    : 'rgba(16, 185, 129, 0.4)'
                }`,
                color: deletedActionFeedback.type === 'error' ? '#fca5a5' : '#6ee7b7',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span>{deletedActionFeedback.text}</span>
              <button
                type="button"
                onClick={() => setDeletedActionFeedback({ type: '', text: '' })}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Barre d'action groupée si des lignes sont sélectionnées */}
          {selectedDeletedIds.length > 0 && (
            <div style={styles.bulkActionBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} color="#ef4444" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                  <strong>{selectedDeletedIds.length}</strong> archive{selectedDeletedIds.length > 1 ? 's' : ''} sélectionnée{selectedDeletedIds.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleDeleteSelectedDeletedAccounts}
                  disabled={deletedActionLoading}
                  style={styles.bulkDeleteBtn}
                  title="Supprimer définitivement les archives sélectionnées de Firebase"
                >
                  <Trash2 size={13} />
                  <span>Supprimer définitivement la sélection ({selectedDeletedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeletedIds([])}
                  style={styles.bulkCancelBtn}
                >
                  Désélectionner
                </button>
              </div>
            </div>
          )}

          {/* Recherche rapide dans les comptes supprimés */}
          <div style={{ ...styles.controlsCard, marginBottom: '16px' }}>
            <div style={styles.searchBox}>
              <Search size={16} color="#64748b" style={styles.searchIcon} />
              <input
                type="text"
                value={deletedSearch}
                onChange={(e) => setDeletedSearch(e.target.value)}
                placeholder="Rechercher par email, pseudo ou UID..."
                style={styles.searchInput}
              />
              {deletedSearch && (
                <button onClick={() => setDeletedSearch('')} style={styles.clearSearchBtn}>
                  <X size={14} />
                </button>
              )}
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              <strong>{filteredDeletedAccounts.length}</strong> compte{filteredDeletedAccounts.length > 1 ? 's' : ''} trouvé{filteredDeletedAccounts.length > 1 ? 's' : ''}
              {duplicateDocIds.length > 0 && (
                <span style={{ color: '#fbbf24', marginLeft: '10px', fontWeight: '600' }}>
                  • {duplicateDocIds.length} doublon{duplicateDocIds.length > 1 ? 's' : ''} détecté{duplicateDocIds.length > 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>

          {/* Tableau des comptes supprimés */}
          <div style={styles.tableCard}>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.checkboxTh}>
                      <input
                        type="checkbox"
                        checked={
                          filteredDeletedAccounts.length > 0 &&
                          selectedDeletedIds.length === filteredDeletedAccounts.length
                        }
                        onChange={handleToggleSelectAllDeleted}
                        style={styles.checkboxInput}
                        title="Tout sélectionner / Tout désélectionner"
                      />
                    </th>
                    <th style={styles.th}>Date & Heure de suppression</th>
                    <th style={styles.th}>Adresse E-mail Conservée</th>
                    <th style={styles.th}>Ancien Pseudo</th>
                    <th style={styles.th}>Pays</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Parties Jouées</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Points Cumulés</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Record Manche</th>
                    <th style={styles.th}>Raison / Statut</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeletedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={styles.emptyTd}>
                        <Trash2 size={36} color="#334155" style={{ marginBottom: '10px' }} />
                        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                          {deletedSearch
                            ? 'Aucun compte supprimé ne correspond à votre recherche.'
                            : "Aucun compte n'a été supprimé pour le moment."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDeletedAccounts.map((acc) => {
                      const dateStr = acc.deleted_at?.toDate
                        ? acc.deleted_at.toDate().toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : acc.deleted_at_iso
                        ? new Date(acc.deleted_at_iso).toLocaleString('fr-FR')
                        : 'Date inconnue';

                      const isDuplicate = (emailCountMap[(acc.email || '').trim().toLowerCase()] || 0) > 1;
                      const isSelected = selectedDeletedIds.includes(acc.id);

                      return (
                        <tr
                          key={acc.id}
                          style={{
                            ...styles.tr,
                            ...(isSelected ? { background: 'rgba(239, 68, 68, 0.08)' } : {}),
                          }}
                        >
                          <td style={styles.checkboxTd}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOneDeleted(acc.id)}
                              style={styles.checkboxInput}
                            />
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={13} color="#f87171" />
                              <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>
                                {dateStr}
                              </span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Mail size={14} color="#fca5a5" />
                              <strong style={{ color: '#ffffff', fontSize: '13px' }}>
                                {acc.email || '—'}
                              </strong>
                              {isDuplicate && (
                                <span
                                  style={styles.duplicateTag}
                                  title="Cet email existe en plusieurs exemplaires dans l'archive"
                                >
                                  <AlertTriangle size={10} color="#fbbf24" />
                                  <span>Doublon</span>
                                </span>
                              )}
                              {acc.email && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(acc.email, `del_${acc.id}`)}
                                  style={styles.miniCopyBtn}
                                  title="Copier l'email"
                                >
                                  {copiedKey === `del_${acc.id}` ? (
                                    <Check size={12} color="#10b981" />
                                  ) : (
                                    <Copy size={12} color="#94a3b8" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#e2e8f0', fontWeight: '700' }}>
                              {acc.pseudo || 'Anonyme'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                              {acc.pays || 'GLOBAL'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>
                              {acc.parties_jouees || 0}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <strong style={{ color: '#fbbf24' }}>
                              {(acc.score_cumule || 0).toLocaleString('fr-FR')}
                            </strong>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={{ color: '#34d399', fontWeight: '600' }}>
                              {(acc.meilleur_score || 0).toLocaleString('fr-FR')} pts
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.deletedReasonBadge}>
                              {acc.raison || "Supprimé par l'utilisateur"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(acc.email, `del_act_${acc.id}`)}
                                style={styles.tableActionBtn}
                                title="Copier l'adresse email"
                              >
                                <Copy size={12} />
                                <span>{copiedKey === `del_act_${acc.id}` ? 'Copié !' : 'Copier'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleDeletedAccount(acc)}
                                disabled={deletedActionLoading}
                                style={styles.tableActionBtnDelete}
                                title="Supprimer définitivement cette archive de Firebase"
                              >
                                <Trash2 size={12} />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modale Détail Joueur (Fiche Complète) */}
      {selectedPlayer && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPlayer(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                {selectedPlayer.photo_url ? (
                  <img src={selectedPlayer.photo_url} alt="" style={styles.modalAvatar} />
                ) : (
                  <div style={styles.modalAvatarFallback}>
                    {(selectedPlayer.pseudo || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={styles.modalTitle}>{selectedPlayer.pseudo}</h2>
                    {selectedPlayer.isAdmin && (
                      <span style={styles.adminTagLarge}>
                        <Shield size={12} />
                        <span>ADMINISTRATEUR</span>
                      </span>
                    )}
                  </div>
                  <div style={styles.modalSubRow}>
                    <span style={styles.modalEmail}>{selectedPlayer.email || 'Aucune adresse e-mail'}</span>
                    <button
                      onClick={() => copyToClipboard(selectedPlayer.email, 'modal_email')}
                      style={styles.copySmallBtn}
                      title="Copier l'email"
                    >
                      {copiedKey === 'modal_email' ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#94a3b8" />}
                    </button>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={styles.modalUid}>UID: {selectedPlayer.uid}</span>
                    <button
                      onClick={() => copyToClipboard(selectedPlayer.uid, 'modal_uid')}
                      style={styles.copySmallBtn}
                      title="Copier l'UID complet"
                    >
                      {copiedKey === 'modal_uid' ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#94a3b8" />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedPlayer(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {/* Notification d'action */}
            {actionFeedback.text && (
              <div
                style={{
                  ...styles.actionToast,
                  background: actionFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  borderColor: actionFeedback.type === 'error' ? '#ef4444' : '#10b981',
                  color: actionFeedback.type === 'error' ? '#fca5a5' : '#a7f3d0',
                }}
              >
                {actionFeedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{actionFeedback.text}</span>
              </div>
            )}

            <div style={styles.modalBody}>
              {/* 4 KPIs de la modale */}
              <div style={styles.modalKpiRow}>
                {/* Rang Mondial & Rang Pays */}
                <div style={styles.modalKpiBox}>
                  <div style={styles.modalKpiTitle}>RANG & POSITION</div>
                  <div style={styles.modalKpiValue}>
                    {selectedPlayer.globalRank === 1 ? '🥇 #1 Mondial' : `#${selectedPlayer.globalRank} Mondial`}
                  </div>
                  <div style={styles.modalKpiSub}>
                    {selectedPlayer.country && selectedPlayer.country !== 'Non renseigné' ? (
                      <span style={{ color: '#34d399', fontWeight: '600' }}>
                        {selectedPlayer.countryFlag} {selectedPlayer.countryRank}e sur {selectedPlayer.countryTotalPlayers} en {selectedPlayer.country}
                      </span>
                    ) : (
                      'Pays non spécifié'
                    )}
                  </div>
                </div>

                {/* Scores */}
                <div style={styles.modalKpiBox}>
                  <div style={styles.modalKpiTitle}>MEILLEUR SCORE</div>
                  <div style={{ ...styles.modalKpiValue, color: '#fbbf24' }}>
                    {selectedPlayer.bestScore || 0} <span style={{ fontSize: '14px', color: '#94a3b8' }}>/ 5 000 pts</span>
                  </div>
                  <div style={styles.modalKpiSub}>
                    Moyenne : <strong>{selectedPlayer.avgScore || 0} pts</strong> par partie
                  </div>
                </div>

                {/* Parties & Temps */}
                <div style={styles.modalKpiBox}>
                  <div style={styles.modalKpiTitle}>PARTIES JOUÉES</div>
                  <div style={styles.modalKpiValue}>{selectedPlayer.gamesCount || 0}</div>
                  <div style={styles.modalKpiSub}>
                    Temps moyen : {selectedPlayer.avgTimeSeconds ? `${selectedPlayer.avgTimeSeconds}s` : '—'}
                  </div>
                </div>

                {/* Streak & Précision */}
                <div style={styles.modalKpiBox}>
                  <div style={styles.modalKpiTitle}>SÉRIE ACTIVE (STREAK)</div>
                  <div style={{ ...styles.modalKpiValue, color: '#f59e0b' }}>
                    🔥 {selectedPlayer.streak || 0} jour{(selectedPlayer.streak || 0) > 1 ? 's' : ''}
                  </div>
                  <div style={styles.modalKpiSub}>
                    Précision moyenne : {selectedPlayer.avgDistanceKm ? `${selectedPlayer.avgDistanceKm} km` : '—'}
                  </div>
                </div>
              </div>

              {/* Bio & Métadonnées Normalisées */}
              <div style={styles.modalProfileMeta}>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Pays de résidence :</strong>
                  <span style={styles.metaVal}>
                    {selectedPlayer.countryFlag || '🌍'} {selectedPlayer.country || 'Non renseigné'}
                  </span>
                </div>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Tranche d'âge :</strong>
                  <span style={styles.metaVal}>
                    {AGE_RANGE_OPTIONS.find((a) => a.id === selectedPlayer.ageRange)?.label || selectedPlayer.ageRange || 'Non renseignée'}
                  </span>
                </div>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Profession / Domaine :</strong>
                  <span style={styles.metaVal}>
                    {PROFESSION_OPTIONS.find((p) => p.id === selectedPlayer.profession)?.label || selectedPlayer.profession || 'Non renseignée'}
                  </span>
                </div>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Biographie / Statut :</strong>
                  <span style={styles.metaVal}>{selectedPlayer.bio || 'Aucune biographie rédigée.'}</span>
                </div>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Secteur de prédilection :</strong>
                  <span style={styles.metaVal}>
                    {selectedPlayer.favoriteSector ? `💻 ${selectedPlayer.favoriteSector.toUpperCase()}` : 'Non spécifié'}
                  </span>
                </div>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Compte créé le :</strong>
                  <span style={styles.metaVal}>{formatDate(selectedPlayer.cree_le)}</span>
                </div>
                <div style={styles.metaCol}>
                  <strong style={styles.metaLabel}>Dernière manche jouée :</strong>
                  <span style={styles.metaVal}>
                    {formatDate(selectedPlayer.lastPlayedDate || selectedPlayer.date_derniere_partie)}
                  </span>
                </div>
              </div>

              {/* Historique des manches jouées */}
              <div style={styles.historySection}>
                <div style={styles.historySectionHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} color="#10b981" />
                    <h3 style={styles.historyTitle}>Historique des scores de {selectedPlayer.pseudo}</h3>
                  </div>
                  <span style={styles.historyCountBadge}>
                    {(selectedPlayer.scores || []).length} score{(selectedPlayer.scores || []).length > 1 ? 's' : ''} enregistré{(selectedPlayer.scores || []).length > 1 ? 's' : ''}
                  </span>
                </div>

                {(selectedPlayer.scores || []).length === 0 ? (
                  <div style={styles.emptyScoresBox}>
                    <Clock size={24} color="#64748b" />
                    <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                      Aucun score détaillé enregistré dans la collection Firestore &apos;scores&apos;.
                    </p>
                  </div>
                ) : (
                  <div style={styles.scoresList}>
                    {selectedPlayer.scores.map((sc, i) => (
                      <div key={sc.id || i} style={styles.scoreRowCard}>
                        <div style={styles.scoreRowTop}>
                          <div style={styles.scoreDateBox}>
                            <Calendar size={13} color="#10b981" />
                            <strong>{sc.date || formatDate(sc.cree_le)}</strong>
                            {sc.is_official !== false && (
                              <span style={styles.officialPill}>Officiel</span>
                            )}
                          </div>

                          <div style={styles.scoreTotalBox}>
                            <span style={styles.scorePtsBadge}>{sc.score_total || 0} / 5 000 pts</span>
                            <span style={styles.scoreTimeBadge}>
                              <Clock size={11} style={{ marginRight: '3px' }} />
                              {sc.temps_total_secondes || 0}s
                            </span>
                            <span style={styles.scoreEmoji}>{sc.grille_emoji || '—'}</span>
                            <button
                              onClick={() => handleDeleteScore(sc.id)}
                              style={styles.deleteScoreBtn}
                              title="Supprimer ce score"
                              disabled={actionLoading}
                            >
                              <Trash2 size={13} color="#f87171" />
                            </button>
                          </div>
                        </div>

                        {/* Questions détaillées */}
                        {sc.details_par_question && sc.details_par_question.length > 0 && (
                          <div style={styles.scoreDetailsQuestions}>
                            {sc.details_par_question.map((q, qi) => (
                              <div key={qi} style={styles.qDetailItem}>
                                <div style={styles.qNum}>Q{qi + 1}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={styles.qTargetLine}>
                                    <MapPin size={11} color="#10b981" />
                                    <strong style={{ color: '#e2e8f0' }}>{q.lieu_nom || 'Lieu'}</strong>
                                    <span style={{ color: '#64748b' }}>({q.pays || 'Monde'})</span>
                                    <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: 'auto' }}>
                                      Écart : {q.distance_km != null ? `${Math.round(q.distance_km)} km` : '—'}
                                    </span>
                                  </div>
                                  <p style={styles.qTextSmall}>&ldquo;{q.question_texte}&rdquo;</p>
                                </div>
                                <div
                                  style={{
                                    ...styles.qPointsBadge,
                                    background: (q.score >= 900 || (q.score <= 10 && q.score >= 9)) ? 'rgba(16, 185, 129, 0.2)' : (q.score >= 600 || (q.score <= 10 && q.score >= 6)) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: (q.score >= 900 || (q.score <= 10 && q.score >= 9)) ? '#34d399' : (q.score >= 600 || (q.score <= 10 && q.score >= 6)) ? '#fbbf24' : '#f87171',
                                  }}
                                >
                                  {q.score > 10 ? q.score : (q.score || 0) * 100} / 1 000
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zone d'actions Admin */}
              <div style={styles.adminActionSection}>
                <div style={styles.adminActionHeader}>
                  <ShieldAlert size={16} color="#f59e0b" />
                  <strong style={{ fontSize: '13px', color: '#fbbf24' }}>ACTIONS ADMINISTRATEUR SUR CE JOUEUR</strong>
                </div>

                <div style={styles.adminActionButtonsRow}>
                  {/* Réinitialiser mot de passe */}
                  {selectedPlayer.email && (
                    <button
                      onClick={() => handleSendPasswordReset(selectedPlayer)}
                      style={styles.adminBtnResetPwd}
                      disabled={actionLoading}
                    >
                      <KeyRound size={14} />
                      <span>Envoyer email reset mot de passe</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles CSS-in-JS (Design Luxury Dark Emerald & Amber) ─────────────────────
const styles = {
  container: {
    padding: '28px 36px',
    maxWidth: '1400px',
    margin: '0 auto',
    color: '#f8fafc',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: '0.8px',
    marginBottom: '6px',
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
  headerBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: '#34d399',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  /* KPIs */
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
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
    marginBottom: '8px',
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
    marginBottom: '6px',
  },
  kpiFooter: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },

  /* Barre de Pays */
  countryBar: {
    background: 'rgba(4, 20, 15, 0.6)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '14px',
    padding: '12px 18px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    overflowX: 'auto',
  },
  countryBarTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#10b981',
    whiteSpace: 'nowrap',
  },
  countryPillsList: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'nowrap',
    overflowX: 'auto',
  },
  countryPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  countryPillActive: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid #10b981',
    color: '#34d399',
    fontWeight: '800',
  },
  pillCount: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#94a3b8',
  },

  /* Contrôles */
  controlsCard: {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '14px 18px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap',
  },
  searchBox: {
    position: 'relative',
    flex: '1 1 300px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 36px 10px 36px',
    borderRadius: '10px',
    background: 'rgba(2, 11, 8, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  selectWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  sortPrefix: {
    position: 'absolute',
    left: '10px',
    pointerEvents: 'none',
  },
  selectInput: {
    padding: '9px 12px',
    borderRadius: '10px',
    background: 'rgba(2, 11, 8, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  resultsInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '0 4px',
  },
  resultsCount: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  resetFiltersBtn: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  /* Tableau */
  tableCard: {
    background: 'rgba(4, 20, 15, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    background: 'rgba(15, 23, 42, 0.7)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  th: {
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#f8fafc',
    verticalAlign: 'middle',
  },
  rankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '28px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '800',
  },
  normalRank: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  playerInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarImg: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  avatarFallback: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #047857)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '14px',
    color: '#ffffff',
  },
  playerNameCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  nameLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  playerPseudo: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  adminTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontSize: '9px',
    fontWeight: '800',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  founderTag: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    fontSize: '9px',
    fontWeight: '800',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  playerEmail: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  uidLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  uidText: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  copyUidBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '1px',
    display: 'inline-flex',
  },

  /* Cellule Pays */
  countryCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  countryNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  countryFlag: {
    fontSize: '16px',
  },
  countryName: {
    fontWeight: '600',
    color: '#e2e8f0',
  },
  countryRankPill: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '6px',
    width: 'fit-content',
  },
  countryRankPillTop: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    fontWeight: '700',
  },

  /* Scores & Stats */
  scoreCell: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '3px',
  },
  scoreNumber: {
    fontSize: '16px',
    fontWeight: '900',
  },
  scoreMax: {
    fontSize: '11px',
    color: '#64748b',
  },
  avgScoreText: {
    fontWeight: '700',
    color: '#cbd5e1',
  },
  gamesCountBadge: {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.06)',
    fontWeight: '700',
    color: '#ffffff',
  },
  streakBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '8px',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: '12px',
  },
  dateCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dateText: {
    fontSize: '12px',
    color: '#e2e8f0',
  },
  inscriptionText: {
    fontSize: '11px',
    color: '#64748b',
  },
  inspectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  emptyTd: {
    padding: '40px',
    textAlign: 'center',
  },

  /* Modale Fiche Joueur */
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 9, 7, 0.85)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '850px',
    maxHeight: '90vh',
    background: '#041610',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  modalAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #10b981',
  },
  modalAvatarFallback: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #047857)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '22px',
    color: '#ffffff',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '900',
    color: '#ffffff',
  },
  adminTagLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  modalSubRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  modalEmail: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  modalUid: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  copySmallBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'inline-flex',
  },
  modalCloseBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: 'none',
    color: '#94a3b8',
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  actionToast: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    margin: '12px 24px 0',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalKpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
  },
  modalKpiBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '14px',
  },
  modalKpiTitle: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  modalKpiValue: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: '4px',
  },
  modalKpiSub: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  modalProfileMeta: {
    background: 'rgba(2, 11, 8, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '700',
  },
  metaVal: {
    fontSize: '13px',
    color: '#e2e8f0',
  },

  /* Historique des scores */
  historySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historySectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
  },
  historyCountBadge: {
    background: 'rgba(255, 255, 255, 0.06)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '700',
  },
  emptyScoresBox: {
    padding: '24px',
    textAlign: 'center',
    background: 'rgba(2, 11, 8, 0.4)',
    borderRadius: '12px',
  },
  scoresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  scoreRowCard: {
    background: 'rgba(2, 11, 8, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '12px 14px',
  },
  scoreRowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  scoreDateBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  officialPill: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    fontSize: '10px',
    fontWeight: '800',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  scoreTotalBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scorePtsBadge: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#fbbf24',
  },
  scoreTimeBadge: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
  },
  scoreEmoji: {
    fontSize: '14px',
    letterSpacing: '1px',
  },
  deleteScoreBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  scoreDetailsQuestions: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  qDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '6px 8px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  qNum: {
    fontWeight: '800',
    color: '#64748b',
    fontSize: '11px',
  },
  qTargetLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  qTextSmall: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  qPointsBadge: {
    padding: '2px 6px',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '11px',
  },

  /* Actions Admin */
  adminActionSection: {
    background: 'rgba(245, 158, 11, 0.04)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: '12px',
    padding: '14px 18px',
  },
  adminActionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px',
  },
  adminActionButtonsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  adminBtnToggleRole: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  adminBtnResetPwd: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  /* États Chargement / Erreur */
  loadingContainer: {
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorContainer: {
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#10b981',
    color: '#020b08',
    border: 'none',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
  subTabsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  subTabBtn: {
    padding: '10px 18px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  subTabBtnActive: {
    background: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    color: '#ffffff',
  },
  subTabBtnActiveRed: {
    background: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    color: '#fca5a5',
  },
  deletedCountBadge: {
    padding: '2px 8px',
    background: 'rgba(239, 68, 68, 0.25)',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#fca5a5',
    fontWeight: '800',
  },
  deletedSectionCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  deletedHeaderRow: {
    padding: '20px 24px',
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  deletedSectionTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '800',
    color: '#ffffff',
  },
  deletedSectionSubtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.5',
    maxWidth: '700px',
  },
  deletedActionBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  copyAllEmailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 15px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  downloadCsvBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.2s',
  },
  miniCopyBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px',
  },
  deletedReasonBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '11px',
    fontWeight: '600',
  },
  cleanDuplicatesBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 15px',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '10px',
    color: '#fbbf24',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  duplicateCountBadge: {
    padding: '2px 8px',
    background: 'rgba(245, 158, 11, 0.25)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#fbbf24',
    fontWeight: '800',
  },
  duplicateTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    background: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '6px',
    color: '#fbbf24',
    fontSize: '10px',
    fontWeight: '700',
    marginLeft: '6px',
  },
  tableActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tableActionBtnDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#fca5a5',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  bulkActionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    marginBottom: '16px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  bulkDeleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  bulkCancelBtn: {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
  },
  checkboxTh: {
    width: '40px',
    textAlign: 'center',
    padding: '12px 8px',
  },
  checkboxTd: {
    textAlign: 'center',
    padding: '12px 8px',
  },
  checkboxInput: {
    cursor: 'pointer',
    width: '15px',
    height: '15px',
    accentColor: '#ef4444',
  },
};
