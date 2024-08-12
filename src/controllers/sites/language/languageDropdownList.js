import model from "../../../models/index.js";

/**
 * languageDropdownList
 * @param req
 * @param res
 */
export const languageDropdownList = async (req, res, next) => {
  try {
    let data = [];
    // Fetching the list of languages in "localization" table
    const languageList = await model.localization.findAll({ where: { status: "active" } });

    if (languageList.length > 0) {
      for (let element of languageList) {
        let requiredFormat = {
          language_name: element.name,
          language_code: element.code,
        };
        data.push(requiredFormat);
      }
      res.ok({ results: data });
    } else {
      res.ok({
        results: res.__("no data found"),
      });
    }
  } catch (error) {
    next(error);
  }
};
