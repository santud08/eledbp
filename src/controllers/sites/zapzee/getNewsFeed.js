import { zapzeeService } from "../../../services/index.js";

/**
 * getNewsFeed
 * used for developer purpose
 * @param req
 * @param res
 * @param next
 */
export const getNewsFeed = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    let data = [];
    if (type) {
      data = await zapzeeService.fetchNewsFeed(type);
    }
    res.ok(data);
  } catch (error) {
    next(error);
  }
};
