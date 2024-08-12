import { tmdbService } from "../../../services/index.js";

/**
 * getTitleCredits
 * used for developer purpose
 * @param req
 * @param res
 * @param next
 */
export const getTitleCredits = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    const listType = reqBody.list_type ? reqBody.list_type : null;
    const tmdbId = reqBody.title_id ? reqBody.title_id : "";
    const language = reqBody.language ? reqBody.language : "en";
    let data = [];
    if (tmdbId) {
      data = await tmdbService.fetchTitleCredits(type, tmdbId, listType, language);
    }
    res.ok(data);
  } catch (error) {
    next(error);
  }
};
