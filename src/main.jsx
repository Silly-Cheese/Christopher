import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Link, NavLink, Outlet, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, limit, orderBy, query, where } from 'firebase/firestore';
import AdminApp from './admin';
import { demoSeries, demoSermons } from './content';
import './styles.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = isFirebaseConfigured ? getApps()[0] || initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

function normalizeSermon(document) {
  const data = document.data();
  const dateValue = data.datePreached;
  return {
    id: document.id,
    ...data,
    datePreached: typeof dateValue?.toDate === 'function'
      ? dateValue.toDate().toISOString().slice(0, 10)
      : dateValue,
  };
}

async function getPublishedSermons(maximum = 100) {
  if (!db) return demoSermons.slice(0, maximum);
  try {
    const snapshot = await getDocs(query(
      collection(db, 'sermons'),
      where('status', '==', 'published'),
      orderBy('datePreached', 'desc'),
      limit(maximum),
    ));
    const sermons = snapshot.docs.map(normalizeSermon);
    return sermons.length ? sermons : demoSermons.slice(0, maximum);
  } catch (error) {
    console.error('Unable to load sermons from Firestore.', error);
    return demoSermons.slice(0, maximum);
  }
}

async function getSermonBySlug(slug) {
  if (!db) return demoSermons.find((item) => item.slug === slug) || null;
  try {
    const snapshot = await getDocs(query(
      collection(db, 'sermons'),
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1),
    ));
    return snapshot.empty ? null : normalizeSermon(snapshot.docs[0]);
  } catch (error) {
    console.error('Unable to load sermon from Firestore.', error);
    return demoSermons.find((item) => item.slug === slug) || null;
  }
}

async function getPublishedSeries() {
  if (!db) return demoSeries;
  try {
    const snapshot = await getDocs(query(
      collection(db, 'series'),
      where('published', '==', true),
      orderBy('order', 'asc'),
    ));
    const series = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    return series.length ? series : demoSeries;
  } catch (error) {
    console.error('Unable to load series from Firestore.', error);
    return demoSeries;
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    play: <path d="m9 7 8 5-8 5Z"/>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/></>,
    quote: <><path d="M8 10H4a4 4 0 0 0 4 4v4H4v-4a8 8 0 0 1 8-8v4Z"/><path d="M20 10h-4a4 4 0 0 0 4 4v4h-4v-4a8 8 0 0 1 8-8v4Z"/></>,
    sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z"/><path d="m18.5 14 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z"/></>,
    filter: <path d="M4 6h16l-6 7v5l-4 2v-7Z"/>,
  };
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name] || paths.sparkle}</svg>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: 'auto' }), [pathname]);
  return null;
}

function Layout() {
  const [open, setOpen] = useState(false);
  const navItems = [['/', 'Home'], ['/sermons', 'Sermons'], ['/series', 'Series'], ['/about', 'About']];
  return <div className="site-shell">
    <header className="site-header"><div className="container header-inner">
      <Link className="brand" to="/" onClick={() => setOpen(false)}><span className="brand-mark">CS</span><span className="brand-copy"><strong>Christopher Shelley</strong><small>Sermons & Biblical Teaching</small></span></Link>
      <button aria-expanded={open} aria-label="Toggle navigation" className="menu-button" onClick={() => setOpen((value) => !value)} type="button"><Icon name={open ? 'close' : 'menu'} /></button>
      <nav className={`main-nav ${open ? 'is-open' : ''}`}>{navItems.map(([to, label]) => <NavLink className={({ isActive }) => isActive ? 'active' : ''} end={to === '/'} key={to} onClick={() => setOpen(false)} to={to}>{label}</NavLink>)}</nav>
    </div></header>
    <main><Outlet /></main>
    <footer className="site-footer"><div className="container footer-grid">
      <div><div className="brand footer-brand"><span className="brand-mark">CS</span><span className="brand-copy"><strong>Christopher Shelley</strong><small>Sermons & Biblical Teaching</small></span></div><p className="footer-copy">Scripture-rooted messages created to help people know Christ, think deeply, and live faithfully.</p></div>
      <div className="footer-links"><strong>Explore</strong><Link to="/sermons">Sermons</Link><Link to="/series">Series</Link><Link to="/about">About</Link></div>
      <div className="footer-verse"><Icon name="quote" size={28}/><p>“Preach the word; be ready in season and out of season.”</p><span>2 Timothy 4:2</span></div>
    </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Christopher Shelley</span><span>Built with GitHub Pages + Firebase</span></div></footer>
  </div>;
}

function SectionHeading({ eyebrow, title, copy }) {
  return <div className="section-heading">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}

function LoadingState({ label = 'Loading messages' }) {
  return <div className="loading-state" role="status"><span className="loading-ring"/><p>{label}</p></div>;
}

function formatDate(date, long = false) {
  if (!date) return 'Date coming soon';
  return new Intl.DateTimeFormat('en-US', long
    ? { month: 'long', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' }
  ).format(new Date(`${date}T12:00:00`));
}

function SermonCard({ sermon, compact = false }) {
  return <article className={`sermon-card ${compact ? 'compact' : ''}`}>
    <Link className="sermon-art" to={`/sermons/${sermon.slug}`}>
      {sermon.youtubeId ? <img alt="" loading="lazy" src={`https://i.ytimg.com/vi/${sermon.youtubeId}/maxresdefault.jpg`}/> : <div className="sermon-art-placeholder"><span>{sermon.scriptureBook}</span><strong>{sermon.scripture}</strong></div>}
      <span className="play-chip"><Icon name="play" size={16}/> Watch</span>
    </Link>
    <div className="sermon-card-body"><div className="sermon-meta"><span><Icon name="calendar" size={15}/> {formatDate(sermon.datePreached)}</span>{sermon.duration && <span><Icon name="clock" size={15}/> {sermon.duration}</span>}</div>
      <Link className="sermon-title-link" to={`/sermons/${sermon.slug}`}><h3>{sermon.title}</h3></Link><p className="scripture-label">{sermon.scripture}</p>{!compact && <p>{sermon.summary}</p>}<Link className="text-link" to={`/sermons/${sermon.slug}`}>Explore message <Icon name="arrow" size={17}/></Link>
    </div>
  </article>;
}

function HomePage() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPublishedSermons(12).then((items) => { setSermons(items); setLoading(false); }); }, []);
  const featured = useMemo(() => sermons.find((sermon) => sermon.featured) || sermons[0], [sermons]);
  return <>
    <section className="hero-section"><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/><div className="container hero-grid">
      <div className="hero-copy"><span className="eyebrow"><Icon name="sparkle" size={15}/> Biblical teaching for real life</span><h1>Rooted in Scripture.<br/><em>Centered on Christ.</em></h1><p>Explore sermons, teaching notes, and biblical resources created to make the truth of Scripture clear, memorable, and lived.</p>
        <div className="hero-actions"><Link className="button button-primary" to={featured ? `/sermons/${featured.slug}` : '/sermons'}><Icon name="play" size={18}/> Watch latest sermon</Link><Link className="button button-secondary" to="/sermons">Browse all messages <Icon name="arrow" size={18}/></Link></div>
        <div className="hero-proof"><div><strong>{sermons.length || '—'}</strong><span>Featured messages</span></div><div><strong>{new Set(sermons.map((item) => item.scriptureBook)).size || '—'}</strong><span>Bible books</span></div><div><strong>100%</strong><span>Free to explore</span></div></div>
      </div>
      <div className="hero-feature-wrap"><div className="hero-feature-backdrop"/>{featured ? <Link className="hero-feature-card" to={`/sermons/${featured.slug}`}><div className="hero-feature-art">{featured.youtubeId ? <img alt="" src={`https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`}/> : <div className="hero-scripture-art"><span>{featured.seriesTitle}</span><strong>{featured.scripture}</strong></div>}<span className="hero-play"><Icon name="play" size={24}/></span></div><div className="hero-feature-copy"><span>Featured message</span><h2>{featured.title}</h2><p>{featured.bigIdea}</p></div></Link> : <LoadingState/>}</div>
    </div></section>
    <section className="section section-light"><div className="container"><SectionHeading eyebrow="Recent messages" title="Truth worth returning to" copy="Watch the latest sermons, open the notes, and keep exploring the passages behind each message."/>{loading ? <LoadingState/> : <div className="sermon-grid">{sermons.slice(0, 3).map((sermon) => <SermonCard key={sermon.id} sermon={sermon}/>)}</div>}<div className="section-cta"><Link className="button button-dark" to="/sermons">View the sermon library <Icon name="arrow" size={18}/></Link></div></div></section>
    <section className="section statement-section"><div className="container statement-grid"><div className="statement-mark"><Icon name="book" size={42}/></div><div><span className="eyebrow">The purpose</span><h2>Not content to consume.<br/>Truth to carry.</h2></div><p>Every message is built around a biblical text and one central truth—so you can understand the passage, remember what matters, and take the next faithful step.</p></div></section>
    <section className="section section-ink"><div className="container topic-layout"><SectionHeading eyebrow="Explore by focus" title="Start where you are" copy="Whether you are looking for courage, joy, deeper faith, or a clearer picture of Jesus, begin with a topic that meets the moment."/><div className="topic-cloud">{['Jesus','Faith','Apologetics','Joy','Courage','Discipleship','Humility','Christian Living'].map((topic) => <Link key={topic} to={`/sermons?topic=${encodeURIComponent(topic)}`}>{topic}<Icon name="arrow" size={16}/></Link>)}</div></div></section>
    <section className="section section-light"><div className="container invitation-card"><div><span className="eyebrow">Go deeper</span><h2>Explore complete sermon series.</h2><p>Follow an idea across multiple passages and messages, organized in one place.</p></div><Link className="button button-primary" to="/series">Browse series <Icon name="arrow" size={18}/></Link></div></section>
  </>;
}

function SermonsPage() {
  const [searchParams] = useSearchParams();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState(searchParams.get('topic') || 'All');
  const [book, setBook] = useState('All');
  useEffect(() => { getPublishedSermons().then((items) => { setSermons(items); setLoading(false); }); }, []);
  const topics = useMemo(() => ['All', ...new Set(sermons.flatMap((sermon) => sermon.topics || []))], [sermons]);
  const books = useMemo(() => ['All', ...new Set(sermons.map((sermon) => sermon.scriptureBook).filter(Boolean))], [sermons]);
  const filtered = useMemo(() => sermons.filter((sermon) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [sermon.title, sermon.scripture, sermon.summary, sermon.seriesTitle, ...(sermon.topics || [])].join(' ').toLowerCase().includes(term);
    return matchesSearch && (topic === 'All' || sermon.topics?.includes(topic)) && (book === 'All' || sermon.scriptureBook === book);
  }), [sermons, search, topic, book]);
  return <><section className="page-hero"><div className="container page-hero-inner"><span className="eyebrow">Sermon library</span><h1>Messages built from Scripture.</h1><p>Search by title, passage, topic, or Bible book. Open any message to watch, read, and study.</p></div></section>
    <section className="section section-light library-section"><div className="container"><div className="filter-panel"><label className="search-field"><Icon name="search"/><input aria-label="Search sermons" onChange={(event) => setSearch(event.target.value)} placeholder="Search sermons, passages, topics..." type="search" value={search}/></label><label className="select-field"><span>Topic</span><select onChange={(event) => setTopic(event.target.value)} value={topic}>{topics.map((item) => <option key={item}>{item}</option>)}</select></label><label className="select-field"><span>Bible book</span><select onChange={(event) => setBook(event.target.value)} value={book}>{books.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className="results-row"><p><strong>{filtered.length}</strong> {filtered.length === 1 ? 'message' : 'messages'}</p>{(search || topic !== 'All' || book !== 'All') && <button onClick={() => { setSearch(''); setTopic('All'); setBook('All'); }} type="button">Clear filters</button>}</div>
      {loading ? <LoadingState/> : filtered.length ? <div className="sermon-grid">{filtered.map((sermon) => <SermonCard key={sermon.id} sermon={sermon}/>)}</div> : <div className="empty-state"><Icon name="filter" size={34}/><h2>No messages match those filters.</h2><p>Try another keyword, topic, or Bible book.</p></div>}
    </div></section></>;
}

function SermonDetailPage() {
  const { slug } = useParams();
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); getSermonBySlug(slug).then((item) => { setSermon(item); setLoading(false); }); }, [slug]);
  if (loading) return <div className="page-loader"><LoadingState label="Opening message"/></div>;
  if (!sermon) return <section className="section section-light"><div className="container empty-state"><h1>Message not found.</h1><p>This sermon may have moved or is not published yet.</p><Link className="button button-dark" to="/sermons">Return to sermons</Link></div></section>;
  return <article><header className="sermon-detail-hero"><div className="container detail-hero-grid"><div><Link className="back-link" to="/sermons">← Sermon library</Link><span className="eyebrow">{sermon.seriesTitle}</span><h1>{sermon.title}</h1><p className="detail-scripture">{sermon.scripture}</p><p className="detail-summary">{sermon.summary}</p><div className="detail-meta"><span><Icon name="calendar" size={16}/> {formatDate(sermon.datePreached, true)}</span>{sermon.duration && <span><Icon name="clock" size={16}/> {sermon.duration}</span>}<span>By {sermon.speaker}</span></div></div><div className="big-idea-card"><span>Central truth</span><p>{sermon.bigIdea}</p></div></div></header>
    <section className="video-section"><div className="container"><div className="video-frame">{sermon.youtubeId ? <iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen src={`https://www.youtube-nocookie.com/embed/${sermon.youtubeId}`} title={sermon.title}/> : <div className="video-placeholder"><span className="hero-play"><Icon name="play" size={28}/></span><div><strong>Video ready to connect</strong><p>Add a YouTube video ID to this sermon in Firestore.</p></div></div>}</div></div></section>
    <section className="section section-light notes-section"><div className="container notes-layout"><aside className="outline-card"><span className="eyebrow">Message outline</span><ol>{(sermon.outline || []).map((point) => <li key={point}>{point}</li>)}</ol><div className="topic-list">{(sermon.topics || []).map((topic) => <Link key={topic} to={`/sermons?topic=${encodeURIComponent(topic)}`}>{topic}</Link>)}</div></aside><div className="manuscript"><span className="eyebrow">Sermon notes</span><h2>Study the message</h2>{(sermon.notes || []).map((section) => <section key={section.heading}><h3>{section.heading}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}<blockquote><Icon name="quote" size={28}/><p>{sermon.bigIdea}</p></blockquote></div></div></section>
  </article>;
}

function SeriesPage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPublishedSeries().then((items) => { setSeries(items); setLoading(false); }); }, []);
  return <><section className="page-hero series-hero"><div className="container page-hero-inner"><span className="eyebrow">Message collections</span><h1>Follow the whole conversation.</h1><p>Explore sermon series that develop one biblical theme across several messages and passages.</p></div></section><section className="section section-light"><div className="container">{loading ? <LoadingState/> : <div className="series-grid">{series.map((item, index) => <Link className="series-card" key={item.id} to={`/series/${item.slug}`}><span className="series-number">0{index + 1}</span><div><span className="eyebrow">Sermon series</span><h2>{item.title}</h2><p>{item.description}</p></div><span className="series-arrow"><Icon name="arrow"/></span></Link>)}</div>}</div></section></>;
}

function SeriesDetailPage() {
  const { slug } = useParams();
  const [series, setSeries] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([getPublishedSeries(), getPublishedSermons()]).then(([seriesItems, sermonItems]) => { setSeries(seriesItems); setSermons(sermonItems); setLoading(false); }); }, []);
  const current = series.find((item) => item.slug === slug);
  const items = sermons.filter((item) => item.seriesSlug === slug);
  if (loading) return <div className="page-loader"><LoadingState/></div>;
  if (!current) return <section className="section section-light"><div className="container empty-state"><h1>Series not found.</h1><Link to="/series">View all series</Link></div></section>;
  return <><section className="page-hero series-detail-hero"><div className="container page-hero-inner"><Link className="back-link" to="/series">← All series</Link><span className="eyebrow">Sermon series</span><h1>{current.title}</h1><p>{current.description}</p><span className="series-count">{items.length} {items.length === 1 ? 'message' : 'messages'}</span></div></section><section className="section section-light"><div className="container">{items.length ? <div className="sermon-grid">{items.map((sermon) => <SermonCard compact key={sermon.id} sermon={sermon}/>)}</div> : <div className="empty-state"><h2>Messages are coming soon.</h2><p>This series is ready for sermons to be added in Firestore.</p></div>}</div></section></>;
}

function AboutPage() {
  return <><section className="about-hero"><div className="container about-grid"><div className="portrait-panel"><div className="portrait-monogram">CS</div><div className="portrait-caption"><span>Preacher • Teacher • Student of Scripture</span></div></div><div className="about-copy"><span className="eyebrow">About Christopher</span><h1>Helping people see the beauty, truth, and relevance of Scripture.</h1><p className="lead">Christopher Shelley is a Christian teacher and speaker with a growing focus on biblical studies, theology, and contemporary apologetics.</p><p>His messages aim to remain faithful to the biblical text while communicating one clear, memorable truth that listeners can carry into everyday life. Whether teaching children, preaching to a congregation, or developing a deeper theological study, the goal remains the same: point people toward Jesus and help them respond faithfully to His Word.</p><p>This website serves as an expanding library of sermons, manuscripts, outlines, and teaching resources—organized so that every message can be watched, studied, and revisited.</p><Link className="button button-primary" to="/sermons">Explore the messages <Icon name="arrow" size={18}/></Link></div></div></section><section className="section section-light values-section"><div className="container values-grid">{[['01','Scripture first','Every message begins with the biblical text and seeks to explain it faithfully in context.'],['02','Christ centered','The aim is not merely better behavior, but a clearer vision of Jesus and life under His lordship.'],['03','Built to remember','Strong structure, central ideas, and practical application help truth stay with the listener.']].map(([number,title,copy]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p></article>)}</div></section></>;
}

function NotFoundPage() {
  return <section className="section section-light not-found"><div className="container empty-state"><span className="error-code">404</span><h1>This page wandered off.</h1><p>The link may be outdated, but the sermon library is still right where it belongs.</p><Link className="button button-dark" to="/">Return home</Link></div></section>;
}

function App() {
  return <><ScrollToTop/><Routes><Route path="/admin/*" element={<AdminApp/>}/><Route element={<Layout/>}><Route path="/" element={<HomePage/>}/><Route path="/sermons" element={<SermonsPage/>}/><Route path="/sermons/:slug" element={<SermonDetailPage/>}/><Route path="/series" element={<SeriesPage/>}/><Route path="/series/:slug" element={<SeriesDetailPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="*" element={<NotFoundPage/>}/></Route></Routes></>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><HashRouter><App/></HashRouter></React.StrictMode>);
