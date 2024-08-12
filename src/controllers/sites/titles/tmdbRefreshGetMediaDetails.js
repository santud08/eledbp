import { titleService } from "../../../services/index.js";

/**
 * tmdbRefreshGetMediaDetails
 * @param req
 * @param res
 */
export const tmdbRefreshGetMediaDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const titleId = reqBody.title_id;
    const tmdbId = reqBody.tmdb_id;
    const titleType = reqBody.title_type; // movie, tv
    const siteLanguage = reqBody.site_language;
    const mediaType = reqBody.media_type;
    const seasonNumber = reqBody.season_no ? reqBody.season_no : "";
    const seasonId = reqBody.season_id ? reqBody.season_id : "";

    let resObject = {};

    // req id's
    const reqId = "";
    const seasonID = seasonId;
    const draftSeasonId = "";
    const relationId = "";
    const draftMediaId = "";
    // need to check whether TMDB ID can be changed ? If yes - no need of validation, otherwise need validation

    if (tmdbId) {
      const mediaResponse = await titleService.getTmdbRefreshMediaData(
        tmdbId,
        mediaType,
        titleId,
        titleType,
        siteLanguage,
        seasonNumber,
        seasonId,
      );
      mediaResponse.draft_relation_id = relationId;
      mediaResponse.draft_request_id = reqId;
      mediaResponse.draft_season_id = draftSeasonId;
      mediaResponse.season_id = seasonID;
      mediaResponse.draft_media_id = draftMediaId;

      resObject = { ...mediaResponse };
    }

    res.ok({ ...resObject });
  } catch (error) {
    next(error);
  }
};
