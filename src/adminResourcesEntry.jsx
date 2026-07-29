import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db, githubPagesBase, isFirebaseConfigured } from './firebaseClient';
import './adminResources.css';

const allowedRoles = ['owner', 'admin', 'editor'];
const resourceStatuses = ['draft', 'published', 'archived'];
const resourceTypes = ['Bible Class', 'Study Guide', 'Devotional', 'Discussion Guide', 'Worksheet', 'Teaching Outline', 'Family Resource'];

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const splitLines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);
const splitParagraphs = (value) => value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
const timestampNumber = (value) => typeof value?.toMillis === 'function' ? value.toMillis() : new Date(value || 0).getTime();
const dateText = (value) => {
  if (!value) return '—';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

function friendlyError(error) {
  const messages = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'permission-denied': 'Your account does not have permission to complete that action.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong.';
}

function Icon({ name, size = 19 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    resource: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z"/><path d="M8 20a3 3 0 0 1 0-6h11M9 8h6"/></>,
    plan: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z"/><path d="m14 7 3 3"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    warning: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.5 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name] || paths.grid}</svg>;
}

function Loading({ label = 'Loading Resource Studio' }) {
  return <div className="studio-full-state"><span/><p>{label}</p></div>;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (loginError) { setError(friendlyError(loginError)); }
    finally { setBusy(false); }
  }

  async function reset() {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setBusy(true); setError('');
    try { await sendPasswordResetEmail(auth, email.trim()); setMessage('A password-reset email has been sent.'); }
    catch (resetError) { setError(friendlyError(resetError)); }
    finally { setBusy(false); }
  }

  return <div className="studio-login"><div className="studio-login-card"><div className="studio-brand"><span>CS</span><div><strong>Resource Studio</strong><small>Christopher Shelley</small></div></div><p className="studio-kicker">Phase 3 administration</p><h1>Manage the ministry library.</h1><p>Sign in with an approved Firebase staff account.</p>{error && <div className="studio-alert error">{error}</div>}{message && <div className="studio-alert success">{message}</div>}<form onSubmit={submit}><label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email}/></label><label>Password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></label><button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button></form><button className="studio-text-button" disabled={busy} onClick={reset} type="button">Reset password</button><a href={`${githubPagesBase}#/admin`}>← Return to the main CMS</a></div></div>;
}

function Gate() {
  const [state, setState] = useState({ loading: true, user: null, profile: null, error: '' });
  useEffect(() => {
    if (!auth || !db) { setState({ loading: false, user: null, profile: null, error: 'Firebase is not configured.' }); return undefined; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setState({ loading: false, user: null, profile: null, error: '' }); return; }
      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        const profile = snapshot.exists() ? snapshot.data() : null;
        if (!profile?.active || !allowedRoles.includes(profile.role)) setState({ loading: false, user, profile: null, error: 'This account is not an active owner, administrator, or editor.' });
        else setState({ loading: false, user, profile: { id: snapshot.id, ...profile }, error: '' });
      } catch (error) { setState({ loading: false, user, profile: null, error: friendlyError(error) }); }
    });
  }, []);
  if (state.loading) return <Loading/>;
  if (!state.user) return <Login/>;
  if (!state.profile) return <div className="studio-login"><div className="studio-login-card"><Icon name="warning" size={34}/><h1>Access is not approved.</h1><p>{state.error}</p><button onClick={() => signOut(auth)} type="button">Sign out</button></div></div>;
  return <Studio profile={state.profile} user={state.user}/>;
}

function Layout({ profile, user }) {
  return <div className="studio-shell"><aside><div className="studio-sidebar-head"><span>CS</span><div><strong>Resource Studio</strong><small>Phase 3</small></div></div><nav><NavLink end to="/"><Icon name="grid"/> Overview</NavLink><NavLink to="/resources"><Icon name="resource"/> Resources</NavLink><NavLink to="/plans"><Icon name="plan"/> Reading plans</NavLink><NavLink to="/insights"><Icon name="chart"/> Insights</NavLink></nav><div className="studio-sidebar-foot"><div><strong>{profile.displayName || user.email}</strong><small>{profile.role}</small></div><button onClick={() => signOut(auth)} type="button"><Icon name="logout"/> Sign out</button></div></aside><div className="studio-workspace"><header><div><strong>Christopher Shelley</strong><span>Ministry Resource Management</span></div><div><a href={`${githubPagesBase}resources.html#/`}><Icon name="eye"/> View library</a><a href={`${githubPagesBase}#/admin`}>Main CMS</a></div></header><main><Routes><Route index element={<Overview/>}/><Route path="resources" element={<ResourcesList profile={profile}/>}/><Route path="resources/:resourceId" element={<ResourceEditor user={user}/>}/><Route path="plans" element={<PlansList profile={profile}/>}/><Route path="plans/:planId" element={<PlanEditor user={user}/>}/><Route path="insights" element={<Insights/>}/><Route path="*" element={<Navigate replace to="/"/>}/></Routes></main></div></div>;
}

async function loadAll() {
  const [resourceSnapshot, planSnapshot, viewSnapshot] = await Promise.all([getDocs(collection(db, 'resources')), getDocs(collection(db, 'readingPlans')), getDocs(collection(db, 'contentViews'))]);
  return {
    resources: resourceSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampNumber(b.updatedAt || b.createdAt) - timestampNumber(a.updatedAt || a.createdAt)),
    plans: planSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampNumber(b.updatedAt || b.createdAt) - timestampNumber(a.updatedAt || a.createdAt)),
    views: viewSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}

function PageHeader({ eyebrow, title, copy, action }) { return <div className="studio-page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>; }
function Status({ value }) { return <span className={`studio-status ${value || 'draft'}`}>{value || 'draft'}</span>; }
function Empty({ icon = 'resource', title, copy, action }) { return <div className="studio-empty"><Icon name={icon} size={32}/><h2>{title}</h2><p>{copy}</p>{action}</div>; }

function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { loadAll().then(setData).catch((loadError) => setError(friendlyError(loadError))); }, []);
  if (!data && !error) return <Loading label="Loading Phase 3 content"/>;
  const views = data?.views.reduce((total, item) => total + Number(item.views || 0), 0) || 0;
  return <><PageHeader action={<Link className="studio-button primary" to="/resources/new"><Icon name="plus"/> New resource</Link>} copy="Create the teaching material, reading plans, and discovery tools that complete the ministry platform." eyebrow="Phase 3" title="Resource overview"/>{error && <div className="studio-alert error">{error}</div>}{data && <><section className="studio-stats"><article><span>Resources</span><strong>{data.resources.length}</strong><small>{data.resources.filter((item) => item.status === 'published').length} published</small></article><article><span>Reading plans</span><strong>{data.plans.length}</strong><small>{data.plans.reduce((total, item) => total + (item.days?.length || 0), 0)} total days</small></article><article><span>Recorded views</span><strong>{views}</strong><small>Privacy-friendly counts</small></article><article><span>Featured</span><strong>{[...data.resources, ...data.plans].filter((item) => item.featured).length}</strong><small>Highlighted publicly</small></article></section><section className="studio-panel"><div className="studio-panel-head"><div><span>Recently updated</span><h2>Latest resource work</h2></div></div>{data.resources.length ? <div className="studio-table-wrap"><table><thead><tr><th>Resource</th><th>Format</th><th>Status</th><th>Updated</th><th/></tr></thead><tbody>{data.resources.slice(0, 6).map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.scripture}</small></td><td>{item.type}</td><td><Status value={item.status}/></td><td>{dateText(item.updatedAt || item.createdAt)}</td><td><Link to={`/resources/${item.id}`}><Icon name="edit"/></Link></td></tr>)}</tbody></table></div> : <Empty action={<Link className="studio-button primary" to="/resources/new">Create a resource</Link>} copy="Add the first Bible class, study guide, or devotional." title="No resources yet"/>}</section></>}</>;
}

function ResourcesList({ profile }) {
  const [items, setItems] = useState([]); const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function refresh() { const snapshot = await getDocs(collection(db, 'resources')); setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampNumber(b.updatedAt || b.createdAt) - timestampNumber(a.updatedAt || a.createdAt))); }
  useEffect(() => { refresh().catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => items.filter((item) => { const text = [item.title, item.type, item.scripture, item.audience, item.summary, ...(item.topics || [])].join(' ').toLowerCase(); return (!search.trim() || text.includes(search.trim().toLowerCase())) && (status === 'all' || item.status === status); }), [items, search, status]);
  async function remove(item) { if (!['owner', 'admin'].includes(profile.role) || !window.confirm(`Permanently delete “${item.title}”?`)) return; try { await deleteDoc(doc(db, 'resources', item.id)); setItems((current) => current.filter((entry) => entry.id !== item.id)); } catch (deleteError) { setError(friendlyError(deleteError)); } }
  return <><PageHeader action={<Link className="studio-button primary" to="/resources/new"><Icon name="plus"/> New resource</Link>} copy="Manage Bible classes, devotionals, study guides, worksheets, and downloadable material." eyebrow="Library" title="Teaching resources"/><section className="studio-panel"><div className="studio-filters"><input onChange={(event) => setSearch(event.target.value)} placeholder="Search resources…" type="search" value={search}/><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All statuses</option>{resourceStatuses.map((item) => <option key={item}>{item}</option>)}</select></div>{error && <div className="studio-alert error">{error}</div>}{loading ? <Loading label="Loading resources"/> : filtered.length ? <div className="studio-table-wrap"><table><thead><tr><th>Resource</th><th>Audience</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.type} • {item.scripture}</small></td><td>{item.audience}</td><td><Status value={item.status}/></td><td>{dateText(item.updatedAt || item.createdAt)}</td><td><div className="studio-row-actions"><Link to={`/resources/${item.id}`}><Icon name="edit"/></Link>{item.status === 'published' && <a href={`${githubPagesBase}resources.html#/resource/${item.slug}`}><Icon name="eye"/></a>}{['owner', 'admin'].includes(profile.role) && <button onClick={() => remove(item)} type="button"><Icon name="trash"/></button>}</div></td></tr>)}</tbody></table></div> : <Empty copy="No resource records match the current filters." title="Nothing found"/>}</section></>;
}

const emptyResource = { title: '', slug: '', type: 'Bible Class', audience: '', scripture: '', scriptureBook: '', summary: '', estimatedMinutes: '', topics: '', content: '', discussionQuestions: '', downloadUrl: '', status: 'draft', featured: false };

function ResourceEditor({ user }) {
  const { resourceId } = useParams(); const navigate = useNavigate(); const isNew = resourceId === 'new';
  const [form, setForm] = useState(emptyResource); const [loading, setLoading] = useState(!isNew); const [saving, setSaving] = useState(false); const [slugTouched, setSlugTouched] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { if (isNew) return; getDoc(doc(db, 'resources', resourceId)).then((snapshot) => { if (!snapshot.exists()) throw new Error('This resource no longer exists.'); const data = snapshot.data(); setForm({ ...emptyResource, ...data, topics: (data.topics || []).join(', '), content: (data.sections || []).flatMap((section) => section.paragraphs || []).join('\n\n'), discussionQuestions: (data.discussionQuestions || []).join('\n') }); setSlugTouched(true); }).catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false)); }, [isNew, resourceId]);
  function update(field, value) { setForm((current) => { const next = { ...current, [field]: value }; if (field === 'title' && !slugTouched) next.slug = slugify(value); return next; }); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const cleanSlug = slugify(form.slug || form.title);
      if (!form.title.trim() || !cleanSlug || !form.summary.trim() || !form.scripture.trim() || !form.audience.trim()) throw new Error('Complete the title, slug, summary, Scripture, and audience.');
      const duplicate = await getDocs(query(collection(db, 'resources'), where('slug', '==', cleanSlug)));
      if (duplicate.docs.some((item) => item.id !== resourceId)) throw new Error('Another resource already uses that URL slug.');
      const body = splitParagraphs(form.content);
      const payload = { title: form.title.trim(), slug: cleanSlug, type: form.type, audience: form.audience.trim(), scripture: form.scripture.trim(), scriptureBook: form.scriptureBook.trim(), summary: form.summary.trim(), estimatedMinutes: form.estimatedMinutes.trim(), topics: form.topics.split(',').map((item) => item.trim()).filter(Boolean), sections: body.length ? [{ heading: 'Resource Content', paragraphs: body }] : [], discussionQuestions: splitLines(form.discussionQuestions), downloadUrl: form.downloadUrl.trim(), status: form.status, featured: Boolean(form.featured), updatedAt: serverTimestamp(), updatedBy: user.uid };
      let id = resourceId;
      if (isNew) { const created = await addDoc(collection(db, 'resources'), { ...payload, createdAt: serverTimestamp(), createdBy: user.uid }); id = created.id; }
      else await updateDoc(doc(db, 'resources', resourceId), payload);
      setSuccess(form.status === 'published' ? 'Resource saved and published.' : 'Resource saved.');
      if (isNew) navigate(`/resources/${id}`, { replace: true });
    } catch (saveError) { setError(friendlyError(saveError)); } finally { setSaving(false); }
  }
  if (loading) return <Loading label="Opening resource editor"/>;
  return <><PageHeader action={<Link className="studio-button quiet" to="/resources"><Icon name="back"/> Back</Link>} copy="Build a reusable teaching or study resource and choose when it becomes public." eyebrow="Resource editor" title={isNew ? 'Create a resource' : 'Edit resource'}/>{error && <div className="studio-alert error">{error}</div>}{success && <div className="studio-alert success"><Icon name="check"/> {success}</div>}<form className="studio-editor" onSubmit={save}><div className="studio-form-stack"><section className="studio-form-card"><div className="studio-card-head"><span>01</span><div><h2>Identity and discovery</h2><p>Tell visitors what this resource is, who it serves, and where it begins in Scripture.</p></div></div><div className="studio-field-grid"><label className="span-2">Title<input onChange={(event) => update('title', event.target.value)} required value={form.title}/></label><label>Format<select onChange={(event) => update('type', event.target.value)} value={form.type}>{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Audience<input onChange={(event) => update('audience', event.target.value)} placeholder="Grades 1–6" required value={form.audience}/></label><label className="span-2">URL slug<input onChange={(event) => { setSlugTouched(true); update('slug', event.target.value); }} required value={form.slug}/></label><label>Scripture passage<input onChange={(event) => update('scripture', event.target.value)} placeholder="Acts 17:16–34" required value={form.scripture}/></label><label>Bible book<input onChange={(event) => update('scriptureBook', event.target.value)} placeholder="Acts" value={form.scriptureBook}/></label><label className="span-2">Summary<textarea onChange={(event) => update('summary', event.target.value)} required rows="4" value={form.summary}/></label><label>Estimated time<input onChange={(event) => update('estimatedMinutes', event.target.value)} placeholder="35 minutes" value={form.estimatedMinutes}/></label><label>Topics<input onChange={(event) => update('topics', event.target.value)} placeholder="Faith, Courage, Paul" value={form.topics}/></label></div></section><section className="studio-form-card"><div className="studio-card-head"><span>02</span><div><h2>Resource content</h2><p>Separate paragraphs with a blank line. The public page will format the material for reading.</p></div></div><div className="studio-field-grid"><label className="span-2">Full teaching or study content<textarea onChange={(event) => update('content', event.target.value)} rows="18" value={form.content}/></label><label className="span-2">Discussion questions<textarea onChange={(event) => update('discussionQuestions', event.target.value)} placeholder="One question per line" rows="7" value={form.discussionQuestions}/></label><label className="span-2">Download URL<input onChange={(event) => update('downloadUrl', event.target.value)} placeholder="GitHub-hosted PDF or public file URL" type="url" value={form.downloadUrl}/><small>Files are linked from GitHub or another public URL. Firebase Storage is not used.</small></label></div></section></div><aside className="studio-publish"><span>Publication</span><h2>Save and release</h2><p>Drafts remain private. Published resources appear immediately in the GitHub-hosted library.</p><label>Status<select onChange={(event) => update('status', event.target.value)} value={form.status}>{resourceStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="studio-check"><input checked={form.featured} onChange={(event) => update('featured', event.target.checked)} type="checkbox"/><span><strong>Featured resource</strong><small>Highlight it on Discover.</small></span></label><button className="studio-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save resource'}</button>{!isNew && form.status === 'published' && <a className="studio-button quiet" href={`${githubPagesBase}resources.html#/resource/${form.slug}`}><Icon name="eye"/> Preview</a>}</aside></form></>;
}

function PlansList({ profile }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function refresh() { const snapshot = await getDocs(collection(db, 'readingPlans')); setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => timestampNumber(b.updatedAt || b.createdAt) - timestampNumber(a.updatedAt || a.createdAt))); }
  useEffect(() => { refresh().catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false)); }, []);
  async function remove(item) { if (!['owner', 'admin'].includes(profile.role) || !window.confirm(`Permanently delete “${item.title}”?`)) return; try { await deleteDoc(doc(db, 'readingPlans', item.id)); setItems((current) => current.filter((entry) => entry.id !== item.id)); } catch (deleteError) { setError(friendlyError(deleteError)); } }
  return <><PageHeader action={<Link className="studio-button primary" to="/plans/new"><Icon name="plus"/> New plan</Link>} copy="Create day-by-day Scripture journeys with reflection, questions, and saved reader progress." eyebrow="Guided reading" title="Reading plans"/>{error && <div className="studio-alert error">{error}</div>}<section className="studio-panel">{loading ? <Loading label="Loading reading plans"/> : items.length ? <div className="studio-card-list">{items.map((item) => <article key={item.id}><div><span>{item.days?.length || 0} days</span><h2>{item.title}</h2><p>{item.description}</p><Status value={item.status}/></div><div className="studio-row-actions"><Link to={`/plans/${item.id}`}><Icon name="edit"/></Link>{item.status === 'published' && <a href={`${githubPagesBase}resources.html#/plans/${item.slug}`}><Icon name="eye"/></a>}{['owner', 'admin'].includes(profile.role) && <button onClick={() => remove(item)} type="button"><Icon name="trash"/></button>}</div></article>)}</div> : <Empty action={<Link className="studio-button primary" to="/plans/new">Create a plan</Link>} copy="Build the first guided reading journey." icon="plan" title="No reading plans yet"/>}</section></>;
}

const newDay = () => ({ title: '', scripture: '', reflection: '', questions: '' });
const emptyPlan = { title: '', slug: '', description: '', audience: '', scriptureBooks: '', status: 'draft', featured: false, days: [newDay()] };

function PlanEditor({ user }) {
  const { planId } = useParams(); const navigate = useNavigate(); const isNew = planId === 'new';
  const [form, setForm] = useState(emptyPlan); const [loading, setLoading] = useState(!isNew); const [saving, setSaving] = useState(false); const [slugTouched, setSlugTouched] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { if (isNew) return; getDoc(doc(db, 'readingPlans', planId)).then((snapshot) => { if (!snapshot.exists()) throw new Error('This reading plan no longer exists.'); const data = snapshot.data(); setForm({ ...emptyPlan, ...data, scriptureBooks: (data.scriptureBooks || []).join(', '), days: (data.days || []).map((day) => ({ ...day, questions: (day.questions || []).join('\n') })) }); setSlugTouched(true); }).catch((loadError) => setError(friendlyError(loadError))).finally(() => setLoading(false)); }, [isNew, planId]);
  function update(field, value) { setForm((current) => { const next = { ...current, [field]: value }; if (field === 'title' && !slugTouched) next.slug = slugify(value); return next; }); }
  function updateDay(index, field, value) { setForm((current) => ({ ...current, days: current.days.map((day, dayIndex) => dayIndex === index ? { ...day, [field]: value } : day) })); }
  const addDay = () => setForm((current) => ({ ...current, days: [...current.days, newDay()] }));
  const removeDay = (index) => form.days.length > 1 && setForm((current) => ({ ...current, days: current.days.filter((_, dayIndex) => dayIndex !== index) }));
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const cleanSlug = slugify(form.slug || form.title);
      if (!form.title.trim() || !cleanSlug || !form.description.trim() || !form.audience.trim()) throw new Error('Complete the title, slug, description, and audience.');
      if (form.days.some((day) => !day.title.trim() || !day.scripture.trim() || !day.reflection.trim())) throw new Error('Every day needs a title, Scripture passage, and reflection.');
      const duplicate = await getDocs(query(collection(db, 'readingPlans'), where('slug', '==', cleanSlug)));
      if (duplicate.docs.some((item) => item.id !== planId)) throw new Error('Another reading plan already uses that URL slug.');
      const payload = { title: form.title.trim(), slug: cleanSlug, description: form.description.trim(), audience: form.audience.trim(), scriptureBooks: form.scriptureBooks.split(',').map((item) => item.trim()).filter(Boolean), status: form.status, featured: Boolean(form.featured), days: form.days.map((day) => ({ title: day.title.trim(), scripture: day.scripture.trim(), reflection: day.reflection.trim(), questions: splitLines(day.questions) })), updatedAt: serverTimestamp(), updatedBy: user.uid };
      let id = planId;
      if (isNew) { const created = await addDoc(collection(db, 'readingPlans'), { ...payload, createdAt: serverTimestamp(), createdBy: user.uid }); id = created.id; }
      else await updateDoc(doc(db, 'readingPlans', planId), payload);
      setSuccess(form.status === 'published' ? 'Reading plan saved and published.' : 'Reading plan saved.');
      if (isNew) navigate(`/plans/${id}`, { replace: true });
    } catch (saveError) { setError(friendlyError(saveError)); } finally { setSaving(false); }
  }
  if (loading) return <Loading label="Opening reading-plan editor"/>;
  return <><PageHeader action={<Link className="studio-button quiet" to="/plans"><Icon name="back"/> Back</Link>} copy="Build a structured reading journey one day at a time." eyebrow="Reading-plan editor" title={isNew ? 'Create a reading plan' : 'Edit reading plan'}/>{error && <div className="studio-alert error">{error}</div>}{success && <div className="studio-alert success"><Icon name="check"/> {success}</div>}<form className="studio-editor" onSubmit={save}><div className="studio-form-stack"><section className="studio-form-card"><div className="studio-card-head"><span>Plan</span><div><h2>Plan identity</h2><p>Describe the journey and who should take it.</p></div></div><div className="studio-field-grid"><label className="span-2">Title<input onChange={(event) => update('title', event.target.value)} required value={form.title}/></label><label className="span-2">URL slug<input onChange={(event) => { setSlugTouched(true); update('slug', event.target.value); }} required value={form.slug}/></label><label className="span-2">Description<textarea onChange={(event) => update('description', event.target.value)} required rows="4" value={form.description}/></label><label>Audience<input onChange={(event) => update('audience', event.target.value)} required value={form.audience}/></label><label>Bible books<input onChange={(event) => update('scriptureBooks', event.target.value)} placeholder="Colossians, Philippians" value={form.scriptureBooks}/></label></div></section><section className="studio-days-editor"><div className="studio-days-head"><div><span>Daily readings</span><h2>{form.days.length} {form.days.length === 1 ? 'day' : 'days'}</h2></div><button className="studio-button quiet" onClick={addDay} type="button"><Icon name="plus"/> Add day</button></div>{form.days.map((day, index) => <article key={index}><div className="studio-day-number">{index + 1}</div><div className="studio-field-grid"><label>Day title<input onChange={(event) => updateDay(index, 'title', event.target.value)} required value={day.title}/></label><label>Scripture<input onChange={(event) => updateDay(index, 'scripture', event.target.value)} required value={day.scripture}/></label><label className="span-2">Reflection<textarea onChange={(event) => updateDay(index, 'reflection', event.target.value)} required rows="5" value={day.reflection}/></label><label className="span-2">Questions<textarea onChange={(event) => updateDay(index, 'questions', event.target.value)} placeholder="One question per line" rows="4" value={day.questions}/></label></div>{form.days.length > 1 && <button className="studio-remove-day" onClick={() => removeDay(index)} type="button"><Icon name="trash"/> Remove day</button>}</article>)}</section></div><aside className="studio-publish"><span>Publication</span><h2>Save and release</h2><p>Readers save progress locally on their own device. No account is needed.</p><label>Status<select onChange={(event) => update('status', event.target.value)} value={form.status}>{resourceStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="studio-check"><input checked={form.featured} onChange={(event) => update('featured', event.target.checked)} type="checkbox"/><span><strong>Featured plan</strong><small>Highlight it on Discover.</small></span></label><button className="studio-button primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save reading plan'}</button>{!isNew && form.status === 'published' && <a className="studio-button quiet" href={`${githubPagesBase}resources.html#/plans/${form.slug}`}><Icon name="eye"/> Preview</a>}</aside></form></>;
}

function Insights() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { loadAll().then(setData).catch((loadError) => setError(friendlyError(loadError))); }, []);
  if (!data && !error) return <Loading label="Calculating content insights"/>;
  const content = [...(data?.resources || []).map((item) => ({ ...item, contentType: 'resource' })), ...(data?.plans || []).map((item) => ({ ...item, contentType: 'readingPlan' }))];
  const rows = content.map((item) => ({ ...item, views: Number(data?.views.find((view) => view.contentId === item.id && view.contentType === item.contentType)?.views || 0) })).sort((a, b) => b.views - a.views);
  const topicCounts = new Map();
  (data?.resources || []).forEach((item) => (item.topics || []).forEach((topic) => topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)));
  const topics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return <><PageHeader copy="Lightweight, privacy-friendly metrics stored in Firestore—no external analytics service required." eyebrow="Discovery" title="Content insights"/>{error && <div className="studio-alert error">{error}</div>}{data && <div className="studio-insight-grid"><section className="studio-panel"><div className="studio-panel-head"><div><span>Public interest</span><h2>Most viewed content</h2></div></div>{rows.length ? <div className="studio-ranking">{rows.slice(0, 10).map((item, index) => <article key={`${item.contentType}-${item.id}`}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.contentType === 'readingPlan' ? 'Reading plan' : item.type}</small></div><b>{item.views}</b></article>)}</div> : <Empty copy="View counts begin after published content is opened." title="No view data yet"/>}</section><section className="studio-panel"><div className="studio-panel-head"><div><span>Coverage</span><h2>Most-used topics</h2></div></div>{topics.length ? <div className="studio-topic-bars">{topics.map(([topic, count]) => <div key={topic}><span>{topic}</span><div><i style={{ width: `${Math.max(12, (count / topics[0][1]) * 100)}%` }}/></div><strong>{count}</strong></div>)}</div> : <Empty copy="Add topic tags to resources to see coverage." title="No topic data yet"/>}</section></div>}</>;
}

function Studio({ profile, user }) { return <Layout profile={profile} user={user}/>; }

function App() {
  if (!isFirebaseConfigured) return <div className="studio-login"><div className="studio-login-card"><Icon name="warning" size={34}/><h1>Firebase is not configured.</h1><p>Add the production Firebase web configuration before opening Resource Studio.</p></div></div>;
  return <Gate/>;
}

ReactDOM.createRoot(document.getElementById('studio-root')).render(<React.StrictMode><HashRouter><App/></HashRouter></React.StrictMode>);
