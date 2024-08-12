import model from "../../../models/index.js";

/**
 * country list
 * @param req
 * @param res
 * @param next
 */
export const countryList = async (req, res, next) => {
  try {
    let getCountryList = [];
    const language = req.accept_language;
    let countryList = await model.country.findAll({
      attributes: ["id", "country_name"],
      where: { status: "active" },
      include: [
        {
          model: model.countryTranslation,
          attributes: ["country_id", "country_name", "site_language"],
          left: true,
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
    });

    if (countryList) {
      let list = [];
      for (const eachRow of countryList) {
        if (eachRow) {
          let record = {
            id: eachRow.countryTranslations[0].country_id
              ? eachRow.countryTranslations[0].country_id
              : "",
            country_name: eachRow.countryTranslations[0].country_name
              ? eachRow.countryTranslations[0].country_name
              : "",
          };
          list.push(record);
        }
      }
      getCountryList = list;
    }
    res.ok({
      results: getCountryList ? getCountryList : "",
    });
  } catch (error) {
    next(error);
  }
};
