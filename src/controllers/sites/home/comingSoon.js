import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { envs } from "../../../config/index.js";
import { TITLE_SETTINGS, TABLES } from "../../../utils/constants.js";

/**
 * comingSoon
 * it present coming_soon: upcomings,
 * @param req
 * @param res
 * @param next
 */
export const comingSoon = async (req, res, next) => {
  try {
    const language = req.accept_language;
    const reqDate = req.query.date ? req.query.date : null;
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    let getSettingsDetails = {};
    let getCurrentDate = null;

    if (reqDate) {
      [getCurrentDate, getSettingsDetails] = await Promise.all([
        customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
      ]);
    } else {
      [getCurrentDate, getSettingsDetails] = await Promise.all([
        customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
      ]);
    }
    let todayName = await customDateTimeHelper.getDateFromCurrentDate(
      "add",
      1,
      "day",
      getCurrentDate,
      "dddd",
    );

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    // ----------------------Coming Soon SECTION::Movie and TV-------------------------------
    let upcomings = {};
    let movieUpcomingList = [];
    let tvUpcomingList = [];
    let webtoonsUpcomingList = [];

    if (settingValue != null && settingValue.comming_soon === true) {
      const upcomingAttributes = ["id", "type", "year", "release_date"];
      const upcomingIncludeQuery = [
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
                `(SELECT id FROM ${TABLES.TITLE_IMAGE_TABLE} WHERE ${TABLES.TITLE_IMAGE_TABLE}.title_id = title.id AND image_category='poster_image' AND is_main_poster='y' AND status='active' AND episode_id IS NULL AND path IS NOT NULL AND path!='' ORDER BY id DESC LIMIT 1)`,
              ),
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
      ];
      const upcomingTVIncludeQuery = [
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
            status: "active",
            release_date: {
              [Op.and]: {
                [Op.gt]: getCurrentDate,
                [Op.ne]: null,
              },
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
      ];

      const upcomingWebtoonsIncludeQuery = [
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
            status: "active",
            release_date: {
              [Op.and]: {
                [Op.gt]: getCurrentDate,
                [Op.ne]: null,
              },
            },
          },
          left: true,
          required: true,
        },
        {
          model: model.weeklyTelecast,
          where: { status: "active", telecast_day: `${todayName.toLowerCase()}` },
          reuired: true,
        },
      ];

      const upcomingMovieCondition = {
        record_status: "active",
        type: "movie",
        release_date: {
          [Op.and]: {
            [Op.gt]: getCurrentDate,
            [Op.ne]: null,
          },
        },
      };

      const upcomingTvCondition = {
        record_status: "active",
        type: "tv",
      };

      const upcomingWebtoonCondition = {
        record_status: "active",
        type: "webtoons",
        title_status: "ongoing",
      };
      const [upcomingMovieInformation, upcomingTvInformation, upcomingWebtoonInformation] =
        await Promise.all([
          model.title.findAll({
            attributes: upcomingAttributes,
            include: upcomingIncludeQuery,
            where: upcomingMovieCondition,
            order: [["release_date", "ASC"]],
            limit: 5,
            subQuery: false,
            group: ["title.id"],
          }),
          model.title.findAll({
            attributes: upcomingAttributes,
            include: upcomingTVIncludeQuery,
            where: upcomingTvCondition,
            order: [[model.season, "release_date", "ASC"]],
            group: ["title.id"],
            limit: 5,
            subQuery: false,
          }),
          envs.MENU_SETTINGS.HOME_PAGE_MENU_HIDE == "true"
            ? []
            : model.title.findAll({
                attributes: upcomingAttributes,
                include: upcomingWebtoonsIncludeQuery,
                where: upcomingWebtoonCondition,
                order: [[model.season, "release_date", "ASC"]],
                limit: 5,
              }),
        ]);
      if (upcomingMovieInformation.length > 0) {
        for (const eachRow of upcomingMovieInformation) {
          if (eachRow && eachRow.dataValues) {
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
            };
            movieUpcomingList.push(record);
          }
        }
      }
      if (upcomingTvInformation.length > 0) {
        for (const eachRow of upcomingTvInformation) {
          if (eachRow && eachRow.dataValues) {
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
            };
            tvUpcomingList.push(record);
          }
        }
      }
      if (upcomingWebtoonInformation.length > 0) {
        for (const eachRow of upcomingWebtoonInformation) {
          if (eachRow && eachRow.dataValues) {
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
            };
            webtoonsUpcomingList.push(record);
          }
        }
      }
      upcomings.movie = movieUpcomingList;
      upcomings.tv_shows = tvUpcomingList;
      upcomings.webtoons = webtoonsUpcomingList;
    }

    res.ok({
      coming_soon: upcomings,
    });
  } catch (error) {
    next(error);
  }
};
