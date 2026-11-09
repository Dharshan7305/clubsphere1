const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Club = require('../models/Club');
const NotificationService = require('../services/notificationService');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect principal routes (allow principal and admin)
router.use(ensureAuthenticated, authorizeRoles('principal', 'admin'));

// GET /principal/dashboard & /principal/events - View Event Proposals Pending Principal Approval
router.get(['/dashboard', '/events'], async (req, res) => {
  try {
    const pendingEvents = await Event.find({
      approvalStatus: 'Pending Principal'
    })
      .populate('club', 'name code category logo facultyAdvisor secretary')
      .populate('facultyApproval.reviewedBy', 'name email department')
      .sort({ createdAt: -1 });

    const recentDecisions = await Event.find({
      approvalStatus: { $in: ['Approved', 'Rejected by Principal', 'Changes Requested'] }
    })
      .populate('club', 'name code category logo')
      .sort({ updatedAt: -1 })
      .limit(10);

    const totalPending = pendingEvents.length;
    const totalApproved = await Event.countDocuments({ approvalStatus: 'Approved' });
    const totalRejected = await Event.countDocuments({
      approvalStatus: { $in: ['Rejected by Principal', 'Rejected by Faculty'] }
    });

    res.render('principal/dashboard', {
      title: 'Principal Approval Portal - ClubSphere',
      pendingEvents,
      recentDecisions,
      stats: { totalPending, totalApproved, totalRejected },
      currentPage: 'principal'
    });
  } catch (error) {
    console.error('Principal Dashboard Error:', error);
    req.flash('error_msg', 'Could not load Principal dashboard.');
    res.redirect('/');
  }
});

// POST /principal/events/:id/review - Approve, Reject, or Request Changes
router.post('/events/:id/review', async (req, res) => {
  try {
    const { action, remarks } = req.body; // 'approve', 'reject', 'request_changes'
    const event = await Event.findById(req.params.id).populate('club');

    if (!event) {
      req.flash('error_msg', 'Event not found.');
      return res.redirect('/principal/events');
    }

    const principalUser = req.session.user;
    const reviewerId = principalUser._id;
    const reviewNote = remarks || (action === 'approve' ? 'Approved by Principal.' : 'Returned with remarks.');

    event.principalApproval = {
      status: action === 'approve' ? 'Approved' : (action === 'request_changes' ? 'Changes Requested' : 'Rejected'),
      remarks: reviewNote,
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    };

    if (action === 'approve') {
      event.approvalStatus = 'Approved';
      event.isPublished = true;
      event.status = 'Upcoming';
      await event.save();

      // 1. Notify Club Secretary (Final Decision Notification)
      if (event.club.secretary && event.club.secretary.user) {
        await NotificationService.createNotification({
          recipient: event.club.secretary.user,
          club: event.club._id,
          title: `Event Approved by Principal: ${event.title}`,
          message: `Principal has officially approved your event proposal "${event.title}". It is now published live on Campus Events!`,
          type: 'approval',
          relatedId: event._id,
          relatedLink: `/events/${event._id}`
        });
      }

      // 2. Notify Main Faculty
      if (event.facultyApproval && event.facultyApproval.reviewedBy) {
        await NotificationService.createNotification({
          recipient: event.facultyApproval.reviewedBy,
          club: event.club._id,
          title: `Event Proposal Approved by Principal: ${event.title}`,
          message: `Principal has approved the event "${event.title}" for ${event.club.name}.`,
          type: 'approval',
          relatedId: event._id,
          relatedLink: `/events/${event._id}`
        });
      }

      // 3. Broadcast to ALL Students (Published event)
      await NotificationService.broadcastToStudents({
        club: event.club._id,
        title: `New Campus Event Announced: ${event.title}`,
        message: `${event.club.name} is hosting "${event.title}" on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue}. Registrations now open!`,
        type: 'event',
        relatedId: event._id,
        relatedLink: `/events/${event._id}`
      });

      req.flash('success_msg', `Event "${event.title}" approved and published to all students!`);
    } else if (action === 'request_changes') {
      event.approvalStatus = 'Changes Requested';
      event.isPublished = false;
      await event.save();

      // Notify Club Secretary
      if (event.club.secretary && event.club.secretary.user) {
        await NotificationService.createNotification({
          recipient: event.club.secretary.user,
          club: event.club._id,
          title: `Principal Requested Changes: ${event.title}`,
          message: `Principal has requested revisions for "${event.title}". Remarks: "${reviewNote}". Please update and resubmit.`,
          type: 'approval',
          relatedId: event._id,
          relatedLink: '/secretary/events'
        });
      }

      req.flash('success_msg', `Revisions requested from ${event.club.name} Secretary.`);
    } else {
      // Reject
      event.approvalStatus = 'Rejected by Principal';
      event.isPublished = false;
      await event.save();

      // Notify Club Secretary
      if (event.club.secretary && event.club.secretary.user) {
        await NotificationService.createNotification({
          recipient: event.club.secretary.user,
          club: event.club._id,
          title: `Event Proposal Rejected by Principal: ${event.title}`,
          message: `Principal has rejected the event proposal "${event.title}". Remarks: "${reviewNote}".`,
          type: 'approval',
          relatedId: event._id,
          relatedLink: '/secretary/events'
        });
      }

      req.flash('error_msg', `Event proposal "${event.title}" has been rejected.`);
    }

    res.redirect('/principal/events');
  } catch (error) {
    console.error('Principal Event Review Error:', error);
    req.flash('error_msg', 'Failed to process event review: ' + error.message);
    res.redirect('/principal/events');
  }
});

module.exports = router;
