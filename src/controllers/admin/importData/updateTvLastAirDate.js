import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { Op } from "sequelize";
import { consoleColors } from "../../../utils/constants.js";

/*
 * used for developer purpose to update the data
 * only run when its required with proper information
 *
 */

export const updateTvLastAirDate = async (req, res, next) => {
  try {
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const langEn = "en";
    //const langKo = "ko";
    const resultData = await model.title.findAndCountAll({
      attributes: ["id", "tmdb_id", "type", "title_status", "created_by", "release_date_to"],
      offset: parseInt(offset),
      limit: parseInt(limit),
      where: {
        record_status: { [Op.ne]: "deleted" },
        type: "tv",
        title_status: "ended",
      },
      order: [["id", "ASC"]],
    });

    let totalRecords = 0;
    let getData = [];
    if (resultData.count > 0 && resultData.rows.length > 0) {
      totalRecords = resultData.count;
      getData = resultData.rows;
    }

    if (getData && getData.length > 0) {
      for (const data of getData) {
        const getTmbdId = data.tmdb_id;
        const titleId = data.id;
        const type = data.type;
        const createdBy = data.created_by;
        console.log(
          `${consoleColors.fg.green} found-${type}-id- ${titleId}  \n ${consoleColors.reset}`,
        );

        if (getTmbdId) {
          console.log(
            `${consoleColors.fg.yellow} process-with-tmdb-id- ${getTmbdId} \n ${consoleColors.reset}`,
          );
          const fetchTitle = await tmdbService.fetchTitleDetails(type, getTmbdId, langEn);
          if (
            fetchTitle &&
            fetchTitle.results != "undefined" &&
            fetchTitle.results != null &&
            fetchTitle.results
          ) {
            console.log(`fetch-tmdb-data->>`);
            const releaseDateTo = fetchTitle.results.release_date_to
              ? fetchTitle.results.release_date_to
              : null;
            const lastAirDate = fetchTitle.results.last_air_date
              ? fetchTitle.results.last_air_date
              : null;
            const updateData = {
              release_date_to: releaseDateTo ? releaseDateTo : lastAirDate,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: createdBy,
            };
            await model.title.update(updateData, {
              where: { id: titleId },
            });
            console.log(
              `${consoleColors.fg.green} updated-${type}-id- ${titleId} \n ${consoleColors.reset}`,
            );
          } else {
            console.log(
              `${consoleColors.fg.red} no-tmdb-id-data-found-for-update-${type}-id- ${titleId}  \n ${consoleColors.reset}`,
            );
          }
        } else {
          console.log(
            `${consoleColors.fg.red} no-tmdb-id-found-for-${type}-id- ${titleId}  \n ${consoleColors.reset}`,
          );
        }
        console.log(
          `${consoleColors.fg.magenta} loop-close-${type}-id- ${titleId}  \n ${consoleColors.reset}`,
        );
      }
      res.ok({
        message: res.__("success"),
        offset: offset,
        limit: limit,
        total_records: totalRecords,
        total_pages: totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0,
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
