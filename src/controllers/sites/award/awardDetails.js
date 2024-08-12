import model from "../../../models/index.js";
import { Sequelize, fn, col } from "sequelize";
import { StatusError } from "../../../config/index.js";
import { ZAPZEE_APIS } from "../../../utils/constants.js";
import { zapzeeService } from "../../../services/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * awardDetails
 * @param req
 * @param res
 */
export const awardDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid award id"));
    }
    const awardId = reqBody.id; //It will be award id
    let language = req.accept_language;
    const swipLanguage = await generalHelper.swipeLanguage(language);
    const getAward = await model.awards.findOne({
      attributes: ["id", "news_search_keyword"],
      where: { id: awardId, status: "active" },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const attributes = [
      "id",
      "event_month",
      [Sequelize.literal(`MONTHNAME(CONCAT('2023-',event_month, '-01'))`), "month_name"],
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
      [
        Sequelize.literal(
          `( CASE WHEN "${language}"="en" 
        THEN CASE 
        WHEN  awardTranslationOne.award_explanation IS NOT NULL THEN awardTranslationOne.award_explanation 
        WHEN awardTranslationOnel.award_explanation IS NOT NULL THEN awardTranslationOnel.award_explanation
        ELSE "" END 
        ELSE CASE 
        WHEN awardTranslationOnel.award_explanation IS NOT NULL THEN awardTranslationOnel.award_explanation
        WHEN  awardTranslationOne.award_explanation IS NOT NULL THEN awardTranslationOne.award_explanation
        ELSE "" END END)`,
        ),
        "summary",
      ],
      [Sequelize.fn("IFNULL", Sequelize.col("awardImageOne.url"), ""), "poster_image"],
      "country_id",
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
      [Sequelize.fn("IFNULL", fn("awardLikeCount", col("awards.id")), 0), "numberOfLikes"],
      [Sequelize.fn("IFNULL", fn("isAwardLiked", col("awards.id"), userId), "n"), "is_liked"],
      [Sequelize.fn("IFNULL", fn("awardRatingCount", col("awards.id")), 0), "avg_rating"],
      [
        Sequelize.fn("IFNULL", fn("getUserRatings", col("awards.id"), "award", userId), 0),
        "user_rating",
      ],
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
      id: awardId,
    };

    const [getInformations, roundList] = await Promise.all([
      model.awards.findOne({
        attributes: attributes,
        where: condition,
        include: includeQuery,
      }),
      model.awardRounds.findAll({
        attributes: [
          ["id", "round_id"],
          [
            Sequelize.literal(`CASE WHEN round IS NOT NULL THEN CASE
          WHEN  round % 10 = 1 AND round % 100 != 11 THEN CONCAT(year," ", round, 'st')
          WHEN round % 10 = 2 AND round % 100 != 12 THEN CONCAT(year, " ",round, 'nd')
          WHEN round % 10 = 3 AND round % 100 != 13 THEN CONCAT(year," ",round, 'rd')
          ELSE CONCAT(year," ", round, 'th') END
          ELSE year  END`),
            "round_name",
          ],
        ],
        where: {
          award_id: awardId,
          status: "active",
        },
        order: [
          ["year", "DESC"],
          ["round", "DESC"],
          ["id", "DESC"],
        ],
      }),
    ]);
    let articleList = [];
    //ZapZee details page link
    let zapzeeLink = ZAPZEE_APIS.MORE_SEARCH_PAGE_URL;
    if (
      getAward.news_search_keyword &&
      getAward.news_search_keyword != "" &&
      getAward.news_search_keyword != null &&
      getAward.news_search_keyword != "undefined"
    ) {
      articleList = await zapzeeService.fetchSearchFeed(`"${getAward.news_search_keyword}"`);
      zapzeeLink = `${zapzeeLink}${getAward.news_search_keyword}`;
    }
    if (articleList && articleList.length > 0) {
      articleList = articleList.slice(0, 3);
      let list = [];
      for (const eachRow of articleList) {
        if (eachRow) {
          const getCategory = eachRow.category ? eachRow.category : "";
          const shortDescriptions = eachRow.description ? eachRow.description.slice(0, 100) : "";
          const record = {
            id: eachRow.id ? eachRow.id : "",
            title: eachRow.title ? eachRow.title : "",
            category: !getCategory ? "" : getCategory.shift(),
            creator_name: eachRow.creator_name ? eachRow.creator_name : "",
            short_descriptions: shortDescriptions ? shortDescriptions : "",
            publish_date: eachRow.published_date ? eachRow.published_date : "",
            image:
              eachRow.list_image && (await generalHelper.isImageURL(eachRow.list_image))
                ? eachRow.list_image
                : await generalHelper.generateImageUrl(req, "zapzee_n.png"),
            slug: eachRow.slug ? eachRow.slug : "",
          };
          list.push(record);
        }
      }
      articleList = list;
    }

    if (getInformations && getInformations.dataValues) {
      getInformations.dataValues.avg_rating = getInformations.dataValues.avg_rating
        ? parseFloat(getInformations.dataValues.avg_rating).toFixed(1)
        : 0;
      getInformations.dataValues.round_list = roundList;
      getInformations.dataValues.related_articles = articleList;
      getInformations.dataValues.related_articles_details_url = zapzeeLink;
    } else {
      getInformations.round_list = [];
      getInformations.related_articles = articleList;
      getInformations.related_articles_details_url = zapzeeLink;
    }

    res.ok(getInformations);
  } catch (error) {
    next(error);
  }
};
