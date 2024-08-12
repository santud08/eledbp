import model from "../../../models/index.js";
import { importClientJsonService, tmdbService, titleService } from "../../../services/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import fs from "fs";

/**
 * importClientJsonData
 * @param req
 * @param res
 */
export const importClientJsonData = async (req, res, next) => {
  try {
    const reqBody = req.body;
    let jsonData = [];
    const userId = req.userDetails.userId;
    const fileName = reqBody.file_name ? reqBody.file_name : "";
    const offset = reqBody.offset ? parseInt(reqBody.offset) : 0;
    const limit = reqBody.limit ? parseInt(reqBody.limit) : 10;
    if (fileName) {
      const jsonFileData = `public/uploads/bulks/import/client-sample-files/${fileName}`;
      const readData = fs.readFileSync(jsonFileData, { encoding: "utf8" });
      jsonData = JSON.parse(readData);
      const totalRecords = jsonData.length > 0 ? jsonData.length : 0;
      jsonData = jsonData.slice(offset, offset + limit);
      if (jsonData.length > 0) {
        for (let getValue of jsonData) {
          let titleId = "";
          const getType = getValue["tmdb_type"] ? getValue["tmdb_type"].toLowerCase() : "";
          const tmdbId = getValue["tmdb_id"];
          const tivingId = getValue["content_id"] ? getValue["content_id"] : null; //tiving_id
          const footfalls = getValue["box_office"] ? getValue["box_office"] : null; //footfalls
          const rating = getValue["viewing_rate"] ? getValue["viewing_rate"] : null; //rating
          const synopsis = getValue["synopsis"] ? getValue["synopsis"] : []; //plot summary
          const getGenres = getValue["genres"] ? getValue["genres"] : [];
          const getThemes = getValue["themes"] ? getValue["themes"] : [];
          const getMaterials = getValue["materials"] ? getValue["materials"] : [];
          const getMood = getValue["mood"] ? getValue["mood"] : [];
          const getPurposes = getValue["purposes"] ? getValue["purposes"] : [];
          const getCharacteristics = getValue["characteristics"] ? getValue["characteristics"] : [];
          const getCountryTag = getValue["locations"]["country"];
          const getPlace = getValue["locations"]["place"];
          const getEra = getValue["times"]["era"];
          const getYear = getValue["times"]["year"];
          const getCountry = getValue["prod_country"] ? getValue["prod_country"] : [];
          const getChannel = getValue["channel"] ? getValue["channel"] : "";
          const createdAt = getValue["created_at"]
            ? getValue["created_at"]
            : await customDateTimeHelper.getCurrentDateTime();

          const getOriginalSource =
            getValue["original"]["source"] !== null &&
            getValue["original"]["source"] !== "" &&
            getValue["original"]["source"] !== undefined
              ? getValue["original"]["source"]
              : false;

          const getKeywords = getValue["keywords"] ? getValue["keywords"] : [];

          let collectionId = 0,
            titleName = "",
            dbTivingId = "";

          // Check for tmdb id in title table
          if (tmdbId) {
            const getTitleInformations = await model.title.findOne({
              attributes: ["id", "type", "tiving_id"],
              where: {
                type: getType,
                tmdb_id: tmdbId,
                record_status: "active",
              },
            });

            if (getTitleInformations) {
              titleId = getTitleInformations.id;
              dbTivingId =
                getTitleInformations && getTitleInformations.tiving_id
                  ? getTitleInformations.tiving_id
                  : "";
              // update content ID -- tvying id
              if (!dbTivingId && tivingId && titleId) {
                await model.title.update({ tiving_id: tivingId }, { where: { id: titleId } });
              }
            } else {
              let tmdbEnData = {},
                tmdbKoData = {};
              const langEn = "en";
              const langKo = "ko";
              const insertData = {
                tiving_id: tivingId,
                uuid: await generalHelper.uuidv4(),
                tmdb_id: tmdbId,
                type: getType,
                created_at: createdAt,
                created_by: userId,
              };
              const titleTblInsert = await model.title.create(insertData);
              titleId = titleTblInsert.id;
              // service add for update data in edb_edits table
              const actionDate = await customDateTimeHelper.getCurrentDateTime();
              await titleService.titleDataAddEditInEditTbl(titleId, getType, userId, actionDate);
              if (getType == "movie") {
                [tmdbEnData, tmdbKoData] = await Promise.all([
                  tmdbService.fetchTitleDetails(getType, tmdbId, langEn),
                  tmdbService.fetchTitleDetails(getType, tmdbId, langKo),
                ]);
              } else if (getType == "tv") {
                [tmdbEnData, tmdbKoData] = await Promise.all([
                  tmdbService.fetchTitleDetails(getType, tmdbId, langEn),
                  tmdbService.fetchTitleDetails(getType, tmdbId, langKo),
                ]);
              }
              if (
                Object.keys(tmdbEnData.results).length > 0 ||
                Object.keys(tmdbKoData.results).length > 0
              ) {
                const tmdbEnTitle =
                  tmdbEnData.results && tmdbEnData.results.title ? tmdbEnData.results.title : "";
                const tmdbKoTitle =
                  tmdbKoData.results && tmdbKoData.results.title ? tmdbKoData.results.title : "";
                titleName = tmdbEnTitle ? tmdbEnTitle : tmdbKoTitle;
                collectionId =
                  tmdbEnData.results &&
                  tmdbEnData.results.belongs_to_collection &&
                  tmdbEnData.results.belongs_to_collection.id
                    ? tmdbEnData.results.belongs_to_collection.id
                    : 0;

                if (tmdbEnTitle) {
                  // Insert data into titleTranslations table for english language
                  const titleTranslationEnData = {
                    title_id: titleId,
                    site_language: "en",
                    name: tmdbEnTitle,
                    // synopsis: synopsis,
                    //created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_at: createdAt,
                    created_by: userId,
                  };
                  await model.titleTranslation.create(titleTranslationEnData);
                }

                if (tmdbKoTitle) {
                  // Insert data into titleTranslations table for korean language
                  const titleTranslationKoData = {
                    title_id: titleId,
                    site_language: "ko",
                    name: tmdbKoTitle,
                    // synopsis: synopsis,
                    //created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_at: createdAt,
                    created_by: userId,
                  };
                  await model.titleTranslation.create(titleTranslationKoData);
                }
              }
            }

            // TVING ID, Footfalls, Rating, synopsis, Country, Search keyword, Original work or not season wise
            // credit details and series title are taken from JSON
            if (titleId) {
              // remaining primary details
              const getData = {
                title_id: titleId,
                title_name: titleName,
                type: getType,
                tmdb_id: tmdbId,
                lang_en: "en",
                lang_ko: "ko",
                created_by: userId,
                channel: getChannel,
                footfalls: footfalls, // if TMDB does not has we use this one
                rating: rating, // if TMDB does not has we use this one
                synopsis: synopsis, // if TMDB does not has we use this one
                collectionId: collectionId, // collection id for series titles
              };
              await importClientJsonService.addTmdbDetails(getData);

              // Insert Original works data
              if (getOriginalSource) {
                const getOriginalWriter =
                  getValue["original"]["writer"] !== null &&
                  getValue["original"]["writer"] !== "" &&
                  getValue["original"]["writer"] !== undefined
                    ? getValue["original"]["writer"]
                    : "";

                const getOriginalTitle =
                  getValue["original"]["title"] !== null &&
                  getValue["original"]["title"] !== "" &&
                  getValue["original"]["title"] !== undefined
                    ? getValue["original"]["title"]
                    : "";

                const getOriginalType =
                  getValue["original"]["type"] !== null &&
                  getValue["original"]["type"] !== "" &&
                  getValue["original"]["type"] !== undefined
                    ? getValue["original"]["type"]
                    : "";
                const originalData = await model.originalWorks.findAll({
                  attributes: ["id"],
                  where: { title_id: titleId, status: "active" },
                });
                if (
                  getOriginalTitle &&
                  getOriginalType &&
                  getOriginalWriter &&
                  originalData.length == 0
                ) {
                  const originalWorksEnData = {
                    title_id: titleId,
                    ow_title: getOriginalTitle,
                    ow_type: getOriginalType,
                    ow_original_artis: getOriginalWriter,
                    site_language: "en",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  const originalWorksKoData = {
                    title_id: titleId,
                    ow_title: getOriginalTitle,
                    ow_type: getOriginalType,
                    ow_original_artis: getOriginalWriter,
                    site_language: "ko",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await Promise.all([
                    model.originalWorks.create(originalWorksEnData),
                    model.originalWorks.create(originalWorksKoData),
                  ]);
                }
              }

              // check have any data in taggable table
              const taggableWhere = {
                taggable_id: titleId,
                taggable_type: "title",
                status: "active",
              };
              const keywordsWhere = {
                title_id: titleId,
                status: "active",
                keyword_type: "search",
              };
              const [getTaggableInformations, getKeywordsInformations] = await Promise.all([
                model.tagGable.findAll({
                  attributes: ["tag_id"],
                  where: taggableWhere,
                }),
                model.titleKeyword.findAll({
                  attributes: ["id"],
                  where: keywordsWhere,
                }),
              ]);
              // if (getTaggableInformations.length == 0) {
              let tagData = [];
              // Store Genre Tag data
              if (getGenres !== undefined && getGenres.length > 0) {
                tagData = [...tagData, ...getGenres];
                // tagData.push(getGenres);
                // await importClientJsonService.addTagDetails(titleId, getGenres, userId);
              }
              // Store Themes Tag data
              if (getThemes !== undefined && getThemes.length > 0) {
                tagData = [...tagData, ...getThemes];
                // tagData.push(getThemes);
                // await importClientJsonService.addTagDetails(titleId, getThemes, userId);
              }
              // Store Materials Tag data
              if (getMaterials !== undefined && getMaterials.length > 0) {
                tagData = [...tagData, ...getMaterials];
                // tagData.push(getMaterials);
                // await importClientJsonService.addTagDetails(titleId, getMaterials, userId);
              }
              // Store Mood Tag data
              if (getMood !== undefined && getMood.length > 0) {
                tagData = [...tagData, ...getMood];
                // tagData.push(getMood);
                // await importClientJsonService.addTagDetails(titleId, getMood, userId);
              }
              // Store Purposes Tag data
              if (getPurposes !== undefined && getPurposes.length > 0) {
                tagData = [...tagData, ...getPurposes];
                // tagData.push(getPurposes);
                // await importClientJsonService.addTagDetails(titleId, getPurposes, userId);
              }
              // Store Characteristics Tag data
              if (getCharacteristics !== undefined && getCharacteristics.length > 0) {
                tagData = [...tagData, ...getCharacteristics];
                // tagData.push(getCharacteristics);
                // await importClientJsonService.addTagDetails(titleId, getCharacteristics, userId);
              }
              // Store CountryTag Tag data
              if (getCountryTag !== undefined && getCountryTag.length > 0) {
                tagData = [...tagData, ...getCountryTag];
                // tagData.push(getCountryTag);
                // await importClientJsonService.addTagDetails(titleId, getCountryTag, userId);
              }
              // Store Place Tag data
              if (getPlace !== undefined && getPlace.length > 0) {
                tagData = [...tagData, ...getPlace];
                // tagData.push(getPlace);
                // await importClientJsonService.addTagDetails(titleId, getPlace, userId);
              }
              // Store Era Tag data
              if (getEra !== undefined && getEra.length > 0) {
                tagData = [...tagData, ...getEra];
                // tagData.push(getEra);
                // await importClientJsonService.addTagDetails(titleId, getEra, userId);
              }
              // Store Year Tag data
              if (getYear !== undefined && getYear.length > 0) {
                tagData = [...tagData, ...getYear];
                // tagData.push(getYear);
                // await importClientJsonService.addTagDetails(titleId, getYear, userId);
              }
              if (tagData.length > 0) {
                await importClientJsonService.addTagDetails(titleId, tagData, userId);
              }
              // }

              // check have any data in taggable table
              if (getKeywordsInformations.length == 0) {
                // Store Genre Tag data
                if (getKeywords !== undefined && getKeywords.length > 0) {
                  const keywordType = "search";
                  await importClientJsonService.addKeywords(
                    titleId,
                    getKeywords,
                    userId,
                    keywordType,
                  );
                }
              }

              // check have any data in Country table
              const countryWhere = {
                title_id: titleId,
                status: "active",
              };
              const getCountryInformation = await model.titleCountries.findAll({
                attributes: ["id"],
                where: countryWhere,
              });
              if (getCountryInformation.length == 0) {
                // Store Genre Tag data
                if (getCountry !== undefined && getCountry.length > 0) {
                  await importClientJsonService.addCountryDetails(titleId, getCountry, userId);
                }
              }
            }
          }
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
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
