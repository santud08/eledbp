import model from "../../../models/index.js";
import { Op, fn, col, Sequelize } from "sequelize";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TITLE_SETTINGS, LIST_PAGE } from "../../../utils/constants.js";
import { envs } from "../../../config/index.js";

/**
 * popularTvDetails
 * @param req
 * @param res
 */
export const popularTvDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = "tv"; // Type Value will be tv
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    const categoryId = reqBody.search_params.category_id ? reqBody.search_params.category_id : null;
    const subCategoryId = reqBody.search_params.sub_category_id
      ? reqBody.search_params.sub_category_id
      : null;
    let tagIds = reqBody.search_params.tag_id ? reqBody.search_params.tag_id : [];
    const genreId = reqBody.search_params.genre ? reqBody.search_params.genre : "";
    const certification = reqBody.search_params.certification
      ? reqBody.search_params.certification
      : "";
    const countryIds = reqBody.search_params.country ? reqBody.search_params.country : [];
    const runTimeFrom = reqBody.search_params.run_time_from
      ? reqBody.search_params.run_time_from
      : "";
    const runTimeTo = reqBody.search_params.run_time_to ? reqBody.search_params.run_time_to : "";
    const watchId = reqBody.search_params.watch ? reqBody.search_params.watch : [];
    const releaseDateFrom = reqBody.search_params.release_date_from
      ? reqBody.search_params.release_date_from
      : "";
    const releaseDateTo = reqBody.search_params.release_date_to
      ? reqBody.search_params.release_date_to
      : "";
    let resultData = [];
    let includeQuery = [];
    let subIncludeQuery = [];
    let condition = {};
    let extraCondition = { record_status: "active", type: type };
    let tagCondition = {};
    let countryCondition = {};
    let watchCondition = {};
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;

    const reqDate = reqBody.date ? reqBody.date : null;
    let getCurrentDate = null;
    let withinThreeMonthDate = null;
    if (reqDate) {
      [getCurrentDate, withinThreeMonthDate] = await Promise.all([
        customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.TV.POPULAR.TIME_SPAN,
          LIST_PAGE.TV.POPULAR.TYPE,
          reqDate,
          "YYYY-MM-DD",
        ),
      ]);
    } else {
      [getCurrentDate, withinThreeMonthDate] = await Promise.all([
        customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.TV.POPULAR.TIME_SPAN,
          LIST_PAGE.TV.POPULAR.TYPE,
          null,
          "YYYY-MM-DD",
        ),
      ]);
    }
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "release_date",
      sortOrder: "ASC",
      subQuery: false,
    };

    // Include Tag section fields
    if (categoryId != "" && categoryId != null && subCategoryId == null && tagIds.length === 0) {
      const getTagByParentCat = await model.tag.findAll({
        attributes: ["id", "tag_main_category_id", "name"],
        where: { tag_main_category_id: categoryId, status: "active" },
      });

      if (getTagByParentCat.length > 0) {
        for (const eachRow of getTagByParentCat) {
          if (eachRow) {
            const tagId = eachRow.id ? eachRow.id : "";
            tagIds.push(tagId);
          }
        }
      } else {
        tagIds.push(0);
      }
    }
    if (subCategoryId != "" && subCategoryId != null && tagIds.length === 0) {
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
            const tagId = eachRow.id ? eachRow.id : "";
            tagIds.push(tagId);
          }
        }
      } else {
        tagIds.push(0);
      }
    }

    // if genre Id not exist in tagId array then push it in tagId array
    if (tagIds.includes(genreId) == false && genreId != "") {
      tagIds.push(genreId);
    }
    // Tag condition start
    if (tagIds.length > 0) {
      tagCondition = {
        model: model.tagGable,
        left: true,
        attributes: ["tag_id", "taggable_id", "taggable_type"],
        where: {
          tag_id: {
            [Op.in]: tagIds,
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

    // Watch condition start
    if (watchId.length > 0) {
      watchCondition = {
        model: model.titleWatchOn,
        left: true,
        attributes: ["title_id", "provider_id", "type"],
        where: {
          provider_id: {
            [Op.in]: watchId,
          },
          status: "active",
        },
        required: true,
      };
    }

    subIncludeQuery = [
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
          is_main_poster: "y",
          episode_id: null,
          original_name: {
            [Op.ne]: null,
          },
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
    ];

    const attributes = [
      "title_id",
      [Sequelize.fn("max", Sequelize.col("season.release_date")), "release_date"],
      [
        Sequelize.fn(
          "date_format",
          Sequelize.fn("max", Sequelize.col("season.release_date")),
          "%b %d, %Y",
        ),
        "release_date_formatted",
      ],
      "release_date_to",
      [Sequelize.col("calculate_popularity"), "popularity_order"],
    ];
    includeQuery = [
      {
        model: model.title,
        left: true,
        attributes: [
          "id",
          "type",
          ["release_date", "title_tbl_releaseDate"],
          "year",
          "runtime",
          "tmdb_vote_average",
          "certification",
          "record_status",
          "title_status",
          "avg_rating",
        ],
        where: extraCondition,
        required: true,
        include: subIncludeQuery,
      },
    ];

    // Include Tag
    if (tagIds.length > 0) {
      subIncludeQuery.push(tagCondition);
    }
    // Include Country
    if (countryIds.length > 0) {
      subIncludeQuery.push(countryCondition);
    }
    // Include Watch
    if (watchId.length > 0) {
      subIncludeQuery.push(watchCondition);
    }

    condition = {
      status: "active",
      [Op.or]: [{ release_date: { [Op.between]: [withinThreeMonthDate, getCurrentDate] } }],
    };
    searchParams.sortOrderObj = [[Sequelize.literal("popularity_order"), "DESC"]];
    // Add extra conditions for certification
    if (certification) {
      extraCondition.certification = certification;
    }
    // Add extra conditions for runtime
    if (runTimeTo) {
      extraCondition.runtime = { [Op.between]: [runTimeFrom, runTimeTo] };
    }
    // Add extra conditions for Releasedate
    if (releaseDateFrom && releaseDateTo) {
      condition = {
        [Op.or]: [{ release_date: { [Op.between]: [releaseDateFrom, releaseDateTo] } }],
      };
    }

    const groupBy = ["title_id"];
    resultData = await paginationService.paginationWithGroupBy(
      searchParams,
      model.season,
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
          const title_id = eachRow.dataValues.title_id ? eachRow.dataValues.title_id : "";
          const totalRating = eachRow.dataValues.title.dataValues.avg_rating
            ? eachRow.dataValues.title.dataValues.avg_rating
            : 0;
          const record = {
            id: title_id,
            title:
              eachRow.dataValues.title.dataValues.titleTranslations[0] &&
              eachRow.dataValues.title.dataValues.titleTranslations[0].name
                ? eachRow.dataValues.title.dataValues.titleTranslations[0].name
                : "",
            image:
              eachRow.dataValues.title.dataValues.titleImages[0] &&
              eachRow.dataValues.title.dataValues.titleImages[0].path
                ? eachRow.dataValues.title.dataValues.titleImages[0].path.replace(
                    "p/original",
                    `p/${tittleImageW}`,
                  )
                : "",
            rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
            release_date: eachRow.dataValues.release_date_formatted
              ? eachRow.dataValues.release_date_formatted
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
