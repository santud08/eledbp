import { tmdbService } from "../../../services/index.js";

/**
 * searchTitle
 * used for developer purpose
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
    let data = [];
    if (searchText) {
      data = await tmdbService.searchTitles(type, searchText, page, language);
    }
    res.ok({
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
