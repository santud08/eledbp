import model from "../../models/index.js";
import { tmdbService, importTitleTmdbService } from "../../services/index.js";
import { Op } from "sequelize";
import { consoleColors } from "../../utils/constants.js";

export const importPeopleCountryData = async (offset, limit, langEn, langKo) => {
  try {
    const getPeople = await model.people.findAll({
      attributes: ["id", "tmdb_id", "created_by"],
      where: { status: { [Op.ne]: "deleted" } },
      offset: offset,
      limit: limit,
      order: [["id", "ASC"]],
    });
    if (getPeople && getPeople.length > 0) {
      let loopCount = 1;
      for (const data of getPeople) {
        if (data) {
          const getTmbdId = data.tmdb_id ? data.tmdb_id : null;
          if (getTmbdId) {
            const peopleId = data.id ? data.id : 0;
            const createdBy = data.dataValues.created_by ? data.dataValues.created_by : null;

            console.log(
              `${consoleColors.fg.blue} Processing quee-${loopCount} data-start \n ${consoleColors.reset}`,
            );
            console.log(
              `${consoleColors.fg.blue} Processing ${getTmbdId} data-start \n ${consoleColors.reset}`,
            );

            let tmdbEnPeopleData = {},
              tmdbKoPeopleData = {};

            [tmdbEnPeopleData, tmdbKoPeopleData] = await Promise.all([
              tmdbService.fetchPeopleDetails(getTmbdId, langEn),
              tmdbService.fetchPeopleDetails(getTmbdId, langKo),
            ]);
            if (
              (tmdbEnPeopleData &&
                tmdbEnPeopleData.results &&
                tmdbEnPeopleData.results != null &&
                tmdbEnPeopleData.results != "undefined") ||
              (tmdbKoPeopleData &&
                tmdbKoPeopleData.results &&
                tmdbKoPeopleData.results != null &&
                tmdbKoPeopleData.results != "undefined")
            ) {
              let placeOfBirth = null;
              if (
                tmdbEnPeopleData &&
                tmdbEnPeopleData.results &&
                tmdbEnPeopleData.results != null &&
                tmdbEnPeopleData.results != "undefined"
              ) {
                placeOfBirth = tmdbEnPeopleData.results.place_of_birth;
              }

              if (
                tmdbKoPeopleData &&
                tmdbKoPeopleData.results &&
                tmdbKoPeopleData.results != null &&
                tmdbKoPeopleData.results != "undefined"
              ) {
                if (!placeOfBirth) placeOfBirth = tmdbKoPeopleData.results.place_of_birth;
              }

              //add country details
              if (placeOfBirth) {
                await importTitleTmdbService.addPeopleCountry(
                  placeOfBirth,
                  peopleId,
                  createdBy,
                  langEn,
                );
              }
              console.log(
                `${consoleColors.fg.blue} Processing ${getTmbdId} data-end \n ${consoleColors.reset}`,
              );
              console.log(
                `${consoleColors.fg.blue} Processing quee-${loopCount} data-end \n ${consoleColors.reset}`,
              );
            }
          } else {
            console.log(
              `${consoleColors.fg.red} Processing  quee-${loopCount} has no tmdb_id \n ${consoleColors.reset}`,
            );
          }
        } else {
          console.log(
            `${consoleColors.fg.red} Processing  quee-${loopCount} has empty object data \n ${consoleColors.reset}`,
          );
        }
        loopCount = loopCount + 1;
      }
    } else {
      console.log(
        `${consoleColors.fg.red} No people data found to update country from TMDB \n ${consoleColors.reset}`,
      );
    }
  } catch (error) {
    console.log(error);
  }
};
