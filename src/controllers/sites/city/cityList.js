import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * city list
 * @param req
 * @param res
 * @param next
 */
export const cityList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const countryId = reqBody.country_id ? reqBody.country_id : "";
    const searchText = reqBody.search_text ? reqBody.search_text : "";
    const language = req.accept_language;
    let getCityList = [];
    const conditions = { site_language: language, status: { [Op.ne]: "deleted" } };
    if (searchText) conditions.city_name = { [Op.like]: `%${searchText}%` };
    const getCountryId = await model.country.findOne({
      attributes: ["id"],
      where: { id: countryId, status: { [Op.ne]: "deleted" } },
    });
    if (!getCountryId) throw StatusError.badRequest(res.__("Invalid country id"));

    const cityList = await model.city.findAll({
      attributes: ["id", "country_id"],
      where: { country_id: countryId, status: "active" },
      include: [
        {
          model: model.cityTranslations,
          attributes: ["city_id", "city_name", "site_language"],
          left: true,
          where: conditions,
          required: true,
        },
      ],
    });
    if (cityList) {
      let list = [];
      for (const eachRow of cityList) {
        if (eachRow) {
          const record = {
            city_id:
              eachRow.cityTranslations && eachRow.cityTranslations[0].city_id
                ? eachRow.cityTranslations[0].city_id
                : "",
            city_name:
              eachRow.cityTranslations && eachRow.cityTranslations[0].city_name
                ? eachRow.cityTranslations[0].city_name
                : "",
          };
          list.push(record);
        }
      }
      getCityList = list;
    }
    res.ok({
      results: getCityList ? getCityList : "",
    });
  } catch (error) {
    next(error);
  }
};
