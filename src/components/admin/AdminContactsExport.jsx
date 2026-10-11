import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  FileText,
  Mail,
  Users,
  Search,
  Filter,
  Check,
  Copy,
  Printer,
  Sparkles,
  RefreshCw,
  Globe2,
  Calendar,
  Trophy,
  Flame,
  Shield,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  fetchAllPlayersWithStatsAdmin,
  fetchDeletedAccountsAdmin,
} from '../../services/firebase';
import { AGE_RANGE_OPTIONS, PROFESSION_OPTIONS } from '../../utils/geo';

export default function AdminContactsExport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [deletedAccounts, setDeletedAccounts] = useState([]);

  // Filtres
  const [sourceType, setSourceType] = useState('all'); // 'all' | 'with_email' | 'active' | 'deleted'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [sortBy, setSortBy] = useState('registered_desc'); // 'registered_desc' | 'score_desc' | 'pseudo_asc' | 'email_asc'

  // Colonnes personnalisables
  const [columns, setColumns] = useState({
    pseudo: true,
    email: true,
    country: true,
    favoriteSector: true,
    profession: true,
    ageRange: true,
    totalPoints: true,
    gamesCount: true,
    streak: true,
    lastPlayedDate: true,
    createdAt: true,
  });

  // Feedback de copie
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Charger les contacts
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, deleted] = await Promise.all([
        fetchAllPlayersWithStatsAdmin(),
        fetchDeletedAccountsAdmin(),
      ]);
      setPlayers(res.players || []);
      setDeletedAccounts(deleted || []);
    } catch (err) {
      console.error('Erreur chargement contacts admin:', err);
      setError(err.message || 'Impossible de récupérer les contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Liste des pays uniques
  const countriesList = useMemo(() => {
    const set = new Set();
    players.forEach((p) => {
      if (p.country && p.country !== 'Non renseigné') set.add(p.country);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [players]);

  // Liste des secteurs uniques
  const sectorsList = useMemo(() => {
    const set = new Set();
    players.forEach((p) => {
      if (p.favoriteSector) set.add(p.favoriteSector);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [players]);

  // Filtrage des contacts
  const filteredContacts = useMemo(() => {
    if (sourceType === 'deleted') {
      return deletedAccounts
        .filter((d) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const email = (d.email || '').toLowerCase();
          const pseudo = (d.pseudo || '').toLowerCase();
          return email.includes(q) || pseudo.includes(q);
        })
        .map((d) => ({
          id: d.id,
          pseudo: d.pseudo || 'Compte supprimé',
          email: d.email || 'Email non disponible',
          country: 'Archivé',
          favoriteSector: '-',
          profession: '-',
          ageRange: '-',
          totalPoints: d.score_total_cumule || d.bestScore || 0,
          gamesCount: d.parties_jouees || 0,
          streak: 0,
          lastPlayedDate: '-',
          createdAt: d.supprime_le ? new Date(d.supprime_le).toLocaleDateString('fr-FR') : '-',
          isDeleted: true,
        }));
    }

    return players.filter((p) => {
      // Type de source
      if (sourceType === 'with_email' && (!p.email || !p.email.includes('@'))) return false;
      if (sourceType === 'active' && (!p.gamesCount || p.gamesCount < 1)) return false;

      // Recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pseudo = (p.pseudo || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const country = (p.country || '').toLowerCase();
        if (!pseudo.includes(q) && !email.includes(q) && !country.includes(q)) return false;
      }

      // Pays
      if (selectedCountry !== 'all' && p.country !== selectedCountry) return false;

      // Secteur
      if (selectedSector !== 'all' && p.favoriteSector !== selectedSector) return false;

      // Profession
      if (selectedProfession !== 'all' && p.profession !== selectedProfession) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'score_desc') return (b.totalPoints || 0) - (a.totalPoints || 0);
      if (sortBy === 'games_desc') return (b.gamesCount || 0) - (a.gamesCount || 0);
      if (sortBy === 'pseudo_asc') return (a.pseudo || '').localeCompare(b.pseudo || '');
      if (sortBy === 'email_asc') return (a.email || '').localeCompare(b.email || '');
      // Par défaut : date de création / dernière activité
      const da = a.cree_le ? (a.cree_le.seconds ? a.cree_le.seconds : new Date(a.cree_le).getTime()) : 0;
      const db = b.cree_le ? (b.cree_le.seconds ? b.cree_le.seconds : new Date(b.cree_le).getTime()) : 0;
      return db - da;
    });
  }, [players, deletedAccounts, sourceType, searchQuery, selectedCountry, selectedSector, selectedProfession, sortBy]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalPlayers = players.length;
    const withEmail = players.filter((p) => p.email && p.email.includes('@')).length;
    const active = players.filter((p) => (p.gamesCount || 0) > 0).length;
    const totalDeleted = deletedAccounts.length;
    return { totalPlayers, withEmail, active, totalDeleted };
  }, [players, deletedAccounts]);

  // ==========================================================================
  // EXPORT CSV
  // ==========================================================================
  const handleExportCSV = () => {
    if (filteredContacts.length === 0) {
      alert('Aucun contact à exporter avec les filtres actuels.');
      return;
    }

    const headers = [];
    if (columns.pseudo) headers.push('Pseudo');
    if (columns.email) headers.push('Email');
    if (columns.country) headers.push('Pays');
    if (columns.favoriteSector) headers.push('Secteur Favori');
    if (columns.profession) headers.push('Profession');
    if (columns.ageRange) headers.push("Tranche d'Âge");
    if (columns.totalPoints) headers.push('Points Cumulés');
    if (columns.gamesCount) headers.push('Parties Jouées');
    if (columns.streak) headers.push('Série (Jours)');
    if (columns.lastPlayedDate) headers.push('Dernière Partie');
    if (columns.createdAt) headers.push('Date Création');

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredContacts.map((c) => {
      const row = [];
      if (columns.pseudo) row.push(escapeCsv(c.pseudo));
      if (columns.email) row.push(escapeCsv(c.email || 'Non renseigné'));
      if (columns.country) row.push(escapeCsv(c.country || 'Non renseigné'));
      if (columns.favoriteSector) row.push(escapeCsv(c.favoriteSector || '-'));
      if (columns.profession) row.push(escapeCsv(c.profession || '-'));
      if (columns.ageRange) row.push(escapeCsv(c.ageRange || '-'));
      if (columns.totalPoints) row.push(c.totalPoints || 0);
      if (columns.gamesCount) row.push(c.gamesCount || 0);
      if (columns.streak) row.push(c.streak || 0);
      if (columns.lastPlayedDate) row.push(escapeCsv(c.lastPlayedDate || '-'));
      if (columns.createdAt) {
        let dateStr = '-';
        if (c.cree_le) {
          if (c.cree_le.seconds) dateStr = new Date(c.cree_le.seconds * 1000).toISOString().split('T')[0];
          else dateStr = String(c.cree_le).split('T')[0];
        } else if (c.createdAt) {
          dateStr = c.createdAt;
        }
        row.push(escapeCsv(dateStr));
      }
      return row.join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `bizgames_contacts_${sourceType}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================================================
  // EXPORT PDF (Mise en page d'impression professionnelle)
  // ==========================================================================
  const handleExportPDF = () => {
    if (filteredContacts.length === 0) {
      alert('Aucun contact à exporter avec les filtres actuels.');
      return;
    }

    setIsExportingPdf(true);
    const today = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Générer le tableau HTML stylisé
    const tableHeaders = [];
    if (columns.pseudo) tableHeaders.push('<th>Pseudo</th>');
    if (columns.email) tableHeaders.push('<th>Email</th>');
    if (columns.country) tableHeaders.push('<th>Pays</th>');
    if (columns.favoriteSector) tableHeaders.push('<th>Secteur</th>');
    if (columns.profession) tableHeaders.push('<th>Profession</th>');
    if (columns.totalPoints) tableHeaders.push('<th style="text-align:right;">Points</th>');
    if (columns.gamesCount) tableHeaders.push('<th style="text-align:center;">Parties</th>');
    if (columns.streak) tableHeaders.push('<th style="text-align:center;">Série</th>');
    if (columns.lastPlayedDate) tableHeaders.push('<th>Dernière Partie</th>');

    const tableRows = filteredContacts.map((c, index) => {
      const cells = [];
      if (columns.pseudo) cells.push(`<td><strong>${c.pseudo}</strong></td>`);
      if (columns.email) cells.push(`<td><code style="color:#047857;font-size:11px;">${c.email || '-'}</code></td>`);
      if (columns.country) cells.push(`<td>${c.country || '-'}</td>`);
      if (columns.favoriteSector) cells.push(`<td>${c.favoriteSector || '-'}</td>`);
      if (columns.profession) cells.push(`<td>${c.profession || '-'}</td>`);
      if (columns.totalPoints) cells.push(`<td style="text-align:right;font-weight:bold;">${(c.totalPoints || 0).toLocaleString('fr-FR')}</td>`);
      if (columns.gamesCount) cells.push(`<td style="text-align:center;">${c.gamesCount || 0}</td>`);
      if (columns.streak) cells.push(`<td style="text-align:center;">${c.streak || 0}j</td>`);
      if (columns.lastPlayedDate) cells.push(`<td>${c.lastPlayedDate || '-'}</td>`);
      return `<tr class="${index % 2 === 0 ? 'even' : 'odd'}">${cells.join('')}</tr>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres contextuelles (popups) pour générer le PDF.');
      setIsExportingPdf(false);
      return;
    }

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>BizGames — Export Contacts & Joueurs (${filteredContacts.length})</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #10b981;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo {
            font-size: 24px;
            font-weight: 900;
            color: #047857;
            letter-spacing: -0.5px;
          }
          .tagline {
            font-size: 11px;
            color: #64748b;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .summary-cards {
            display: flex;
            gap: 15px;
            margin-bottom: 18px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            flex: 1;
          }
          .card-val {
            font-size: 18px;
            font-weight: 800;
            color: #047857;
          }
          .card-lbl {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border: 1px solid #0f172a;
            text-align: left;
          }
          td {
            padding: 6px 10px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
          }
          tr.even {
            background: #ffffff;
          }
          tr.odd {
            background: #f8fafc;
          }
          .footer {
            margin-top: 20px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            font-size: 10px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div>
              <div class="logo">BIZGAMES 🌍</div>
              <div class="tagline">Plateforme d'administration • Export Officiel des Contacts</div>
            </div>
          </div>
          <div class="meta">
            <div><strong>Date d'export :</strong> ${today}</div>
            <div><strong>Filtre source :</strong> ${sourceType.toUpperCase()}</div>
            <div><strong>Contacts sélectionnés :</strong> ${filteredContacts.length}</div>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-val">${filteredContacts.length}</div>
            <div class="card-lbl">Contacts exportés</div>
          </div>
          <div class="card">
            <div class="card-val">${filteredContacts.filter((c) => c.email && c.email.includes('@')).length}</div>
            <div class="card-lbl">Emails valides</div>
          </div>
          <div class="card">
            <div class="card-val">${filteredContacts.filter((c) => (c.gamesCount || 0) > 0).length}</div>
            <div class="card-lbl">Joueurs actifs</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>${tableHeaders.join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <span>BizGames — Document confidentiel interne destiné à l'équipe d'administration</span>
          <span>Page générée le ${today}</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
    setIsExportingPdf(false);
  };

  // ==========================================================================
  // COPIE DE TOUS LES EMAILS
  // ==========================================================================
  const handleCopyEmails = () => {
    const validEmails = filteredContacts
      .map((c) => (c.email || '').trim())
      .filter((e) => e && e.includes('@'));

    if (validEmails.length === 0) {
      alert('Aucune adresse email valide trouvée dans cette sélection.');
      return;
    }

    const uniqueEmails = Array.from(new Set(validEmails));
    const text = uniqueEmails.join(', ');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedEmails(true);
        setTimeout(() => setCopiedEmails(false), 3000);
      });
    } else {
      alert(`${uniqueEmails.length} emails extraits :\n\n` + text);
    }
  };

  const toggleColumn = (key) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={styles.container}>
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div style={styles.headerBanner}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconBox}>
            <FileSpreadsheet size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={styles.headerTitle}>Export des Contacts & Joueurs</h2>
              <span style={styles.pillFormat}>CSV & PDF DISPONIBLES</span>
            </div>
            <p style={styles.headerSubtitle}>
              Exportez en un clic vos contacts, adresses email et statistiques pour vos campagnes de newsletter, rapports PDF ou intégration Excel / CRM.
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button onClick={loadData} style={styles.refreshBtn} title="Actualiser les données">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span className="small-screen-hide">Actualiser</span>
          </button>
        </div>
      </div>

      {/* 2. STATS RAPIDES DES CONTACTS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconBox}>
            <Users size={18} color="#10b981" />
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>TOTAL JOUEURS INSCRITS</span>
            <span style={styles.statVal}>{stats.totalPlayers}</span>
            <span style={styles.statNote}>Dans la base Firestore</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
            <Mail size={18} color="#38bdf8" />
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>EMAILS VALIDES REÇUS</span>
            <span style={styles.statVal}>{stats.withEmail}</span>
            <span style={styles.statNote}>Prêts pour export newsletter</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Flame size={18} color="#f59e0b" />
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>JOUEURS ACTIFS</span>
            <span style={styles.statVal}>{stats.active}</span>
            <span style={styles.statNote}>Au moins 1 partie complétée</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Shield size={18} color="#ef4444" />
          </div>
          <div style={styles.statBody}>
            <span style={styles.statLabel}>COMPTES ARCHIVÉS (RGPD)</span>
            <span style={styles.statVal}>{stats.totalDeleted}</span>
            <span style={styles.statNote}>Historique des suppressions</span>
          </div>
        </div>
      </div>

      {/* 3. BARRE D'EXPORT PROMINENTE (BOUTONS CSV / PDF / COPIE) */}
      <div style={styles.exportBar}>
        <div style={styles.exportBarLeft}>
          <strong style={{ fontSize: '15px', color: '#ffffff' }}>
            {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} sélectionné{filteredContacts.length > 1 ? 's' : ''}
          </strong>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            (dont {filteredContacts.filter((c) => c.email && c.email.includes('@')).length} avec adresse email)
          </span>
        </div>

        <div style={styles.exportBarButtons}>
          {/* Bouton Exporter CSV */}
          <button
            onClick={handleExportCSV}
            disabled={loading || filteredContacts.length === 0}
            style={styles.exportCsvBtn}
            title="Télécharger le fichier CSV pour Excel / Google Sheets"
          >
            <Download size={16} />
            <span>Exporter en CSV (Excel)</span>
          </button>

          {/* Bouton Exporter PDF */}
          <button
            onClick={handleExportPDF}
            disabled={loading || filteredContacts.length === 0 || isExportingPdf}
            style={styles.exportPdfBtn}
            title="Générer un PDF propre et prêt à imprimer"
          >
            <FileText size={16} />
            <span>Exporter en PDF</span>
          </button>

          {/* Bouton Copier les Emails */}
          <button
            onClick={handleCopyEmails}
            disabled={loading || filteredContacts.length === 0}
            style={styles.copyEmailsBtn}
            title="Copier toutes les adresses email pour une newsletter"
          >
            {copiedEmails ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copiedEmails ? 'Emails copiés !' : 'Copier les emails'}</span>
          </button>
        </div>
      </div>

      {/* 4. FILTRES ET PARAMÈTRES D'EXPORT */}
      <div style={styles.filtersCard}>
        <div style={styles.filtersTopRow}>
          {/* Sélection de la source */}
          <div style={styles.sourceTabs}>
            <button
              onClick={() => setSourceType('all')}
              style={{ ...styles.sourceTabBtn, ...(sourceType === 'all' ? styles.sourceTabBtnActive : {}) }}
            >
              Tous les joueurs ({stats.totalPlayers})
            </button>
            <button
              onClick={() => setSourceType('with_email')}
              style={{ ...styles.sourceTabBtn, ...(sourceType === 'with_email' ? styles.sourceTabBtnActive : {}) }}
            >
              Avec Email uniquement ({stats.withEmail})
            </button>
            <button
              onClick={() => setSourceType('active')}
              style={{ ...styles.sourceTabBtn, ...(sourceType === 'active' ? styles.sourceTabBtnActive : {}) }}
            >
              Joueurs Actifs ({stats.active})
            </button>
            <button
              onClick={() => setSourceType('deleted')}
              style={{ ...styles.sourceTabBtn, ...(sourceType === 'deleted' ? styles.sourceTabBtnActive : {}) }}
            >
              Comptes Supprimés / RGPD ({stats.totalDeleted})
            </button>
          </div>
        </div>

        {/* Ligne de recherche & menus déroulants */}
        <div style={styles.filtersControlsRow}>
          {/* Recherche */}
          <div style={styles.searchBox}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par email, pseudo ou pays..."
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Pays */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">🌍 Tous les pays ({countriesList.length})</option>
            {countriesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Secteur */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">🏢 Tous les secteurs</option>
            {sectorsList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.selectInput}
          >
            <option value="registered_desc">📅 Inscription : Plus récent</option>
            <option value="score_desc">🏆 Score : Plus élevé</option>
            <option value="games_desc">🎮 Nombre de parties</option>
            <option value="pseudo_asc">🔤 Pseudo (A-Z)</option>
            <option value="email_asc">📧 Email (A-Z)</option>
          </select>
        </div>

        {/* Sélecteur de colonnes à inclure dans l'export */}
        <div style={styles.columnsSelectorBox}>
          <span style={styles.columnsSelectorLabel}>Colonnes incluses dans l'export :</span>
          <div style={styles.columnsChips}>
            {[
              { key: 'pseudo', label: 'Pseudo' },
              { key: 'email', label: 'Email' },
              { key: 'country', label: 'Pays' },
              { key: 'favoriteSector', label: 'Secteur Favori' },
              { key: 'profession', label: 'Profession' },
              { key: 'ageRange', label: 'Âge' },
              { key: 'totalPoints', label: 'Score Total' },
              { key: 'gamesCount', label: 'Parties Jouées' },
              { key: 'streak', label: 'Série (Jours)' },
              { key: 'lastPlayedDate', label: 'Dernière Activité' },
              { key: 'createdAt', label: 'Date Création' },
            ].map((col) => {
              const isChecked = columns[col.key];
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggleColumn(col.key)}
                  style={{
                    ...styles.columnChip,
                    ...(isChecked ? styles.columnChipActive : {}),
                  }}
                >
                  {isChecked ? <CheckSquare size={13} color="#10b981" /> : <Square size={13} color="#64748b" />}
                  <span>{col.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. TABLEAU D'APERÇU EN DIRECT */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderBar}>
          <div>
            <h3 style={styles.tableTitle}>Aperçu des Contacts avant Export</h3>
            <span style={styles.tableSubtitle}>
              Affichage des {Math.min(50, filteredContacts.length)} premiers contacts sur {filteredContacts.length}
            </span>
          </div>

          <div style={styles.quickCount}>
            <span>Prêts à exporter : <strong>{filteredContacts.length}</strong></span>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <RefreshCw size={24} color="#10b981" className="spin" />
            <p style={{ marginTop: '10px', color: '#94a3b8' }}>Chargement des contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={styles.emptyState}>
            <Users size={32} color="#64748b" />
            <p style={{ marginTop: '10px', color: '#cbd5e1', fontWeight: '600' }}>
              Aucun contact trouvé pour cette sélection.
            </p>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Essayez de réinitialiser vos filtres ou de sélectionner « Tous les joueurs ».
            </p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Pays</th>
                  <th style={styles.th}>Secteur</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Score Total</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Parties</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Série</th>
                  <th style={styles.th}>Dernière Partie</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.slice(0, 50).map((c, i) => (
                  <tr key={c.id || i} style={styles.tr}>
                    <td style={styles.td}>
                      <strong style={{ color: '#ffffff' }}>{c.pseudo}</strong>
                    </td>
                    <td style={styles.td}>
                      {c.email && c.email.includes('@') ? (
                        <code style={styles.emailCode}>{c.email}</code>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '11px' }}>Non renseigné</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span>{c.country || '-'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.favoriteSector || '-'}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', color: '#34d399' }}>
                      {(c.totalPoints || 0).toLocaleString('fr-FR')} pts
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#f8fafc' }}>
                      {c.gamesCount || 0}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#f59e0b', fontWeight: '700' }}>
                      {c.streak > 0 ? `🔥 ${c.streak}j` : '-'}
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{c.lastPlayedDate || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    paddingBottom: '40px',
  },
  headerBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.25) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '18px',
    padding: '24px 28px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flex: 1,
    minWidth: '280px',
  },
  headerIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.18)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    fontFamily: 'Outfit, sans-serif',
  },
  pillFormat: {
    fontSize: '11px',
    fontWeight: '800',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    padding: '3px 9px',
    borderRadius: '8px',
  },
  headerSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '6px 0 0',
    lineHeight: 1.45,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 15px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  statCard: {
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  statIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statLabel: {
    fontSize: '10.5px',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.6px',
  },
  statVal: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 1.1,
  },
  statNote: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  exportBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '20px 24px',
    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    borderRadius: '18px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
  },
  exportBarLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    flexWrap: 'wrap',
  },
  exportBarButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  exportCsvBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 20px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#03120e',
    fontWeight: '800',
    fontSize: '13.5px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
    transition: 'all 0.15s ease',
  },
  exportPdfBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 20px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '13.5px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
    transition: 'all 0.15s ease',
  },
  copyEmailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 18px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '13px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filtersCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filtersTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sourceTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sourceTabBtn: {
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sourceTabBtnActive: {
    background: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
    color: '#34d399',
    fontWeight: '700',
  },
  filtersControlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(2, 11, 8, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '9px 14px',
    flex: '1 1 260px',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '13px',
    width: '100%',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  selectInput: {
    background: 'rgba(2, 11, 8, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '9px 14px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    flex: '1 1 180px',
  },
  columnsSelectorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  columnsSelectorLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  columnsChips: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  columnChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#64748b',
    fontSize: '11.5px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  columnChipActive: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    color: '#e2e8f0',
  },
  tableCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '18px',
    overflow: 'hidden',
  },
  tableHeaderBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  tableTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  tableSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  quickCount: {
    fontSize: '12.5px',
    color: '#34d399',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 18px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'background 0.12s ease',
  },
  td: {
    padding: '13px 18px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  emailCode: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  emptyState: {
    padding: '50px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
