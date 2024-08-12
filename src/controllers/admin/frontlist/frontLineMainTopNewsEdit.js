import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * frontLineMainTopNewsEdit
 * @param req
 * @param res
 */
export const frontLineMainTopNewsEdit = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const newsId = reqBody.news_id ? reqBody.news_id : "";
    const topNewsId = reqBody.id ? reqBody.id : ""; // mapping table id
    const status = reqBody.status ? reqBody.status : "";
    const listType = reqBody.list_type ? reqBody.list_type : "";

    // check for news id existance in news table
    const isExist = await model.news.findOne({
      where: { id: newsId, type: listType, status: { [Op.ne]: "deleted" } },
    });
    if (!isExist) throw StatusError.badRequest(res.__("Invalid news id"));

    // check for news id existance in news mapping table
    let topNewsCondition = {
      news_id: newsId,
      status: { [Op.ne]: "deleted" },
    };
    if (topNewsId) topNewsCondition.id = topNewsId;
    const getInformations = await model.topNewsMapping.findOne({
      attributes: ["id", "status"],
      where: topNewsCondition,
    });

    // News mapping table not exist in news id then insert data
    if (!getInformations && topNewsId == "") {
      const addData = {
        news_id: newsId,
        status: status,
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.topNewsMapping.create(addData);
    } else {
      const updateData = {
        news_id: newsId,
        status: status,
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.topNewsMapping.update(updateData, {
        where: { id: topNewsId, news_id: newsId },
      });
    }

    res.ok({
      message: res.__("Top news updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
