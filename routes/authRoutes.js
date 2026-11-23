const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const NotificationService = require('../services/notificationService');
const EmailService = require('../services/emailService');
const { ensureGuest } = require('../middleware/auth');
const PSG_EMAIL_PATTERN = /^\d{2}[a-z]{2}\d{3}@psgtech\.ac\.in$/i;
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_OTP_RESEND_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_MAX_RESENDS = 5;

function generateEmailOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function clearEmailOtp(user) {
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailOtpSentAt = null;
  user.emailOtpWindowStartedAt = null;
  user.emailOtpResends = 0;
}

function setStudentSession(req, user) {
  req.session.user = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo,
    department: user.department,
    year: user.year,
    club: null
  };
}

async function notifyAdminOfStudentRegistration(user) {
  await NotificationService.notifyRole('admin', {
    title: `New Student Registered: ${user.name}`,
    message: `Student ${user.name} (${user.rollNo}, ${user.department}) registered on ClubSphere.`,
    type: 'admin',
    relatedId: user._id,
    relatedLink: '/admin/users'
  });
}

// Render Login Page
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login - ClubSphere',
    currentPage: 'login'
  });
});

// Process Login
router.post('/login', ensureGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error_msg', 'Please provide both email and password.');
      return res.redirect('/auth/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('club');
    if (!user) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    if (!user.emailVerified) {
      req.session.pendingVerificationEmail = user.email;
      req.flash('error_msg', 'Verify your email address before signing in. You can request a new code below.');
      return res.redirect('/auth/verify-email');
    }

    // Set session data
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      department: user.department,
      year: user.year,
      club: user.club ? { _id: user.club._id, name: user.club.name, code: user.club.code } : null
    };

    req.flash('success_msg', `Welcome back, ${user.name}!`);

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'secretary':
        return res.redirect('/secretary/dashboard');
      case 'core':
        return res.redirect('/core/dashboard');
      case 'faculty':
        return res.redirect('/faculty/dashboard');
      default:
        return res.redirect('/student/dashboard');
    }
  } catch (error) {
    console.error('Login Error:', error);
    req.flash('error_msg', 'An unexpected error occurred during login.');
    res.redirect('/auth/login');
  }
});

// Render Register Page (for Students)
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Student Registration - ClubSphere',
    currentPage: 'register'
  });
});

// Process Student Registration
router.post('/register', ensureGuest, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, rollNo, department, year, phone } = req.body;

    if (!name || !email || !password || !rollNo) {
      req.flash('error_msg', 'Please fill in all required fields.');
      return res.redirect('/auth/register');
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!PSG_EMAIL_PATTERN.test(normalizedEmail)) {
      req.flash('error_msg', 'Use your PSG Tech email in the format 26mx105@psgtech.ac.in.');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error_msg', 'Password must be at least 6 characters long.');
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match.');
      return res.redirect('/auth/register');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.role === 'student' && !existingUser.emailVerified) {
        req.session.pendingVerificationEmail = normalizedEmail;
        req.flash('error_msg', 'This email has a registration waiting for verification. Enter the code or request a new one.');
        return res.redirect('/auth/verify-email');
      }

      req.flash('error_msg', 'An account with this email already exists.');
      return res.redirect('/auth/register');
    }

    const now = new Date();
    const code = generateEmailOtp();
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'student',
      emailVerified: false,
      emailOtpHash: await bcrypt.hash(code, 10),
      emailOtpExpiresAt: new Date(now.getTime() + EMAIL_OTP_TTL_MS),
      emailOtpAttempts: 0,
      emailOtpSentAt: now,
      emailOtpWindowStartedAt: now,
      emailOtpResends: 0,
      rollNo: rollNo.toUpperCase().trim(),
      department: department || 'Computer Applications',
      year: parseInt(year, 10) || 1,
      phone: phone || ''
    });

    await newUser.save();
    req.session.pendingVerificationEmail = normalizedEmail;

    try {
      await EmailService.sendVerificationCode(normalizedEmail, code);
    } catch (error) {
      console.error('Registration OTP email error:', error.message);
      req.flash('error_msg', 'Your registration was saved, but the verification email could not be sent. Check the email settings or try again later.');
      return res.redirect('/auth/verify-email');
    }

    req.flash('success_msg', 'We sent a 6-digit verification code to your PSG Tech email. It expires in 10 minutes.');
    res.redirect('/auth/verify-email');
  } catch (error) {
    console.error('Registration Error:', error);
    req.flash('error_msg', 'We could not complete registration. Please review your details and try again.');
    res.redirect('/auth/register');
  }
});

router.get('/verify-email', ensureGuest, async (req, res) => {
  const email = req.session.pendingVerificationEmail;
  if (!email) {
    req.flash('error_msg', 'Start registration or sign in to verify your email.');
    return res.redirect('/auth/register');
  }

  try {
    const user = await User.findOne({ email, role: 'student' }).select('emailVerified').lean();
    if (!user || user.emailVerified) {
      delete req.session.pendingVerificationEmail;
      req.flash('error_msg', 'There is no pending email verification for this session.');
      return res.redirect('/auth/login');
    }

    res.render('auth/verify-email', {
      title: 'Verify Email - ClubSphere',
      currentPage: 'register',
      email
    });
  } catch (error) {
    console.error('Email verification page error:', error);
    req.flash('error_msg', 'We could not load email verification. Please try again.');
    res.redirect('/auth/register');
  }
});

router.post('/verify-email', ensureGuest, async (req, res) => {
  const email = req.session.pendingVerificationEmail;
  if (!email) {
    req.flash('error_msg', 'Start registration or sign in to verify your email.');
    return res.redirect('/auth/register');
  }

  try {
    const user = await User.findOne({ email, role: 'student' }).select('+emailOtpHash');
    if (!user || user.emailVerified) {
      delete req.session.pendingVerificationEmail;
      req.flash('error_msg', 'There is no pending email verification for this session.');
      return res.redirect('/auth/login');
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt <= new Date()) {
      req.flash('error_msg', 'Your code has expired. Request a new one to continue.');
      return res.redirect('/auth/verify-email');
    }

    if (user.emailOtpAttempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      req.flash('error_msg', 'Too many incorrect attempts. Request a new code to continue.');
      return res.redirect('/auth/verify-email');
    }

    const submittedCode = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    user.emailOtpAttempts += 1;
    const isValidCode = /^\d{6}$/.test(submittedCode)
      && await bcrypt.compare(submittedCode, user.emailOtpHash);

    if (!isValidCode) {
      await user.save();
      const attemptsLeft = EMAIL_OTP_MAX_ATTEMPTS - user.emailOtpAttempts;
      req.flash('error_msg', attemptsLeft > 0
        ? `That code is not valid. You have ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`
        : 'Too many incorrect attempts. Request a new code to continue.');
      return res.redirect('/auth/verify-email');
    }

    user.emailVerified = true;
    clearEmailOtp(user);
    await user.save();
    delete req.session.pendingVerificationEmail;

    await notifyAdminOfStudentRegistration(user);
    setStudentSession(req, user);
    req.flash('success_msg', 'Your email is verified and your registration is complete. Welcome to ClubSphere!');
    res.redirect('/student/dashboard');
  } catch (error) {
    console.error('Email verification error:', error);
    req.flash('error_msg', 'We could not verify your email. Please try again.');
    res.redirect('/auth/verify-email');
  }
});

router.post('/resend-verification', ensureGuest, async (req, res) => {
  const email = req.session.pendingVerificationEmail;
  if (!email) {
    req.flash('error_msg', 'Start registration or sign in before requesting a verification code.');
    return res.redirect('/auth/register');
  }

  try {
    const user = await User.findOne({ email, role: 'student' }).select('+emailOtpHash');
    if (!user || user.emailVerified) {
      delete req.session.pendingVerificationEmail;
      req.flash('error_msg', 'There is no pending email verification for this session.');
      return res.redirect('/auth/login');
    }

    const now = new Date();
    if (user.emailOtpSentAt) {
      const waitMs = EMAIL_OTP_RESEND_COOLDOWN_MS - (now.getTime() - user.emailOtpSentAt.getTime());
      if (waitMs > 0) {
        req.flash('error_msg', `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`);
        return res.redirect('/auth/verify-email');
      }
    }

    const windowExpired = !user.emailOtpWindowStartedAt
      || now.getTime() - user.emailOtpWindowStartedAt.getTime() >= EMAIL_OTP_RESEND_WINDOW_MS;
    if (windowExpired) {
      user.emailOtpWindowStartedAt = now;
      user.emailOtpResends = 0;
    }

    if (user.emailOtpResends >= EMAIL_OTP_MAX_RESENDS) {
      req.flash('error_msg', 'You have reached the code resend limit. Please try again in an hour.');
      return res.redirect('/auth/verify-email');
    }

    const code = generateEmailOtp();
    user.emailOtpHash = await bcrypt.hash(code, 10);
    user.emailOtpExpiresAt = new Date(now.getTime() + EMAIL_OTP_TTL_MS);
    user.emailOtpAttempts = 0;
    user.emailOtpSentAt = now;
    user.emailOtpResends += 1;
    await user.save();

    try {
      await EmailService.sendVerificationCode(email, code);
    } catch (error) {
      console.error('Resend OTP email error:', error.message);
      req.flash('error_msg', 'The code could not be sent. Check the email settings or try again later.');
      return res.redirect('/auth/verify-email');
    }

    req.flash('success_msg', 'A new verification code has been sent. Previous codes no longer work.');
    res.redirect('/auth/verify-email');
  } catch (error) {
    console.error('Resend verification error:', error);
    req.flash('error_msg', 'We could not resend the verification code. Please try again.');
    res.redirect('/auth/verify-email');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destruction error:', err);
    res.redirect('/auth/login');
  });
});

module.exports = router;
