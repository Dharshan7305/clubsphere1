const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Event = require('../models/Event');
const Application = require('../models/Application');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');
const { clubs30, categoryFilters } = require('../config/clubsData');

const normalize = str => (str || '').toLowerCase().trim();

// GET /clubs - Explore Clubs Directory
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    // Fetch existing active clubs and genuine active recruitment drives
    let dbClubs = [];
    let activeClubIds = new Set();
    try {
      dbClubs = await Club.find({ isActive: true }).sort({ name: 1 });
      const activeRecruitments = await Recruitment.find({ status: 'Open', deadline: { $gte: new Date() } }).select('club');
      activeRecruitments.forEach(r => {
        if (r.club) activeClubIds.add(r.club.toString());
      });
    } catch (e) {
      dbClubs = [];
    }

    // Merge DB clubs with the 30 master clubs to ensure all 30 clubs always exist
    const mergedClubs = clubs30.map((masterClub) => {
      const existing = dbClubs.find(dbC => normalize(dbC.name) === normalize(masterClub.name));
      if (existing) {
        let recruitmentStatus = null;
        if (activeClubIds.has(existing._id.toString())) {
          recruitmentStatus = 'Open';
        } else if (existing.recruitmentStatus === 'Coming Soon' || existing.recruitmentStatus === 'Recruiting Soon') {
          recruitmentStatus = 'Recruiting Soon';
        } else {
          recruitmentStatus = 'Closed';
        }

        return {
          _id: existing._id,
          name: existing.name,
          code: existing.code || masterClub.code,
          category: masterClub.category,
          tagline: existing.tagline || masterClub.tagline,
          description: existing.description || masterClub.description,
          objectives: (existing.objectives && existing.objectives.length > 0) ? existing.objectives : masterClub.objectives,
          facultyAdvisor: existing.facultyAdvisor || masterClub.facultyAdvisor,
          facultyAdvisors: masterClub.facultyAdvisors,
          banner: masterClub.banner,
          recruitmentStatus: recruitmentStatus,
          membersCount: (existing.members && existing.members.length) || 0,
          foundedYear: existing.foundedYear || masterClub.foundedYear
        };
      }
      return {
        _id: masterClub.code.toLowerCase(),
        ...masterClub,
        recruitmentStatus: (masterClub.recruitmentStatus === 'Coming Soon' || masterClub.recruitmentStatus === 'Recruiting Soon')
          ? 'Recruiting Soon'
          : 'Closed',
        membersCount: 0
      };
    });

    // Check saved clubs if student is logged in
    let savedClubIds = [];
    if (req.session.user) {
      try {
        const user = await User.findById(req.session.user._id).select('savedClubs');
        if (user && user.savedClubs) {
          savedClubIds = user.savedClubs.map(id => id.toString());
        }
      } catch (e) {}
    }

    // Filter by category if requested
    let filteredClubs = mergedClubs;
    if (category && category !== 'All Clubs' && category !== 'All') {
      filteredClubs = filteredClubs.filter(c => normalize(c.category) === normalize(category));
    }

    // Filter by search query if requested
    if (search && search.trim() !== '') {
      const q = normalize(search);
      filteredClubs = filteredClubs.filter(c =>
        normalize(c.name).includes(q) ||
        normalize(c.code).includes(q) ||
        normalize(c.category).includes(q) ||
        normalize(c.description).includes(q) ||
        (c.tagline && normalize(c.tagline).includes(q))
      );
    }

    res.render('clubs/index', {
      title: 'Explore Clubs | ClubSphere',
      clubs: filteredClubs,
      allClubs: mergedClubs,
      categories: categoryFilters,
      selectedCategory: category || 'All Clubs',
      searchQuery: search || '',
      savedClubIds,
      totalClubsCount: mergedClubs.length,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    req.flash('error_msg', 'Could not load clubs. Please try again.');
    res.redirect('/');
  }
});

// GET /clubs/:id - Club Details Module
router.get('/:id', async (req, res) => {
  try {
    let club = null;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      club = await Club.findById(req.params.id)
        .populate('facultyAdvisor.user', 'name email')
        .populate('secretary.user', 'name rollNo email')
        .populate('coreTeam.user', 'name rollNo email');
    }

    if (!club) {
      // Find in master list by code, slug, or name
      const paramSlug = req.params.id.toLowerCase().replace(/[-_]/g, ' ');
      const masterMatch = clubs30.find(c => 
        c.code.toLowerCase() === req.params.id.toLowerCase() ||
        c.name.toLowerCase() === paramSlug ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === req.params.id.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      if (masterMatch) {
        // Check if stored in MongoDB by name
        club = await Club.findOne({ name: masterMatch.name });
        if (!club) {
          club = {
            _id: masterMatch.code.toLowerCase(),
            name: masterMatch.name,
            code: masterMatch.code,
            category: masterMatch.category,
            tagline: masterMatch.tagline,
            description: masterMatch.description,
            objectives: masterMatch.objectives || [],
            facultyAdvisor: masterMatch.facultyAdvisor,
            facultyAdvisors: masterMatch.facultyAdvisors || [],
            recruitmentStatus: masterMatch.recruitmentStatus || null,
            banner: masterMatch.banner,
            members: [],
            teamLimit: 100,
            foundedYear: masterMatch.foundedYear || 2015,
            contactEmail: masterMatch.code.toLowerCase() + '@college.ac.in'
          };
        }
      }
    }

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/clubs');
    }

    // Fetch active recruitments & upcoming events
    let recruitments = [];
    let upcomingEvents = [];
    if (mongoose.Types.ObjectId.isValid(club._id)) {
      recruitments = await Recruitment.find({
        club: club._id,
        status: 'Open',
        deadline: { $gte: new Date() }
      }).sort({ deadline: 1 });

      upcomingEvents = await Event.find({
        club: club._id,
        status: { $in: ['Upcoming', 'Ongoing'] }
      }).sort({ eventDate: 1 });
    }

    // Check saved & membership status
    let isSaved = false;
    let isMember = false;
    let membershipRequest = null;
    if (req.session.user && mongoose.Types.ObjectId.isValid(club._id)) {
      const user = await User.findById(req.session.user._id).select('savedClubs');
      if (user && user.savedClubs) {
        isSaved = user.savedClubs.some(id => id.toString() === club._id.toString());
      }
      if (['student', 'core'].includes(req.session.user.role)) {
        isMember = (club.members && club.members.some(id => id.toString() === req.session.user._id.toString()))
          || Boolean(await Application.exists({
            club: club._id,
            student: req.session.user._id,
            status: 'Accepted'
          }));
        membershipRequest = await Membership.findOne({
          club: club._id,
          student: req.session.user._id
        });
      }
    }

    let existingApplication = null;
    if (req.session.user && mongoose.Types.ObjectId.isValid(club._id)) {
      try {
        existingApplication = await Application.findOne({
          club: club._id,
          student: req.session.user._id
        }).sort({ submittedAt: -1 });
      } catch (e) {}
    }

    // Only mark recruitment open if there is an active drive
    const isRecruitmentOpen = recruitments.length > 0;
    if (isRecruitmentOpen) {
      club.recruitmentStatus = 'Open';
    } else if (club.recruitmentStatus === 'Coming Soon' || club.recruitmentStatus === 'Recruiting Soon') {
      club.recruitmentStatus = 'Recruiting Soon';
    } else {
      club.recruitmentStatus = 'Closed';
    }

    res.render('clubs/show', {
      title: `${club.name} - Club Details | ClubSphere`,
      club,
      recruitments,
      isRecruitmentOpen,
      upcomingEvents,
      isMember,
      membershipRequest,
      isSaved,
      existingApplication,
      user: req.session.user || null,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Error fetching club details:', error);
    req.flash('error_msg', 'Could not open club details.');
    res.redirect('/clubs');
  }
});

// POST /clubs/:id/join - Request club membership
router.post('/:id/join', ensureAuthenticated, authorizeRoles('student', 'core'), async (req, res) => {
  try {
    let club = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      club = await Club.findById(req.params.id);
    } else {
      const masterClub = clubs30.find(c => c.code.toLowerCase() === req.params.id.toLowerCase());
      if (masterClub) {
        club = await Club.findOne({ code: masterClub.code });
      }
    }

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/clubs');
    }

    const activeRecruitment = await Recruitment.findOne({
      club: club._id,
      status: 'Open',
      deadline: { $gte: new Date() }
    });
    if (!activeRecruitment) {
      req.flash('error_msg', 'Recruitment for this club is currently closed.');
      return res.redirect(`/clubs/${club._id}`);
    }

    const studentId = req.session.user._id;

    // Check if already a member or pending
    if (club.members.some(memberId => memberId.toString() === studentId.toString())) {
      req.flash('error_msg', 'You are already an active member of this club.');
      return res.redirect(`/clubs/${club._id}`);
    }

    const existingReq = await Membership.findOne({
      club: club._id,
      student: studentId
    });

    if (existingReq && existingReq.status === 'Pending') {
      req.flash('error_msg', 'You already have a pending membership request for this club.');
      return res.redirect(`/clubs/${club._id}`);
    }

    if (existingReq && existingReq.status === 'Rejected') {
      existingReq.status = 'Pending';
      existingReq.message = req.body.reason || 'Re-applied for club membership';
      existingReq.createdAt = new Date();
      await existingReq.save();
    } else {
      await Membership.create({
        club: club._id,
        student: studentId,
        message: req.body.reason || 'General student membership request',
        status: 'Pending'
      });
    }

    // Notify club secretary if user assigned
    if (club.secretary && club.secretary.user) {
      await Notification.create({
        recipient: club.secretary.user,
        title: 'New Club Membership Request',
        message: `${req.session.user.name} (${req.session.user.rollNo || req.session.user.email}) requested to join ${club.name}.`,
        type: 'application',
        relatedLink: '/secretary/members'
      });
    }

    req.flash('success_msg', `Membership request sent to ${club.name} secretary for review.`);
    res.redirect(`/clubs/${club._id}`);
  } catch (error) {
    console.error('Error requesting club membership:', error);
    req.flash('error_msg', 'Failed to submit request. Please try again.');
    res.redirect('/clubs');
  }
});

// POST /clubs/:id/save - Toggle Save / Bookmark Club
router.post('/:id/save', ensureAuthenticated, authorizeRoles('student', 'core'), async (req, res) => {
  const referer = req.header('Referer') || '/clubs';

  try {
    let clubId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      const masterClub = clubs30.find(club => club.code.toLowerCase() === clubId.toLowerCase());
      if (!masterClub) {
        req.flash('error_msg', 'This club is not available to save yet.');
        return res.redirect(referer);
      }

      const club = await Club.findOneAndUpdate(
        { code: masterClub.code },
        {
          $setOnInsert: {
            name: masterClub.name,
            code: masterClub.code,
            category: masterClub.category,
            tagline: masterClub.tagline,
            description: masterClub.description,
            objectives: masterClub.objectives || [],
            facultyAdvisor: masterClub.facultyAdvisor,
            facultyAdvisors: masterClub.facultyAdvisors || [],
            banner: masterClub.banner,
            foundedYear: masterClub.foundedYear
          }
        },
        { new: true, upsert: true, runValidators: true }
      );
      clubId = club._id.toString();
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash('error_msg', 'Could not find your account. Please log in again.');
      return res.redirect('/auth/login');
    }

    if (!await Club.exists({ _id: clubId })) {
      req.flash('error_msg', 'This club is not available to save yet.');
      return res.redirect(referer);
    }

    const alreadySaved = user.savedClubs.some(id => id.toString() === clubId);

    if (alreadySaved) {
      user.savedClubs = user.savedClubs.filter(id => id.toString() !== clubId.toString());
      await user.save();
      req.flash('success_msg', 'Club removed from your saved list.');
    } else {
      user.savedClubs.push(clubId);
      await user.save();
      req.flash('success_msg', 'Club saved! You can view it under your student dashboard.');
    }

    res.redirect(referer);
  } catch (error) {
    console.error('Error saving club:', error);
    req.flash('error_msg', 'Could not update saved status.');
    res.redirect('/clubs');
  }
});


// POST /clubs/:id/apply - Student Application Submission
router.post('/:id/apply', async (req, res) => {
  // 1. Check whether student is logged in
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to submit your club application.');
    return res.redirect('/auth/login?returnTo=/clubs/' + req.params.id);
  }

  if (!['student', 'core'].includes(req.session.user.role)) {
    req.flash('error_msg', 'Only student accounts can apply to join a club.');
    return res.redirect('/clubs/' + req.params.id);
  }

  try {
    const studentUser = req.session.user;
    const { studentName, rollNo, email, whyJoin, skills, department, year, phone } = req.body;

    // Resolve club
    let club = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      club = await Club.findById(req.params.id);
    }
    if (!club) {
      const paramSlug = req.params.id.toLowerCase().replace(/[-_]/g, ' ');
      const masterMatch = clubs30.find(c => 
        c.code.toLowerCase() === req.params.id.toLowerCase() ||
        c.name.toLowerCase() === paramSlug ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === req.params.id.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (masterMatch) {
        club = await Club.findOne({ name: masterMatch.name });
        if (!club) {
          try {
            club = await Club.create({
              name: masterMatch.name,
              code: masterMatch.code,
              category: masterMatch.category,
              tagline: masterMatch.tagline,
              description: masterMatch.description,
              objectives: masterMatch.objectives,
              facultyAdvisor: masterMatch.facultyAdvisor,
              facultyAdvisors: masterMatch.facultyAdvisors,
              banner: masterMatch.banner,
              foundedYear: masterMatch.foundedYear,
              contactEmail: masterMatch.code.toLowerCase() + '@college.ac.in',
              isActive: true
            });
          } catch (e) {}
        }
      }
    }

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/clubs');
    }

    const activeRecruitment = await Recruitment.findOne({
      club: club._id,
      status: 'Open',
      deadline: { $gte: new Date() }
    });

    if (!activeRecruitment) {
      req.flash('error_msg', 'Recruitment for this club is currently closed.');
      return res.redirect('/clubs/' + req.params.id);
    }

    // Validate required fields after confirming recruitment is open.
    if (!studentName || !rollNo || !email || !whyJoin || !whyJoin.trim()) {
      req.flash('error_msg', 'Please fill in all required fields (Name, Roll Number, Email, and Reason to Join).');
      return res.redirect('/clubs/' + req.params.id);
    }

    // Check if student is already an active member
    if (club.members && club.members.some(m => m.toString() === studentUser._id.toString())) {
      req.flash('error_msg', 'You are already an active member of ' + club.name + '.');
      return res.redirect('/clubs/' + req.params.id);
    }

    // Check duplicate applications
    const existingMembership = await Membership.findOne({
      club: club._id,
      student: studentUser._id
    });
    if (existingMembership && existingMembership.status === 'Pending') {
      req.flash('error_msg', 'You already have an application under review for ' + club.name + '.');
      return res.redirect('/clubs/' + req.params.id);
    }

    const existingApp = await Application.findOne({
      recruitment: activeRecruitment._id,
      student: studentUser._id
    });
    if (existingApp) {
      req.flash('error_msg', 'You have already submitted an application for the active recruitment drive in ' + club.name + '.');
      return res.redirect('/clubs/' + req.params.id);
    }

    await Application.create({
      recruitment: activeRecruitment._id,
      club: club._id,
      student: studentUser._id,
      appliedRole: (activeRecruitment.roles && activeRecruitment.roles[0] && activeRecruitment.roles[0].roleName) || 'Club Member',
      studentName: studentName.trim(),
      rollNo: rollNo.trim(),
      department: department || studentUser.department || 'General',
      year: year ? parseInt(year) : (studentUser.year || 1),
      email: email.trim(),
      phone: (phone && phone.trim()) || (studentUser && studentUser.phone) || 'Not provided',
      skills: skills ? skills.trim() : 'General member',
      whyJoin: whyJoin.trim(),
      status: 'Submitted',
      submittedAt: new Date()
    });

    // Create or update Membership record
    if (existingMembership) {
      existingMembership.status = 'Pending';
      existingMembership.message = whyJoin.trim();
      existingMembership.createdAt = new Date();
      await existingMembership.save();
    } else {
      await Membership.create({
        club: club._id,
        student: studentUser._id,
        message: whyJoin.trim(),
        status: 'Pending'
      });
    }

    // 8. Notify student & club secretary
    try {
      // Notify student
      await NotificationService.createNotification({
        recipient: studentUser._id,
        club: club._id,
        title: `Application Submitted: ${club.name}`,
        message: `Your application to join ${club.name} was successfully submitted and is under committee review.`,
        type: 'application',
        relatedId: club._id,
        relatedLink: '/clubs/' + (club._id || club.code.toLowerCase())
      });

      // Notify secretary
      if (club.secretary && club.secretary.user) {
        await NotificationService.createNotification({
          recipient: club.secretary.user,
          club: club._id,
          title: 'New Membership Application: ' + club.name,
          message: `${studentName} (${rollNo}) submitted an application to join ${club.name}.`,
          type: 'application',
          relatedId: club._id,
          relatedLink: '/secretary/applications'
        });
      }
    } catch (e) {
      console.error('Notification error on club apply:', e);
    }

    req.flash('success_msg', `Your application to join ${club.name} has been submitted successfully! The club committee will review your request.`);
    res.redirect('/clubs/' + req.params.id);
  } catch (error) {
    console.error('Error submitting club application:', error);
    req.flash('error_msg', 'Failed to submit application. Please try again.');
    res.redirect('/clubs/' + req.params.id);
  }
});

module.exports = router;
