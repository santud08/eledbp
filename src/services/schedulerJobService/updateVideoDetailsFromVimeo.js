import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { vimeoService, schedulerJobService } from "../../services/index.js";
import { consoleColors, VIMEO_APIS } from "../../utils/constants.js";
import { Op } from "sequelize";

export const updateVideoDetailsFromVimeo = async (payload, schedulerId, createdBy) => {
  try {
    if (
      payload &&
      payload != null &&
      payload != "undefined" &&
      Object.keys(payload).length > 0 &&
      schedulerId > 0
    ) {
      let noOfHits = 0;
      let noOfRecordHits = 0;
      const limit = payload.limit ? payload.limit : VIMEO_APIS.PER_BATCH;
      const offset = payload.offset ? payload.offset : noOfRecordHits;

      const conditions = {
        status: { [Op.ne]: "deleted" },
        video_source: "vimeo",
        [Op.and]: [{ url: { [Op.ne]: null } }, { url: { [Op.ne]: "" } }],
      };
      const attributes = ["id", "thumbnail", "url", "video_source"];
      const includeQuery = [];

      const resultData = await model.video.findAndCountAll({
        attributes: attributes,
        offset: parseInt(offset),
        limit: parseInt(limit),
        where: conditions,
        include: includeQuery,
        order: [["id", "asc"]],
      });

      if (resultData && resultData.rows.length > 0) {
        let payloadList = [];
        for (const video of resultData.rows) {
          let updateData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };

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
              console.log(
                `${consoleColors.fg.green} vimeo video of ${video.id}--${video.url} , video details updated succefully \n ${consoleColors.reset}`,
              );
              if (video.id)
                payloadList.push({ record_id: video.id, type: "video", action: "edit" });
            } else {
              console.log(
                `${consoleColors.fg.red} vimeo video of ${video.id}--${video.url} , unable to update the video details \n ${consoleColors.reset}`,
              );
            }
          } else {
            console.log(
              `${consoleColors.fg.red} vimeo video of ${video.id}--${video.url} , unable to update the video details \n ${consoleColors.reset}`,
            );
          }
          noOfRecordHits++;
        }
        noOfRecordHits = noOfRecordHits + (payload.no_of_record_hits || 0);
        noOfHits = noOfHits + 1 + (payload.no_of_hits || 0);
        if (payloadList.length > 0) {
          const searchPayload = {
            list: payloadList,
          };
          schedulerJobService.addJobInScheduler(
            "edit video data to search db",
            JSON.stringify(searchPayload),
            "search_db",
            `edit vimeo video from vimeo update cron`,
            createdBy,
          );
        }
        console.log(
          `${consoleColors.fg.crimson} vimeo video no of hit ${noOfHits} , no of record ${noOfRecordHits} processed to update \n ${consoleColors.reset}`,
        );
        if (resultData.count > 0 && noOfRecordHits < resultData.count) {
          const newPayload = {
            offset: noOfRecordHits,
            limit: limit,
            total_records: resultData.count,
            no_of_record_hits: noOfRecordHits,
            no_of_hits: noOfHits,
            total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
          };
          schedulerJobService.addJobInScheduler(
            "update vimeo video data",
            JSON.stringify(newPayload),
            "update_vimeo_video",
            `update the vimeo video from vimeo update cron`,
            createdBy,
          );
        } else {
          noOfRecordHits = 0;
          noOfHits = 0;
          if (resultData.count > 0) {
            const newPayload = {
              offset: 0,
              limit: limit,
              total_records: resultData.count,
              no_of_record_hits: 0,
              no_of_hits: 0,
              total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
            };
            schedulerJobService.addJobInScheduler(
              "update vimeo video data",
              JSON.stringify(newPayload),
              "update_vimeo_video",
              `update the vimeo video from vimeo update cron`,
              createdBy,
            );
          }
        }
      } else {
        console.log(
          `${consoleColors.fg.red} data not found to update the vimeo video details \n ${consoleColors.reset}`,
        );
        if (resultData.count > 0) {
          const newPayload = {
            offset: 0,
            limit: limit,
            total_records: resultData.count,
            no_of_record_hits: 0,
            no_of_hits: 0,
            total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
          };
          schedulerJobService.addJobInScheduler(
            "update vimeo video data",
            JSON.stringify(newPayload),
            "update_vimeo_video",
            `update the vimeo video from vimeo update cron`,
            createdBy,
          );
        }
      }
      const updateData = {
        status: "completed",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.schedulerJobs.update(updateData, {
        where: {
          id: schedulerId,
        },
      });
      return "success";
    } else {
      return "error";
    }
  } catch (error) {
    console.log(error);
    return "error";
  }
};
