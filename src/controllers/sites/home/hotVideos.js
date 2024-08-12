import model from "../../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { envs } from "../../../config/index.js";

/**
 * hotVideos
 * it present hot_videos: hottestVideoList
 * @param req
 * @param res
 * @param next
 */
export const hotVideos = async (req, res, next) => {
  try {
    const reqDate = req.query.date ? req.query.date : null;
    let getSettingsDetails = {};
    let withinOneMonthDate = null;
    let getCurrentDate = null;
    if (reqDate) {
      [getCurrentDate, withinOneMonthDate, getSettingsDetails] = await Promise.all([
        customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
        customDateTimeHelper.getDateFromCurrentDate("subtract", 12, "month", reqDate, "YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
      ]);
    } else {
      [getCurrentDate, withinOneMonthDate, getSettingsDetails] = await Promise.all([
        customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
        customDateTimeHelper.getDateFromCurrentDate("subtract", 12, "month", null, "YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
      ]);
    }

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    // ----------------------Hottest Videos -------------------------------
    let hottestVideoList = [];

    if (settingValue != null && settingValue.hot_video === true) {
      const hottestVideoAttributes = [
        "item_id",
        "type",
        [Sequelize.fn("COUNT", Sequelize.col("item_id")), "total_count"],
      ];
      const hottestVideoIncludeQuery = [
        {
          model: model.video,
          attributes: [
            "id",
            "name",
            "thumbnail",
            "video_duration",
            "video_source",
            [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "url"],
            "title_id",
          ],
          left: true,
          where: {
            video_for: "title",
            status: "active",
            [Op.and]: [
              { url: { [Op.ne]: null } },
              { url: { [Op.ne]: "" } },
              { thumbnail: { [Op.ne]: null } },
              { thumbnail: { [Op.ne]: "" } },
            ],
            created_at: {
              [Op.and]: {
                [Op.gte]: withinOneMonthDate,
                [Op.lte]: getCurrentDate,
                [Op.ne]: null,
              },
            },
          },
          include: {
            model: model.title,
            left: true,
            attributes: ["id", "type"],
            where: {
              record_status: "active",
            },
            required: true,
            include: {
              model: model.titleCountries,
              as: "kotitleCountries",
              left: true,
              attributes: ["title_id", "country_id"],
              where: {
                status: "active",
              },
              required: true,
            },
          },
          required: true,
        },
      ];

      const hottestVideoCondition = {
        status: "active",
        created_at: {
          [Op.and]: {
            [Op.gte]: withinOneMonthDate,
            [Op.lte]: getCurrentDate,
            [Op.ne]: null,
          },
        },
      };

      const hottestVideoInformation = await model.usersActivity.findAll({
        attributes: hottestVideoAttributes,
        include: hottestVideoIncludeQuery,
        where: hottestVideoCondition,
        group: ["item_id"],
        order: [[Sequelize.literal("total_count"), "DESC"]], // need to add one month popularity
        limit: 6,
      });

      if (hottestVideoInformation.length > 0) {
        for (const eachRow of hottestVideoInformation) {
          if (eachRow && eachRow.dataValues && eachRow.dataValues.video) {
            // fetch videos only with url
            const record = {
              video_id: eachRow.dataValues.video.id ? eachRow.dataValues.video.id : "",
              video_path: eachRow.dataValues.video.url ? eachRow.dataValues.video.url : "",
              video_thumb: eachRow.dataValues.video.thumbnail
                ? eachRow.dataValues.video.thumbnail
                : "",
              video_time: eachRow.dataValues.video.video_duration
                ? await generalHelper.formatVideoDuration(
                    eachRow.dataValues.video.video_duration,
                    eachRow.dataValues.video.video_source,
                  )
                : "",
              video_title: eachRow.dataValues.video.name ? eachRow.dataValues.video.name : "",
            };
            hottestVideoList.push(record);
          }
        }
      }
    }

    res.ok({
      hot_videos: hottestVideoList,
    });
  } catch (error) {
    next(error);
  }
};
