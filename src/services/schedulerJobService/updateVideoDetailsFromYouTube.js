import model from "../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../helpers/index.js";
import { youtubeService, schedulerJobService } from "../../services/index.js";
import { consoleColors, YOUTUBE_APIS } from "../../utils/constants.js";
import { Op } from "sequelize";

export const updateVideoDetailsFromYouTube = async (payload, schedulerId, createdBy) => {
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
      const limit = payload.limit ? payload.limit : YOUTUBE_APIS.PER_BATCH;
      const offset = payload.offset ? payload.offset : noOfRecordHits;
      const maxHitLimit = YOUTUBE_APIS.CRON_LIMIT;
      noOfHits = payload.no_of_hits ? payload.no_of_hits : noOfHits;
      noOfRecordHits = payload.no_of_record_hits ? payload.no_of_record_hits : noOfRecordHits;

      if (noOfHits < maxHitLimit) {
        const conditions = {
          status: { [Op.ne]: "deleted" },
          video_source: "youtube",
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
          const youtubeUrls = resultData.rows.map((reocrd) => {
            if (reocrd.url) return reocrd.url;
          });
          let payloadList = [];
          const getYouTubeVideoDetails = await youtubeService.fetchBulkYouTubeDetails(youtubeUrls);
          for (const video of resultData.rows) {
            let updateData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };

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
                console.log(
                  `${consoleColors.fg.green} youtube video of ${video.id}--${video.url} , video details updated succefully \n ${consoleColors.reset}`,
                );
                if (video.id)
                  payloadList.push({ record_id: video.id, type: "video", action: "edit" });
              } else {
                console.log(
                  `${consoleColors.fg.red} youtube video of ${video.id}--${video.url} , unable to update the video details \n ${consoleColors.reset}`,
                );
              }
            } else {
              console.log(
                `${consoleColors.fg.red} youtube video of ${video.id}--${video.url} , unable to update the video details \n ${consoleColors.reset}`,
              );
            }
            noOfRecordHits++;
          }
          noOfHits = noOfHits + 1;
          if (payloadList.length > 0) {
            const searchPayload = {
              list: payloadList,
            };
            schedulerJobService.addJobInScheduler(
              "edit video data to search db",
              JSON.stringify(searchPayload),
              "search_db",
              `edit youtube video from youtube data update cron`,
              createdBy,
            );
          }
          console.log(
            `${consoleColors.fg.crimson} youtube video no of hit ${noOfHits} , no of record ${noOfRecordHits} processed to update \n ${consoleColors.reset}`,
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
              "update youtube video data",
              JSON.stringify(newPayload),
              "update_youtube_video",
              `update the youtube video from youtube update cron`,
              createdBy,
            );
          } else {
            if (resultData.count > 0) {
              const newPayload = {
                offset: 0,
                limit: limit,
                total_records: resultData.count,
                no_of_record_hits: resultData.count == noOfRecordHits ? 0 : noOfRecordHits,
                no_of_hits: noOfHits,
                total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
              };

              schedulerJobService.addJobInScheduler(
                "update youtube video data",
                JSON.stringify(newPayload),
                "update_youtube_video",
                `update the youtube video from youtube update cron`,
                createdBy,
              );
            }
            noOfHits = 0;
            noOfRecordHits = 0;
          }
        } else {
          console.log(
            `${consoleColors.fg.red} data not found to update the youtube video details \n ${consoleColors.reset}`,
          );
          if (resultData.count > 0) {
            const newPayload = {
              offset: 0,
              limit: limit,
              total_records: resultData.count,
              no_of_record_hits: noOfRecordHits,
              no_of_hits: noOfHits,
              total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
            };

            schedulerJobService.addJobInScheduler(
              "update youtube video data",
              JSON.stringify(newPayload),
              "update_youtube_video",
              `update the youtube video from youtube update cron`,
              createdBy,
            );
          }
        }
      } else {
        console.log(
          `${consoleColors.fg.red} maxmimum limit hit already done for the day for youtube video \n ${consoleColors.reset}`,
        );
        const conditions = {
          status: { [Op.ne]: "deleted" },
          video_source: "youtube",
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
        if (resultData.count > 0) {
          const newPayload = {
            offset: resultData.count == noOfRecordHits ? 0 : offset,
            limit: limit,
            total_records: resultData.count,
            no_of_record_hits: resultData.count == noOfRecordHits ? 0 : noOfRecordHits,
            no_of_hits: 0,
            total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
          };
          const nextday = await customDateTimeHelper.getDateFromCurrentDate("add", 1, "day", "");
          schedulerJobService.addJobInScheduler(
            "update youtube video data",
            JSON.stringify(newPayload),
            "update_youtube_video",
            `update the youtube video from youtube update cron`,
            createdBy,
            nextday,
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
