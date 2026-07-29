import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import './admin.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const isFirebaseConfigured = requiredFirebaseKeys.every((key) => Boolean(firebaseConfig[key]));
const firebaseApp = isFirebaseConfigured ? getApps()[0] || initializeApp(firebaseConfig) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const allowedRoles = ['owner', 'admin', 'editor'];

function AdminIcon({ name, size = 20 }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    sermon: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z"/><path d="M8 20a3 3 0 0 1 0-6h11M9 8h6"/></>,
    series: <><rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="11" width="16" height="9" rx="1"/><path d="M8 15h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z"/><path d="m14 7 3 3"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.5 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name] || paths.dashboard}</svg>;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getYouTubeId(value) {
  if (!value) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(value.trim())) return value.trim();
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0];
    if (url.pathname.includes('/shorts/')) return url.pathname.split('/shorts/')[1].split('/')[0];
    if (url.pathname.includes('/embed/')) return url.pathname.split('/embed/')[1].split('/')[0];
    return url.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

function splitLines(value) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function splitParagraphs(value) {
  return value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
}

function dateString(value) {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function timestampNumber(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return new Date(value || 0).getTime();
}

function friendlyError(error) {
  const messages = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/network-request-failed': 'The network request failed. Check your connection.',
    'permission-denied': 'Your account does not have permission to complete that action.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
}

function LoadingScreen({ label = 'Opening the dashboard' }) {
  return <div className="admin-full-state"><span className="admin-spinner"/><p>{label}</p></div>;
}

function MissingConfiguration() {
  return <div className="admin-auth-page"><div className="admin-auth-card admin-config-card"><div className="admin-auth-brand"><span>CS</span><div><strong>Christopher Shelley</strong><small>Ministry Administration</small></div></div><AdminIcon name="alert" size={32}/><h1>Firebase is not connected yet.</h1><p>Add the Firebase web configuration values as GitHub Actions secrets, then rebuild the website. The public Phase 1 demonstration remains available while configuration is incomplete.</p><div className="admin-code-list"><code>VITE_FIREBASE_API_KEY</code><code>VITE_FIREBASE_AUTH_DOMAIN</code><code>VITE_FIREBASE_PROJECT_ID</code><code>VITE_FIREBASE_APP_ID</code></div><Link className="admin-button admin-button-primary" to="/">Return to website</Link></div></div>;
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (loginError) {
      setError(friendlyError(loginError));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError('Enter your email address first, then choose Reset password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('A password-reset email has been sent.');
    } catch (resetError) {
      setError(friendlyError(resetError));
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-auth-page"><div className="admin-auth-card"><div className="admin-auth-brand"><span>CS</span><div><strong>Christopher Shelley</strong><small>Ministry Administration</small></div></div><span className="admin-kicker">Private dashboard</span><h1>Welcome back.</h1><p>Sign in with the approved Firebase administrator account.</p>{error && <div className="admin-alert error">{error}</div>}{message && <div className="admin-alert success">{message}</div>}<form className="admin-auth-form" onSubmit={handleLogin}><label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email}/></label><label>Password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></label><button className="admin-button admin-button-primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button></form><button className="admin-text-button" disabled={busy} onClick={handleReset} type="button">Reset password</button><Link className="admin-return-link" to="/">← Return to the public website</Link></div></div>;
}

function AccessDenied({ user, reason }) {
  return <div className="admin-auth-page"><div className="admin-auth-card admin-config-card"><AdminIcon name="alert" size={32}/><span className="admin-kicker">Access restricted</span><h1>This account is not approved.</h1><p>{reason || 'An owner must create an active users document for this Firebase account before it can enter the dashboard.'}</p><p className="admin-muted">Signed in as {user?.email}</p><button className="admin-button admin-button-primary" onClick={() => signOut(auth)} type="button">Sign out</button><Link className="admin-return-link" to="/">Return to website</Link></div></div>;
}

function AdminGate() {
  const [state, setState] = useState({ loading: true, user: null, profile: null, reason: '' });

  useEffect(() => {
    if (!auth || !db) return undefined;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, profile: null, reason: '' });
        return;
      }
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
        if (!profileSnapshot.exists()) {
          setState({ loading: false, user, profile: null, reason: 'No staff profile exists for this account.' });
          return;
        }
        const profile = profileSnapshot.data();
        if (!profile.active || !allowedRoles.includes(profile.role)) {
          setState({ loading: false, user, profile: null, reason: 'This staff profile is inactive or does not have a dashboard role.' });
          return;
        }
        setState({ loading: false, user, profile: { id: profileSnapshot.id, ...profile }, reason: '' });
      } catch (error) {
        setState({ loading: false, user, profile: null, reason: friendlyError(error) });
      }
    });
  }, []);

  if (state.loading) return <LoadingScreen/>;
  if (!state.user) return <LoginPage/>;
  if (!state.profile) return <AccessDenied reason={state.reason} user={state.user}/>;
  return <AdminRoutes profile={state.profile} user={state.user}/>;
}

function AdminLayout({ profile, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    ['/admin', 'dashboard', 'Dashboard'],
    ['/admin/sermons', 'sermon', 'Sermons'],
    ['/admin/series', 'series', 'Series'],
    ['/admin/settings', 'settings', 'Site settings'],
  ];
  return <div className="admin-shell"><aside className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`}><div className="admin-sidebar-head"><Link className="admin-logo" to="/admin" onClick={() => setMenuOpen(false)}><span>CS</span><div><strong>Ministry Admin</strong><small>Christopher Shelley</small></div></Link><button aria-label="Close menu" className="admin-mobile-close" onClick={() => setMenuOpen(false)} type="button"><AdminIcon name="close"/></button></div><nav className="admin-nav">{navItems.map(([to, icon, label]) => <NavLink className={({ isActive }) => isActive ? 'active' : ''} end={to === '/admin'} key={to} onClick={() => setMenuOpen(false)} to={to}><AdminIcon name={icon}/><span>{label}</span></NavLink>)}</nav><div className="admin-sidebar-foot"><div className="admin-user"><span>{(profile.displayName || user.email || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{profile.displayName || 'Administrator'}</strong><small>{profile.role}</small></div></div><button onClick={() => signOut(auth)} type="button"><AdminIcon name="logout"/><span>Sign out</span></button></div></aside><div className="admin-workspace"><header className="admin-topbar"><button aria-label="Open menu" className="admin-menu-button" onClick={() => setMenuOpen(true)} type="button"><AdminIcon name="menu"/></button><div><strong>Christopher Shelley</strong><span>Content Management System</span></div><Link className="admin-view-site" to="/"><AdminIcon name="eye" size={17}/> View website</Link></header><main className="admin-main"><Outlet context={{ profile, user }}/></main></div>{menuOpen && <button aria-label="Close navigation" className="admin-overlay" onClick={() => setMenuOpen(false)} type="button"/>}</div>;
}

async function loadAdminCollections() {
  const [sermonSnapshot, seriesSnapshot] = await Promise.all([
    getDocs(collection(db, 'sermons')),
    getDocs(collection(db, 'series')),
  ]);
  const sermons = sermonSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampNumber(b.updatedAt || b.createdAt || b.datePreached) - timestampNumber(a.updatedAt || a.createdAt || a.datePreached));
  const series = seriesSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  return { sermons, series };
}

function PageHeader({ eyebrow, title, copy, action }) {
  return <header className="admin-page-header"><div><span>{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</header>;
}

function StatusBadge({ status }) {
  return <span className={`admin-status ${status || 'draft'}`}>{status || 'draft'}</span>;
}

function DashboardPage() {
  const [data, setData] = useState({ sermons: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminCollections().then(setData).catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false));
  }, []);

  const published = data.sermons.filter((item) => item.status === 'published').length;
  const drafts = data.sermons.filter((item) => item.status === 'draft').length;
  const archived = data.sermons.filter((item) => item.status === 'archived').length;
  return <><PageHeader action={<Link className="admin-button admin-button-primary" to="/admin/sermons/new"><AdminIcon name="plus" size={18}/> New sermon</Link>} copy="Manage the messages, series, and public content that appear across the website." eyebrow="Overview" title="Ministry dashboard"/>{error && <div className="admin-alert error">{error}</div>}{loading ? <LoadingScreen label="Loading ministry content"/> : <><section className="admin-stat-grid"><article><span>All sermons</span><strong>{data.sermons.length}</strong><small>{archived} archived</small></article><article><span>Published</span><strong>{published}</strong><small>Visible publicly</small></article><article><span>Drafts</span><strong>{drafts}</strong><small>Still in progress</small></article><article><span>Series</span><strong>{data.series.length}</strong><small>{data.series.filter((item) => item.published).length} published</small></article></section><section className="admin-panel"><div className="admin-panel-head"><div><span>Recently updated</span><h2>Latest sermon work</h2></div><Link to="/admin/sermons">Manage all sermons</Link></div>{data.sermons.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Message</th><th>Scripture</th><th>Status</th><th>Last updated</th><th/></tr></thead><tbody>{data.sermons.slice(0, 6).map((sermon) => <tr key={sermon.id}><td><strong>{sermon.title}</strong><small>{sermon.seriesTitle || 'Standalone sermon'}</small></td><td>{sermon.scripture || '—'}</td><td><StatusBadge status={sermon.status}/></td><td>{dateString(sermon.updatedAt || sermon.datePreached) || '—'}</td><td><Link className="admin-icon-button" aria-label={`Edit ${sermon.title}`} to={`/admin/sermons/${sermon.id}`}><AdminIcon name="edit" size={17}/></Link></td></tr>)}</tbody></table></div> : <AdminEmpty title="No sermons yet" copy="Create the first sermon record to begin building the live library." action={<Link className="admin-button admin-button-primary" to="/admin/sermons/new">Create sermon</Link>}/>}</section></>}</>;
}

function AdminEmpty({ title, copy, action }) {
  return <div className="admin-empty"><AdminIcon name="sermon" size={30}/><h2>{title}</h2><p>{copy}</p>{action}</div>;
}

function SermonsPage() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const data = await loadAdminCollections();
      setSermons(data.sermons);
    } catch (loadError) {
      setError(friendlyError(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => sermons.filter((sermon) => {
    const text = [sermon.title, sermon.scripture, sermon.seriesTitle, sermon.summary].join(' ').toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (status === 'all' || sermon.status === status);
  }), [sermons, search, status]);

  async function removeSermon(sermon) {
    if (!window.confirm(`Permanently delete “${sermon.title}”? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'sermons', sermon.id));
      setSermons((items) => items.filter((item) => item.id !== sermon.id));
    } catch (deleteError) {
      setError(friendlyError(deleteError));
    }
  }

  return <><PageHeader action={<Link className="admin-button admin-button-primary" to="/admin/sermons/new"><AdminIcon name="plus" size={18}/> New sermon</Link>} copy="Create, revise, publish, archive, and organize every sermon in the public library." eyebrow="Content" title="Sermons"/><section className="admin-panel"><div className="admin-filters"><input aria-label="Search sermons" onChange={(event) => setSearch(event.target.value)} placeholder="Search title, passage, or series…" type="search" value={search}/><select aria-label="Filter by status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select></div>{error && <div className="admin-alert error">{error}</div>}{loading ? <LoadingScreen label="Loading sermons"/> : filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Message</th><th>Scripture</th><th>Status</th><th>Date preached</th><th>Actions</th></tr></thead><tbody>{filtered.map((sermon) => <tr key={sermon.id}><td><strong>{sermon.title}</strong><small>{sermon.seriesTitle || 'Standalone sermon'}</small></td><td>{sermon.scripture || '—'}</td><td><StatusBadge status={sermon.status}/></td><td>{dateString(sermon.datePreached) || '—'}</td><td><div className="admin-row-actions"><Link aria-label={`Edit ${sermon.title}`} className="admin-icon-button" to={`/admin/sermons/${sermon.id}`}><AdminIcon name="edit" size={17}/></Link>{sermon.status === 'published' && sermon.slug && <Link aria-label={`View ${sermon.title}`} className="admin-icon-button" to={`/sermons/${sermon.slug}`}><AdminIcon name="eye" size={17}/></Link>}<button aria-label={`Delete ${sermon.title}`} className="admin-icon-button danger" onClick={() => removeSermon(sermon)} type="button"><AdminIcon name="trash" size={17}/></button></div></td></tr>)}</tbody></table></div> : <AdminEmpty action={<Link className="admin-button admin-button-primary" to="/admin/sermons/new">Create a sermon</Link>} copy="No sermon records match the current filters." title="Nothing found"/>}</section></>;
}

const emptySermon = {
  title: '', slug: '', summary: '', scripture: '', scriptureBook: '', datePreached: new Date().toISOString().slice(0, 10),
  youtubeUrl: '', duration: '', seriesId: '', topics: '', status: 'draft', featured: false,
  speaker: 'Christopher Shelley', bigIdea: '', outline: '', notes: '',
};

function SermonEditorPage({ user }) {
  const { sermonId } = useParams();
  const navigate = useNavigate();
  const isNew = sermonId === 'new';
  const [form, setForm] = useState(emptySermon);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const seriesSnapshot = await getDocs(collection(db, 'series'));
        setSeries(seriesSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => Number(a.order || 0) - Number(b.order || 0)));
        if (!isNew) {
          const sermonSnapshot = await getDoc(doc(db, 'sermons', sermonId));
          if (!sermonSnapshot.exists()) throw new Error('This sermon record no longer exists.');
          const data = sermonSnapshot.data();
          setForm({
            ...emptySermon,
            ...data,
            datePreached: dateString(data.datePreached),
            youtubeUrl: data.youtubeUrl || data.youtubeId || '',
            topics: (data.topics || []).join(', '),
            outline: (data.outline || []).join('\n'),
            notes: (data.notes || []).flatMap((section) => section.paragraphs || []).join('\n\n'),
          });
          setSlugTouched(true);
        }
      } catch (loadError) {
        setError(friendlyError(loadError));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isNew, sermonId]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function saveSermon(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const cleanSlug = slugify(form.slug || form.title);
    if (!form.title.trim() || !cleanSlug || !form.scripture.trim() || !form.summary.trim() || !form.bigIdea.trim()) {
      setError('Complete the title, URL slug, Scripture, summary, and central truth before saving.');
      return;
    }
    setSaving(true);
    try {
      const duplicateSnapshot = await getDocs(query(collection(db, 'sermons'), where('slug', '==', cleanSlug)));
      if (duplicateSnapshot.docs.some((item) => item.id !== sermonId)) throw new Error('Another sermon already uses that URL slug.');
      const selectedSeries = series.find((item) => item.id === form.seriesId);
      const paragraphs = splitParagraphs(form.notes);
      const payload = {
        title: form.title.trim(),
        slug: cleanSlug,
        summary: form.summary.trim(),
        scripture: form.scripture.trim(),
        scriptureBook: form.scriptureBook.trim(),
        datePreached: form.datePreached,
        youtubeUrl: form.youtubeUrl.trim(),
        youtubeId: getYouTubeId(form.youtubeUrl),
        duration: form.duration.trim(),
        seriesId: form.seriesId || '',
        seriesTitle: selectedSeries?.title || '',
        seriesSlug: selectedSeries?.slug || '',
        topics: form.topics.split(',').map((item) => item.trim()).filter(Boolean),
        status: form.status,
        featured: Boolean(form.featured),
        speaker: form.speaker.trim() || 'Christopher Shelley',
        bigIdea: form.bigIdea.trim(),
        outline: splitLines(form.outline),
        notes: paragraphs.length ? [{ heading: 'Sermon Notes', paragraphs }] : [],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      let savedId = sermonId;
      if (isNew) {
        const created = await addDoc(collection(db, 'sermons'), { ...payload, createdAt: serverTimestamp(), createdBy: user.uid });
        savedId = created.id;
      } else {
        await updateDoc(doc(db, 'sermons', sermonId), payload);
      }
      setSuccess(form.status === 'published' ? 'Sermon saved and published.' : 'Sermon saved successfully.');
      if (isNew) navigate(`/admin/sermons/${savedId}`, { replace: true });
    } catch (saveError) {
      setError(friendlyError(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen label="Opening sermon editor"/>;
  return <><PageHeader action={<Link className="admin-button admin-button-quiet" to="/admin/sermons"><AdminIcon name="back" size={18}/> Back to sermons</Link>} copy={isNew ? 'Create a message as a draft, or publish it immediately to the public library.' : 'Update the sermon content and choose when it should be visible publicly.'} eyebrow="Sermon editor" title={isNew ? 'Create a sermon' : 'Edit sermon'}/>{error && <div className="admin-alert error">{error}</div>}{success && <div className="admin-alert success"><AdminIcon name="check" size={17}/>{success}</div>}<form className="admin-editor" onSubmit={saveSermon}><section className="admin-form-card"><div className="admin-form-card-head"><span>01</span><div><h2>Message identity</h2><p>The public title, passage, and basic sermon details.</p></div></div><div className="admin-field-grid"><label className="admin-field admin-span-2">Sermon title<input onChange={(event) => updateField('title', event.target.value)} required value={form.title}/></label><label className="admin-field admin-span-2">URL slug<div className="admin-prefix-input"><span>/sermons/</span><input onChange={(event) => { setSlugTouched(true); updateField('slug', event.target.value); }} required value={form.slug}/></div></label><label className="admin-field">Scripture passage<input onChange={(event) => updateField('scripture', event.target.value)} placeholder="Philippians 2:1–11" required value={form.scripture}/></label><label className="admin-field">Bible book<input onChange={(event) => updateField('scriptureBook', event.target.value)} placeholder="Philippians" value={form.scriptureBook}/></label><label className="admin-field">Date preached<input onChange={(event) => updateField('datePreached', event.target.value)} type="date" value={form.datePreached}/></label><label className="admin-field">Speaker<input onChange={(event) => updateField('speaker', event.target.value)} value={form.speaker}/></label><label className="admin-field admin-span-2">Short summary<textarea onChange={(event) => updateField('summary', event.target.value)} required rows="4" value={form.summary}/></label><label className="admin-field admin-span-2">Central truth<textarea onChange={(event) => updateField('bigIdea', event.target.value)} required rows="3" value={form.bigIdea}/></label></div></section><section className="admin-form-card"><div className="admin-form-card-head"><span>02</span><div><h2>Media and organization</h2><p>Connect the video and make the sermon easy to discover.</p></div></div><div className="admin-field-grid"><label className="admin-field admin-span-2">YouTube link or video ID<input onChange={(event) => updateField('youtubeUrl', event.target.value)} placeholder="https://youtube.com/watch?v=…" value={form.youtubeUrl}/><small>{getYouTubeId(form.youtubeUrl) ? `Detected video ID: ${getYouTubeId(form.youtubeUrl)}` : 'Videos remain hosted on YouTube.'}</small></label><label className="admin-field">Duration<input onChange={(event) => updateField('duration', event.target.value)} placeholder="28 min" value={form.duration}/></label><label className="admin-field">Sermon series<select onChange={(event) => updateField('seriesId', event.target.value)} value={form.seriesId}><option value="">Standalone sermon</option>{series.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="admin-field admin-span-2">Topics<input onChange={(event) => updateField('topics', event.target.value)} placeholder="Faith, Discipleship, Christian Living" value={form.topics}/><small>Separate topics with commas.</small></label></div></section><section className="admin-form-card"><div className="admin-form-card-head"><span>03</span><div><h2>Outline and notes</h2><p>Build the study material displayed below the sermon video.</p></div></div><div className="admin-field-grid"><label className="admin-field admin-span-2">Message outline<textarea onChange={(event) => updateField('outline', event.target.value)} placeholder={'One point per line\nThe example of Christ\nThe call to humility'} rows="7" value={form.outline}/></label><label className="admin-field admin-span-2">Sermon notes<textarea onChange={(event) => updateField('notes', event.target.value)} placeholder="Separate paragraphs with a blank line." rows="16" value={form.notes}/></label></div></section><aside className="admin-publish-card"><div><span>Publication</span><h2>Ready to save?</h2><p>Drafts stay private. Published sermons become readable by everyone immediately.</p></div><label className="admin-field">Status<select onChange={(event) => updateField('status', event.target.value)} value={form.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-check"><input checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} type="checkbox"/><span><strong>Feature this sermon</strong><small>Prioritize it on the homepage.</small></span></label><button className="admin-button admin-button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save sermon'}</button>{!isNew && form.status === 'published' && form.slug && <Link className="admin-button admin-button-quiet" to={`/sermons/${form.slug}`}><AdminIcon name="eye" size={17}/> Preview public page</Link>}</aside></form></>;
}

const emptySeries = { title: '', slug: '', description: '', order: 1, published: false };

function SeriesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptySeries);
  const [editingId, setEditingId] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const snapshot = await getDocs(collection(db, 'series'));
    setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => Number(a.order || 0) - Number(b.order || 0)));
  }

  useEffect(() => { refresh().catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false)); }, []);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  function editSeries(item) {
    setEditingId(item.id);
    setForm({ title: item.title || '', slug: item.slug || '', description: item.description || '', order: item.order || 1, published: Boolean(item.published) });
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId('');
    setForm({ ...emptySeries, order: items.length + 1 });
    setSlugTouched(false);
  }

  async function saveSeries(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const cleanSlug = slugify(form.slug || form.title);
      if (!form.title.trim() || !cleanSlug || !form.description.trim()) throw new Error('Complete the series title, slug, and description.');
      const payload = { title: form.title.trim(), slug: cleanSlug, description: form.description.trim(), order: Number(form.order) || 1, published: Boolean(form.published), updatedAt: serverTimestamp() };
      if (editingId) await updateDoc(doc(db, 'series', editingId), payload);
      else await addDoc(collection(db, 'series'), { ...payload, createdAt: serverTimestamp() });
      await refresh();
      resetForm();
    } catch (saveError) {
      setError(friendlyError(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function removeSeries(item) {
    if (!window.confirm(`Delete the “${item.title}” series? Sermons will remain, but their stored series details will not be changed automatically.`)) return;
    try {
      await deleteDoc(doc(db, 'series', item.id));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) resetForm();
    } catch (deleteError) {
      setError(friendlyError(deleteError));
    }
  }

  return <><PageHeader copy="Create the collections visitors use to follow related sermons in order." eyebrow="Organization" title="Sermon series"/>{error && <div className="admin-alert error">{error}</div>}<div className="admin-two-column"><form className="admin-form-card admin-series-form" onSubmit={saveSeries}><div className="admin-form-card-head"><span>{editingId ? 'Edit' : 'New'}</span><div><h2>{editingId ? 'Update series' : 'Create a series'}</h2><p>Series can remain private until they are ready.</p></div></div><div className="admin-field-grid"><label className="admin-field admin-span-2">Series title<input onChange={(event) => updateField('title', event.target.value)} required value={form.title}/></label><label className="admin-field admin-span-2">URL slug<input onChange={(event) => { setSlugTouched(true); updateField('slug', event.target.value); }} required value={form.slug}/></label><label className="admin-field admin-span-2">Description<textarea onChange={(event) => updateField('description', event.target.value)} required rows="5" value={form.description}/></label><label className="admin-field">Display order<input min="1" onChange={(event) => updateField('order', event.target.value)} type="number" value={form.order}/></label><label className="admin-check compact"><input checked={form.published} onChange={(event) => updateField('published', event.target.checked)} type="checkbox"/><span><strong>Published</strong><small>Show publicly</small></span></label></div><div className="admin-form-actions"><button className="admin-button admin-button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : editingId ? 'Update series' : 'Create series'}</button>{editingId && <button className="admin-button admin-button-quiet" onClick={resetForm} type="button">Cancel</button>}</div></form><section className="admin-panel"><div className="admin-panel-head"><div><span>Library structure</span><h2>Existing series</h2></div></div>{loading ? <LoadingScreen label="Loading series"/> : items.length ? <div className="admin-series-list">{items.map((item) => <article key={item.id}><div className="admin-series-order">{String(item.order || 0).padStart(2, '0')}</div><div><div className="admin-series-title"><h3>{item.title}</h3><span className={`admin-status ${item.published ? 'published' : 'draft'}`}>{item.published ? 'published' : 'private'}</span></div><p>{item.description}</p><small>/{item.slug}</small></div><div className="admin-row-actions"><button className="admin-icon-button" onClick={() => editSeries(item)} type="button"><AdminIcon name="edit" size={17}/></button><button className="admin-icon-button danger" onClick={() => removeSeries(item)} type="button"><AdminIcon name="trash" size={17}/></button></div></article>)}</div> : <AdminEmpty copy="Create the first series to begin grouping related messages." title="No series yet"/>}</section></div></>;
}

function SettingsPage() {
  const [form, setForm] = useState({ homepageHeadline: 'Rooted in Scripture. Centered on Christ.', homepageDescription: '', biography: '', contactEmail: '', prayerProjectUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'siteSettings', 'main')).then((snapshot) => { if (snapshot.exists()) setForm((current) => ({ ...current, ...snapshot.data() })); }).catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false));
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await setDoc(doc(db, 'siteSettings', 'main'), { ...form, updatedAt: serverTimestamp() }, { merge: true });
      setSuccess('Website settings saved. Public-page integration is scheduled for Phase 3.');
    } catch (saveError) {
      setError(friendlyError(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen label="Loading site settings"/>;
  return <><PageHeader copy="Maintain the core ministry information in one Firestore document." eyebrow="Website" title="Site settings"/>{error && <div className="admin-alert error">{error}</div>}{success && <div className="admin-alert success"><AdminIcon name="check" size={17}/>{success}</div>}<form className="admin-form-card admin-settings-form" onSubmit={saveSettings}><div className="admin-form-card-head"><span>Site</span><div><h2>Public information</h2><p>These fields establish the settings model that Phase 3 will connect throughout the public pages.</p></div></div><div className="admin-field-grid"><label className="admin-field admin-span-2">Homepage headline<input onChange={(event) => setForm({ ...form, homepageHeadline: event.target.value })} value={form.homepageHeadline}/></label><label className="admin-field admin-span-2">Homepage description<textarea onChange={(event) => setForm({ ...form, homepageDescription: event.target.value })} rows="4" value={form.homepageDescription}/></label><label className="admin-field admin-span-2">Biography<textarea onChange={(event) => setForm({ ...form, biography: event.target.value })} rows="8" value={form.biography}/></label><label className="admin-field">Public contact email<input onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} type="email" value={form.contactEmail}/></label><label className="admin-field">Prayer Project URL<input onChange={(event) => setForm({ ...form, prayerProjectUrl: event.target.value })} type="url" value={form.prayerProjectUrl}/></label></div><button className="admin-button admin-button-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save settings'}</button></form></>;
}

function AdminRoutes({ profile, user }) {
  return <Routes><Route element={<AdminLayout profile={profile} user={user}/>}><Route index element={<DashboardPage/>}/><Route path="sermons" element={<SermonsPage/>}/><Route path="sermons/:sermonId" element={<SermonEditorPage user={user}/>}/><Route path="series" element={<SeriesPage/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="*" element={<Navigate replace to="/admin"/>}/></Route></Routes>;
}

export default function AdminApp() {
  if (!isFirebaseConfigured) return <MissingConfiguration/>;
  return <AdminGate/>;
}
