import { peopleService } from "../../../services/index.js";

/**
 * tmdbRefreshMediaList
 * @param req
 * @param res
 */
export const tmdbRefreshMediaList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const peopleId = reqBody.people_id;
    const tmdbId = reqBody.tmdb_id;
    const siteLanguage = reqBody.site_language;
    const mediaType = reqBody.media_type;

    let resObject = {};

    if (tmdbId) {
      const mediaResponse = await peopleService.getTmdbRefreshMediaData(
        tmdbId,
        mediaType,
        peopleId,
        siteLanguage,
      );
      mediaResponse.draft_request_id = "";
      mediaResponse.draft_media_id = "";

      resObject = { ...mediaResponse };
    }

    res.ok({ ...resObject });
  } catch (error) {
    next(error);
  }
};
