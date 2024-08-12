import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Sequelize, fn } from "sequelize";
import { generalHelper } from "../../../helpers/index.js";

/**
 * registered country list
 * @param req
 * @param res
 * @param next
 */
export const registeredCountryList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const type = reqBody.type; //It will be movie/tv/people
    const typeArray = ["movie", "tv", "people"];
    if (!typeArray.includes(type)) {
      throw StatusError.badRequest(res.__("Please send type movie/tv/people"));
    }
    let countryList = [];
    const language = req.accept_language;
    const swipLanguage = await generalHelper.swipeLanguage(language);
    // Title (movie/tv) country list
    if (type == "movie" || type == "tv") {
      countryList = await model.titleCountries.findAll({
        attributes: [
          [Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""), "id"],
          [
            Sequelize.fn(
              "IFNULL",
              fn(
                "getCountryTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""),
                language,
              ),
              fn(
                "getCountryTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""),
                swipLanguage,
              ),
            ),
            "country_name",
          ],
        ],
        where: { status: "active" },
        left: true,
        required: true,
        include: [
          {
            model: model.title,
            attributes: [],
            where: { type: type, record_status: "active" },
            left: true,
            required: true,
          },
          {
            model: model.country,
            left: true,
            attributes: [],
            where: { status: "active" },
          },
        ],
        group: ["titleCountries.country_id"],
      });
    }
    // People country list
    if (type == "people") {
      countryList = await model.peopleCountries.findAll({
        attributes: [
          [Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""), "id"],
          [
            Sequelize.fn(
              "IFNULL",
              fn(
                "getCountryTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""),
                language,
              ),
              fn(
                "getCountryTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""),
                swipLanguage,
              ),
            ),
            "country_name",
          ],
        ],
        where: { status: "active" },
        left: true,
        required: true,
        include: [
          {
            model: model.people,
            attributes: [],
            where: { status: "active" },
            left: true,
            required: true,
          },
          {
            model: model.country,
            left: true,
            attributes: [],
            where: { status: "active" },
          },
        ],
        group: ["peopleCountries.country_id"],
      });
    }

    res.ok({
      results: countryList,
    });
  } catch (error) {
    next(error);
  }
};
