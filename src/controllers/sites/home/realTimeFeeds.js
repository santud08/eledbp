import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op, fn, col } from "sequelize";
import { envs } from "../../../config/index.js";
import { TITLE_SETTINGS } from "../../../utils/constants.js";

/**
 * realTimeFeeds
 * it present real_time_feeds: realTimeFeedList,
 * @param req
 * @param res
 * @param next
 */

export const realTimeFeeds = async (req, res, next) => {
  try {
    const language = req.accept_language;
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    const getSettingsDetails = await model.settings.findOne({
      where: { name: "settings.front_lists.main", status: "active" },
    });
    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    // ----------------------Real Time Feeds-------------------------------
    let realTimeFeedList = [];
    if (
      settingValue != null &&
      settingValue.real_time_feeds === true &&
      envs.MENU_SETTINGS.HOME_PAGE_MENU_HIDE == "false"
    ) {
      const realTImeFeedAttributes = [
        "id",
        "content",
        "commentable_type",
        "community_type",
        "season_id",
        "user_id",
        "created_at",
        "commentable_id",
      ];
      const realTimeFeedIncludeQuery = [
        {
          model: model.title,
          attributes: ["id", "record_status", "type"],
          left: true,
          where: { record_status: "active" },
          include: [
            {
              model: model.titleTranslation,
              attributes: ["title_id", "name", "site_language"],
              left: true,
              where: { status: "active" },
              required: false,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.titleImage,
              attributes: [
                "id",
                "title_id",
                "original_name",
                "file_name",
                "url",
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
              required: false,
              separate: true, //get the recently added image
              order: [["id", "DESC"]],
            },
          ],
        },
        {
          model: model.user,
          left: true,
          attributes: [
            "username",
            [fn("CONCAT", col("user.first_name"), " ", col("user.last_name")), "user_name"],
            [fn("REPLACE", col("avatar"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "avatar"],
          ],
          where: { status: "active" },
          required: false,
        },
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
            {
              model: model.peopleImages,
              attributes: [
                "people_id",
                [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
                "file_name",
                "url",
                "is_main_poster",
              ],
              left: true,
              where: {
                image_category: "poster_image",
                is_main_poster: "y",
                status: "active",
              },
              required: false,
              separate: true, //get the recently added image
              order: [["id", "DESC"]],
            },
          ],
          required: false,
        },
        {
          model: model.season,
          attributes: ["id", "number"],
          left: true,
          include: [
            {
              model: model.seasonTranslation,
              attributes: ["season_id", "season_name", "site_language"],
              left: true,
              where: { status: "active" },
              required: false,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          ],
          where: {
            status: "active",
          },
          required: false,
        },
        {
          model: model.people,
          as: "famousePeople",
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
            {
              model: model.peopleImages,
              attributes: [
                "people_id",
                [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
                "file_name",
                "url",
                "is_main_poster",
              ],
              left: true,
              where: {
                image_category: "poster_image",
                is_main_poster: "y",
                status: "active",
              },
              required: false,
              separate: true, //get the recently added image
              order: [["id", "DESC"]],
            },
          ],
          required: false,
        },
      ];

      const feedCondition = {
        status: "active",
        site_language: language,
        commentable_type: "title",
        parent_id: { [Op.eq]: 0 },
      };
      const realTimeFeedInformation = await model.community.findAll({
        attributes: realTImeFeedAttributes,
        include: realTimeFeedIncludeQuery,
        where: feedCondition,
        order: [["created_at", "DESC"]],
        limit: 5,
        subQuery: false,
      });

      if (realTimeFeedInformation.length > 0) {
        for (const eachRow of realTimeFeedInformation) {
          if (eachRow && eachRow.dataValues) {
            const record = {
              commentable_id: eachRow.dataValues.commentable_id
                ? eachRow.dataValues.commentable_id
                : "",
              feed_category: eachRow.dataValues.community_type
                ? eachRow.dataValues.community_type
                : "",
              feed_details: eachRow.dataValues.content ? eachRow.dataValues.content : "",
              feed_title:
                eachRow.dataValues.title &&
                eachRow.dataValues.title.dataValues.titleTranslations[0] &&
                eachRow.dataValues.title.dataValues.titleTranslations[0].name
                  ? eachRow.dataValues.title.dataValues.titleTranslations[0].name
                  : "",
              feed_title_type:
                eachRow.dataValues.title && eachRow.dataValues.title.type
                  ? eachRow.dataValues.title.type
                  : "",
              feed_image:
                eachRow.dataValues.title &&
                eachRow.dataValues.title.dataValues.titleImages &&
                eachRow.dataValues.title.dataValues.titleImages.length > 0 &&
                eachRow.dataValues.title.dataValues.titleImages[0] &&
                eachRow.dataValues.title.dataValues.titleImages[0].path
                  ? eachRow.dataValues.title.dataValues.titleImages[0].path.replace(
                      "p/original",
                      `p/${tittleImageW}`,
                    )
                  : "",
              feed_season_title:
                eachRow.dataValues.season &&
                eachRow.dataValues.season.dataValues.seasonTranslation &&
                eachRow.dataValues.season.dataValues.seasonTranslation.length > 0 &&
                eachRow.dataValues.season.dataValues.seasonTranslation[0] &&
                eachRow.dataValues.season.dataValues.seasonTranslation[0].season_name
                  ? eachRow.dataValues.season.dataValues.seasonTranslation[0].season_name
                  : "",
              feed_season_number:
                eachRow.dataValues.season && eachRow.dataValues.season.number
                  ? eachRow.dataValues.season.number
                  : "",
              feed_people_name:
                eachRow.dataValues.person &&
                eachRow.dataValues.person.dataValues.peopleTranslations[0] &&
                eachRow.dataValues.person.dataValues.peopleTranslations[0].name
                  ? eachRow.dataValues.person.dataValues.peopleTranslations[0].name
                  : "",
              feed_people_image:
                eachRow.dataValues.person &&
                eachRow.dataValues.person.dataValues.peopleImages &&
                eachRow.dataValues.person.dataValues.peopleImages.length > 0 &&
                eachRow.dataValues.person.dataValues.peopleImages[0] &&
                eachRow.dataValues.person.dataValues.peopleImages[0].path
                  ? eachRow.dataValues.person.dataValues.peopleImages[0].path.replace(
                      "p/original",
                      `p/${tittleImageW}`,
                    )
                  : "",
              feed_date: eachRow.dataValues.created_at
                ? await customDateTimeHelper.changeDateFormat(
                    eachRow.dataValues.created_at,
                    "MMM DD,YYYY",
                  )
                : "",
              feed_time: eachRow.dataValues.created_at ? eachRow.dataValues.created_at : "",
              feed_user_name:
                eachRow.dataValues.user && eachRow.dataValues.user.dataValues.user_name
                  ? eachRow.dataValues.user.dataValues.user_name
                  : "",
              feed_user_image:
                eachRow.dataValues.user && eachRow.dataValues.user.dataValues.avatar
                  ? eachRow.dataValues.user.dataValues.avatar
                  : "",
            };
            if (record.feed_category == "famous_line") {
              record.feed_people_name =
                eachRow.dataValues.famousePeople &&
                eachRow.dataValues.famousePeople.dataValues.peopleTranslations[0] &&
                eachRow.dataValues.famousePeople.dataValues.peopleTranslations[0].name
                  ? eachRow.dataValues.famousePeople.dataValues.peopleTranslations[0].name
                  : "";
              record.feed_people_id =
                eachRow.dataValues.famousePeople && eachRow.dataValues.famousePeople.dataValues.id
                  ? eachRow.dataValues.famousePeople.dataValues.id
                  : "";
              record.feed_people_image =
                eachRow.dataValues.famousePeople &&
                eachRow.dataValues.famousePeople.dataValues.peopleImages &&
                eachRow.dataValues.famousePeople.dataValues.peopleImages.length > 0 &&
                eachRow.dataValues.famousePeople.dataValues.peopleImages[0] &&
                eachRow.dataValues.famousePeople.dataValues.peopleImages[0].path
                  ? eachRow.dataValues.famousePeople.dataValues.peopleImages[0].path.replace(
                      "p/original",
                      `p/${tittleImageW}`,
                    )
                  : "";
              record.feed_people_character = "";
              record.feed_description = "";
              let fIncludes = [];
              if (record.feed_title_type == "webtoons") {
                fIncludes = [
                  {
                    model: model.creditableTranslation,
                    attributes: [
                      "character_name",
                      "character_image",
                      "site_language",
                      "description",
                    ],
                    where: { status: "active" },
                    separate: true,
                    left: true,
                    required: false,
                    order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                  },
                ];
              }
              const getCreditables = await model.creditable.findOne({
                attributes: ["character_name", "department"],
                include: fIncludes,
                where: {
                  people_id: record.feed_people_id,
                  creditable_type: "title",
                  creditable_id: record.commentable_id,
                  status: "active",
                },
              });
              if (getCreditables) {
                if (getCreditables.department == "character") {
                  record.feed_people_character = getCreditables.character_name
                    ? getCreditables.character_name
                    : "";
                  record.feed_people_name = "";
                  record.feed_people_id = "";
                  record.feed_people_image =
                    getCreditables.creditableTranslations &&
                    getCreditables.creditableTranslations.length > 0 &&
                    getCreditables.creditableTranslations[0] &&
                    getCreditables.creditableTranslations[0].character_image
                      ? getCreditables.creditableTranslations[0].character_image.replace(
                          "p/original",
                          `p/${tittleImageW}`,
                        )
                      : "";
                  record.feed_description =
                    getCreditables.creditableTranslations &&
                    getCreditables.creditableTranslations.length > 0 &&
                    getCreditables.creditableTranslations[0] &&
                    getCreditables.creditableTranslations[0].description
                      ? getCreditables.creditableTranslations[0].description
                      : "";
                } else {
                  record.feed_people_character = getCreditables.character_name
                    ? getCreditables.character_name
                    : "";
                }
              }
            }
            realTimeFeedList.push(record);
          }
        }
      }
    }

    res.ok({
      real_time_feeds: realTimeFeedList,
    });
  } catch (error) {
    next(error);
  }
};
