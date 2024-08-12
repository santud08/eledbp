import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * addRound
 * @param req
 * @param res
 */
export const addRound = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;

    const awardId = reqBody.award_id ? reqBody.award_id : "";
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

    // check for round name existance in table
    const isExistsRound = await model.awardRounds.findOne({
      attributes: ["id"],
      where: {
        award_id: awardId,
        round_name: roundName,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (isExistsRound) throw StatusError.badRequest(res.__("round name already exists"));
    const roundDetails = {
      year: year,
      round: round,
      award_id: awardId,
      round_name: roundName,
      round_date: roundDate,
      round_end_date: roundEndDate,
      created_by: userId,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    await model.awardRounds.create(roundDetails);
    //edit data in search db
    esService.esSchedularAddUpdate(awardId, "award", "edit");

    res.ok({
      message: res.__("award round added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
