import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * pageViewByType
 * @param req
 * @param res
 */
export const pageViewByType = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchPageTitle = reqBody.search_params.page_title
      ? reqBody.search_params.page_title
      : "";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const listType = reqBody.list_type ? reqBody.list_type : "movie";

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    const attributes = [
      "user_email",
      [Sequelize.col("activity.user_session_id"), "session_id"],
      "page_title",
      ["page_url", "type_id"],
      ["referrer_url", "referrer"],
      ["view_start_at", "view_at"],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };
    //page title
    if (searchPageTitle) {
      condition.page_title = { [Op.like]: `%${searchPageTitle}%` };
    }

    //page type
    if (listType) {
      condition.page_type = listType;
    }
    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
        [Op.gte]: searchStartDate,
      });
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
        [Op.lte]: searchEndDate,
      });
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
        [Op.between]: [searchStartDate, searchEndDate],
      });
    }

    const includeQuery = [
      {
        model: model.activity,
        attributes: [],
        where: { status: { [Op.ne]: "deleted" } },
        required: true,
      },
    ];

    let resultData = await paginationService.pagination(
      searchParams,
      model.pageVisit,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
