const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Club = require('../models/Club');
const User = require('../models/User');
const Recruitment = require('../models/Recruitment');
const Application = require('../models/Application');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clubsphere';

const recruitmentUpdates = [
  {
    oldTitle: 'Coding Club Core & Executive Team Recruitment 2026',
    newTitle: 'Tech Music Membership Drive 2026',
    clubCode: 'TM',
    eligibility: 'Open to all students interested in singing, instruments, music production, or live performances.',
    instructions: 'This is a general club membership drive. No specific roles are required.',
    facultyRemarks: 'Approved for students interested in music and campus performances.'
  },
  {
    oldTitle: 'Robotics Club Project Crew Recruitment 2026',
    newTitle: 'Tamil Mandram Membership Drive 2026',
    clubCode: 'TMN',
    eligibility: 'Open to students interested in Tamil language, literature, or cultural activities.',
    instructions: 'This is a general club membership drive. No specific roles are required.',
    facultyRemarks: 'Approved for students interested in Tamil language and culture.'
  },
  {
    oldTitle: 'AI/ML Special Interest Group Lead Recruitment',
    newTitle: 'Tech Music Membership Intake 2026',
    clubCode: 'TM',
    eligibility: 'Open to students interested in music and campus performances.',
    instructions: 'General club membership intake with no role selection.',
    facultyRemarks: 'Pending faculty review.'
  }
];

const eventUpdates = [
  {
    oldTitle: 'CodeStorm 2026: 24-Hour National Hackathon',
    newTitle: 'Tech Music Unplugged Night 2026',
    clubCode: 'TM',
    category: 'Cultural Fest',
    description: 'An evening of acoustic sets, solo vocal performances, and student bands hosted by Tech Music.',
    venue: 'College Auditorium',
    startTime: '06:00 PM',
    endTime: '08:30 PM',
    secretaryCode: 'TM'
  },
  {
    oldTitle: 'Mastering Full-Stack with Node.js & MongoDB',
    newTitle: 'Vocal Harmony and Acoustic Jam Workshop',
    clubCode: 'TM',
    category: 'Workshop',
    description: 'A practical session for vocal warm-ups, harmony practice, rhythm, and acoustic ensemble playing.',
    venue: 'Music Practice Room',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    secretaryCode: 'TM'
  },
  {
    oldTitle: 'Autonomous Mobile Robots Workshop',
    newTitle: 'Muthamizh Vizha and Poetry Recital',
    clubCode: 'TMN',
    category: 'Cultural Fest',
    description: 'A celebration of Tamil literature and culture featuring poetry recitals, oratory, and traditional performances.',
    venue: 'Tamil Seminar Hall',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    secretaryCode: 'TMN'
  }
];

async function migrateClubDemoContent() {
  await mongoose.connect(MONGO_URI);

  try {
    const clubs = await Club.find({ code: { $in: ['TM', 'TMN'] } }).select('_id code').lean();
    const clubsByCode = new Map(clubs.map(club => [club.code, club]));
    const techMusicClub = clubsByCode.get('TM');
    const tamilMandramClub = clubsByCode.get('TMN');

    if (!techMusicClub || !tamilMandramClub) {
      throw new Error('Tech Music (TM) and Tamil Mandram (TMN) must exist before migration.');
    }

    const secretaryEmails = ['secretary.tm@college.ac.in', 'secretary.tmn@college.ac.in'];
    const secretaries = await User.find({ email: { $in: secretaryEmails } }).select('_id email').lean();
    const secretariesByEmail = new Map(secretaries.map(secretary => [secretary.email, secretary]));
    const migratedRecruitmentIds = new Map();
    const counts = { recruitments: 0, events: 0, applications: 0, notifications: 0 };

    for (const update of recruitmentUpdates) {
      const club = clubsByCode.get(update.clubCode);
      const recruitment = await Recruitment.findOne({
        title: update.oldTitle,
        club: club._id
      }).select('_id').lean();

      if (!recruitment) continue;

      const secretary = secretariesByEmail.get(`secretary.${update.clubCode.toLowerCase()}@college.ac.in`);
      const fields = {
        title: update.newTitle,
        club: club._id,
        roles: [],
        eligibility: update.eligibility,
        instructions: update.instructions,
        'facultyApproval.remarks': update.facultyRemarks
      };
      if (secretary) fields.postedBy = secretary._id;

      const result = await Recruitment.updateOne({ _id: recruitment._id }, { $set: fields });
      counts.recruitments += result.matchedCount || 0;
      if (update.oldTitle === 'Coding Club Core & Executive Team Recruitment 2026') {
        migratedRecruitmentIds.set('techMusic', recruitment._id);
      }
    }

    for (const update of eventUpdates) {
      const club = clubsByCode.get(update.clubCode);
      const event = await Event.findOne({
        title: update.oldTitle,
        club: club._id
      }).select('_id').lean();

      if (!event) continue;

      const secretary = secretariesByEmail.get(`secretary.${update.secretaryCode.toLowerCase()}@college.ac.in`);
      const fields = {
        title: update.newTitle,
        club: club._id,
        category: update.category,
        description: update.description,
        venue: update.venue,
        startTime: update.startTime,
        endTime: update.endTime
      };
      if (secretary) fields.createdBy = secretary._id;

      const result = await Event.updateOne({ _id: event._id }, { $set: fields });
      counts.events += result.matchedCount || 0;
    }

    const demoStudent = await User.findOne({ email: 'student@college.ac.in' }).select('_id').lean();
    const techMusicRecruitmentId = migratedRecruitmentIds.get('techMusic');
    if (demoStudent && techMusicRecruitmentId) {
      const applicationResult = await Application.updateOne({
        recruitment: techMusicRecruitmentId,
        student: demoStudent._id,
        email: 'student@college.ac.in'
      }, {
        $set: {
          appliedRole: 'Executive Member',
          skills: 'Singing and acoustic guitar',
          priorExperience: 'Performed at college cultural events.',
          whyJoin: 'I enjoy singing and playing music and would like to participate in Tech Music performances.',
          status: 'Under Review',
          interviewDate: null,
          interviewVenue: '',
          secretaryNotes: 'Membership application is under review.'
        }
      });
      counts.applications += applicationResult.matchedCount || 0;
    }

    const notificationUpdates = [
      {
        title: 'Interview Call: Coding Club Recruitment',
        club: techMusicClub._id,
        newTitle: 'Tech Music Membership Application',
        message: 'Your membership application is under review by the Tech Music committee.'
      },
      {
        title: 'Registration Open: CodeStorm 2026',
        club: techMusicClub._id,
        newTitle: 'Registration Open: Tech Music Unplugged Night',
        message: 'Registration is open for Tech Music Unplugged Night 2026. Join us for live campus performances.'
      },
      {
        title: 'Recruitment Approval Pending',
        club: techMusicClub._id,
        newTitle: 'Membership Drive Approval Pending',
        message: 'The Tech Music membership intake is waiting for your review and approval.'
      }
    ];

    for (const update of notificationUpdates) {
      const result = await Notification.updateOne({
        title: update.title,
        club: update.club
      }, {
        $set: {
          title: update.newTitle,
          message: update.message,
          club: update.club
        }
      });
      counts.notifications += result.matchedCount || 0;
    }

    console.log('Club demo data migration completed:', counts);
  } finally {
    await mongoose.disconnect();
  }
}

migrateClubDemoContent().catch(error => {
  console.error('Club demo data migration failed:', error);
  process.exitCode = 1;
});
