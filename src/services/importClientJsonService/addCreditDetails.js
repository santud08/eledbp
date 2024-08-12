import model from "../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, importTitleTmdbService, titleService } from "../../services/index.js";
/**
 * addCreditDetails
 * @param details
 */
export const addCreditDetails = async (titleId, type, job, dataArr, userId) => {
  try {
    const languageEn = "en";
    const languageKo = "ko";
    let createCredit = {};
    let schedularAddData = [];
    if (dataArr.length > 0) {
      for (const value of dataArr) {
        const peopleDetails = await model.people.findOne({
          where: {
            tmdb_id: value.tmdb_id,
            status: "active",
          },
        });
        let recordId = "";
        let actionDate = "";
        if (peopleDetails) {
          const peopleId = peopleDetails.id;
          recordId = peopleId;
          // people id found in people table - check for credit details for the particular people id and title id
          const condition = {
            people_id: peopleId,
            creditable_id: titleId,
            creditable_type: type,
            job: job,
            status: "active",
          };

          if (type === "cast") {
            condition.character_name = value.character;
          }
          const creditDetails = await model.creditable.findOne({
            attributes: ["id"],
            where: condition,
          });
          // if credit details not found then add credit details
          if (!creditDetails) {
            const getLastOrder = await model.creditable.max("list_order", {
              where: {
                creditable_id: titleId,
                department: type,
                creditable_type: "title",
              },
            });
            const castDataDetails = {
              people_id: peopleId,
              creditable_id: titleId,
              character_name: value.character ? value.character : null,
              list_order: getLastOrder + 1,
              department: type,
              job: job,
              creditable_type: "title",
              season_id: null,
              episode_id: null,
              site_language: languageEn,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.creditable.create(castDataDetails);
            actionDate = castDataDetails.created_at;
          }

          // Job table - check for job details for the particular people id
          const departmentName = job;
          if (departmentName) {
            await importTitleTmdbService.addPeopleJobs(
              departmentName,
              peopleId,
              userId,
              languageEn,
            );
          }
        } else if (value.tmdb_id) {
          // people id not found in people table - add people details with the help of tmdb id
          const [getPeopleEnData, getPeopleKoData] = await Promise.all([
            tmdbService.fetchPeopleDetails(value.tmdb_id, languageEn),
            tmdbService.fetchPeopleDetails(value.tmdb_id, languageKo),
          ]);
          const keyLength =
            getPeopleEnData && getPeopleEnData.results
              ? Object.keys(getPeopleEnData.results).length
              : 0;
          let createPeople = "";
          if (
            getPeopleEnData &&
            getPeopleEnData.results &&
            getPeopleEnData.results != null &&
            getPeopleEnData.results != "undefined" &&
            keyLength > 0
          ) {
            createCredit.tmdb_id = getPeopleEnData.results.tmdb_id;
            let gender = null;
            if (getPeopleEnData.results.gender && getPeopleEnData.results.gender == 2) {
              gender = "male";
            }
            if (getPeopleEnData.results.gender && getPeopleEnData.results.gender == 1) {
              gender = "female";
            }
            createCredit.gender = gender;
            createCredit.birth_date = getPeopleEnData.results.birth_day
              ? getPeopleEnData.results.birth_day
              : null;
            createCredit.imdb_id = getPeopleEnData.results.imdb_id
              ? getPeopleEnData.results.imdb_id
              : null;
            createCredit.official_site = getPeopleEnData.results.homepage
              ? getPeopleEnData.results.homepage
              : null;
            createCredit.death_date = getPeopleEnData.results.death_day
              ? getPeopleEnData.results.death_day
              : null;
            createCredit.adult =
              getPeopleEnData.results.adult && getPeopleEnData.results.adult === true ? 1 : 0;
            createCredit.popularity = getPeopleEnData.results.popularity
              ? getPeopleEnData.results.popularity
              : null;
            createCredit.poster = getPeopleEnData.results.profile_image
              ? getPeopleEnData.results.profile_image
              : null;
            createCredit.uuid = await generalHelper.uuidv4();
            createCredit.created_at = await customDateTimeHelper.getCurrentDateTime();
            createCredit.created_by = userId;
            createPeople = await model.people.create(createCredit);
            actionDate = createCredit.created_at;
          }

          if (createPeople.id) {
            const peopleId = createPeople.id;
            recordId = peopleId;
            let peopleKoData = {};
            let peopleEnData = {};
            // Translation Table

            peopleEnData.people_id = peopleId;
            peopleEnData.description = getPeopleEnData.results.biography
              ? getPeopleEnData.results.biography
              : null;
            peopleEnData.name = getPeopleEnData.results.people_name
              ? getPeopleEnData.results.people_name
              : null;
            peopleEnData.known_for = getPeopleEnData.results.aka
              ? getPeopleEnData.results.aka
              : null;
            peopleEnData.created_at = await customDateTimeHelper.getCurrentDateTime();
            peopleEnData.created_by = userId;
            peopleEnData.site_language = languageEn;

            if (
              getPeopleKoData &&
              getPeopleKoData.results &&
              getPeopleKoData.results != null &&
              getPeopleKoData.results != "undefined"
            ) {
              peopleKoData.people_id = peopleId;
              peopleKoData.description = getPeopleKoData.results.biography
                ? getPeopleKoData.results.biography
                : null;
              peopleKoData.name = getPeopleKoData.results.people_name
                ? getPeopleKoData.results.people_name
                : null;
              peopleKoData.known_for = getPeopleEnData.results.aka
                ? getPeopleEnData.results.aka
                : null;
              peopleKoData.created_at = await customDateTimeHelper.getCurrentDateTime();
              peopleKoData.created_by = userId;
              peopleKoData.site_language = languageKo;
            }
            await model.peopleTranslation.bulkCreate([peopleEnData, peopleKoData]);
            actionDate = peopleEnData.created_at;
            actionDate = peopleKoData.created_at;
            // Country Table
            const countryName = getPeopleEnData.results.place_of_birth
              ? getPeopleEnData.results.place_of_birth
              : null;
            const createdBy = userId;
            if (countryName) {
              await importTitleTmdbService.addPeopleCountry(
                countryName,
                peopleId,
                createdBy,
                languageKo,
              );
            }
            // Image Table
            if (createCredit.poster) {
              const fileName = createCredit.poster.substring(
                createCredit.poster.lastIndexOf("/") + 1,
              );
              const getLastOrder = await model.peopleImages.max("list_order", {
                where: {
                  people_id: peopleId,
                  image_category: "poster_image",
                  status: "active",
                },
              });
              const peoplePosterImageData = {
                original_name: fileName ? fileName : null,
                file_name: fileName ? fileName : null,
                path: getPeopleEnData.results.profile_image
                  ? getPeopleEnData.results.profile_image
                  : null,
                people_id: createPeople.id,
                source: "local",
                list_order: getLastOrder ? getLastOrder + 1 : 1,
                image_category: "poster_image",
                is_main_poster: "y",
                site_language: languageKo,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.peopleImages.create(peoplePosterImageData);
              actionDate = peoplePosterImageData.created_at;
            }
            // Job table
            const departmentName = getPeopleEnData.results.role_name
              ? getPeopleEnData.results.role_name
              : "";
            if (departmentName) {
              await importTitleTmdbService.addPeopleJobs(
                departmentName,
                peopleId,
                createdBy,
                languageEn,
              );
            }
            // Creditable Table
            const getLastOrder = await model.creditable.max("list_order", {
              where: {
                creditable_id: titleId,
                department: type,
                creditable_type: "title",
              },
            });
            const castDataDetails = {
              people_id: peopleId,
              creditable_id: titleId,
              character_name: value.character ? value.character : null,
              list_order: getLastOrder + 1,
              department: type,
              job: departmentName ? departmentName : job,
              creditable_type: "title",
              season_id: null,
              episode_id: null,
              site_language: languageEn,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.creditable.create(castDataDetails);
            actionDate = castDataDetails.created_at;

            // add data to the schedular table
            const schedularData = {
              tmdb_id: value.tmdb_id,
              site_language: "en",
              people_id: peopleId,
              created_by: userId,
            };
            schedularAddData.push(schedularData);
          }
        }

        // service add for update data in edb_edits table
        if (recordId)
          await titleService.titleDataAddEditInEditTbl(recordId, "people", userId, actionDate);
      }
    }
    return schedularAddData;
  } catch (error) {
    console.log("add Credit import client JSON", error);
    return { schedularAddData: [] };
  }
};
