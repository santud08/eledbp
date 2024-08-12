import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { consoleColors } from "../../utils/constants.js";
import { titleService } from "../../services/index.js";

export const updateTitleSeriesCombinationData = async (payload, schedulerId, createdBy) => {
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
        if (payloadData && payloadData.series && payloadData.series.length > 0) {
          const combinationSeries = payloadData.series;
          const siteLanguage = payloadData.site_language ? payloadData.site_language : "en";
          // insert other combinationSeries
          if (combinationSeries.length > 1) {
            const reverseCombinationSeries = combinationSeries.reverse();
            for (const combination of combinationSeries) {
              for (const revCombination of reverseCombinationSeries) {
                if (combination > 0 && revCombination > 0 && combination != revCombination) {
                  const findRelatedData = await model.relatedSeriesTitle.findOne({
                    where: {
                      title_id: combination,
                      related_series_title_id: revCombination,
                      status: "active",
                    },
                  });
                  if (!findRelatedData) {
                    const seriesData = {
                      title_id: combination,
                      related_series_title_id: revCombination,
                      site_language: siteLanguage,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: createdBy,
                    };
                    await model.relatedSeriesTitle.create(seriesData);
                    const actionDate = seriesData.created_at;
                    console.log(
                      `${consoleColors.fg.green} process in schedule ${combination}-${revCombination} combination added for series related data \n ${consoleColors.reset}`,
                    );
                    if (combination)
                      await titleService.titleDataAddEditInEditTbl(
                        combination,
                        "title",
                        createdBy,
                        actionDate,
                      );
                  } else {
                    console.log(
                      `${consoleColors.fg.red} process in schedule  ${combination}-${revCombination} combination already found for series related data \n ${consoleColors.reset}`,
                    );
                  }
                }
              }
            }
          }
        } else {
          console.log(
            `${consoleColors.fg.red} process schedule ${schedulerId} series not found for series related data \n ${consoleColors.reset}`,
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
