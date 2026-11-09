/**
 * ClubSphere Centralized Role-Based Notification Dropdown Script
 */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const wrapper = document.getElementById('notifDropdownWrapper');
    const bellBtn = document.getElementById('notifBellBtn');
    const panel = document.getElementById('notifDropdownPanel');
    const badge = document.getElementById('notifBadgeCount');
    const pill = document.getElementById('notifUnreadPill');
    const markAllBtn = document.getElementById('btnMarkAllRead');
    const list = document.getElementById('notifDropdownList');

    if (!bellBtn || !panel) return;

    // Toggle Dropdown
    bellBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = panel.classList.contains('active');
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    function openDropdown() {
      panel.classList.add('active');
      bellBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      panel.classList.remove('active');
      bellBtn.setAttribute('aria-expanded', 'false');
    }

    // Close on click outside
    document.addEventListener('click', function(e) {
      if (wrapper && !wrapper.contains(e.target)) {
        closeDropdown();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    // Update Badge UI helper
    function updateBadgeUI(count) {
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.style.display = 'inline-flex';
          bellBtn.classList.add('has-unread');
          if (pill) pill.textContent = count + ' Unread';
        } else {
          badge.textContent = '0';
          badge.style.display = 'none';
          bellBtn.classList.remove('has-unread');
          if (pill) pill.textContent = 'All Read';
        }
      }
    }

    // Mark All As Read
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
          const res = await fetch('/notifications/api/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.success) {
            updateBadgeUI(0);
            // Mark all visible items as read
            const unreadItems = panel.querySelectorAll('.notif-item.unread');
            unreadItems.forEach(item => {
              item.classList.remove('unread');
              item.classList.add('read');
              const btn = item.querySelector('.notif-item-mark-btn');
              if (btn) btn.remove();
            });
          }
        } catch (err) {
          console.error('Failed to mark all as read:', err);
        }
      });
    }

    // Delegate Mark Single as Read
    if (list) {
      list.addEventListener('click', async function(e) {
        const markBtn = e.target.closest('.notif-item-mark-btn');
        if (markBtn) {
          e.preventDefault();
          e.stopPropagation();
          const notifId = markBtn.dataset.id;
          const item = markBtn.closest('.notif-item');

          try {
            const res = await fetch('/notifications/api/' + notifId + '/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
              if (item) {
                item.classList.remove('unread');
                item.classList.add('read');
                markBtn.remove();
              }
              updateBadgeUI(data.unreadCount);
            }
          } catch (err) {
            console.error('Failed to mark notification read:', err);
          }
          return;
        }

        // When student clicks the link itself, also mark as read
        const link = e.target.closest('.notif-item-link');
        if (link) {
          const notifId = link.dataset.id;
          const item = link.closest('.notif-item');
          if (item && item.classList.contains('unread') && notifId) {
            fetch('/notifications/api/' + notifId + '/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).catch(function(e) {});
          }
        }
      });
    }
  });
})();
