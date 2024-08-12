import model from "../../models/index.js";
import {
  customDateTimeHelper,
  customFileHelper,
  generalHelper,
  mappingIdsHelper,
} from "../../helpers/index.js";
import {
  tmdbService,
  importTitleTmdbService,
  titleService,
  schedulerJobService,
} from "../../services/index.js";
import { Op } from "sequelize";
import { consoleColors, TAG_SCORE } from "../../utils/constants.js";

export const importTmdbData = async (getData, langEn, langKo) => {
  try {
    let getFileId = "";
    const getLastItem = getData[getData.length - 1];
    const getLastItemValue = getLastItem.dataValues.imported_file_id;
    for (let data of getData) {
      let actionDate = "";
      let recordId = "";
      const getTmbdId = data.dataValues.tmdb_id;
      const tvingId = null; // tving id
      const getType = data.dataValues.type;
      const importfileId = data.dataValues.imported_file_id;
      const createdBy = data.dataValues.created_by ? data.dataValues.created_by : null;
      const updateData = {
        message: "Processing",
        import_status: "in_progress",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.importData.update(updateData, {
        where: { id: data.id },
      });
      console.log(
        `${consoleColors.fg.blue} Processing ${getTmbdId} data-start \n ${consoleColors.reset}`,
      );
      if (getType == "movie" || getType == "tv") {
        // use promise all "Get TMDB details","Get TMDB Image details","Get TMDB Video details","Get TMDB Keyword details"
        let tmdbEnData = {},
          tmdbKoData = {},
          tmdbEnImageData = {},
          //tmdbKoImageData = {},
          tmdbEnVideoData = {},
          //tmdbKoVideoData = {},
          //tmdbEnKeywordData = {},
          //tmdbKoKeywordData = {},
          tmdbEnDataAka = {},
          tmdbKoDataAka = {},
          tmdbEnDataImdb = {},
          tmdbEnCreditsData = {},
          tmdbEnCertificationData = {},
          tmdbKoCertificationData = {},
          tmdbEnTvSeasonsData = {},
          tmdbKoWatchData = {},
          //tmdbKoTvSeasonsData = {},
          tmdbKoTvChannelData = {};

        if (getType == "movie") {
          [
            tmdbEnData,
            tmdbKoData,
            tmdbEnImageData,
            //tmdbKoImageData,
            tmdbEnVideoData,
            //tmdbKoVideoData,
            //tmdbEnKeywordData,
            //tmdbKoKeywordData,
            tmdbEnDataAka,
            tmdbKoDataAka,
            tmdbEnCreditsData,
            tmdbEnCertificationData,
            tmdbKoCertificationData,
            tmdbKoWatchData,
          ] = await Promise.all([
            tmdbService.fetchTitleDetails(getType, getTmbdId, langEn),
            tmdbService.fetchTitleDetails(getType, getTmbdId, langKo),
            tmdbService.fetchMovieImages(getTmbdId, "", null),
            //tmdbService.fetchMovieImages(getTmbdId, "", langKo),
            tmdbService.fetchTitleVideos(getType, getTmbdId, null),
            //tmdbService.fetchTitleVideos(getType, getTmbdId, langKo),
            //tmdbService.fetchTitleKeywords(getType, getTmbdId, langEn),
            //tmdbService.fetchTitleKeywords(getType, getTmbdId, langKo),
            tmdbService.fetchTitleAka(getType, getTmbdId, langEn),
            tmdbService.fetchTitleAka(getType, getTmbdId, langKo),
            tmdbService.fetchTitleCredits(getType, getTmbdId, null, langEn),
            tmdbService.fetchTitleCertification(getType, getTmbdId, langEn),
            tmdbService.fetchTitleCertification(getType, getTmbdId, langKo),
            tmdbService.fetchTitleWatch(getType, getTmbdId, null, langKo),
          ]);
        } else if (getType == "tv") {
          [
            tmdbEnData,
            tmdbKoData,
            //tmdbEnKeywordData,
            //tmdbKoKeywordData,
            tmdbEnDataImdb,
            tmdbEnDataAka,
            tmdbKoDataAka,
            tmdbEnCertificationData,
            tmdbKoCertificationData,
            tmdbEnTvSeasonsData,
            //tmdbKoTvSeasonsData,
            tmdbKoWatchData,
            tmdbKoTvChannelData,
          ] = await Promise.all([
            tmdbService.fetchTitleDetails(getType, getTmbdId, langEn),
            tmdbService.fetchTitleDetails(getType, getTmbdId, langKo),
            //tmdbService.fetchTitleKeywords(getType, getTmbdId, langEn),
            //tmdbService.fetchTitleKeywords(getType, getTmbdId, langKo),
            tmdbService.fetchTitleImdbId(getType, getTmbdId, langEn),
            tmdbService.fetchTitleAka(getType, getTmbdId, langEn),
            tmdbService.fetchTitleAka(getType, getTmbdId, langKo),
            tmdbService.fetchTitleCertification(getType, getTmbdId, langEn),
            tmdbService.fetchTitleCertification(getType, getTmbdId, langKo),
            tmdbService.fetchTvSeasons(getTmbdId, langEn),
            //tmdbService.fetchTvSeasons(getTmbdId, langKo),
            tmdbService.fetchTitleWatch(getType, getTmbdId, null, langKo),
            tmdbService.fetchTvChannels(getTmbdId, langKo),
          ]);
        }
        //console.log("tmdbKoWatchData", tmdbKoWatchData.results.rent);
        //console.log("tmdbKoWatchData", tmdbKoWatchData.results.buy);
        //console.log("tmdbKoWatchData", tmdbKoWatchData.results.stream);
        //console.log("tmdbKoTvChannelData", tmdbKoWatchData.results);
        const getInformations = await model.title.findOne({
          attributes: ["id", "type", "release_date"],
          where: { tmdb_id: getTmbdId, type: getType, record_status: "active" },
        });
        // If TMDB ID already exist
        if (getInformations) {
          const titleId = getInformations.id;
          if (getType == "tv") {
            const updateData = {
              runtime:
                tmdbEnData.results.episode_run_time &&
                tmdbEnData.results.episode_run_time != null &&
                tmdbEnData.results.episode_run_time != "undefined" &&
                tmdbEnData.results.episode_run_time.length > 0 &&
                tmdbEnData.results.episode_run_time[0]
                  ? tmdbEnData.results.episode_run_time[0]
                  : null,
              certification:
                tmdbEnCertificationData.results && tmdbEnCertificationData.results.certification_key
                  ? tmdbEnCertificationData.results.certification_key
                  : null,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            if (
              updateData.certification == null ||
              updateData.certification == "" ||
              updateData.certification == "undefined"
            ) {
              updateData.certification =
                tmdbKoCertificationData.results && tmdbKoCertificationData.results.certification_key
                  ? tmdbKoCertificationData.results.certification_key
                  : null;
            }

            updateData.release_date_to = tmdbEnData.results.release_date_to
              ? tmdbEnData.results.release_date_to
              : tmdbKoData.results.release_date_to
              ? tmdbKoData.results.release_date_to
              : null;
            await model.title.update(updateData, {
              where: { id: titleId },
            });
            recordId = titleId;
            actionDate = updateData.updated_at;
          }

          // Update titleTranslation table for english language
          const getEnTitleTranslation = await model.titleTranslation.findOne({
            attributes: ["id", "name"],
            where: { title_id: titleId, site_language: langEn },
          });

          let titleName = "";

          if (getEnTitleTranslation) {
            const tmdbEnTitle =
              tmdbEnData.results && tmdbEnData.results.title ? tmdbEnData.results.title.trim() : "";
            const tmdbEnAka =
              tmdbEnDataAka &&
              tmdbEnDataAka.results &&
              tmdbEnDataAka.results.all_aka &&
              getType == "movie"
                ? tmdbEnDataAka.results.all_aka
                : "";
            const tmdbEnSummery =
              tmdbEnData.results && tmdbEnData.results.overview ? tmdbEnData.results.overview : "";
            const tmdbEnPlotSummery =
              tmdbEnData.results && tmdbEnData.results.tmdb_plot_summery
                ? tmdbEnData.results.tmdb_plot_summery
                : "";
            const tmdbKoAka =
              tmdbKoDataAka &&
              tmdbKoDataAka.results &&
              tmdbKoDataAka.results.aka &&
              getType == "movie"
                ? tmdbKoDataAka.results.aka
                : "";

            const titleEnTranslationData = {
              name: tmdbEnTitle,
              aka: tmdbEnAka ? tmdbEnAka : tmdbKoAka,
              description: tmdbEnSummery,
              plot_summary: tmdbEnPlotSummery,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.titleTranslation.update(titleEnTranslationData, {
              where: { title_id: titleId, site_language: langEn },
            });
            titleName = tmdbEnTitle;
            actionDate = titleEnTranslationData.updated_at;
          }

          // Update titleTranslation table for korean language
          const getKoTitleTranslation = await model.titleTranslation.findOne({
            attributes: ["id", "name"],
            where: { title_id: titleId, site_language: langKo },
          });
          if (getKoTitleTranslation) {
            const tmdbKoTitle =
              tmdbKoData.results && tmdbKoData.results.title ? tmdbKoData.results.title.trim() : "";
            const tmdbKoAka =
              tmdbKoDataAka &&
              tmdbKoDataAka.results &&
              tmdbKoDataAka.results.aka &&
              getType == "movie"
                ? tmdbKoDataAka.results.aka
                : "";
            const tmdbEnAka =
              tmdbEnDataAka &&
              tmdbEnDataAka.results &&
              tmdbEnDataAka.results.all_aka &&
              getType == "movie"
                ? tmdbEnDataAka.results.all_aka
                : "";
            const tmdbKoSummery =
              tmdbKoData.results && tmdbKoData.results.overview ? tmdbKoData.results.overview : "";
            const tmdbKoPlotSummery =
              tmdbKoData.results && tmdbKoData.results.tmdb_plot_summery
                ? tmdbKoData.results.tmdb_plot_summery
                : "";
            const titleKoTranslationData = {
              name: tmdbKoTitle,
              aka: tmdbEnAka ? tmdbEnAka : tmdbKoAka,
              description: tmdbKoSummery,
              plot_summary: tmdbKoPlotSummery,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.titleTranslation.update(titleKoTranslationData, {
              where: { title_id: titleId, site_language: langKo },
            });
            if (titleName == "") {
              titleName = tmdbKoTitle;
            }
            actionDate = titleKoTranslationData.updated_at;
          }
          if (getType == "movie") {
            // Get background image for english language
            if (
              tmdbEnImageData &&
              tmdbEnImageData.results &&
              tmdbEnImageData.results.bg_image &&
              tmdbEnImageData.results.bg_image.length > 0
            ) {
              await Promise.all([
                importTitleTmdbService.editMovieTmdbImages(
                  tmdbEnImageData.results.bg_image,
                  titleId,
                  "bg_image",
                  createdBy,
                  langEn,
                ),
                importTitleTmdbService.editMovieTmdbImages(
                  tmdbEnImageData.results.bg_image,
                  titleId,
                  "image",
                  createdBy,
                  langEn,
                ),
              ]);
            }

            // Get background image for korean language
            // if (
            //   tmdbKoImageData &&
            //   tmdbKoImageData.results &&
            //   tmdbKoImageData.results.bg_image &&
            //   tmdbKoImageData.results.bg_image.length > 0
            // ) {
            //   await importTitleTmdbService.editMovieTmdbImages(
            //     tmdbKoImageData.results.bg_image,
            //     titleId,
            //     "bg_image",
            //     createdBy,
            //     langKo,
            //   );
            // }

            // Get Poster image for english language
            if (
              tmdbEnImageData &&
              tmdbEnImageData.results &&
              tmdbEnImageData.results.poster_image &&
              tmdbEnImageData.results.poster_image.length > 0
            ) {
              await importTitleTmdbService.editMovieTmdbImages(
                tmdbEnImageData.results.poster_image,
                titleId,
                "poster_image",
                createdBy,
                langEn,
              );
            }

            // Get Poster image for korean language
            // if (
            //   tmdbKoImageData &&
            //   tmdbKoImageData.results &&
            //   tmdbKoImageData.results.posters &&
            //   tmdbKoImageData.results.posters.length > 0
            // ) {
            //   await importTitleTmdbService.editMovieTmdbImages(
            //     tmdbKoImageData.results.posters,
            //     titleId,
            //     "poster_image",
            //     createdBy,
            //     langKo,
            //   );
            // }

            //Insert title video into title video table for english language
            if (tmdbEnVideoData && tmdbEnVideoData.results && tmdbEnVideoData.results.length > 0) {
              await importTitleTmdbService.editMovieTmdbVideos(
                tmdbEnVideoData.results,
                titleId,
                createdBy,
                langEn,
              );
            }

            //Insert title video into title video table for korean language
            // if (tmdbKoVideoData && tmdbKoVideoData.results && tmdbKoVideoData.results.length > 0) {
            //   await importTitleTmdbService.editMovieTmdbVideos(
            //     tmdbKoVideoData.results,
            //     titleId,
            //     createdBy,
            //     langKo,
            //   );
            // }

            // credit data cast & crew
            if (
              tmdbEnCreditsData &&
              tmdbEnCreditsData.results &&
              tmdbEnCreditsData.results.cast.length > 0 &&
              titleId
            ) {
              await Promise.all([
                importTitleTmdbService.editMovieTmdbCast(
                  tmdbEnCreditsData.results.cast,
                  titleId,
                  createdBy,
                  langEn,
                ),
                // importTitleTmdbService.editMovieTmdbCast(
                //   tmdbEnCreditsData.results.cast,
                //   titleId,
                //   createdBy,
                //   langKo,
                // ),
              ]);
            }
            if (
              tmdbEnCreditsData &&
              tmdbEnCreditsData.results &&
              tmdbEnCreditsData.results.crew.length > 0 &&
              titleId
            ) {
              await Promise.all([
                importTitleTmdbService.editMovieTmdbCrew(
                  tmdbEnCreditsData.results.crew,
                  titleId,
                  createdBy,
                  langEn,
                ),
                // importTitleTmdbService.editMovieTmdbCrew(
                //   tmdbEnCreditsData.results.crew,
                //   titleId,
                //   createdBy,
                //   langKo,
                // ),
              ]);
            }
            if (tmdbKoWatchData && tmdbKoWatchData.results && titleId) {
              await Promise.all([
                importTitleTmdbService.addMovieWatch(
                  tmdbKoWatchData.results.rent,
                  titleId,
                  "rent",
                  createdBy,
                  langKo,
                ),
                importTitleTmdbService.addMovieWatch(
                  tmdbKoWatchData.results.buy,
                  titleId,
                  "buy",
                  createdBy,
                  langKo,
                ),
                importTitleTmdbService.addMovieWatch(
                  tmdbKoWatchData.results.stream,
                  titleId,
                  "stream",
                  createdBy,
                  langKo,
                ),
              ]);
            }
            // TMDB MOVIE SERIES DETAILS:
            const collectionId =
              tmdbEnData &&
              tmdbEnData.results &&
              tmdbEnData.results.belongs_to_collection &&
              tmdbEnData.results.belongs_to_collection.id
                ? tmdbEnData.results.belongs_to_collection.id
                : "";
            if (collectionId) {
              await importTitleTmdbService.addMovieSeriesData(collectionId, titleId, createdBy);
            }

            //
            const getTitleNewsKeyword = await model.titleKeyword.findOne({
              where: {
                title_id: titleId,
                keyword_type: "news",
                status: { [Op.ne]: "deleted" },
              },
            });
            //add news keyword if not present
            if (!getTitleNewsKeyword && titleName) {
              const newsKeywordData = {
                title_id: titleId,
                site_language: langEn ? langEn : "en",
                keyword: titleName,
                keyword_type: "news",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
              };
              await model.titleKeyword.create(newsKeywordData);
            }
          }
          if (getType == "tv") {
            //en
            if (
              tmdbEnTvSeasonsData &&
              tmdbEnTvSeasonsData.results &&
              tmdbEnTvSeasonsData.results.length > 0
            ) {
              for (const eachSeason of tmdbEnTvSeasonsData.results) {
                if (eachSeason) {
                  const seasonNumber = eachSeason.season_number;
                  const seasonId = await importTitleTmdbService.addTvTmdbSeason(
                    titleId,
                    getTmbdId,
                    seasonNumber,
                    createdBy,
                    tmdbEnDataAka ? tmdbEnDataAka : tmdbKoDataAka,
                    langEn,
                  );
                  if (seasonId && seasonId != null) {
                    await Promise.all([
                      //add season episode
                      importTitleTmdbService.addTmdbSeasonTvEpisodes(
                        titleId,
                        getTmbdId,
                        seasonId,
                        seasonNumber,
                        createdBy,
                        langEn,
                      ),
                      //add season images
                      importTitleTmdbService.addTmdbSeasonTvImages(
                        titleId,
                        getTmbdId,
                        seasonId,
                        seasonNumber,
                        createdBy,
                        langEn,
                      ),
                      //add season videos
                      importTitleTmdbService.addTmdbSeasonTvVideos(
                        titleId,
                        getTmbdId,
                        seasonId,
                        seasonNumber,
                        createdBy,
                        langEn,
                      ),
                      //add season credits
                      importTitleTmdbService.addTmdbSeasonTvCredits(
                        titleId,
                        getTmbdId,
                        seasonId,
                        seasonNumber,
                        createdBy,
                        langEn,
                      ),
                    ]);

                    //watch
                    if (tmdbKoWatchData && tmdbKoWatchData.results && titleId) {
                      await Promise.all([
                        importTitleTmdbService.addTvWatch(
                          tmdbKoWatchData.results.rent,
                          titleId,
                          "rent",
                          seasonId,
                          createdBy,
                          langKo,
                        ),
                        importTitleTmdbService.addTvWatch(
                          tmdbKoWatchData.results.buy,
                          titleId,
                          "buy",
                          seasonId,
                          createdBy,
                          langKo,
                        ),
                        importTitleTmdbService.addTvWatch(
                          tmdbKoWatchData.results.stream,
                          titleId,
                          "stream",
                          seasonId,
                          createdBy,
                          langKo,
                        ),
                      ]);
                    }
                    //channel
                    if (tmdbKoTvChannelData && tmdbKoTvChannelData.results && titleId) {
                      await importTitleTmdbService.addTvChannels(
                        tmdbKoTvChannelData.results,
                        titleId,
                        seasonId,
                        createdBy,
                        langKo,
                      );
                    }
                    //
                    const getTitleNewsKeyword = await model.titleKeyword.findOne({
                      where: {
                        title_id: titleId,
                        season_id: seasonId,
                        keyword_type: "news",
                        status: { [Op.ne]: "deleted" },
                      },
                    });
                    //add news keyword if not present
                    if (!getTitleNewsKeyword && titleName) {
                      const newsKeywordData = {
                        title_id: titleId,
                        season_id: seasonId,
                        site_language: langEn ? langEn : "en",
                        keyword: titleName,
                        keyword_type: "news",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: createdBy,
                      };
                      await model.titleKeyword.create(newsKeywordData);
                    }
                  }
                }
              }
            }
            //ko
            // if (
            //   tmdbKoTvSeasonsData &&
            //   tmdbKoTvSeasonsData.results &&
            //   tmdbKoTvSeasonsData.results.length > 0
            // ) {
            //   for (const eachSeason of tmdbKoTvSeasonsData.results) {
            //     if (eachSeason) {
            //       const seasonNumber = eachSeason.season_number;
            //       const seasonId = await importTitleTmdbService.addTvTmdbSeason(
            //         titleId,
            //         getTmbdId,
            //         seasonNumber,
            //         createdBy,
            //         tmdbEnDataAka,
            //         langKo,
            //       );
            //       if (seasonId && seasonId != null) {
            //         await Promise.all([
            //           //add season episode
            //           importTitleTmdbService.addTmdbSeasonTvEpisodes(
            //             titleId,
            //             getTmbdId,
            //             seasonId,
            //             seasonNumber,
            //             createdBy,
            //             langKo,
            //           ),
            //           //add season images
            //           importTitleTmdbService.addTmdbSeasonTvImages(
            //             titleId,
            //             getTmbdId,
            //             seasonId,
            //             seasonNumber,
            //             createdBy,
            //             langKo,
            //           ),
            //           //add season videos
            //           importTitleTmdbService.addTmdbSeasonTvVideos(
            //             titleId,
            //             getTmbdId,
            //             seasonId,
            //             seasonNumber,
            //             createdBy,
            //             langKo,
            //           ),
            //           //add season credits
            //           importTitleTmdbService.addTmdbSeasonTvCredits(
            //             titleId,
            //             getTmbdId,
            //             seasonId,
            //             seasonNumber,
            //             createdBy,
            //             langKo,
            //           ),
            //         ]);
            //       }
            //     }
            //   }
            // }
          }
          // Get keyword for english language
          // if (tmdbEnKeywordData.results.keywords.length > 0) {
          //   await importTitleTmdbService.editTitleSearchKeyword(
          //     tmdbEnKeywordData.results.keywords,
          //     titleId,
          //     createdBy,
          //     langEn,
          //   );
          // }

          // Get keyword for korean language
          // if (tmdbKoKeywordData.results.keywords.length > 0) {
          //   // await importTitleTmdbService.editTitleSearchKeyword(
          //   //   tmdbKoKeywordData.results.keywords,
          //   //   titleId,
          //   //   createdBy,
          //   //   langKo,
          //   // );
          // }
          //country
          const countryListEn =
            tmdbEnData.results.production_countries &&
            tmdbEnData.results.production_countries.length > 0
              ? tmdbEnData.results.production_countries
              : [];
          if (countryListEn.length > 0) {
            await importTitleTmdbService.editTitleTmdbCountry(
              countryListEn,
              titleId,
              createdBy,
              langEn,
            );
          }

          //
          //genre tags
          const tmdbGenre =
            tmdbEnData && tmdbEnData.results.genres && tmdbEnData.results.genres.length > 0
              ? tmdbEnData.results.genres
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
                    site_language: langEn,
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
          // const countryListKo =
          //   tmdbKoData.results.production_countries &&
          //   tmdbKoData.results.production_countries.length > 0
          //     ? tmdbKoData.results.production_countries
          //     : [];
          // if (countryListKo.length > 0) {
          //   await importTitleTmdbService.editTitleTmdbCountry(
          //     countryListKo,
          //     titleId,
          //     createdBy,
          //     langKo,
          //   );
          // }
          if (titleId && titleId > 0) {
            const updateData = {
              message: "Success",
              import_status: "complete",
              item_id: titleId,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.importData.update(updateData, {
              where: { id: data.id },
            });

            //search db
            if (titleId && getType) {
              const payload = { list: [{ record_id: titleId, type: getType, action: "edit" }] };
              schedulerJobService.addJobInScheduler(
                "edit title data to search db",
                JSON.stringify(payload),
                "search_db",
                `edit title data in import tmdb data`,
                createdBy,
              );
            }
          } else {
            const updateData = {
              message: "something went wrong with the title id. so it may not update complete data",
              import_status: "failure",
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.importData.update(updateData, {
              where: { id: data.id },
            });
          }
        }
        // If TMDB ID not exist
        else {
          if (
            Object.keys(tmdbEnData.results).length > 0 ||
            Object.keys(tmdbKoData.results).length > 0
          ) {
            const updateData = {
              message: "In Progress",
              import_status: "in_progress",
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.importData.update(updateData, {
              where: { id: data.id },
            });
            const tmdbEnTitle =
              tmdbEnData.results && tmdbEnData.results.title ? tmdbEnData.results.title : "";
            const tmdbEnAka =
              tmdbEnDataAka &&
              tmdbEnDataAka.results &&
              tmdbEnDataAka.results.all_aka &&
              getType == "movie"
                ? tmdbEnDataAka.results.all_aka
                : "";
            const tmdbKoAka =
              tmdbKoDataAka &&
              tmdbKoDataAka.results &&
              tmdbKoDataAka.results.all_aka &&
              getType == "movie"
                ? tmdbKoDataAka.results.all_aka
                : "";

            const tmdbEnSummery =
              tmdbEnData.results && tmdbEnData.results.overview ? tmdbEnData.results.overview : "";
            const tmdbEnPlotSummery =
              tmdbEnData.results && tmdbEnData.results.tmdb_plot_summery
                ? tmdbEnData.results.tmdb_plot_summery
                : "";
            // const tmdbOfficialSite =
            //   tmdbData.results && tmdbData.results.homepage ? tmdbData.results.homepage : "";

            const checkTMDBId = await model.title.findOne({
              attributes: ["id", "tmdb_id"],
              where: {
                type: getType,
                tmdb_id: getTmbdId,
              },
            });
            // Insert data into title table
            let titleId = "";
            let titleName = "";
            if (!checkTMDBId) {
              const whl = true;
              let generatedCode = "";
              while (whl) {
                generatedCode = await generalHelper.uuidv4();
                const isExists = await model.title.findOne({
                  attributes: ["id", "uuid"],
                  where: { uuid: generatedCode },
                });
                if (!isExists) {
                  break;
                }
              }
              let createData = {
                type: getType,
                tmdb_id: getTmbdId,
                tmdb_vote_average: tmdbEnData.results.vote_average
                  ? tmdbEnData.results.vote_average
                  : null,
                release_date: tmdbEnData.results.release_date
                  ? tmdbEnData.results.release_date
                  : null,
                year: tmdbEnData.results.release_date
                  ? await customDateTimeHelper.changeDateFormat(
                      tmdbEnData.results.release_date,
                      "YYYY",
                    )
                  : null,
                uuid: generatedCode ? generatedCode : null,
                runtime: tmdbEnData.results.runtime ? tmdbEnData.results.runtime : null,
                budget: tmdbEnData.results.budget ? tmdbEnData.results.budget : null,
                revenue: tmdbEnData.results.revenue ? tmdbEnData.results.revenue : null,
                popularity: tmdbEnData.results.popularity ? tmdbEnData.results.popularity : null,
                original_title: tmdbEnData.results.original_title
                  ? tmdbEnData.results.original_title
                  : null,
                affiliate_link: tmdbEnData.results.homepage ? tmdbEnData.results.homepage : null,
                tmdb_vote_count: tmdbEnData.results.vote_count
                  ? tmdbEnData.results.vote_count
                  : null,
                certification:
                  tmdbEnCertificationData.results &&
                  tmdbEnCertificationData.results.certification_key
                    ? tmdbEnCertificationData.results.certification_key
                    : null,
                //footfalls: tmdbEnData.results.footfalls ? tmdbEnData.results.footfalls : null,
                language: tmdbEnData.results.original_language
                  ? tmdbEnData.results.original_language
                  : null,
                adult: tmdbEnData.results.adult === true ? 1 : 0,
                //rating: tmdbEnData.results.rating ? tmdbEnData.results.rating : null,
                title_status: tmdbEnData.results.status
                  ? await generalHelper.titleStatusKeyByValue(getType, tmdbEnData.results.status)
                  : null,
                created_by: createdBy,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              if (tvingId) {
                createData.tiving_id = tvingId;
              }
              //
              if (
                createData.certification == null ||
                createData.certification == "" ||
                createData.certification == "undefined"
              ) {
                createData.certification =
                  tmdbKoCertificationData.results &&
                  tmdbKoCertificationData.results.certification_key
                    ? tmdbKoCertificationData.results.certification_key
                    : null;
              }
              if (getType == "movie") {
                createData.imdb_id = tmdbEnData.results.imdb_id ? tmdbEnData.results.imdb_id : null;
              }
              if (getType == "tv") {
                createData.imdb_id =
                  tmdbEnDataImdb.results && tmdbEnDataImdb.results.imdb_id
                    ? tmdbEnDataImdb.results.imdb_id
                    : null;
                createData.runtime =
                  tmdbEnData.results.episode_run_time &&
                  tmdbEnData.results.episode_run_time != null &&
                  tmdbEnData.results.episode_run_time != "undefined" &&
                  tmdbEnData.results.episode_run_time.length > 0 &&
                  tmdbEnData.results.episode_run_time[0]
                    ? tmdbEnData.results.episode_run_time[0]
                    : null;
                createData.release_date_to = tmdbEnData.results.release_date_to
                  ? tmdbEnData.results.release_date_to
                  : tmdbKoData.results.release_date_to
                  ? tmdbKoData.results.release_date_to
                  : null;
              }
              const titleTblInsert = await model.title.create(createData);
              titleId = titleTblInsert && titleTblInsert.id ? titleTblInsert.id : "";
              recordId = titleId;
              actionDate = createData.created_at;
            }

            // Insert english language data into titleTranslations table
            const titleEnTranslationData = {
              title_id: titleId,
              site_language: langEn,
              name: tmdbEnTitle,
              aka: tmdbEnAka ? tmdbEnAka : tmdbKoAka,
              description: tmdbEnSummery,
              plot_summary: tmdbEnPlotSummery,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            titleName = tmdbEnTitle;
            const titleTranslationEnTblInsert = await model.titleTranslation.create(
              titleEnTranslationData,
            );
            const titleTranslationEnId = titleTranslationEnTblInsert.id;
            actionDate = titleEnTranslationData.created_at;

            // Insert korean language data into titleTranslations table
            const tmdbKoTitle =
              tmdbKoData.results && tmdbKoData.results.title ? tmdbKoData.results.title : "";
            // const tmdbKoAka =
            //   tmdbKoDataAka.results && tmdbKoDataAka.results.aka && getType == "movie"
            //     ? tmdbKoDataAka.results.aka
            //     : "";
            // const tmdbEnAka =
            //   tmdbEnDataAka.results && tmdbEnDataAka.results.aka && getType == "movie"
            //     ? tmdbEnDataAka.results.aka
            //     : "";
            const tmdbKoSummery =
              tmdbKoData.results && tmdbKoData.results.overview ? tmdbKoData.results.overview : "";
            const tmdbKoPlotSummery =
              tmdbKoData.results && tmdbKoData.results.tmdb_plot_summery
                ? tmdbKoData.results.tmdb_plot_summery
                : "";
            const titleKoTranslationData = {
              title_id: titleId,
              site_language: langKo,
              name: tmdbKoTitle,
              aka: tmdbEnAka ? tmdbEnAka : tmdbKoAka,
              description: tmdbKoSummery,
              plot_summary: tmdbKoPlotSummery,
              created_by: createdBy,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };

            const titleTranslationKoTblInsert = await model.titleTranslation.create(
              titleKoTranslationData,
            );
            const titleTranslationKoId = titleTranslationKoTblInsert.id;
            actionDate = titleKoTranslationData.created_at;
            //country
            const countryListEn =
              tmdbEnData.results.production_countries &&
              tmdbEnData.results.production_countries.length > 0
                ? tmdbEnData.results.production_countries
                : [];
            if (countryListEn.length > 0) {
              await importTitleTmdbService.addTitleTmdbCountry(
                countryListEn,
                titleId,
                createdBy,
                langEn,
              );
            }
            if (titleName == "") {
              titleName = tmdbKoTitle;
            }
            // const countryListKo =
            //   tmdbKoData.results.production_countries &&
            //   tmdbKoData.results.production_countries.length > 0
            //     ? tmdbKoData.results.production_countries
            //     : [];
            // if (countryListKo.length > 0) {
            //   await importTitleTmdbService.addTitleTmdbCountry(
            //     countryListKo,
            //     titleId,
            //     createdBy,
            //     langKo,
            //   );
            // }
            if (getType == "movie") {
              // Get background image for english language
              if (
                tmdbEnImageData &&
                tmdbEnImageData.results &&
                tmdbEnImageData.results.bg_image &&
                tmdbEnImageData.results.bg_image.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.addMovieTmdbImages(
                    tmdbEnImageData.results.bg_image,
                    titleId,
                    "bg_image",
                    createdBy,
                    langEn,
                  ),
                  importTitleTmdbService.addMovieTmdbImages(
                    tmdbEnImageData.results.bg_image,
                    titleId,
                    "image",
                    createdBy,
                    langEn,
                  ),
                ]);
              }
              // Get background image for korean language
              // if (
              //   tmdbKoImageData &&
              //   tmdbKoImageData.results &&
              //   tmdbKoImageData.results.backdrops &&
              //   tmdbKoImageData.results.backdrops.length > 0 &&
              //   titleId
              // ) {
              //   await importTitleTmdbService.addMovieTmdbImages(
              //     tmdbKoImageData.results.backdrops,
              //     titleId,
              //     "bg_image",
              //     createdBy,
              //     langKo,
              //   );
              // }
              // Get Poster image for english language
              if (
                tmdbEnImageData &&
                tmdbEnImageData.results &&
                tmdbEnImageData.results.poster_image &&
                tmdbEnImageData.results.poster_image.length > 0 &&
                titleId
              ) {
                await importTitleTmdbService.addMovieTmdbImages(
                  tmdbEnImageData.results.poster_image,
                  titleId,
                  "poster_image",
                  createdBy,
                  langEn,
                );
              }
              // Get Poster image for korean language
              // if (
              //   tmdbKoImageData &&
              //   tmdbKoImageData.results &&
              //   tmdbKoImageData.results.posters &&
              //   tmdbKoImageData.results.posters.length > 0 &&
              //   titleId
              // ) {
              //   await importTitleTmdbService.addMovieTmdbImages(
              //     tmdbKoImageData.results.posters,
              //     titleId,
              //     "poster_image",
              //     createdBy,
              //     langKo,
              //   );
              // }

              //Insert title video into title video table for english language
              if (
                tmdbEnVideoData &&
                tmdbEnVideoData.results &&
                tmdbEnVideoData.results.length > 0 &&
                titleId
              ) {
                await importTitleTmdbService.addMovieTmdbVideos(
                  tmdbEnVideoData.results,
                  titleId,
                  createdBy,
                  langEn,
                );
              }

              //Insert title video into title video table for korean language
              // if (
              //   tmdbKoVideoData &&
              //   tmdbKoVideoData.results &&
              //   tmdbKoVideoData.results.length > 0 &&
              //   titleId
              // ) {
              //   await importTitleTmdbService.addMovieTmdbVideos(
              //     tmdbKoVideoData.results,
              //     titleId,
              //     createdBy,
              //     langKo,
              //   );
              // }
              // credit data cast & crew
              if (
                tmdbEnCreditsData &&
                tmdbEnCreditsData.results &&
                tmdbEnCreditsData.results.cast.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.addMovieTmdbCast(
                    tmdbEnCreditsData.results.cast,
                    titleId,
                    createdBy,
                    langEn,
                  ),
                  // importTitleTmdbService.addMovieTmdbCast(
                  //   tmdbEnCreditsData.results.cast,
                  //   titleId,
                  //   createdBy,
                  //   langKo,
                  // ),
                ]);
              }
              if (
                tmdbEnCreditsData &&
                tmdbEnCreditsData.results &&
                tmdbEnCreditsData.results.crew.length > 0 &&
                titleId
              ) {
                await Promise.all([
                  importTitleTmdbService.addMovieTmdbCrew(
                    tmdbEnCreditsData.results.crew,
                    titleId,
                    createdBy,
                    langEn,
                  ),
                  // importTitleTmdbService.addMovieTmdbCrew(
                  //   tmdbEnCreditsData.results.crew,
                  //   titleId,
                  //   createdBy,
                  //   langKo,
                  // ),
                ]);
              }
              //watch data
              if (tmdbKoWatchData && tmdbKoWatchData.results && titleId) {
                await Promise.all([
                  importTitleTmdbService.addMovieWatch(
                    tmdbKoWatchData.results.rent,
                    titleId,
                    "rent",
                    createdBy,
                    langKo,
                  ),
                  importTitleTmdbService.addMovieWatch(
                    tmdbKoWatchData.results.buy,
                    titleId,
                    "buy",
                    createdBy,
                    langKo,
                  ),
                  importTitleTmdbService.addMovieWatch(
                    tmdbKoWatchData.results.stream,
                    titleId,
                    "stream",
                    createdBy,
                    langKo,
                  ),
                ]);
              }
              // TMDB MOVIE SERIES DETAILS:
              const collectionId =
                tmdbEnData &&
                tmdbEnData.results &&
                tmdbEnData.results.belongs_to_collection &&
                tmdbEnData.results.belongs_to_collection.id
                  ? tmdbEnData.results.belongs_to_collection.id
                  : "";
              if (collectionId) {
                await importTitleTmdbService.addMovieSeriesData(collectionId, titleId, createdBy);
              }
              //
              const getTitleNewsKeyword = await model.titleKeyword.findOne({
                where: {
                  title_id: titleId,
                  keyword_type: "news",
                  status: { [Op.ne]: "deleted" },
                },
              });
              //add news keyword if not present
              if (!getTitleNewsKeyword && titleName) {
                const newsKeywordData = {
                  title_id: titleId,
                  site_language: langEn ? langEn : "en",
                  keyword: titleName,
                  keyword_type: "news",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: createdBy,
                };
                await model.titleKeyword.create(newsKeywordData);
                actionDate = newsKeywordData.created_at;
              }
            }
            if (getType == "tv") {
              //en
              if (
                tmdbEnTvSeasonsData &&
                tmdbEnTvSeasonsData.results &&
                tmdbEnTvSeasonsData.results.length > 0
              ) {
                for (const eachSeason of tmdbEnTvSeasonsData.results) {
                  if (eachSeason) {
                    const seasonNumber = eachSeason.season_number;
                    const seasonId = await importTitleTmdbService.addTvTmdbSeason(
                      titleId,
                      getTmbdId,
                      seasonNumber,
                      createdBy,
                      tmdbEnDataAka ? tmdbEnDataAka : tmdbKoDataAka,
                      langEn,
                    );
                    if (seasonId && seasonId != null) {
                      await Promise.all([
                        //add season episode
                        importTitleTmdbService.addTmdbSeasonTvEpisodes(
                          titleId,
                          getTmbdId,
                          seasonId,
                          seasonNumber,
                          createdBy,
                          langEn,
                        ),
                        //add season images
                        importTitleTmdbService.addTmdbSeasonTvImages(
                          titleId,
                          getTmbdId,
                          seasonId,
                          seasonNumber,
                          createdBy,
                          langEn,
                        ),
                        //add season videos
                        importTitleTmdbService.addTmdbSeasonTvVideos(
                          titleId,
                          getTmbdId,
                          seasonId,
                          seasonNumber,
                          createdBy,
                          langEn,
                        ),
                        //add season credits
                        importTitleTmdbService.addTmdbSeasonTvCredits(
                          titleId,
                          getTmbdId,
                          seasonId,
                          seasonNumber,
                          createdBy,
                          langEn,
                        ),
                      ]);

                      //watch
                      if (tmdbKoWatchData && tmdbKoWatchData.results && titleId) {
                        await Promise.all([
                          importTitleTmdbService.addTvWatch(
                            tmdbKoWatchData.results.rent,
                            titleId,
                            "rent",
                            seasonId,
                            createdBy,
                            langKo,
                          ),
                          importTitleTmdbService.addTvWatch(
                            tmdbKoWatchData.results.buy,
                            titleId,
                            "buy",
                            seasonId,
                            createdBy,
                            langKo,
                          ),
                          importTitleTmdbService.addTvWatch(
                            tmdbKoWatchData.results.stream,
                            titleId,
                            "stream",
                            seasonId,
                            createdBy,
                            langKo,
                          ),
                        ]);
                      }
                      //channel
                      if (tmdbKoTvChannelData && tmdbKoTvChannelData.results && titleId) {
                        await importTitleTmdbService.addTvChannels(
                          tmdbKoTvChannelData.results,
                          titleId,
                          seasonId,
                          createdBy,
                          langKo,
                        );
                      }
                      //
                      const getTitleNewsKeyword = await model.titleKeyword.findOne({
                        where: {
                          title_id: titleId,
                          season_id: seasonId,
                          keyword_type: "news",
                          status: { [Op.ne]: "deleted" },
                        },
                      });
                      //add news keyword if not present
                      if (!getTitleNewsKeyword && titleName) {
                        const newsKeywordData = {
                          title_id: titleId,
                          season_id: seasonId,
                          site_language: langEn ? langEn : "en",
                          keyword: titleName,
                          keyword_type: "news",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: createdBy,
                        };
                        await model.titleKeyword.create(newsKeywordData);
                        actionDate = newsKeywordData.created_at;
                      }
                    }
                  }
                }
              }
              //ko
              // if (
              //   tmdbKoTvSeasonsData &&
              //   tmdbKoTvSeasonsData.results &&
              //   tmdbKoTvSeasonsData.results.length > 0
              // ) {
              //   for (const eachSeason of tmdbKoTvSeasonsData.results) {
              //     if (eachSeason) {
              //       const seasonNumber = eachSeason.season_number;
              //       const seasonId = await importTitleTmdbService.addTvTmdbSeason(
              //         titleId,
              //         getTmbdId,
              //         seasonNumber,
              //         createdBy,
              //         tmdbEnDataAka,
              //         langKo,
              //       );
              //       if (seasonId && seasonId != null) {
              //         await Promise.all([
              //           //add season episode
              //           importTitleTmdbService.addTmdbSeasonTvEpisodes(
              //             titleId,
              //             getTmbdId,
              //             seasonId,
              //             seasonNumber,
              //             createdBy,
              //             langKo,
              //           ),
              //           //add season images
              //           importTitleTmdbService.addTmdbSeasonTvImages(
              //             titleId,
              //             getTmbdId,
              //             seasonId,
              //             seasonNumber,
              //             createdBy,
              //             langKo,
              //           ),
              //           //add season videos
              //           importTitleTmdbService.addTmdbSeasonTvVideos(
              //             titleId,
              //             getTmbdId,
              //             seasonId,
              //             seasonNumber,
              //             createdBy,
              //             langKo,
              //           ),
              //           //add season credits
              //           importTitleTmdbService.addTmdbSeasonTvCredits(
              //             titleId,
              //             getTmbdId,
              //             seasonId,
              //             seasonNumber,
              //             createdBy,
              //             langKo,
              //           ),
              //         ]);
              //       }
              //     }
              //   }
              // }
            }

            //genre tags
            const tmdbGenre =
              tmdbEnData && tmdbEnData.results.genres && tmdbEnData.results.genres.length > 0
                ? tmdbEnData.results.genres
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
                      site_language: langEn,
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

            //check have keyword for english language
            // if (
            //   tmdbEnKeywordData &&
            //   tmdbEnKeywordData.results &&
            //   tmdbEnKeywordData.results.keywords != null &&
            //   tmdbEnKeywordData.results.keywords.length > 0 &&
            //   titleId
            // ) {
            //   await importTitleTmdbService.addTitleSearchKeyword(
            //     tmdbEnKeywordData.results.keywords,
            //     titleId,
            //     createdBy,
            //     langEn,
            //   );
            // }

            //check have keyword for korean language
            // if (
            //   tmdbKoKeywordData &&
            //   tmdbKoKeywordData.results &&
            //   tmdbKoKeywordData.results.keyword_type != null &&
            //   tmdbKoKeywordData.results.keywords.length > 0 &&
            //   titleId
            // ) {
            //   await importTitleTmdbService.addTitleSearchKeyword(
            //     tmdbKoKeywordData.results.keywords,
            //     titleId,
            //     createdBy,
            //     langKo,
            //   );
            // }
            // update import data log table
            if (titleId && (titleTranslationEnId || titleTranslationKoId)) {
              const updateData = {
                message: "Success",
                import_status: "complete",
                item_id: titleId,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              await model.importData.update(updateData, {
                where: { id: data.id },
              });
              //search db
              if (titleId && getType) {
                const payload = { list: [{ record_id: titleId, type: getType, action: "edit" }] };
                schedulerJobService.addJobInScheduler(
                  "edit title data to search db",
                  JSON.stringify(payload),
                  "search_db",
                  `edit title data in import tmdb data`,
                  createdBy,
                );
              }
            } else {
              const updateData = {
                message:
                  "something went wrong with the title id & title translation id so it may not update complete data",
                import_status: "failure",
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              await model.importData.update(updateData, {
                where: { id: data.id },
              });
            }
          } else {
            const updateData = {
              message: "tmdb id does not exsist",
              import_status: "failure",
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.importData.update(updateData, {
              where: { id: data.id },
            });
          }
        }
      } else if (getType == "people") {
        let tmdbEnPeopleData = {},
          tmdbKoPeopleData = {},
          tmdbEnPeopleImageData = {};
        let payloadPeopleList = [];
        [tmdbEnPeopleData, tmdbKoPeopleData, tmdbEnPeopleImageData] = await Promise.all([
          tmdbService.fetchPeopleDetails(getTmbdId, langEn),
          tmdbService.fetchPeopleDetails(getTmbdId, langKo),
          tmdbService.fetchPeopleImages(getTmbdId, langEn),
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
          const createPeopleData = {
            tmdb_id: getTmbdId,
            //uuid: await generalHelper.uuidv4(),
            //created_by: createdBy,
            //created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          const peopleTransData = {};
          const peopleTransDataKo = {};
          let peopleId = 0;
          let departmentName = null;
          let placeOfBirth = null;
          if (
            tmdbEnPeopleData &&
            tmdbEnPeopleData.results &&
            tmdbEnPeopleData.results != null &&
            tmdbEnPeopleData.results != "undefined"
          ) {
            let gender = null;
            if (tmdbEnPeopleData.results.gender && tmdbEnPeopleData.results.gender == 2) {
              gender = "male";
            }
            if (tmdbEnPeopleData.results.gender && tmdbEnPeopleData.results.gender == 1) {
              gender = "female";
            }

            peopleTransData.name = tmdbEnPeopleData.results.people_name
              ? tmdbEnPeopleData.results.people_name.trim()
              : "";
            peopleTransData.description = tmdbEnPeopleData.results.biography
              ? tmdbEnPeopleData.results.biography
              : null;
            peopleTransData.known_for = tmdbEnPeopleData.results.aka
              ? tmdbEnPeopleData.results.aka
              : null;

            createPeopleData.gender = gender;
            createPeopleData.poster = tmdbEnPeopleData.results.profile_image
              ? tmdbEnPeopleData.results.profile_image
              : "";
            createPeopleData.birth_date = tmdbEnPeopleData.results.birth_day
              ? tmdbEnPeopleData.results.birth_day
              : null;
            createPeopleData.imdb_id = tmdbEnPeopleData.results.imdb_id
              ? tmdbEnPeopleData.results.imdb_id
              : null;
            createPeopleData.official_site = tmdbEnPeopleData.results.homepage
              ? tmdbEnPeopleData.results.homepage
              : null;
            createPeopleData.death_date = tmdbEnPeopleData.results.death_day
              ? tmdbEnPeopleData.results.death_day
              : null;
            createPeopleData.adult =
              tmdbEnPeopleData.results.adult && tmdbEnPeopleData.results.adult === true ? 1 : 0;
            createPeopleData.popularity = tmdbEnPeopleData.results.popularity
              ? tmdbEnPeopleData.results.popularity
              : null;
            departmentName = tmdbEnPeopleData.results.role_name;
            placeOfBirth = tmdbEnPeopleData.results.place_of_birth;
          }

          if (
            tmdbKoPeopleData &&
            tmdbKoPeopleData.results &&
            tmdbKoPeopleData.results != null &&
            tmdbKoPeopleData.results != "undefined"
          ) {
            let gender = null;
            if (tmdbKoPeopleData.results.gender && tmdbKoPeopleData.results.gender == 2) {
              gender = "male";
            }
            if (tmdbKoPeopleData.results.gender && tmdbKoPeopleData.results.gender == 1) {
              gender = "female";
            }
            if (!createPeopleData.gender) createPeopleData.gender = gender;
            if (!createPeopleData.birth_date)
              createPeopleData.birth_date = tmdbKoPeopleData.results.birth_day
                ? tmdbKoPeopleData.results.birth_day
                : null;
            if (!createPeopleData.imdb_id)
              createPeopleData.imdb_id = tmdbKoPeopleData.results.imdb_id
                ? tmdbKoPeopleData.results.imdb_id
                : null;
            if (!createPeopleData.official_site)
              createPeopleData.official_site = tmdbKoPeopleData.results.homepage
                ? tmdbKoPeopleData.results.homepage
                : null;
            if (!createPeopleData.death_date)
              createPeopleData.death_date = tmdbKoPeopleData.results.death_day
                ? tmdbKoPeopleData.results.death_day
                : null;
            if (!createPeopleData.adult)
              createPeopleData.adult =
                tmdbKoPeopleData.results.adult && tmdbKoPeopleData.results.adult === true ? 1 : 0;
            if (!createPeopleData.popularity)
              createPeopleData.popularity = tmdbKoPeopleData.results.popularity
                ? tmdbKoPeopleData.results.popularity
                : null;
            if (!departmentName) departmentName = tmdbKoPeopleData.results.role_name;
            if (!placeOfBirth) placeOfBirth = tmdbKoPeopleData.results.place_of_birth;

            if (!createPeopleData.poster)
              createPeopleData.poster = tmdbKoPeopleData.results.profile_image
                ? tmdbKoPeopleData.results.profile_image
                : "";

            peopleTransDataKo.name = tmdbKoPeopleData.results.people_name
              ? tmdbKoPeopleData.results.people_name.trim()
              : "";
            peopleTransDataKo.description = tmdbKoPeopleData.results.biography
              ? tmdbKoPeopleData.results.biography
              : null;
            peopleTransDataKo.known_for = tmdbKoPeopleData.results.aka
              ? tmdbKoPeopleData.results.aka
              : null;
          }

          const getPeople = await model.people.findOne({
            attributes: ["id"],
            where: { tmdb_id: getTmbdId, status: { [Op.ne]: "deleted" } },
            include: [
              {
                model: model.peopleTranslation,
                left: true,
                where: {
                  [Op.or]: [{ name: peopleTransData.name }, { name: peopleTransDataKo.name }],
                  status: { [Op.ne]: "deleted" },
                },
              },
            ],
          });

          if (getPeople) {
            peopleId = getPeople.id ? getPeople.id : 0;
            const updateData = {
              message: "Success",
              import_status: "complete",
              item_id: peopleId ? peopleId : null,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.importData.update(updateData, {
              where: { id: data.id },
            });
            console.log(
              `${consoleColors.fg.blue} Processing ${getTmbdId} data-end \n ${consoleColors.reset}`,
            );
          } else {
            createPeopleData.uuid = await generalHelper.uuidv4();
            createPeopleData.created_by = createdBy;
            createPeopleData.created_at = await customDateTimeHelper.getCurrentDateTime();

            const createPeople = await model.people.create(createPeopleData);
            if (createPeople && createPeople.id) {
              peopleId = createPeople.id;
              payloadPeopleList.push({
                record_id: peopleId,
                type: "people",
                action: "add",
              });
              recordId = peopleId;
              actionDate = createPeople.created_at;

              peopleTransData.people_id = createPeople.id;
              peopleTransData.created_by = createdBy;
              peopleTransData.created_at = await customDateTimeHelper.getCurrentDateTime();
              peopleTransData.site_language = langEn;

              peopleTransDataKo.people_id = createPeople.id;
              peopleTransDataKo.created_by = createdBy;
              peopleTransDataKo.created_at = await customDateTimeHelper.getCurrentDateTime();
              peopleTransDataKo.site_language = langKo;

              //await model.peopleTranslation.create(peopleTransData);
              await model.peopleTranslation.bulkCreate([peopleTransData, peopleTransDataKo]);

              actionDate = peopleTransData.created_at;
              actionDate = peopleTransDataKo.created_at;

              // adding image details to the people image table
              if (createPeopleData.poster) {
                const fileName = createPeopleData.poster.substring(
                  createPeopleData.poster.lastIndexOf("/") + 1,
                );
                const getLastOrder = await model.peopleImages.max("list_order", {
                  where: {
                    people_id: createPeople.id,
                    site_language: langEn,
                    image_category: "poster_image",
                  },
                });

                const fileExtension = await customFileHelper.getFileExtByFileName(
                  createPeopleData.poster,
                );
                const peoplePosterImageData = {
                  original_name: fileName ? fileName : null,
                  file_name: fileName ? fileName : null,
                  path: createPeopleData.poster ? createPeopleData.poster : null,
                  file_extension: fileExtension ? fileExtension : null,
                  people_id: createPeople.id,
                  source: "tmdb",
                  list_order: getLastOrder ? getLastOrder + 1 : 1,
                  image_category: "poster_image",
                  is_main_poster: "y",
                  site_language: langEn,
                  created_by: createdBy,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                };
                await model.peopleImages.create(peoplePosterImageData);
                actionDate = peoplePosterImageData.created_at;
              }
              //adding more images
              if (
                tmdbEnPeopleImageData &&
                tmdbEnPeopleImageData.results &&
                tmdbEnPeopleImageData.results.images &&
                tmdbEnPeopleImageData.results.images.length > 0
              ) {
                for (const eachImage of tmdbEnPeopleImageData.results.images) {
                  const getLastOrder = await model.peopleImages.max("list_order", {
                    where: {
                      people_id: createPeople.id,
                      site_language: langEn,
                      image_category: "poster_image",
                    },
                  });
                  const peoplePosterImageData = {
                    original_name: eachImage.originalname ? eachImage.originalname : null,
                    file_name: eachImage.filename ? eachImage.filename : null,
                    path: eachImage.path ? eachImage.path : null,
                    file_extension: eachImage.file_extension ? eachImage.file_extension : null,
                    people_id: createPeople.id,
                    source: "tmdb",
                    list_order: getLastOrder ? getLastOrder + 1 : 1,
                    image_category: "poster_image",
                    is_main_poster: "n",
                    site_language: langEn,
                    created_by: createdBy,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                  };
                  await model.peopleImages.create(peoplePosterImageData);
                  actionDate = peoplePosterImageData.created_at;
                }
              }
              //add job details
              if (departmentName) {
                await importTitleTmdbService.addPeopleJobs(
                  departmentName,
                  peopleId,
                  createdBy,
                  langEn,
                );
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
              //
              // update import data log table
              const updateData = {
                message: "Success",
                import_status: "complete",
                item_id: peopleId ? peopleId : null,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              await model.importData.update(updateData, {
                where: { id: data.id },
              });
              console.log(
                `${consoleColors.fg.blue} Processing ${getTmbdId} data-end \n ${consoleColors.reset}`,
              );
            } else {
              const updateData = {
                message: "error while creating people",
                import_status: "failed",
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              await model.importData.update(updateData, {
                where: { id: data.id },
              });
              console.log(
                `${consoleColors.fg.red} Processing ${getTmbdId} data-error \n ${consoleColors.reset}`,
              );
            }
          }
        }

        if (payloadPeopleList.length > 0) {
          const payloadPeople = {
            list: payloadPeopleList,
          };
          schedulerJobService.addJobInScheduler(
            "add people data to search db",
            JSON.stringify(payloadPeople),
            "search_db",
            `add people in import tmdb data`,
            createdBy,
          );
        }
      }
      // update 'edb_imported_files' table
      if (getFileId != "" && getFileId != importfileId) {
        // update edb_imported_files table by id
        const updateFileTblData = {
          upload_status: "completed",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.importFiles.update(updateFileTblData, {
          where: { id: getFileId },
        });
        console.log(
          `${consoleColors.fg.green} Processing quee import data completed \n ${consoleColors.reset}`,
        );
      }
      getFileId = importfileId;
      if (getLastItemValue == getFileId) {
        // update edb_imported_files table by id
        const updateFileTblData = {
          upload_status: "completed",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.importFiles.update(updateFileTblData, {
          where: { id: getFileId },
        });
        console.log(
          `${consoleColors.fg.blue} Processing quee import data completed \n ${consoleColors.reset}`,
        );
      }

      // service add for update data in edb_edits table
      if (recordId && getType)
        await titleService.titleDataAddEditInEditTbl(recordId, getType, createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
