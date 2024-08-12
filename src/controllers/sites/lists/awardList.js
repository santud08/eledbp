import model from "../../../models/index.js";
import { Op, Sequelize, fn } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";

/**
 * awardList
 * @param req
 * @param res
 */
export const awardList = async (req, res, next) => {
  try {
    const reqBody = req.query;

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;
    const swipLanguage = await generalHelper.swipeLanguage(language);
    const reqDate = reqBody.date ? reqBody.date : null;
    let currentMonth = null;
    if (reqDate) {
      currentMonth = (await customDateTimeHelper.changeDateFormat(reqDate, "MM")) - 1;
    } else {
      currentMonth = (await customDateTimeHelper.getCurrentDateTime("MM")) - 1;
    }

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    searchParams.sortOrderObj = [
      [Sequelize.fn("ISNULL", Sequelize.col("event_month")), "ASC"],
      [
        Sequelize.literal(
          `(CASE WHEN event_month >= ${currentMonth}
            THEN event_month - ${currentMonth}
            ELSE event_month + 12 - ${currentMonth} 
            END)`,
        ),
        "ASC",
      ],
    ];
    const attributes = [
      "id",
      [
        Sequelize.literal(
          `( CASE WHEN "${language}"="en" 
        THEN CASE 
        WHEN  awardTranslationOne.award_name IS NOT NULL THEN awardTranslationOne.award_name 
        WHEN awardTranslationOnel.award_name IS NOT NULL THEN awardTranslationOnel.award_name
        ELSE "" END 
        ELSE CASE 
        WHEN awardTranslationOnel.award_name IS NOT NULL THEN awardTranslationOnel.award_name
        WHEN  awardTranslationOne.award_name IS NOT NULL THEN awardTranslationOne.award_name
        ELSE "" END END)`,
        ),
        "award_name",
      ],
      [Sequelize.fn("IFNULL", Sequelize.col("awardImageOne.url"), ""), "poster_image"],
      [Sequelize.literal(`MONTHNAME(CONCAT('2023-',event_month, '-01'))`), "month_name"],
      [
        Sequelize.fn(
          "IFNULL",
          fn(
            "getCountryTranslateName",
            Sequelize.fn("IFNULL", Sequelize.col("country_id"), ""),
            language,
          ),
          fn(
            "getCountryTranslateName",
            Sequelize.fn("IFNULL", Sequelize.col("country_id"), ""),
            swipLanguage,
          ),
        ),
        "country_name",
      ],
      ["city_name", "city"],
      "place",
      ["website_url", "website"],
    ];

    const includeQuery = [
      {
        model: model.awardTranslation,
        as: "awardTranslationOne",
        attributes: [],
        left: true,
        where: { status: "active", site_language: "en" },
        required: false,
      },
      {
        model: model.awardTranslation,
        as: "awardTranslationOnel",
        attributes: [],
        left: true,
        where: { status: "active", site_language: "ko" },
        required: false,
      },
      {
        model: model.awardImages,
        as: "awardImageOne",
        attributes: [],
        left: true,
        where: { status: "active" },
        required: false,
      },
    ];

    const condition = {
      status: "active",
      [Op.and]: {
        [Op.or]: [
          { "$awardTranslationOne.award_name$": { [Op.ne]: null } },
          { "$awardTranslationOnel.award_name$": { [Op.ne]: null } },
        ],
      },
    };

    const getAwards = await paginationService.pagination(
      searchParams,
      model.awards,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getAwards.count,
      total_pages: getAwards.count > 0 ? Math.ceil(getAwards.count / limit) : 0,
      result: getAwards.rows ? getAwards.rows : [],
    });
  } catch (error) {
    next(error);
  }
};
