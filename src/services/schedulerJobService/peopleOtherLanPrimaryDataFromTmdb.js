import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { tmdbService, titleService } from "../../services/index.js";
import { consoleColors } from "../../utils/constants.js";
import { Op } from "sequelize";

export const peopleOtherLanPrimaryDataFromTmdb = async (payload, schedulerId, createdBy) => {
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
          let tmdbPeopleData = {},
            tmdbOtherPeopleData = {};
          const getTmbdId = payloadData.tmdb_id;
          const peopleId = payloadData.people_id;
          const lang = payloadData.site_language ? payloadData.site_language : "en";
          const langOther = payloadData.expected_site_language
            ? payloadData.expected_site_language
            : "ko";
          let peopleName = "";
          [tmdbPeopleData, tmdbOtherPeopleData] = await Promise.all([
            tmdbService.fetchPeopleDetails(getTmbdId, lang),
            tmdbService.fetchPeopleDetails(getTmbdId, langOther),
          ]);
          if (
            (tmdbPeopleData &&
              tmdbPeopleData.results &&
              tmdbPeopleData.results != null &&
              tmdbPeopleData.results != "undefined") ||
            (tmdbOtherPeopleData &&
              tmdbOtherPeopleData.results &&
              tmdbOtherPeopleData.results != null &&
              tmdbOtherPeopleData.results != "undefined")
          ) {
            let otherPeopleData = {};
            let aka = null;
            if (
              tmdbOtherPeopleData &&
              tmdbOtherPeopleData.results &&
              tmdbOtherPeopleData.results != null &&
              tmdbOtherPeopleData.results != "undefined"
            ) {
              otherPeopleData.created_by = createdBy;
              otherPeopleData.created_at = await customDateTimeHelper.getCurrentDateTime();

              otherPeopleData.name = tmdbOtherPeopleData.results.people_name
                ? tmdbOtherPeopleData.results.people_name.trim()
                : "";
              otherPeopleData.description = tmdbOtherPeopleData.results.biography
                ? tmdbOtherPeopleData.results.biography
                : null;
              otherPeopleData.people_id = peopleId;
              otherPeopleData.site_language = langOther;
              aka = tmdbOtherPeopleData.results.aka ? tmdbOtherPeopleData.results.aka : null;
            }
            if (
              tmdbPeopleData &&
              tmdbPeopleData.results &&
              tmdbPeopleData.results != null &&
              tmdbPeopleData.results != "undefined"
            ) {
              if (aka && (aka == "" || aka == null)) {
                aka = tmdbPeopleData.results.aka ? tmdbPeopleData.results.aka : null;
              }
            }
            const [getPeople, getOtherPeopleData, getPeopleNewsKeyWords] = await Promise.all([
              model.peopleTranslation.findOne({
                where: { people_id: peopleId, site_language: lang, status: { [Op.ne]: "deleted" } },
              }),
              model.peopleTranslation.findOne({
                where: {
                  people_id: peopleId,
                  site_language: langOther,
                  status: { [Op.ne]: "deleted" },
                },
              }),
              model.peopleKeywords.findOne({
                where: {
                  people_id: peopleId,
                  keyword_type: "news",
                  status: { [Op.ne]: "deleted" },
                },
              }),
            ]);
            if (getPeople && getPeople.id) {
              if (getPeople.known_for == "" || getPeople.known_for == null) {
                otherPeopleData.known_for = aka;
                await model.peopleTranslation.update(
                  { known_for: aka },
                  { where: { id: getPeople.id } },
                );
                actionDate = otherPeopleData.created_at;
                recordId = peopleId;
              } else {
                otherPeopleData.known_for = getPeople.known_for;
              }
              peopleName = getPeople.name;
            }

            if (!getOtherPeopleData) {
              await model.peopleTranslation.create(otherPeopleData);
              actionDate = otherPeopleData.created_at;
              recordId = peopleId;
            }

            if (peopleName == "" && getOtherPeopleData && getOtherPeopleData.id) {
              peopleName = getOtherPeopleData.name;
            }
            //add news keyword if not present
            if (!getPeopleNewsKeyWords && peopleName) {
              const newsKeywordData = {
                people_id: peopleId,
                site_language: lang ? lang : "en",
                keyword: peopleName,
                keyword_type: "news",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
              };
              await model.peopleKeywords.create(newsKeywordData);
              actionDate = newsKeywordData.created_at;
              recordId = peopleId;
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
