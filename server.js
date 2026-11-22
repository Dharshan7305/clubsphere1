const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const Club = require('./models/Club');
const User = require('./models/User');
const Recruitment = require('./models/Recruitment');
const Event = require('./models/Event');
const NotificationService = require('./services/notificationService');

const app = express();

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'clubsphere_clubsphere_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
  })
);

// Connect Flash
app.use(flash());

// Connect before any middleware or route performs database operations.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[MongoDB Request Error]:', error.message);
    res.status(503).send('The service is temporarily unavailable because the database could not be reached.');
  }
});

// Global Variables & Notification Badge Middleware
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');

  res.locals.unreadNotifs = 0;
  res.locals.recentNotifications = [];
  res.locals.coreClubs = [];

  if (req.session.user) {
    const userId = req.session.user._id;
    try {
      const { role } = req.session.user;
      const [unreadCount, recentNotifications] = await Promise.all([
        NotificationService.getUnreadCount(userId, role),
        NotificationService.getNotificationsForUser(userId, role, { limit: 8 })
      ]);

      res.locals.unreadNotifs = unreadCount;
      res.locals.recentNotifications = recentNotifications;
    } catch (error) {
      console.error('[Notification Middleware Error]:', error.message);
    }

    if (['student', 'core'].includes(req.session.user.role)) {
      try {
        const [account, coreClubs] = await Promise.all([
          User.findById(userId).select('role club').populate('club', 'name code').lean(),
          Club.find({ 'coreTeam.user': userId }).select('_id name code').sort({ name: 1 }).lean()
        ]);

        if (account) {
          req.session.user.role = account.role;
          req.session.user.club = account.club
            ? { _id: account.club._id, name: account.club.name, code: account.club.code }
            : null;
        }

        const legacyClubId = account && account.club && account.club._id;
        if (account && account.role === 'core' && legacyClubId) {
          if (!coreClubs.some(club => club._id.toString() === legacyClubId.toString())) {
            coreClubs.push(account.club);
          }
        }

        res.locals.user = req.session.user;
        res.locals.coreClubs = coreClubs;
      } catch (error) {
        console.error('[Core Membership Middleware Error]:', error.message);
      }
    }
  }

  next();
});

// Home Page Route
app.get('/', async (req, res) => {
  try {
    const featuredClubs = await Club.find({ isActive: true }).limit(6);
    const activeRecruitments = await Recruitment.find({ status: 'Open' })
      .populate('club', 'name code category logo')
      .sort({ deadline: 1 })
      .limit(4);
    const upcomingEvents = await Event.find({ status: { $in: ['Upcoming', 'Ongoing'] } })
      .populate('club', 'name code logo')
      .sort({ eventDate: 1 })
      .limit(4);

    const stats = {
      clubsCount: await Club.countDocuments({ isActive: true }),
      openRecruitmentsCount: await Recruitment.countDocuments({ status: 'Open' }),
      eventsCount: await Event.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } })
    };

    res.render('home', {
      title: 'ClubSphere | Club Discovery & Recruitment Platform',
      featuredClubs,
      activeRecruitments,
      upcomingEvents,
      stats,
      currentPage: 'home'
    });
  } catch (error) {
    console.error('Home Page Error:', error);
    res.render('home', {
      title: 'ClubSphere ',
      featuredClubs: [],
      activeRecruitments: [],
      upcomingEvents: [],
      stats: { clubsCount: 0, openRecruitmentsCount: 0, eventsCount: 0 },
      currentPage: 'home'
    });
  }
});

// Mount Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/clubs', require('./routes/clubRoutes'));
app.use('/events', require('./routes/eventRoutes'));
app.use('/student', require('./routes/studentRoutes'));
app.use('/secretary', require('./routes/secretaryRoutes'));
app.use('/core', require('./routes/coreRoutes'));
app.use('/faculty', require('./routes/facultyRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/principal', require('./routes/principalRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 - Page Not Found | ClubSphere',
    currentPage: ''
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).send('Internal Server Error: ' + err.message);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ClubSphere - ClubSphere Platform is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🎓 Ready for WAD Project Viva Demonstration`);
  console.log(`====================================================`);
});
