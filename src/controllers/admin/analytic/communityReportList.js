import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * communityReportList
 * @param req
 * @param res
 */
export const communityReportList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchCategory = reqBody.search_params.category
      ? reqBody.search_params.category
      : "movie";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";
    const listType = reqBody.list_type ? reqBody.list_type : "comment";

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    searchParams.sortOrderObj = [[Sequelize.literal("main_comment_count"), "desc"]];

    const commentableType = searchCategory == "people" ? searchCategory : "title";
    const attributes = [
      "commentable_id",
      [
        Sequelize.fn(
          "communityCountReport",
          `${listType}`,
          Sequelize.col("community.commentable_id"),
          `${commentableType}`,
          "main",
        ),
        "main_comment_count",
      ],
      [
        Sequelize.fn(
          "communityCountReport",
          `${listType}`,
          Sequelize.col("community.commentable_id"),
          `${commentableType}`,
          "sub",
        ),
        "sub_comment_count",
      ],
      [
        Sequelize.fn(
          "communityCountReport",
          `${listType}`,
          Sequelize.col("community.commentable_id"),
          `${commentableType}`,
          "like",
        ),
        "like_count",
      ],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
      commentable_type: commentableType,
      community_type: listType,
    };
    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("community.created_at")),
        {
          [Op.gte]: searchStartDate,
        },
      );
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("community.created_at")),
        {
          [Op.lte]: searchEndDate,
        },
      );
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("community.created_at")),
        {
          [Op.between]: [searchStartDate, searchEndDate],
        },
      );
    }
    let includeQuery = [];
    if (searchCategory == "people") {
      includeQuery = [
        {
          model: model.people,
          attributes: ["id", "status"],
          where: { status: { [Op.ne]: "deleted" } },
          required: true,
          include: {
            model: model.peopleTranslation,
            attributes: ["id", "people_id", "name", "site_language"],
            where: {
              status: "active",
            },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        },
      ];
    } else {
      const titleCondition = { record_status: { [Op.ne]: "deleted" }, type: searchCategory };
      includeQuery = [
        {
          model: model.title,
          attributes: ["id", "type", "record_status"],
          where: titleCondition,
          required: true,
          include: {
            model: model.titleTranslation,
            attributes: ["id", "title_id", "name", "site_language"],
            where: {
              status: "active",
            },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        },
      ];
    }

    let resultData = await paginationService.paginationWithGroupBy(
      searchParams,
      model.community,
      includeQuery,
      condition,
      attributes,
      ["commentable_id"],
    );
    const resCount =
      typeof resultData.count == "object" ? resultData.count.length : resultData.count;
    delete resultData.count;
    resultData.count = resCount;
    let listData = [];
    for (const ed of resultData.rows) {
      if (ed) {
        let record = {
          id: ed.dataValues.commentable_id ? ed.dataValues.commentable_id : "",
          title: "",
          type: "",
          main_comment_count: ed.dataValues.main_comment_count
            ? ed.dataValues.main_comment_count
            : 0,
          sub_comment_count: ed.dataValues.sub_comment_count ? ed.dataValues.sub_comment_count : 0,
          like_count: ed.dataValues.like_count ? ed.dataValues.like_count : 0,
        };
        if (searchCategory == "people") {
          record.title =
            ed.dataValues.person &&
            ed.dataValues.person.peopleTranslations &&
            ed.dataValues.person.peopleTranslations.length > 0 &&
            ed.dataValues.person.peopleTranslations[0] &&
            ed.dataValues.person.peopleTranslations[0].name
              ? ed.dataValues.person.peopleTranslations[0].name
              : "";
          record.type = searchCategory;
        } else {
          record.title =
            ed.dataValues.title &&
            ed.dataValues.title.titleTranslations &&
            ed.dataValues.title.titleTranslations.length > 0 &&
            ed.dataValues.title.titleTranslations[0] &&
            ed.dataValues.title.titleTranslations[0].name
              ? ed.dataValues.title.titleTranslations[0].name
              : "";
          record.type =
            ed.dataValues.title && ed.dataValues.title.type ? ed.dataValues.title.type : "";
        }
        listData.push(record);
      }
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      list_type: listType,
      result: listData,
    });
  } catch (error) {
    next(error);
  }
};
