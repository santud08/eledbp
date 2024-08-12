import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Sequelize, Op } from "sequelize";
import { tmdbService } from "../../../services/index.js";

/**
 * episodeRequestList
 * @param req
 * @param res
 */
export const episodeRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let data = [];
    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;
    const seasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const searchText = req.body.search_text ? req.body.search_text : "";

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: "tv",
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    const tmdbId = findRequestId.tmdb_id ? findRequestId.tmdb_id : "";

    // Get all the season no from the request table:

    let condition = {};
    if (seasonId) {
      if (searchText && searchText != "") {
        condition = {
          request_id: requestId,
          request_season_id: seasonId,
          status: "active",
          [Op.and]: [Sequelize.where(Sequelize.col("episode_details"), Op.like, `%${searchText}%`)],
        };
      } else {
        condition = {
          request_id: requestId,
          request_season_id: seasonId,
          status: "active",
        };
      }
    }
    const findAllEpisodeRequest = await model.titleRequestEpisodeDetails.findAll({
      attributes: [
        "id",
        "request_id",
        "request_season_id",
        [Sequelize.json("episode_details.list"), "episode_details_list"],
      ],
      where: condition,
    });
    if (findAllEpisodeRequest.length > 0) {
      for (const value of findAllEpisodeRequest) {
        const parsedEpisodeDetails =
          value && value.dataValues && value.dataValues.episode_details_list
            ? JSON.parse(value.dataValues.episode_details_list)
            : "";
        if (parsedEpisodeDetails && parsedEpisodeDetails != "" && searchText && searchText != "") {
          const fparsedEpisodeDetails = parsedEpisodeDetails.filter(
            (obj) =>
              obj.name.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
              obj.description.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
              obj.episode_number == searchText,
          );
          for (const episodeData of fparsedEpisodeDetails) {
            let requiredFormat = {
              draft_request_id: value.dataValues.request_id,
              draft_season_id: value.dataValues.request_season_id,
              draft_episode_id: value.dataValues.id,
              episode_title: episodeData.name,
              episode_summary: episodeData.description,
              episode_number: episodeData.episode_number,
              episode_date: episodeData.release_date,
              episode_image: episodeData.poster,
              season_no: episodeData.season_number ? episodeData.season_number : "",
              tmdb_id: tmdbId,
            };
            data.push(requiredFormat);
          }
        } else if (parsedEpisodeDetails && parsedEpisodeDetails != "") {
          for (const episodeData of parsedEpisodeDetails) {
            let requiredFormat = {
              draft_request_id: value.dataValues.request_id,
              draft_season_id: value.dataValues.request_season_id,
              draft_episode_id: value.dataValues.id,
              episode_title: episodeData.name,
              episode_summary: episodeData.description,
              episode_number: episodeData.episode_number,
              episode_date: episodeData.release_date,
              episode_image: episodeData.poster,
              season_no: episodeData.season_number ? episodeData.season_number : "",
              tmdb_id: tmdbId,
            };
            data.push(requiredFormat);
          }
        }
      }
    } else if (tmdbId) {
      // Fetch all the data from season table with respect to request ID
      const findAllSeasonRequest = await model.titleRequestSeasonDetails.findOne({
        where: {
          request_id: requestId,
          status: "active",
          id: seasonId,
        },
      });
      const parsedSeasonDetails =
        findAllSeasonRequest &&
        findAllSeasonRequest.dataValues &&
        findAllSeasonRequest.dataValues.season_details
          ? JSON.parse(findAllSeasonRequest.dataValues.season_details)
          : "";
      const seasonRequestNumber =
        parsedSeasonDetails && parsedSeasonDetails.number
          ? parsedSeasonDetails.number
          : parsedSeasonDetails.number == 0
          ? true
          : false;

      // get tmdb Episode Data
      if (seasonRequestNumber) {
        const tmdbEpisodeData = await tmdbService.fetchTvSeasonEpisodes(
          tmdbId,
          seasonRequestNumber,
          siteLanguage,
        );
        if (tmdbEpisodeData && tmdbEpisodeData.results && tmdbEpisodeData.results.length > 0) {
          // Search filter Option
          const filterValue = tmdbEpisodeData.results.filter(
            (obj) =>
              obj.episode_name.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
              obj.overview.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
              obj.episode_number == searchText,
          );

          if (filterValue) {
            for (const value of filterValue) {
              if (value) {
                let requiredFormat = {
                  draft_request_id: requestId,
                  draft_season_id: seasonId,
                  draft_episode_id: "",
                  episode_title: value.episode_name,
                  episode_summary: value.overview,
                  episode_number: value.episode_number,
                  episode_date: value.release_date,
                  episode_image: value.poster_image,
                  season_no: value.season_number,
                  tmdb_id: tmdbId,
                };
                data.push(requiredFormat);
              }
            }
          }
        }
      }
    }
    res.ok({ results: data });
  } catch (error) {
    next(error);
  }
};
