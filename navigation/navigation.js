'use strict';

const themeToggle = document.querySelector('#themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const menuButton = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('#navLinks');
const themeColor = document.querySelector('meta[name="theme-color"]');

function updateTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute(
    'aria-label',
    `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
  );
  themeColor.content = theme === 'dark' ? '#100b1a' : '#f8f6fc';
}

let savedTheme = 'light';
try {
  savedTheme = localStorage.getItem('clubsphere-theme') || savedTheme;
} catch (error) {
  console.warn('Theme preference could not be loaded.', error);
}
updateTheme(savedTheme === 'dark' ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  updateTheme(theme);
  try {
    localStorage.setItem('clubsphere-theme', theme);
  } catch (error) {
    console.warn('Theme preference could not be saved.', error);
  }
});

const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
navLinks.querySelectorAll('a.nav-link').forEach((link) => {
  const linkPath = new URL(link.href).pathname.replace(/\/+$/, '') || '/';
  if (linkPath === currentPath) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('show');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  menuButton.querySelector('span').textContent = isOpen ? '×' : '☰';
});

navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navLinks.classList.remove('show');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    menuButton.querySelector('span').textContent = '☰';
  }
});
