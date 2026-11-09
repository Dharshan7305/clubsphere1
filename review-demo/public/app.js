/**
 * ==============================================================================
 * CLUBSPHERE REVIEW DEMO - CLIENT JAVASCRIPT (app.js)
 * Purpose: Connects the original UI to the Express.js server
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const themeToggle = document.getElementById('themeToggle');
  const serverStatusPill = document.getElementById('liveServerStatus');
  const serverStatusText = document.getElementById('serverStatusText');
  const quickPingBtn = document.getElementById('quickPingBtn');
  const fetchClubsApiBtn = document.getElementById('fetchClubsApiBtn');
  const expressDemoForm = document.getElementById('expressDemoForm');
  const expressTerminal = document.getElementById('expressTerminal');
  const featuredClubsGrid = document.getElementById('featuredClubsGrid');
  const dynamicClubCount = document.getElementById('dynamicClubCount');
  const statClubs = document.getElementById('statClubs');
  const reviewToast = document.getElementById('reviewToast');

  // 1. Theme Toggle (Matches original ClubSphere theme engine)
  const savedTheme = localStorage.getItem('clubsphere-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('clubsphere-theme', newTheme);
      updateThemeIcon(newTheme);
      showToast(`Theme switched to ${newTheme} mode`);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // 2. Toast Notification Helper
  function showToast(msg) {
    if (!reviewToast) return;
    reviewToast.textContent = msg;
    reviewToast.style.display = 'block';
    setTimeout(() => {
      reviewToast.style.display = 'none';
    }, 3000);
  }

  // 3. Terminal Log Output
  function logTerminal(action, data = null) {
    const time = new Date().toLocaleTimeString();
    let text = `[${time}] ${action}`;
    if (data) {
      text += `\n${JSON.stringify(data, null, 2)}`;
    }
    expressTerminal.textContent = text;
  }

  // 4. Live Server Health Check & Ping Test (GET /api/status)
  async function pingServer() {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/status');
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      serverStatusText.textContent = `Express: Active (${latency}ms)`;
      serverStatusPill.style.background = 'rgba(16, 185, 129, 0.25)';
      serverStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.5)';

      logTerminal(`Ping Express Server (GET /api/status) - ${latency}ms latency`, json);
      showToast(`Server Active! Response time: ${latency}ms`);
    } catch (err) {
      serverStatusText.textContent = 'Express: Offline';
      serverStatusPill.style.background = 'rgba(239, 68, 68, 0.25)';
      serverStatusPill.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      logTerminal('Express server unreachable. Make sure "node review-demo/server.js" is running.');
      showToast('Express Server Offline');
    }
  }

  if (quickPingBtn) {
    quickPingBtn.addEventListener('click', pingServer);
  }

  // 5. Fetch Clubs from Express Backend (GET /api/clubs)
  async function fetchClubsFromExpress() {
    try {
      if (fetchClubsApiBtn) {
        fetchClubsApiBtn.disabled = true;
        fetchClubsApiBtn.textContent = 'Fetching from Express...';
      }

      const res = await fetch('/api/clubs');
      if (!res.ok) throw new Error('Could not fetch clubs');

      const json = await res.json();
      const list = json.data || [];

      if (dynamicClubCount) dynamicClubCount.textContent = `${list.length} Registered Clubs`;
      if (statClubs) statClubs.textContent = list.length;

      // Dynamically render the featured club cards matching original styling
      featuredClubsGrid.innerHTML = '';
      list.forEach((club, index) => {
        const card = document.createElement('div');
        card.className = 'home-club-card';
        card.innerHTML = `
          <div class="home-club-art home-club-art-${(index % 3) + 1}">
            <span>${escapeHtml(club.name.substring(0, 1))}</span>
            <small>${escapeHtml(club.code || 'CS')}</small>
          </div>
          <div class="home-club-details">
            <span class="home-club-category">${escapeHtml(club.category)}</span>
            <h3>${escapeHtml(club.name)}</h3>
            <p>${escapeHtml(club.tagline || `Lead: ${club.lead} • ${club.members} active members`)}</p>
            <span class="home-club-link">Discover the club <span aria-hidden="true">↗</span></span>
          </div>
        `;
        featuredClubsGrid.appendChild(card);
      });

      logTerminal(`Fetched ${list.length} clubs from Express Server (GET /api/clubs)`, json);
      showToast(`Loaded ${list.length} clubs live from Express!`);
    } catch (err) {
      console.error(err);
      logTerminal('Error fetching clubs: ' + err.message);
    } finally {
      if (fetchClubsApiBtn) {
        fetchClubsApiBtn.disabled = false;
        fetchClubsApiBtn.textContent = '🔄 Fetch Data from Express (GET /api/clubs)';
      }
    }
  }

  if (fetchClubsApiBtn) {
    fetchClubsApiBtn.addEventListener('click', fetchClubsFromExpress);
  }

  // 6. Form Submission (POST /api/clubs)
  if (expressDemoForm) {
    expressDemoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('demoClubName').value.trim();
      const category = document.getElementById('demoClubCategory').value;
      const lead = document.getElementById('demoClubLead').value.trim();
      const submitBtn = document.getElementById('submitClubBtn');

      const payload = {
        name,
        category,
        lead,
        members: 45
      };

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending POST to Express...';

        const res = await fetch('/api/clubs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error adding club');

        logTerminal('POST /api/clubs successful! Added to Express server memory:', data);
        showToast(`Registered "${name}" to Express!`);

        // Reset form inputs
        expressDemoForm.reset();

        // Refresh dynamic list to show new club immediately
        fetchClubsFromExpress();
      } catch (err) {
        logTerminal('POST Error: ' + err.message);
        showToast('Error submitting club: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit to Express Server (POST)';
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on startup
  pingServer();
});
