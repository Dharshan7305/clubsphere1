const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Club = require('../models/Club');
const User = require('../models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clubsphere';

function getFacultyEmail(club) {
  return club.code === 'TM'
    ? 'faculty@college.ac.in'
    : `faculty.${club.code.toLowerCase()}@college.ac.in`;
}

async function ensureFacultyAdvisorAccounts() {
  await mongoose.connect(MONGO_URI);

  try {
    const clubs = await Club.find({}).sort({ code: 1 });
    if (clubs.length === 0) {
      throw new Error('No clubs were found.');
    }

    const duplicateAssignments = await Club.aggregate([
      { $match: { 'facultyAdvisor.user': { $type: 'objectId' } } },
      { $group: { _id: '$facultyAdvisor.user', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'count' }
    ]);
    if (duplicateAssignments.length > 0) {
      throw new Error('Existing faculty advisor assignments contain duplicates; resolve them before migration.');
    }

    const clubsWithMultipleFacultyAccounts = await User.aggregate([
      { $match: { role: 'faculty', club: { $type: 'objectId' } } },
      { $group: { _id: '$club', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'count' }
    ]);
    if (clubsWithMultipleFacultyAccounts.length > 0) {
      throw new Error('Some clubs have multiple faculty accounts; resolve them before migration.');
    }

    const counts = { createdAccounts: 0, assignedClubs: 0 };
    for (const club of clubs) {
      const clubId = club._id.toString();
      const advisorDetails = club.facultyAdvisor || {};
      let advisor = club.facultyAdvisor && club.facultyAdvisor.user
        ? await User.findById(club.facultyAdvisor.user)
        : await User.findOne({ role: 'faculty', club: club._id });

      if (club.facultyAdvisor && club.facultyAdvisor.user && !advisor) {
        throw new Error(`The linked faculty account for ${club.code} was not found.`);
      }

      if (!advisor) {
        const email = getFacultyEmail(club);
        advisor = await User.findOne({ email });
        if (advisor && (advisor.role !== 'faculty'
          || (advisor.club && advisor.club.toString() !== clubId))) {
          throw new Error(`The account ${email} is already in use or assigned to another club.`);
        }

        if (!advisor) {
          advisor = new User({
            name: advisorDetails.name || `${club.name} Faculty Advisor`,
            email,
            password: 'password123',
            role: 'faculty',
            department: advisorDetails.department || 'Faculty',
            club: club._id
          });
          await advisor.save();
          counts.createdAccounts += 1;
        }
      }

      if (advisor.role !== 'faculty') {
        throw new Error(`The linked account for ${club.code} is not a faculty account.`);
      }
      if (advisor.club && advisor.club.toString() !== clubId) {
        throw new Error(`The faculty account for ${club.code} is assigned to another club.`);
      }

      const otherClub = await Club.findOne({
        _id: { $ne: club._id },
        'facultyAdvisor.user': advisor._id
      }).select('code').lean();
      if (otherClub) {
        throw new Error(`The faculty account for ${club.code} is already assigned to ${otherClub.code}.`);
      }

      advisor.club = club._id;
      await advisor.save();
      if (!club.facultyAdvisor) club.facultyAdvisor = {};
      club.facultyAdvisor.user = advisor._id;
      await club.save();
      counts.assignedClubs += 1;
    }

    console.log('Faculty advisor accounts ready:', counts);
  } finally {
    await mongoose.disconnect();
  }
}

ensureFacultyAdvisorAccounts().catch(error => {
  console.error('Faculty advisor migration failed:', error);
  process.exitCode = 1;
});
