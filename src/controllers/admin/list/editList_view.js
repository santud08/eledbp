import model from "../../../models/index.js";
//import { Sequelize, Op, fn, col } from "sequelize";
import { Sequelize, Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TABLES } from "../../../utils/constants.js";

/**
 * editList
 * @param req
 * @param res
 */
export const editList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchType = reqBody.search_type ? reqBody.search_type : "";
    const searchTitle = reqBody.search_title ? reqBody.search_title : "";
    const searchEmailId = reqBody.search_email ? reqBody.search_email : "";
    const searchTitleStatus = reqBody.search_title_status ? reqBody.search_title_status : "";
    const searchEditorName = reqBody.search_editor_name ? reqBody.search_editor_name : "";
    const searchStartDate = reqBody.search_start_date ? reqBody.search_start_date : "";
    const searchEndDate = reqBody.search_end_date ? reqBody.search_end_date : "";
    const searchOperation = reqBody.search_operation ? reqBody.search_operation : "";

    let includeQuery = [];

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";

    const language = req.accept_language;
    let condition = { language: language };
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "modified_date",
      sortOrder: "desc",
      //subQuery: false,
      //raw: true,
      queryLog: true,
      defaultOrder: false,
      distinct: true,
      distinctCol: "edit_id",
    };

    if (sortOrder && sortBy == "type") {
      searchParams.sortOrderObj = [["type", sortOrder]];
    } else if (sortOrder && sortBy == "title_name") {
      searchParams.sortOrderObj = [["title_name", sortOrder]];
    } else if (sortOrder && sortBy == "editor_name") {
      searchParams.sortOrderObj = [["editor_name", sortOrder]];
    } else if (sortOrder && sortBy == "operation") {
      searchParams.sortOrderObj = [["operation", sortOrder]];
    } else if (sortOrder && sortBy == "email_id") {
      searchParams.sortOrderObj = [["email_id", sortOrder]];
    } else if (sortOrder && sortBy == "status") {
      searchParams.sortOrderObj = [["title_status", sortOrder]];
    } else if (sortOrder && sortBy == "registration_date") {
      searchParams.sortOrderObj = [["registration_date", sortOrder]];
    } else if (sortOrder && sortBy == "activeInactive") {
      searchParams.sortOrderObj = [["item_status", sortOrder]];
    } else if (sortOrder && sortBy == "modified_date") {
      searchParams.sortOrderObj = [["modified_date", sortOrder]];
    } else {
      searchParams.sortOrderObj = [["modified_date", "desc"]];
    }

    const attributes = [
      "edit_id",
      ["item_id", "editable_id"],
      "type",
      "editor_name",
      "email_id",
      [Sequelize.literal('CONCAT(title_name, " (",item_id,")")'), "title_name"],
      //[fn("CONCAT", col("title_name"), " ", col("editable_id")), "title_name"],
      "operation",
      "modified_date",
      ["title_status", "status"],
      "registration_date",
      ["item_status", "active_inactive"],
    ];

    // Title table search data condition add
    if (searchTitleStatus) {
      condition.title_status = searchTitleStatus;
    }

    if (searchTitle) {
      condition.title_name = { [Op.like]: `%${searchTitle}%` };
    }

    // user table search data condition add
    if (searchEmailId) {
      condition.email_id = searchEmailId;
    }
    if (searchEditorName) {
      condition.editor_name = { [Op.like]: `%${searchEditorName}%` };
    }

    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.or] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("registration_date")), {
          [Op.gte]: searchStartDate,
        }),
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("modified_date")), {
          [Op.gte]: searchStartDate,
        }),
      ];
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.or] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("registration_date")), {
          [Op.lte]: searchEndDate,
        }),
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("modified_date")), {
          [Op.lte]: searchEndDate,
        }),
      ];
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.or] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("registration_date")), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("modified_date")), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
      ];
    }
    // Add extra conditions for Operation
    if (searchOperation) {
      condition.operation = searchOperation;
    }
    // Add extra conditions for search type(movie/tv/webtoon/people)
    if (searchType) {
      condition.type = searchType;
    }

    let resultData = await paginationService.pagination(
      searchParams,
      model.editListView,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      //result: listData,
      result: resultData.rows,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
