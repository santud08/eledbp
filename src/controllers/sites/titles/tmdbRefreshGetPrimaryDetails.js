import { titleService } from "../../../services/index.js";

/**
 * tmdbRefreshGetPrimaryDetails
 * @param req
 * @param res
 */
export const tmdbRefreshGetPrimaryDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const titleId = reqBody.title_id;
    const siteLanguage = reqBody.site_language;
    const tmdbId = reqBody.tmdb_id;
    const titleType = reqBody.title_type; // movie, tv

    const reqId = "";
    const creditReqId = "";
    const mediaReqId = "";
    const tagReqId = "";
    const relationId = "";
    const seasonRequestId = "";
    const episodeRequestId = "";

    let resObject = {};

    if (titleType == "movie" && tmdbId) {
      const movieResponse = await titleService.getTmdbRefreshMovieData(
        tmdbId,
        titleId,
        siteLanguage,
      );

      movieResponse.request_id = reqId;
      movieResponse.relation_id = relationId;
      movieResponse.credit_request_id = creditReqId;
      movieResponse.media_request_id = mediaReqId;
      movieResponse.tag_request_id = tagReqId;

      resObject = { ...movieResponse };
    }

    if (titleType == "tv") {
      const tvResponse = await titleService.getTmdbRefreshTvData(tmdbId, titleId, siteLanguage);

      tvResponse.request_id = reqId;
      tvResponse.relation_id = relationId;
      tvResponse.credit_request_id = creditReqId;
      tvResponse.media_request_id = mediaReqId;
      tvResponse.tag_request_id = tagReqId;
      tvResponse.season_request_id = seasonRequestId;
      tvResponse.episode_request_id = episodeRequestId;
      resObject = { ...tvResponse };
    }

    res.ok({ ...resObject });
  } catch (error) {
    next(error);
  }
};
