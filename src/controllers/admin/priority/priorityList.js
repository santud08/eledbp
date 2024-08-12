import model from "../../../models/index.js";
import { Op } from "sequelize";

/**
 * priorityList
 * @param req
 * @param res
 */
export const priorityList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const listType = reqBody.list_type ? reqBody.list_type : "";

    const getPriority = await model.priority.findAll({
      attributes: [
        "id",
        "field_name",
        ["11db_field_priority", "eleven_db_priority"],
        ["tmdb_field_priority", "tmdb_priority"],
        ["kobis_field_priority", "kobis_priority"],
      ],
      order: [["id", "ASC"]],
      where: { type: listType, status: { [Op.ne]: "deleted" } },
    });
    res.ok({
      list_type: listType,
      results: getPriority,
    });
  } catch (error) {
    next(error);
  }
};
