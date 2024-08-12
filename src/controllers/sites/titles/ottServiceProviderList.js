import model from "../../../models/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * ottServiceProviderList
 * @param req
 * @param res
 */
export const ottServiceProviderList = async (req, res, next) => {
  try {
    const type = req.query.type ? req.query.type : "";
    let data = [];
    let condition = {
      status: "active",
    };
    if (type) condition.available_for = { [Op.like]: `%${type}%` };

    // Fetching the list of languages in "localization" table
    const ottList = await model.ottServiceProvider.findAll({
      where: condition,
    });
    if (ottList.length > 0) {
      for (let element of ottList) {
        let requiredFormat = {
          ott_service_provider_id: element.id,
          ott_service_provider_name: element.ott_name,
          ott_service_provider_url: element.provider_url,
          ott_logo_path:
            type == "webtoons" && element.logo_path
              ? await generalHelper.generateWtLogoUrl(req, element.logo_path)
              : element.logo_path
              ? await generalHelper.generateOttLogoUrl(req, element.logo_path)
              : "",
        };
        data.push(requiredFormat);
      }
    }
    res.ok({ results: data });
  } catch (error) {
    next(error);
  }
};
