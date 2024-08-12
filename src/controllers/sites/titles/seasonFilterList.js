import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * seasonFilterList
 * @param req
 * @param res
 */
export const seasonFilterList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let data = [];
    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;
    const titleType = req.body.type ? req.body.type : "tv";
    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: titleType,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    // Fetch all the data from season table with respect to request ID
    const findAllSeasonRequest = await model.titleRequestSeasonDetails.findAll({
      attributes: ["id", "season_details", "request_id", "season_no"],
      where: {
        request_id: requestId,
        status: "active",
      },
      order: [["season_no", "DESC"]],
    });

    if (findAllSeasonRequest.length > 0) {
      for (const value of findAllSeasonRequest) {
        if (value && value.dataValues) {
          const parsedSeasonDetails = JSON.parse(value.dataValues.season_details);
          let requiredFormat = {
            draft_request_id: value.dataValues.request_id,
            draft_season_id: value.dataValues.id,
            season_no: parsedSeasonDetails.number,
          };
          data.push(requiredFormat);
        }
      }
    }
    res.ok({ results: data });
  } catch (error) {
    next(error);
  }
};
