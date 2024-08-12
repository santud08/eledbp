import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * awardList
 * @param req
 * @param res
 */
export const awardList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchType = reqBody.search_params.search_type ? reqBody.search_params.search_type : "";
    const searchAwardNameKo = reqBody.search_params.search_award_name_ko
      ? reqBody.search_params.search_award_name_ko
      : "";
    const searchAwardNameEn = reqBody.search_params.search_award_name_en
      ? reqBody.search_params.search_award_name_en
      : "";
    const searchCountryId = reqBody.search_params.search_country_id
      ? reqBody.search_params.search_country_id
      : "";

    const eventMonth = reqBody.search_params.event_month ? reqBody.search_params.event_month : "";

    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "desc";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";
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

    const currentMonth = (await customDateTimeHelper.getCurrentDateTime("MM")) - 1;

    if (sortOrder && sortBy == "type") {
      searchParams.sortOrderObj = [[Sequelize.literal("type"), sortOrder]];
    } else if (sortOrder && sortBy == "country_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("country_name"), sortOrder]];
    } else if (sortOrder && sortBy == "award_name_en") {
      searchParams.sortOrderObj = [[Sequelize.literal("award_name_en"), sortOrder]];
    } else if (sortOrder && sortBy == "award_name_ko") {
      searchParams.sortOrderObj = [[Sequelize.literal("award_name_ko"), sortOrder]];
    } else if (sortOrder && sortBy == "event_month") {
      searchParams.sortOrderObj = [
        [Sequelize.fn("ISNULL", Sequelize.col("event_month")), "ASC"],
        [Sequelize.literal("event_month"), sortOrder],
      ];
    } else {
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
    }
    const attributes = [
      "id",
      [Sequelize.fn("IFNULL", Sequelize.col("awardImageOne.url"), ""), "award_poster"],
      "type",
      "event_month",
      [
        Sequelize.fn("IFNULL", Sequelize.col("awardTranslationOne.award_name"), ""),
        "award_name_en",
      ],
      [
        Sequelize.fn("IFNULL", Sequelize.col("awardTranslationOnel.award_name"), ""),
        "award_name_ko",
      ],
      [
        Sequelize.fn("IFNULL", Sequelize.col("countryOne.countryTranslationOne.country_name"), ""),
        "country_name",
      ],
      "city_name",
      "start_date",
      "end_date",
    ];

    const condition = {
      status: { [Op.ne]: "deleted" },
    };
    let awardTrasEnRequired = false;
    let awardTrasKoRequired = false;
    let awardCountryRequired = false;
    if (searchCountryId) {
      condition.country_id = searchCountryId;
      awardCountryRequired = true;
    }
    if (searchType) {
      condition.type = searchType;
    }
    if (eventMonth) {
      condition.event_month = eventMonth;
    }

    if (searchAwardNameEn) {
      condition[Op.or] = [
        { "$awardTranslationOne.award_name$": { [Op.like]: `%${searchAwardNameEn}%` } },
      ];
      awardTrasEnRequired = true;
    }
    if (searchAwardNameKo) {
      condition[Op.or] = [
        { "$awardTranslationOnel.award_name$": { [Op.like]: `%${searchAwardNameKo}%` } },
      ];
      awardTrasKoRequired = true;
    }

    const includeQuery = [
      {
        model: model.awardTranslation,
        as: "awardTranslationOne",
        attributes: [],
        left: true,
        where: { status: { [Op.ne]: "deleted" }, site_language: "en" },
        required: awardTrasEnRequired,
      },
      {
        model: model.awardTranslation,
        as: "awardTranslationOnel",
        attributes: [],
        left: true,
        where: { status: { [Op.ne]: "deleted" }, site_language: "ko" },
        required: awardTrasKoRequired,
      },
      {
        model: model.awardImages,
        as: "awardImageOne",
        attributes: [],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: false,
      },
      {
        model: model.country,
        as: "countryOne",
        attributes: [],
        left: true,
        where: {
          status: { [Op.ne]: "deleted" },
        },
        required: awardCountryRequired,
        include: [
          {
            model: model.countryTranslation,
            as: "countryTranslationOne",
            attributes: ["country_name"],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
              site_language: language,
            },
            required: true,
          },
        ],
      },
    ];

    const getAwardSearch = await paginationService.pagination(
      searchParams,
      model.awards,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getAwardSearch.count,
      total_pages: getAwardSearch.count > 0 ? Math.ceil(getAwardSearch.count / limit) : 0,
      result: getAwardSearch.rows ? getAwardSearch.rows : [],
    });
  } catch (error) {
    next(error);
  }
};
