import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * editSeasonFilterList
 * @param req
 * @param res
 */
export const editSeasonFilterList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let data = [];
    const titleId = req.body.title_id;
    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";

    // Fetch all the data from season table with respect to request ID
    const findAllSeasonRequest = await model.titleRequestSeasonDetails.findAll({
      attributes: ["id", "season_details", "request_id", "season_no", "season_id"],
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
            season_id: value.dataValues.season_id,
            season_no: parsedSeasonDetails.number,
          };
          data.push(requiredFormat);
        }
      }
    } else if (titleId) {
      const seasonList = await model.season.findAll({
        attributes: ["id", "number"],
        where: {
          title_id: titleId,
          status: "active",
        },
        order: [["number", "DESC"]],
      });
      if (seasonList.length > 0) {
        for (const value of seasonList) {
          if (value) {
            let requiredFormat = {
              draft_request_id: "",
              draft_season_id: "",
              season_id: value.id,
              season_no: value.number,
            };
            data.push(requiredFormat);
          }
        }
      }
    }
    res.ok({ results: data });
  } catch (error) {
    next(error);
  }
};
