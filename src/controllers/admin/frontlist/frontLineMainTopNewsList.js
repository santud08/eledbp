import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Sequelize, Op } from "sequelize";

/**
 * frontLineMainTopNewsList
 * @param req
 * @param res
 */
export const frontLineMainTopNewsList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const listType = reqBody.list_type ? reqBody.list_type : "";
    const language = req.accept_language;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "published_date",
      sortOrder: "DESC",
    };
    const attributes = [
      ["id", "news_id"],
      "title",
      [Sequelize.fn("IFNULL", Sequelize.col("topNewsMapping.id"), ""), "id"],
      [Sequelize.fn("IFNULL", Sequelize.col("topNewsMapping.status"), "inactive"), "status"],
      [
        Sequelize.fn("date_format", Sequelize.col("published_date"), "%Y/%m/%d"),
        "news_publish_date",
      ],
    ];

    const includeQuery = [
      {
        model: model.topNewsMapping,
        attributes: [],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: false,
      },
    ];
    const newsCategory = "News";
    const condition = {
      type: listType,
      status: { [Op.ne]: "deleted" },
      site_language: language,
      category: { [Op.like]: `%${newsCategory}%` },
    };
    const getTopNewsList = await paginationService.pagination(
      searchParams,
      model.news,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getTopNewsList.count,
      total_pages: getTopNewsList.count > 0 ? Math.ceil(getTopNewsList.count / limit) : 0,
      list_type: listType,
      news_list: getTopNewsList.rows,
    });
  } catch (error) {
    next(error);
  }
};
