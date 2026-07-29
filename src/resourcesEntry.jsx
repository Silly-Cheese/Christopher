import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db, githubPagesBase, isFirebaseConfigured } from './firebaseClient';
import './resources.css';

const demoResources = [
  {
    id: 'demo-rescued',
    title: 'Rescued: Three Stories of God’s Deliverance',
    slug: 'rescued-three-stories',
    type: 'Bible Class',
    audience: 'Grades 1–6',
    scripture: 'Jonah 1–4; Daniel 6; Daniel 3',
    scriptureBook: 'Daniel',
    summary: 'A dynamic children’s Bible lesson connecting Jonah, Daniel, and the fiery furnace through the truth that God sees, stays, and saves.',
    topics: ['Courage', 'Faith', 'God’s Power'],
    estimatedMinutes: '35 minutes',
    featured: true,
    status: 'published',
    sections: [
      { heading: 'Big idea', paragraphs: ['God does not always keep us from every hard moment, but He never abandons His people inside those moments.'] },
      { heading: 'Teaching movement', paragraphs: ['Begin with Jonah and the storm, move to Daniel in the lions’ den, and finish with Shadrach, Meshach, and Abednego. In every story, ask what danger appeared, what faithful choice was made, and how God acted.'] },
      { heading: 'Application', paragraphs: ['Children can trust God when they feel afraid, choose what is right when they stand alone, and remember that God is present even before the rescue arrives.'] },
    ],
    discussionQuestions: ['What did each person have to trust God with?', 'Does rescue always happen the way we expect?', 'What is one brave choice you can make this week?'],
  },
  {
    id: 'demo-joy',
    title: 'Choosing Joy When Life Is Unsteady',
    slug: 'choosing-joy-habakkuk',
    type: 'Study Guide',
    audience: 'Students and Adults',
    scripture: 'Habakkuk 3:16–19',
    scriptureBook: 'Habakkuk',
    summary: 'A guided study of joy that is rooted in God’s character rather than changing circumstances.',
    topics: ['Joy', 'Suffering', 'Trust'],
    estimatedMinutes: '25 minutes',
    featured: true,
    status: 'published',
    sections: [
      { heading: 'Read', paragraphs: ['Read Habakkuk 3:16–19 slowly. Notice that Habakkuk does not deny fear, loss, or uncertainty before he chooses joy.'] },
      { heading: 'Observe', paragraphs: ['List every circumstance that may fail in verses 17–18. Then identify what remains unchanged.'] },
      { heading: 'Respond', paragraphs: ['Write a prayer that names what feels unsteady and then deliberately anchors hope in who God is.'] },
    ],
    discussionQuestions: ['How is biblical joy different from pretending everything is fine?', 'What does Habakkuk know about God?', 'What truth can support your joy this week?'],
  },
  {
    id: 'demo-apologetics',
    title: 'The Unknown God: Finding Evidence of the Creator',
    slug: 'unknown-god-evidence',
    type: 'Bible Class',
    audience: 'Grades 1–5',
    scripture: 'Acts 17:16–34',
    scriptureBook: 'Acts',
    summary: 'An outdoor evidence walk and Bible lesson answering Paul’s question about the “unknown God.”',
    topics: ['Apologetics', 'Creation', 'Paul'],
    estimatedMinutes: '40 minutes',
    featured: false,
    status: 'published',
    sections: [
      { heading: 'The question', paragraphs: ['The people of Athens had an altar for a god they did not know. Paul explained that the true God made the world and gives life to everyone.'] },
      { heading: 'Evidence walk', paragraphs: ['Invite children to look for order, beauty, life, design, and things people could not create from nothing. Let them report what each discovery teaches them about God.'] },
      { heading: 'The answer', paragraphs: ['The unknown God is not distant or hidden. He is the Creator, He wants people to seek Him, and He has made Himself known through Jesus.'] },
    ],
    discussionQuestions: ['What did you find that points to a Creator?', 'Why did Paul begin with something the Athenians already noticed?', 'How has God made Himself known most clearly?'],
  },
];

const demoPlans = [
  {
    id: 'demo-plan-enough',
    title: 'Christ Is Enough',
    slug: 'christ-is-enough',
    description: 'A five-day reading plan through key passages in Colossians that centers identity, hope, and daily life on Jesus.',
    audience: 'Students and Adults',
    scriptureBooks: ['Colossians'],
    status: 'published',
    featured: true,
    days: [
      { title: 'Jesus Above Everything', scripture: 'Colossians 1:15–20', reflection: 'Jesus is not one important part of life. He is before all things, holds all things together, and stands supreme over creation and the church.', questions: ['Where are you tempted to treat Jesus as an addition instead of the center?'] },
      { title: 'Reconciled', scripture: 'Colossians 1:21–23', reflection: 'The gospel changes both our standing before God and the direction of our lives. We continue grounded in the hope we received.', questions: ['What does reconciliation tell you about God’s initiative?'] },
      { title: 'Rooted', scripture: 'Colossians 2:6–10', reflection: 'Christian maturity is not moving beyond Christ. It is learning to walk more deeply in the One we first received.', questions: ['What practices help your roots grow deeper?'] },
      { title: 'A New Life', scripture: 'Colossians 3:1–17', reflection: 'Because believers have been raised with Christ, they put away the old life and put on compassion, humility, patience, love, and gratitude.', questions: ['Which old pattern needs to be put away?', 'Which Christlike quality needs to be put on?'] },
      { title: 'Faithful in Everything', scripture: 'Colossians 3:18–4:6', reflection: 'Christ’s sufficiency reaches homes, work, prayer, speech, and relationships. Every ordinary place becomes a place to honor Him.', questions: ['Where does your faith need to become more visible in ordinary life?'] },
    ],
  },
  {
    id: 'demo-plan-courage',
    title: 'Five Days of Courage',
    slug: 'five-days-of-courage',
    description: 'Short readings for learning that courage is faithful obedience in the presence of fear.',
    audience: 'Families and Children',
    scriptureBooks: ['Judges', 'Daniel', 'Esther', 'Acts'],
    status: 'published',
    featured: false,
    days: [
      { title: 'Gideon Takes the Next Step', scripture: 'Judges 6:11–16', reflection: 'God met Gideon while he felt small and afraid. Courage began when Gideon listened to what God said rather than what fear said.', questions: ['What next step can you take even while nervous?'] },
      { title: 'Daniel Keeps Praying', scripture: 'Daniel 6:6–10', reflection: 'Daniel did not create a dramatic new habit when pressure came. He continued the faithful practice he already had.', questions: ['What faithful habit can prepare you for pressure?'] },
      { title: 'Esther Speaks', scripture: 'Esther 4:12–16', reflection: 'Esther accepted that silence was also a decision. She prepared, prayed, and used her position to help others.', questions: ['Who may need you to speak or act?'] },
      { title: 'Peter Stands', scripture: 'Acts 4:8–13', reflection: 'Peter’s courage did not come from impressive credentials. It came from being with Jesus and trusting the Spirit.', questions: ['How does time with Jesus shape courage?'] },
      { title: 'Paul Keeps the Faith', scripture: '2 Timothy 4:6–8', reflection: 'Courage is not only one brave moment. It is finishing faithfully after many difficult steps.', questions: ['What does faithful endurance look like for you?'] },
    ],
  },
];

function normalize(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function loadLibrary() {
  if (!db) return { resources: demoResources, plans: demoPlans, sermons: [] };
  try {
    const [resourceSnapshot, planSnapshot, sermonSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'resources'), where('status', '==', 'published'))),
      getDocs(query(collection(db, 'readingPlans'), where('status', '==', 'published'))),
      getDocs(query(collection(db, 'sermons'), where('status', '==', 'published'))),
    ]);
    const resources = normalize(resourceSnapshot);
    const plans = normalize(planSnapshot);
    return {
      resources: resources.length ? resources : demoResources,
      plans: plans.length ? plans : demoPlans,
      sermons: normalize(sermonSnapshot),
    };
  } catch (error) {
    console.error('Unable to load the ministry resource library.', error);
    return { resources: demoResources, plans: demoPlans, sermons: [] };
  }
}

async function recordView(contentType, contentId) {
  if (!db || !contentId) return;
  const localKey = `cs-viewed-${contentType}-${contentId}`;
  if (localStorage.getItem(localKey)) return;
  try {
    const reference = doc(db, 'contentViews', `${contentType}_${contentId}`);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (snapshot.exists()) transaction.update(reference, { views: Number(snapshot.data().views || 0) + 1, lastViewedAt: serverTimestamp() });
      else transaction.set(reference, { contentType, contentId, views: 1, lastViewedAt: serverTimestamp() });
    });
    localStorage.setItem(localKey, '1');
  } catch (error) {
    console.warn('View tracking was unavailable.', error);
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name] || paths.book}</svg>;
}

function Header() {
  return <header className="resource-header"><div className="resource-container resource-header-inner"><a className="resource-brand" href={`${githubPagesBase}#/`}><span>CS</span><div><strong>Christopher Shelley</strong><small>Ministry Resource Library</small></div></a><nav><NavLink end to="/">Discover</NavLink><NavLink to="/library">Library</NavLink><NavLink to="/scripture">Scripture Index</NavLink><NavLink to="/plans">Reading Plans</NavLink><a href={`${githubPagesBase}#/sermons`}>Sermons</a></nav></div></header>;
}

function Footer() {
  return <footer className="resource-footer"><div className="resource-container"><div><strong>Resources built to be used.</strong><p>Study Scripture, teach clearly, and carry truth into ordinary life.</p></div><div className="resource-footer-links"><a href={`${githubPagesBase}#/`}>Main website</a><Link to="/library">All resources</Link><Link to="/plans">Reading plans</Link><a href={`${githubPagesBase}#/about`}>About Christopher</a></div></div></footer>;
}

function ResourceCard({ item }) {
  return <article className="resource-card"><div className="resource-card-top"><span>{item.type}</span><small>{item.audience}</small></div><h3>{item.title}</h3><p className="resource-scripture">{item.scripture}</p><p>{item.summary}</p><div className="resource-tags">{(item.topics || []).slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}</div><div className="resource-card-foot"><small>{item.estimatedMinutes || 'Self-paced'}</small><Link to={`/resource/${item.slug}`}>Open resource <Icon name="arrow" size={17}/></Link></div></article>;
}

function PlanCard({ plan }) {
  return <article className="plan-card"><span className="plan-days">{(plan.days || []).length} days</span><h3>{plan.title}</h3><p>{plan.description}</p><small>{plan.audience}</small><Link to={`/plans/${plan.slug}`}>Begin plan <Icon name="arrow" size={17}/></Link></article>;
}

function DiscoverPage({ data }) {
  const featuredResources = data.resources.filter((item) => item.featured).slice(0, 3);
  const featuredPlans = data.plans.filter((item) => item.featured).slice(0, 2);
  const shownResources = featuredResources.length ? featuredResources : data.resources.slice(0, 3);
  const shownPlans = featuredPlans.length ? featuredPlans : data.plans.slice(0, 2);
  return <><section className="resource-hero"><div className="resource-container resource-hero-grid"><div><span className="resource-eyebrow">Study • Teach • Grow</span><h1>A library for going <em>deeper.</em></h1><p>Explore Bible classes, study guides, devotionals, discussion material, and reading plans—all organized around Scripture and built to be put into practice.</p><div className="resource-actions"><Link className="resource-button primary" to="/library">Explore the library <Icon name="arrow" size={18}/></Link><Link className="resource-button secondary" to="/scripture">Browse by Scripture</Link></div></div><div className="resource-hero-panel"><Icon name="book" size={44}/><span>One growing collection</span><strong>{data.resources.length + data.plans.length}</strong><p>resources and guided plans</p><div><span>{new Set(data.resources.map((item) => item.type)).size}</span> formats <span>{new Set([...data.resources.map((item) => item.scriptureBook), ...data.plans.flatMap((item) => item.scriptureBooks || [])]).size}</span> Bible books</div></div></div></section><section className="resource-section light"><div className="resource-container"><div className="resource-heading"><span>Featured resources</span><h2>Ready for the next lesson.</h2><p>Open a complete teaching or study resource, then adapt it to the people in front of you.</p></div><div className="resource-grid">{shownResources.map((item) => <ResourceCard item={item} key={item.id}/>)}</div><div className="resource-center"><Link className="resource-text-link" to="/library">View every resource <Icon name="arrow" size={18}/></Link></div></div></section><section className="resource-section dark"><div className="resource-container plan-feature-grid"><div className="resource-heading"><span>Guided reading</span><h2>Do not just find a passage. Stay with it.</h2><p>Reading plans break a biblical theme into clear daily steps with reflection and questions.</p><Link className="resource-button primary" to="/plans">Explore reading plans</Link></div><div className="plan-stack">{shownPlans.map((plan) => <PlanCard key={plan.id} plan={plan}/>)}</div></div></section></>;
}

function LibraryPage({ resources }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [audience, setAudience] = useState('All');
  const types = ['All', ...new Set(resources.map((item) => item.type).filter(Boolean))];
  const audiences = ['All', ...new Set(resources.map((item) => item.audience).filter(Boolean))];
  const filtered = resources.filter((item) => {
    const text = [item.title, item.summary, item.scripture, item.scriptureBook, item.type, item.audience, ...(item.topics || [])].join(' ').toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (type === 'All' || item.type === type) && (audience === 'All' || item.audience === audience);
  });
  return <><section className="resource-page-hero"><div className="resource-container"><span className="resource-eyebrow">Resource library</span><h1>Find what helps you teach and grow.</h1><p>Search complete lessons and study material by passage, topic, audience, or format.</p></div></section><section className="resource-section light"><div className="resource-container"><div className="resource-filter"><label><Icon name="search"/><input onChange={(event) => setSearch(event.target.value)} placeholder="Search title, Scripture, topic…" type="search" value={search}/></label><select onChange={(event) => setType(event.target.value)} value={type}>{types.map((item) => <option key={item}>{item}</option>)}</select><select onChange={(event) => setAudience(event.target.value)} value={audience}>{audiences.map((item) => <option key={item}>{item}</option>)}</select></div><div className="resource-results"><strong>{filtered.length}</strong> {filtered.length === 1 ? 'resource' : 'resources'}</div>{filtered.length ? <div className="resource-grid">{filtered.map((item) => <ResourceCard item={item} key={item.id}/>)}</div> : <div className="resource-empty"><Icon name="search" size={36}/><h2>No resources match those filters.</h2><p>Try a different passage, topic, audience, or format.</p></div>}</div></section></>;
}

function ResourceDetailPage({ resources }) {
  const { slug } = useParams();
  const item = resources.find((entry) => entry.slug === slug);
  useEffect(() => { if (item) recordView('resource', item.id); }, [item?.id]);
  if (!item) return <NotFound/>;
  return <article><header className="resource-detail-hero"><div className="resource-container"><Link to="/library">← Resource library</Link><div className="resource-detail-meta"><span>{item.type}</span><span>{item.audience}</span><span>{item.estimatedMinutes || 'Self-paced'}</span></div><h1>{item.title}</h1><p className="resource-detail-scripture">{item.scripture}</p><p>{item.summary}</p>{item.downloadUrl && <a className="resource-button primary" href={item.downloadUrl} rel="noreferrer" target="_blank"><Icon name="download" size={18}/> Download resource</a>}</div></header><section className="resource-section light"><div className="resource-container resource-detail-grid"><aside><div className="resource-side-card"><span>Topics</span><div className="resource-tags">{(item.topics || []).map((topic) => <span key={topic}>{topic}</span>)}</div></div><div className="resource-side-card"><span>Use this resource</span><p>Read through the full material, adapt examples for your audience, and keep the central biblical truth unchanged.</p></div></aside><div className="resource-body">{(item.sections || []).map((section) => <section key={section.heading}><h2>{section.heading}</h2>{(section.paragraphs || []).map((paragraph, index) => <p key={`${section.heading}-${index}`}>{paragraph}</p>)}</section>)}{(item.discussionQuestions || []).length > 0 && <section className="question-section"><span>Discuss and respond</span><h2>Questions to carry forward</h2><ol>{item.discussionQuestions.map((question) => <li key={question}>{question}</li>)}</ol></section>}</div></div></section></article>;
}

function ScriptureIndexPage({ data }) {
  const entries = useMemo(() => {
    const map = new Map();
    const add = (book, kind, item) => {
      if (!book) return;
      if (!map.has(book)) map.set(book, { resources: [], sermons: [], plans: [] });
      map.get(book)[kind].push(item);
    };
    data.resources.forEach((item) => add(item.scriptureBook, 'resources', item));
    data.sermons.forEach((item) => add(item.scriptureBook, 'sermons', item));
    data.plans.forEach((plan) => (plan.scriptureBooks || []).forEach((book) => add(book, 'plans', plan)));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);
  return <><section className="resource-page-hero"><div className="resource-container"><span className="resource-eyebrow">Scripture index</span><h1>Begin with the biblical text.</h1><p>See sermons, lessons, studies, and reading plans connected to each Bible book.</p></div></section><section className="resource-section light"><div className="resource-container scripture-index">{entries.map(([book, groups]) => <details key={book}><summary><strong>{book}</strong><span>{groups.resources.length + groups.sermons.length + groups.plans.length} items</span></summary><div>{groups.resources.map((item) => <Link key={`r-${item.id}`} to={`/resource/${item.slug}`}><span>Resource</span><strong>{item.title}</strong><small>{item.scripture}</small></Link>)}{groups.plans.map((item) => <Link key={`p-${item.id}`} to={`/plans/${item.slug}`}><span>Reading plan</span><strong>{item.title}</strong><small>{(item.days || []).length} days</small></Link>)}{groups.sermons.map((item) => <a href={`${githubPagesBase}#/sermons/${item.slug}`} key={`s-${item.id}`}><span>Sermon</span><strong>{item.title}</strong><small>{item.scripture}</small></a>)}</div></details>)}</div></section></>;
}

function PlansPage({ plans }) {
  return <><section className="resource-page-hero"><div className="resource-container"><span className="resource-eyebrow">Reading plans</span><h1>Make room to remain in the Word.</h1><p>Choose a plan, move one day at a time, and save your progress on this device.</p></div></section><section className="resource-section light"><div className="resource-container plan-grid">{plans.map((plan) => <PlanCard key={plan.id} plan={plan}/>)}</div></section></>;
}

function PlanDetailPage({ plans }) {
  const { slug } = useParams();
  const plan = plans.find((entry) => entry.slug === slug);
  const storageKey = plan ? `cs-plan-progress-${plan.id}` : '';
  const [completed, setCompleted] = useState([]);
  useEffect(() => {
    if (!plan) return;
    recordView('readingPlan', plan.id);
    try { setCompleted(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { setCompleted([]); }
  }, [plan?.id]);
  if (!plan) return <NotFound/>;
  function toggle(index) {
    const next = completed.includes(index) ? completed.filter((item) => item !== index) : [...completed, index];
    setCompleted(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }
  const percent = plan.days?.length ? Math.round((completed.length / plan.days.length) * 100) : 0;
  return <article><header className="plan-detail-hero"><div className="resource-container"><Link to="/plans">← All reading plans</Link><span className="resource-eyebrow">{plan.days?.length || 0}-day plan</span><h1>{plan.title}</h1><p>{plan.description}</p><div className="plan-progress"><div><span style={{ width: `${percent}%` }}/></div><strong>{percent}% complete</strong></div></div></header><section className="resource-section light"><div className="resource-container plan-days-list">{(plan.days || []).map((day, index) => <article className={completed.includes(index) ? 'complete' : ''} key={`${day.title}-${index}`}><button aria-label={`Mark day ${index + 1} complete`} onClick={() => toggle(index)} type="button">{completed.includes(index) ? <Icon name="check"/> : index + 1}</button><div><span>Day {index + 1}</span><h2>{day.title}</h2><p className="resource-detail-scripture">{day.scripture}</p><p>{day.reflection}</p>{(day.questions || []).length > 0 && <div className="day-questions"><strong>Reflect</strong><ul>{day.questions.map((question) => <li key={question}>{question}</li>)}</ul></div>}</div></article>)}</div></section></article>;
}

function NotFound() {
  return <section className="resource-section light"><div className="resource-container resource-empty"><Icon name="compass" size={40}/><h1>That resource could not be found.</h1><p>It may be private, archived, or using a different link.</p><Link className="resource-button primary" to="/">Return to resources</Link></div></section>;
}

function App() {
  const [data, setData] = useState({ resources: [], plans: [], sermons: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadLibrary().then(setData).finally(() => setLoading(false)); }, []);
  return <div className="resource-shell"><Header/><main>{loading ? <div className="resource-loading"><span/><p>Opening the resource library…</p></div> : <Routes><Route path="/" element={<DiscoverPage data={data}/>}/><Route path="/library" element={<LibraryPage resources={data.resources}/>}/><Route path="/resource/:slug" element={<ResourceDetailPage resources={data.resources}/>}/><Route path="/scripture" element={<ScriptureIndexPage data={data}/>}/><Route path="/plans" element={<PlansPage plans={data.plans}/>}/><Route path="/plans/:slug" element={<PlanDetailPage plans={data.plans}/>}/><Route path="*" element={<NotFound/>}/></Routes>}</main><Footer/>{!isFirebaseConfigured && <div className="resource-demo-notice">Preview content is shown until Firebase is configured.</div>}</div>;
}

ReactDOM.createRoot(document.getElementById('resource-root')).render(<React.StrictMode><HashRouter><App/></HashRouter></React.StrictMode>);
