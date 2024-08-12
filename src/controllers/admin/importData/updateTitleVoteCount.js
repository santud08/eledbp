import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { Op } from "sequelize";
import { consoleColors } from "../../../utils/constants.js";

/**
 * used for developer purpose to update the data
 * only run when its required with proper information
 */

export const updateTitleVoteCount = async (req, res, next) => {
  try {
    const page = req.body.page ? req.body.page : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const langEn = "en";
    //const langKo = "ko";
    const getData = await model.title.findAll({
      attributes: ["id", "tmdb_id", "type", "created_by"],
      offset: parseInt(page),
      limit: parseInt(limit),
      where: {
        record_status: { [Op.ne]: "deleted" },
      },
      order: [["id", "ASC"]],
    });

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
            const popularity = fetchTitle.results.popularity ? fetchTitle.results.popularity : null;
            const voteAverage = fetchTitle.results.vote_average
              ? fetchTitle.results.vote_average
              : null;
            const voteCount = fetchTitle.results.vote_count ? fetchTitle.results.vote_count : null;
            const updateData = {
              tmdb_vote_average: voteAverage,
              popularity: popularity,
              tmdb_vote_count: voteCount,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: createdBy,
            };
            await model.title.update(updateData, {
              where: { id: titleId },
            });
            console.log(
              `${consoleColors.fg.green} updated-${type}-id- ${titleId} \n ${consoleColors.reset}`,
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
