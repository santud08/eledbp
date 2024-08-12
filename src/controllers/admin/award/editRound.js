import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * editRound
 * @param req
 * @param res
 */
export const editRound = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;

    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const roundId = reqBody.round_id ? reqBody.round_id : "";
    const year = reqBody.year ? reqBody.year : null;
    const round = reqBody.round ? reqBody.round : null;
    const roundName = reqBody.round_name ? reqBody.round_name : "";
    const roundDate = reqBody.round_date ? reqBody.round_date : null;
    const roundEndDate = reqBody.round_end_date ? reqBody.round_end_date : null;

    // check for award id existance in awards table
    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const getRound = await model.awardRounds.findOne({
      attributes: ["id"],
      where: { id: roundId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (!getRound) throw StatusError.badRequest(res.__("Invalid round id"));

    // check for round name existance in table
    const isExistsRound = await model.awardRounds.findOne({
      attributes: ["id"],
      where: {
        id: { [Op.ne]: roundId },
        award_id: awardId,
        round_name: roundName,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (isExistsRound) throw StatusError.badRequest(res.__("round name already exists"));
    const updatedRoundDetails = {
      year: year,
      round: round,
      round_name: roundName,
      round_date: roundDate,
      round_end_date: roundEndDate,
      updated_by: userId,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    await model.awardRounds.update(updatedRoundDetails, {
      where: { id: roundId, award_id: awardId },
    });
    //edit data in search db
    esService.esSchedularAddUpdate(awardId, "award", "edit");

    res.ok({
      message: res.__("award round updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
