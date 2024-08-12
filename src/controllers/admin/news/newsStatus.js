import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import model from "../../../models/index.js";
import { Op } from "sequelize";

/**
 * newsStatus
 * @param req
 * @param res
 */
export const newsStatus = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const newsId = reqBody.news_id;
    const newsStatus = reqBody.status;
    const userId = req.userDetails.userId;

    // check for news id existance in news table
    const isExists = await model.news.findOne({
      where: { id: newsId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid news id"));

    // Update news status
    const updateNewsData = {
      status: newsStatus,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.news.update(updateNewsData, {
      where: { id: newsId },
    });

    res.ok({
      message: res.__("Status updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
