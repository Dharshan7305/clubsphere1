const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');
const Recruitment = require('./models/Recruitment');
const Application = require('./models/Application');
const Event = require('./models/Event');
const Notification = require('./models/Notification');
const { clubs30 } = require('./config/clubsData');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clubsphere';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing collections
    await User.deleteMany({});
    await Club.deleteMany({});
    await Recruitment.deleteMany({});
    await Application.deleteMany({});
    await Event.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    // Default password hash
    const salt = await bcrypt.genSalt(10);
    const commonHashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create default platform accounts.
    const adminUser = await User.create({
      name: 'Dr. Dean Student Affairs',
      email: 'admin@college.ac.in',
      password: 'password123',
      role: 'admin',
      department: 'Dean Office',
      phone: '9842100001'
    });

    let facultyUser = null;

    const coreUser = await User.create({
      name: 'Kavitha M',
      email: 'core@college.ac.in',
      password: 'password123',
      role: 'core',
      rollNo: '23MX115',
      department: 'Computer Applications',
      year: 2,
      phone: '9842100004'
    });

    const studentUser = await User.create({
      name: 'Dharshan R',
      email: '26mx105@psgtech.ac.in',
      password: 'password123',
      role: 'student',
      rollNo: '26MX105',
      department: 'Computer Applications',
      year: 1,
      phone: '9842100005'
    });

    console.log('[Seed] Created default student, core, and admin users.');

    // 2. Create All 30 Official College Clubs
    const clubsData = clubs30.map((c, idx) => {
      return {
        name: c.name,
        code: c.code,
        category: c.category,
        tagline: c.tagline,
        description: c.description,
        objectives: c.objectives || [],
        facultyAdvisor: c.facultyAdvisor || {
          name: (c.facultyAdvisors && c.facultyAdvisors[0] && c.facultyAdvisors[0].name) || 'Faculty Advisor',
          department: (c.facultyAdvisors && c.facultyAdvisors[0] && c.facultyAdvisors[0].department) || 'Faculty',
          designation: (c.facultyAdvisors && c.facultyAdvisors[0] && c.facultyAdvisors[0].designation) || 'Faculty Advisor'
        },
        facultyAdvisors: c.facultyAdvisors || [],
        banner: c.banner || '/images/banner-default.jpg',
        recruitmentStatus: c.recruitmentStatus || (idx % 3 === 0 ? 'Open' : (idx % 3 === 1 ? 'Closed' : 'Coming Soon')),
        contactEmail: c.contactEmail || (c.code.toLowerCase() + '@college.ac.in'),
        foundedYear: c.foundedYear || 2010,
        isActive: true
      };
    });

    const createdClubs = await Club.insertMany(clubsData);
    console.log(`[Seed] Created ${createdClubs.length} college clubs.`);

    const facultyUsers = [];
    for (const club of createdClubs) {
      const advisor = club.facultyAdvisor || {};
      const facultyEmail = club.code === 'TM'
        ? 'faculty@college.ac.in'
        : `faculty.${club.code.toLowerCase()}@college.ac.in`;
      const advisorUser = await User.create({
        name: advisor.name || `${club.name} Faculty Advisor`,
        email: facultyEmail,
        password: 'password123',
        role: 'faculty',
        department: advisor.department || 'Faculty',
        club: club._id
      });

      club.facultyAdvisor.user = advisorUser._id;
      await club.save();
      facultyUsers.push(advisorUser);
      if (club.code === 'TM') facultyUser = advisorUser;
    }

    if (!facultyUser) {
      throw new Error('Tech Music faculty advisor account was not created.');
    }
    console.log(`[Seed] Created and assigned ${facultyUsers.length} club faculty advisors.`);

    // Give each club its own secretary account.
    const secretaryUsers = [];
    for (const club of createdClubs) {
      const secretaryUser = await User.create({
        name: `${club.name} Secretary`,
        email: `secretary.${club.code.toLowerCase()}@college.ac.in`,
        password: 'password123',
        role: 'secretary',
        department: 'Computer Applications',
        year: 3,
        club: club._id
      });

      club.secretary = {
        name: secretaryUser.name,
        rollNo: secretaryUser.rollNo,
        email: secretaryUser.email,
        user: secretaryUser._id
      };
      await club.save();
      secretaryUsers.push(secretaryUser);
    }

    console.log(`[Seed] Created and assigned ${secretaryUsers.length} club secretaries.`);

    // Link demo users and content to clubs by code, not array position.
    const techMusicClub = createdClubs.find(club => club.code === 'TM');
    const tamilMandramClub = createdClubs.find(club => club.code === 'TMN');
    const techMusicSecretary = techMusicClub
      ? secretaryUsers.find(user =>
        user.club && user.club.toString() === techMusicClub._id.toString()
      )
      : null;
    const tamilMandramSecretary = tamilMandramClub
      ? secretaryUsers.find(user =>
        user.club && user.club.toString() === tamilMandramClub._id.toString()
      )
      : null;

    if (!techMusicClub || !tamilMandramClub || !techMusicSecretary || !tamilMandramSecretary) {
      throw new Error('Required demo clubs or secretary accounts were not created.');
    }

    coreUser.club = techMusicClub._id;
    await coreUser.save();

    // 3. Create Recruitment Drives
    const techMusicRecruitment = await Recruitment.create({
      club: techMusicClub._id,
      title: 'Tech Music Membership Drive 2026',
      academicYear: '2025-2026',
      roles: [],
      eligibility: 'Open to all students interested in singing, instruments, music production, or live performances.',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'Open',
      facultyApproval: {
        status: 'Approved',
        reviewedBy: facultyUser._id,
        remarks: 'Approved for students interested in music and campus performances.',
        reviewedAt: new Date()
      },
      postedBy: techMusicSecretary._id,
      instructions: 'This is a general club membership drive. No specific roles are required.'
    });

    const tamilMandramRecruitment = await Recruitment.create({
      club: tamilMandramClub._id,
      title: 'Tamil Mandram Membership Drive 2026',
      academicYear: '2025-2026',
      roles: [],
      eligibility: 'Open to students interested in Tamil language, literature, or cultural activities.',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'Open',
      facultyApproval: {
        status: 'Approved',
        remarks: 'Approved.',
        reviewedAt: new Date()
      },
      instructions: 'This is a general club membership drive. No specific roles are required.'
    });

    // A role-free pending membership drive for faculty approval demo data.
    const pendingRecruitment = await Recruitment.create({
      club: techMusicClub._id,
      title: 'Tech Music Membership Intake 2026',
      academicYear: '2025-2026',
      roles: [],
      eligibility: 'Open to students interested in music and campus performances.',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Pending Approval',
      facultyApproval: {
        status: 'Pending',
        remarks: 'Pending faculty review.'
      },
      postedBy: techMusicSecretary._id,
      instructions: 'General club membership intake with no role selection.'
    });

    console.log('[Seed] Created recruitment drives, including one pending faculty review.');

    // 4. Create Sample Application by Student
    const sampleApp = await Application.create({
      recruitment: techMusicRecruitment._id,
      club: techMusicClub._id,
      student: studentUser._id,
      appliedRole: 'Club Member',
      studentName: 'Dharshan R',
      rollNo: '26MX105',
      department: 'Computer Applications',
      year: 1,
      email: '26mx105@psgtech.ac.in',
      phone: '9842100005',
      cgpa: 8.8,
      skills: 'Singing and acoustic guitar',
      priorExperience: 'Performed at college cultural events.',
      whyJoin: 'I enjoy singing and playing music and would like to participate in Tech Music performances.',
      status: 'Under Review',
      secretaryNotes: 'Membership application is under review.'
    });

    console.log('[Seed] Created sample recruitment application.');

    // 5. Create Events
    const event1 = await Event.create({
      club: techMusicClub._id,
      title: 'Tech Music Unplugged Night 2026',
      category: 'Cultural Fest',
      description: 'An evening of acoustic sets, solo vocal performances, and student bands hosted by Tech Music.',
      venue: 'College Auditorium',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '06:00 PM',
      endTime: '08:30 PM',
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxParticipants: 150,
      status: 'Upcoming',
      participants: [
        {
          student: studentUser._id,
          name: 'Dharshan R',
          rollNo: '26MX105',
          email: '26mx105@psgtech.ac.in',
          department: 'Computer Applications',
          phone: '9842100005',
          attended: false
        },
        {
          student: coreUser._id,
          name: 'Kavitha M',
          rollNo: '23MX115',
          email: 'core@college.ac.in',
          department: 'Computer Applications',
          phone: '9842100004',
          attended: true
        }
      ],
      createdBy: techMusicSecretary._id
    });

    const event2 = await Event.create({
      club: techMusicClub._id,
      title: 'Vocal Harmony and Acoustic Jam Workshop',
      category: 'Workshop',
      description: 'A practical session for vocal warm-ups, harmony practice, rhythm, and acoustic ensemble playing.',
      venue: 'Music Practice Room',
      eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxParticipants: 60,
      status: 'Upcoming',
      participants: [],
      createdBy: techMusicSecretary._id
    });

    const event3 = await Event.create({
      club: tamilMandramClub._id,
      title: 'Muthamizh Vizha and Poetry Recital',
      category: 'Cultural Fest',
      description: 'A celebration of Tamil literature and culture featuring poetry recitals, oratory, and traditional performances.',
      venue: 'Tamil Seminar Hall',
      eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      registrationDeadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
      maxParticipants: 40,
      status: 'Upcoming',
      participants: [],
      createdBy: tamilMandramSecretary._id
    });

    console.log('[Seed] Created campus events.');

    // 6. Create Notifications
    await Notification.create([
      {
        recipient: studentUser._id,
        club: techMusicClub._id,
        title: 'Tech Music Membership Application',
        message: 'Your membership application is under review by the Tech Music committee.',
        type: 'application',
        relatedLink: '/student/applications',
        isRead: false
      },
      {
        recipient: null, // broadcast
        club: techMusicClub._id,
        title: 'Registration Open: Tech Music Unplugged Night',
        message: 'Registration is open for Tech Music Unplugged Night 2026. Join us for live campus performances.',
        type: 'event',
        relatedLink: `/events/${event1._id}`,
        isRead: false
      },
      {
        recipient: facultyUser._id,
        club: techMusicClub._id,
        title: 'Membership Drive Approval Pending',
        message: 'The Tech Music membership intake is waiting for your review and approval.',
        type: 'recruitment',
        relatedLink: '/faculty/dashboard',
        isRead: false
      }
    ]);

    console.log('[Seed] Created initial notifications.');

    console.log('====================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('Seeded Development Account Credentials:');
    console.log('1. Student:         26mx105@psgtech.ac.in   / password123');
    console.log('2. Core Member:     core@college.ac.in      / password123');
    console.log('3. Faculty Advisor: faculty@college.ac.in   / password123');
    console.log('4. Admin:           admin@college.ac.in     / password123');
    console.log('Other faculty advisors: faculty.<club-code>@college.ac.in / password123');
    console.log('Club secretary accounts: secretary.<club-code>@college.ac.in / password123');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seedDatabase();
