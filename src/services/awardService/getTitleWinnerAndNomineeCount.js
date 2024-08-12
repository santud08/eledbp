import models from "../../models/index.js";
/**
 * getTitleWinnerAndNomineeCount
 * to get the tilte wise award winner and nominee count
 * @param - titleId
 * @param - awardId - optional
 * return object- winners and nomenees count
 */

export const getTitleWinnerAndNomineeCount = async (titleId, awardId = null) => {
  const condition = { work_id: titleId, status: "active" };
  if (awardId && awardId > 0) {
    condition.award_id = awardId;
  }
  const includeQuery = [{ model: models.awards, where: { status: "active" } }];
  const [winnerCount, nomineeCount] = await Promise.all([
    models.awardNominees.count({
      where: { ...condition, nominee_type: "winner" },
      include: includeQuery,
    }),
    models.awardNominees.count({
      where: { ...condition, nominee_type: "candidate" },
      include: includeQuery,
    }),
  ]);
  return { winners: winnerCount ? winnerCount : 0, nominees: nomineeCount ? nomineeCount : 0 };
};
