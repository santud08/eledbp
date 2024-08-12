import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { envs } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * latestTrailers
 * it present latest_trailers: latestTrailer,
 * @param req
 * @param res
 * @param next
 */
export const latestTrailers = async (req, res, next) => {
  try {
    const getSettingsDetails = await model.settings.findOne({
      where: { name: "settings.front_lists.main", status: "active" },
    });

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;
    // ----------------------Latest Trailer-------------------------------
    let latestTrailer = [];

    if (settingValue != null && settingValue.latest_trailers === true) {
      const latestTrailerInformation = await model.video.findAll({
        attributes: [
          "id",
          "name",
          "thumbnail",
          "video_duration",
          "video_source",
          [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "url"],
          "title_id",
        ],
        where: {
          video_for: "title",
          status: "active",
          category: "trailer",
          is_official_trailer: "y",
          [Op.and]: [
            { url: { [Op.ne]: null } },
            { url: { [Op.ne]: "" } },
            { thumbnail: { [Op.ne]: null } },
            { thumbnail: { [Op.ne]: "" } },
          ],
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
        order: [["id", "DESC"]],
        limit: 6,
      });
      if (latestTrailerInformation.length > 0) {
        for (const eachRow of latestTrailerInformation) {
          if (eachRow && latestTrailerInformation.length > 0) {
            // fetch videos only with url
            const record = {
              video_id: eachRow.id ? eachRow.id : "",
              video_path: eachRow.url ? eachRow.url : "",
              video_thumb: eachRow.thumbnail ? eachRow.thumbnail : "",
              video_time: eachRow.video_duration
                ? await generalHelper.formatVideoDuration(
                    eachRow.video_duration,
                    eachRow.video_source,
                  )
                : "",
              video_title: eachRow.name ? eachRow.name : "",
            };
            latestTrailer.push(record);
          }
        }
      }
    }

    res.ok({
      latest_trailers: latestTrailer,
    });
  } catch (error) {
    next(error);
  }
};
