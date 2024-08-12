import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * priorityListSave
 * @param req
 * @param res
 */
export const priorityListSave = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const listType = reqBody.list_type ? reqBody.list_type : "";
    const priorityDetails = reqBody.priority ? reqBody.priority : [];

    if (priorityDetails.length > 0) {
      for (const priority of priorityDetails) {
        // check for priority id existance in priority table
        const getPriorityId = await model.priority.findOne({
          where: { id: priority.id, type: listType, status: { [Op.ne]: "deleted" } },
          attributes: ["id"],
        });
        if (getPriorityId) {
          if (getPriorityId.id) {
            const dataPriority = {
              "11db_field_priority": priority.eleven_db_priority,
              tmdb_field_priority: priority.tmdb_priority,
              kobis_field_priority: priority.kobis_priority,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
            };
            await model.priority.update(dataPriority, {
              where: { id: getPriorityId.id },
            });
          }
        }
      }
    }
    res.ok({
      message: res.__("Priority saved successfully"),
    });
  } catch (error) {
    next(error);
  }
};
