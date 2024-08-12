import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * deleteRound
 * @param req
 * @param res
 */
export const deleteRound = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;

    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const roundId = reqBody.round_id ? reqBody.round_id : "";

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

    // check for round nominee existance in table
    const getNominee = await model.awardNominees.findOne({
      attributes: ["id"],
      where: { round_id: roundId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (getNominee)
      throw StatusError.badRequest(
        res.__("you can not delete this round as it is already assigned to the nominees"),
      );

    const updatedRoundDetails = {
      status: "deleted",
      updated_by: userId,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    await model.awardRounds.update(updatedRoundDetails, {
      where: { id: roundId, award_id: awardId },
    });
    //edit data in search db
    esService.esSchedularAddUpdate(awardId, "award", "edit");

    res.ok({
      message: res.__("award round deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
