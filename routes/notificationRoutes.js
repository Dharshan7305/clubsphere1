const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { ensureAuthenticated } = require('../middleware/auth');

// Protect all notification routes
router.use(ensureAuthenticated);

/**
 * GET /notifications/api/recent
 * Returns JSON for the navbar dropdown
 */
router.get('/api/recent', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const role = req.session.user.role;

    const [unreadCount, notifications] = await Promise.all([
      NotificationService.getUnreadCount(userId, role),
      NotificationService.getNotificationsForUser(userId, role, { limit: 8 })
    ]);

    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('API Notifications Fetch Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /notifications/api/:id/read
 * Marks a single notification as read via AJAX
 */
router.post('/api/:id/read', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const success = await NotificationService.markAsRead(req.params.id, userId);
    const unreadCount = await NotificationService.getUnreadCount(userId, req.session.user.role);

    res.json({ success, unreadCount });
  } catch (error) {
    console.error('API Mark Read Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /notifications/api/mark-all-read
 * Marks all notifications as read for current user via AJAX
 */
router.post('/api/mark-all-read', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const role = req.session.user.role;

    await NotificationService.markAllAsRead(userId, role);
    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error('API Mark All Read Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /notifications
 * Full "View All Notifications" page for the logged-in user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const role = req.session.user.role;
    const filter = req.query.filter || 'all';

    const [unreadCount, allNotifications] = await Promise.all([
      NotificationService.getUnreadCount(userId, role),
      NotificationService.getNotificationsForUser(userId, role, { limit: 100 })
    ]);

    let filteredNotifications = allNotifications;
    if (filter === 'unread') {
      filteredNotifications = allNotifications.filter(n => !n.isRead);
    } else if (filter !== 'all') {
      filteredNotifications = allNotifications.filter(n => n.type === filter);
    }

    res.render('notifications/index', {
      title: 'Notifications Center - ClubSphere',
      notifications: filteredNotifications,
      totalCount: allNotifications.length,
      unreadCount,
      activeFilter: filter,
      currentPage: 'notifications'
    });
  } catch (error) {
    console.error('Notifications Page Error:', error);
    req.flash('error_msg', 'Could not load notifications page.');
    res.redirect('/');
  }
});

/**
 * POST /notifications/:id/read
 * Standard form POST fallback to mark a single notification read
 */
router.post('/:id/read', async (req, res) => {
  try {
    const userId = req.session.user._id;
    await NotificationService.markAsRead(req.params.id, userId);
    const referer = req.header('Referer') || '/notifications';
    res.redirect(referer);
  } catch (error) {
    console.error('Mark Read Form Error:', error);
    res.redirect('/notifications');
  }
});

/**
 * POST /notifications/mark-all-read
 * Standard form POST fallback to mark all as read
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const role = req.session.user.role;
    await NotificationService.markAllAsRead(userId, role);
    req.flash('success_msg', 'All notifications marked as read.');
    res.redirect('/notifications');
  } catch (error) {
    console.error('Mark All Read Form Error:', error);
    res.redirect('/notifications');
  }
});

module.exports = router;
