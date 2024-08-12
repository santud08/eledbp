import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { consoleColors } from "../../utils/constants.js";
import { esService } from "../../services/index.js";

export const updateVideoSearchDataByItemId = async (payload, schedulerId, createdBy) => {
  try {
    if (
      payload &&
      payload != null &&
      payload.list &&
      payload.list != null &&
      payload.list != "undefined" &&
      payload.list.length > 0 &&
      schedulerId > 0
    ) {
      let pd = 1;
      const updateData = {
        status: "processing",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.schedulerJobs.update(updateData, {
        where: {
          id: schedulerId,
        },
      });
      for (const payloadData of payload.list) {
        if (payloadData && payloadData.item_id && payloadData.type) {
          console.log(
            `${consoleColors.fg.yellow} process in schedule ${payloadData.item_id}-${payloadData.type} video add processing for update the related search DB data \n ${consoleColors.reset}`,
          );
          await esService.deleteVideoDocumentByItemId(
            "search-video",
            payloadData.item_id,
            payloadData.type,
          );
          await esService.addNewVideoDocumentByItemId(payloadData.item_id, payloadData.type);
          console.log(
            `${consoleColors.fg.green} process in schedule ${payloadData.item_id}-${payloadData.type} video add processed for update the related search DB data \n ${consoleColors.reset}`,
          );
        } else {
          console.log(
            `${consoleColors.fg.red} process schedule ${schedulerId} search db video not found for related data \n ${consoleColors.reset}`,
          );
        }
        if (pd == payload.list.length) {
          const updateData = {
            status: "completed",
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          await model.schedulerJobs.update(updateData, {
            where: {
              id: schedulerId,
            },
          });
        }
        pd++;
      }
    } else {
      const updateData = {
        status: "failed",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.schedulerJobs.update(updateData, {
        where: {
          id: schedulerId,
        },
      });
    }
    return "success";
  } catch (error) {
    console.log(error);
    return "error";
  }
};
