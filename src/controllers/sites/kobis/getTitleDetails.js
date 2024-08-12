import { kobisService } from "../../../services/index.js";

/**
 * getTitleDetails
 * for developer testing purpose
 * @param req
 * @param res
 * @param next
 */
export const getTitleDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    const kobisId = reqBody.title_id ? reqBody.title_id : "";
    const language = reqBody.language ? reqBody.language : "en";
    let data = [];
    if (kobisId) {
      data = await kobisService.fetchTitleDetails(type, kobisId, language);
    }
    res.ok(data);
  } catch (error) {
    next(error);
  }
};
