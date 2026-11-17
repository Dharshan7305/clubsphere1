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
    const actionStatus = document.getElementById('notifActionStatus');

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
      setActionStatus('');
      loadRecentNotifications();
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
        } else {
          badge.textContent = '0';
          badge.style.display = 'none';
          bellBtn.classList.remove('has-unread');
        }
      }
      if (pill) pill.textContent = count > 0 ? count + ' Unread' : 'All Read';
    }

    function setActionStatus(message, isError) {
      if (!actionStatus) return;
      actionStatus.textContent = message;
      actionStatus.hidden = !message;
      actionStatus.classList.toggle('error', Boolean(message && isError));
    }

    async function markNotificationRead(notificationId) {
      const response = await fetch('/notifications/api/' + encodeURIComponent(notificationId) + '/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok || !data.success || !Number.isFinite(data.unreadCount)) {
        throw new Error(data.error || 'Could not mark notification as read.');
      }
      return data;
    }

    function renderNotifications(notifications) {
      if (!list) return;
      list.replaceChildren();

      if (notifications.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'notif-empty-dropdown';
        const icon = document.createElement('span');
        icon.className = 'notif-empty-icon';
        icon.textContent = '📭';
        const message = document.createElement('p');
        message.textContent = "You're all caught up! No notifications.";
        empty.append(icon, message);
        list.appendChild(empty);
        return;
      }

      notifications.forEach(function(notification) {
        const item = document.createElement('div');
        item.className = 'notif-item ' + (notification.isRead ? 'read' : 'unread');
        item.dataset.id = notification._id;

        const icon = document.createElement('span');
        icon.className = 'notif-item-icon';
        icon.textContent = notification.icon || '🔔';

        const body = document.createElement('div');
        body.className = 'notif-item-body';
        const link = document.createElement('a');
        link.className = 'notif-item-link';
        link.dataset.id = notification._id;

        const relatedLink = new URL(notification.relatedLink || '#', window.location.origin);
        link.href = relatedLink.origin === window.location.origin
          ? relatedLink.pathname + relatedLink.search + relatedLink.hash
          : '/notifications';

        const title = document.createElement('div');
        title.className = 'notif-item-title';
        title.textContent = notification.title || 'Notification';

        const message = document.createElement('div');
        message.className = 'notif-item-msg';
        message.textContent = notification.message || '';

        const time = document.createElement('div');
        time.className = 'notif-item-time';
        time.textContent = notification.timeAgo || '';

        link.append(title, message, time);
        body.appendChild(link);
        item.append(icon, body);

        if (!notification.isRead) {
          const markButton = document.createElement('button');
          markButton.type = 'button';
          markButton.className = 'notif-item-mark-btn';
          markButton.title = 'Mark as read';
          markButton.dataset.id = notification._id;
          markButton.textContent = '✓';
          item.appendChild(markButton);
        }

        list.appendChild(item);
      });
    }

    async function loadRecentNotifications() {
      if (!list) return;
      list.textContent = 'Loading notifications...';

      try {
        const response = await fetch('/notifications/api/recent');
        if (!response.ok) {
          throw new Error('Notification request failed with status ' + response.status);
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.notifications) || !Number.isFinite(data.unreadCount)) {
          throw new Error('Notification response was invalid');
        }

        renderNotifications(data.notifications);
        updateBadgeUI(data.unreadCount);
      } catch (error) {
        console.error('Failed to load recent notifications:', error);
        list.textContent = 'Could not load notifications. Please try again.';
      }
    }

    // Mark All As Read
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        markAllBtn.disabled = true;
        setActionStatus('Marking notifications as read...');
        try {
          const res = await fetch('/notifications/api/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (!res.ok || !data.success || !Number.isFinite(data.unreadCount)) {
            throw new Error(data.error || 'Could not mark notifications as read.');
          }

          updateBadgeUI(data.unreadCount);
          const unreadItems = panel.querySelectorAll('.notif-item.unread');
          unreadItems.forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const btn = item.querySelector('.notif-item-mark-btn');
            if (btn) btn.remove();
          });
          setActionStatus('All notifications marked as read.');
        } catch (error) {
          console.error('Failed to mark all as read:', error);
          setActionStatus(error.message, true);
        } finally {
          markAllBtn.disabled = false;
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

          markBtn.disabled = true;
          setActionStatus('Marking notification as read...');
          try {
            const data = await markNotificationRead(notifId);
            if (item) {
              item.classList.remove('unread');
              item.classList.add('read');
              markBtn.remove();
            }
            updateBadgeUI(data.unreadCount);
            setActionStatus('Notification marked as read.');
          } catch (error) {
            console.error('Failed to mark notification read:', error);
            setActionStatus(error.message, true);
            markBtn.disabled = false;
          }
          return;
        }

        // When student clicks the link itself, also mark as read
        const link = e.target.closest('.notif-item-link');
        if (link) {
          const notifId = link.dataset.id;
          const item = link.closest('.notif-item');
          if (item && item.classList.contains('unread') && notifId) {
            e.preventDefault();
            setActionStatus('Marking notification as read...');
            try {
              const data = await markNotificationRead(notifId);
              item.classList.remove('unread');
              item.classList.add('read');
              const markBtn = item.querySelector('.notif-item-mark-btn');
              if (markBtn) markBtn.remove();
              updateBadgeUI(data.unreadCount);
              window.location.assign(link.href);
            } catch (error) {
              console.error('Failed to mark notification read:', error);
              setActionStatus(error.message, true);
            }
          }
        }
      });
    }
  });
})();
