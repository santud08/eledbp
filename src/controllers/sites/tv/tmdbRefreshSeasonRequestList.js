import { tmdbService } from "../../../services/index.js";
import model from "../../../models/index.js";

/**
 * tmdbRefreshSeasonRequestList
 * @param req
 * @param res
 */
export const tmdbRefreshSeasonRequestList = async (req, res, next) => {
  try {
    const siteLanguage = req.body.site_language ? req.body.site_language : "en";
    const tmdbId = req.body.tmdb_id;
    const titleId = req.body.title_id;

    let normalSeason = [];
    let specialSeason = [];
    if (tmdbId) {
      const language = siteLanguage;
      const tmdbData = await tmdbService.fetchTvSeasons(tmdbId, language);

      if (tmdbData && tmdbData.results && tmdbData.results.length > 0) {
        for (const value of tmdbData.results) {
          if (value.season_number != 0) {
            let requiredFormat = {
              draft_season_id: "",
              season_no: value.season_number,
              season_name: value.season_name,
              total_episode: value.no_of_episode,
              release_date: value.release_date,
              release_date_to: null,
            };
            const seasonDetails = await model.season.findOne({
              where: {
                title_id: titleId,
                number: value.season_number,
                status: "active",
              },
            });
            requiredFormat.season_id = seasonDetails && seasonDetails.id ? seasonDetails.id : "";
            normalSeason.push(requiredFormat);
          } else {
            let requiredFormat = {
              draft_season_id: "",
              season_no: value.season_number,
              season_name: value.season_name,
              total_episode: value.no_of_episode,
              release_date: value.release_date,
              release_date_to: null,
            };
            const seasonDetails = await model.season.findOne({
              where: {
                title_id: titleId,
                number: value.season_number,
                status: "active",
              },
            });
            requiredFormat.season_id = seasonDetails && seasonDetails.id ? seasonDetails.id : "";
            specialSeason.push(requiredFormat);
          }
        }
      }
    }
    // ordering the season in descending order
    if (normalSeason.length > 0) {
      normalSeason.sort((a, b) => b.season_no - a.season_no);
    }

    const resultArray = [...normalSeason, ...specialSeason];
    res.ok({ tmdb_id: tmdbId, draft_relation_id: "", draft_request_id: "", results: resultArray });
  } catch (error) {
    next(error);
  }
};
