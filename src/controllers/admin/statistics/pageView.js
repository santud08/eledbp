import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * pageView
 * @param req
 * @param res
 */
export const pageView = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchAccessPlatform = reqBody.search_params.access_platform
      ? reqBody.search_params.access_platform
      : "";
    const searchPageType = reqBody.search_params.page_type ? reqBody.search_params.page_type : "";
    const searchPageTitle = reqBody.search_params.page_title
      ? reqBody.search_params.page_title
      : "";
    const searchUtmSource = reqBody.search_params.utm_source
      ? reqBody.search_params.utm_source
      : "";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    const attributes = [
      "user_email",
      [Sequelize.col("activity.access_platform"), "access_platform"],
      "page_type",
      "page_title",
      ["page_url", "type_id"],
      [Sequelize.col("activity.utm_source"), "utm_source"],
      [Sequelize.col("activity.utm_medium"), "utm_medium"],
      [Sequelize.col("activity.utm_content"), "utm_content"],
      [Sequelize.col("activity.utm_term"), "utm_term"],
      ["referrer_url", "referrer"],
      ["view_start_at", "view_at"],
      [Sequelize.col("activity.user_session_id"), "session_id"],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };
    let andCondition = [];
    //access platform
    if (searchAccessPlatform) {
      andCondition.push({
        "$activity.access_platform$": { [Op.like]: `%${searchAccessPlatform}%` },
      });
    }
    //page title
    if (searchPageTitle) {
      condition.page_title = { [Op.like]: `%${searchPageTitle}%` };
    }
    //utm source
    if (searchUtmSource) {
      andCondition.push({ "$activity.utm_source$": { [Op.like]: `%${searchUtmSource}%` } });
    }
    //page type
    if (searchPageType) {
      condition.page_type = searchPageType;
    }
    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      andCondition.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
          [Op.gte]: searchStartDate,
        }),
      );
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      andCondition.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
          [Op.lte]: searchEndDate,
        }),
      );
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      andCondition.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
      );
    }

    if (andCondition.length > 0) {
      condition[Op.and] = andCondition;
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
