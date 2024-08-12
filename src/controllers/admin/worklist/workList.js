import model from "../../../models/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { paginationService } from "../../../services/index.js";
import { Sequelize, Op } from "sequelize";

/**
 * workList
 * @param req
 * @param res
 */
export const workList = async (req, res, next) => {
  try {
    const reqBody = req.body;

    const searchType = reqBody.search_type ? reqBody.search_type : "";
    const searchTitleName = reqBody.search_title_name ? reqBody.search_title_name.trim() : "";
    const searchIdType = reqBody.search_id_type ? reqBody.search_id_type : "";
    const searchId = reqBody.search_id ? reqBody.search_id.trim() : "";
    const searchDate = reqBody.search_date ? reqBody.search_date : "";
    const tivingId = reqBody.tiving_id ? reqBody.tiving_id : "";

    let resultData = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const languageFliter = req.accept_language ? req.accept_language : "";

    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";

    const searchParams = {
      page: page,
      limit: limit,
      distinct: false,
      raw: false,
      defaultOrder: false,
    };

    const condition = {};
    const attributes = [
      ["primary_id", "id"],
      "type",
      "title",
      "unique_id",
      [
        Sequelize.fn("date_format", Sequelize.col("modified_date"), "%Y-%m-%d %H:%i:%s"),
        "modified_date",
      ],
      "tiving_id",
      "worker",
    ];

    if (sortOrder && sortBy == "type") {
      searchParams.sortOrderObj = [[Sequelize.literal("type"), sortOrder]];
    } else if (sortOrder && sortBy == "title") {
      searchParams.sortOrderObj = [[Sequelize.literal("title"), sortOrder]];
    } else if (sortOrder && sortBy == "unique_id") {
      searchParams.sortOrderObj = [[Sequelize.literal("unique_id"), sortOrder]];
    } else if (sortOrder && sortBy == "modified_date") {
      searchParams.sortOrderObj = [[Sequelize.literal("modified_date"), sortOrder]];
    } else if (sortOrder && sortBy == "tiving_id") {
      searchParams.sortOrderObj = [[Sequelize.literal("tiving_id"), sortOrder]];
    } else if (sortOrder && sortBy == "worker") {
      searchParams.sortOrderObj = [[Sequelize.literal("worker"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[Sequelize.literal("modified_date"), "desc"]];
    }

    const includeQuery = [];
    if (searchType) {
      condition.type = searchType;
    }
    if (searchTitleName) {
      condition.title = { [Op.like]: `%${searchTitleName}%` };
    }
    if (searchIdType == "id") {
      condition.unique_id = searchId;
    } else if (searchIdType == "tiving_id") {
      condition.tiving_id = searchId;
    }
    if (searchDate) {
      condition[Sequelize.col("date(modified_date)")] = Sequelize.where(
        Sequelize.fn("date", Sequelize.col("modified_date")),
        searchDate,
      );
    }
    if (tivingId === "exist") {
      condition.tiving_id = { [Op.ne]: null };
    } else if (tivingId === "not_exist") {
      condition.tiving_id = { [Op.eq]: null };
    }

    if (languageFliter) {
      condition.language = languageFliter;
    }

    resultData = await paginationService.pagination(
      searchParams,
      model.worklistView,
      includeQuery,
      condition,
      attributes,
    );
    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      data: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
