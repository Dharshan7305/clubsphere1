const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Application = require('../models/Application');
const Membership = require('../models/Membership');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect all secretary routes
router.use(ensureAuthenticated, authorizeRoles('secretary', 'admin'));

// Helper to get secretary's club
async function getSecretaryClub(req) {
  if (req.session.user.role === 'admin') {
    // If admin is viewing secretary views, take first club or specific query
    const clubId = req.query.clubId || req.session.user.club?._id;
    if (clubId) return await Club.findById(clubId);
    return await Club.findOne();
  }
  return await Club.findOne({ 'secretary.user': req.session.user._id });
}

async function syncClubMembers(club) {
  const acceptedApplicants = await Application.distinct('student', {
    club: club._id,
    status: 'Accepted'
  });
  const approvedMemberships = await Membership.distinct('student', {
    club: club._id,
    status: 'Approved'
  });
  const memberIds = [...new Set([
    ...acceptedApplicants.map(id => id.toString()),
    ...approvedMemberships.map(id => id.toString())
  ])];

  if (memberIds.length > 0) {
    await Club.updateOne(
      { _id: club._id },
      { $addToSet: { members: { $each: memberIds } } }
    );
  }

  return Club.findById(club._id);
}

async function addMemberWithinLimit(club, studentId) {
  if (club.members.some(memberId => memberId.toString() === studentId.toString())) {
    return club;
  }

  const updatedClub = await Club.findOneAndUpdate(
    {
      _id: club._id,
      $expr: {
        $lt: [
          { $size: { $ifNull: ['$members', []] } },
          { $ifNull: ['$teamLimit', 50] }
        ]
      }
    },
    { $addToSet: { members: studentId } },
    { new: true }
  );

  if (updatedClub) return updatedClub;
  const currentClub = await Club.findById(club._id);
  return currentClub && currentClub.members.some(memberId => memberId.toString() === studentId.toString())
    ? currentClub
    : null;
}

// GET /secretary/dashboard - Secretary Dashboard Module
router.get('/dashboard', async (req, res) => {
  try {
    let club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to manage any club. Please contact Admin.');
      return res.redirect('/');
    }
    club = await syncClubMembers(club);

    const recruitments = await Recruitment.find({ club: club._id }).sort({ createdAt: -1 });
    const recruitmentIds = recruitments.map(r => r._id);

    const applications = await Application.find({ recruitment: { $in: recruitmentIds } })
      .populate('recruitment')
      .populate('student', 'name email rollNo department')
      .sort({ submittedAt: -1 });

    const events = await Event.find({ club: club._id }).sort({ eventDate: -1 });
    const coreMembers = await User.find({ role: 'core', club: club._id })
      .select('name email rollNo department year')
      .sort({ name: 1 });

    // Metrics
    const totalApplicants = applications.length;
    const pendingApplicants = applications.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length;
    const shortlistedApplicants = applications.filter(a => a.status === 'Shortlisted').length;
    const acceptedApplicants = club.members.length;
    const totalEventRegistrations = events.reduce((sum, e) => sum + e.participants.length, 0);

    res.render('secretary/dashboard', {
      title: `${club.name} - Secretary Dashboard`,
      club,
      recruitments,
      applications: applications.slice(0, 8),
      events: events.slice(0, 5),
      coreMembers,
      metrics: {
        totalApplicants,
        pendingApplicants,
        shortlistedApplicants,
        acceptedApplicants,
        totalEvents: events.length,
        totalEventRegistrations
      },
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Secretary Dashboard Error:', error);
    req.flash('error_msg', 'Could not load secretary dashboard.');
    res.redirect('/');
  }
});

// GET /secretary/club - Manage Club Profile
router.get('/club', async (req, res) => {
  try {
    let club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'No club assigned to manage.');
      return res.redirect('/secretary/dashboard');
    }
    club = await syncClubMembers(club);

    res.render('secretary/manage-club', {
      title: `Manage ${club.name} - Profile`,
      club,
      currentPage: 'club'
    });
  } catch (error) {
    console.error('Manage Club Error:', error);
    req.flash('error_msg', 'Error retrieving club profile.');
    res.redirect('/secretary/dashboard');
  }
});

// POST /secretary/club - Update Club Profile
router.post('/club', async (req, res) => {
  try {
    let club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'No club assigned to manage.');
      return res.redirect('/secretary/dashboard');
    }
    club = await syncClubMembers(club);

    const { tagline, description, objectives, contactEmail, instagram, linkedin, recruitmentStatus } = req.body;
    const teamLimit = Number(req.body.teamLimit);

    if (!Number.isInteger(teamLimit) || teamLimit < 1 || teamLimit > 10000) {
      req.flash('error_msg', 'The member limit must be a whole number between 1 and 10000.');
      return res.redirect('/secretary/club');
    }

    if (teamLimit < club.members.length) {
      req.flash('error_msg', `The member limit cannot be lower than the ${club.members.length} members already approved.`);
      return res.redirect('/secretary/club');
    }

    club.tagline = tagline || club.tagline;
    club.description = description || club.description;
    club.contactEmail = contactEmail || club.contactEmail;
    club.instagram = instagram || club.instagram;
    club.linkedin = linkedin || club.linkedin;
    club.recruitmentStatus = recruitmentStatus || club.recruitmentStatus;
    club.teamLimit = teamLimit;

    if (objectives) {
      club.objectives = objectives.split('\n').map(o => o.trim()).filter(o => o.length > 0);
    }

    await club.save();
    req.flash('success_msg', 'Club profile updated successfully!');
    res.redirect('/secretary/club');
  } catch (error) {
    console.error('Update Club Error:', error);
    req.flash('error_msg', 'Failed to update club profile: ' + error.message);
    res.redirect('/secretary/club');
  }
});

// GET /secretary/members - Review direct membership requests
router.get('/members', async (req, res) => {
  try {
    let club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    club = await syncClubMembers(club);
    const membershipRequests = await Membership.find({ club: club._id })
      .populate('student', 'name email rollNo department year')
      .sort({ createdAt: -1 });

    res.render('secretary/members', {
      title: `Membership Requests - ${club.name}`,
      club,
      membershipRequests,
      currentPage: 'members'
    });
  } catch (error) {
    console.error('Membership Requests Error:', error);
    req.flash('error_msg', 'Could not load membership requests.');
    res.redirect('/secretary/dashboard');
  }
});

// POST /secretary/members/:id/status - Approve or reject a membership request
router.post('/members/:id/status', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      req.flash('error_msg', 'Choose a valid membership decision.');
      return res.redirect('/secretary/members');
    }

    const membershipRequest = await Membership.findOne({
      _id: req.params.id,
      club: club._id,
      status: 'Pending'
    }).populate('student', 'name');

    if (!membershipRequest) {
      req.flash('error_msg', 'Pending membership request not found.');
      return res.redirect('/secretary/members');
    }
    if (!membershipRequest.student) {
      req.flash('error_msg', 'The student account for this request is no longer available.');
      return res.redirect('/secretary/members');
    }

    if (status === 'Approved') {
      const currentClub = await syncClubMembers(club);
      const updatedClub = await addMemberWithinLimit(currentClub, membershipRequest.student._id);
      if (!updatedClub) {
        req.flash('error_msg', `The club has reached its member limit of ${currentClub.teamLimit}. Increase the limit before approving more members.`);
        return res.redirect('/secretary/members');
      }
    }

    membershipRequest.status = status;
    membershipRequest.reviewedBy = req.session.user._id;
    membershipRequest.reviewedAt = new Date();
    await membershipRequest.save();

    await Notification.create({
      recipient: membershipRequest.student._id,
      club: club._id,
      title: `Membership Request ${status}: ${club.name}`,
      message: status === 'Approved'
        ? `Your request to join ${club.name} was approved. Welcome to the club!`
        : `Your request to join ${club.name} was not approved at this time.`,
      type: 'application',
      relatedLink: `/clubs/${club._id}`
    });

    req.flash('success_msg', `${membershipRequest.student.name}'s request was ${status.toLowerCase()}.`);
    res.redirect('/secretary/members');
  } catch (error) {
    console.error('Membership Decision Error:', error);
    req.flash('error_msg', 'Could not update the membership request.');
    res.redirect('/secretary/members');
  }
});

// GET /secretary/recruitments - Post & Manage Recruitment Drives
router.get('/recruitments', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    const recruitments = await Recruitment.find({ club: club._id })
      .populate('facultyApproval.reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.render('secretary/recruitments', {
      title: `Recruitments - ${club.name}`,
      club,
      recruitments,
      currentPage: 'recruitments'
    });
  } catch (error) {
    console.error('Recruitments Error:', error);
    req.flash('error_msg', 'Error loading recruitment drives.');
    res.redirect('/secretary/dashboard');
  }
});

// POST /secretary/recruitments - Create Recruitment Drive
router.post('/recruitments', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    const { title, academicYear, eligibility, deadline, instructions, rolesText } = req.body;

    // Parse roles (Format per line: Role Name | Vacancies | Requirements)
    let roles = [];
    if (rolesText) {
      const lines = rolesText.split('\n');
      lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts[0]) {
          roles.push({
            roleName: parts[0],
            vacancies: parseInt(parts[1], 10) || 5,
            requirements: parts[2] || 'Good teamwork & enthusiasm'
          });
        }
      });
    }

    if (roles.length === 0) {
      roles.push({ roleName: 'Core Member', vacancies: 5, requirements:
