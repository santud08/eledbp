import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Sequelize, Op } from "sequelize";

/**
 * importFileList
 * @param req
 * @param res
 */
export const importFileList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const searchFileName = reqBody.search_file_name ? reqBody.search_file_name.trim() : "";
    const uploadDate = reqBody.upload_date ? reqBody.upload_date : "";
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "created_at";

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    if (sortOrder && sortBy == "file_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("file_name"), sortOrder]];
    } else if (sortOrder && sortBy == "upload_date") {
      searchParams.sortOrderObj = [[Sequelize.literal("upload_date"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[sortBy, sortOrder]];
    }

    const attributes = [
      ["id", "import_file_id"],
      "file_name",
      [
        Sequelize.fn("date_format", Sequelize.col("created_at"), "%Y-%m-%d %H:%i:%s"),
        "upload_date",
      ],
      "upload_status",
    ];
    const includeQuery = [];
    const condition = {
      status: { [Op.ne]: "deleted" },
    };
    if (searchFileName) {
      condition.file_name = { [Op.like]: `%${searchFileName}%` };
    }
    if (uploadDate) {
      condition[Sequelize.col("date(created_at)")] = Sequelize.where(
        Sequelize.fn("date", Sequelize.col("created_at")),
        uploadDate,
      );
    }
    const getFileList = await paginationService.pagination(
      searchParams,
      model.importFiles,
      includeQuery,
      condition,
      attributes,
    );
    res.ok({
      page: page,
      limit: limit,
      total_records: getFileList.count,
      total_pages: getFileList.count > 0 ? Math.ceil(getFileList.count / limit) : 0,
      list: getFileList.rows,
    });
  } catch (error) {
    next(error);
  }
};
