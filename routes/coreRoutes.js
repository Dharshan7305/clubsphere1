const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Event = require('../models/Event');
const Application = require('../models/Application');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { ensureAuthenticated } = require('../middleware/auth');

async function ensureCoreAccess(req, res, next) {
  if (['admin', 'secretary'].includes(req.session.user.role)) return next();

  try {
    const account = await User.findById(req.session.user._id).select('role club').lean();
    const assignedClubs = [{ 'coreTeam.user': req.session.user._id }];
    if (account && account.role === 'core' && account.club) {
      assignedClubs.push({ _id: account.club });
    }

    const hasCoreAccess = account
      && ['student', 'core'].includes(account.role)
      && await Club.exists({ $or: assignedClubs });
    if (hasCoreAccess) return next();

    req.flash('error_msg', 'You must be assigned as a club core member to access this portal.');
    return res.redirect('/');
  } catch (error) {
    console.error('Core Portal Access Error:', error);
    req.flash('error_msg', 'Could not verify core-member access.');
    return res.redirect('/');
  }
}

router.use(ensureAuthenticated, ensureCoreAccess);

async function getCoreClubs(user) {
  const clubs = await Club.find({ 'coreTeam.user': user._id }).sort({ name: 1 });
  const legacyClubId = user.club && user.club._id ? user.club._id : user.club;
  if (user.role === 'core' && legacyClubId) {
    const legacyClub = await Club.findById(legacyClubId);
    if (legacyClub && !clubs.some(club => club._id.toString() === legacyClub._id.toString())) {
      clubs.unshift(legacyClub);
    }
  }
  return clubs;
}

async function getCoreClub(req) {
  if (req.session.user.role === 'admin') {
    const clubId = req.query.clubId || req.session.user.club?._id;
    if (clubId) return await Club.findById(clubId);
    return await Club.findOne();
  }
  if (req.session.user.role === 'secretary') {
    return await Club.findOne({ 'secretary.user': req.session.user._id });
  }

  const clubs = await getCoreClubs(req.session.user);
  const requestedClubId = req.query.clubId;
  if (requestedClubId) {
    const selectedClub = clubs.find(club => club._id.toString() === requestedClubId);
    if (!selectedClub) return null;
    req.session.coreClubId = selectedClub._id.toString();
    return selectedClub;
  }

  const sessionClub = clubs.find(
    club => club._id.toString() === req.session.coreClubId
  );
  const legacyClubId = req.session.user.club && req.session.user.club._id
    ? req.session.user.club._id.toString()
    : req.session.user.club && req.session.user.club.toString();
  const selectedClub = sessionClub
    || clubs.find(club => club._id.toString() === legacyClubId)
    || clubs[0]
    || null;

  if (selectedClub) req.session.coreClubId = selectedClub._id.toString();
  return selectedClub;
}

// GET /core/dashboard - Core Team Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to a club team yet. Please contact your Secretary or Admin.');
      return res.redirect('/');
    }

    const events = await Event.find({ club: club._id }).sort({ eventDate: 1 });
    const applications = await Application.find({ club: club._id }).sort({ submittedAt: -1 }).limit(10);
    const coreClubs = ['student', 'core'].includes(req.session.user.role)
      ? await getCoreClubs(req.session.user)
      : [];

    const totalParticipants = events.reduce((sum, e) => sum + e.participants.length, 0);

    res.render('core/dashboard', {
      title: `Core Team Portal - ${club.name}`,
      club,
      events,
      applications,
      coreClubs,
      totalParticipants,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Core Dashboard Error:', error);
    req.flash('error_msg', 'Could not load core member dashboard.');
    res.redirect('/');
  }
});

// GET /core/events/:id/participants - View and Check-In Participants
router.get('/events/:id/participants', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to a club core team.');
      return res.redirect('/core/dashboard');
    }

    const event = await Event.findOne({ _id: req.params.id, club: club._id });

    if (!event) {
      req.flash('error_msg', 'Event not found or not in your club.');
      return res.redirect('/core/dashboard');
    }

    res.render('core/event-participants', {
      title: `Participants: ${event.title}`,
      club,
      event,
      currentPage: 'events'
    });
  } catch (error) {
    console.error('Participants list error:', error);
    req.flash('error_msg', 'Could not retrieve participant list.');
    res.redirect('/core/dashboard');
  }
});

// POST /core/events/:id/attendance/:participantId - Toggle Attendance Check-In
router.post('/events/:id/attendance/:participantId', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    if (!club) return res.status(403).json({ error: 'You are not assigned to a club core team.' });

    const event = await Event.findOne({ _id: req.params.id, club: club._id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const participant = event.participants.id(req.params.participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    participant.attended = !participant.attended;
    await event.save();

    res.json({ success: true, attended: participant.attended });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /core/events/:id/update - Update Event Details (Venue, Time, Status)
router.post('/events/:id/update', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to a club core team.');
      return res.redirect('/core/dashboard');
    }

    const event = await Event.findOne({ _id: req.params.id, club: club._id });

    if (!event) {
      req.flash('error_msg', 'Event not found.');
      return res.redirect('/core/dashboard');
    }

    const { venue, eventDate, startTime, endTime, status, description } = req.body;
    let detailsChanged = false;

    if (venue && venue !== event.venue) {
      event.venue = venue;
      detailsChanged = true;
    }
    if (eventDate) {
      const newD = new Date(eventDate);
      if (newD.getTime() !== event.eventDate.getTime()) {
        event.eventDate = newD;
        detailsChanged = true;
      }
    }
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (status) event.status = status;
    if (description) event.description = description;

    await event.save();

    // If venue or date changed, notify all registered participants
    if (detailsChanged && event.participants.length > 0) {
      for (const p of event.participants) {
        if (p.student) {
          await NotificationService.createNotification({
            recipient: p.student,
            club: event.club,
            title: `Event Schedule/Venue Update: ${event.title}`,
            message: `Important update for "${event.title}": Venue is ${event.venue} on ${new Date(event.eventDate).toLocaleDateString()} (${event.startTime}).`,
            type: 'event',
            relatedId: event._id,
            relatedLink: `/events/${event._id}`
          });
        }
      }
    }

    req.flash('success_msg', 'Event details updated successfully! Registered participants notified.');
    res.redirect(`/core/events/${event._id}/participants`);
  } catch (error) {
    console.error('Update event error:', error);
    req.flash('error_msg', 'Failed to update event.');
    res.redirect('/core/dashboard');
  }
});

// GET /core/applications - View recruitment applications (Read-Only review)
router.get('/applications', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to a club core team.');
      return res.redirect('/core/dashboard');
    }

    const applications = await Application.find({ club: club._id })
      .populate('recruitment')
      .sort({ submittedAt: -1 });

    res.render('core/applications', {
      title: `Recruitment Applications - ${club.name}`,
      club,
      applications,
      currentPage: 'applications'
    });
  } catch (error) {
    console.error('Applications list error:', error);
    req.flash('error_msg', 'Could not load applications.');
    res.redirect('/core/dashboard');
  }
});

module.exports = router;
