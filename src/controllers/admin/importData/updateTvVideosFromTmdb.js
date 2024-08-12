import model from "../../../models/index.js";
import { importTitleTmdbService } from "../../../services/index.js";
import { Op } from "sequelize";
import { consoleColors } from "../../../utils/constants.js";

/**
 * used for developer purpose to update the data
 * only run when its required with proper information
 */

export const updateTvVideosFromTmdb = async (req, res, next) => {
  try {
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const resultData = await model.title.findAndCountAll({
      attributes: ["id", "tmdb_id", "type", "created_by"],
      offset: parseInt(offset),
      limit: parseInt(limit),
      where: {
        record_status: { [Op.ne]: "deleted" },
        type: "tv",
      },
    });
    let totalRecords = 0;
    let getData = [];
    if (resultData.count > 0 && resultData.rows.length > 0) {
      totalRecords = resultData.count;
      getData = resultData.rows;
    }

    if (getData && getData.length > 0) {
      for (const data of getData) {
        if (data) {
          const getTitleId = data.id;
          const getTmdbId = data.tmdb_id;
          const createdBy = data.created_by;

          if (getTitleId && getTmdbId) {
            let findSeasonData = [];
            findSeasonData = await model.season.findAll({
              attributes: ["id", "title_id", "number"],
              where: {
                status: { [Op.ne]: "deleted" },
                title_id: getTitleId,
              },
            });

            if (findSeasonData.length > 0) {
              for (const value of findSeasonData) {
                if (value) {
                  const seasonNumber = value.number ? value.number : null;
                  const seasonId = value.id ? value.id : null;
                  const langEn = "en";
                  if (seasonId && seasonNumber) {
                    await importTitleTmdbService.addTmdbSeasonTvVideos(
                      getTitleId,
                      getTmdbId,
                      seasonId,
                      seasonNumber,
                      createdBy,
                      langEn,
                    );
                  }
                }
              }
            } else {
              console.log(
                `${consoleColors.fg.red} no-Season data found- for -title-id- ${getTitleId}  \n ${consoleColors.reset}`,
              );
            }
          } else {
            console.log(`${consoleColors.fg.red} no-Title data found  \n ${consoleColors.reset}`);
          }
          console.log(
            `${consoleColors.fg.magenta} loop-close-title-id- ${getTitleId}  \n ${consoleColors.reset}`,
          );
        } else {
          console.log(`${consoleColors.fg.red} loop-data-not found  \n ${consoleColors.reset}`);
        }
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
