import model from "../../../models/index.js";
import { schedulerJobService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

export const updateDataFromScheduler = async () => {
  try {
    const getData = await model.schedulerJobs.findOne({
      where: {
        status: "pending",
        [Op.and]: [
          { type: { [Op.ne]: "search_db" } },
          { type: { [Op.ne]: "update_vimeo_video" } },
          { type: { [Op.ne]: "update_youtube_video" } },
        ],
      },
    });
    if (getData && getData != null && getData != "undefined") {
      console.log(
        `${consoleColors.fg.green} schedule ${getData.type}-${getData.id} schedule-data-found-to-update \n ${consoleColors.reset}`,
      );
      if (getData.type && getData.type == "people_media") {
        const jres = await schedulerJobService.peopleMediaFromTmdb(
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
      } else if (getData.type && getData.type == "people_language_primary_data") {
        const jres = await schedulerJobService.peopleOtherLanPrimaryDataFromTmdb(
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
      } else if (getData.type && getData.type == "title_series_data") {
        const jres = await schedulerJobService.updateSeriesPrimaryDataFromTmdb(
          JSON.parse(getData.payload),
          getData.id,
          getData.created_by,
          "submit_all",
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
      } else if (getData.type && getData.type == "title_series_data_import") {
        const jres = await schedulerJobService.updateSeriesPrimaryDataFromTmdb(
          JSON.parse(getData.payload),
          getData.id,
          getData.created_by,
          "import_data",
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
      } else if (getData.type && getData.type == "update_title_series_combination_data") {
        const jres = await schedulerJobService.updateTitleSeriesCombinationData(
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
      } else if (getData.type && getData.type == "update_video_search_data_by_item_id") {
        const jres = await schedulerJobService.updateVideoSearchDataByItemId(
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
      }
    } else {
      console.log(
        `${consoleColors.fg.crimson} no data found in scheduler to import/update \n ${consoleColors.reset}`,
      );
    }
  } catch (error) {
    console.log(`${consoleColors.fg.red} ${error}  \n ${consoleColors.reset}`);
  }
};
