import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { StatusError } from "../../../config/index.js";

/**
 * sectorList
 * @param req
 * @param res
 */
export const sectorList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const searchText = reqBody.search_text ? reqBody.search_text : "";
    const language = req.accept_language;
    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const conditions = { award_id: awardId, status: { [Op.ne]: "deleted" } };
    if (searchText) {
      conditions[Op.or] = [
        { "$awardSectorTranslationsOne.division_name$": { [Op.like]: `%${searchText}%` } },
        { "$awardSectorTranslationsOnel.division_name$": { [Op.like]: `%${searchText}%` } },
      ];
    } else {
      conditions[Op.or] = [
        { "$awardSectorTranslationsOne.division_name$": { [Op.ne]: null } },
        { "$awardSectorTranslationsOnel.division_name$": { [Op.ne]: null } },
      ];
    }

    const awardSectors = await model.awardSectors.findAll({
      attributes: [
        ["id", "sector_id"],
        [
          Sequelize.literal(
            `( CASE WHEN "${language}"="en" 
          THEN CASE 
          WHEN  awardSectorTranslationsOne.division_name IS NOT NULL THEN awardSectorTranslationsOne.division_name 
          WHEN awardSectorTranslationsOnel.division_name IS NOT NULL THEN awardSectorTranslationsOnel.division_name
          ELSE "" END 
          ELSE CASE 
          WHEN awardSectorTranslationsOnel.division_name IS NOT NULL THEN awardSectorTranslationsOnel.division_name
          WHEN  awardSectorTranslationsOne.division_name IS NOT NULL THEN awardSectorTranslationsOne.division_name
          ELSE "" END END)`,
          ),
          "sector_name",
        ],
      ],
      where: conditions,
      include: [
        {
          model: model.awardSectorTranslations,
          as: "awardSectorTranslationsOne",
          attributes: [],
          left: true,
          where: { site_language: "en", status: "active" },
          required: false,
        },
        {
          model: model.awardSectorTranslations,
          as: "awardSectorTranslationsOnel",
          attributes: [],
          left: true,
          where: { site_language: "ko", status: "active" },
          required: false,
        },
      ],
      order: [["id", "desc"]],
    });

    res.ok({
      results: awardSectors,
    });
  } catch (error) {
    next(error);
  }
};
