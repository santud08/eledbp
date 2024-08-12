import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError } from "../../../config/index.js";
import { Sequelize, Op } from "sequelize";

/**
 * importFileDetails
 * @param req
 * @param res
 */
export const importFileDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const defautlPageNo = 1;
    const id = reqBody.id ? reqBody.id : "";
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "ASC";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    if (sortOrder && sortBy == "title_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("title_name"), sortOrder]];
    } else if (sortOrder && sortBy == "program_code") {
      searchParams.sortOrderObj = [[Sequelize.literal("program_code"), sortOrder]];
    } else if (sortOrder && sortBy == "tmdb_id") {
      searchParams.sortOrderObj = [[Sequelize.literal("tmdb_id"), sortOrder]];
    } else if (sortOrder && sortBy == "status") {
      searchParams.sortOrderObj = [[Sequelize.literal("status"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[sortBy, sortOrder]];
    }

    const attributes = [
      "id",
      "item_id",
      "type",
      "title_name",
      ["uuid", "program_code"],
      "tmdb_id",
      ["import_status", "status"],
      ["message", "import_message"],
    ];
    const includeQuery = [];
    const condition = {
      imported_file_id: id,
      status: { [Op.ne]: "deleted" },
    };

    const getFileDetails = await paginationService.pagination(
      searchParams,
      model.importData,
      includeQuery,
      condition,
      attributes,
    );
    if (getFileDetails.rows && getFileDetails.rows.length > 0) {
      for (const eachRow in getFileDetails.rows) {
        if (getFileDetails.rows[eachRow]) {
          getFileDetails.rows[eachRow]["dataValues"]["import_message"] = res.__(
            `${getFileDetails.rows[eachRow]["dataValues"]["import_message"]}`,
          )
            ? res.__(`${getFileDetails.rows[eachRow]["dataValues"]["import_message"]}`)
            : getFileDetails.rows[eachRow]["dataValues"]["import_message"];
        }
      }
    }
    res.ok({
      page: page,
      limit: limit,
      total_records: getFileDetails.count,
      total_pages: getFileDetails.count > 0 ? Math.ceil(getFileDetails.count / limit) : 0,
      list: getFileDetails.rows,
    });
  } catch (error) {
    next(error);
  }
};
