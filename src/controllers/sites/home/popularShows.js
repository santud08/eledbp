import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { envs } from "../../../config/index.js";
import { TITLE_SETTINGS, TABLES, LIST_PAGE } from "../../../utils/constants.js";
import { userService } from "../../../services/index.js";

/**
 * popularShows
 * it present popular_shows: popular,
 * @param req
 * @param res
 * @param next
 */
export const popularShows = async (req, res, next) => {
  try {
    const language = req.accept_language;
    const reqDate = req.query.date ? req.query.date : null;
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    let getCurrentDate = null;
    let getSettingsDetails = {};
    let withinTwoMonthDateWt = null;

    if (reqDate) {
      [getCurrentDate, getSettingsDetails, withinTwoMonthDateWt] = await Promise.all([
        customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.WEBTOONS.POPULAR.TIME_SPAN,
          LIST_PAGE.WEBTOONS.POPULAR.TYPE,
          reqDate,
          "YYYY-MM-DD",
        ),
      ]);
    } else {
      [getCurrentDate, getSettingsDetails, withinTwoMonthDateWt] = await Promise.all([
        customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.WEBTOONS.POPULAR.TIME_SPAN,
          LIST_PAGE.WEBTOONS.POPULAR.TYPE,
          null,
          "YYYY-MM-DD",
        ),
      ]);
    }
    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    //----------------------Most Popular Shows-------------------------------
    let popular = {};
    let moviePopularList = [];
    let tvPopularList = [];
    let webtoonsPopularList = [];

    if (settingValue != null && settingValue.most_popular_shows === true) {
      const popularMovieAttributes = [
        "id",
        "type",
        "year",
        "release_date",
        "runtime",
        "popularity",
        "tmdb_vote_average",
        "avg_rating",
      ];

      const popularTvAttributes = [
        "id",
        "type",
        "year",
        "release_date",
        "runtime",
        "popularity",
        "tmdb_vote_average",
        "avg_rating",
      ];

      const popularWebtoonsAttributes = [
        "id",
        "type",
        "year",
        [
          Sequelize.fn("IFNULL", Sequelize.fn("max", Sequelize.col("seasons.release_date")), null),
          "release_date",
        ],
        //"release_date",
        "runtime",
        "popularity",
        "tmdb_vote_average",
        "avg_rating",
        "title_status",
        ["calculate_popularity", "popularity_order"],
      ];
      const popularIncludeQuery = [
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
            "id",
            "title_id",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.TITLE_IMAGE_TABLE} WHERE ${TABLES.TITLE_IMAGE_TABLE}.title_id = title.id AND image_category='poster_image' AND is_main_poster='y' AND status='active' AND path IS NOT NULL AND path!='' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          required: true,
        },
        {
          model: model.creditable,
          attributes: ["people_id", "creditable_id", "creditable_type", "job"],
          left: true,
          include: [
            {
              model: model.people,
              left: true,
              attributes: ["id"],
              where: { status: "active" },
              include: [
                {
                  model: model.peopleTranslation,
                  attributes: ["people_id", "name", "known_for", "site_language"],
                  left: true,
                  where: { status: "active" },
                  required: false,
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
              required: false,
            },
          ],
          where: {
            status: "active",
            job: ["Directing", "Director"],
            creditable_type: ["title", "season"],
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
      const popularTVIncludeQuery = [
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
            "id",
            "title_id",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.TITLE_IMAGE_TABLE} WHERE ${TABLES.TITLE_IMAGE_TABLE}.title_id = title.id AND image_category='poster_image' AND is_main_poster='y' AND status='active' AND episode_id IS NULL AND original_name IS NOT NULL AND path IS NOT NULL AND path!='' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          required: true,
        },
        {
          model: model.season,
          attributes: ["title_id", "release_date", "release_date_to"],
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.SEASON_TABLE} WHERE ${TABLES.SEASON_TABLE}.title_id = title.id AND DATE_FORMAT(release_date, "%Y-%m-%d")<= DATE_FORMAT("${getCurrentDate}", "%Y-%m-%d") AND release_date IS NOT NULL AND status='active' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          left: true,
          required: true,
        },
        {
          model: model.creditable,
          attributes: ["people_id", "creditable_id", "creditable_type", "job"],
          left: true,
          include: [
            {
              model: model.people,
              left: true,
              attributes: ["id"],
              where: { status: "active" },
              include: [
                {
                  model: model.peopleTranslation,
                  attributes: ["people_id", "name", "known_for"],
                  left: true,
                  where: { site_language: language, status: "active" },
                  required: false,
                },
              ],
              required: false,
            },
          ],
          where: {
            status: "active",
            job: ["Directing", "Director"],
            creditable_type: ["title", "season"],
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
      const popularWebtoonsIncludeQuery = [
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
            "id",
            "title_id",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.TITLE_IMAGE_TABLE} WHERE ${TABLES.TITLE_IMAGE_TABLE}.title_id = title.id AND image_category='poster_image' AND is_main_poster='y' AND status='active' AND episode_id IS NULL AND original_name IS NOT NULL AND path IS NOT NULL AND path!='' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          required: true,
        },
        {
          model: model.season,
          attributes: ["title_id", "release_date", "release_date_to"],
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.SEASON_TABLE} WHERE ${TABLES.SEASON_TABLE}.title_id = title.id AND DATE_FORMAT(release_date, "%Y-%m-%d")<= DATE_FORMAT("${getCurrentDate}", "%Y-%m-%d") AND release_date IS NOT NULL AND status='active' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          left: true,
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
        {
          model: model.weeklyTelecast,
          attributes: ["telecast_day"],
          where: { status: "active" },
          left: true,
          reuired: false,
        },
      ];
      const webtoonHide = await userService.checkUserWebtoonMenu(req);
      const [popularMovieInformation, popularTvInformation, popularWebtoonsInformation] =
        await Promise.all([
          model.title.findAll({
            attributes: popularMovieAttributes,
            include: popularIncludeQuery,
            where: {
              record_status: "active",
              type: "movie",
              release_date: {
                [Op.and]: {
                  [Op.lte]: getCurrentDate,
                  [Op.ne]: null,
                },
              },
            },
            order: [
              ["avg_rating", "DESC"],
              ["id", "DESC"],
            ],
            limit: 5,
          }),
          model.title.findAll({
            attributes: popularTvAttributes,
            include: popularTVIncludeQuery,
            where: {
              record_status: "active",
              type: "tv",
            },
            order: [
              ["avg_rating", "DESC"],
              ["id", "DESC"],
            ],
            limit: 5,
            group: ["title.id"],
          }),
          webtoonHide
            ? []
            : model.title.findAll({
                attributes: popularWebtoonsAttributes,
                include: popularWebtoonsIncludeQuery,
                where: {
                  record_status: "active",
                  type: "webtoons",
                  [Op.or]: [
                    {
                      "$seasons.release_date$": {
                        [Op.between]: [withinTwoMonthDateWt, getCurrentDate],
                      },
                    },
                  ],
                },
                order: [[Sequelize.literal("popularity_order"), "DESC"]],
                group: ["title.id"],
                limit: 5,
                subQuery: false,
              }),
        ]);
      if (popularMovieInformation.length > 0) {
        for (const eachRow of popularMovieInformation) {
          if (eachRow && eachRow.dataValues) {
            const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
            const record = {
              title_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              title_name:
                eachRow.dataValues.titleTranslations[0] &&
                eachRow.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.titleTranslations[0].name
                  : "",
              poster_image:
                eachRow.dataValues.titleImages &&
                eachRow.dataValues.titleImages &&
                eachRow.dataValues.titleImages.length > 0 &&
                eachRow.dataValues.titleImages[0] &&
                eachRow.dataValues.titleImages[0].path
                  ? eachRow.dataValues.titleImages[0].path.replace(
                      "p/original",
                      `p/${tittleImageW}`,
                    )
                  : "",
              rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
              runtime: eachRow.dataValues.runtime ? eachRow.dataValues.runtime : "",
              release_date: eachRow.dataValues.release_date
                ? await customDateTimeHelper.changeDateFormat(
                    eachRow.dataValues.release_date,
                    "MMM DD,YYYY",
                  )
                : "",
              director_name:
                eachRow.dataValues.creditables &&
                eachRow.dataValues.creditables.length > 0 &&
                eachRow.dataValues.creditables[0] &&
                eachRow.dataValues.creditables[0].person &&
                eachRow.dataValues.creditables[0].person.peopleTranslations[0]
                  ? eachRow.dataValues.creditables[0].person.peopleTranslations[0].name
                  : "",
            };
            moviePopularList.push(record);
          }
        }
      }
      if (popularTvInformation.length > 0) {
        for (const eachRow of popularTvInformation) {
          if (eachRow && eachRow.dataValues) {
            const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
            const record = {
              title_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              title_name:
                eachRow.dataValues.titleTranslations[0] &&
                eachRow.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.titleTranslations[0].name
                  : "",
              poster_image:
                eachRow.dataValues.titleImages &&
                eachRow.dataValues.titleImages.length > 0 &&
                eachRow.dataValues.titleImages[0] &&
                eachRow.dataValues.titleImages[0].path
                  ? eachRow.dataValues.titleImages[0].path.replace(
                      "p/original",
                      `p/${tittleImageW}`,
                    )
                  : "",
              rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
              runtime: eachRow.dataValues.runtime ? eachRow.dataValues.runtime : "",
              release_date:
                eachRow.dataValues.seasons &&
                eachRow.dataValues.seasons.length > 0 &&
                eachRow.dataValues.seasons[0].release_date
                  ? await customDateTimeHelper.changeDateFormat(
                      eachRow.dataValues.seasons[0].release_date,
                      "MMM DD,YYYY",
                    )
                  : "",
              director_name:
                eachRow.dataValues.creditables &&
                eachRow.dataValues.creditables.length > 0 &&
                eachRow.dataValues.creditables[0] &&
                eachRow.dataValues.creditables[0].person &&
                eachRow.dataValues.creditables[0].person.peopleTranslations[0]
                  ? eachRow.dataValues.creditables[0].person.peopleTranslations[0].name
                  : "",
              no_of_episodes: eachRow.dataValues.episode_count
                ? eachRow.dataValues.episode_count
                : "",
            };
            tvPopularList.push(record);
          }
        }
      }
      if (popularWebtoonsInformation.length > 0) {
        for (const eachRow of popularWebtoonsInformation) {
          if (eachRow && eachRow.dataValues) {
            const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
            const record = {
              title_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              title_name:
                eachRow.dataValues.titleTranslations[0] &&
                eachRow.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.titleTranslations[0].name
                  : "",
              poster_image:
                eachRow.dataValues.titleImages &&
                eachRow.dataValues.titleImages.length > 0 &&
                eachRow.dataValues.titleImages[0] &&
                eachRow.dataValues.titleImages[0].path
                  ? eachRow.dataValues.titleImages[0].path.replace(
                      "p/original",
                      `p/${tittleImageW}`,
                    )
                  : "",
              rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
              runtime: "",
              release_date:
                eachRow.dataValues.seasons &&
                eachRow.dataValues.seasons.length > 0 &&
                eachRow.dataValues.seasons[0].release_date
                  ? await customDateTimeHelper.changeDateFormat(
                      eachRow.dataValues.seasons[0].release_date,
                      "MMM DD,YYYY",
                    )
                  : "",
              no_of_episodes: eachRow.dataValues.episode_count
                ? eachRow.dataValues.episode_count
                : "",
              title_status: eachRow.dataValues.title_status ? eachRow.dataValues.title_status : "",
            };
            record.weekly_telecast = [];
            if (eachRow.dataValues.weeklyTelecasts.length > 0) {
              for (const telecastData of eachRow.dataValues.weeklyTelecasts) {
                if (telecastData && telecastData.telecast_day)
                  record.weekly_telecast.push(telecastData.telecast_day);
              }
            }
            webtoonsPopularList.push(record);
          }
        }
      }
      popular.movie = moviePopularList;
      popular.tv_shows = tvPopularList;
      popular.webtoons = webtoonsPopularList;
    }

    res.ok({
      popular_shows: popular,
    });
  } catch (error) {
    next(error);
  }
};
