import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { tmdbService } from "../../../services/index.js";

/**
 * getTvRequestEpisodeDetails
 * @param req
 * @param res
 */
export const getTvRequestEpisodeDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid request id"));
    }
    if (!reqBody.episode_number && reqBody.episode_number == "undefined") {
      throw StatusError.badRequest(res.__("Invalid episode number"));
    }
    const requestId = reqBody.id; //It will be request id
    const episodeId = req.query.episode_id; //It will be episode id
    const episodeNumber = req.query.episode_number; //It will be episode number
    const language = req.query.language ? req.query.language : "en";
    const tmdbId = req.query.tmdb_id ? req.query.tmdb_id : "";
    const seasonNo = req.query.season_no
      ? req.query.season_no
      : req.query.season_no == 0
      ? true
      : false;
    let getEpisode = [];

    let getEpisodeInformations = {};
    if (episodeId) {
      getEpisodeInformations = await model.titleRequestEpisodeDetails.findOne({
        attributes: ["id", "episode_details"],
        where: { id: episodeId, status: "active" },
      });
    }

    let list = [];
    if (getEpisodeInformations.episode_details) {
      // Get Episode details
      const getEpisodeDetails = JSON.parse(getEpisodeInformations.episode_details);
      for (const episode of getEpisodeDetails.list) {
        if (episode && episode.episode_number == episodeNumber) {
          const episodeNumber = episode.episode_number ? episode.episode_number : "";
          const episodeTitle = episode.name ? episode.name : "";
          const image = episode.poster ? episode.poster : "";
          const date = episode.release_date ? episode.release_date : "";
          const overview = episode.description ? episode.description : "";
          const record = {
            episode_no: episodeNumber,
            episode_title: episodeTitle,
            image: image,
            date: date,
            overview: overview,
          };
          list.push(record);
        }
        getEpisode = list;
      }
    } else if (tmdbId && seasonNo && episodeNumber) {
      const tmdbEpisodeData = await tmdbService.fetchTvSeasonEpisodeDetails(
        tmdbId,
        seasonNo,
        episodeNumber,
        language,
      );
      if (tmdbEpisodeData && tmdbEpisodeData.results) {
        const episodeObj = tmdbEpisodeData.results;
        const record = {
          episode_no: episodeObj.episode_number,
          episode_title: episodeObj.episode_name,
          image: episodeObj.poster_image,
          date: episodeObj.release_date,
          overview: episodeObj.overview,
        };
        list.push(record);
      }
      getEpisode = list;
    }

    res.ok({
      request_id: requestId,
      result: getEpisode,
    });
  } catch (error) {
    next(error);
  }
};
