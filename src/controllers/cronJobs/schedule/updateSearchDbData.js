import model from "../../../models/index.js";
import { esService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

export const updateSearchDbData = async () => {
  try {
    const getData = await model.schedulerJobs.findOne({
      where: {
        status: "pending",
        type: "search_db",
      },
    });
    if (getData && getData != null && getData != "undefined") {
      console.log(
        `${consoleColors.fg.green} schedule ${getData.id} schedule-data-found-to-update-search-DB \n ${consoleColors.reset}`,
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
      let successArr = [];
      if (getData.payload && JSON.parse(getData.payload)) {
        const payLoadDatas = JSON.parse(getData.payload);
        if (
          payLoadDatas &&
          payLoadDatas != null &&
          payLoadDatas.list &&
          payLoadDatas.list != null &&
          payLoadDatas.list != "undefined" &&
          payLoadDatas.list.length > 0
        ) {
          for (const payloadData of payLoadDatas.list) {
            if (payloadData.type && payloadData.record_id) {
              const action = payloadData.action ? payloadData.action : "edit";
              if (action == "delete") {
                const resObj = await esService.esScheduleDelete(
                  payloadData.record_id,
                  payloadData.type,
                  action,
                );
                if (resObj && resObj.status == "success") {
                  successArr.push({ record_id: payloadData.record_id, type: payloadData.type });
                }
              } else {
                const resObj = await esService.esSchedularAddUpdate(
                  payloadData.record_id,
                  payloadData.type,
                  action,
                );
                if (resObj && resObj.status == "success") {
                  successArr.push({ record_id: payloadData.record_id, type: payloadData.type });
                }
              }
            }
          }
        }
      }

      if (successArr.length === 0) {
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
          `${consoleColors.fg.red} schedule ${getData.id} schedule-data-imported-unsuccessfully-in-search-DB \n ${consoleColors.reset}`,
        );
      } else {
        console.log(
          `${consoleColors.fg.green} schedule ${getData.id} schedule-data-imported-successfully-in-search-DB \n ${consoleColors.reset}`,
        );
        const updateData = {
          status: "completed",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.schedulerJobs.update(updateData, {
          where: {
            id: getData.id,
          },
        });
      }
    } else {
      console.log(
        `${consoleColors.fg.crimson} no data found in scheduler to import/update in search DB \n ${consoleColors.reset}`,
      );
    }
  } catch (error) {
    console.log(`${consoleColors.fg.red} ${error}  \n ${consoleColors.reset}`);
  }
};
