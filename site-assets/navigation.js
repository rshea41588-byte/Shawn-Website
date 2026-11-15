(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!header || !menuButton || !mobileNav) return;
  const coachDropdowns = [...header.querySelectorAll('.coach-dropdown')];
  const closeCoachDropdowns = () => coachDropdowns.forEach(dropdown => { dropdown.open = false; });
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 50);
  const closeMenu = () => {
    closeCoachDropdowns();
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    header.classList.remove('menu-open');
  };
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    mobileNav.hidden = isOpen;
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    header.classList.toggle('menu-open', !isOpen);
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  coachDropdowns.forEach(dropdown => {
    dropdown.addEventListener('toggle', () => {
      if (dropdown.open) coachDropdowns.forEach(other => { if (other !== dropdown) other.open = false; });
    });
    dropdown.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { dropdown.open = false; }));
    dropdown.addEventListener('focusout', event => {
      if (!dropdown.contains(event.relatedTarget)) dropdown.open = false;
    });
  });
  document.addEventListener('click', event => {
    coachDropdowns.forEach(dropdown => { if (!dropdown.contains(event.target)) dropdown.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openDropdown = coachDropdowns.find(dropdown => dropdown.open);
    if (openDropdown) { openDropdown.open = false; openDropdown.querySelector('summary').focus(); }
    else if (!mobileNav.hidden) { closeMenu(); menuButton.focus(); }
  });
  window.matchMedia('(min-width:901px)').addEventListener('change', event => { closeCoachDropdowns(); if (event.matches) closeMenu(); });
  window.addEventListener('scroll', updateHeader, { passive:true });
  window.addEventListener('pageshow', updateHeader);
  updateHeader();
})();
