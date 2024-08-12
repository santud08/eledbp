import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { Op } from "sequelize";
import { consoleColors } from "../../../utils/constants.js";

/**
 * used for developer purpose to update the data
 * only run when its required with proper information
 */

export const updatePeopleAka = async (req, res, next) => {
  try {
    const page = req.body.page ? req.body.page : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const langEn = "en";
    const langKo = "ko";
    const getData = await model.people.findAll({
      attributes: ["id", "tmdb_id", "created_by"],
      offset: parseInt(page),
      limit: parseInt(limit),
      where: {
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.peopleTranslation,
        },
      ],
      order: [["id", "ASC"]],
    });

    if (getData && getData.length > 0) {
      for (const data of getData) {
        const getTmbdId = data.tmdb_id;
        const peopleId = data.id;
        const type = "people";
        const createdBy = data.created_by;
        console.log(
          `${consoleColors.fg.green} found-${type}-id- ${peopleId}  \n ${consoleColors.reset}`,
        );

        if (getTmbdId) {
          console.log(
            `${consoleColors.fg.yellow} process-with-tmdb-id- ${getTmbdId} \n ${consoleColors.reset}`,
          );
          const [fetchEnPeople, fetchKoPeople] = await Promise.all([
            tmdbService.fetchPeopleDetails(getTmbdId, langEn),
            tmdbService.fetchPeopleDetails(getTmbdId, langKo),
          ]);
          if (
            fetchEnPeople &&
            fetchEnPeople.results != "undefined" &&
            fetchEnPeople.results != null &&
            fetchEnPeople.results
          ) {
            console.log(`fetch-tmdb-data->>>>>`);
            const nameEn = fetchEnPeople.results.people_name
              ? fetchEnPeople.results.people_name
              : null;
            const nameKo = fetchKoPeople.results.people_name
              ? fetchKoPeople.results.people_name
              : null;
            const aka = fetchEnPeople.results.aka ? fetchEnPeople.results.aka : null;
            const biographyEn = fetchEnPeople.results.biography
              ? fetchEnPeople.results.biography
              : null;
            const biographyKo = fetchKoPeople.results.biography
              ? fetchKoPeople.results.biography
              : null;

            const [checkEnPeople, checkKoPeople] = await Promise.all([
              model.peopleTranslation.findOne({
                where: { people_id: peopleId, site_language: langEn },
              }),
              model.peopleTranslation.findOne({
                where: { people_id: peopleId, site_language: langKo },
              }),
            ]);
            //en
            if (checkEnPeople) {
              const updateData = {
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: createdBy,
              };
              if (checkEnPeople.name != nameEn) {
                updateData.name = nameEn;
              }
              if (checkEnPeople.known_for != aka) {
                updateData.known_for = aka;
              }
              if (checkEnPeople.description != biographyEn) {
                updateData.description = biographyEn;
              }
              await model.peopleTranslation.update(updateData, {
                where: { id: checkEnPeople.id, people_id: peopleId },
              });
              console.log(
                `${consoleColors.fg.green} updated-${type}-id- ${peopleId}-${langEn} \n ${consoleColors.reset}`,
              );
            } else {
              const addData = {
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
                name: nameEn,
                known_for: aka,
                description: biographyEn,
                site_language: langEn,
                people_id: peopleId,
              };
              if (
                !(await model.peopleTranslation.findOne({
                  where: { people_id: peopleId, site_language: langEn },
                }))
              ) {
                await model.peopleTranslation.create(addData);
              }
              console.log(
                `${consoleColors.fg.green} Inserted-${type}-id- ${peopleId}-${langEn} \n ${consoleColors.reset}`,
              );
            }

            //ko
            if (checkKoPeople) {
              const updateData = {
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: createdBy,
              };
              if (checkKoPeople.name != nameKo) {
                updateData.name = nameKo;
              }
              if (checkKoPeople.known_for != aka) {
                updateData.known_for = aka;
              }
              if (checkKoPeople.description != biographyKo) {
                updateData.description = biographyKo;
              }
              await model.peopleTranslation.update(updateData, {
                where: { id: checkKoPeople.id, people_id: peopleId },
              });
              console.log(
                `${consoleColors.fg.green} updated-${type}-id- ${peopleId}-${langKo} \n ${consoleColors.reset}`,
              );
            } else {
              const addData = {
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
                name: nameKo,
                known_for: aka,
                description: biographyKo,
                site_language: langKo,
                people_id: peopleId,
              };
              if (
                !(await model.peopleTranslation.findOne({
                  where: { people_id: peopleId, site_language: langKo },
                }))
              ) {
                await model.peopleTranslation.create(addData);
              }
              console.log(
                `${consoleColors.fg.green} Inserted-${type}-id- ${peopleId}-${langKo} \n ${consoleColors.reset}`,
              );
            }
          }
        } else {
          console.log(
            `${consoleColors.fg.red} no-tmdb-id-found-for-${type}-id- ${peopleId}  \n ${consoleColors.reset}`,
          );
        }
        console.log(
          `${consoleColors.fg.magenta} loop-close-${type}-id- ${peopleId}  \n ${consoleColors.reset}`,
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
