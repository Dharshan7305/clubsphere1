const Club = require('../models/Club');

async function findOtherCoreClub(user, targetClubId) {
  const targetId = targetClubId.toString();
  const legacyClubId = user.role === 'core'
    && user.club
    && user.club.toString() !== targetId
    ? user.club
    : null;

  const [teamAssignment, legacyClub] = await Promise.all([
    Club.findOne({
      _id: { $ne: targetClubId },
      'coreTeam.user': user._id
    }).select('name').lean(),
    legacyClubId
      ? Club.findById(legacyClubId).select('name').lean()
      : Promise.resolve(null)
  ]);

  if (teamAssignment) return teamAssignment;
  if (legacyClubId) return legacyClub || { name: null };
  return null;
}

module.exports = { findOtherCoreClub };
