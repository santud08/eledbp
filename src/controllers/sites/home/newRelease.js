import model from "../../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { Op, fn, col, Sequelize } from "sequelize";
import { envs } from "../../../config/index.js";
import { TABLES, LIST_PAGE } from "../../../utils/constants.js";
import { titleService, userService } from "../../../services/index.js";

/**
 * newRelease
 * it present new_release: newRelease,
 * @param req
 * @param res
 * @param next
 */
export const newRelease = async (req, res, next) => {
  try {
    const language = req.accept_language;
    const reqDate = req.query.date ? req.query.date : null;
    let timSpanDateTv = null;
    let timSpanDateMovie = null;
    let getCurrentDate = null;
    let getSettingsDetails = {};
    if (reqDate) {
      [getCurrentDate, getSettingsDetails, timSpanDateTv, timSpanDateMovie] = await Promise.all([
        customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.TV.NEWEST.TIME_SPAN,
          LIST_PAGE.TV.NEWEST.TYPE,
          reqDate,
          "YYYY-MM-DD",
        ),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.MOVIE.NEWEST.TIME_SPAN,
          LIST_PAGE.MOVIE.NEWEST.TYPE,
          reqDate,
          "YYYY-MM-DD",
        ),
      ]);
    } else {
      [getCurrentDate, getSettingsDetails, timSpanDateTv, timSpanDateMovie] = await Promise.all([
        customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.TV.NEWEST.TIME_SPAN,
          LIST_PAGE.TV.NEWEST.TYPE,
          null,
          "YYYY-MM-DD",
        ),
        customDateTimeHelper.getDateFromCurrentDate(
          "sub",
          LIST_PAGE.MOVIE.NEWEST.TIME_SPAN,
          LIST_PAGE.MOVIE.NEWEST.TYPE,
          null,
          "YYYY-MM-DD",
        ),
      ]);
    }

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    // //----------------------New Release-------------------------------
    let newRelease = {};
    let movieNewReleaseList = [];
    let tvNewReleaseList = [];
    let webtoonsNewReleaseList = [];

    if (settingValue != null && settingValue.new_release === true) {
      const newReleaseAttributes = [
        "id",
        "type",
        "year",
        "release_date",
        "rating",
        "runtime",
        "episode_count",
        "popularity",
        "tmdb_vote_average",
        "avg_rating",
        "title_status",
      ];
      const newReleaseIncludeQuery = [
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
          model: model.titleReRelease,
          attributes: ["title_id", "re_release_date"],
          left: true,
          where: {
            status: "active",
          },
          required: false,
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
            image_category: "poster_image",
            is_main_poster: "y",
            status: "active",
            episode_id: null,
            [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
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
      const newReleaseTVIncludeQuery = [
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
            image_category: "poster_image",
            is_main_poster: "y",
            status: "active",
            episode_id: null,
            original_name: {
              [Op.ne]: null,
            },
            [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
          },
          required: true,
        },
        {
          model: model.season,
          attributes: ["title_id", "release_date", "release_date_to", "episode_count"],
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.SEASON_TABLE} WHERE ${TABLES.SEASON_TABLE}.title_id = title.id AND DATE_FORMAT(release_date, "%Y-%m-%d") > "${timSpanDateTv}" AND DATE_FORMAT(release_date, "%Y-%m-%d")<="${getCurrentDate}" AND release_date IS NOT NULL AND status='active' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          left: true,
          required: true,
        },
        {
          model: model.tagGable,
          attributes: ["taggable_id", "tag_id", "taggable_type"],
          left: true,
          where: {
            status: "active",
            taggable_type: "title",
          },
          include: [
            {
              model: model.tag,
              left: true,
              attributes: ["id"],
              where: { status: "active" },
              include: [
                {
                  model: model.tagTranslation,
                  attributes: ["tag_id", "display_name", "site_language"],
                  left: true,
                  where: { status: "active" },
                  required: true,
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
              required: false,
            },
          ],
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
      const newReleaseWebtoonsIncludeQuery = [
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
            image_category: "poster_image",
            is_main_poster: "y",
            status: "active",
            episode_id: null,
            original_name: {
              [Op.ne]: null,
            },
            [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
          },
          required: true,
        },
        {
          model: model.season,
          attributes: ["title_id", "release_date", "release_date_to", "episode_count"],
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `(SELECT id FROM ${TABLES.SEASON_TABLE} WHERE ${TABLES.SEASON_TABLE}.title_id = title.id AND DATE_FORMAT(release_date, "%Y-%m-%d") > "${timSpanDateTv}" AND DATE_FORMAT(release_date, "%Y-%m-%d")<="${getCurrentDate}" AND release_date IS NOT NULL AND status='active' ORDER BY id DESC LIMIT 1)`,
              ),
            },
          },
          left: true,
          required: true,
        },
        {
          model: model.tagGable,
          attributes: ["taggable_id", "tag_id", "taggable_type"],
          left: true,
          where: {
            status: "active",
            taggable_type: "title",
          },
          include: [
            {
              model: model.tag,
              left: true,
              attributes: ["id"],
              where: { status: "active" },
              include: [
                {
                  model: model.tagTranslation,
                  attributes: ["tag_id", "display_name", "site_language"],
                  left: true,
                  where: { status: "active" },
                  required: true,
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
              required: false,
            },
          ],
          required: false,
        },
      ];
      const newReleaseMovieCondition = {
        record_status: "active",
        type: "movie",
        [Op.or]: [
          {
            "$title.release_date$": {
              [Op.and]: {
                [Op.gt]: timSpanDateMovie,
                [Op.lte]: getCurrentDate,
                [Op.ne]: null,
              },
            },
          },
          {
            "$titleReReleases.re_release_date$": {
              [Op.and]: {
                [Op.gt]: timSpanDateMovie,
                [Op.lte]: getCurrentDate,
                [Op.ne]: null,
              },
            },
          },
        ],
      };
      const newReleaseTvCondition = {
        record_status: "active",
        type: "tv",
        [Op.and]: [
          {
            "$seasons.release_date$": {
              [Op.and]: {
                [Op.gt]: timSpanDateTv,
                [Op.lte]: getCurrentDate,
                [Op.ne]: null,
              },
            },
          },
        ],
      };

      const newReleaseWebtoonCondition = {
        record_status: "active",
        type: "webtoons",
        [Op.and]: [
          {
            "$seasons.release_date$": {
              [Op.and]: {
                [Op.gt]: timSpanDateTv,
                [Op.lte]: getCurrentDate,
                [Op.ne]: null,
              },
            },
          },
        ],
      };
      const webtoonHide = await userService.checkUserWebtoonMenu(req);
      let [newReleaseMovieInformation, newReleaseTvInformation, newReleaseWebtoonInformation] =
        await Promise.all([
          model.title.findAll({
            attributes: newReleaseAttributes,
            include: newReleaseIncludeQuery,
            where: newReleaseMovieCondition,
            order: [
              ["release_date", "DESC"],
              [model.titleReRelease, "re_release_date", "DESC"],
              ["id", "DESC"],
            ],
            limit: 5,
            group: ["title.id"],
            subQuery: false,
          }),
          model.title.findAll({
            attributes: newReleaseAttributes,
            include: newReleaseTVIncludeQuery,
            where: newReleaseTvCondition,
            order: [
              [model.season, "release_date", "DESC"],
              ["id", "DESC"],
            ],
            limit: 5,
            group: ["title.id"],
            subQuery: false,
          }),
          webtoonHide
            ? []
            : model.title.findAll({
                attributes: newReleaseAttributes,
                include: newReleaseWebtoonsIncludeQuery,
                where: newReleaseWebtoonCondition,
                order: [
                  [model.season, "release_date", "DESC"],
                  ["release_date", "DESC"],
                  ["id", "DESC"],
                ],
                limit: 5,
                group: ["title.id"],
                subQuery: false,
              }),
        ]);

      if (newReleaseMovieInformation.length > 0) {
        for (const eachRow of newReleaseMovieInformation) {
          if (eachRow) {
            const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
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
              rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
              runtime: eachRow.dataValues.runtime ? eachRow.dataValues.runtime : "",
              release_date:
                eachRow.dataValues.titleReReleases[0] &&
                eachRow.dataValues.titleReReleases[0].re_release_date &&
                eachRow.dataValues.titleReReleases[0].re_release_date < getCurrentDate
                  ? await customDateTimeHelper.changeDateFormat(
                      eachRow.dataValues.titleReReleases[0].re_release_date,
                      "MMM DD,YYYY",
                    )
                  : eachRow.dataValues.release_date
                  ? await customDateTimeHelper.changeDateFormat(
                      eachRow.dataValues.release_date,
                      "MMM DD,YYYY",
                    )
                  : "",
            };

            // Getting the tag data Values:
            record.tags = [];
            if (eachRow.dataValues.id) {
              const getGenre = await model.tagGable.findAll({
                attributes: ["tag_id", "taggable_id", "taggable_type"],
                where: {
                  taggable_id: eachRow.dataValues.id,
                  taggable_type: "title",
                  status: "active",
                },
                include: [
                  {
                    model: model.tag,
                    left: true,
                    attributes: ["id", "type"],
                    where: { type: "genre", status: "active" },
                  },
                  {
                    model: model.tagTranslation,
                    attributes: ["tag_id", "display_name", "site_language"],
                    left: true,
                    where: { status: "active" },
                    required: false,
                    separate: true,
                    order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              if (getGenre) {
                for (const eachRow of getGenre) {
                  if (eachRow) {
                    const name =
                      eachRow.tagTranslations[0] && eachRow.tagTranslations[0].display_name
                        ? eachRow.tagTranslations[0].display_name
                        : "";
                    record.tags.push(name);
                  }
                }
              }
            }
            movieNewReleaseList.push(record);
          }
        }
      }
      if (newReleaseTvInformation.length > 0) {
        for (const eachRow of newReleaseTvInformation) {
          if (eachRow && eachRow.dataValues) {
            const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
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
              no_of_episodes:
                eachRow.dataValues.seasons &&
                eachRow.dataValues.seasons.length > 0 &&
                eachRow.dataValues.seasons[0].episode_count
                  ? eachRow.dataValues.seasons[0].episode_count
                  : "",
            };
            record.tags = [];
            if (eachRow.dataValues.tagGables.length > 0) {
              for (const tagData of eachRow.dataValues.tagGables) {
                const titleTags =
                  tagData.tags &&
                  tagData.tags.length > 0 &&
                  tagData.tags[0].tagTranslations &&
                  tagData.tags[0].tagTranslations.length > 0
                    ? tagData.tags[0].tagTranslations[0].display_name
                    : "";
                record.tags.push(titleTags);
              }
            }
            tvNewReleaseList.push(record);
          }
        }
      }
      if (newReleaseWebtoonInformation.length > 0) {
        for (const eachRow of newReleaseWebtoonInformation) {
          if (eachRow && eachRow.dataValues) {
            const totalRating = eachRow.dataValues.avg_rating ? eachRow.dataValues.avg_rating : 0;
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
              no_of_episodes:
                eachRow.dataValues.seasons &&
                eachRow.dataValues.seasons.length > 0 &&
                eachRow.dataValues.seasons[0].episode_count
                  ? eachRow.dataValues.seasons[0].episode_count
                  : "",
              title_status: eachRow.dataValues.title_status ? eachRow.dataValues.title_status : "",
            };
            record.weekly_telecast = [];
            if (record.title_id > 0) {
              const weeklyTelecast = await model.weeklyTelecast.findAll({
                attributes: ["telecast_day"],
                where: { title_id: record.title_id, status: "active" },
              });
              let weeklyTelecastList = [];
              if (weeklyTelecast && weeklyTelecast.length > 0) {
                weeklyTelecastList = weeklyTelecast.map((wt) => wt.telecast_day);
              }
              record.weekly_telecast =
                weeklyTelecastList.length > 0
                  ? await generalHelper.sortDaysOfWeek(weeklyTelecastList)
                  : [];
            }

            record.tags = [];
            if (eachRow.dataValues.tagGables.length > 0) {
              for (const tagData of eachRow.dataValues.tagGables) {
                const titleTags =
                  tagData.tags &&
                  tagData.tags.length > 0 &&
                  tagData.tags[0].tagTranslations &&
                  tagData.tags[0].tagTranslations.length > 0
                    ? tagData.tags[0].tagTranslations[0].display_name
                    : "";
                record.tags.push(titleTags);
              }
            }
            webtoonsNewReleaseList.push(record);
          }
        }
      }
      newRelease.movie = movieNewReleaseList;
      newRelease.tv_shows = tvNewReleaseList;
      newRelease.webtoons = webtoonsNewReleaseList;
    }

    res.ok({
      new_release: newRelease,
    });
  } catch (error) {
    next(error);
  }
};
