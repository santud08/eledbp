import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Op, Sequelize } from "sequelize";

/**
 * exportList
 * @param req
 * @param res
 */
export const exportList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const searchFileName = reqBody.search_file_name ? reqBody.search_file_name.trim() : "";
    const searchDate = reqBody.search_date ? reqBody.search_date : "";
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    if (sortOrder && sortBy == "file_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("file_name"), sortOrder]];
    } else if (sortOrder && sortBy == "creation_date") {
      searchParams.sortOrderObj = [[Sequelize.literal("creation_date"), sortOrder]];
    } else if (sortOrder && sortBy == "message") {
      searchParams.sortOrderObj = [[Sequelize.literal("message"), sortOrder]];
    } else if (sortOrder && sortBy == "status") {
      searchParams.sortOrderObj = [[Sequelize.literal("status"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[sortBy, sortOrder]];
    }

    const attributes = [
      "id",
      "file_name",
      ["export_status", "status"],
      ["remarks", "message"],
      [
        Sequelize.fn("date_format", Sequelize.col("created_at"), "%Y-%m-%d %H:%i:%s"),
        "creation_date",
      ],
    ];
    const includeQuery = [];
    const condition = {
      status: { [Op.ne]: "deleted" },
      [Op.or]: [{ file_name: { [Op.like]: `%${searchFileName}%` } }],
    };
    if (searchDate) {
      condition[Sequelize.col("date(created_at)")] = Sequelize.where(
        Sequelize.fn("date", Sequelize.col("created_at")),
        searchDate,
      );
    }

    const getExportList = await paginationService.pagination(
      searchParams,
      model.exportData,
      includeQuery,
      condition,
      attributes,
    );
    res.ok({
      page: page,
      limit: limit,
      total_records: getExportList.count,
      total_pages: getExportList.count > 0 ? Math.ceil(getExportList.count / limit) : 0,
      results: getExportList.rows,
    });
  } catch (error) {
    next(error);
  }
};
