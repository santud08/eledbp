import { titleService } from "../../../services/index.js";

/**
 * tmdbRefreshGetCreditDetails
 * @param req
 * @param res
 */
export const tmdbRefreshGetCreditDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const titleId = reqBody.title_id;
    const tmdbId = reqBody.tmdb_id;
    const titleType = reqBody.title_type; // movie, tv
    const siteLanguage = reqBody.site_language;
    const creditType = reqBody.credit_type;
    const seasonNumber = reqBody.season_no ? reqBody.season_no : "";
    const seasonId = reqBody.season_id ? reqBody.season_id : "";

    let resObject = {};

    // req id's
    const reqId = "";
    const draftSeasonId = "";
    const relationId = "";
    const draftCreditId = "";
    // need to check whether TMDB ID can be changed ? If yes - no need of validation, otherwise need validation

    if (tmdbId) {
      const creditResponse = await titleService.getTmdbRefreshCreditData(
        tmdbId,
        creditType,
        titleId,
        titleType,
        siteLanguage,
        seasonNumber,
        seasonId,
      );
      creditResponse.draft_relation_id = relationId;
      creditResponse.draft_request_id = reqId;
      creditResponse.draft_season_id = draftSeasonId;
      creditResponse.season_id = seasonId;
      creditResponse.draft_credit_id = draftCreditId;

      resObject = { ...creditResponse };
    }

    res.ok({ ...resObject });
  } catch (error) {
    next(error);
  }
};
