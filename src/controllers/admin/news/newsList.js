import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Sequelize, Op } from "sequelize";

/**
 * newsList
 * @param req
 * @param res
 */
export const newsList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const searchText = reqBody.search_text ? reqBody.search_text.trim() : "";

    // finding the search_text and listing out all the search related data
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "published_date",
      sortOrder: "desc",
    };
    const attributes = [
      ["id", "news_id"],
      ["title", "news_keyword"],
      ["status", "news_status"],
      [
        Sequelize.fn("date_format", Sequelize.col("published_date"), "%Y/%m/%d"),
        "news_publish_date",
      ],
      "published_date",
    ];
    const includeQuery = [];
    const condition = {
      status: { [Op.ne]: "deleted" },
      [Op.or]: [
        { title: { [Op.like]: `%${searchText}%` } },
        { category: { [Op.like]: `%${searchText}%` } },
      ],
    };
    const getNewsList = await paginationService.pagination(
      searchParams,
      model.news,
      includeQuery,
      condition,
      attributes,
    );
    res.ok({
      page: page,
      limit: limit,
      total_records: getNewsList.count,
      total_pages: getNewsList.count > 0 ? Math.ceil(getNewsList.count / limit) : 0,
      news_list: getNewsList.rows,
    });
  } catch (error) {
    next(error);
  }
};
