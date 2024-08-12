import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Op, Sequelize } from "sequelize";

/**
 * awardInfo
 * @param req
 * @param res
 */
export const awardInfo = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const awardId = reqBody.award_id;
    if (!awardId && awardId == "undefined") {
      throw StatusError.badRequest(res.__("Invalid award id"));
    }

    const language = req.accept_language;
    // check award id exists or not
    const getAwardId = await model.awards.findOne({
      where: { status: { [Op.ne]: "deleted" }, id: awardId },
      attributes: ["id"],
    });
    if (!getAwardId) throw StatusError.badRequest(res.__("Invalid award id"));

    const getAwardDetails = await model.awards.findOne({
      attributes: [
        "id",
        "type",
        [
          Sequelize.fn("IFNULL", Sequelize.col("awardTranslationOne.award_name"), ""),
          "award_name_en",
        ],
        [
          Sequelize.fn("IFNULL", Sequelize.col("awardTranslationOnel.award_name"), ""),
          "award_name_ko",
        ],
        "country_id",
        [
          Sequelize.fn(
            "IFNULL",
            Sequelize.col("countryOne.countryTranslationOne.country_name"),
            "",
          ),
          "country_name",
        ],
        "city_name",
        "place",
        "event_month",
        "news_search_keyword",
        "website_url",
        [Sequelize.fn("IFNULL", Sequelize.col("awardImageOne.url"), ""), "award_poster"],
        [
          Sequelize.fn("IFNULL", Sequelize.col("awardTranslationOne.award_explanation"), ""),
          "explanation_en",
        ],
        [
          Sequelize.fn("IFNULL", Sequelize.col("awardTranslationOnel.award_explanation"), ""),
          "explanation_ko",
        ],
      ],
      where: {
        id: awardId,
        status: "active",
      },
      include: [
        {
          model: model.awardTranslation,
          as: "awardTranslationOne",
          attributes: [],
          left: true,
          where: { status: { [Op.ne]: "deleted" }, site_language: "en" },
          required: true,
        },
        {
          model: model.awardTranslation,
          as: "awardTranslationOnel",
          attributes: [],
          left: true,
          where: { status: { [Op.ne]: "deleted" }, site_language: "ko" },
          required: false,
        },
        {
          model: model.awardImages,
          as: "awardImageOne",
          attributes: [],
          left: true,
          where: { status: { [Op.ne]: "deleted" } },
          required: false,
        },
        {
          model: model.country,
          as: "countryOne",
          attributes: [],
          left: true,
          where: {
            status: { [Op.ne]: "deleted" },
          },
          required: true,
          include: [
            {
              model: model.countryTranslation,
              as: "countryTranslationOne",
              attributes: ["country_name"],
              left: true,
              where: {
                status: { [Op.ne]: "deleted" },
                site_language: language,
              },
              required: true,
            },
          ],
        },
      ],
    });

    res.ok(getAwardDetails);
  } catch (error) {
    next(error);
  }
};
