import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { tmdbService, titleService } from "../../services/index.js";
import { consoleColors } from "../../utils/constants.js";

export const peopleMediaFromTmdb = async (payload, schedulerId, createdBy) => {
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
        let actionDate = "";
        let recordId = "";
        if (payloadData && payloadData.tmdb_id && payloadData.people_id > 0) {
          const getTmbdId = payloadData.tmdb_id;
          const peopleId = payloadData.people_id;
          const langEn = payloadData.site_language ? payloadData.site_language : "en";
          const tmdbEnPeopleImageData = await tmdbService.fetchPeopleImages(getTmbdId, langEn);
          if (
            tmdbEnPeopleImageData &&
            tmdbEnPeopleImageData.results &&
            tmdbEnPeopleImageData.results.images &&
            tmdbEnPeopleImageData.results.images.length > 0
          ) {
            let im = 1;
            for (const eachImage of tmdbEnPeopleImageData.results.images) {
              const getLastOrder = await model.peopleImages.max("list_order", {
                where: {
                  people_id: peopleId,
                  site_language: langEn,
                },
              });
              const peoplePosterImageData = {
                original_name: eachImage.originalname ? eachImage.originalname : null,
                file_name: eachImage.filename ? eachImage.filename : null,
                path: eachImage.path ? eachImage.path : null,
                file_extension: eachImage.file_extension ? eachImage.file_extension : null,
                people_id: peopleId,
                source: "tmdb",
                list_order: getLastOrder ? getLastOrder + 1 : 1,
                site_language: langEn,
                created_by: createdBy,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              if (im == 1) {
                peoplePosterImageData.image_category = "image";
                peoplePosterImageData.is_main_poster = "n";
              } else {
                peoplePosterImageData.image_category = "image";
                peoplePosterImageData.is_main_poster = "n";
              }
              await model.peopleImages.create(peoplePosterImageData);
              actionDate = peoplePosterImageData.created_at;
              recordId = peopleId;
              im == im++;
            }
          } else {
            console.log(
              `${consoleColors.fg.red} process schedule ${getTmbdId}-${schedulerId} tmdb data not found for people media \n ${consoleColors.reset}`,
            );
          }
        } else {
          console.log(
            `${consoleColors.fg.red} process schedule ${schedulerId} tmdb id data not found for people media \n ${consoleColors.reset}`,
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
        if (recordId)
          await titleService.titleDataAddEditInEditTbl(recordId, "people", createdBy, actionDate);
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
