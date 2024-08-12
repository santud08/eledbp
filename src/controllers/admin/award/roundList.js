import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { StatusError } from "../../../config/index.js";

/**
 * roundList
 * @param req
 * @param res
 */
export const roundList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const searchText = reqBody.search_text ? reqBody.search_text : "";

    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const roundList = await model.awardRounds.findAll({
      attributes: [
        ["id", "round_id"],
        [
          Sequelize.literal(`CASE WHEN round IS NOT NULL THEN CASE
      WHEN  round % 10 = 1 AND round % 100 != 11 THEN CONCAT(year," ", round, 'st')
      WHEN round % 10 = 2 AND round % 100 != 12 THEN CONCAT(year, " ",round, 'nd')
      WHEN round % 10 = 3 AND round % 100 != 13 THEN CONCAT(year," ",round, 'rd')
      ELSE CONCAT(year," ", round, 'th') END
      ELSE year  END`),
          "round_name",
        ],
      ],
      where: {
        award_id: awardId,
        status: { [Op.ne]: "deleted" },
        [Op.and]: {
          round_name: { [Op.like]: `%${searchText}%` },
        },
      },
      order: [
        ["year", "DESC"],
        ["round", "DESC"],
        ["id", "DESC"],
      ],
    });
    res.ok({
      results: roundList,
    });
  } catch (error) {
    next(error);
  }
};
