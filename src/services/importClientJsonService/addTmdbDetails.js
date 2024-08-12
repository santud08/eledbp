import model from "../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, importTitleTmdbService, titleService } from "../../services/index.js";
import { Sequelize } from "sequelize";

export const addTmdbDetails = async (getData) => {
  try {
    const getType = getData.type;
    const getTmbdId = getData.tmdb_id;
    const titleId = getData.title_id;
    const titleName = getData.title_name;
    const langEn = getData.lang_en;
    const langKo = getData.lang_ko;
    const createdBy = getData.created_by;
    const synopsis = getData.synopsis;
    const channelDetails = getData.channel ? getData.channel : "";
    const collectionId = getData.collectionId ? getData.collectionId : "";
    let actionDate = "";
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
        tmdbKoWatchData = {};
      //tmdbKoTvSeasonsData = {},
      //tmdbKoTvChannelData = {};

      // calling external TMDB API for additional details
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
          //   tmdbService.fetchTitleKeywords(getType, getTmbdId, langEn),
          //   tmdbService.fetchTitleKeywords(getType, getTmbdId, langKo),
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
          //tmdbKoTvChannelData,
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
          //tmdbService.fetchTvChannels(getTmbdId, langKo),
        ]);
      }

      // Updating the title with the TMDB details
      const getInformations = await model.title.findOne({
        attributes: ["id", "type", "release_date"],
        where: { id: titleId, tmdb_id: getTmbdId, type: getType, record_status: "active" },
      });
      // const keyLength =
      //   tmdbEnData && tmdbEnData.results ? Object.keys(tmdbEnData.results).length : 0;
      // If TMDB ID already exist
      if (getInformations) {
        let updateData = {
          type: getType,
          tmdb_id: getTmbdId,
          tmdb_vote_average: tmdbEnData.results.vote_average
            ? tmdbEnData.results.vote_average
            : null,
          release_date: tmdbEnData.results.release_date ? tmdbEnData.results.release_date : null,
          year: tmdbEnData.results.release_date
            ? await customDateTimeHelper.changeDateFormat(tmdbEnData.results.release_date, "YYYY")
            : null,
          //     uuid: generatedCode ? generatedCode : null,
          budget: tmdbEnData.results.budget ? tmdbEnData.results.budget : null,
          revenue: tmdbEnData.results.revenue ? tmdbEnData.results.revenue : null,
          popularity: tmdbEnData.results.popularity ? tmdbEnData.results.popularity : null,
          original_title: tmdbEnData.results.original_title
            ? tmdbEnData.results.original_title
            : null,
          affiliate_link: tmdbEnData.results.homepage ? tmdbEnData.results.homepage : null,
          tmdb_vote_count: tmdbEnData.results.vote_count ? tmdbEnData.results.vote_count : null,
          certification:
            tmdbEnCertificationData.results && tmdbEnCertificationData.results.certification_key
              ? tmdbEnCertificationData.results.certification_key
              : null,
          footfalls: tmdbEnData.results.footfalls
            ? tmdbEnData.results.footfalls
            : getData.footfalls,
          language: tmdbEnData.results.original_language
            ? tmdbEnData.results.original_language
            : null,
          adult: tmdbEnData.results.adult === true ? 1 : 0,
          rating: tmdbEnData.results.rating ? tmdbEnData.results.rating : getData.rating,
          title_status: tmdbEnData.results.status
            ? await generalHelper.titleStatusKeyByValue(getType, tmdbEnData.results.status)
            : null,
          created_by: createdBy,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
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
        if (getType == "movie") {
          updateData.imdb_id =
            tmdbEnData && tmdbEnData.results && tmdbEnData.results.imdb_id
              ? tmdbEnData.results.imdb_id
              : null;
          updateData.runtime =
            tmdbEnData && tmdbEnData.results && tmdbEnData.results.runtime
              ? tmdbEnData.results.runtime
              : null;
        }
        if (getType == "tv") {
          updateData.imdb_id =
            tmdbEnDataImdb.results && tmdbEnDataImdb.results.imdb_id
              ? tmdbEnDataImdb.results.imdb_id
              : null;
          updateData.runtime =
            tmdbEnData.results.episode_run_time &&
            tmdbEnData.results.episode_run_time != null &&
            tmdbEnData.results.episode_run_time != "undefined" &&
            tmdbEnData.results.episode_run_time.length > 0 &&
            tmdbEnData.results.episode_run_time[0]
              ? tmdbEnData.results.episode_run_time[0]
              : null;
          updateData.release_date_to = tmdbEnData.results.release_date_to
            ? tmdbEnData.results.release_date_to
            : tmdbKoData.results.release_date_to
            ? tmdbKoData.results.release_date_to
            : null;
        }
        await model.title.update(updateData, {
          where: { id: titleId },
        });
        actionDate = updateData.updated_at;

        // Update titleTranslation table for english language
        const getEnTitleTranslation = await model.titleTranslation.findOne({
          attributes: ["id", "name"],
          where: { title_id: titleId, site_language: langEn },
        });
        if (getEnTitleTranslation) {
          //   const existingName =
          //     getEnTitleTranslation && getEnTitleTranslation.name ? getEnTitleTranslation.name : "";
          //   const tmdbEnTitle =
          // tmdbEnData.results && tmdbEnData.results.title ? tmdbEnData.results.title.trim() : "";
          const tmdbEnAka =
            tmdbEnDataAka &&
            tmdbEnDataAka.results &&
            tmdbEnDataAka.results.all_aka &&
            getType == "movie"
              ? tmdbEnDataAka.results.all_aka
              : null;
          const tmdbKoAka =
            tmdbKoDataAka &&
            tmdbKoDataAka.results &&
            tmdbKoDataAka.results.all_aka &&
            getType == "movie"
              ? tmdbKoDataAka.results.all_aka
              : null;
          const tmdbEnSummery =
            tmdbEnData.results && tmdbEnData.results.overview ? tmdbEnData.results.overview : null;
          const tmdbEnPlotSummery =
            tmdbEnData.results && tmdbEnData.results.tmdb_plot_summery
              ? tmdbEnData.results.tmdb_plot_summery
              : null;
          const titleEnTranslationData = {
            // name: existingName ? existingName : tmdbEnTitle,
            aka: tmdbEnAka ? tmdbEnAka : tmdbKoAka,
            description: tmdbEnSummery,
            plot_summary: tmdbEnPlotSummery
              ? tmdbEnPlotSummery
              : synopsis && getType == "movie"
              ? synopsis
              : null,
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          await model.titleTranslation.update(titleEnTranslationData, {
            where: { title_id: titleId, site_language: langEn },
          });
          actionDate = titleEnTranslationData.updated_at;
        }

        // Update titleTranslation table for korean language
        const getKoTitleTranslation = await model.titleTranslation.findOne({
          attributes: ["id", "name"],
          where: { title_id: titleId, site_language: langKo },
        });
        if (getKoTitleTranslation) {
          //   const existingName =
          // getEnTitleTranslation && getEnTitleTranslation.name ? getEnTitleTranslation.name : "";
          //   const tmdbKoTitle =
          // tmdbKoData.results && tmdbKoData.results.title ? tmdbKoData.results.title.trim() : "";
          // const tmdbKoAka =
          //   tmdbKoDataAka.results && tmdbKoDataAka.results.aka && getType == "movie"
          //     ? tmdbKoDataAka.results.aka
          //     : "";
          const tmdbEnAka =
            tmdbEnDataAka.results && tmdbEnDataAka.results.all_aka && getType == "movie"
              ? tmdbEnDataAka.results.all_aka
              : null;
          const tmdbKoSummery =
            tmdbKoData.results && tmdbKoData.results.overview ? tmdbKoData.results.overview : null;
          const tmdbKoPlotSummery =
            tmdbKoData.results && tmdbKoData.results.tmdb_plot_summery && getType == "movie"
              ? tmdbKoData.results.tmdb_plot_summery
              : null;
          const titleKoTranslationData = {
            // name: existingName ? existingName : tmdbKoTitle,
            aka: tmdbEnAka,
            description: tmdbKoSummery,
            plot_summary: tmdbKoPlotSummery
              ? tmdbKoPlotSummery
              : synopsis && getType == "movie"
              ? synopsis
              : null,
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          await model.titleTranslation.update(titleKoTranslationData, {
            where: { title_id: titleId, site_language: langKo },
          });
          actionDate = titleKoTranslationData.updated_at;
        }
        // Media, Watch Section Update for movies
        if (getType == "movie") {
          const [
            findImage,
            findVideo,
            getCreditableInformations,
            findWatch,
            getNewsKeywordsInformations,
          ] = await Promise.all([
            model.titleImage.findAll({
              where: {
                title_id: titleId,
                status: "active",
              },
            }),
            model.video.findAll({
              where: {
                video_for: "title",
                title_id: titleId,
                status: "active",
              },
            }),
            model.creditable.findAll({
              attributes: ["people_id", "department", "job"],
              where: {
                creditable_id: titleId,
                creditable_type: "title",
                status: "active",
              },
            }),
            model.titleWatchOn.findAll({
              where: {
                title_id: titleId,
                status: "active",
              },
            }),
            model.titleKeyword.findAll({
              attributes: ["id"],
              where: {
                title_id: titleId,
                status: "active",
                keyword_type: "news",
              },
            }),
          ]);
          // check have any data in Keyword-News table
          if (getNewsKeywordsInformations.length == 0) {
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

          // Get background image for english language
          if (
            findImage.length == 0 &&
            tmdbEnImageData &&
            tmdbEnImageData.results &&
            tmdbEnImageData.results.bg_image &&
            tmdbEnImageData.results.bg_image.length > 0
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
          //   tmdbKoImageData.results.backdrops.length > 0
          // ) {
          //   await importTitleTmdbService.editMovieTmdbImages(
          //     tmdbKoImageData.results.backdrops,
          //     titleId,
          //     "bg_image",
          //     createdBy,
          //     langKo,
          //   );
          // }

          // Get Poster image for english language
          if (
            findImage.length == 0 &&
            tmdbEnImageData &&
            tmdbEnImageData.results &&
            tmdbEnImageData.results.poster_image &&
            tmdbEnImageData.results.poster_image.length > 0
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
          // const findVideo = await model.video.findAll({
          //   where: {
          //     title_id: titleId,
          //     status: "active",
          //   },
          // });
          //Insert title video into title video table for english language
          if (
            findVideo.length == 0 &&
            tmdbEnVideoData &&
            tmdbEnVideoData.results &&
            tmdbEnVideoData.results.length > 0
          ) {
            await importTitleTmdbService.addMovieTmdbVideos(
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
          // check have any data in creditable table
          // const [getCreditableInformations, checkSeries] = await Promise.all([
          // const [getCreditableInformations] = await Promise.all([
          //   model.creditable.findAll({
          //     attributes: ["people_id", "department", "job"],
          //     where: {
          //       creditable_id: titleId,
          //       creditable_type: "title",
          //       status: "active",
          //     },
          //   }),
          // model.relatedSeriesTitle.findAll({
          //   where: {
          //     title_id: titleId,
          //     status: "active",
          //   },
          // }),
          // ]);
          // credit data cast & crew
          if (
            tmdbEnCreditsData &&
            tmdbEnCreditsData.results &&
            tmdbEnCreditsData.results.cast.length > 0 &&
            titleId &&
            getCreditableInformations.length == 0
          ) {
            await Promise.all([
              importTitleTmdbService.addMovieTmdbCast(
                tmdbEnCreditsData.results.cast,
                titleId,
                createdBy,
                langEn,
              ),
            ]);
          }
          if (
            tmdbEnCreditsData &&
            tmdbEnCreditsData.results &&
            tmdbEnCreditsData.results.crew.length > 0 &&
            titleId &&
            getCreditableInformations.length == 0
          ) {
            await Promise.all([
              importTitleTmdbService.addMovieTmdbCrew(
                tmdbEnCreditsData.results.crew,
                titleId,
                createdBy,
                langEn,
              ),
            ]);
          }

          // Add series data - add collection
          // if (checkSeries.length == 0 && collectionId) {
          if (collectionId) {
            await importTitleTmdbService.addMovieSeriesData(
              collectionId,
              titleId,
              createdBy,
              langEn,
            );
          }

          // // watch on details
          // const findWatch = await model.titleWatchOn.findAll({
          //   where: {
          //     title_id: titleId,
          //     status: "active",
          //   },
          // });
          if (findWatch.length == 0 && tmdbKoWatchData && tmdbKoWatchData.results && titleId) {
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
          //   // TMDB MOVIE SERIES DETAILS:
          //   const collectionId =
          //     tmdbEnData &&
          //     tmdbEnData.results &&
          //     tmdbEnData.results.belongs_to_collection &&
          //     tmdbEnData.results.belongs_to_collection.id
          //       ? tmdbEnData.results.belongs_to_collection.id
          //       : "";
          //   if (collectionId) {
          //     await importTitleTmdbService.addMovieSeriesData(collectionId, titleId, createdBy);
          //   }
        }
        // Season,Episode,Credit,Channel, Watch update for TV
        if (getType == "tv") {
          //en
          const seasonData = await model.season.findAll({
            where: {
              title_id: titleId,
              status: "active",
            },
          });
          if (
            seasonData.length == 0 &&
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
                  tmdbEnDataAka,
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
                  const findWatch = await model.titleWatchOn.findAll({
                    where: {
                      title_id: titleId,
                      status: "active",
                    },
                  });
                  //watch
                  if (
                    findWatch.length == 0 &&
                    tmdbKoWatchData &&
                    tmdbKoWatchData.results &&
                    titleId
                  ) {
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
                  //channel - these details are from client JSON
                  const [getChannel, getNewsKeywordsInformations] = await Promise.all([
                    model.titleChannelList.findAll({
                      attributes: ["id"],
                      where: {
                        title_id: titleId,
                        season_id: seasonId,
                        status: "active",
                      },
                    }),
                    model.titleKeyword.findAll({
                      attributes: ["id"],
                      where: {
                        title_id: titleId,
                        season_id: seasonId,
                        status: "active",
                        keyword_type: "news",
                      },
                    }),
                  ]);
                  if (channelDetails && getChannel.length == 0) {
                    const getNetwork = await model.tvNetworks.findOne({
                      attributes: ["id", "network_name"],
                      where: {
                        network_name: Sequelize.where(
                          Sequelize.fn("BINARY", Sequelize.col("network_name")),
                          channelDetails,
                        ),
                        status: "active",
                      },
                    });
                    if (getNetwork) {
                      const networkData = {
                        title_id: titleId,
                        tv_network_id: getNetwork.id ? getNetwork.id : null,
                        season_id: seasonId,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: createdBy,
                        site_language: langEn,
                      };
                      await model.titleChannelList.create(networkData);
                    }
                  }
                  // check have any data in Keyword-News table
                  if (getNewsKeywordsInformations.length == 0) {
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
                    actionDate = newsKeywordData.updated_at;
                  }
                }
              }
            }
          }
        }

        // service add for update data in edb_edits table
        if (titleId)
          await titleService.titleDataAddEditInEditTbl(titleId, getType, createdBy, actionDate);
      }
    }
  } catch (error) {
    console.log(error);
    return { results: {} };
  }
};
