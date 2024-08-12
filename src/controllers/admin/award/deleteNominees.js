import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * deleteNominees
 * @param req
 * @param res
 */
export const deleteNominees = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const roundId = reqBody.round_id ? reqBody.round_id : "";
    const nomineeId = reqBody.nominee_id ? reqBody.nominee_id : "";

    // check for award id existance in award table
    const getAwardId = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardId) throw StatusError.badRequest(res.__("Invalid award id"));

    const getRoundId = await model.awardRounds.findOne({
      attributes: ["id"],
      where: { id: roundId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getRoundId) throw StatusError.badRequest(res.__("Invalid round id"));

    const getNomineeId = await model.awardNominees.findOne({
      attributes: ["id"],
      where: {
        id: nomineeId,
        round_id: roundId,
        award_id: awardId,
        status: { [Op.ne]: "deleted" },
      },
    });
    if (!getNomineeId) throw StatusError.badRequest(res.__("Invalid nominee id"));

    const deleteNomineesData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.awardNominees.update(deleteNomineesData, {
      where: { id: nomineeId },
    });

    res.ok({
      message: res.__("past award deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
