import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * addSearchStatistics
 * @param req
 * @param res
 */
export const addSearchStatistics = async (req, res, next) => {
  try {
    const reqBody = req.body;

    let activityId = reqBody.statistic_id ? reqBody.statistic_id : null;
    if (!activityId) throw StatusError.badRequest(res.__("user statistic id is empty"));

    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;

    const typeInputMap = {
      movies: "movie",
      tv_shows: "tv",
      webtoons: "webtoons",
      people: "people",
      videos: "video",
      tags: "tag",
      companies: "company",
      award: "award",
    };

    const type = reqBody.type && typeInputMap[reqBody.type] ? typeInputMap[reqBody.type] : null;

    const itemId = reqBody.view_id ? reqBody.view_id : null;

    const pageUrl = reqBody.goto_url ? reqBody.goto_url : null;
    const searchText = reqBody.search_text ? reqBody.search_text : null;
    const landingText = reqBody.goto_text ? reqBody.goto_text : null;

    const searchSort = reqBody.search_sort ? reqBody.search_sort : null;
    const releaseAt = reqBody.release_at
      ? await customDateTimeHelper.changeDateFormat(reqBody.release_at, "YYYY-MM-DD")
      : null;

    const getActivity = await model.activity.findOne({
      where: { id: activityId, status: "active" },
    });

    if (getActivity) {
      const logData = {
        activity_id: activityId,
        search_text: searchText,
        landing_text: landingText,
        browse_page_url: pageUrl,
        item_id: itemId,
        item_type: type,
        release_date: releaseAt,
        search_sort: searchSort,
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.searchActivity.create(logData);
      res.ok({
        message: res.__("Success"),
      });
    } else {
      throw StatusError.badRequest(res.__("user statistic id is invalid"));
    }
  } catch (error) {
    next(error);
  }
};
