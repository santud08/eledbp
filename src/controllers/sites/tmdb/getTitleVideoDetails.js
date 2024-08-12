import { tmdbService } from "../../../services/index.js";

/**
 * getTitleVideoDetails
 * used for developer purpose
 * @param req
 * @param res
 * @param next
 */
export const getTitleVideoDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    const tmdbId = reqBody.title_id ? reqBody.title_id : "";
    const language = reqBody.language ? reqBody.language : "en";
    let data = [];
    if (tmdbId) {
      data = await tmdbService.fetchTitleVideos(type, tmdbId, language);
    }
    res.ok(data);
  } catch (error) {
    next(error);
  }
};
