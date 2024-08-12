import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * roundDetails
 * @param req
 * @param res
 */
export const roundDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const roundId = reqBody.round_id ? reqBody.round_id : "";

    // check for award id existance in award table
    const getAwardId = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardId) throw StatusError.badRequest(res.__("Invalid award id"));

    // check for award id existance in award table
    const getRoundId = await model.awardRounds.findOne({
      attributes: ["id"],
      where: { id: roundId, status: { [Op.ne]: "deleted" } },
    });
    if (!getRoundId) throw StatusError.badRequest(res.__("Invalid round id"));

    const getAwardRounds = await model.awardRounds.findOne({
      attributes: [
        "award_id",
        ["id", "round_id"],
        "year",
        "round",
        "round_name",
        "round_date",
        "round_end_date",
      ],
      where: {
        id: roundId,
        award_id: awardId,
        status: { [Op.ne]: "deleted" },
      },
    });
    res.ok(getAwardRounds);
  } catch (error) {
    next(error);
  }
};
