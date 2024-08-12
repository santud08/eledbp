import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { paginationService, titleService, userService } from "../../../services/index.js";
import { envs } from "../../../config/index.js";
import { LIST_PAGE } from "../../../utils/constants.js";

/**
 * trendings
 * it present trendings: trendings,
 * @param req
 * @param res
 * @param next
 */
export const trendings = async (req, res, next) => {
  try {
    const language = req.accept_language;
    const reqDate = req.query.date ? req.query.date : null;

    let getCurrentDate = null;
    let withinTwoMonthDate = null;
    let getSettingsDetails = {};
    let withinThreeMonthDate = null;
    if (reqDate) {
      [getCurrentDate, withinTwoMonthDate, getSettingsDetails, withinThreeMonthDate] =
        await Promise.all([
          customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
          customDateTimeHelper.getDateFromCurrentDate(
            "sub",
            LIST_PAGE.MOVIE.POPULAR.TIME_SPAN,
            LIST_PAGE.MOVIE.POPULAR.TYPE,
            reqDate,
            "YYYY-MM-DD",
          ),
          // check for setting - whether the particular section is enabled
          model.settings.findOne({
            where: { name: "settings.front_lists.main", status: "active" },
          }),
          customDateTimeHelper.getDateFromCurrentDate(
            "sub",
            LIST_PAGE.TV.POPULAR.TIME_SPAN,
            LIST_PAGE.TV.POPULAR.TYPE,
            reqDate,
            "YYYY-MM-DD",
          ),
        ]);
    } else {
      [getCurrentDate, withinTwoMonthDate, getSettingsDetails, withinThreeMonthDate] =
        await Promise.all([
          customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
          customDateTimeHelper.getDateFromCurrentDate(
            "sub",
            LIST_PAGE.MOVIE.POPULAR.TIME_SPAN,
            LIST_PAGE.MOVIE.POPULAR.TYPE,
            null,
            "YYYY-MM-DD",
          ),
          // check for setting - whether the particular section is enabled
          model.settings.findOne({
            where: { name: "settings.front_lists.main", status: "active" },
          }),
          customDateTimeHelper.getDateFromCurrentDate(
            "sub",
            LIST_PAGE.TV.POPULAR.TIME_SPAN,
            LIST_PAGE.TV.POPULAR.TYPE,
            null,
            "YYYY-MM-DD",
          ),
        ]);
    }

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    //// ----------------------TRENDING SECTION::-----------------------------------
    //// ----------------------TRENDING SECTION::MOVIES-------------------------------
    let trendings = {};
    let movieTrendingList = [];
    let tvTrendingList = [];
    let webtoonsTrendingList = [];

    if (settingValue != null && settingValue.trending === true) {
      const searchParams = {
        page: 1,
        limit: 5,
        sortBy: "",
        sortOrder: "",
        subQuery: false,
      };
      const searchParamsTv = {
        page: 1,
        limit: 5,
        sortBy: "",
        sortOrder: "",
        subQuery: false,
      };

      const trendingMovieAttributes = [
        "id",
        "release_date",
        ["calculate_popularity", "popularity_order"],
      ];
      const trendingMovieIncludeQuery = [
        {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "site_language"],
          left: true,
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
        {
          model: model.titleImage,
          attributes: ["title_id"],
          left: true,
          where: {
            image_category: "poster_image",
            is_main_poster: "y",
            status: "active",
            [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
          },
          required: true,
        },
        {
          model: model.titleReRelease,
          attributes: ["title_id", "re_release_date"],
          left: true,
          where: {
            status: "active",
          },
          required: false,
        },
        {
          model: model.titleCountries,
          as: "kotitleCountries",
          left: true,
          attributes: ["title_id", "country_id"],
          where: {
            status: "active",
          },
          required: true,
        },
      ];

      const trendingMovieCondition = {
        type: "movie",
        record_status: "active",
        [Op.or]: [
          { "$title.release_date$": { [Op.between]: [withinTwoMonthDate, getCurrentDate] } },
          {
            "$titleReReleases.re_release_date$": {
              [Op.between]: [withinTwoMonthDate, getCurrentDate],
            },
          },
        ],
      };

      ////----------------------TRENDING SECTION::TV-------------------------------
      const trendingTvAttributes = [
        "id",
        "title_id",
        [Sequelize.col("calculate_popularity"), "popularity_order"],
      ];
      const trendingTvIncludeQuery = [
        {
          model: model.title,
          left: true,
          attributes: ["id", "type"],
          where: {
            type: "tv",
            record_status: "active",
          },
          required: true,
          include: [
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
              attributes: ["title_id"],
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
              required: true,
            },
            {
              model: model.titleCountries,
              as: "kotitleCountries",
              left: true,
              attributes: ["title_id", "country_id"],
              where: {
                status: "active",
              },
              required: true,
            },
          ],
        },
      ];

      const trendingTvCondition = {
        status: "active",
        [Op.and]: [{ release_date: { [Op.between]: [withinThreeMonthDate, getCurrentDate] } }],
      };
      searchParamsTv.sortOrderObj = [[Sequelize.literal("popularity_order"), "DESC"]];

      searchParams.sortOrderObj = [[Sequelize.literal("popularity_order"), "DESC"]];
      const groupBy = ["title.id"];

      //// ----------------------TRENDING SECTION::Webtoons-------------------------------
      const trendingWebtoonsSearchParams = {
        page: 1,
        limit: 5,
        sortBy: "avg_rating",
        sortOrder: "DESC",
        subQuery: false,
      };
      const trendingWebtoonsAttributes = [
        "id",
        "type",
        "year",
        //"release_date",
        [
          Sequelize.fn("IFNULL", Sequelize.fn("max", Sequelize.col("seasons.release_date")), null),
          "release_date",
        ],
        "title_status",
        "avg_rating",
      ];
      const trendingWebtoonsIncludeQuery = [
        {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "site_language"],
          left: true,
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
        {
          model: model.titleImage,
          attributes: [
            "title_id",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
            image_category: "poster_image",
            is_main_poster: "y",
            status: "active",
            episode_id: null,
            original_name: {
              [Op.ne]: null,
            },
            //[Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
          },
          required: true,
        },
        {
          model: model.season,
          attributes: ["title_id", "release_date"],
          left: true,
          where: { status: "active" },
          required: false,
        },
        {
          model: model.titleCountries,
          as: "kotitleCountries",
          left: true,
          attributes: ["title_id", "country_id"],
          where: {
            status: "active",
          },
          required: true,
        },
      ];

      trendingWebtoonsSearchParams.sortOrderObj = [[Sequelize.literal("release_date"), "DESC"]];

      const trendingWebtoonsCondition = {
        type: "webtoons",
        record_status: "active",
        title_status: "ongoing",
      };
      const groupByWebtoon = ["title.id"];
      const webtoonHide = await userService.checkUserWebtoonMenu(req);

      //fetch record
      const groupByTv = ["title_id"];
      const [
        getTrendingMovieInformation,
        getTrendingTvInformation,
        getTrendingWebtoonsInformation,
      ] = await Promise.all([
        paginationService.paginationWithGroupBy(
          searchParams,
          model.title,
          trendingMovieIncludeQuery,
          trendingMovieCondition,
          trendingMovieAttributes,
          groupBy,
        ),

        paginationService.paginationWithGroupBy(
          searchParamsTv,
          model.season,
          trendingTvIncludeQuery,
          trendingTvCondition,
          trendingTvAttributes,
          groupByTv,
        ),
        webtoonHide
          ? []
          : paginationService.paginationWithGroupBy(
              trendingWebtoonsSearchParams,
              model.title,
              trendingWebtoonsIncludeQuery,
              trendingWebtoonsCondition,
              trendingWebtoonsAttributes,
              groupByWebtoon,
            ),
      ]);

      const resTrendingMovieCount =
        typeof getTrendingMovieInformation.count == "object"
          ? getTrendingMovieInformation.count.length
          : getTrendingMovieInformation.count;
      delete getTrendingMovieInformation.count;
      getTrendingMovieInformation.count = resTrendingMovieCount;

      if (getTrendingMovieInformation.count > 0) {
        for (const eachRow of getTrendingMovieInformation.rows) {
          if (eachRow && eachRow.dataValues) {
            const record = {
              title_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              title_name:
                eachRow.dataValues.titleTranslations[0] &&
                eachRow.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.titleTranslations[0].name
                  : "",
              poster_image: await titleService.getLatestMoviePosterImage(
                eachRow.dataValues.id ? eachRow.dataValues.id : "",
              ),
            };
            movieTrendingList.push(record);
          }
        }
      }
      trendings.movies = movieTrendingList;

      const resTrendingTvCount =
        typeof getTrendingTvInformation.count == "object"
          ? getTrendingTvInformation.count.length
          : getTrendingTvInformation.count;
      delete getTrendingTvInformation.count;
      getTrendingTvInformation.count = resTrendingTvCount;

      if (getTrendingTvInformation.count > 0) {
        for (const eachRow of getTrendingTvInformation.rows) {
          if (eachRow && eachRow.dataValues) {
            const record = {
              title_id: eachRow.dataValues.title_id ? eachRow.dataValues.title_id : "",
              title_name:
                eachRow.dataValues.title.dataValues.titleTranslations[0] &&
                eachRow.dataValues.title.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.title.dataValues.titleTranslations[0].name
                  : "",
              poster_image: await titleService.getLatestTvPosterImage(
                eachRow.dataValues.title_id ? eachRow.dataValues.title_id : "",
              ),
            };
            tvTrendingList.push(record);
          }
        }
      }
      trendings.tv_shows = tvTrendingList;

      const resTrendingWebtoonsCount =
        typeof getTrendingWebtoonsInformation.count == "object"
          ? getTrendingWebtoonsInformation.count.length
          : getTrendingWebtoonsInformation.count;
      delete getTrendingWebtoonsInformation.count;
      getTrendingWebtoonsInformation.count = resTrendingWebtoonsCount;

      if (getTrendingWebtoonsInformation.count > 0) {
        for (const eachRow of getTrendingWebtoonsInformation.rows) {
          if (eachRow) {
            const record = {
              title_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              title_name:
                eachRow.dataValues.titleTranslations[0] &&
                eachRow.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.titleTranslations[0].name
                  : "",
              poster_image: await titleService.getLatestTvPosterImage(
                eachRow.dataValues.id ? eachRow.dataValues.id : "",
              ),
            };
            webtoonsTrendingList.push(record);
          }
        }
      }
      trendings.webtoons = webtoonsTrendingList;
    }

    res.ok({
      trendings: trendings,
    });
  } catch (error) {
    next(error);
  }
};
