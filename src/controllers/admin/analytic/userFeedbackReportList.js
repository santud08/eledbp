import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * userFeedbackReportList
 * @param req
 * @param res
 */
export const userFeedbackReportList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchCategory = reqBody.search_params.category
      ? reqBody.search_params.category
      : "movie";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";
    const listType = reqBody.list_type ? reqBody.list_type : "like";

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

    searchParams.sortOrderObj = [[Sequelize.literal("total_count"), "desc"]];
    let attributes = [];
    let findModelTable = model.favourites;
    let searchType = "title";
    let groupBy = ["favourable_id"];
    let condition = {
      status: "active",
    };
    let dateFilter = "favourites.created_at";
    if (searchCategory == "movie" || searchCategory == "tv" || searchCategory == "webtoons") {
      searchType = "title";
    } else if (searchCategory == "people") {
      searchType = "people";
    } else if (searchCategory == "awards") {
      searchType = "award";
    }

    if (listType == "share") {
      attributes = [
        ["shared_id", "record_id"],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "facebook",
          ),
          "facebook_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "twitter",
          ),
          "twitter_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "mail",
          ),
          "mail_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "link",
          ),
          "link_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "all",
          ),
          "total_count",
        ],
      ];
      findModelTable = model.shared;
      groupBy = ["shared_id"];
      condition["shared_type"] = searchType;
      dateFilter = "shared.created_at";
    } else if (listType == "rating") {
      findModelTable = model.ratings;
      attributes = [
        ["ratingable_id", "record_id"],
        [
          Sequelize.fn(
            "starRatingCountReport",
            Sequelize.col("ratings.ratingable_id"),
            `${searchType}`,
          ),
          "total_count",
        ],
      ];
      groupBy = ["ratingable_id"];
      condition["ratingable_type"] = searchType;
      dateFilter = "ratings.created_at";
    } else {
      attributes = [
        ["favourable_id", "record_id"],
        [
          Sequelize.fn(
            "favouritesCountReport",
            Sequelize.col("favourites.favourable_id"),
            `${searchType}`,
          ),
          "total_count",
        ],
      ];
      findModelTable = model.favourites;
      groupBy = ["favourable_id"];
      condition["favourable_type"] = searchType;
      dateFilter = "favourites.created_at";
    }

    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
        [Op.gte]: searchStartDate,
      });
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
        [Op.lte]: searchEndDate,
      });
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
        [Op.between]: [searchStartDate, searchEndDate],
      });
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
    } else if (searchCategory == "awards") {
      includeQuery = [
        {
          model: model.awards,
          attributes: ["id", "status"],
          where: { status: { [Op.ne]: "deleted" } },
          required: true,
          include: {
            model: model.awardTranslation,
            attributes: ["id", "award_id", "award_name", "site_language"],
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
      findModelTable,
      includeQuery,
      condition,
      attributes,
      groupBy,
    );
    const resCount =
      typeof resultData.count == "object" ? resultData.count.length : resultData.count;
    delete resultData.count;
    resultData.count = resCount;
    let listData = [];
    for (const ed of resultData.rows) {
      if (ed) {
        let record = {
          id: ed.dataValues.record_id ? ed.dataValues.record_id : "",
          title: "",
          type: "",
        };
        if (listType == "share") {
          record.facebook_count = ed.dataValues.facebook_count ? ed.dataValues.facebook_count : 0;
          record.twitter_count = ed.dataValues.twitter_count ? ed.dataValues.twitter_count : 0;
          record.mail_count = ed.dataValues.mail_count ? ed.dataValues.mail_count : 0;
          record.link_count = ed.dataValues.link_count ? ed.dataValues.link_count : 0;
        }
        record.total_count = ed.dataValues.total_count ? ed.dataValues.total_count : 0;
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
        } else if (searchCategory == "awards") {
          record.title =
            ed.dataValues.award &&
            ed.dataValues.award.awardTranslations &&
            ed.dataValues.award.awardTranslations.length > 0 &&
            ed.dataValues.award.awardTranslations[0] &&
            ed.dataValues.award.awardTranslations[0].award_name
              ? ed.dataValues.award.awardTranslations[0].award_name
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
