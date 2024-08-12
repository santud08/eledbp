import { kobisService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * searchTitle
 * for developer testing purpose
 * @param req
 * @param res
 * @param next
 */
export const searchTitle = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    const searchText = reqBody.search_text ? reqBody.search_text : "";
    const language = reqBody.language ? reqBody.language : "en";
    const page = reqBody.page ? reqBody.page : 1;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    let data = [];
    if (searchText) {
      data = await kobisService.searchTitles(type, searchText, page, limit, language);
    }
    res.ok({
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
