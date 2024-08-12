import model from "../../models/index.js";
import { customDateTimeHelper, mappingIdsHelper } from "../../helpers/index.js";
import {
  tmdbService,
  importTitleTmdbService,
  titleService,
  schedulerJobService,
} from "../../services/index.js";
import { consoleColors, TAG_SCORE } from "../../utils/constants.js";
import { Op } from "sequelize";

export const updateSeriesPrimaryDataFromTmdb = async (
  payload,
  schedulerId,
  createdBy,
  actionType,
) => {
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
      if (actionType == "submit_all") {
        for (const payloadData of payload.list) {
          let actionDate = "";
          let recordId = "";
          let type = "";
          if (payloadData && payloadData.tmdb_id && payloadData.title_id > 0) {
            let tmdbTitleAkaData = {},
              tmdbOtherTitleData = {},
              tmdbCertification = {},
              tmdbWatch = {},
              tmdbImages = {},
              tmdbVideos = {},
              tmdbCredits = {},
              tmdbOtherTitleAkaData = {};
            const getTmbdId = payloadData.tmdb_id;
            const titleId = payloadData.title_id;
            const titleType = payloadData.type;
            type = titleType;
            const lang = payloadData.site_language ? payloadData.site_language : "en";
            const langOther = payloadData.expected_site_language
              ? payloadData.expected_site_language
              : "ko";
            let titleName = "";
            [
              tmdbOtherTitleData,
              tmdbTitleAkaData,
              tmdbOtherTitleAkaData,
              tmdbCertification,
              tmdbWatch,
              tmdbImages,
              tmdbVideos,
              tmdbCredits,
            ] = await Promise.all([
              tmdbService.fetchTitleDetails(titleType, getTmbdId, langOther),
              tmdbService.fetchTitleAka(titleType, getTmbdId, lang),
              tmdbService.fetchTitleAka(titleType, getTmbdId, langOther),
              tmdbService.fetchTitleCertification(titleType, getTmbdId, "ko"),
              tmdbService.fetchTitleWatch(titleType, getTmbdId, null, "ko"),
              tmdbService.fetchMovieImages(getTmbdId, null, null),
              tmdbService.fetchTitleVideos(titleType, getTmbdId, null),
              tmdbService.fetchTitleCredits(titleType, getTmbdId, null, lang),
            ]);
            if (
              tmdbOtherTitleData &&
              tmdbOtherTitleData.results &&
              tmdbOtherTitleData.results != null &&
              tmdbOtherTitleData.results != "undefined"
            ) {
              let otherTitleData = {};
              let aka = null;

              otherTitleData.created_by = createdBy;
              otherTitleData.created_at = await customDateTimeHelper.getCurrentDateTime();

              otherTitleData.title_id = titleId;
              otherTitleData.site_language = langOther;

              otherTitleData.name = tmdbOtherTitleData.results.title
                ? tmdbOtherTitleData.results.title
                : "";
              otherTitleData.description = tmdbOtherTitleData.results.overview
                ? tmdbOtherTitleData.results.overview
                : null;
              otherTitleData.tagline = tmdbOtherTitleData.results.tagline
                ? tmdbOtherTitleData.results.tagline
                : null;
              otherTitleData.plot_summary = tmdbOtherTitleData.results.tmdb_plot_summery
                ? tmdbOtherTitleData.results.tmdb_plot_summery
                : "";

              let tmdbAka =
                tmdbTitleAkaData.results && tmdbTitleAkaData.results.all_aka
                  ? tmdbTitleAkaData.results.all_aka
                  : "";
              if (!tmdbAka) {
                tmdbAka =
                  tmdbOtherTitleAkaData.results && tmdbOtherTitleAkaData.results.all_aka
                    ? tmdbOtherTitleAkaData.results.all_aka
                    : "";
              }

              const [getTitle, getOtherTitleData, getTitleNewsKeyword] = await Promise.all([
                model.titleTranslation.findOne({
                  where: {
                    title_id: titleId,
                    site_language: lang,
                    status: { [Op.ne]: "deleted" },
                  },
                }),
                model.titleTranslation.findOne({
                  where: {
                    title_id: titleId,
                    site_language: langOther,
                    status: { [Op.ne]: "deleted" },
                  },
                }),
                model.titleKeyword.findOne({
                  where: {
                    title_id: titleId,
                    keyword_type: "news",
                    status: { [Op.ne]: "deleted" },
                  },
                }),
              ]);

              let mainTitleTblData = {
                updated_by: createdBy,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };

              mainTitleTblData.certification =
                tmdbCertification &&
                tmdbCertification.results &&
                tmdbCertification.results.certification_key
                  ? tmdbCertification.results.certification_key
                  : "";
              await model.title.update(mainTitleTblData, { where: { id: titleId } });
              if (getTitle && getTitle.id) {
                actionDate = mainTitleTblData.updated_at;
                recordId = titleId;
                if (getTitle.aka == "" || getTitle.aka == null) {
                  otherTitleData.aka = tmdbAka;
                  await model.titleTranslation.update({ aka: aka }, { where: { id: getTitle.id } });
                } else {
                  otherTitleData.aka = getTitle.aka;
                }
                titleName = getTitle.name;
              }

              if (!getOtherTitleData) {
                await model.titleTranslation.create(otherTitleData);
              }

              if (titleName == "" && getOtherTitleData && getOtherTitleData.id) {
                titleName = getOtherTitleData.name;
              }
              //add news keyword if not present
              if (!getTitleNewsKeyword && titleName) {
                const newsKeywordData = {
                  title_id: titleId,
                  site_language: lang ? lang : "en",
                  keyword: titleName,
                  keyword_type: "news",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: createdBy,
                };
                await model.titleKeyword.create(newsKeywordData);
                actionDate = newsKeywordData.created_at;
              }
              //watch
              if (tmdbWatch && tmdbWatch.results && titleId && titleType == "movie") {
                await Promise.all([
                  importTitleTmdbService.addMovieWatch(
                    tmdbWatch.results.rent,
                    titleId,
                    "rent",
                    createdBy,
                    lang,
                  ),
                  importTitleTmdbService.addMovieWatch(
                    tmdbWatch.results.buy,
                    titleId,
                    "buy",
                    createdBy,
                    lang,
                  ),
                  importTitleTmdbService.addMovieWatch(
                    tmdbWatch.results.stream,
                    titleId,
                    "stream",
                    createdBy,
                    lang,
                  ),
                ]);
              }
              //image
              if (
                tmdbImages &&
                tmdbImages.results &&
                tmdbImages.results.bg_image &&
                tmdbImages.results.bg_image.length > 0
              ) {
                await Promise.all([
                  importTitleTmdbService.addMovieTmdbImages(
                    tmdbImages.results.bg_image,
                    titleId,
                    "bg_image",
                    createdBy,
                    lang,
                  ),
                  importTitleTmdbService.addMovieTmdbImages(
                    tmdbImages.results.bg_image,
                    titleId,
                    "image",
                    createdBy,
                    lang,
                  ),
                ]);
              }
              if (
                tmdbImages &&
                tmdbImages.results &&
                tmdbImages.results.poster_image &&
                tmdbImages.results.poster_image.length > 0
              ) {
                await importTitleTmdbService.addMovieTmdbImages(
                  tmdbImages.results.poster_image,
                  titleId,
                  "poster_image",
                  createdBy,
                  lang,
                );
              }
              //video
              if (tmdbVideos && tmdbVideos.results && tmdbVideos.results.length > 0) {
                await importTitleTmdbService.addMovieTmdbVideos(
                  tmdbVideos.results,
                  titleId,
                  createdBy,
                  lang,
                );
              }
              //credits
              // credit data cast & crew
              if (
                tmdbCredits &&
                tmdbCredits.results &&
                tmdbCredits.results.cast.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.editMovieTmdbCast(
                    tmdbCredits.results.cast,
                    titleId,
                    createdBy,
                    lang,
                  ),
                ]);
              }
              if (
                tmdbCredits &&
                tmdbCredits.results &&
                tmdbCredits.results.crew.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.editMovieTmdbCrew(
                    tmdbCredits.results.crew,
                    titleId,
                    createdBy,
                    lang,
                  ),
                ]);
              }
              //genre tags
              const tmdbGenre =
                tmdbOtherTitleData &&
                tmdbOtherTitleData.results.genres &&
                tmdbOtherTitleData.results.genres.length > 0
                  ? tmdbOtherTitleData.results.genres
                  : [];
              if (tmdbGenre.length > 0) {
                for (const data of tmdbGenre) {
                  if (data.id) {
                    const genreId = await mappingIdsHelper.genreTmdbIdMappings(data.id);
                    if (genreId && genreId > 0) {
                      const genreData = {
                        tag_id: genreId,
                        taggable_id: titleId,
                        taggable_type: "title",
                        site_language: lang,
                        user_id: createdBy,
                        score: TAG_SCORE,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: createdBy,
                      };
                      const checkTag = await model.tagGable.findOne({
                        where: { tag_id: genreId, taggable_id: titleId },
                      });
                      if (!checkTag) {
                        await model.tagGable.create(genreData);
                        actionDate = genreData.created_at;
                      }
                    }
                  }
                }
              }
              //country
              const countryListEn =
                tmdbOtherTitleData.results.production_countries &&
                tmdbOtherTitleData.results.production_countries.length > 0
                  ? tmdbOtherTitleData.results.production_countries
                  : [];
              if (countryListEn.length > 0) {
                await importTitleTmdbService.editTitleTmdbCountry(
                  countryListEn,
                  titleId,
                  createdBy,
                  lang,
                );
              }
              //
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
          if (recordId) {
            await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
            if (type) {
              const payload = { list: [{ record_id: recordId, type: type, action: "add" }] };
              schedulerJobService.addJobInScheduler(
                "add title data to search db",
                JSON.stringify(payload),
                "search_db",
                `add data from series data from cron updateSeriesPrimaryDataFromTmdb for ${type} Details for submit all`,
                createdBy,
              );
            }
          }
          pd++;
        }
      } else if (actionType == "import_data") {
        //
        for (const payloadData of payload.list) {
          let actionDate = "";
          let recordId = "";
          let type = "";
          if (payloadData && payloadData.tmdb_id && payloadData.title_id > 0) {
            let tmdbTitleAkaData = {},
              tmdbOtherTitleData = {},
              tmdbCertification = {},
              tmdbWatch = {},
              tmdbImages = {},
              tmdbVideos = {},
              tmdbCredits = {},
              tmdbOtherTitleAkaData = {};
            const getTmbdId = payloadData.tmdb_id;
            const titleId = payloadData.title_id;
            const titleType = payloadData.type;
            type = titleType;
            const lang = payloadData.site_language ? payloadData.site_language : "en";
            let titleName = "";
            [
              tmdbOtherTitleData,
              tmdbCertification,
              tmdbWatch,
              tmdbImages,
              tmdbVideos,
              tmdbCredits,
            ] = await Promise.all([
              tmdbService.fetchTitleDetails(titleType, getTmbdId, lang),
              tmdbService.fetchTitleCertification(titleType, getTmbdId, "ko"),
              tmdbService.fetchTitleWatch(titleType, getTmbdId, null, "ko"),
              tmdbService.fetchMovieImages(getTmbdId, null, null),
              tmdbService.fetchTitleVideos(titleType, getTmbdId, null),
              tmdbService.fetchTitleCredits(titleType, getTmbdId, null, lang),
            ]);
            if (
              tmdbOtherTitleData &&
              tmdbOtherTitleData.results &&
              tmdbOtherTitleData.results != null &&
              tmdbOtherTitleData.results != "undefined"
            ) {
              let tmdbAka =
                tmdbTitleAkaData.results && tmdbTitleAkaData.results.all_aka
                  ? tmdbTitleAkaData.results.all_aka
                  : "";
              if (!tmdbAka) {
                tmdbAka =
                  tmdbOtherTitleAkaData.results && tmdbOtherTitleAkaData.results.all_aka
                    ? tmdbOtherTitleAkaData.results.all_aka
                    : "";
              }

              const [getOtherTitleData, getTitleNewsKeyword] = await Promise.all([
                model.titleTranslation.findOne({
                  where: {
                    title_id: titleId,
                    site_language: lang,
                    status: { [Op.ne]: "deleted" },
                  },
                }),
                model.titleKeyword.findOne({
                  where: {
                    title_id: titleId,
                    keyword_type: "news",
                    status: { [Op.ne]: "deleted" },
                  },
                }),
              ]);

              let mainTitleTblData = {
                updated_by: createdBy,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };

              mainTitleTblData.certification =
                tmdbCertification &&
                tmdbCertification.results &&
                tmdbCertification.results.certification_key
                  ? tmdbCertification.results.certification_key
                  : "";
              await model.title.update(mainTitleTblData, { where: { id: titleId } });
              actionDate = mainTitleTblData.updated_at;
              recordId = titleId;
              if (titleName == "" && getOtherTitleData && getOtherTitleData.id) {
                titleName = getOtherTitleData.name;
              }
              //add news keyword if not present
              if (!getTitleNewsKeyword && titleName) {
                const newsKeywordData = {
                  title_id: titleId,
                  site_language: lang ? lang : "en",
                  keyword: titleName,
                  keyword_type: "news",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: createdBy,
                };
                await model.titleKeyword.create(newsKeywordData);
                actionDate = newsKeywordData.created_at;
              }
              //watch
              if (tmdbWatch && tmdbWatch.results && titleId && titleType == "movie") {
                await Promise.all([
                  importTitleTmdbService.addMovieWatch(
                    tmdbWatch.results.rent,
                    titleId,
                    "rent",
                    createdBy,
                    lang,
                  ),
                  importTitleTmdbService.addMovieWatch(
                    tmdbWatch.results.buy,
                    titleId,
                    "buy",
                    createdBy,
                    lang,
                  ),
                  importTitleTmdbService.addMovieWatch(
                    tmdbWatch.results.stream,
                    titleId,
                    "stream",
                    createdBy,
                    lang,
                  ),
                ]);
              }
              //image
              if (
                tmdbImages &&
                tmdbImages.results &&
                tmdbImages.results.bg_image &&
                tmdbImages.results.bg_image.length > 0
              ) {
                await Promise.all([
                  importTitleTmdbService.addMovieTmdbImages(
                    tmdbImages.results.bg_image,
                    titleId,
                    "bg_image",
                    createdBy,
                    lang,
                  ),
                  importTitleTmdbService.addMovieTmdbImages(
                    tmdbImages.results.bg_image,
                    titleId,
                    "image",
                    createdBy,
                    lang,
                  ),
                ]);
              }
              if (
                tmdbImages &&
                tmdbImages.results &&
                tmdbImages.results.poster_image &&
                tmdbImages.results.poster_image.length > 0
              ) {
                await importTitleTmdbService.addMovieTmdbImages(
                  tmdbImages.results.poster_image,
                  titleId,
                  "poster_image",
                  createdBy,
                  lang,
                );
              }
              //video
              if (tmdbVideos && tmdbVideos.results && tmdbVideos.results.length > 0) {
                await importTitleTmdbService.addMovieTmdbVideos(
                  tmdbVideos.results,
                  titleId,
                  createdBy,
                  lang,
                );
              }
              //credits
              // credit data cast & crew
              if (
                tmdbCredits &&
                tmdbCredits.results &&
                tmdbCredits.results.cast.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.editMovieTmdbCast(
                    tmdbCredits.results.cast,
                    titleId,
                    createdBy,
                    lang,
                  ),
                ]);
              }
              if (
                tmdbCredits &&
                tmdbCredits.results &&
                tmdbCredits.results.crew.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.editMovieTmdbCrew(
                    tmdbCredits.results.crew,
                    titleId,
                    createdBy,
                    lang,
                  ),
                ]);
              }
              //genre tags
              const tmdbGenre =
                tmdbOtherTitleData &&
                tmdbOtherTitleData.results.genres &&
                tmdbOtherTitleData.results.genres.length > 0
                  ? tmdbOtherTitleData.results.genres
                  : [];
              if (tmdbGenre.length > 0) {
                for (const data of tmdbGenre) {
                  if (data.id) {
                    const genreId = await mappingIdsHelper.genreTmdbIdMappings(data.id);
                    if (genreId && genreId > 0) {
                      const genreData = {
                        tag_id: genreId,
                        taggable_id: titleId,
                        taggable_type: "title",
                        site_language: lang,
                        user_id: createdBy,
                        score: TAG_SCORE,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: createdBy,
                      };
                      const checkTag = await model.tagGable.findOne({
                        where: { tag_id: genreId, taggable_id: titleId },
                      });
                      if (!checkTag) {
                        await model.tagGable.create(genreData);
                        actionDate = genreData.created_at;
                      }
                    }
                  }
                }
              }
              //country
              const countryListEn =
                tmdbOtherTitleData.results.production_countries &&
                tmdbOtherTitleData.results.production_countries.length > 0
                  ? tmdbOtherTitleData.results.production_countries
                  : [];
              if (countryListEn.length > 0) {
                await importTitleTmdbService.editTitleTmdbCountry(
                  countryListEn,
                  titleId,
                  createdBy,
                  lang,
                );
              }
              //
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
          if (recordId) {
            await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
            if (type) {
              const payload = { list: [{ record_id: recordId, type: type, action: "add" }] };
              schedulerJobService.addJobInScheduler(
                "add title data to search db",
                JSON.stringify(payload),
                "search_db",
                `add data from series data from cron updateSeriesPrimaryDataFromTmdb for ${type} Details import data`,
                createdBy,
              );
            }
          }
          pd++;
        }
      } else {
        console.log(
          `${consoleColors.fg.red} process schedule ${schedulerId} actiontype data not found for the record \n ${consoleColors.reset}`,
        );
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
