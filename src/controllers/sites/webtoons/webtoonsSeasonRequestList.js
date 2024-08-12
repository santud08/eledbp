import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * webtoonsSeasonRequestList
 * @param req
 * @param res
 */
export const webtoonsSeasonRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.query.draft_request_id;
    const siteLanguage = req.query.site_language;

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: "webtoons",
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    // find requestId and seasonId is present in request table
    const findAllSeasonRequest = await model.titleRequestSeasonDetails.findAll({
      where: {
        request_id: requestId,
        status: "active",
      },
    });
    let normalSeason = [];
    let specialSeason = [];
    if (findAllSeasonRequest.length > 0) {
      for (const value of findAllSeasonRequest) {
        const parsedSeasonDetails = JSON.parse(value.dataValues.season_details);
        if (parsedSeasonDetails.number != 0) {
          const requiredFormat = {
            draft_request_id: value.dataValues.request_id,
            draft_season_id: value.dataValues.id,
            season_no: parsedSeasonDetails.number,
            season_name: parsedSeasonDetails.season_name,
            total_episode: parsedSeasonDetails.episode_count,
            release_date: parsedSeasonDetails.release_date,
            release_date_to: parsedSeasonDetails.release_date_to,
            tmdb_id: parsedSeasonDetails.title_tmdb_id ? parsedSeasonDetails.title_tmdb_id : "",
          };
          normalSeason.push(requiredFormat);
        } else {
          const requiredFormat = {
            draft_request_id: value.dataValues.request_id,
            draft_season_id: value.dataValues.id,
            season_no: parsedSeasonDetails.number,
            season_name: parsedSeasonDetails.season_name,
            total_episode: parsedSeasonDetails.episode_count,
            release_date: parsedSeasonDetails.release_date,
            release_date_to: parsedSeasonDetails.release_date_to,
            tmdb_id: parsedSeasonDetails.title_tmdb_id ? parsedSeasonDetails.title_tmdb_id : "",
          };
          specialSeason.push(requiredFormat);
        }
      }
    }
    // ordering the season in descending order
    if (normalSeason.length > 0) {
      normalSeason.sort((a, b) => b.season_no - a.season_no);
    }

    const resultArray = [...normalSeason, ...specialSeason];
    res.ok({ results: resultArray });
  } catch (error) {
    next(error);
  }
};
