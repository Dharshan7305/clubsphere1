const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Club = require('../models/Club');
const NotificationService = require('../services/notificationService');
const { ensureAuthenticated } = require('../middleware/auth');

// GET /events - Browse all published campus events
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {
      isPublished: { $ne: false },
      approvalStatus: { $nin: ['Rejected by Principal', 'Rejected by Faculty', 'Changes Requested'] }
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { venue: searchRegex }
          ]
        }
      ];
    }

    const events = await Event.find(query)
      .populate('club', 'name code category logo')
      .sort({ eventDate: 1 });

    const categories = ['All', 'Workshop', 'Hackathon', 'Guest Lecture', 'Symposium', 'Competition', 'Cultural Fest', 'Sports Meet'];

    res.render('events/index', {
      title: 'College Club Events - ClubSphere',
      events,
      categories,
      selectedCategory: category || 'All',
      searchQuery: search || '',
      currentPage: 'events'
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    req.flash('error_msg', 'Could not load events.');
    res.redirect('/');
  }
});

// GET /events/:id - Event Details
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name code category logo facultyAdvisor secretary contactEmail');

    if (!event) {
      req.flash('error_msg', 'Event not found.');
      return res.redirect('/events');
    }

    let isRegistered = false;
    if (req.session.user) {
      isRegistered = event.participants.some(
        p => p.student && p.student.toString() === req.session.user._id.toString()
      );
    }

    res.render('events/show', {
      title: `${event.title} - ClubSphere Events`,
      event,
      isRegistered,
      currentPage: 'events'
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    req.flash('error_msg', 'Error retrieving event details.');
    res.redirect('/events');
  }
});

// POST /events/:id/register - Student Register for Event
router.post('/:id/register', ensureAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club');
    if (!event) {
      req.flash('error_msg', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.status === 'Completed' || event.status === 'Cancelled') {
      req.flash('error_msg', 'Registrations are closed for this event.');
      return res.redirect(`/events/${event._id}`);
    }

    // Check capacity
    if (event.participants.length >= event.maxParticipants) {
      req.flash('error_msg', 'Sorry, registrations are full for this event!');
      return res.redirect(`/events/${event._id}`);
    }

    // Check if already registered
    const alreadyRegistered = event.participants.some(
      p => p.student && p.student.toString() === req.session.user._id.toString()
    );

    if (alreadyRegistered) {
      req.flash('error_msg', 'You are already registered for this event.');
      return res.redirect(`/events/${event._id}`);
    }

    // Register student
    event.participants.push({
      student: req.session.user._id,
      name: req.session.user.name,
      rollNo: req.session.user.rollNo || 'N/A',
      email: req.session.user.email,
      department: req.session.user.department,
      phone: req.body.phone || req.session.user.phone || ''
    });

    await event.save();

    // 1. Create confirmation notification for student
    await NotificationService.createNotification({
      recipient: req.session.user._id,
      club: event.club._id,
      title: `Event Registration Confirmed: ${event.title}`,
      message: `Your registration for "${event.title}" hosted by ${event.club.name} is confirmed. Venue: ${event.venue} on ${new Date(event.eventDate).toLocaleDateString()}.`,
      type: 'event',
      relatedId: event._id,
      relatedLink: `/events/${event._id}`
    });

    // 2. Notify Club Secretary that a new registration was received
    if (event.club.secretary && event.club.secretary.user) {
      await NotificationService.createNotification({
        recipient: event.club.secretary.user,
        club: event.club._id,
        title: `New Event Registration: ${event.title}`,
        message: `${req.session.user.name} (${req.session.user.rollNo || req.session.user.department}) registered for "${event.title}". (${event.participants.length}/${event.maxParticipants} spots filled).`,
        type: 'event',
        relatedId: event._id,
        relatedLink: '/secretary/events'
      });
    }

    req.flash('success_msg', 'Registration successful! You have secured your spot.');
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    console.error('Registration Error:', error);
    req.flash('error_msg', 'Registration failed. Please try again.');
    res.redirect(`/events/${req.params.id}`);
  }
});

module.exports = router;
