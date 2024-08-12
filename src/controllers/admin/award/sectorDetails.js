import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { StatusError } from "../../../config/index.js";

/**
 * sectorDetails
 * @param req
 * @param res
 */
export const sectorDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const sectorId = reqBody.id ? reqBody.id : "";

    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const getAwardSectorId = await model.awardSectors.findOne({
      attributes: ["id"],
      where: { id: sectorId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardSectorId) throw StatusError.badRequest(res.__("Invalid id"));

    const awardSectorDetails = await model.awardSectors.findOne({
      attributes: [
        "id",
        "award_id",
        [
          Sequelize.fn("IFNULL", Sequelize.col("awardSectorTranslationsOne.division_name"), ""),
          "division_name_en",
        ],
        [
          Sequelize.fn("IFNULL", Sequelize.col("awardSectorTranslationsOnel.division_name"), ""),
          "division_name_ko",
        ],
        "status",
      ],
      where: { id: sectorId, award_id: awardId, status: { [Op.ne]: "deleted" } },
      include: [
        {
          model: model.awardSectorTranslations,
          as: "awardSectorTranslationsOne",
          attributes: [],
          left: true,
          where: { status: { [Op.ne]: "deleted" }, site_language: "en" },
          required: false,
        },
        {
          model: model.awardSectorTranslations,
          as: "awardSectorTranslationsOnel",
          attributes: [],
          left: true,
          where: { status: { [Op.ne]: "deleted" }, site_language: "ko" },
          required: false,
        },
      ],
    });

    res.ok(awardSectorDetails);
  } catch (error) {
    next(error);
  }
};
