import { zapzeeService } from "../../../services/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * getNewsFeedManually
 * from the file
 * used for developer purpose
 * @param req
 * @param res
 * @param next
 */
export const getNewsFeedManually = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    const currentDate = await customDateTimeHelper.getCurrentDateTime("DD_MM_YYYY");
    const dataDate = currentDate;
    let data = [];
    if (type) {
      data = await zapzeeService.fetchNewsFeedManually(dataDate, type);
    }
    res.ok(data);
  } catch (error) {
    next(error);
  }
};
