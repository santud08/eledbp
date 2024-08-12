import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * pageSearch
 * @param req
 * @param res
 */
export const pageSearch = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchSearchKeyword = reqBody.search_params.search_keyword
      ? reqBody.search_params.search_keyword
      : "";
    const searchLandingKeyword = reqBody.search_params.landing_keyword
      ? reqBody.search_params.landing_keyword
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
      ["search_text", "search_keyword"],
      ["landing_text", "landing_keyword"],
      ["search_sort", "sort"],
      "release_date",
      "created_at",
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };

    //search keyword
    if (searchSearchKeyword) {
      condition.search_text = { [Op.like]: `%${searchSearchKeyword}%` };
    }

    //landing keyword
    if (searchLandingKeyword) {
      condition.landing_text = { [Op.like]: `%${searchLandingKeyword}%` };
    }

    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("searchActivity.created_at")),
        {
          [Op.gte]: searchStartDate,
        },
      );
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("searchActivity.created_at")),
        {
          [Op.lte]: searchEndDate,
        },
      );
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("searchActivity.created_at")),
        {
          [Op.between]: [searchStartDate, searchEndDate],
        },
      );
    }

    const includeQuery = [
      {
        model: model.activity,
        attributes: ["id"],
        where: { status: { [Op.ne]: "deleted" } },
        required: true,
      },
    ];

    let resultData = await paginationService.pagination(
      searchParams,
      model.searchActivity,
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
