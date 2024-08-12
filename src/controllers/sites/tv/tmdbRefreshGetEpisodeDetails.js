import { tmdbService } from "../../../services/index.js";

/**
 * tmdbRefreshGetEpisodeDetails
 * @param req
 * @param res
 */
export const tmdbRefreshGetEpisodeDetails = async (req, res, next) => {
  try {
    const titleId = req.query.title_id;
    const tmdbId = req.query.tmdb_id;
    const seasonNo = req.query.season_no;
    const seasonId = req.query.season_id;
    const episodeId = req.query.episode_id ? req.query.episode_id : ""; //It will be episode id
    const episodeNumber = req.query.episode_number ? req.query.episode_number : ""; //It will be episode number
    const language = req.query.language;
    let getEpisode = [];

    if (tmdbId && seasonNo && episodeNumber) {
      const tmdbEpisodeData = await tmdbService.fetchTvSeasonEpisodeDetails(
        tmdbId,
        seasonNo,
        episodeNumber,
        language,
      );
      if (tmdbEpisodeData && tmdbEpisodeData.results) {
        const episodeObj = tmdbEpisodeData.results;
        const record = {
          episode_id: episodeId,
          episode_no: episodeObj.episode_number,
          episode_title: episodeObj.episode_name,
          image: episodeObj.poster_image,
          date: episodeObj.release_date,
          overview: episodeObj.overview,
        };
        getEpisode.push(record);
      }
    }

    res.ok({
      title_id: titleId,
      request_id: "",
      draft_season_id: "",
      season_id: seasonId,
      episode_id: episodeId,
      draft_episode_id: "",
      result: getEpisode,
    });
  } catch (error) {
    next(error);
  }
};
