import models from "../../models/index.js";
/**
 * getPeopleWinnerAndNomineeCount
 * to get the people wise award winner and nominee count
 * @param - peopleId
 * @param - awardId - optional
 * return object- winners and nomenees count
 */

export const getPeopleWinnerAndNomineeCount = async (peopleId, awardId = null) => {
  const condition = { character_id: peopleId, status: "active" };
  if (awardId && awardId > 0) {
    condition.award_id = awardId;
  }

  const [winnerCount, nomineeCount] = await Promise.all([
    models.awardNominees.count({ where: { ...condition, nominee_type: "winner" } }),
    models.awardNominees.count({ where: { ...condition, nominee_type: "candidate" } }),
  ]);

  return { winners: winnerCount ? winnerCount : 0, nominees: nomineeCount ? nomineeCount : 0 };
};
