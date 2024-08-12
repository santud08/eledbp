import model from "../../../models/index.js";
import { tmdbService } from "../../../services/index.js";

/**
 * tmdbRefreshEpisodeRequestList
 * @param req
 * @param res
 */
export const tmdbRefreshEpisodeRequestList = async (req, res, next) => {
  try {
    const siteLanguage = req.body.site_language;
    const seasonId = req.body.season_id ? req.body.season_id : "";
    const searchText = req.body.search_text ? req.body.search_text : "";
    const tmdbId = req.body.tmdb_id;
    const titleId = req.body.title_id;
    const seasonNo = req.body.season_no;

    let data = [];
    // get tmdb Episode Data
    if (seasonNo) {
      const tmdbEpisodeData = await tmdbService.fetchTvSeasonEpisodes(
        tmdbId,
        seasonNo,
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
                title_id: titleId,
                season_id: seasonId,
                draft_request_id: "",
                draft_episode_id: "",
                draft_season_id: "",
                episode_title: value.episode_name,
                episode_summary: value.overview,
                episode_number: value.episode_number,
                episode_date: value.release_date,
                episode_image: value.poster_image,
              };
              let episodeId = "";
              const episodeData = await model.episode.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  season_id: seasonId,
                  episode_number: value.episode_number,
                  status: "active",
                },
              });
              if (episodeData) {
                episodeId = episodeData.id ? episodeData.id : "";
              }
              requiredFormat.id = episodeId;
              data.push(requiredFormat);
            }
          }
        }
      }
    }

    res.ok({ draft_relation_id: "", results: data });
  } catch (error) {
    next(error);
  }
};
