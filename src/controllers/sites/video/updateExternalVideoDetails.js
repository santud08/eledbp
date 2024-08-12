import model from "../../../models/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { youtubeService, vimeoService } from "../../../services/index.js";
import { Op } from "sequelize";

/**
 * updateExternalVideoDetails
 * @param req
 * @param res
 */
export const updateExternalVideoDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const offset = reqBody.offset ? reqBody.offset : 0;
    const videoSource = reqBody.video_source ? reqBody.video_source : "youtube";
    const videoIds = reqBody.video_ids ? reqBody.video_ids : "";
    const userId = !req.userDetails.userId ? null : req.userDetails.userId;

    const attributes = ["id", "thumbnail", "url", "video_source"];
    const includeQuery = [];
    let condition = { status: "active", video_source: videoSource, url: { [Op.ne]: null } };
    if (videoIds) {
      condition.id = { [Op.in]: videoIds.split(",") };
    }

    const resultData = await model.video.findAndCountAll({
      attributes: attributes,
      offset: parseInt(offset),
      limit: parseInt(limit),
      where: condition,
      include: includeQuery,
      order: [["id", "asc"]],
    });
    let results = [];
    if (resultData && resultData.rows.length > 0) {
      if (videoSource == "vimeo") {
        for (const video of resultData.rows) {
          let updateData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          if (userId) {
            updateData.updated_by = userId;
          }
          let dataReadyforUpdate = false;

          const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(video.url);
          if (geVimeoVideoDetails) {
            updateData.no_of_view = geVimeoVideoDetails.stats_number_of_plays
              ? geVimeoVideoDetails.stats_number_of_plays
              : 0;
            updateData.thumbnail = geVimeoVideoDetails.thumbnail_large
              ? geVimeoVideoDetails.thumbnail_large
              : null;
            updateData.video_duration = geVimeoVideoDetails.duration
              ? geVimeoVideoDetails.duration
              : null;
            dataReadyforUpdate = true;
          }

          if (dataReadyforUpdate) {
            const updateRes = await model.video.update(updateData, {
              where: { id: video.id },
            });
            if (updateRes && updateRes > 0) {
              results.push({
                id: video.id,
                video_url: video.url,
                data: updateData,
                message: "video details updated succefully",
              });
            } else {
              results.push({
                id: video.id,
                video_url: video.url,
                data: updateData,
                message: "unable to update the video details",
              });
            }
          } else {
            results.push({
              id: video.id,
              video_url: video.url,
              data: updateData,
              message: "unable to update the video details",
            });
          }
        }
      } else if (videoSource == "youtube") {
        const youtubeUrls = resultData.rows.map((reocrd) => {
          if (reocrd.url) return reocrd.url;
        });
        const getYouTubeVideoDetails = await youtubeService.fetchBulkYouTubeDetails(youtubeUrls);
        for (const video of resultData.rows) {
          let updateData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          if (userId) {
            updateData.updated_by = userId;
          }
          let dataReadyforUpdate = false;
          if (video.url) {
            const utVid = await generalHelper.getYouTubeIdFromUrls(video.url);

            if (
              getYouTubeVideoDetails &&
              Object.keys(getYouTubeVideoDetails).length > 0 &&
              utVid &&
              getYouTubeVideoDetails[utVid]
            ) {
              updateData.no_of_view = getYouTubeVideoDetails[utVid].view_count
                ? getYouTubeVideoDetails[utVid].view_count
                : 0;
              updateData.thumbnail = getYouTubeVideoDetails[utVid].video_thumb
                ? getYouTubeVideoDetails[utVid].video_thumb
                : null;
              updateData.video_duration = getYouTubeVideoDetails[utVid].video_duration
                ? getYouTubeVideoDetails[utVid].video_duration
                : null;
              dataReadyforUpdate = true;
            }
          }

          if (dataReadyforUpdate) {
            const updateRes = await model.video.update(updateData, {
              where: { id: video.id },
            });
            if (updateRes && updateRes > 0) {
              results.push({
                id: video.id,
                video_url: video.url,
                data: updateData,
                message: "video details updated succefully",
              });
            } else {
              results.push({
                id: video.id,
                video_url: video.url,
                data: updateData,
                message: "unable to update the video details",
              });
            }
          } else {
            results.push({
              id: video.id,
              video_url: video.url,
              data: updateData,
              message: "unable to update the video details",
            });
          }
        }
      }
    }

    res.ok({
      message: res.__("success"),
      offset: offset,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      results: results,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
