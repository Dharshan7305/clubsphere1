// ClubSphere Client-Side Scripts

document.addEventListener('DOMContentLoaded', () => {
  // 0. Theme Switcher (Light / Dark Mode)
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;

  function updateThemeUI(theme) {
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    if (themeToggle) {
      const targetTheme = theme === 'dark' ? 'light' : 'dark';
      themeToggle.setAttribute('aria-label', `Switch to ${targetTheme} theme`);
      themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
      themeToggle.setAttribute('title', `Switch to ${targetTheme} theme`);
    }
  }

  const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  updateThemeUI(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const active = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      const targetTheme = active === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = targetTheme;
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.content = targetTheme === 'dark' ? '#100b1a' : '#f8f6fc';
      }

      try {
        localStorage.setItem('clubsphere-theme', targetTheme);
      } catch (error) {
        console.warn('Theme preference could not be saved.', error);
      }

      updateThemeUI(targetTheme);
    });
  }

  // 1. Mobile Menu Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // 2. Auto Dismiss Flash Alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 400);
    }, 5000);
  });

  // 3. Modal Functionality
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  };

  // Close modal when clicking outside box
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // 4. Mark Notification As Read (Ajax)
  window.markAsRead = async function (notifId, el) {
    try {
      const res = await fetch(`/student/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && el) {
        el.closest('.notif-card').classList.add('read');
        const badge = el.querySelector('.notif-status');
        if (badge) badge.remove();
        el.remove();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // 5. Attendance Toggle (Ajax for Core Member)
  window.toggleAttendance = async function (eventId, participantId, btn) {
    try {
      const res = await fetch(`/core/events/${eventId}/attendance/${participantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.attended) {
          btn.className = 'btn btn-sm btn-success';
          btn.innerHTML = '✓ Present';
        } else {
          btn.className = 'btn btn-sm btn-outline';
          btn.innerHTML = 'Mark Present';
        }
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };
});
