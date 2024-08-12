import { Op } from "sequelize";
import model from "../../models/index.js";
import { customDateTimeHelper, generalHelper, customFileHelper } from "../../helpers/index.js";
import {
  tmdbService,
  importTitleTmdbService,
  schedulerJobService,
  titleService,
} from "../../services/index.js";

export const addTmdbSeasonTvCredits = async (
  titleId,
  tmdbId,
  seasonId,
  seasonNumber,
  createdBy,
  siteLanguage = "en",
) => {
  try {
    const getSeasonCreditData = await tmdbService.fetchTvSeasonCredit(
      tmdbId,
      seasonNumber,
      "",
      siteLanguage,
    );
    //cast
    if (
      getSeasonCreditData &&
      getSeasonCreditData.results != null &&
      getSeasonCreditData.results != "undefined" &&
      getSeasonCreditData.results.cast != "undefined" &&
      getSeasonCreditData.results.cast.length > 0
    ) {
      let payload = null;
      let primaryDetailsPayload = null;
      let payloadPeopleList = [];
      for (const castData of getSeasonCreditData.results.cast) {
        const castName = castData.cast_name ? castData.cast_name : "";
        const characterName = castData.character_name ? castData.character_name : "";
        const job = castData.job ? castData.job : "";
        const isGuest = castData.is_guest ? castData.is_guest : "n";
        const poster = castData.poster ? castData.poster : "";
        const listOrder = castData.list_order ? castData.list_order : 0;
        const peopleTmdbId = castData.tmdb_id ? castData.tmdb_id : null;
        let actionDate = "";
        const getPeople = await model.people.findOne({
          attributes: ["id"],
          where: { tmdb_id: peopleTmdbId, status: { [Op.ne]: "deleted" } },
        });
        let peopleId = 0;
        let departmentName = null;
        let placeOfBirth = null;
        if (getPeople) {
          peopleId = getPeople.id ? getPeople.id : 0;
        } else {
          const getPeopleData = await tmdbService.fetchPeopleDetails(peopleTmdbId, siteLanguage);
          const createPeopleData = {
            poster: poster,
            tmdb_id: peopleTmdbId,
            uuid: await generalHelper.uuidv4(),
            created_by: createdBy,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          if (
            getPeopleData &&
            getPeopleData.results &&
            getPeopleData.results != null &&
            getPeopleData.results != "undefined"
          ) {
            createPeopleData.tmdb_id = getPeopleData.results.tmdb_id;
            let gender = null;
            if (getPeopleData.results.gender && getPeopleData.results.gender == 2) {
              gender = "male";
            }
            if (getPeopleData.results.gender && getPeopleData.results.gender == 1) {
              gender = "female";
            }
            createPeopleData.gender = gender;
            createPeopleData.birth_date = getPeopleData.results.birth_day
              ? getPeopleData.results.birth_day
              : null;
            createPeopleData.imdb_id = getPeopleData.results.imdb_id
              ? getPeopleData.results.imdb_id
              : null;
            createPeopleData.official_site = getPeopleData.results.homepage
              ? getPeopleData.results.homepage
              : null;
            createPeopleData.death_date = getPeopleData.results.death_day
              ? getPeopleData.results.death_day
              : null;
            createPeopleData.adult =
              getPeopleData.results.adult && getPeopleData.results.adult === true ? 1 : 0;
            createPeopleData.popularity = getPeopleData.results.popularity
              ? getPeopleData.results.popularity
              : 0;
            departmentName = getPeopleData.results.role_name;
            placeOfBirth = getPeopleData.results.place_of_birth;
          }

          const createPeople = await model.people.create(createPeopleData);
          if (createPeople && createPeople.id) {
            peopleId = createPeople.id;
            payloadPeopleList.push({
              record_id: peopleId,
              type: "people",
              action: "add",
            });
            actionDate = createPeopleData.created_at;
            const peopleTransData = {
              people_id: createPeople.id,
              name: castName,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              site_language: siteLanguage,
            };
            if (
              getPeopleData &&
              getPeopleData.results &&
              getPeopleData.results != null &&
              getPeopleData.results != "undefined"
            ) {
              peopleTransData.description = getPeopleData.results.biography
                ? getPeopleData.results.biography
                : null;
              peopleTransData.known_for = getPeopleData.results.aka
                ? getPeopleData.results.aka
                : null;
            }
            if (
              !(await model.peopleTranslation.findOne({
                where: { people_id: peopleId, site_language: siteLanguage },
              }))
            ) {
              await model.peopleTranslation.create(peopleTransData);
              actionDate = peopleTransData.created_at;
            }
            //generate sheduler data
            if (peopleTmdbId && peopleId) {
              if (payload == null) {
                payload = { list: [] };
              }
              if (primaryDetailsPayload == null) {
                primaryDetailsPayload = { list: [] };
              }
              const swipLanguage = await generalHelper.swipeLanguage(siteLanguage);

              payload.list.push({
                tmdb_id: peopleTmdbId,
                site_language: siteLanguage,
                people_id: peopleId,
                created_by: createdBy,
              });
              primaryDetailsPayload.list.push({
                tmdb_id: peopleTmdbId,
                site_language: siteLanguage,
                people_id: peopleId,
                created_by: createdBy,
                expected_site_language: swipLanguage,
              });
            }
            // adding image details to the people image table
            if (poster) {
              const fileName = poster.substring(poster.lastIndexOf("/") + 1);
              const getLastOrder = await model.peopleImages.max("list_order", {
                where: {
                  people_id: createPeople.id,
                  site_language: siteLanguage,
                  image_category: "poster_image",
                },
              });

              const fileExtension = await customFileHelper.getFileExtByFileName(poster);
              const peoplePosterImageData = {
                original_name: fileName ? fileName : null,
                file_name: fileName ? fileName : null,
                path: poster ? poster : null,
                file_extension: fileExtension ? fileExtension : null,
                people_id: createPeople.id,
                source: "tmdb",
                list_order: getLastOrder ? getLastOrder + 1 : 1,
                image_category: "poster_image",
                is_main_poster: "y",
                site_language: siteLanguage,
                created_by: createdBy,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              await model.peopleImages.create(peoplePosterImageData);
            }
            //add job details
            if (departmentName) {
              await importTitleTmdbService.addPeopleJobs(
                departmentName,
                peopleId,
                createdBy,
                siteLanguage,
              );
            }
            if (placeOfBirth) {
              await importTitleTmdbService.addPeopleCountry(
                placeOfBirth,
                peopleId,
                createdBy,
                siteLanguage,
              );
            }
          }
        }

        if (peopleId && peopleId > 0) {
          const getCreditable = await model.creditable.findOne({
            attributes: ["id"],
            where: {
              people_id: peopleId,
              creditable_id: titleId,
              season_id: seasonId,
              department: "cast",
              creditable_type: "title",
              character_name: characterName ? characterName : null,
              job: job ? job : null,
            },
          });
          if (!getCreditable) {
            const castDataDetails = {
              people_id: peopleId,
              creditable_id: titleId,
              character_name: characterName ? characterName : null,
              list_order: listOrder,
              department: "cast",
              job: job ? job : null,
              creditable_type: "title",
              season_id: seasonId,
              is_guest: isGuest == "y" ? 1 : 0,
              site_language: siteLanguage,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.creditable.create(castDataDetails);
            actionDate = castDataDetails.created_at;
            // service add for update data in edb_edits table
            await titleService.titleDataAddEditInEditTbl(peopleId, "people", createdBy, actionDate);
          }
        }
      }
      //add in schedular - media
      if (payload && payload.list && payload.list.length > 0) {
        await schedulerJobService.addJobInScheduler(
          "people media update",
          JSON.stringify(payload),
          "people_media",
          "",
          createdBy,
        );
      }
      if (payloadPeopleList.length > 0) {
        const payloadPeople = {
          list: payloadPeopleList,
        };
        schedulerJobService.addJobInScheduler(
          "add people data to search db",
          JSON.stringify(payloadPeople),
          "search_db",
          `add people in edit season tv tmdb credit cast`,
          createdBy,
        );
      }
      //add in schedular - primary details
      if (
        primaryDetailsPayload &&
        primaryDetailsPayload.list &&
        primaryDetailsPayload.list.length > 0
      ) {
        await schedulerJobService.addJobInScheduler(
          "add other language people primary data",
          JSON.stringify(primaryDetailsPayload),
          "people_language_primary_data",
          "",
          createdBy,
        );
      }
    }
    //crew
    if (
      getSeasonCreditData &&
      getSeasonCreditData.results != null &&
      getSeasonCreditData.results != "undefined" &&
      getSeasonCreditData.results.crew != "undefined" &&
      getSeasonCreditData.results.crew.length > 0
    ) {
      let payload = null;
      let primaryDetailsPayload = null;
      let payloadPeopleList = [];
      for (const castData of getSeasonCreditData.results.crew) {
        const castName = castData.cast_name ? castData.cast_name : "";
        const job = castData.job ? castData.job : "";
        const poster = castData.poster ? castData.poster : "";
        const listOrder = castData.list_order ? castData.list_order : 0;
        const peopleTmdbId = castData.tmdb_id ? castData.tmdb_id : null;
        let actionDate = "";
        const getPeople = await model.people.findOne({
          attributes: ["id"],
          where: { tmdb_id: peopleTmdbId, status: { [Op.ne]: "deleted" } },
        });
        let peopleId = 0;
        let departmentName = null;
        let placeOfBirth = null;
        if (getPeople) {
          peopleId = getPeople.id ? getPeople.id : 0;
        } else {
          const getPeopleData = await tmdbService.fetchPeopleDetails(peopleTmdbId, siteLanguage);
          const createPeopleData = {
            poster: poster,
            tmdb_id: peopleTmdbId,
            uuid: await generalHelper.uuidv4(),
            created_by: createdBy,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          if (
            getPeopleData &&
            getPeopleData.results &&
            getPeopleData.results != null &&
            getPeopleData.results != "undefined"
          ) {
            createPeopleData.tmdb_id = getPeopleData.results.tmdb_id;
            let gender = null;
            if (getPeopleData.results.gender && getPeopleData.results.gender == 2) {
              gender = "male";
            }
            if (getPeopleData.results.gender && getPeopleData.results.gender == 1) {
              gender = "female";
            }
            createPeopleData.gender = gender;
            createPeopleData.birth_date = getPeopleData.results.birth_day
              ? getPeopleData.results.birth_day
              : null;
            createPeopleData.imdb_id = getPeopleData.results.imdb_id
              ? getPeopleData.results.imdb_id
              : null;
            createPeopleData.official_site = getPeopleData.results.homepage
              ? getPeopleData.results.homepage
              : null;
            createPeopleData.death_date = getPeopleData.results.death_day
              ? getPeopleData.results.death_day
              : null;
            createPeopleData.adult =
              getPeopleData.results.adult && getPeopleData.results.adult === true ? 1 : 0;
            createPeopleData.popularity = getPeopleData.results.popularity
              ? getPeopleData.results.popularity
              : 0;
            departmentName = getPeopleData.results.role_name;
            placeOfBirth = getPeopleData.results.place_of_birth;
          }

          const createPeople = await model.people.create(createPeopleData);
          if (createPeople && createPeople.id) {
            peopleId = createPeople.id;
            payloadPeopleList.push({
              record_id: peopleId,
              type: "people",
              action: "add",
            });
            actionDate = createPeopleData.created_at;
            const peopleTransData = {
              people_id: createPeople.id,
              name: castName,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              site_language: siteLanguage,
            };
            if (
              getPeopleData &&
              getPeopleData.results &&
              getPeopleData.results != null &&
              getPeopleData.results != "undefined"
            ) {
              peopleTransData.description = getPeopleData.results.biography
                ? getPeopleData.results.biography
                : null;
              peopleTransData.known_for = getPeopleData.results.aka
                ? getPeopleData.results.aka
                : null;
            }
            if (
              !(await model.peopleTranslation.findOne({
                where: { people_id: peopleId, site_language: siteLanguage },
              }))
            ) {
              await model.peopleTranslation.create(peopleTransData);
              actionDate = peopleTransData.created_at;
            }
            //generate sheduler data
            if (peopleTmdbId && peopleId) {
              if (payload == null) {
                payload = { list: [] };
              }
              if (primaryDetailsPayload == null) {
                primaryDetailsPayload = { list: [] };
              }
              const swipLanguage = await generalHelper.swipeLanguage(siteLanguage);

              payload.list.push({
                tmdb_id: peopleTmdbId,
                site_language: siteLanguage,
                people_id: peopleId,
                created_by: createdBy,
              });
              primaryDetailsPayload.list.push({
                tmdb_id: peopleTmdbId,
                site_language: siteLanguage,
                people_id: peopleId,
                created_by: createdBy,
                expected_site_language: swipLanguage,
              });
            }
            // adding image details to the people image table
            if (poster) {
              const fileName = poster.substring(poster.lastIndexOf("/") + 1);
              const getLastOrder = await model.peopleImages.max("list_order", {
                where: {
                  people_id: createPeople.id,
                  site_language: siteLanguage,
                  image_category: "poster_image",
                },
              });

              const fileExtension = await customFileHelper.getFileExtByFileName(poster);
              const peoplePosterImageData = {
                original_name: fileName ? fileName : null,
                file_name: fileName ? fileName : null,
                path: poster ? poster : null,
                file_extension: fileExtension ? fileExtension : null,
                people_id: createPeople.id,
                source: "tmdb",
                list_order: getLastOrder ? getLastOrder + 1 : 1,
                image_category: "poster_image",
                is_main_poster: "y",
                site_language: siteLanguage,
                created_by: createdBy,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              await model.peopleImages.create(peoplePosterImageData);
              actionDate = peoplePosterImageData.created_at;
            }
            //add job details
            if (departmentName) {
              await importTitleTmdbService.addPeopleJobs(
                departmentName,
                peopleId,
                createdBy,
                siteLanguage,
              );
            }
            if (placeOfBirth) {
              await importTitleTmdbService.addPeopleCountry(
                placeOfBirth,
                peopleId,
                createdBy,
                siteLanguage,
              );
            }
          }
        }

        if (peopleId && peopleId > 0) {
          const getCreditable = await model.creditable.findOne({
            attributes: ["id"],
            where: {
              people_id: peopleId,
              creditable_id: titleId,
              season_id: seasonId,
              department: "crew",
              creditable_type: "title",
              job: job ? job : null,
            },
          });
          if (!getCreditable) {
            const castDataDetails = {
              people_id: peopleId,
              creditable_id: titleId,
              list_order: listOrder,
              department: "crew",
              job: job ? job : null,
              creditable_type: "title",
              season_id: seasonId,
              site_language: siteLanguage,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.creditable.create(castDataDetails);
            actionDate = castDataDetails.created_at;
            // service add for update data in edb_edits table
            await titleService.titleDataAddEditInEditTbl(peopleId, "people", createdBy, actionDate);
          }
        }
      }
      //add in schedular - media
      if (payload && payload.list && payload.list.length > 0) {
        await schedulerJobService.addJobInScheduler(
          "people media update",
          JSON.stringify(payload),
          "people_media",
          "",
          createdBy,
        );
      }
      if (payloadPeopleList.length > 0) {
        const payloadPeople = {
          list: payloadPeopleList,
        };
        schedulerJobService.addJobInScheduler(
          "add people data to search db",
          JSON.stringify(payloadPeople),
          "search_db",
          `add people in add season tv tmdb credits crew`,
          createdBy,
        );
      }
      //add in schedular - primary details
      if (
        primaryDetailsPayload &&
        primaryDetailsPayload.list &&
        primaryDetailsPayload.list.length > 0
      ) {
        await schedulerJobService.addJobInScheduler(
          "add other language people primary data",
          JSON.stringify(primaryDetailsPayload),
          "people_language_primary_data",
          "",
          createdBy,
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};
