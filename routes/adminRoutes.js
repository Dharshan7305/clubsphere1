const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const Recruitment = require('../models/Recruitment');
const Application = require('../models/Application');
const Membership = require('../models/Membership');
const Event = require('../models/Event');
const NotificationService = require('../services/notificationService');
const { findOtherCoreClub } = require('../services/coreMembershipService');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect all admin routes
router.use(ensureAuthenticated, authorizeRoles('admin'));

// GET /admin/dashboard - Admin Dashboard Module
router.get('/dashboard', async (req, res) => {
  try {
    const totalClubs = await Club.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRecruitments = await Recruitment.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Category breakdown
    const categoryStats = await Club.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent clubs & recruitments
    const recentClubs = await Club.find().sort({ createdAt: -1 }).limit(5);
    const recentApplications = await Application.find()
      .populate('club', 'name code')
      .populate('student', 'name rollNo')
      .sort({ submittedAt: -1 })
      .limit(6);

    res.render('admin/dashboard', {
      title: 'Administrator Control Center - ClubSphere',
      stats: {
        totalClubs,
        totalUsers,
        totalStudents,
        totalRecruitments,
        totalApplications,
        totalEvents
      },
      categoryStats,
      recentClubs,
      recentApplications,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    req.flash('error_msg', 'Could not load admin dashboard.');
    res.redirect('/');
  }
});

// GET /admin/clubs - Manage all clubs
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    const facultyUsers = await User.find({ role: 'faculty' }).select('name email');
    const secretaryUsers = await User.find({ role: 'secretary' }).select('name email rollNo');

    res.render('admin/clubs', {
      title: 'Manage Clubs - Admin | ClubSphere',
      clubs,
      facultyUsers,
      secretaryUsers,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Admin Clubs Error:', error);
    req.flash('error_msg', 'Could not fetch clubs list.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/club-people - Browse club rosters
router.get('/club-people', async (req, res) => {
  try {
    const clubs = await Club.find()
      .select('name code category facultyAdvisor.name secretary.name isActive')
      .sort({ name: 1 })
      .lean();

    res.render('admin/club-people-index', {
      title: 'Club People - Admin | ClubSphere',
      clubs,
      currentPage: 'clubPeople'
    });
  } catch (error) {
    console.error('Admin Club People Directory Error:', error);
    req.flash('error_msg', 'Could not load the club directory.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/clubs/:id/people - View a club's members and leadership
router.get('/clubs/:id/people', async (req, res) => {
  try {
    const [club, clubs] = await Promise.all([
      Club.findById(req.params.id),
      Club.find().select('name code').sort({ name: 1 }).lean()
    ]);

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/admin/club-people');
    }

    const [acceptedMemberIds, approvedMemberIds, legacyCoreMembers] = await Promise.all([
      Application.distinct('student', { club: club._id, status: 'Accepted' }),
      Membership.distinct('student', { club: club._id, status: 'Approved' }),
      User.find({ role: 'core', club: club._id })
        .select('_id')
        .lean()
    ]);

    const memberIds = new Set([
      ...(club.members || []).map(id => id.toString()),
      ...acceptedMemberIds.map(id => id.toString()),
      ...approvedMemberIds.map(id => id.toString())
    ]);
    const coreEntriesByUser = new Map();
    (club.coreTeam || []).forEach(entry => {
      if (entry.user) coreEntriesByUser.set(entry.user.toString(), entry);
    });
    const coreMemberIds = new Set([
      ...coreEntriesByUser.keys(),
      ...legacyCoreMembers.map(member => member._id.toString())
    ]);
    const clubStudentIds = new Set([...memberIds, ...coreMemberIds]);
    const rosterUsers = await User.find({ _id: { $in: [...clubStudentIds] } })
      .select('name email rollNo department year')
      .lean();
    const usersById = new Map(rosterUsers.map(user => [user._id.toString(), user]));

    const members = [...clubStudentIds]
      .map(id => ({
        user: usersById.get(id) || null,
        role: coreMemberIds.has(id) ? 'Core Member' : 'Member'
      }))
      .filter(member => member.user)
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
    const coreMembers = [...coreMemberIds]
      .map(id => ({
        user: usersById.get(id) || null,
        entry: coreEntriesByUser.get(id) || null
      }))
      .filter(member => member.user || member.entry);
    (club.coreTeam || []).forEach(entry => {
      if (!entry.user) coreMembers.push({ user: null, entry });
    });
    coreMembers.sort((a, b) => {
      const nameA = (a.user && a.user.name) || (a.entry && a.entry.name) || '';
      const nameB = (b.user && b.user.name) || (b.entry && b.entry.name) || '';
      return nameA.localeCompare(nameB);
    });

    const [facultyAdvisorAccount, secretaryAccount] = await Promise.all([
      User.findById(club.facultyAdvisor && club.facultyAdvisor.user)
        .select('name email department')
        .lean(),
      User.findById(club.secretary && club.secretary.user)
        .select('name email rollNo department')
        .lean()
    ]);
    const clubIndex = clubs.findIndex(item => item._id.toString() === club._id.toString());

    res.render('admin/club-people', {
      title: `${club.name} People - Admin | ClubSphere`,
      club,
      clubs,
      members,
      coreMembers,
      facultyAdvisorAccount,
      secretaryAccount,
      previousClub: clubIndex > 0 ? clubs[clubIndex - 1] : null,
      nextClub: clubIndex >= 0 && clubIndex < clubs.length - 1 ? clubs[clubIndex + 1] : null,
      currentPage: 'clubPeople'
    });
  } catch (error) {
    console.error('Admin Club People Error:', error);
    req.flash('error_msg', 'Could not load this club roster.');
    res.redirect('/admin/club-people');
  }
});

// POST /admin/clubs/add - Add New Club
router.post('/clubs/add', async (req, res) => {
  try {
    const { name, code, category, tagline, description, objectives, contactEmail, facultyName, facultyEmail, secretaryName, secretaryEmail } = req.body;

    const existing = await Club.findOne({ $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }] });
    if (existing) {
      req.flash('error_msg', 'A club with this name or code already exists.');
      return res.redirect('/admin/clubs');
    }

    const objList = objectives ? objectives.split('\n').map(o => o.trim()).filter(o => o.length > 0) : [];

    const club = new Club({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      category: category || 'Technical',
      tagline: tagline || 'College Student Club',
      description: description || 'Club dedicated to student innovation and skill enhancement at ClubSphere.',
      objectives: objList,
      contactEmail: contactEmail || 'club@college.ac.in',
      facultyAdvisor: {
        name: facultyName || 'Dr. Faculty Advisor',
        email: facultyEmail || 'faculty@college.ac.in'
      },
      secretary: {
        name: secretaryName || 'Student Secretary',
        email: secretaryEmail || 'secretary@college.ac.in'
      }
    });

    await club.save();
    req.flash('success_msg', `Club "${club.name}" created successfully!`);
    res.redirect('/admin/clubs');
  } catch (error) {
    console.error('Add Club Error:', error);
    req.flash('error_msg', 'Failed to add club: ' + error.message);
    res.redirect('/admin/clubs');
  }
});

// POST /admin/clubs/:id/edit - Edit Club
router.post('/clubs/:id/edit', async (req, res) => {
  try {
    const { name, category, tagline, description, contactEmail, recruitmentStatus, isActive } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/admin/clubs');
    }

    club.name = name ? name.trim() : club.name;
    club.category = category || club.category;
    club.tagline = tagline || club.tagline;
    club.description = description || club.description;
    club.contactEmail = contactEmail || club.contactEmail;
    club.recruitmentStatus = recruitmentStatus || club.recruitmentStatus;
    club.isActive = isActive === 'true' || isActive === true;

    await club.save();
    req.flash('success_msg', `Club "${club.name}" updated successfully!`);
    res.redirect('/admin/clubs');
  } catch (error) {
    console.error('Edit Club Error:', error);
    req.flash('error_msg', 'Failed to update club: ' + error.message);
    res.redirect('/admin/clubs');
  }
});

// POST /admin/clubs/:id/delete - Delete Club
router.post('/clubs/:id/delete', async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    req.flash('success_msg', `Club "${club.name}" deleted successfully.`);
    res.redirect('/admin/clubs');
  } catch (error) {
    console.error('Delete Club Error:', error);
    req.flash('error_msg', 'Failed to delete club.');
    res.redirect('/admin/clubs');
  }
});

// GET /admin/users - Manage Users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const userRoles = ['student', 'secretary', 'core', 'faculty'];
    const selectedRole = userRoles.includes(role) ? role : 'All';
    const query = { role: { $ne: 'admin' } };
    if (selectedRole !== 'All') query.role = selectedRole;

    const users = await User.find(query).populate('club', 'name code').sort({ name: 1 });
    const clubs = await Club.find().select('name code').lean();
    const userIds = users.map(user => user._id);
    const [clubRosterSources, approvedMemberships, acceptedApplications] = await Promise.all([
      Club.find({
        $or: [
          { members: { $in: userIds } },
          { 'coreTeam.user': { $in: userIds } }
        ]
      }).select('members coreTeam.user').lean(),
      Membership.find({ student: { $in: userIds }, status: 'Approved' })
        .select('student club')
        .lean(),
      Application.find({ student: { $in: userIds }, status: 'Accepted' })
        .select('student club')
        .lean()
    ]);

    const clubIdsByUser = new Map(users.map(user => [
      user._id.toString(),
      new Set(user.club ? [user.club._id.toString()] : [])
    ]));
    const addUserClub = (userId, clubId) => {
      const userClubIds = clubIdsByUser.get(userId.toString());
      if (userClubIds) userClubIds.add(clubId.toString());
    };

    clubRosterSources.forEach(club => {
      (club.members || []).forEach(userId => addUserClub(userId, club._id));
      (club.coreTeam || []).forEach(member => {
        if (member.user) addUserClub(member.user, club._id);
      });
    });
    approvedMemberships.forEach(membership => addUserClub(membership.student, membership.club));
    acceptedApplications.forEach(application => addUserClub(application.student, application.club));

    const clubsById = new Map(clubs.map(club => [club._id.toString(), club]));
    const usersWithClubMemberships = users.map(user => ({
      ...user.toObject(),
      clubMemberships: [...clubIdsByUser.get(user._id.toString())]
        .map(clubId => clubsById.get(clubId))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name))
    }));

    res.render('admin/users', {
      title: 'Manage Users - Admin | ClubSphere',
      users: usersWithClubMemberships,
      clubs,
      selectedRole,
      currentPage: 'users'
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    req.flash('error_msg', 'Could not load users list.');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/users/:id/role - Update User Role & Club Assignment
router.post('/users/:id/role', async (req, res) => {
  try {
    const { role, clubId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('/admin/users');
    }

    if (!['student', 'secretary', 'core', 'faculty'].includes(role)) {
      req.flash('error_msg', 'Choose a valid user role.');
      return res.redirect('/admin/users');
    }

    let assignedClub = null;
    if (role === 'student' && clubId) {
      assignedClub = await Club.findById(clubId);
      if (!assignedClub) {
        req.flash('error_msg', 'Selected club was not found.');
        return res.redirect('/admin/users');
      }
    }

    if (role === 'core') {
      if (!clubId) {
        req.flash('error_msg', 'Select a club when assigning a core member.');
        return res.redirect('/admin/users');
      }

      assignedClub = await Club.findById(clubId);
      if (!assignedClub) {
        req.flash('error_msg', 'Selected club was not found.');
        return res.redirect('/admin/users');
      }

      const otherCoreClub = await findOtherCoreClub(user, assignedClub._id);
      if (otherCoreClub) {
        const assignedClubLabel = otherCoreClub.name
          ? `of ${otherCoreClub.name}`
          : 'in another club';
        req.flash(
          'error_msg',
          `${user.name} is already a Core Member ${assignedClubLabel}. A student can only be a Core Member in one club at a time.`
        );
        return res.redirect('/admin/users');
      }
    }

    if (role === 'faculty') {
      if (!clubId) {
        req.flash('error_msg', 'Select a club when assigning a faculty advisor.');
        return res.redirect('/admin/users');
      }

      assignedClub = await Club.findById(clubId);
      if (!assignedClub) {
        req.flash('error_msg', 'Selected club was not found.');
        return res.redirect('/admin/users');
      }

      const targetAdvisorId = assignedClub.facultyAdvisor
        && assignedClub.facultyAdvisor.user;
      const otherAdvisorClub = await Club.findOne({
        _id: { $ne: assignedClub._id },
        'facultyAdvisor.user': user._id
      }).select('name').lean();
      const legacyAdvisorClubId = user.role === 'faculty'
        && user.club
        && user.club.toString() !== assignedClub._id.toString()
        ? user.club
        : null;
      const legacyAdvisorClub = legacyAdvisorClubId
        ? await Club.findById(legacyAdvisorClubId).select('name').lean()
        : null;
      const otherFacultyUser = await User.findOne({
        role: 'faculty',
        club: assignedClub._id,
        _id: { $ne: user._id }
      }).select('_id').lean();

      if ((targetAdvisorId && targetAdvisorId.toString() !== user._id.toString())
        || otherFacultyUser) {
        req.flash('error_msg', `${assignedClub.name} already has a faculty advisor. Reassign or remove the current advisor before assigning another.`);
        return res.redirect('/admin/users');
      }

      const existingAdvisorClub = otherAdvisorClub
        || (legacyAdvisorClubId ? legacyAdvisorClub || { name: null } : null);
      if (existingAdvisorClub) {
        const clubLabel = existingAdvisorClub.name
          ? `to ${existingAdvisorClub.name}`
          : 'to another club';
        req.flash(
          'error_msg',
          `${user.name} is already assigned as a faculty advisor ${clubLabel}. Each faculty advisor can be assigned to only one club.`
        );
        return res.redirect('/admin/users');
      }
    }

    if (role === 'secretary') {
      if (!clubId) {
        req.flash('error_msg', 'Select a club when assigning a secretary.');
        return res.redirect('/admin/users');
      }

      assignedClub = await Club.findById(clubId);
      if (!assignedClub) {
        req.flash('error_msg', 'Selected club was not found.');
        return res.redirect('/admin/users');
      }

      const otherSecretaryClub = await Club.findOne({
        'secretary.user': user._id,
        _id: { $ne: assignedClub._id }
      });
      if (otherSecretaryClub) {
        req.flash('error_msg', `${user.name} is already the secretary of ${otherSecretaryClub.name}. Each secretary can be assigned to only one club.`);
        return res.redirect('/admin/users');
      }

      if (assignedClub.secretary && assignedClub.secretary.user
        && assignedClub.secretary.user.toString() !== user._id.toString()) {
        req.flash('error_msg', `${assignedClub.name} already has a secretary. Remove or reassign them before assigning another.`);
        return res.redirect('/admin/users');
      }
    }

    if (role === 'student' && assignedClub) {
      const [existingMembership, acceptedApplication] = await Promise.all([
        Membership.findOne({ club: assignedClub._id, student: user._id }),
        Application.exists({ club: assignedClub._id, student: user._id, status: 'Accepted' })
      ]);
      const alreadyMember = assignedClub.members.some(
        memberId => memberId.toString() === user._id.toString()
      ) || (existingMembership && existingMembership.status === 'Approved') || acceptedApplication;
      const memberLimitFilter = alreadyMember
        ? {}
        : {
          $expr: {
            $lt: [
              { $size: { $ifNull: ['$members', []] } },
              { $ifNull: ['$teamLimit', 50] }
            ]
          }
        };
      const updatedClub = await Club.findOneAndUpdate(
        { _id: assignedClub._id, ...memberLimitFilter },
        { $addToSet: { members: user._id } },
        { new: true }
      );

      if (!updatedClub) {
        req.flash('error_msg', `${assignedClub.name} has reached its member limit of ${assignedClub.teamLimit}.`);
        return res.redirect('/admin/users');
      }

      await Membership.findOneAndUpdate(
        { club: assignedClub._id, student: user._id },
        {
          $set: {
            status: 'Approved',
            reviewedBy: req.session.user._id,
            reviewedAt: new Date()
          },
          $setOnInsert: { message: 'Added directly by an administrator.' }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const previousSecretaryClubs = await Club.find({ 'secretary.user': user._id });
    for (const previousClub of previousSecretaryClubs) {
      if (role !== 'secretary' || previousClub._id.toString() !== clubId) {
        previousClub.secretary.name = '';
        previousClub.secretary.rollNo = '';
        previousClub.secretary.email = '';
        previousClub.secretary.user = null;
        await previousClub.save();
      }
    }

    const previousFacultyClubs = await Club.find({ 'facultyAdvisor.user': user._id });
    for (const previousClub of previousFacultyClubs) {
      if (role !== 'faculty' || previousClub._id.toString() !== clubId) {
        previousClub.facultyAdvisor.user = null;
        await previousClub.save();
      }
    }

    // If assigned to club as secretary, link into Club record
    if (role === 'secretary' && assignedClub) {
      assignedClub.secretary.name = user.name;
      assignedClub.secretary.rollNo = user.rollNo;
      assignedClub.secretary.email = user.email;
      assignedClub.secretary.user = user._id;
      await assignedClub.save();
    }

    user.role = role;
    user.club = clubId || null;
    await user.save();

    // If assigned as faculty, link the account to its single club.
    if (role === 'faculty' && assignedClub) {
      assignedClub.facultyAdvisor.name = user.name;
      assignedClub.facultyAdvisor.email = user.email;
      assignedClub.facultyAdvisor.user = user._id;
      await assignedClub.save();
    }

    req.flash(
      'success_msg',
      role === 'student' && assignedClub
        ? `${user.name} was added to ${assignedClub.name} and their role was updated to student.`
        : `Role for ${user.name} updated to ${role}.`
    );
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Update User Error:', error);
    req.flash('error_msg', 'Failed to update user.');
    res.redirect('/admin/users');
  }
});

// GET /admin/reports - Generate Reports Module
router.get('/reports', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    const recruitments = await Recruitment.find().populate('club', 'name code').sort({ createdAt: -1 });
    const events = await Event.find().populate('club', 'name code').sort({ eventDate: -1 });
    const applications = await Application.find().populate('club', 'name code').populate('student', 'name rollNo');

    // Aggregate statistics
    const stats = {
      totalClubs: clubs.length,
      activeClubs: clubs.filter(c => c.isActive).length,
      openRecruitments: recruitments.filter(r => r.status === 'Open').length,
      totalApplications: applications.length,
      acceptedApplications: applications.filter(a => a.status === 'Accepted').length,
      totalEvents: events.length,
      totalRegistrations: events.reduce((sum, e) => sum + e.participants.length, 0)
    };

    res.render('admin/reports', {
      title: 'Platform Analytics & Governance - ClubSphere',
      stats,
      clubs,
      recruitments,
      events,
      currentPage: 'reports'
    });
  } catch (error) {
    console.error('Reports Error:', error);
    req.flash('error_msg', 'Could not generate reports.');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;
