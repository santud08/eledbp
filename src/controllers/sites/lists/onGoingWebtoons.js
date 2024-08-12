import model from "../../../models/index.js";
import { Op, fn, col, Sequelize } from "sequelize";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TITLE_SETTINGS } from "../../../utils/constants.js";
import { envs } from "../../../config/index.js";

/**
 * onGoingWebtoons
 * @param req
 * @param res
 */
export const onGoingWebtoons = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = "webtoons"; // Type Value will be movie
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    const searchInputParams = reqBody.search_params ? reqBody.search_params : {};
    const categoryId =
      searchInputParams && searchInputParams.category_id ? searchInputParams.category_id : null;
    const subCategoryId =
      searchInputParams && searchInputParams.sub_category_id
        ? searchInputParams.sub_category_id
        : null;
    let tagId = searchInputParams && searchInputParams.tag_id ? searchInputParams.tag_id : [];
    const genreId = searchInputParams && searchInputParams.genre ? searchInputParams.genre : "";
    const certification =
      searchInputParams && searchInputParams.certification ? searchInputParams.certification : "";
    const countryIds =
      searchInputParams && searchInputParams.country ? searchInputParams.country : [];

    const weeklyUpload =
      searchInputParams && searchInputParams.weekly_upload ? searchInputParams.weekly_upload : "";
    const readId = searchInputParams && searchInputParams.read ? searchInputParams.read : [];
    const releaseDateFrom =
      searchInputParams && searchInputParams.release_date_from
        ? searchInputParams.release_date_from
        : "";
    const releaseDateTo =
      searchInputParams && searchInputParams.release_date_to
        ? searchInputParams.release_date_to
        : "";
    let resultData = [];
    let includeQuery = [];
    let condition = {};
    let tagCondition = {};
    let countryCondition = {};
    let readCondition = {};
    let weeklyUploadCondition = {};
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "release_date",
      sortOrder: "DESC",
      subQuery: false,
    };

    // Include Tag section fields
    if (categoryId != "" && categoryId != null && subCategoryId == null && tagId.length === 0) {
      const getTagByParentCat = await model.tag.findAll({
        attributes: ["id", "tag_main_category_id", "name"],
        where: { tag_main_category_id: categoryId, status: "active" },
      });

      if (getTagByParentCat.length > 0) {
        for (const eachRow of getTagByParentCat) {
          if (eachRow) {
            const tag_id = eachRow.id ? eachRow.id : "";
            tagId.push(tag_id);
          }
        }
      } else {
        tagId.push(0);
      }
    }
    if (subCategoryId != "" && subCategoryId != null && tagId.length === 0) {
      const getTagByParentSubCat = await model.tag.findAll({
        attributes: ["id", "tag_category_id", "tag_main_category_id", "name"],
        where: {
          tag_main_category_id: categoryId,
          tag_category_id: subCategoryId,
          status: "active",
        },
      });

      if (getTagByParentSubCat.length > 0) {
        for (const eachRow of getTagByParentSubCat) {
          if (eachRow) {
            const tag_id = eachRow.id ? eachRow.id : "";
            tagId.push(tag_id);
          }
        }
      } else {
        tagId.push(0);
      }
    }

    // if genre Id not exist in tagId array then push it in tagId array
    if (tagId.includes(genreId) == false && genreId != "") {
      tagId.push(genreId);
    }
    // Tag condition start
    if (tagId.length > 0) {
      tagCondition = {
        model: model.tagGable,
        left: true,
        attributes: ["tag_id", "taggable_id", "taggable_type"],
        where: {
          tag_id: {
            [Op.in]: tagId,
          },
          status: "active",
        },
        required: true,
      };
    }

    // Country condition start
    if (countryIds.length > 0) {
      countryCondition = {
        model: model.titleCountries,
        left: true,
        attributes: ["title_id", "country_id", "site_language"],
        where: {
          country_id: {
            [Op.in]: countryIds,
          },
          status: "active",
        },
        required: true,
      };
    }

    // read condition start
    if (readId.length > 0) {
      readCondition = {
        model: model.titleWatchOn,
        left: true,
        attributes: ["title_id", "provider_id", "type"],
        where: {
          provider_id: {
            [Op.in]: readId,
          },
          status: "active",
        },
        required: true,
      };
    }
    // read condition start
    if (weeklyUpload) {
      weeklyUploadCondition = {
        model: model.weeklyTelecast,
        left: true,
        attributes: ["title_id", "telecast_day"],
        where: {
          telecast_day: `${weeklyUpload}`,
          status: "active",
        },
        required: true,
      };
    }

    const attributes = [
      "id",
      "type",
      [
        Sequelize.fn("IFNULL", Sequelize.fn("max", Sequelize.col("seasons.release_date")), null),
        "release_date",
      ],
      "year",
      "runtime",
      "tmdb_vote_average",
      "certification",
      "record_status",
      "avg_rating",
      ["calculate_popularity", "popularity_order"],
    ];
    includeQuery = [
      {
        model: model.titleTranslation,
        left: true,
        attributes: ["name", "site_language"],
        where: { status: "active" },
        required: true,
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
      {
        model: model.titleImage,
        attributes: [
          "title_id",
          "original_name",
          "file_name",
          "url",
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        ],
        left: true,
        where: {
          status: "active",
          image_category: "poster_image",
          episode_id: null,
          is_main_poster: "y",
          original_name: {
            [Op.ne]: null,
          },
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
      {
        model: model.season,
        attributes: ["title_id", "release_date"],
        left: true,
        where: { status: "active" },
        required: false,
      },
    ];

    // Include Tag
    if (tagId.length > 0) {
      includeQuery.push(tagCondition);
    }
    // Include Country
    if (countryIds.length > 0) {
      includeQuery.push(countryCondition);
    }
    // Include read
    if (readId.length > 0) {
      includeQuery.push(readCondition);
    }
    // Include weeklyUpload
    if (weeklyUpload) {
      includeQuery.push(weeklyUploadCondition);
    }

    condition = {
      type: type,
      record_status: "active",
      title_status: "ongoing",
    };

    searchParams.sortOrderObj = [[Sequelize.literal("release_date"), "DESC"]];
    // Add extra conditions for certification
    if (certification) {
      condition.certification = certification;
    }
    // Add extra conditions for Releasedate
    if (releaseDateFrom && releaseDateTo) {
      condition[Op.and] = {
        "$seasons.release_date$": { [Op.between]: [releaseDateFrom, releaseDateTo] },
      };
    }

    const groupBy = ["title.id"];
    resultData = await paginationService.paginationWithGroupBy(
      searchParams,
      model.title,
      includeQuery,
      condition,
      attributes,
      groupBy,
    );

    const resCount =
      typeof resultData.count == "object" ? resultData.count.length : resultData.count;
    delete resultData.count;
    resultData.count = resCount;
    if (resultData.count > 0) {
      let titleList = [];
      for (const eachRow of resultData.rows) {
        if (eachRow) {
          const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
          const record = {
            id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
            title:
              eachRow.dataValues.titleTranslations[0] &&
              eachRow.dataValues.titleTranslations[0].name
                ? eachRow.dataValues.titleTranslations[0].name
                : "",
            image:
              eachRow.dataValues.titleImages[0] && eachRow.dataValues.titleImages[0].path
                ? eachRow.dataValues.titleImages[0].path.replace("p/original", `p/${tittleImageW}`)
                : "",
            rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
            release_date:
              eachRow.dataValues && eachRow.dataValues.release_date
                ? await customDateTimeHelper.changeDateFormat(
                    eachRow.dataValues.release_date,
                    "MMM DD,YYYY",
                  )
                : "",
          };
          titleList.push(record);
        }
      }
      resultData.rows = titleList;
    }

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
