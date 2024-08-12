import model from "../../../models/index.js";
import { schedulerJobService } from "../../../services/index.js";
import { Op } from "sequelize";
import { consoleColors } from "../../../utils/constants.js";

/**
 * used for developer purpose to update the data
 * only run when its required with proper information
 */

export const updateTitleSeriesCombinationData = async (req, res, next) => {
  try {
    //const page = req.body.page ? req.body.page : 0;
    //const limit = req.body.limit ? req.body.limit : 10;
    const getData = await model.relatedSeriesTitle.findAll({
      attributes: ["id", "title_id", "related_series_title_id", "site_language", "created_by"],
      //offset: parseInt(page),
      //limit: parseInt(limit),
      where: {
        status: { [Op.ne]: "deleted" },
      },
      group: ["title_id"],
      order: [["id", "ASC"]],
    });

    if (getData && getData.length > 0) {
      for (const data of getData) {
        if (data) {
          const getTitleId = data.title_id;
          const siteLanguage = data.site_language;
          const createdBy = data.created_by;

          console.log(
            `${consoleColors.fg.green} found-title-id- ${getTitleId}  \n ${consoleColors.reset}`,
          );

          if (getTitleId) {
            let findSeriesIds = [];
            findSeriesIds = await model.relatedSeriesTitle
              .findAll({
                attributes: ["related_series_title_id"],
                where: {
                  status: { [Op.ne]: "deleted" },
                  title_id: getTitleId,
                },
                raw: true,
              })
              .then((seriesDatas) =>
                seriesDatas.map((seriesData) => seriesData.related_series_title_id),
              );
            if (findSeriesIds.includes(getTitleId) === false) findSeriesIds.push(getTitleId);

            if (findSeriesIds.length > 0) {
              console.log(
                `${
                  consoleColors.fg.yellow
                } process-with-getSeriesTitleId-${findSeriesIds.toString()}-title-id- ${getTitleId} \n ${
                  consoleColors.reset
                }`,
              );
              let payload = {
                list: [
                  {
                    series: findSeriesIds,
                    site_language: siteLanguage,
                    created_by: createdBy,
                    for_title_id: getTitleId,
                  },
                ],
              };
              await schedulerJobService.addJobInScheduler(
                "add data for series combination",
                JSON.stringify(payload),
                "update_title_series_combination_data",
                "",
                createdBy,
              );
              console.log(
                `${
                  consoleColors.fg.green
                } process-completed- with-getSeriesTitleId-${findSeriesIds.toString()}-title-id- ${getTitleId} \n ${
                  consoleColors.reset
                }`,
              );
            } else {
              console.log(
                `${consoleColors.fg.red} no-series data found- for -title-id- ${getTitleId}  \n ${consoleColors.reset}`,
              );
            }
          } else {
            console.log(`${consoleColors.fg.red} no-series data found  \n ${consoleColors.reset}`);
          }
          console.log(
            `${consoleColors.fg.magenta} loop-close-title-id- ${getTitleId}  \n ${consoleColors.reset}`,
          );
        } else {
          console.log(`${consoleColors.fg.red} loop-data-not found  \n ${consoleColors.reset}`);
        }
      }
      res.ok({
        message: "success",
      });
    } else {
      res.ok({
        message: "no data found to update",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
