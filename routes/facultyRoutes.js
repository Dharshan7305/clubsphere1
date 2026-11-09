const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Event = require('../models/Event');
const NotificationService = require('../services/notificationService');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect faculty routes (allow faculty and admin)
router.use(ensureAuthenticated, authorizeRoles('faculty', 'admin'));

// Helper to get faculty's club
async function getFacultyClub(req) {
  if (req.session.user.role === 'admin') {
    const clubId = req.query.clubId || req.session.user.club?._id;
    if (clubId) return await Club.findById(clubId);
    return await Club.findOne();
  }
  return await Club.findOne({
    $or: [
      { _id: req.session.user.club?._id },
      { 'facultyAdvisor.user': req.session.user._id },
      { 'facultyAdvisor.email': req.session.user.email }
    ]
  });
}

// GET /faculty/dashboard - Faculty Advisor Module
router.get('/dashboard', async (req, res) => {
  try {
    const club = await getFacultyClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned as Faculty Advisor to any club. Please contact Admin.');
      return res.redirect('/');
    }

    const pendingRecruitments = await Recruitment.find({
      club: club._id,
      status: 'Pending Approval'
    }).sort({ createdAt: -1 });

    const allRecruitments = await Recruitment.find({ club: club._id }).sort({ createdAt: -1 });

    // Events waiting for faculty approval
    const pendingEvents = await Event.find({
      club: club._id,
      approvalStatus: 'Pending Faculty'
    }).sort({ createdAt: -1 });

    const allEvents = await Event.find({ club: club._id }).sort({ eventDate: -1 });

    res.render('faculty/dashboard', {
      title: `Faculty Advisor Portal - ${club.name}`,
      club,
      pendingRecruitments,
      allRecruitments,
      pendingEvents,
      events: allEvents,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Faculty Dashboard Error:', error);
    req.flash('error_msg', 'Could not load faculty dashboard.');
    res.redirect('/');
  }
});

// GET /faculty/recruitments - View recruitment drives to review
router.get('/recruitments', async (req, res) => {
  try {
    const club = await getFacultyClub(req);
    const recruitments = await Recruitment.find({ club: club._id }).sort({ createdAt: -1 });

    res.render('faculty/recruitments', {
      title: `Recruitment Approvals - ${club.name}`,
      club,
      recruitments,
      currentPage: 'recruitments'
    });
  } catch (error) {
    console.error('Faculty recruitments error:', error);
    req.flash('error_msg', 'Could not load recruitments.');
    res.redirect('/faculty/dashboard');
  }
});

// POST /faculty/recruitments/:id/review - Approve or Reject recruitment drive
router.post('/recruitments/:id/review', async (req, res) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' or 'reject'
    const recruitment = await Recruitment.findById(req.params.id).populate('club');

    if (!recruitment) {
      req.flash('error_msg', 'Recruitment drive not found.');
      return res.redirect('/faculty/dashboard');
    }

    recruitment.facultyApproval = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      reviewedBy: req.session.user._id,
      remarks: remarks || (action === 'approve' ? 'Approved by Faculty Advisor.' : 'Needs revision.'),
      reviewedAt: new Date()
    };

    if (action === 'approve') {
      recruitment.status = 'Open';
      await Club.findByIdAndUpdate(recruitment.club._id, { recruitmentStatus: 'Open' });
    } else {
      recruitment.status = 'Draft';
    }

    await recruitment.save();

    // 1. Notify club secretary
    if (recruitment.club.secretary && recruitment.club.secretary.user) {
      await NotificationService.createNotification({
        recipient: recruitment.club.secretary.user,
        club: recruitment.club._id,
        title: `Recruitment ${action === 'approve' ? 'Approved' : 'Rejected'}: ${recruitment.title}`,
        message: `Faculty Advisor has ${action === 'approve' ? 'approved' : 'rejected'} the recruitment drive. Remarks: "${remarks || 'None'}".`,
        type: 'recruitment',
        relatedId: recruitment._id,
        relatedLink: '/secretary/recruitments'
      });
    }

    // 2. If approved, broadcast to all students
    if (action === 'approve') {
      await NotificationService.broadcastToStudents({
        club: recruitment.club._id,
        title: `Recruitment Open: ${recruitment.club.name}!`,
        message: `${recruitment.club.name} is now recruiting for "${recruitment.title}". Deadline: ${new Date(recruitment.deadline).toLocaleDateString()}. Apply now on ClubSphere!`,
        type: 'recruitment',
        relatedId: recruitment._id,
        relatedLink: `/student/recruitments/${recruitment._id}/apply`
      });
    }

    req.flash('success_msg', `Recruitment drive successfully ${action === 'approve' ? 'approved and opened for applications' : 'returned for revision'}!`);
    res.redirect('/faculty/dashboard');
  } catch (error) {
    console.error('Faculty Review Error:', error);
    req.flash('error_msg', 'Error processing approval.');
    res.redirect('/faculty/dashboard');
  }
});

// GET /faculty/events - View events for assigned club & pending proposals
router.get('/events', async (req, res) => {
  try {
    const club = await getFacultyClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to any club.');
      return res.redirect('/faculty/dashboard');
    }

    const events = await Event.find({ club: club._id }).sort({ createdAt: -1 });

    res.render('faculty/events', {
      title: `Event Proposals - ${club.name}`,
      club,
      events,
      currentPage: 'events'
    });
  } catch (error) {
    console.error('Faculty events error:', error);
    req.flash('error_msg', 'Could not load event proposals.');
    res.redirect('/faculty/dashboard');
  }
});

// POST /faculty/events/:id/review - Main Faculty Approves or Rejects Event Proposal
router.post('/events/:id/review', async (req, res) => {
  try {
    const { action, remarks } = req.body; // 'approve' or 'reject'
    const club = await getFacultyClub(req);
    const event = await Event.findOne({ _id: req.params.id, club: club._id }).populate('club');

    if (!event) {
      req.flash('error_msg', 'Event proposal not found or does not belong to your assigned club.');
      return res.redirect('/faculty/dashboard');
    }

    const facultyUser = req.session.user;
    const reviewNote = remarks || (action === 'approve' ? 'Endorsed and forwarded to Principal.' : 'Rejected by Main Faculty.');

    event.facultyApproval = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      remarks: reviewNote,
      reviewedBy: facultyUser._id,
      reviewedAt: new Date()
    };

    if (action === 'approve') {
      event.approvalStatus = 'Pending Principal';
      event.isPublished = false; // Remains unpublished until Principal approves!
      await event.save();

      // 1. Notify Secretary
      if (event.club.secretary && event.club.secretary.user) {
        await NotificationService.createNotification({
          recipient: event.club.secretary.user,
          club: event.club._id,
          title: `Event Proposal Approved by Faculty: ${event.title}`,
          message: `Faculty Advisor ${facultyUser.name} endorsed "${event.title}". It has now been forwarded to the Principal for final approval.`,
          type: 'approval',
          relatedId: event._id,
          relatedLink: '/secretary/events'
        });
      }

      // 2. Notify Principal (Role 4 / Principal portal)
      await NotificationService.notifyRole('principal', {
        club: event.club._id,
        title: `Event Awaiting Principal Approval: ${event.title}`,
        message: `Main Faculty ${facultyUser.name} has endorsed "${event.title}" (${event.club.name}). Pending your executive review.`,
        type: 'approval',
        relatedId: event._id,
        relatedLink: '/principal/events'
      });

      req.flash('success_msg', `Event "${event.title}" endorsed and forwarded to Principal for final approval!`);
    } else {
      // Reject
      event.approvalStatus = 'Rejected by Faculty';
      event.isPublished = false;
      await event.save();

      // Notify Secretary
      if (event.club.secretary && event.club.secretary.user) {
        await NotificationService.createNotification({
          recipient: event.club.secretary.user,
          club: event.club._id,
          title: `Event Proposal Rejected by Faculty: ${event.title}`,
          message: `Faculty Advisor ${facultyUser.name} rejected "${event.title}". Remarks: "${reviewNote}".`,
          type: 'approval',
          relatedId: event._id,
          relatedLink: '/secretary/events'
        });
      }

      req.flash('error_msg', `Event proposal "${event.title}" has been rejected.`);
    }

    res.redirect('/faculty/dashboard');
  } catch (error) {
    console.error('Faculty Event Review Error:', error);
    req.flash('error_msg', 'Failed to process event review: ' + error.message);
    res.redirect('/faculty/dashboard');
  }
});

module.exports = router;
