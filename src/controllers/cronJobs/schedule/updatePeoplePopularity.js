import { consoleColors, SCHEDULAR_JOBS_SETTING } from "../../../utils/constants.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import model from "../../../models/index.js";
import { schedulerProcedureJobService } from "../../../services/index.js";
import { Op } from "sequelize";

export const updatePeoplePopularity = async () => {
  try {
    const getData = await model.schedulerProcedureJobs.findOne({
      where: {
        status: "pending",
        type: "update_people_popularity",
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
      await model.schedulerProcedureJobs.update(updateData, {
        where: {
          id: getData.id,
        },
      });
      console.log(
        `${consoleColors.fg.green} schedule ${getData.id} schedule-data-processing-to-update-people-popularity \n ${consoleColors.reset}`,
      );
      const payload = JSON.parse(getData.payload);
      if (
        payload &&
        payload != null &&
        payload != "undefined" &&
        Object.keys(payload).length > 0 &&
        getData.id > 0
      ) {
        const curDateTime = await customDateTimeHelper.getCurrentDateTime();
        let noOfHits = payload.no_of_hits ? payload.no_of_hits : 0;
        let totalHits = payload.total_hits ? payload.total_hits : 0;
        const limit = payload.limit ? payload.limit : SCHEDULAR_JOBS_SETTING.PEOPLE_POPULARITY;
        const offset = payload.offset ? payload.offset : 0;
        const resultCount = await model.people.count({
          where: { status: { [Op.ne]: "deleted" } },
        });
        totalHits = resultCount > 0 ? Math.ceil(resultCount / limit) : 0;
        model.sequelize
          .query("CALL updatePeoplePopularity (:curDateTime,:offsetVal,:limitVal)", {
            replacements: { curDateTime: curDateTime, offsetVal: offset, limitVal: limit },
          })
          .then(async (results) => {
            console.log(
              `${consoleColors.fg.yellow} schedule "updatePeoplePopularity" scheduled-to-update-data-at:${curDateTime} \n ${consoleColors.reset}`,
            );
            console.log(
              `${consoleColors.fg.green} ${JSON.stringify(results)}  \n ${consoleColors.reset}`,
            );
            noOfHits = noOfHits + 1;
            //
            const updateData = {
              status: "completed",
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.schedulerProcedureJobs.update(updateData, {
              where: {
                id: getData.id,
              },
            });

            if (noOfHits == totalHits) {
              if (resultCount > 0) {
                const newPayload = {
                  offset: 0,
                  limit: limit,
                  total_records: resultCount,
                  no_of_hits: 0,
                  total_hits: totalHits,
                };
                schedulerProcedureJobService.addJobInProcedureScheduler(
                  "update people popularity",
                  JSON.stringify(newPayload),
                  "update_people_popularity",
                  `update the people popularity from cron`,
                  null,
                );
              }
            } else {
              if (resultCount > 0) {
                const newPayload = {
                  offset: noOfHits * limit,
                  limit: limit,
                  total_records: resultCount,
                  no_of_hits: noOfHits,
                  total_hits: totalHits,
                };
                schedulerProcedureJobService.addJobInProcedureScheduler(
                  "update people popularity",
                  JSON.stringify(newPayload),
                  "update_people_popularity",
                  `update the people popularity from cron`,
                  null,
                );
              }
            }
          })
          .catch(async (error) => {
            console.log(`${consoleColors.fg.red} ${error}  \n ${consoleColors.reset}`);
            const updateData = {
              status: "failed",
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.schedulerProcedureJobs.update(updateData, {
              where: {
                id: getData.id,
              },
            });

            schedulerProcedureJobService.addJobInProcedureScheduler(
              "update people popularity",
              getData.payload,
              "update_people_popularity",
              `update the people popularity from cron`,
              null,
            );
          });
      } else {
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
          `${consoleColors.fg.red} schedule ${getData.type}-${getData.id} schedule-data-update-people-popularity-unsuccessfully \n ${consoleColors.reset}`,
        );
      }
    } else {
      const limit = SCHEDULAR_JOBS_SETTING.PEOPLE_POPULARITY;
      const offset = 0;
      const conditions = {
        status: { [Op.ne]: "deleted" },
      };
      const attributes = ["id"];
      const includeQuery = [];

      const resultData = await model.people.findAndCountAll({
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
          no_of_hits: 0,
          total_hits: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        };
        schedulerProcedureJobService.addJobInProcedureScheduler(
          "update people popularity",
          JSON.stringify(newPayload),
          "update_people_popularity",
          `update the people popularity from cron`,
          null,
        );
      }
    }
  } catch (error) {
    console.log(`${consoleColors.fg.red} ${error}  \n ${consoleColors.reset}`);
  }
};
