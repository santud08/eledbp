import { consoleColors, VIMEO_APIS } from "../../../utils/constants.js";
import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { schedulerJobService } from "../../../services/index.js";
import { Op } from "sequelize";

// Define a function to process a Vimeo URL.
export const updateVimeoVideo = async () => {
  try {
    const getData = await model.schedulerJobs.findOne({
      where: {
        status: "pending",
        type: "update_vimeo_video",
      },
    });
    if (getData && getData != null && getData != "undefined") {
      console.log(
        `${consoleColors.fg.green} schedule ${getData.type}-${getData.id} schedule-data-found-to-update \n ${consoleColors.reset}`,
      );
      const updateData = {
        status: "processing",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.schedulerJobs.update(updateData, {
        where: {
          id: getData.id,
        },
      });
      console.log(
        `${consoleColors.fg.green} schedule ${getData.id} schedule-data-processing-to-update-search-DB \n ${consoleColors.reset}`,
      );
      //service call
      const jres = await schedulerJobService.updateVideoDetailsFromVimeo(
        JSON.parse(getData.payload),
        getData.id,
        getData.created_by,
      );
      if (jres == "error") {
        const updateData = {
          status: "failed",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.schedulerJobs.update(updateData, {
          where: {
            id: getData.id,
          },
        });
        console.log(
          `${consoleColors.fg.red} schedule ${getData.type}-${getData.id} schedule-data-imported-unsuccessfully \n ${consoleColors.reset}`,
        );
      } else {
        console.log(
          `${consoleColors.fg.green} schedule ${getData.type}-${getData.id} schedule-data-imported-successfully \n ${consoleColors.reset}`,
        );
      }
    } else {
      //
      const limit = VIMEO_APIS.PER_BATCH;
      const offset = 0;
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
          null,
        );
      }
    }
  } catch (error) {
    console.log(`${consoleColors.fg.red} ${JSON.stringify(error)}  \n ${consoleColors.reset}`);
  }
};
