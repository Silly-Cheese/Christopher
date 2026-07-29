import { doc, getDoc } from 'firebase/firestore';
import { db, githubPagesBase } from './firebaseClient';

const resourceUrl = `${githubPagesBase}resources.html#/`;
const studioUrl = `${githubPagesBase}admin-resources.html#/`;

function makeBookIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.innerHTML = '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/>';
  return svg;
}

function insertPublicLinks() {
  const navigation = document.querySelector('.main-nav');
  if (navigation && !navigation.querySelector('[data-phase3-resources]')) {
    const link = document.createElement('a');
    link.href = resourceUrl;
    link.textContent = 'Resources';
    link.dataset.phase3Resources = 'true';
    navigation.append(link);
  }

  const footer = document.querySelector('.footer-links');
  if (footer && !footer.querySelector('[data-phase3-resources]')) {
    const link = document.createElement('a');
    link.href = resourceUrl;
    link.textContent = 'Resources';
    link.dataset.phase3Resources = 'true';
    footer.append(link);
  }
}

function insertAdminLink() {
  const navigation = document.querySelector('.admin-nav');
  if (!navigation || navigation.querySelector('[data-phase3-studio]')) return;
  const link = document.createElement('a');
  link.href = studioUrl;
  link.dataset.phase3Studio = 'true';
  link.append(makeBookIcon());
  const label = document.createElement('span');
  label.textContent = 'Resource Studio';
  link.append(label);
  navigation.append(link);
}

function insertHomepageResourceCard() {
  const invitation = document.querySelector('.invitation-card');
  if (!invitation || document.querySelector('[data-phase3-invitation]')) return;
  const section = invitation.closest('section');
  if (!section) return;
  const clone = section.cloneNode(true);
  clone.dataset.phase3Invitation = 'true';
  const eyebrow = clone.querySelector('.eyebrow');
  const heading = clone.querySelector('h2');
  const copy = clone.querySelector('p');
  const link = clone.querySelector('a');
  if (eyebrow) eyebrow.textContent = 'Teach and study';
  if (heading) heading.textContent = 'Open the ministry resource library.';
  if (copy) copy.textContent = 'Explore Bible classes, study guides, devotionals, Scripture indexes, and guided reading plans.';
  if (link) {
    link.href = resourceUrl;
    link.textContent = 'Browse resources →';
    link.removeAttribute('data-discover');
  }
  section.after(clone);
}

async function applySiteSettings() {
  if (!db || document.body.dataset.siteSettingsLoaded) return;
  document.body.dataset.siteSettingsLoaded = 'true';
  try {
    const snapshot = await getDoc(doc(db, 'siteSettings', 'main'));
    if (!snapshot.exists()) return;
    const settings = snapshot.data();
    const headline = document.querySelector('.hero-copy h1');
    const description = document.querySelector('.hero-copy > p');
    const biography = document.querySelector('.about-copy .lead');
    if (headline && settings.homepageHeadline?.trim()) headline.textContent = settings.homepageHeadline.trim();
    if (description && settings.homepageDescription?.trim()) description.textContent = settings.homepageDescription.trim();
    if (biography && settings.biography?.trim()) biography.textContent = settings.biography.trim();

    const footer = document.querySelector('.footer-links');
    if (footer && settings.prayerProjectUrl && !footer.querySelector('[data-prayer-project]')) {
      const link = document.createElement('a');
      link.href = settings.prayerProjectUrl;
      link.textContent = 'The Prayer Project';
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.dataset.prayerProject = 'true';
      footer.append(link);
    }
    if (footer && settings.contactEmail && !footer.querySelector('[data-contact-email]')) {
      const link = document.createElement('a');
      link.href = `mailto:${settings.contactEmail}`;
      link.textContent = 'Contact';
      link.dataset.contactEmail = 'true';
      footer.append(link);
    }
  } catch (error) {
    console.warn('Public site settings could not be loaded.', error);
  }
}

function connectPhase3() {
  insertPublicLinks();
  insertAdminLink();
  insertHomepageResourceCard();
  applySiteSettings();
}

const observer = new MutationObserver(connectPhase3);
observer.observe(document.documentElement, { childList: true, subtree: true });
connectPhase3();
