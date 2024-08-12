import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
/**
 * editSeasonRequestList
 * @param req
 * @param res
 */
export const editSeasonRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const siteLanguage = req.body.site_language;
    let titleId = req.body.title_id ? req.body.title_id : "";

    // For TMDB ID in edit section:
    let tmdbId = "";

    // get relationID from Request Table
    let getRelationData = {};
    if (requestId) {
      getRelationData = await model.titleRequestPrimaryDetails.findOne({
        where: {
          id: requestId,
          record_status: "active",
        },
      });
    }
    const relationId =
      getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "";
    tmdbId = getRelationData && getRelationData.tmdb_id ? getRelationData.tmdb_id : "";

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
        if (value.dataValues && value.dataValues.season_details) {
          const parsedSeasonDetails = JSON.parse(value.dataValues.season_details);
          if (parsedSeasonDetails.number != 0) {
            let requiredFormat = {
              draft_request_id: value.dataValues.request_id,
              draft_season_id: value.dataValues.id,
              season_id: value.dataValues.season_id,
              season_no: parsedSeasonDetails.number,
              season_name: parsedSeasonDetails.season_name,
              total_episode: parsedSeasonDetails.episode_count,
              release_date: parsedSeasonDetails.release_date,
              release_date_to: parsedSeasonDetails.release_date_to,
            };
            normalSeason.push(requiredFormat);
          } else {
            let requiredFormat = {
              draft_request_id: value.dataValues.request_id,
              draft_season_id: value.dataValues.id,
              season_id: value.dataValues.season_id,
              season_no: parsedSeasonDetails.number,
              season_name: parsedSeasonDetails.season_name,
              total_episode: parsedSeasonDetails.episode_count,
              release_date: parsedSeasonDetails.release_date,
              release_date_to: parsedSeasonDetails.release_date_to,
            };
            specialSeason.push(requiredFormat);
          }
        }
      }
    } else if (titleId) {
      const titleDetails = await model.title.findOne({
        where: {
          id: titleId,
          record_status: "active",
        },
      });
      if (!titleDetails) throw StatusError.badRequest(res.__("Invalid Title id"));

      // Send TMDB id in response
      tmdbId = titleDetails && titleDetails.tmdb_id ? titleDetails.tmdb_id : "";

      const seasonDetails = await model.season.findAll({
        where: {
          title_id: titleId,
          status: "active",
        },
        include: [
          {
            model: model.seasonTranslation,
            attributes: ["season_name", "summary", "site_language"],
            where: { status: "active" },
            left: true,
            separate: true,
            order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
          },
        ],
      });

      if (seasonDetails) {
        for (const value of seasonDetails) {
          if (value) {
            if (value.number != 0) {
              const seasonName =
                value.seasonTranslations &&
                value.seasonTranslations[0] &&
                value.seasonTranslations[0].season_name
                  ? value.seasonTranslations[0].season_name
                  : "";
              let requiredFormat = {
                season_id: value.id,
                draft_season_id: "",
                season_no: value.number,
                season_name: seasonName,
                total_episode: value.episode_count,
                release_date: value.release_date,
                release_date_to: value.release_date_to,
              };
              normalSeason.push(requiredFormat);
            } else {
              const seasonName =
                value.seasonTranslations &&
                value.seasonTranslations[0] &&
                value.seasonTranslations[0].season_name
                  ? value.seasonTranslations[0].season_name
                  : "";
              let requiredFormat = {
                season_id: value.id,
                draft_season_id: "",
                season_no: value.number,
                season_name: seasonName,
                total_episode: value.episode_count,
                release_date: value.release_date,
                release_date_to: value.release_date_to,
              };
              specialSeason.push(requiredFormat);
            }
          }
        }
      }
    }
    // ordering the season in descending order
    if (normalSeason.length > 0) {
      normalSeason.sort((a, b) => b.season_no - a.season_no);
    }

    const resultArray = [...normalSeason, ...specialSeason];
    res.ok({
      tmdb_id: tmdbId,
      draft_relation_id: relationId,
      draft_request_id: requestId,
      results: resultArray,
    });
  } catch (error) {
    next(error);
  }
};
