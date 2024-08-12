import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import {
  tmdbService,
  departmentService,
  importTitleTmdbService,
  schedulerJobService,
  titleService,
} from "../../../services/index.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

/**
 * submitAllSaveTitle
 * @param req
 * @param res
 */
export const submitAllSaveTitle = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.draft_relation_id;
    let actionDate = "";
    let isVideoAdded = false;
    let payloadPeopleList = [];

    //save title primary details
    const findRequestId = await model.titleRequestPrimaryDetails.findAll({
      where: {
        relation_id: relationId,
        status: "active",
        request_status: "draft",
      },
      order: [
        ["updated_at", "DESC"],
        ["id", "DESC"],
      ],
    });
    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    if (findRequestId.length > 0) {
      const titleData = {
        uuid: findRequestId[0].uuid ? findRequestId[0].uuid : null,
        type: findRequestId[0].type,
        tmdb_vote_average: findRequestId[0].tmdb_vote_average
          ? findRequestId[0].tmdb_vote_average
          : null,
        release_date: findRequestId[0].release_date ? findRequestId[0].release_date : null,
        release_date_to: findRequestId[0].release_date_to ? findRequestId[0].release_date_to : null,
        year: findRequestId[0].year ? findRequestId[0].year : null,
        backdrop: findRequestId[0].backdrop ? findRequestId[0].backdrop : null,
        runtime: findRequestId[0].runtime ? findRequestId[0].runtime : null,
        budget: findRequestId[0].budget ? findRequestId[0].budget : null,
        revenue: findRequestId[0].revenue ? findRequestId[0].revenue : null,
        views: findRequestId[0].views ? findRequestId[0].views : 0,
        popularity: findRequestId[0].popularity ? findRequestId[0].popularity : null,
        imdb_id: findRequestId[0].imdb_id ? findRequestId[0].imdb_id : null,
        tmdb_id: findRequestId[0].tmdb_id ? findRequestId[0].tmdb_id : null,
        kobis_id: findRequestId[0].kobis_id ? findRequestId[0].kobis_id : null,
        tiving_id: findRequestId[0].tiving_id ? findRequestId[0].tiving_id : null,
        odk_id: findRequestId[0].odk_id ? findRequestId[0].odk_id : null,
        naver_id: findRequestId[0].naver_id ? findRequestId[0].naver_id : null,
        kakao_id: findRequestId[0].kakao_id ? findRequestId[0].kakao_id : null,
        season_count: findRequestId[0].season_count ? findRequestId[0].season_count : null,
        fully_synced: findRequestId[0].fully_synced ? findRequestId[0].fully_synced : 0,
        allow_update: findRequestId[0].allow_update ? findRequestId[0].allow_update : 1,
        language: findRequestId[0].language ? findRequestId[0].language : null,
        country: findRequestId[0].country ? findRequestId[0].country : null,
        original_title: findRequestId[0].original_title ? findRequestId[0].original_title : null,
        affiliate_link: findRequestId[0].affiliate_link ? findRequestId[0].affiliate_link : null,
        tmdb_vote_count: findRequestId[0].tmdb_vote_count ? findRequestId[0].tmdb_vote_count : null,
        certification: findRequestId[0].certification ? findRequestId[0].certification : null,
        episode_count: findRequestId[0].episode_count ? findRequestId[0].episode_count : null,
        series_ended: findRequestId[0].series_ended ? findRequestId[0].series_ended : 0,
        is_series: findRequestId[0].is_series ? findRequestId[0].is_series : 0,
        local_vote_average: findRequestId[0].local_vote_average
          ? findRequestId[0].local_vote_average
          : 0,
        show_videos: findRequestId[0].show_videos ? findRequestId[0].show_videos : 0,
        adult: findRequestId[0].adult ? findRequestId[0].adult : 0,
        series_round: findRequestId[0].series_round ? findRequestId[0].series_round : null,
        crank_in: findRequestId[0].crank_in ? findRequestId[0].crank_in : null,
        crank_up: findRequestId[0].crank_up ? findRequestId[0].crank_up : null,
        is_rerelease: findRequestId[0].is_rerelease ? findRequestId[0].is_rerelease : 0,
        is_cookie: findRequestId[0].is_cookie ? findRequestId[0].is_cookie : 0,
        cookie_num: findRequestId[0].cookie_num ? findRequestId[0].cookie_num : null,
        vod_release_date: findRequestId[0].vod_release_date
          ? findRequestId[0].vod_release_date
          : null,
        format: findRequestId[0].format ? findRequestId[0].format : null,
        title_status: findRequestId[0].title_status ? findRequestId[0].title_status : null,
        footfalls: findRequestId[0].footfalls ? findRequestId[0].footfalls : null,
        rating: findRequestId[0].rating ? findRequestId[0].rating : null,
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        avg_rating:
          findRequestId[0].type == "webtoons" && findRequestId[0].rating
            ? findRequestId[0].rating
            : null,
      };
      if (findRequestId[0].tmdb_id) {
        const isExist = await model.title.findOne({
          where: {
            type: findRequestId[0].type,
            tmdb_id: findRequestId[0].tmdb_id,
            record_status: "active",
          },
        });
        if (isExist) throw StatusError.badRequest(res.__("TMDB ID already exist"));
      }
      if (findRequestId[0].kobis_id) {
        const isExist = await model.title.findOne({
          where: {
            type: findRequestId[0].type,
            kobis_id: findRequestId[0].kobis_id,
            record_status: "active",
          },
        });
        if (isExist) throw StatusError.badRequest(res.__("KOBIS ID already exist"));
      }

      const newTitle = await model.title.create(titleData);
      actionDate = titleData.created_at;

      // -------------------Primary Details - Language Dependent---------------------------------
      // Finding all the request with respect to language- inserting data into titltranslation
      for (const titleValue of findRequestId) {
        const titleTranslationData = {
          title_id: newTitle.id,
          site_language: titleValue.site_language,
          name: titleValue.name ? titleValue.name : null,
          aka: findRequestId[0].aka ? findRequestId[0].aka : null,
          description: titleValue.description ? titleValue.description : null,
          tagline: findRequestId[0].tagline ? findRequestId[0].tagline : null,
          plot_summary: titleValue.plot_summary ? titleValue.plot_summary : null,
          synopsis: findRequestId[0].synopsis ? findRequestId[0].synopsis : null,
          created_by: userId,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.titleTranslation.create(titleTranslationData);
        actionDate = titleTranslationData.created_at;

        //   create the data in the Original works table - language dependent
        const originalWorksDetails =
          titleValue.original_work_details != null
            ? JSON.parse(titleValue.original_work_details)
            : null;
        if (originalWorksDetails != null && originalWorksDetails.list.length > 0) {
          for (const value of originalWorksDetails.list) {
            const originalWorksData = {
              title_id: newTitle.id,
              ow_type: value.ow_type,
              ow_title: value.ow_title,
              ow_original_artis: value.ow_original_artis,
              site_language: titleValue.site_language,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.originalWorks.create(originalWorksData);
            actionDate = originalWorksData.created_at;
          }
        }
      }

      // list creteded to remove the duplicate of the following field
      const reReleaseList = [];
      const watchOnStreamList = [];
      const watchOnBuyList = [];
      const watchOnRentList = [];
      let requestId = [];

      if (findRequestId[0].type === "movie" && newTitle.id) {
        //   create the data in the Title countries table
        const countryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (countryDetails != null && countryDetails.list.length > 0) {
          for (const value of countryDetails.list) {
            const titleCountries = {
              title_id: newTitle.id,
              country_id: value.country_id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleCountries.create(titleCountries);
            actionDate = titleCountries.created_at;
          }
        }

        //   create the data in the Rerelease table
        const reReleaseDetails =
          findRequestId[0].re_release_details != null
            ? JSON.parse(findRequestId[0].re_release_details)
            : null;
        if (reReleaseDetails != null && reReleaseDetails.list.length > 0) {
          for (const value of reReleaseDetails.list) {
            if (reReleaseList.length === 0 || reReleaseList.indexOf(value.re_release_date) === -1) {
              reReleaseList.push(value.re_release_date);
              const titleReReleaseDate = {
                title_id: newTitle.id,
                re_release_date: value.re_release_date,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleReRelease.create(titleReReleaseDate);
              actionDate = titleReReleaseDate.created_at;
            }
          }
        }

        //   create the data in the series table
        const seriesDetails =
          findRequestId[0].series_details != null
            ? JSON.parse(findRequestId[0].series_details)
            : null;
        let combinationSeries = [];
        if (seriesDetails != null && seriesDetails.list.length > 0) {
          for (const value of seriesDetails.list) {
            if (value.related_title_id) {
              combinationSeries.push(value.related_title_id);
              const [checkSeries, checkOtherSeries] = await Promise.all([
                model.relatedSeriesTitle.findOne({
                  where: {
                    title_id: newTitle.id,
                    related_series_title_id: value.related_title_id,
                    status: "active",
                  },
                }),
                model.relatedSeriesTitle.findOne({
                  where: {
                    title_id: value.related_title_id,
                    related_series_title_id: newTitle.id,
                    status: "active",
                  },
                }),
              ]);
              if (!checkSeries) {
                const seriesData = {
                  title_id: newTitle.id,
                  related_series_title_id: value.related_title_id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedSeriesTitle.create(seriesData);
                actionDate = seriesData.created_at;
              }

              // Check for reverse mapping title id and series title id
              if (!checkOtherSeries) {
                const reverseSeriesData = {
                  title_id: value.related_title_id,
                  related_series_title_id: newTitle.id,
                  site_language: findRequestId[0].site_language,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedSeriesTitle.create(reverseSeriesData);
                actionDate = reverseSeriesData.created_at;
              }
            } else if (value.tmdb_id) {
              const titleType = "movie";
              let schedularAddData = [];
              const swipLanguage = await generalHelper.swipeLanguage(
                findRequestId[0].site_language,
              );
              const tmdbResults = await tmdbService.fetchTitleDetails(
                titleType,
                value.tmdb_id,
                findRequestId[0].site_language,
              );
              const tmdbSeriesData = tmdbResults && tmdbResults.results ? tmdbResults.results : "";
              const tmdbTitle = tmdbSeriesData && tmdbSeriesData.title ? tmdbSeriesData.title : "";
              const tmdbPoster =
                tmdbSeriesData && tmdbSeriesData.poster_image ? tmdbSeriesData.poster_image : "";
              if (tmdbSeriesData) {
                // adding some data to the title table - Datas from TMDB:
                const uuid = uuidv4();
                const releaseDate = tmdbSeriesData.release_date
                  ? tmdbSeriesData.release_date
                  : null;
                const releaseYear = releaseDate
                  ? await customDateTimeHelper.changeDateFormat(releaseDate, "YYYY")
                  : null;
                const year = releaseYear != null ? releaseYear : null;
                const getStatus = tmdbSeriesData.status ? tmdbSeriesData.status : null;
                const statusList = await generalHelper.titleStatus(titleType);
                const seriesTitleStatus =
                  statusList && getStatus
                    ? Object.keys(statusList).find((key) => statusList[key] === getStatus)
                    : "";
                const titleData = {
                  uuid: uuid,
                  type: titleType,
                  tmdb_vote_average: tmdbSeriesData.vote_average
                    ? tmdbSeriesData.vote_average
                    : null,
                  release_date: releaseDate,
                  release_date_to: tmdbSeriesData.release_date_to
                    ? tmdbSeriesData.release_date_to
                    : null,
                  year: year,
                  runtime: tmdbSeriesData.runtime ? tmdbSeriesData.runtime : null,
                  budget: tmdbSeriesData.budget ? tmdbSeriesData.budget : null,
                  revenue: tmdbSeriesData.revenue ? tmdbSeriesData.revenue : null,
                  popularity: tmdbSeriesData.popularity ? tmdbSeriesData.popularity : null,
                  imdb_id: tmdbSeriesData.imdb_id ? tmdbSeriesData.imdb_id : null,
                  tmdb_id: value.tmdb_id,
                  kobis_id: null,
                  tiving_id: null,
                  odk_id: null,
                  language: tmdbSeriesData.original_language
                    ? tmdbSeriesData.original_language
                    : null,
                  original_title: tmdbSeriesData.original_title
                    ? tmdbSeriesData.original_title
                    : null,
                  affiliate_link: tmdbSeriesData.homepage ? tmdbSeriesData.homepage : null,
                  tmdb_vote_count: tmdbSeriesData.vote_count ? tmdbSeriesData.vote_count : null,
                  title_status: seriesTitleStatus ? seriesTitleStatus : null,
                  record_status: "active",
                  created_by: userId,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                };
                const newSeriesTitle = await model.title.create(titleData);
                if (newSeriesTitle.id) {
                  const titleTranslationData = {
                    title_id: newSeriesTitle.id,
                    site_language: findRequestId[0].site_language,
                    name: tmdbTitle,
                    aka: null,
                    description: tmdbSeriesData.overview ? tmdbSeriesData.overview : null,
                    tagline: tmdbSeriesData.tagline ? tmdbSeriesData.tagline : null,
                    plot_summary: null,
                    synopsis: null,
                    created_by: userId,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                  };
                  await model.titleTranslation.create(titleTranslationData);

                  const fileName = tmdbPoster
                    ? tmdbPoster.substring(tmdbPoster.lastIndexOf("/") + 1)
                    : null;
                  const posterImageData = {
                    original_name: fileName,
                    file_name: fileName,
                    path: tmdbPoster,
                    title_id: newSeriesTitle.id,
                    list_order: 1,
                    image_category: "poster_image",
                    is_main_poster: "y",
                    site_language: findRequestId[0].site_language,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.titleImage.create(posterImageData);

                  if (newSeriesTitle.id > 0 && newTitle.id && newSeriesTitle.id != newTitle.id) {
                    combinationSeries.push(newSeriesTitle.id);
                    const [checkSeries, checkOtherSeries] = await Promise.all([
                      model.relatedSeriesTitle.findOne({
                        where: {
                          title_id: newTitle.id,
                          related_series_title_id: newSeriesTitle.id,
                          status: "active",
                        },
                      }),
                      model.relatedSeriesTitle.findOne({
                        where: {
                          title_id: newSeriesTitle.id,
                          related_series_title_id: newTitle.id,
                          status: "active",
                        },
                      }),
                    ]);
                    if (!checkSeries) {
                      const seriesData = {
                        title_id: newTitle.id,
                        related_series_title_id: newSeriesTitle.id,
                        site_language: findRequestId[0].site_language
                          ? findRequestId[0].site_language
                          : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.relatedSeriesTitle.create(seriesData);
                      actionDate = seriesData.created_at;
                    }

                    // Check for reverse mapping title id and series title id
                    if (!checkOtherSeries) {
                      const reverseSeriesData = {
                        title_id: newSeriesTitle.id,
                        related_series_title_id: newTitle.id,
                        site_language: findRequestId[0].site_language,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.relatedSeriesTitle.create(reverseSeriesData);
                      actionDate = reverseSeriesData.created_at;
                    }

                    // add data to the schedular table
                    const schedularData = {
                      type: titleType,
                      tmdb_id: value.tmdb_id,
                      site_language: findRequestId[0].site_language,
                      title_id: newSeriesTitle.id,
                      created_by: userId,
                      expected_site_language: swipLanguage,
                    };
                    schedularAddData.push(schedularData);
                    // adding to the schedular JOB
                    if (schedularAddData.length > 0) {
                      const payload = { list: schedularAddData };
                      await schedulerJobService.addJobInScheduler(
                        "add series title data",
                        JSON.stringify(payload),
                        "title_series_data",
                        "Sumbit all Movie Details",
                        userId,
                      );
                    }
                  }
                }
              }
            }
          }
          // insert other combinationSeries
          if (combinationSeries.length > 1) {
            const reverseCombinationSeries = combinationSeries.reverse();
            for (const combination of combinationSeries) {
              for (const revCombination of reverseCombinationSeries) {
                if (combination > 0 && revCombination > 0 && combination != revCombination) {
                  const findRelatedData = await model.relatedSeriesTitle.findOne({
                    where: {
                      title_id: combination,
                      related_series_title_id: revCombination,
                      status: "active",
                    },
                  });
                  if (!findRelatedData) {
                    const seriesData = {
                      title_id: combination,
                      related_series_title_id: revCombination,
                      site_language: findRequestId[0].site_language,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    await model.relatedSeriesTitle.create(seriesData);
                  }
                }
              }
            }
          }
        }
        //   create the data in the connection table
        const connectionDetails =
          findRequestId[0].connection_details != null
            ? JSON.parse(findRequestId[0].connection_details)
            : null;
        if (connectionDetails != null && connectionDetails.list.length > 0) {
          for (const value of connectionDetails.list) {
            if (value.related_title_id) {
              const [checkConnection, checkOtherConnection] = await Promise.all([
                model.relatedTitle.findOne({
                  where: {
                    title_id: newTitle.id,
                    related_title_id: value.related_title_id,
                    status: "active",
                  },
                }),
                model.relatedTitle.findOne({
                  where: {
                    title_id: value.related_title_id,
                    related_title_id: newTitle.id,
                    status: "active",
                  },
                }),
              ]);

              if (!checkConnection) {
                const connectionData = {
                  title_id: newTitle.id,
                  related_title_id: value.related_title_id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  season_id: value.season_id ? value.season_id : null,
                  episode_id: value.episode_id ? value.episode_id : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }

              if (!checkOtherConnection) {
                const connectionData = {
                  title_id: value.related_title_id,
                  related_title_id: newTitle.id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  season_id: value.season_id ? value.season_id : null,
                  episode_id: value.episode_id ? value.episode_id : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }
            }
          }
        }

        // create a data for title_keywords details-movies:
        const searchKeywordDetails =
          findRequestId[0].search_keyword_details != null
            ? JSON.parse(findRequestId[0].search_keyword_details)
            : null;
        const newsKeywordDetails =
          findRequestId[0].news_keyword_details != null
            ? JSON.parse(findRequestId[0].news_keyword_details)
            : null;
        if (searchKeywordDetails != null && searchKeywordDetails.list.length > 0) {
          for (const value of searchKeywordDetails.list) {
            const searchKeywordData = {
              title_id: newTitle.id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              keyword: value.keyword ? value.keyword : null,
              keyword_type: value.keyword_type ? value.keyword_type : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleKeyword.create(searchKeywordData);
            actionDate = searchKeywordData.created_at;
          }
        }
        if (newsKeywordDetails != null && newsKeywordDetails.list.length > 0) {
          for (const value of newsKeywordDetails.list) {
            const newsKeywordData = {
              title_id: newTitle.id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              keyword: value.keyword ? value.keyword : null,
              keyword_type: value.keyword_type ? value.keyword_type : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleKeyword.create(newsKeywordData);
            actionDate = newsKeywordData.created_at;
          }
        }
        // Data for watch-on movie type :
        const watchOnStreamDetails =
          findRequestId[0].watch_on_stream_details != null
            ? JSON.parse(findRequestId[0].watch_on_stream_details)
            : null;
        const watchOnRentDetails =
          findRequestId[0].watch_on_stream_details != null
            ? JSON.parse(findRequestId[0].watch_on_rent_details)
            : null;
        const watchOnBuyDetails =
          findRequestId[0].watch_on_stream_details != null
            ? JSON.parse(findRequestId[0].watch_on_buy_details)
            : null;
        if (watchOnStreamDetails != null && watchOnStreamDetails.list.length > 0) {
          for (const value of watchOnStreamDetails.list) {
            if (
              watchOnStreamList.length === 0 ||
              watchOnStreamList.indexOf(value.provider_id) === -1
            ) {
              watchOnStreamList.push(value.provider_id);
              const watchOnData = {
                title_id: newTitle.id,
                movie_id: value.movie_id ? value.movie_id : null,
                url: value.url ? value.url : null,
                type: value.type ? value.type : null,
                provider_id: value.provider_id ? value.provider_id : null,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleWatchOn.create(watchOnData);
              actionDate = watchOnData.created_at;
            }
          }
        }
        if (watchOnRentDetails != null && watchOnRentDetails.list.length > 0) {
          for (const value of watchOnRentDetails.list) {
            if (watchOnRentList.length === 0 || watchOnRentList.indexOf(value.provider_id) === -1) {
              watchOnRentList.push(value.provider_id);
              const watchOnData = {
                title_id: newTitle.id,
                movie_id: value.movie_id ? value.movie_id : null,
                url: value.url ? value.url : null,
                type: value.type ? value.type : null,
                provider_id: value.provider_id ? value.provider_id : null,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleWatchOn.create(watchOnData);
              actionDate = watchOnData.created_at;
            }
          }
        }
        if (watchOnBuyDetails != null && watchOnBuyDetails.list.length > 0) {
          for (const value of watchOnBuyDetails.list) {
            if (watchOnBuyList.length === 0 || watchOnBuyList.indexOf(value.provider_id) === -1) {
              watchOnBuyList.push(value.provider_id);
              const watchOnData = {
                title_id: newTitle.id,
                movie_id: value.movie_id ? value.movie_id : null,
                url: value.url ? value.url : null,
                type: value.type ? value.type : null,
                provider_id: value.provider_id ? value.provider_id : null,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleWatchOn.create(watchOnData);
              actionDate = watchOnData.created_at;
            }
          }
        }

        // ------------------------------media details---------------------------------
        // storing the media details type movie::
        let foundMediaData = [];
        for (const value of findRequestId) {
          if (value.id) requestId.push(value.id);
        }
        if (requestId.length > 0) {
          foundMediaData = await model.titleRequestMedia.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }
        if (foundMediaData.length > 0) {
          let videoListOrder = 1;
          let mediaImageListOrder = 1;
          const parsedVideoDetails =
            foundMediaData[0].video_details != null
              ? JSON.parse(foundMediaData[0].video_details)
              : null;
          const parsedImageDetails =
            foundMediaData[0].image_details != null
              ? JSON.parse(foundMediaData[0].image_details)
              : null;
          const parsedPosterDetails =
            foundMediaData[0].poster_image_details != null
              ? JSON.parse(foundMediaData[0].poster_image_details)
              : null;
          const parsedBackgroundImageDetails =
            foundMediaData[0].background_image_details != null
              ? JSON.parse(foundMediaData[0].background_image_details)
              : null;
          if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
            for (const value of parsedVideoDetails.list) {
              const videoData = {
                name: value.name,
                thumbnail: value.thumbnail ? value.thumbnail : null,
                url: value.url ? value.url : null,
                type: value.type,
                quality: value.quality ? value.quality : null,
                title_id: newTitle.id,
                season: value.season ? value.season : null,
                episode: value.episode ? value.episode : null,
                source: value.source ? value.source : "local",
                negative_votes: value.negative_votes ? value.negative_votes : 0,
                positive_votes: value.positive_votes ? value.positive_votes : 0,
                reports: value.reports ? value.reports : 0,
                approved: value.approved ? value.approved : 1,
                list_order: videoListOrder,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                user_id: userId,
                category: value.category ? value.category : "trailer",
                is_official_trailer: value.is_official_trailer ? value.is_official_trailer : null,
                site_language: value.site_language ? value.site_language : "en",
                created_by: userId,
                video_source: value.url ? await generalHelper.checkUrlSource(value.url) : "youtube",
                video_for: "title",
                no_of_view: value.no_of_view ? value.no_of_view : 0,
                video_duration: value.video_duration ? value.video_duration : null,
                ele_no_of_view: 0,
              };
              await model.video.create(videoData);
              actionDate = videoData.created_at;
              isVideoAdded = true;
              videoListOrder += 1;
            }
          }
          if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
            for (const value of parsedImageDetails.list) {
              const imageData = {
                original_name: value.original_name ? value.original_name : null,
                file_name: value.file_name ? value.file_name : null,
                url: value.url ? value.url : null,
                path: value.path ? value.path : null,
                file_size: value.file_size ? value.file_size : null,
                mime_type: value.mime_type ? value.mime_type : null,
                file_extension: value.file_extension ? value.file_extension : null,
                title_id: newTitle.id,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
                source: value.source ? value.source : "local",
                approved: value.approved ? value.approved : 1,
                list_order: mediaImageListOrder,
                image_category: value.image_category ? value.image_category : "image",
                is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                site_language: value.site_language ? value.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleImage.create(imageData);
              actionDate = imageData.created_at;
              mediaImageListOrder += 1;
            }
          }
          if (parsedPosterDetails != null && parsedPosterDetails.list.length > 0) {
            for (const posterValue of parsedPosterDetails.list) {
              const posterImageData = {
                original_name: posterValue.original_name ? posterValue.original_name : null,
                file_name: posterValue.file_name ? posterValue.file_name : null,
                url: posterValue.url ? posterValue.url : null,
                path: posterValue.path ? posterValue.path : null,
                file_size: 2022,
                mime_type: posterValue.mime_type ? posterValue.mime_type : null,
                file_extension: posterValue.file_extension ? posterValue.file_extension : null,
                title_id: newTitle.id,
                season_id: posterValue.season_id ? posterValue.season_id : null,
                episode_id: posterValue.episode_id ? posterValue.episode_id : null,
                source: posterValue.source ? posterValue.source : "local",
                approved: posterValue.approved ? posterValue.approved : 1,
                list_order: mediaImageListOrder,
                image_category: posterValue.image_category,
                is_main_poster: posterValue.is_main_poster ? posterValue.is_main_poster : null,
                site_language: posterValue.site_language ? posterValue.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleImage.create(posterImageData);
              actionDate = posterImageData.created_at;
              mediaImageListOrder += 1;
            }
          }
          if (
            parsedBackgroundImageDetails != null &&
            parsedBackgroundImageDetails.list.length > 0
          ) {
            for (const value of parsedBackgroundImageDetails.list) {
              const backgroundImageData = {
                original_name: value.original_name ? value.original_name : null,
                file_name: value.file_name ? value.file_name : null,
                url: value.url ? value.url : null,
                path: value.path ? value.path : null,
                file_size: value.file_size ? value.file_size : null,
                mime_type: value.mime_type ? value.mime_type : null,
                file_extension: value.file_extension ? value.file_extension : null,
                title_id: newTitle.id,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
                source: value.source ? value.source : "local",
                approved: value.approved ? value.approved : 1,
                list_order: mediaImageListOrder,
                image_category: value.image_category ? value.image_category : "image",
                is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                site_language: value.site_language ? value.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.titleImage.create(backgroundImageData);
              actionDate = backgroundImageData.created_at;
              mediaImageListOrder += 1;
            }
          }
        }

        // -----------------------------credit details-------------------------------------
        // storing the credit data:
        let foundCreditData = [];

        if (requestId.length > 0) {
          foundCreditData = await model.titleRequestCredit.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }
        if (foundCreditData.length > 0) {
          let schedularAddData = [];
          let schedularPrimaryAddData = [];
          const parsedCastDetails =
            foundCreditData[0].cast_details != null
              ? JSON.parse(foundCreditData[0].cast_details)
              : null;
          const parsedCrewDetails =
            foundCreditData[0].crew_details != null
              ? JSON.parse(foundCreditData[0].crew_details)
              : null;
          if (parsedCastDetails != null && parsedCastDetails.list.length > 0) {
            let peopleData = {};
            for (const castData of parsedCastDetails.list) {
              let peopleId = 0;
              if (
                castData.people_id === "" &&
                (castData.cast_name != null || castData.cast_name != "")
              ) {
                // Two scenarios:
                // 1. people Id is not present and TMDB id present
                // 2. people Id is not present and TMDB id is not present - create new people pop up modal
                if (castData.tmdb_id) {
                  const getPeople = await model.people.findOne({
                    attributes: ["id"],
                    where: { tmdb_id: castData.tmdb_id, status: { [Op.ne]: "deleted" } },
                    include: [
                      {
                        model: model.peopleTranslation,
                        left: true,
                        where: {
                          name: castData.cast_name,
                          status: { [Op.ne]: "deleted" },
                        },
                      },
                    ],
                  });
                  if (getPeople) {
                    peopleId = getPeople.id;
                  } else {
                    const siteLanguage = castData.site_language ? castData.site_language : "en";
                    const swipLanguage = await generalHelper.swipeLanguage(siteLanguage);
                    const getPeopleData = await tmdbService.fetchPeopleDetails(
                      castData.tmdb_id,
                      siteLanguage,
                    );
                    const createCast = {
                      poster: castData.poster,
                      tmdb_id: castData.tmdb_id,
                      uuid: await generalHelper.uuidv4(),
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (
                      getPeopleData &&
                      getPeopleData.results &&
                      getPeopleData.results != null &&
                      getPeopleData.results != "undefined"
                    ) {
                      createCast.tmdb_id = getPeopleData.results.tmdb_id;
                      let gender = null;
                      if (getPeopleData.results.gender && getPeopleData.results.gender == 2) {
                        gender = "male";
                      }
                      if (getPeopleData.results.gender && getPeopleData.results.gender == 1) {
                        gender = "female";
                      }
                      createCast.gender = gender;
                      createCast.birth_date = getPeopleData.results.birth_day
                        ? getPeopleData.results.birth_day
                        : null;
                      createCast.imdb_id = getPeopleData.results.imdb_id
                        ? getPeopleData.results.imdb_id
                        : null;
                      createCast.official_site = getPeopleData.results.homepage
                        ? getPeopleData.results.homepage
                        : null;
                      createCast.death_date = getPeopleData.results.death_day
                        ? getPeopleData.results.death_day
                        : null;
                      createCast.adult =
                        getPeopleData.results.adult && getPeopleData.results.adult === true ? 1 : 0;
                      createCast.popularity = getPeopleData.results.popularity
                        ? getPeopleData.results.popularity
                        : null;
                    }
                    const createPeople = await model.people.create(createCast);
                    if (createPeople.id) {
                      peopleId = createPeople.id;
                      payloadPeopleList.push({
                        record_id: peopleId,
                        type: "people",
                        action: "add",
                      });
                      peopleData = {
                        people_id: createPeople.id,
                        name: castData.cast_name,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                        site_language: castData.site_language ? castData.site_language : "en",
                      };
                      if (
                        getPeopleData &&
                        getPeopleData.results &&
                        getPeopleData.results != null &&
                        getPeopleData.results != "undefined"
                      ) {
                        peopleData.description = getPeopleData.results.biography
                          ? getPeopleData.results.biography
                          : null;
                        peopleData.known_for = getPeopleData.results.aka
                          ? getPeopleData.results.aka
                          : null;
                      }
                      if (
                        !(await model.peopleTranslation.findOne({
                          where: {
                            people_id: peopleId,
                            site_language: castData.site_language ? castData.site_language : "en",
                          },
                        }))
                      ) {
                        await model.peopleTranslation.create(peopleData);
                      }
                      // adding image details to the people image table
                      if (castData.poster) {
                        const fileName = castData.poster.substring(
                          castData.poster.lastIndexOf("/") + 1,
                        );
                        const getLastOrder = await model.peopleImages.max("list_order", {
                          where: {
                            people_id: createPeople.id,
                            image_category: "poster_image",
                          },
                        });
                        const peoplePosterImageData = {
                          original_name: fileName ? fileName : null,
                          file_name: fileName ? fileName : null,
                          path: castData.poster ? castData.poster : null,
                          people_id: createPeople.id,
                          source: "local",
                          list_order: getLastOrder ? getLastOrder + 1 : 1,
                          image_category: "poster_image",
                          is_main_poster: "y",
                          site_language: castData.site_language ? castData.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleImages.create(peoplePosterImageData);
                      }

                      // Add details to the country table
                      const countryName = getPeopleData.results.place_of_birth
                        ? getPeopleData.results.place_of_birth
                        : null;
                      const createdBy = userId;
                      const langEn = castData.site_language ? castData.site_language : "en";
                      if (countryName) {
                        await importTitleTmdbService.addPeopleCountry(
                          countryName,
                          peopleId,
                          createdBy,
                          langEn,
                        );
                      }

                      // adding news search keyword
                      if (castData.cast_name) {
                        const newsKeywordData = {
                          people_id: peopleId,
                          site_language: castData.site_language ? castData.site_language : "en",
                          keyword: castData.cast_name,
                          keyword_type: "news",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleKeywords.create(newsKeywordData);
                      }
                      // add data to the schedular table - people media
                      const schedularData = {
                        tmdb_id: castData.tmdb_id,
                        site_language: siteLanguage,
                        people_id: peopleId,
                        created_by: userId,
                      };
                      schedularAddData.push(schedularData);
                      // add data to the schedular table - people primary details other language
                      const schedularPrimaryData = {
                        tmdb_id: castData.tmdb_id,
                        site_language: siteLanguage,
                        people_id: peopleId,
                        created_by: userId,
                        expected_site_language: swipLanguage,
                      };
                      schedularPrimaryAddData.push(schedularPrimaryData);
                    }
                  }
                } else {
                  const createCast = {
                    uuid: await generalHelper.uuidv4(),
                    poster: castData.poster,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  const createPeople = await model.people.create(createCast);
                  if (createPeople.id) {
                    peopleId = createPeople.id;
                    payloadPeopleList.push({
                      record_id: peopleId,
                      type: "people",
                      action: "add",
                    });
                    peopleData = {
                      people_id: createPeople.id,
                      name: castData.cast_name,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                      site_language: castData.site_language ? castData.site_language : "en",
                    };
                    if (
                      !(await model.peopleTranslation.findOne({
                        where: {
                          people_id: peopleId,
                          site_language: castData.site_language ? castData.site_language : "en",
                        },
                      }))
                    ) {
                      await model.peopleTranslation.create(peopleData);
                    }
                    // adding image details to the people image table
                    if (castData.poster) {
                      const fileName = castData.poster.substring(
                        castData.poster.lastIndexOf("/") + 1,
                      );
                      const getLastOrder = await model.peopleImages.max("list_order", {
                        where: {
                          people_id: createPeople.id,
                          image_category: "poster_image",
                        },
                      });
                      const peoplePosterImageData = {
                        original_name: fileName ? fileName : null,
                        file_name: fileName ? fileName : null,
                        path: castData.poster ? castData.poster : null,
                        people_id: createPeople.id,
                        source: "local",
                        list_order: getLastOrder ? getLastOrder + 1 : 1,
                        image_category: "poster_image",
                        is_main_poster: "y",
                        site_language: castData.site_language ? castData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.peopleImages.create(peoplePosterImageData);
                    }
                  }
                }
              } else {
                peopleId = castData.people_id ? castData.people_id : "";
              }
              if (peopleId) {
                const castDataDetails = {
                  people_id: peopleId,
                  creditable_id: newTitle.id,
                  character_name: castData.character_name ? castData.character_name : null,
                  list_order: castData.list_order,
                  department: castData.department ? castData.department : null,
                  job: castData.job ? castData.job : null,
                  creditable_type: castData.creditable_type ? castData.creditable_type : null,
                  is_guest: castData.is_guest ? castData.is_guest : 0,
                  season_id: castData.season_id ? castData.season_id : null,
                  episode_id: castData.episode_id ? castData.episode_id : null,
                  site_language: castData.site_language ? castData.site_language : "en",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                // check for creditable table - record already exist or not
                const isCreditableExist = await model.creditable.findOne({
                  where: {
                    people_id: peopleId,
                    creditable_id: newTitle.id,
                    character_name: castData.character_name,
                    department: castData.department,
                    job: castData.job,
                    creditable_type: castData.creditable_type,
                    status: "active",
                  },
                });

                if (!isCreditableExist) {
                  await model.creditable.create(castDataDetails);
                  actionDate = castDataDetails.created_at;
                }
                if (castData.job) {
                  // get departmentSercive
                  const departmentName = castData.job == "Acting" ? "Actors" : castData.job;
                  const deptId = await departmentService.getDepartmentIdByName(departmentName);
                  if (deptId) {
                    // check for people job table
                    const isPeopleJobExist = await model.peopleJobs.findOne({
                      where: {
                        people_id: peopleId,
                        job_id: deptId,
                        status: "active",
                      },
                    });
                    // list order
                    const getLastOrder = await model.peopleJobs.max("list_order", {
                      where: {
                        people_id: peopleId,
                        status: "active",
                      },
                    });
                    if (!isPeopleJobExist) {
                      const data = {
                        people_id: peopleId,
                        job_id: deptId,
                        list_order: getLastOrder ? getLastOrder + 1 : 1,
                        site_language: castData.site_language ? castData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.peopleJobs.create(data);
                    }
                  }
                }
              }
            }
          }
          if (parsedCrewDetails != null && parsedCrewDetails.list.length > 0) {
            let peopleCrewData = {};
            for (const crewData of parsedCrewDetails.list) {
              let peopleId = 0;
              if (
                crewData.people_id === "" &&
                (crewData.cast_name != null || crewData.cast_name != "")
              ) {
                // Two scenarios:
                // 1. people Id is not present and TMDB id present
                // 2. people Id is not present and TMDB id is not present - create new people pop up modal
                if (crewData.tmdb_id) {
                  const getPeople = await model.people.findOne({
                    attributes: ["id"],
                    where: { tmdb_id: crewData.tmdb_id, status: { [Op.ne]: "deleted" } },
                    include: [
                      {
                        model: model.peopleTranslation,
                        left: true,
                        where: {
                          name: crewData.cast_name,
                          status: { [Op.ne]: "deleted" },
                        },
                      },
                    ],
                  });
                  if (getPeople) {
                    peopleId = getPeople.id;
                  } else {
                    const siteLanguage = crewData.site_language ? crewData.site_language : "en";
                    const swipLanguage = await generalHelper.swipeLanguage(siteLanguage);
                    const getPeopleData = await tmdbService.fetchPeopleDetails(
                      crewData.tmdb_id,
                      siteLanguage,
                    );
                    const createCrew = {
                      poster: crewData.poster,
                      tmdb_id: crewData.tmdb_id,
                      uuid: await generalHelper.uuidv4(),
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (
                      getPeopleData &&
                      getPeopleData.results &&
                      getPeopleData.results != null &&
                      getPeopleData.results != "undefined"
                    ) {
                      createCrew.tmdb_id = getPeopleData.results.tmdb_id;
                      let gender = null;
                      if (getPeopleData.results.gender && getPeopleData.results.gender == 2) {
                        gender = "male";
                      }
                      if (getPeopleData.results.gender && getPeopleData.results.gender == 1) {
                        gender = "female";
                      }
                      createCrew.gender = gender;
                      createCrew.birth_date = getPeopleData.results.birth_day
                        ? getPeopleData.results.birth_day
                        : null;
                      createCrew.imdb_id = getPeopleData.results.imdb_id
                        ? getPeopleData.results.imdb_id
                        : null;
                      createCrew.official_site = getPeopleData.results.homepage
                        ? getPeopleData.results.homepage
                        : null;
                      createCrew.death_date = getPeopleData.results.death_day
                        ? getPeopleData.results.death_day
                        : null;
                      createCrew.adult =
                        getPeopleData.results.adult && getPeopleData.results.adult === true ? 1 : 0;
                      createCrew.popularity = getPeopleData.results.popularity
                        ? getPeopleData.results.popularity
                        : null;
                    }
                    const createPeople = await model.people.create(createCrew);
                    if (createPeople.id) {
                      peopleId = createPeople.id;
                      payloadPeopleList.push({
                        record_id: peopleId,
                        type: "people",
                        action: "add",
                      });
                      peopleCrewData = {
                        people_id: createPeople.id,
                        name: crewData.cast_name,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                        site_language: crewData.site_language ? crewData.site_language : "en",
                      };
                      if (
                        getPeopleData &&
                        getPeopleData.results &&
                        getPeopleData.results != null &&
                        getPeopleData.results != "undefined"
                      ) {
                        peopleCrewData.description = getPeopleData.results.biography
                          ? getPeopleData.results.biography
                          : null;
                        peopleCrewData.known_for = getPeopleData.results.aka
                          ? getPeopleData.results.aka
                          : null;
                      }
                      if (
                        !(await model.peopleTranslation.findOne({
                          where: {
                            people_id: peopleId,
                            site_language: crewData.site_language ? crewData.site_language : "en",
                          },
                        }))
                      ) {
                        await model.peopleTranslation.create(peopleCrewData);
                      }
                      // Add details to the country table
                      const countryName = getPeopleData.results.place_of_birth
                        ? getPeopleData.results.place_of_birth
                        : null;
                      const createdBy = userId;
                      const langEn = crewData.site_language ? crewData.site_language : "en";
                      if (countryName) {
                        await importTitleTmdbService.addPeopleCountry(
                          countryName,
                          peopleId,
                          createdBy,
                          langEn,
                        );
                      }
                      // adding image details to the people image table
                      if (crewData.poster) {
                        const fileName = crewData.poster.substring(
                          crewData.poster.lastIndexOf("/") + 1,
                        );
                        const getLastOrder = await model.peopleImages.max("list_order", {
                          where: {
                            people_id: createPeople.id,
                            image_category: "poster_image",
                          },
                        });
                        const peoplePosterImageData = {
                          original_name: fileName ? fileName : null,
                          file_name: fileName ? fileName : null,
                          path: crewData.poster ? crewData.poster : null,
                          people_id: createPeople.id,
                          source: "local",
                          list_order: getLastOrder ? getLastOrder + 1 : 1,
                          image_category: "poster_image",
                          is_main_poster: "y",
                          site_language: crewData.site_language ? crewData.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleImages.create(peoplePosterImageData);
                      }
                      // adding news search keyword
                      if (crewData.cast_name) {
                        const newsKeywordData = {
                          people_id: peopleId,
                          site_language: crewData.site_language ? crewData.site_language : "en",
                          keyword: crewData.cast_name,
                          keyword_type: "news",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleKeywords.create(newsKeywordData);
                      }
                      // add data to the schedular table - people media details
                      const schedularData = {
                        tmdb_id: crewData.tmdb_id,
                        site_language: siteLanguage,
                        people_id: peopleId,
                        created_by: userId,
                      };
                      schedularAddData.push(schedularData);

                      // add data to the schedular table - people primary details other language
                      const schedularPrimaryData = {
                        tmdb_id: crewData.tmdb_id,
                        site_language: siteLanguage,
                        people_id: peopleId,
                        created_by: userId,
                        expected_site_language: swipLanguage,
                      };
                      schedularPrimaryAddData.push(schedularPrimaryData);
                    }
                  }
                } else {
                  const createCrew = {
                    uuid: await generalHelper.uuidv4(),
                    poster: crewData.poster,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  const createPeople = await model.people.create(createCrew);
                  if (createPeople.id) {
                    peopleId = createPeople.id;
                    payloadPeopleList.push({
                      record_id: peopleId,
                      type: "people",
                      action: "add",
                    });
                    peopleCrewData = {
                      people_id: createPeople.id,
                      name: crewData.cast_name,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                      site_language: crewData.site_language ? crewData.site_language : "en",
                    };
                    if (
                      !(await model.peopleTranslation.findOne({
                        where: {
                          people_id: peopleId,
                          site_language: crewData.site_language ? crewData.site_language : "en",
                        },
                      }))
                    ) {
                      await model.peopleTranslation.create(peopleCrewData);
                    }
                    // adding image details to the people image table
                    if (crewData.poster) {
                      const fileName = crewData.poster.substring(
                        crewData.poster.lastIndexOf("/") + 1,
                      );
                      const getLastOrder = await model.peopleImages.max("list_order", {
                        where: {
                          people_id: createPeople.id,
                          image_category: "poster_image",
                        },
                      });
                      const peoplePosterImageData = {
                        original_name: fileName ? fileName : null,
                        file_name: fileName ? fileName : null,
                        path: crewData.poster ? crewData.poster : null,
                        people_id: createPeople.id,
                        source: "local",
                        list_order: getLastOrder ? getLastOrder + 1 : 1,
                        image_category: "poster_image",
                        is_main_poster: "y",
                        site_language: crewData.site_language ? crewData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.peopleImages.create(peoplePosterImageData);
                    }
                  }
                }
              } else {
                peopleId = crewData.people_id;
              }
              if (peopleId) {
                const crewDataDetails = {
                  people_id: peopleId,
                  creditable_id: newTitle.id,
                  character_name: crewData.character_name ? crewData.character_name : null,
                  list_order: crewData.list_order,
                  department: crewData.department ? crewData.department : null,
                  job: crewData.job ? crewData.job : null,
                  creditable_type: crewData.creditable_type ? crewData.creditable_type : null,
                  is_guest: crewData.is_guest ? crewData.is_guest : 0,
                  season_id: crewData.season_id ? crewData.season_id : null,
                  episode_id: crewData.episode_id ? crewData.episode_id : null,
                  site_language: crewData.site_language ? crewData.site_language : "en",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                const isCreditableExist = await model.creditable.findOne({
                  where: {
                    people_id: peopleId,
                    creditable_id: newTitle.id,
                    department: crewData.department,
                    job: crewData.job,
                    creditable_type: crewData.creditable_type,
                    status: "active",
                  },
                });

                if (!isCreditableExist) {
                  await model.creditable.create(crewDataDetails);
                  actionDate = crewDataDetails.created_at;
                }
                if (crewData.job) {
                  // get departmentSercive
                  const departmentName = crewData.job;
                  const deptId = await model.departmentJob.findOne({
                    attributes: ["department_id"],
                    where: {
                      job_name: departmentName,
                      status: "active",
                    },
                  });
                  // check in department table
                  const jobId = await model.department.findOne({
                    attributes: ["id"],
                    where: {
                      department_name: departmentName,
                      status: "active",
                    },
                  });
                  const peopleJobId =
                    deptId && deptId.department_id
                      ? deptId.department_id
                      : jobId && jobId.id
                      ? jobId.id
                      : "";
                  if (peopleJobId) {
                    // check for people job table
                    const isPeopleJobExist = await model.peopleJobs.findOne({
                      where: {
                        people_id: peopleId,
                        job_id: peopleJobId,
                        status: "active",
                      },
                    });
                    // list order
                    const getLastOrder = await model.peopleJobs.max("list_order", {
                      where: {
                        people_id: peopleId,
                        status: "active",
                      },
                    });
                    if (!isPeopleJobExist) {
                      const data = {
                        people_id: peopleId,
                        job_id: peopleJobId,
                        list_order: getLastOrder ? getLastOrder + 1 : 1,
                        site_language: crewData.site_language ? crewData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.peopleJobs.create(data);
                    }
                  }
                }
              }
            }
          }
          // Creating people media - using schedular
          if (schedularAddData.length > 0) {
            const payload = { list: schedularAddData };
            const primaryDetailsPayload = { list: schedularPrimaryAddData };
            await Promise.all([
              schedulerJobService.addJobInScheduler(
                "people media update",
                JSON.stringify(payload),
                "people_media",
                "Sumbit all Movie Details",
                userId,
              ),
              schedulerJobService.addJobInScheduler(
                "add other language people primary data",
                JSON.stringify(primaryDetailsPayload),
                "people_language_primary_data",
                "Sumbit all Movie Details",
                userId,
              ),
            ]);
          }
        }
        // -----------------------------Tag details-------------------------------------
        let foundTagData = [];

        if (requestId.length > 0) {
          foundTagData = await model.titleRequestTag.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }

        if (foundTagData.length > 0) {
          const parsedGenreDetails =
            foundTagData[0].genre_details != null
              ? JSON.parse(foundTagData[0].genre_details)
              : null;
          const parsedTagDetails =
            foundTagData[0].tag_details != null ? JSON.parse(foundTagData[0].tag_details) : null;
          if (parsedGenreDetails != null && parsedGenreDetails.list.length > 0) {
            for (const value of parsedGenreDetails.list) {
              const genreData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagGable.create(genreData);
              actionDate = genreData.created_at;
            }
          }
          if (parsedTagDetails != null && parsedTagDetails.list.length > 0) {
            for (const value of parsedTagDetails.list) {
              const tagData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagGable.create(tagData);
              actionDate = tagData.created_at;
            }
          }
        }
      }
      if (findRequestId[0].type === "tv" && newTitle.id) {
        //   create the data in the Title countries table
        const countryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (countryDetails != null && countryDetails.list.length > 0) {
          for (const value of countryDetails.list) {
            const titleCountries = {
              title_id: newTitle.id,
              country_id: value.country_id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleCountries.create(titleCountries);
            actionDate = titleCountries.created_at;
          }
        }
        //   create the data in the connection table
        const connectionDetails =
          findRequestId[0].connection_details != null
            ? JSON.parse(findRequestId[0].connection_details)
            : null;
        if (connectionDetails != null && connectionDetails.list.length > 0) {
          for (const value of connectionDetails.list) {
            if (value.related_title_id) {
              const [checkConnection, checkOtherConnection] = await Promise.all([
                model.relatedTitle.findOne({
                  where: {
                    title_id: newTitle.id,
                    related_title_id: value.related_title_id,
                    status: "active",
                  },
                }),
                model.relatedTitle.findOne({
                  where: {
                    title_id: value.related_title_id,
                    related_title_id: newTitle.id,
                    status: "active",
                  },
                }),
              ]);

              if (!checkConnection) {
                const connectionData = {
                  title_id: newTitle.id,
                  related_title_id: value.related_title_id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  season_id: value.season_id ? value.season_id : null,
                  episode_id: value.episode_id ? value.episode_id : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }

              if (!checkOtherConnection) {
                const connectionData = {
                  title_id: value.related_title_id,
                  related_title_id: newTitle.id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  season_id: value.season_id ? value.season_id : null,
                  episode_id: value.episode_id ? value.episode_id : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }
            }
          }
        }
        // create a data for title_keywords details-tv details page-search keyword:
        const searchKeywordDetails =
          findRequestId[0].search_keyword_details != null
            ? JSON.parse(findRequestId[0].search_keyword_details)
            : null;
        if (searchKeywordDetails != null && searchKeywordDetails.list.length > 0) {
          for (const value of searchKeywordDetails.list) {
            const searchKeywordData = {
              title_id: newTitle.id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              keyword: value.keyword ? value.keyword : null,
              keyword_type: value.keyword_type ? value.keyword_type : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleKeyword.create(searchKeywordData);
            actionDate = searchKeywordData.created_at;
          }
        }
        // -----------------------------Tag details-------------------------------------
        let foundTagData = [];

        for (const value of findRequestId) {
          if (value.id) requestId.push(value.id);
        }
        if (requestId.length > 0) {
          foundTagData = await model.titleRequestTag.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }

        if (foundTagData.length > 0) {
          const parsedGenreDetails =
            foundTagData[0].genre_details != null
              ? JSON.parse(foundTagData[0].genre_details)
              : null;
          const parsedTagDetails =
            foundTagData[0].tag_details != null ? JSON.parse(foundTagData[0].tag_details) : null;
          if (parsedGenreDetails != null && parsedGenreDetails.list.length > 0) {
            for (const value of parsedGenreDetails.list) {
              const genreData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagGable.create(genreData);
              actionDate = genreData.created_at;
            }
          }
          if (parsedTagDetails != null && parsedTagDetails.list.length > 0) {
            for (const value of parsedTagDetails.list) {
              const tagData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagGable.create(tagData);
              actionDate = tagData.created_at;
            }
          }
        }

        // -----------------------------Season details-------------------------------------
        let foundRecentlyModifiedSeasonData = [];
        if (requestId.length > 0) {
          foundRecentlyModifiedSeasonData = await model.titleRequestSeasonDetails.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }
        const latestReqModified =
          foundRecentlyModifiedSeasonData && foundRecentlyModifiedSeasonData.length > 0
            ? foundRecentlyModifiedSeasonData[0].request_id
            : findRequestId[0].id;
        const anotherRequestId =
          findRequestId.length > 1 &&
          findRequestId[1].id &&
          findRequestId[1].id != latestReqModified
            ? findRequestId[1].id
            : findRequestId[0].id;

        const [foundSeasonData, foundCreditData, foundMediaData] = await Promise.all([
          model.titleRequestSeasonDetails.findAll({
            where: { request_id: latestReqModified, status: "active" },
          }),
          model.titleRequestCredit.findAll({
            where: { request_id: latestReqModified, status: "active" },
          }),
          model.titleRequestMedia.findAll({
            where: { request_id: latestReqModified, status: "active" },
          }),
        ]);

        if (foundSeasonData.length > 0) {
          for (const titleSeasonData of foundSeasonData) {
            const seasonWatchOnStreamList = [];
            const seasonWatchOnBuyList = [];
            const seasonWatchOnRentList = [];
            const parsedSeasonData =
              titleSeasonData.season_details != null
                ? JSON.parse(titleSeasonData.season_details)
                : null;
            if (parsedSeasonData != null) {
              const seasonData = {
                release_date: parsedSeasonData.release_date ? parsedSeasonData.release_date : null,
                release_date_to: parsedSeasonData.release_date_to
                  ? parsedSeasonData.release_date_to
                  : null,
                poster: parsedSeasonData.poster ? parsedSeasonData.poster : null,
                number: parsedSeasonData.number,
                season_name: parsedSeasonData.season_name ? parsedSeasonData.season_name : null,
                title_id: newTitle.id ? newTitle.id : null,
                title_tmdb_id: newTitle.tmdb_id ? newTitle.tmdb_id : null,
                summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                episode_count: parsedSeasonData.episode_count,
                site_language: parsedSeasonData.site_language
                  ? parsedSeasonData.site_language
                  : "en",
                created_by: userId,
              };
              const createSeasonData = await model.season.create(seasonData);
              actionDate = seasonData.created_at;
              if (createSeasonData.id) {
                // create record for season translation:
                const seasonTranslationData = {
                  season_id: createSeasonData.id,
                  season_name: parsedSeasonData.season_name ? parsedSeasonData.season_name : null,
                  summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                  aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  episode_count: parsedSeasonData.episode_count,
                  site_language: parsedSeasonData.site_language
                    ? parsedSeasonData.site_language
                    : "en",
                  created_by: userId,
                };
                await model.seasonTranslation.create(seasonTranslationData);
                actionDate = seasonTranslationData.created_at;
                // adding korean or english language data if two request is present
                if (anotherRequestId) {
                  const anotherRequestDetails = await model.titleRequestSeasonDetails.findOne({
                    where: {
                      request_id: anotherRequestId,
                      season_no: parsedSeasonData.number,
                    },
                  });
                  if (anotherRequestDetails) {
                    const anotherParsedSeasonData =
                      anotherRequestDetails.season_details != null
                        ? JSON.parse(anotherRequestDetails.season_details)
                        : null;
                    if (anotherParsedSeasonData) {
                      const seasonTranslationData = {
                        season_id: createSeasonData.id,
                        season_name: anotherParsedSeasonData.season_name
                          ? anotherParsedSeasonData.season_name
                          : null,
                        summary: anotherParsedSeasonData.summary
                          ? anotherParsedSeasonData.summary
                          : null,
                        aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        episode_count: anotherParsedSeasonData.episode_count,
                        site_language: anotherParsedSeasonData.site_language
                          ? anotherParsedSeasonData.site_language
                          : "en",
                        created_by: userId,
                      };
                      await model.seasonTranslation.create(seasonTranslationData);
                      actionDate = seasonTranslationData.created_at;
                    }
                  }
                }
              }

              // List Order :
              let mediaListOrder = 1;
              let titleImageListOrder = 1;

              //-------------------------episode data---------------------------
              const foundEpisodeData = await model.titleRequestEpisodeDetails.findOne({
                where: {
                  request_id: latestReqModified,
                  request_season_id: titleSeasonData.id,
                  status: "active",
                },
              });
              // for other language data
              if (foundEpisodeData) {
                // Other language data for the same season number
                let parsedOtherLanEpisodeData = "";
                const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                  where: {
                    season_no: parsedSeasonData.number,
                    request_id: anotherRequestId,
                  },
                });
                if (findSeasonReqId) {
                  const findOtherLanEpisodeDetails = await model.titleRequestEpisodeDetails.findOne(
                    {
                      where: {
                        request_id: anotherRequestId,
                        request_season_id: findSeasonReqId.id,
                        status: "active",
                      },
                    },
                  );
                  if (findOtherLanEpisodeDetails) {
                    parsedOtherLanEpisodeData =
                      findOtherLanEpisodeDetails.episode_details != null
                        ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                        : null;
                  }
                }
                const parsedEpisodeData =
                  foundEpisodeData.episode_details != null
                    ? JSON.parse(foundEpisodeData.episode_details)
                    : null;
                if (parsedEpisodeData != null) {
                  for (const episodeValue of parsedEpisodeData.list) {
                    const episodeData = {
                      name: episodeValue.name,
                      description: episodeValue.description ? episodeValue.description : null,
                      poster: episodeValue.poster ? episodeValue.poster : null,
                      release_date: episodeValue.release_date ? episodeValue.release_date : null,
                      title_id: newTitle.id,
                      season_id: createSeasonData.id,
                      season_number: createSeasonData.number,
                      episode_number: episodeValue.episode_number,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      temp_id: episodeValue.temp_id ? episodeValue.temp_id : null,
                      tmdb_vote_count: episodeValue.tmdb_vote_count
                        ? episodeValue.tmdb_vote_count
                        : null,
                      tmdb_vote_average: episodeValue.tmdb_vote_average
                        ? episodeValue.tmdb_vote_average
                        : null,
                      local_vote_average: episodeValue.local_vote_average
                        ? episodeValue.local_vote_average
                        : null,
                      year: episodeValue.year ? episodeValue.year : null,
                      popularity: episodeValue.popularity ? episodeValue.popularity : null,
                      tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                      rating_percent: episodeValue.rating_percent
                        ? episodeValue.rating_percent
                        : null,
                      site_language: episodeValue.site_language ? episodeValue.site_language : "en",
                      created_by: userId,
                    };
                    const createdEpisode = await model.episode.create(episodeData);
                    actionDate = episodeData.created_at;
                    // create episode translation data
                    if (createdEpisode.id) {
                      const episodeTranslationData = {
                        episode_id: createdEpisode.id,
                        name: episodeValue.name,
                        description: episodeValue.description ? episodeValue.description : null,
                        site_language: episodeValue.site_language
                          ? episodeValue.site_language
                          : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.episodeTranslation.create(episodeTranslationData);
                      actionDate = episodeTranslationData.created_at;
                      // create other language episode translation data
                      if (parsedOtherLanEpisodeData != null && parsedOtherLanEpisodeData != "") {
                        for (const value of parsedOtherLanEpisodeData.list) {
                          if (value.episode_number == episodeValue.episode_number) {
                            const episodeTranslationData = {
                              episode_id: createdEpisode.id,
                              name: value.name,
                              description: value.description ? value.description : null,
                              site_language: value.site_language ? value.site_language : "en",
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            await model.episodeTranslation.create(episodeTranslationData);
                            actionDate = episodeTranslationData.created_at;
                          }
                        }
                      }
                    }
                    // create poster image of eposides form data
                    if (episodeValue.poster != null && episodeValue.poster != "") {
                      const fileName = episodeValue.poster
                        ? episodeValue.poster.substring(episodeValue.poster.lastIndexOf("/") + 1)
                        : null;
                      const posterImageData = {
                        file_name: fileName ? fileName : null,
                        path: episodeValue.poster ? episodeValue.poster : null,
                        title_id: newTitle.id,
                        season_id: createSeasonData.id ? createSeasonData.id : null,
                        episode_id: createdEpisode.id ? createdEpisode.id : null,
                        list_order: titleImageListOrder,
                        image_category: "poster_image",
                        is_main_poster: "y",
                        site_language: parsedSeasonData.site_language
                          ? parsedSeasonData.site_language
                          : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.titleImage.create(posterImageData);
                      actionDate = posterImageData.created_at;
                      titleImageListOrder += 1;
                    }
                  }
                }
              }

              // for season search_keyword_details,news search keyword, watch on details on the season page
              const seasonSearchKeywordDetails =
                titleSeasonData.season_search_keyword_details != null
                  ? JSON.parse(titleSeasonData.season_search_keyword_details)
                  : null;
              if (
                seasonSearchKeywordDetails != null &&
                seasonSearchKeywordDetails.list.length > 0
              ) {
                for (const value of seasonSearchKeywordDetails.list) {
                  const searchKeywordData = {
                    title_id: newTitle.id,
                    season_id: createSeasonData.id,
                    site_language: value.site_language ? value.site_language : "en",
                    keyword: value.keyword ? value.keyword : null,
                    keyword_type: value.keyword_type ? value.keyword_type : null,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.titleKeyword.create(searchKeywordData);
                  actionDate = searchKeywordData.created_at;
                }
              }
              const seasonNewsKeywordDetails =
                titleSeasonData.season_news_search_keyword_details != null
                  ? JSON.parse(titleSeasonData.season_news_search_keyword_details)
                  : null;
              if (seasonNewsKeywordDetails != null && seasonNewsKeywordDetails.list.length > 0) {
                for (const value of seasonNewsKeywordDetails.list) {
                  const newsKeywordData = {
                    title_id: newTitle.id,
                    season_id: createSeasonData.id ? createSeasonData.id : null,
                    site_language: value.site_language ? value.site_language : "en",
                    keyword: value.keyword ? value.keyword : null,
                    keyword_type: value.keyword_type ? value.keyword_type : null,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.titleKeyword.create(newsKeywordData);
                  actionDate = newsKeywordData.created_at;
                }
              }
              // channel Details update
              const seasonChannelDetails =
                titleSeasonData.season_channel_details != null
                  ? JSON.parse(titleSeasonData.season_channel_details)
                  : null;
              if (seasonChannelDetails != null && seasonChannelDetails.list.length > 0) {
                for (const value of seasonChannelDetails.list) {
                  const channelData = {
                    title_id: newTitle.id,
                    url: value.url ? value.url : null,
                    tv_network_id: value.tv_network_id ? value.tv_network_id : null,
                    season_id: createSeasonData.id ? createSeasonData.id : null,
                    episode_id: value.episode_id ? value.episode_id : null,
                    site_language: value.site_language ? value.site_language : "en",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.titleChannelList.create(channelData);
                  actionDate = channelData.created_at;
                }
              }
              // create data in watch on
              const seasonWatchOnStreamDetails =
                titleSeasonData.season_watch_on_stream_details != null
                  ? JSON.parse(titleSeasonData.season_watch_on_stream_details)
                  : null;
              const seasonWatchOnRentDetails =
                titleSeasonData.season_watch_on_rent_details != null
                  ? JSON.parse(titleSeasonData.season_watch_on_rent_details)
                  : null;
              const seasonWatchOnBuyDetails =
                titleSeasonData.season_watch_on_buy_details != null
                  ? JSON.parse(titleSeasonData.season_watch_on_buy_details)
                  : null;
              if (
                seasonWatchOnStreamDetails != null &&
                seasonWatchOnStreamDetails.list.length > 0
              ) {
                for (const value of seasonWatchOnStreamDetails.list) {
                  if (
                    seasonWatchOnStreamList.length === 0 ||
                    seasonWatchOnStreamList.indexOf(value.provider_id) === -1
                  ) {
                    seasonWatchOnStreamList.push(value.provider_id);
                    const watchOnData = {
                      title_id: newTitle.id,
                      movie_id: value.movie_id ? value.movie_id : null,
                      url: value.url ? value.url : null,
                      type: value.type ? value.type : null,
                      provider_id: value.provider_id ? value.provider_id : null,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: value.episode_id ? value.episode_id : null,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (newTitle.id) {
                      await model.titleWatchOn.create(watchOnData);
                      actionDate = watchOnData.created_at;
                    }
                  }
                }
              }
              if (seasonWatchOnRentDetails != null && seasonWatchOnRentDetails.list.length > 0) {
                for (const value of seasonWatchOnRentDetails.list) {
                  if (
                    seasonWatchOnRentList.length === 0 ||
                    seasonWatchOnRentList.indexOf(value.provider_id) === -1
                  ) {
                    seasonWatchOnRentList.push(value.provider_id);
                    const watchOnData = {
                      title_id: newTitle.id,
                      movie_id: value.movie_id ? value.movie_id : null,
                      url: value.url ? value.url : null,
                      type: value.type ? value.type : null,
                      provider_id: value.provider_id ? value.provider_id : null,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: value.episode_id ? value.episode_id : null,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (newTitle.id) {
                      await model.titleWatchOn.create(watchOnData);
                      actionDate = watchOnData.created_at;
                    }
                  }
                }
              }
              if (seasonWatchOnBuyDetails != null && seasonWatchOnBuyDetails.list.length > 0) {
                for (const value of seasonWatchOnBuyDetails.list) {
                  if (
                    seasonWatchOnBuyList.length === 0 ||
                    seasonWatchOnBuyList.indexOf(value.provider_id) === -1
                  ) {
                    seasonWatchOnBuyList.push(value.provider_id);
                    const watchOnData = {
                      title_id: newTitle.id,
                      movie_id: value.movie_id ? value.movie_id : null,
                      url: value.url ? value.url : null,
                      type: value.type ? value.type : null,
                      provider_id: value.provider_id ? value.provider_id : null,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: value.episode_id ? value.episode_id : null,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (newTitle.id) {
                      await model.titleWatchOn.create(watchOnData);
                      actionDate = watchOnData.created_at;
                    }
                  }
                }
              }

              // storing the media details ::
              if (foundMediaData.length > 0) {
                for (const titleMediaData of foundMediaData) {
                  const parsedVideoDetails =
                    titleMediaData.video_details != null
                      ? JSON.parse(titleMediaData.video_details)
                      : null;
                  const parsedImageDetails =
                    titleMediaData.image_details != null
                      ? JSON.parse(titleMediaData.image_details)
                      : null;
                  const parsedPosterDetails =
                    titleMediaData.poster_image_details != null
                      ? JSON.parse(titleMediaData.poster_image_details)
                      : null;
                  const parsedBackgroundImageDetails =
                    titleMediaData.background_image_details != null
                      ? JSON.parse(titleMediaData.background_image_details)
                      : null;
                  if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
                    for (const value of parsedVideoDetails.list) {
                      if (titleSeasonData.id === value.season) {
                        const videoData = {
                          name: value.name,
                          thumbnail: value.thumbnail ? value.thumbnail : null,
                          url: value.url ? value.url : null,
                          type: value.type,
                          quality: value.quality ? value.quality : null,
                          title_id: newTitle.id,
                          season: createSeasonData.id ? createSeasonData.id : null,
                          episode: value.episode ? value.episode : null,
                          source: value.source ? value.source : "local",
                          negative_votes: value.negative_votes ? value.negative_votes : 0,
                          positive_votes: value.positive_votes ? value.positive_votes : 0,
                          reports: value.reports ? value.reports : 0,
                          approved: value.approved ? value.approved : 1,
                          list_order: mediaListOrder,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          user_id: userId,
                          category: value.category ? value.category : "trailer",
                          is_official_trailer: value.is_official_trailer
                            ? value.is_official_trailer
                            : null,
                          site_language: value.site_language ? value.site_language : "en",
                          created_by: userId,
                          video_source: value.url
                            ? await generalHelper.checkUrlSource(value.url)
                            : "youtube",
                          video_for: "title",
                          no_of_view: value.no_of_view ? value.no_of_view : 0,
                          video_duration: value.video_duration ? value.video_duration : null,
                          ele_no_of_view: 0,
                        };
                        await model.video.create(videoData);
                        actionDate = videoData.created_at;
                        isVideoAdded = true;
                        mediaListOrder += 1;
                      }
                    }
                  }
                  if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
                    for (const value of parsedImageDetails.list) {
                      if (titleSeasonData.id === value.season_id) {
                        const imageData = {
                          original_name: value.original_name ? value.original_name : null,
                          file_name: value.file_name ? value.file_name : null,
                          url: value.url ? value.url : null,
                          path: value.path ? value.path : null,
                          file_size: value.file_size ? value.file_size : null,
                          mime_type: value.mime_type ? value.mime_type : null,
                          file_extension: value.file_extension ? value.file_extension : null,
                          title_id: newTitle.id,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: value.episode_id ? value.episode_id : null,
                          source: value.source ? value.source : "local",
                          approved: value.approved ? value.approved : 1,
                          list_order: titleImageListOrder,
                          image_category: value.image_category ? value.image_category : "image",
                          is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                          site_language: value.site_language ? value.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleImage.create(imageData);
                        actionDate = imageData.created_at;
                        titleImageListOrder += 1;
                      }
                    }
                  }
                  if (parsedPosterDetails != null && parsedPosterDetails.list.length > 0) {
                    for (const posterValue of parsedPosterDetails.list) {
                      if (titleSeasonData.id === posterValue.season_id) {
                        const posterImageData = {
                          original_name: posterValue.original_name
                            ? posterValue.original_name
                            : null,
                          file_name: posterValue.file_name ? posterValue.file_name : null,
                          url: posterValue.url ? posterValue.url : null,
                          path: posterValue.path ? posterValue.path : null,
                          file_size: posterValue.file_size ? posterValue.file_size : null,
                          mime_type: posterValue.mime_type ? posterValue.mime_type : null,
                          file_extension: posterValue.file_extension
                            ? posterValue.file_extension
                            : null,
                          title_id: newTitle.id,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: posterValue.episode_id ? posterValue.episode_id : null,
                          source: posterValue.source ? posterValue.source : "local",
                          approved: posterValue.approved ? posterValue.approved : 1,
                          list_order: titleImageListOrder,
                          image_category: posterValue.image_category
                            ? posterValue.image_category
                            : "poster_image",
                          is_main_poster: posterValue.is_main_poster
                            ? posterValue.is_main_poster
                            : null,
                          site_language: posterValue.site_language
                            ? posterValue.site_language
                            : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleImage.create(posterImageData);
                        actionDate = posterImageData.created_at;
                        titleImageListOrder += 1;
                      }
                    }
                  }
                  if (
                    parsedBackgroundImageDetails != null &&
                    parsedBackgroundImageDetails.list.length > 0
                  ) {
                    for (const value of parsedBackgroundImageDetails.list) {
                      if (titleSeasonData.id === value.season_id) {
                        const backgroundImageData = {
                          original_name: value.original_name ? value.original_name : null,
                          file_name: value.file_name ? value.file_name : null,
                          url: value.url ? value.url : null,
                          path: value.path ? value.path : null,
                          file_size: value.file_size ? value.file_size : null,
                          mime_type: value.mime_type ? value.mime_type : null,
                          file_extension: value.file_extension ? value.file_extension : null,
                          title_id: newTitle.id,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: value.episode_id ? value.episode_id : null,
                          source: value.source ? value.source : "local",
                          approved: value.approved ? value.approved : 1,
                          list_order: titleImageListOrder,
                          image_category: value.image_category ? value.image_category : "bg_image",
                          is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                          site_language: value.site_language ? value.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleImage.create(backgroundImageData);
                        actionDate = backgroundImageData.created_at;
                        titleImageListOrder += 1;
                      }
                    }
                  }
                }
              }
              // storing the credit data:
              if (foundCreditData.length > 0) {
                let schedularAddData = [];
                let schedularPrimaryAddData = [];
                for (const titleCreditData of foundCreditData) {
                  const parsedCastDetails =
                    titleCreditData.cast_details != null
                      ? JSON.parse(titleCreditData.cast_details)
                      : null;
                  const parsedCrewDetails =
                    titleCreditData.crew_details != null
                      ? JSON.parse(titleCreditData.crew_details)
                      : null;
                  if (parsedCastDetails != null && parsedCastDetails.list.length > 0) {
                    let peopleData = {};
                    for (const castData of parsedCastDetails.list) {
                      let peopleId = 0;
                      if (
                        castData.people_id === "" &&
                        (castData.cast_name != null || castData.cast_name != "") &&
                        titleSeasonData.id === castData.season_id
                      ) {
                        // Two scenarios:
                        // 1. people Id is not present and TMDB id present
                        // 2. people Id is not present and TMDB id is not present - create new people pop up modal
                        if (castData.tmdb_id) {
                          const getPeople = await model.people.findOne({
                            attributes: ["id"],
                            where: { tmdb_id: castData.tmdb_id, status: { [Op.ne]: "deleted" } },
                            include: [
                              {
                                model: model.peopleTranslation,
                                left: true,
                                where: {
                                  name: castData.cast_name,
                                  status: { [Op.ne]: "deleted" },
                                },
                              },
                            ],
                          });
                          if (getPeople) {
                            peopleId = getPeople.id;
                          } else {
                            const siteLanguage = castData.site_language
                              ? castData.site_language
                              : "en";
                            const swipLanguage = await generalHelper.swipeLanguage(siteLanguage);
                            const getPeopleData = await tmdbService.fetchPeopleDetails(
                              castData.tmdb_id,
                              siteLanguage,
                            );
                            const createCast = {
                              poster: castData.poster,
                              tmdb_id: castData.tmdb_id,
                              uuid: await generalHelper.uuidv4(),
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            if (
                              getPeopleData &&
                              getPeopleData.results &&
                              getPeopleData.results != null &&
                              getPeopleData.results != "undefined"
                            ) {
                              createCast.tmdb_id = getPeopleData.results.tmdb_id;
                              let gender = null;
                              if (
                                getPeopleData.results.gender &&
                                getPeopleData.results.gender == 2
                              ) {
                                gender = "male";
                              }
                              if (
                                getPeopleData.results.gender &&
                                getPeopleData.results.gender == 1
                              ) {
                                gender = "female";
                              }
                              createCast.gender = gender;
                              createCast.birth_date = getPeopleData.results.birth_day
                                ? getPeopleData.results.birth_day
                                : null;
                              createCast.imdb_id = getPeopleData.results.imdb_id
                                ? getPeopleData.results.imdb_id
                                : null;
                              createCast.official_site = getPeopleData.results.homepage
                                ? getPeopleData.results.homepage
                                : null;
                              createCast.death_date = getPeopleData.results.death_day
                                ? getPeopleData.results.death_day
                                : null;
                              createCast.adult =
                                getPeopleData.results.adult && getPeopleData.results.adult === true
                                  ? 1
                                  : 0;
                              createCast.popularity = getPeopleData.results.popularity
                                ? getPeopleData.results.popularity
                                : null;
                            }
                            const createPeople = await model.people.create(createCast);
                            if (createPeople.id) {
                              peopleId = createPeople.id;
                              payloadPeopleList.push({
                                record_id: peopleId,
                                type: "people",
                                action: "add",
                              });
                              peopleData = {
                                people_id: createPeople.id,
                                name: castData.cast_name,
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                                site_language: castData.site_language
                                  ? castData.site_language
                                  : "en",
                              };
                              if (
                                getPeopleData &&
                                getPeopleData.results &&
                                getPeopleData.results != null &&
                                getPeopleData.results != "undefined"
                              ) {
                                peopleData.description = getPeopleData.results.biography
                                  ? getPeopleData.results.biography
                                  : null;
                                peopleData.known_for = getPeopleData.results.aka
                                  ? getPeopleData.results.aka
                                  : null;
                              }
                              if (
                                !(await model.peopleTranslation.findOne({
                                  where: {
                                    people_id: peopleId,
                                    site_language: castData.site_language
                                      ? castData.site_language
                                      : "en",
                                  },
                                }))
                              ) {
                                await model.peopleTranslation.create(peopleData);
                              }
                              // Add details to the country table
                              const countryName = getPeopleData.results.place_of_birth
                                ? getPeopleData.results.place_of_birth
                                : null;
                              const createdBy = userId;
                              const langEn = castData.site_language ? castData.site_language : "en";
                              if (countryName) {
                                await importTitleTmdbService.addPeopleCountry(
                                  countryName,
                                  peopleId,
                                  createdBy,
                                  langEn,
                                );
                              }

                              // adding image details to the people image table
                              if (castData.poster) {
                                const fileName = castData.poster.substring(
                                  castData.poster.lastIndexOf("/") + 1,
                                );
                                const getLastOrder = await model.peopleImages.max("list_order", {
                                  where: {
                                    people_id: createPeople.id,
                                    image_category: "poster_image",
                                  },
                                });
                                const peoplePosterImageData = {
                                  original_name: fileName ? fileName : null,
                                  file_name: fileName ? fileName : null,
                                  path: castData.poster ? castData.poster : null,
                                  people_id: createPeople.id,
                                  source: "local",
                                  list_order: getLastOrder ? getLastOrder + 1 : 1,
                                  image_category: "poster_image",
                                  is_main_poster: "y",
                                  site_language: castData.site_language
                                    ? castData.site_language
                                    : "en",
                                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                                  created_by: userId,
                                };
                                await model.peopleImages.create(peoplePosterImageData);
                              }

                              // adding news search keyword
                              if (castData.cast_name) {
                                const newsKeywordData = {
                                  people_id: peopleId,
                                  site_language: castData.site_language
                                    ? castData.site_language
                                    : "en",
                                  keyword: castData.cast_name,
                                  keyword_type: "news",
                                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                                  created_by: userId,
                                };
                                await model.peopleKeywords.create(newsKeywordData);
                              }
                              // add data to the schedular table
                              const schedularData = {
                                tmdb_id: castData.tmdb_id,
                                site_language: siteLanguage,
                                people_id: peopleId,
                                created_by: userId,
                              };
                              schedularAddData.push(schedularData);

                              // add data to the schedular table - people primary details other language
                              const schedularPrimaryData = {
                                tmdb_id: castData.tmdb_id,
                                site_language: siteLanguage,
                                people_id: peopleId,
                                created_by: userId,
                                expected_site_language: swipLanguage,
                              };
                              schedularPrimaryAddData.push(schedularPrimaryData);
                            }
                          }
                        } else {
                          const createCast = {
                            uuid: await generalHelper.uuidv4(),
                            poster: castData.poster,
                            created_at: await customDateTimeHelper.getCurrentDateTime(),
                            created_by: userId,
                          };
                          const createPeople = await model.people.create(createCast);
                          if (createPeople.id) {
                            peopleId = createPeople.id;
                            payloadPeopleList.push({
                              record_id: peopleId,
                              type: "people",
                              action: "add",
                            });
                            peopleData = {
                              people_id: createPeople.id,
                              name: castData.cast_name,
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                              site_language: castData.site_language ? castData.site_language : "en",
                            };
                            if (
                              !(await model.peopleTranslation.findOne({
                                where: {
                                  people_id: peopleId,
                                  site_language: castData.site_language
                                    ? castData.site_language
                                    : "en",
                                },
                              }))
                            ) {
                              await model.peopleTranslation.create(peopleData);
                            }
                            // adding image details to the people image table
                            if (castData.poster) {
                              const fileName = castData.poster.substring(
                                castData.poster.lastIndexOf("/") + 1,
                              );
                              const getLastOrder = await model.peopleImages.max("list_order", {
                                where: {
                                  people_id: createPeople.id,
                                  image_category: "poster_image",
                                },
                              });
                              const peoplePosterImageData = {
                                original_name: fileName ? fileName : null,
                                file_name: fileName ? fileName : null,
                                path: castData.poster ? castData.poster : null,
                                people_id: createPeople.id,
                                source: "local",
                                list_order: getLastOrder ? getLastOrder + 1 : 1,
                                image_category: "poster_image",
                                is_main_poster: "y",
                                site_language: castData.site_language
                                  ? castData.site_language
                                  : "en",
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              await model.peopleImages.create(peoplePosterImageData);
                            }
                          }
                        }
                      } else {
                        peopleId = castData.people_id;
                      }
                      if (titleSeasonData.id === castData.season_id && peopleId) {
                        const castDataDetails = {
                          people_id: peopleId,
                          creditable_id: newTitle.id,
                          character_name: castData.character_name ? castData.character_name : null,
                          list_order: castData.list_order,
                          department: castData.department ? castData.department : null,
                          job: castData.job ? castData.job : null,
                          creditable_type: castData.creditable_type
                            ? castData.creditable_type
                            : null,
                          is_guest: castData.is_guest ? castData.is_guest : 0,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: castData.episode_id ? castData.episode_id : null,
                          site_language: castData.site_language ? castData.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        // check for creditable table - record already exist or not
                        const isCreditableExist = await model.creditable.findOne({
                          where: {
                            people_id: peopleId,
                            creditable_id: newTitle.id,
                            character_name: castData.character_name,
                            department: castData.department,
                            job: castData.job,
                            season_id: createSeasonData.id,
                            creditable_type: castData.creditable_type,
                            status: "active",
                          },
                        });

                        if (!isCreditableExist) {
                          await model.creditable.create(castDataDetails);
                          actionDate = castDataDetails.created_at;
                        }
                        if (castData.job) {
                          // get departmentSercive
                          const departmentName = castData.job == "Acting" ? "Actors" : castData.job;
                          const deptId = await departmentService.getDepartmentIdByName(
                            departmentName,
                          );
                          if (deptId) {
                            // check for people job table
                            const isPeopleJobExist = await model.peopleJobs.findOne({
                              where: {
                                people_id: peopleId,
                                job_id: deptId,
                                status: "active",
                              },
                            });
                            // list order
                            const getLastOrder = await model.peopleJobs.max("list_order", {
                              where: {
                                people_id: peopleId,
                                status: "active",
                              },
                            });
                            if (!isPeopleJobExist) {
                              const data = {
                                people_id: peopleId,
                                job_id: deptId,
                                list_order: getLastOrder ? getLastOrder + 1 : 1,
                                site_language: castData.site_language
                                  ? castData.site_language
                                  : "en",
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              await model.peopleJobs.create(data);
                            }
                          }
                        }
                      }
                    }
                  }
                  if (parsedCrewDetails != null && parsedCrewDetails.list.length > 0) {
                    let peopleCrewData = {};
                    for (const crewData of parsedCrewDetails.list) {
                      let peopleId = 0;
                      if (
                        crewData.people_id === "" &&
                        (crewData.cast_name != null || crewData.cast_name != "") &&
                        titleSeasonData.id === crewData.season_id
                      ) {
                        if (crewData.tmdb_id) {
                          const getPeople = await model.people.findOne({
                            attributes: ["id"],
                            where: { tmdb_id: crewData.tmdb_id, status: { [Op.ne]: "deleted" } },
                            include: [
                              {
                                model: model.peopleTranslation,
                                left: true,
                                where: {
                                  name: crewData.cast_name,
                                  status: { [Op.ne]: "deleted" },
                                },
                              },
                            ],
                          });
                          if (getPeople) {
                            peopleId = getPeople.id;
                          } else {
                            const siteLanguage = crewData.site_language
                              ? crewData.site_language
                              : "en";
                            const swipLanguage = await generalHelper.swipeLanguage(siteLanguage);
                            const getPeopleData = await tmdbService.fetchPeopleDetails(
                              crewData.tmdb_id,
                              siteLanguage,
                            );
                            const createCrew = {
                              poster: crewData.poster,
                              tmdb_id: crewData.tmdb_id,
                              uuid: await generalHelper.uuidv4(),
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            if (
                              getPeopleData &&
                              getPeopleData.results &&
                              getPeopleData.results != null &&
                              getPeopleData.results != "undefined"
                            ) {
                              createCrew.tmdb_id = getPeopleData.results.tmdb_id;
                              let gender = null;
                              if (
                                getPeopleData.results.gender &&
                                getPeopleData.results.gender == 2
                              ) {
                                gender = "male";
                              }
                              if (
                                getPeopleData.results.gender &&
                                getPeopleData.results.gender == 1
                              ) {
                                gender = "female";
                              }
                              createCrew.gender = gender;
                              createCrew.birth_date = getPeopleData.results.birth_day
                                ? getPeopleData.results.birth_day
                                : null;
                              createCrew.imdb_id = getPeopleData.results.imdb_id
                                ? getPeopleData.results.imdb_id
                                : null;
                              createCrew.official_site = getPeopleData.results.homepage
                                ? getPeopleData.results.homepage
                                : null;
                              createCrew.death_date = getPeopleData.results.death_day
                                ? getPeopleData.results.death_day
                                : null;
                              createCrew.adult =
                                getPeopleData.results.adult && getPeopleData.results.adult === true
                                  ? 1
                                  : 0;
                              createCrew.popularity = getPeopleData.results.popularity
                                ? getPeopleData.results.popularity
                                : null;
                            }
                            const createPeople = await model.people.create(createCrew);
                            if (createPeople.id) {
                              peopleId = createPeople.id;
                              payloadPeopleList.push({
                                record_id: peopleId,
                                type: "people",
                                action: "add",
                              });
                              peopleCrewData = {
                                people_id: createPeople.id,
                                name: crewData.cast_name,
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                                site_language: crewData.site_language
                                  ? crewData.site_language
                                  : "en",
                              };
                              if (
                                getPeopleData &&
                                getPeopleData.results &&
                                getPeopleData.results != null &&
                                getPeopleData.results != "undefined"
                              ) {
                                peopleCrewData.description = getPeopleData.results.biography
                                  ? getPeopleData.results.biography
                                  : null;
                                peopleCrewData.known_for = getPeopleData.results.aka
                                  ? getPeopleData.results.aka
                                  : null;
                              }
                              if (
                                !(await model.peopleTranslation.findOne({
                                  where: {
                                    people_id: peopleId,
                                    site_language: crewData.site_language
                                      ? crewData.site_language
                                      : "en",
                                  },
                                }))
                              ) {
                                await model.peopleTranslation.create(peopleCrewData);
                              }
                              // Add details to the country table
                              const countryName = getPeopleData.results.place_of_birth
                                ? getPeopleData.results.place_of_birth
                                : null;
                              const createdBy = userId;
                              const langEn = crewData.site_language ? crewData.site_language : "en";
                              if (countryName) {
                                await importTitleTmdbService.addPeopleCountry(
                                  countryName,
                                  peopleId,
                                  createdBy,
                                  langEn,
                                );
                              }
                              // adding image details to the people image table
                              if (crewData.poster) {
                                const fileName = crewData.poster.substring(
                                  crewData.poster.lastIndexOf("/") + 1,
                                );
                                const getLastOrder = await model.peopleImages.max("list_order", {
                                  where: {
                                    people_id: createPeople.id,
                                    image_category: "poster_image",
                                  },
                                });
                                const peoplePosterImageData = {
                                  original_name: fileName ? fileName : null,
                                  file_name: fileName ? fileName : null,
                                  path: crewData.poster ? crewData.poster : null,
                                  people_id: createPeople.id,
                                  source: "local",
                                  list_order: getLastOrder ? getLastOrder + 1 : 1,
                                  image_category: "poster_image",
                                  is_main_poster: "y",
                                  site_language: crewData.site_language
                                    ? crewData.site_language
                                    : "en",
                                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                                  created_by: userId,
                                };
                                await model.peopleImages.create(peoplePosterImageData);
                              }
                              // adding news search keyword
                              if (crewData.cast_name) {
                                const newsKeywordData = {
                                  people_id: peopleId,
                                  site_language: crewData.site_language
                                    ? crewData.site_language
                                    : "en",
                                  keyword: crewData.cast_name,
                                  keyword_type: "news",
                                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                                  created_by: userId,
                                };
                                await model.peopleKeywords.create(newsKeywordData);
                              }
                              // add data to the schedular table
                              const schedularData = {
                                tmdb_id: crewData.tmdb_id,
                                site_language: siteLanguage,
                                people_id: peopleId,
                                created_by: userId,
                              };
                              schedularAddData.push(schedularData);

                              // add data to the schedular table - people primary details other language
                              const schedularPrimaryData = {
                                tmdb_id: crewData.tmdb_id,
                                site_language: siteLanguage,
                                people_id: peopleId,
                                created_by: userId,
                                expected_site_language: swipLanguage,
                              };
                              schedularPrimaryAddData.push(schedularPrimaryData);
                            }
                          }
                        } else {
                          const createCrew = {
                            uuid: await generalHelper.uuidv4(),
                            poster: crewData.poster,
                            created_at: await customDateTimeHelper.getCurrentDateTime(),
                            created_by: userId,
                          };
                          const createPeople = await model.people.create(createCrew);
                          if (createPeople.id) {
                            peopleId = createPeople.id;
                            payloadPeopleList.push({
                              record_id: peopleId,
                              type: "people",
                              action: "add",
                            });
                            peopleCrewData = {
                              people_id: createPeople.id,
                              name: crewData.cast_name,
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                              site_language: crewData.site_language ? crewData.site_language : "en",
                            };
                            if (
                              !(await model.peopleTranslation.findOne({
                                where: {
                                  people_id: peopleId,
                                  site_language: crewData.site_language
                                    ? crewData.site_language
                                    : "en",
                                },
                              }))
                            ) {
                              await model.peopleTranslation.create(peopleCrewData);
                            }
                            // adding image details to the people image table
                            if (crewData.poster) {
                              const fileName = crewData.poster.substring(
                                crewData.poster.lastIndexOf("/") + 1,
                              );
                              const getLastOrder = await model.peopleImages.max("list_order", {
                                where: {
                                  people_id: createPeople.id,
                                  image_category: "poster_image",
                                },
                              });
                              const peoplePosterImageData = {
                                original_name: fileName ? fileName : null,
                                file_name: fileName ? fileName : null,
                                path: crewData.poster ? crewData.poster : null,
                                people_id: createPeople.id,
                                source: "local",
                                list_order: getLastOrder ? getLastOrder + 1 : 1,
                                image_category: "poster_image",
                                is_main_poster: "y",
                                site_language: crewData.site_language
                                  ? crewData.site_language
                                  : "en",
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              await model.peopleImages.create(peoplePosterImageData);
                            }
                          }
                        }
                      } else {
                        peopleId = crewData.people_id;
                      }
                      if (titleSeasonData.id === crewData.season_id && peopleId) {
                        const crewDataDetails = {
                          people_id: peopleId,
                          creditable_id: newTitle.id,
                          character_name: crewData.character_name ? crewData.character_name : null,
                          list_order: crewData.list_order,
                          department: crewData.department ? crewData.department : null,
                          job: crewData.job ? crewData.job : null,
                          creditable_type: crewData.creditable_type
                            ? crewData.creditable_type
                            : null,
                          is_guest: crewData.is_guest ? crewData.is_guest : 0,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: crewData.episode_id ? crewData.episode_id : null,
                          site_language: crewData.site_language ? crewData.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const isCreditableExist = await model.creditable.findOne({
                          where: {
                            people_id: peopleId,
                            creditable_id: newTitle.id,
                            department: crewData.department,
                            job: crewData.job,
                            season_id: createSeasonData.id,
                            creditable_type: crewData.creditable_type,
                            status: "active",
                          },
                        });

                        if (!isCreditableExist) {
                          await model.creditable.create(crewDataDetails);
                          actionDate = crewDataDetails.created_at;
                        }
                        if (crewData.job) {
                          // get departmentSercive
                          const departmentName = crewData.job;
                          const deptId = await model.departmentJob.findOne({
                            attributes: ["department_id"],
                            where: {
                              job_name: departmentName,
                              status: "active",
                            },
                          });
                          // check in department table
                          const jobId = await model.department.findOne({
                            attributes: ["id"],
                            where: {
                              department_name: departmentName,
                              status: "active",
                            },
                          });
                          const peopleJobId =
                            deptId && deptId.department_id
                              ? deptId.department_id
                              : jobId && jobId.id
                              ? jobId.id
                              : "";
                          if (peopleJobId) {
                            // check for people job table
                            const isPeopleJobExist = await model.peopleJobs.findOne({
                              where: {
                                people_id: peopleId,
                                job_id: peopleJobId,
                                status: "active",
                              },
                            });
                            // list order
                            const getLastOrder = await model.peopleJobs.max("list_order", {
                              where: {
                                people_id: peopleId,
                                status: "active",
                              },
                            });
                            if (!isPeopleJobExist) {
                              const data = {
                                people_id: peopleId,
                                job_id: peopleJobId,
                                list_order: getLastOrder ? getLastOrder + 1 : 1,
                                site_language: crewData.site_language
                                  ? crewData.site_language
                                  : "en",
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              await model.peopleJobs.create(data);
                            }
                          }
                        }
                      }
                    }
                  }
                }
                // Creating people media - using schedular
                if (schedularAddData.length > 0) {
                  const payload = { list: schedularAddData };
                  const primaryDetailsPayload = { list: schedularPrimaryAddData };
                  await Promise.all([
                    schedulerJobService.addJobInScheduler(
                      "people media update",
                      JSON.stringify(payload),
                      "people_media",
                      "Sumbit all TV Details",
                      userId,
                    ),
                    schedulerJobService.addJobInScheduler(
                      "add other language people primary data",
                      JSON.stringify(primaryDetailsPayload),
                      "people_language_primary_data",
                      "Sumbit all TV Details",
                      userId,
                    ),
                  ]);
                }
              }
            }
          }
        }
      }
      if (findRequestId[0].type === "webtoons" && newTitle.id) {
        //   create the data in the Title countries table
        const countryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (countryDetails != null && countryDetails.list.length > 0) {
          for (const value of countryDetails.list) {
            const titleCountries = {
              title_id: newTitle.id,
              country_id: value.country_id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleCountries.create(titleCountries);
            actionDate = titleCountries.created_at;
          }
        }
        //   create the data in the connection table
        const connectionDetails =
          findRequestId[0].connection_details != null
            ? JSON.parse(findRequestId[0].connection_details)
            : null;
        if (connectionDetails != null && connectionDetails.list.length > 0) {
          for (const value of connectionDetails.list) {
            if (value.related_title_id) {
              const [checkConnection, checkOtherConnection] = await Promise.all([
                model.relatedTitle.findOne({
                  where: {
                    title_id: newTitle.id,
                    related_title_id: value.related_title_id,
                    status: "active",
                  },
                }),
                model.relatedTitle.findOne({
                  where: {
                    title_id: value.related_title_id,
                    related_title_id: newTitle.id,
                    status: "active",
                  },
                }),
              ]);

              if (!checkConnection) {
                const connectionData = {
                  title_id: newTitle.id,
                  related_title_id: value.related_title_id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  season_id: value.season_id ? value.season_id : null,
                  episode_id: value.episode_id ? value.episode_id : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }

              if (!checkOtherConnection) {
                const connectionData = {
                  title_id: value.related_title_id,
                  related_title_id: newTitle.id,
                  site_language: findRequestId[0].site_language
                    ? findRequestId[0].site_language
                    : "en",
                  season_id: value.season_id ? value.season_id : null,
                  episode_id: value.episode_id ? value.episode_id : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }
            }
          }
        }
        // create a data for title_keywords details-tv details page-search keyword:
        const searchKeywordDetails =
          findRequestId[0].search_keyword_details != null
            ? JSON.parse(findRequestId[0].search_keyword_details)
            : null;
        if (searchKeywordDetails != null && searchKeywordDetails.list.length > 0) {
          for (const value of searchKeywordDetails.list) {
            const searchKeywordData = {
              title_id: newTitle.id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              keyword: value.keyword ? value.keyword : null,
              keyword_type: value.keyword_type ? value.keyword_type : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.titleKeyword.create(searchKeywordData);
            actionDate = searchKeywordData.created_at;
          }
        }

        // Week_days data storage in weekly telecast table.
        const weeklyDaysDetails =
          findRequestId[0].weekly_telecast_details != null
            ? JSON.parse(findRequestId[0].weekly_telecast_details)
            : null;
        if (weeklyDaysDetails != null && weeklyDaysDetails.list.length > 0) {
          for (const value of weeklyDaysDetails.list) {
            const weeklyData = {
              title_id: newTitle.id,
              telecast_day: value.telecast_day ? value.telecast_day : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.weeklyTelecast.create(weeklyData);
            actionDate = weeklyData.created_at;
          }
        }
        // -----------------------------Tag details-------------------------------------
        let foundTagData = [];
        for (const value of findRequestId) {
          if (value.id) requestId.push(value.id);
        }
        if (requestId.length > 0) {
          foundTagData = await model.titleRequestTag.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }

        if (foundTagData.length > 0) {
          const parsedGenreDetails =
            foundTagData[0].genre_details != null
              ? JSON.parse(foundTagData[0].genre_details)
              : null;
          const parsedTagDetails =
            foundTagData[0].tag_details != null ? JSON.parse(foundTagData[0].tag_details) : null;
          if (parsedGenreDetails != null && parsedGenreDetails.list.length > 0) {
            for (const value of parsedGenreDetails.list) {
              const genreData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagGable.create(genreData);
              actionDate = genreData.created_at;
            }
          }
          if (parsedTagDetails != null && parsedTagDetails.list.length > 0) {
            for (const value of parsedTagDetails.list) {
              const tagData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagGable.create(tagData);
              actionDate = tagData.created_at;
            }
          }
        }

        // -----------------------------Season details-------------------------------------
        let foundRecentlyModifiedSeasonData = [];
        if (requestId.length > 0) {
          foundRecentlyModifiedSeasonData = await model.titleRequestSeasonDetails.findAll({
            where: {
              request_id: {
                [Op.in]: requestId,
              },
              status: "active",
            },
            order: [
              ["updated_at", "DESC"],
              ["id", "DESC"],
            ],
          });
        }
        const latestReqModified =
          foundRecentlyModifiedSeasonData && foundRecentlyModifiedSeasonData.length > 0
            ? foundRecentlyModifiedSeasonData[0].request_id
            : findRequestId[0].id;
        const anotherRequestId =
          findRequestId.length > 1 &&
          findRequestId[1].id &&
          findRequestId[1].id != latestReqModified
            ? findRequestId[1].id
            : findRequestId[0].id;
        const [foundSeasonData, foundCrewData, foundMediaData] = await Promise.all([
          model.titleRequestSeasonDetails.findAll({
            where: { request_id: latestReqModified, status: "active" },
          }),
          model.titleRequestCredit.findAll({
            where: { request_id: latestReqModified, status: "active" },
          }),
          model.titleRequestMedia.findAll({
            where: { request_id: latestReqModified, status: "active" },
          }),
        ]);

        if (foundSeasonData.length > 0) {
          for (const titleSeasonData of foundSeasonData) {
            const webtoonsReadData = [];
            const parsedSeasonData =
              titleSeasonData.season_details != null
                ? JSON.parse(titleSeasonData.season_details)
                : null;
            if (parsedSeasonData != null) {
              const seasonData = {
                release_date: parsedSeasonData.release_date ? parsedSeasonData.release_date : null,
                release_date_to: parsedSeasonData.release_date_to
                  ? parsedSeasonData.release_date_to
                  : null,
                poster: parsedSeasonData.poster ? parsedSeasonData.poster : null,
                number: parsedSeasonData.number,
                season_name: parsedSeasonData.season_name ? parsedSeasonData.season_name : null,
                title_id: newTitle.id ? newTitle.id : null,
                title_tmdb_id: newTitle.tmdb_id ? newTitle.tmdb_id : null,
                summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                episode_count: parsedSeasonData.episode_count,
                site_language: parsedSeasonData.site_language
                  ? parsedSeasonData.site_language
                  : "en",
                created_by: userId,
              };
              const createSeasonData = await model.season.create(seasonData);
              actionDate = seasonData.created_at;
              if (createSeasonData.id) {
                // create record for season translation:
                const seasonTranslationData = {
                  season_id: createSeasonData.id,
                  season_name: parsedSeasonData.season_name ? parsedSeasonData.season_name : null,
                  summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                  aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  episode_count: parsedSeasonData.episode_count,
                  site_language: parsedSeasonData.site_language
                    ? parsedSeasonData.site_language
                    : "en",
                  created_by: userId,
                };
                await model.seasonTranslation.create(seasonTranslationData);
                actionDate = seasonTranslationData.created_at;
                // adding korean or english language data if two request is present
                if (anotherRequestId) {
                  const anotherRequestDetails = await model.titleRequestSeasonDetails.findOne({
                    where: {
                      request_id: anotherRequestId,
                      season_no: parsedSeasonData.number,
                    },
                  });
                  if (anotherRequestDetails) {
                    const anotherParsedSeasonData =
                      anotherRequestDetails.season_details != null
                        ? JSON.parse(anotherRequestDetails.season_details)
                        : null;
                    if (anotherParsedSeasonData) {
                      const seasonTranslationData = {
                        season_id: createSeasonData.id,
                        season_name: anotherParsedSeasonData.season_name
                          ? anotherParsedSeasonData.season_name
                          : null,
                        summary: anotherParsedSeasonData.summary
                          ? anotherParsedSeasonData.summary
                          : null,
                        aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        episode_count: anotherParsedSeasonData.episode_count,
                        site_language: anotherParsedSeasonData.site_language
                          ? anotherParsedSeasonData.site_language
                          : "en",
                        created_by: userId,
                      };
                      await model.seasonTranslation.create(seasonTranslationData);
                      actionDate = seasonTranslationData.created_at;
                    }
                  }
                }
              }

              //-------------------------episode data---------------------------
              const foundEpisodeData = await model.titleRequestEpisodeDetails.findOne({
                where: {
                  request_id: latestReqModified,
                  request_season_id: titleSeasonData.id,
                  status: "active",
                },
              });
              let mediaListOrder = 1;
              let titleImageListOrder = 1;
              // for other language data
              if (foundEpisodeData) {
                // Other language data for the same season number
                let parsedOtherLanEpisodeData = "";
                const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                  where: {
                    season_no: parsedSeasonData.number,
                    request_id: anotherRequestId,
                  },
                });
                if (findSeasonReqId) {
                  const findOtherLanEpisodeDetails = await model.titleRequestEpisodeDetails.findOne(
                    {
                      where: {
                        request_id: anotherRequestId,
                        request_season_id: findSeasonReqId.id,
                        status: "active",
                      },
                    },
                  );
                  if (findOtherLanEpisodeDetails) {
                    parsedOtherLanEpisodeData =
                      findOtherLanEpisodeDetails.episode_details != null
                        ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                        : null;
                  }
                }
                const parsedEpisodeData =
                  foundEpisodeData.episode_details != null
                    ? JSON.parse(foundEpisodeData.episode_details)
                    : null;
                if (parsedEpisodeData != null) {
                  for (const episodeValue of parsedEpisodeData.list) {
                    const episodeData = {
                      name: episodeValue.name,
                      description: episodeValue.description ? episodeValue.description : null,
                      poster: episodeValue.poster ? episodeValue.poster : null,
                      release_date: episodeValue.release_date ? episodeValue.release_date : null,
                      title_id: newTitle.id,
                      season_id: createSeasonData.id,
                      season_number: createSeasonData.number,
                      episode_number: episodeValue.episode_number,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      temp_id: episodeValue.temp_id ? episodeValue.temp_id : null,
                      tmdb_vote_count: episodeValue.tmdb_vote_count
                        ? episodeValue.tmdb_vote_count
                        : null,
                      tmdb_vote_average: episodeValue.tmdb_vote_average
                        ? episodeValue.tmdb_vote_average
                        : null,
                      local_vote_average: episodeValue.local_vote_average
                        ? episodeValue.local_vote_average
                        : null,
                      year: episodeValue.year ? episodeValue.year : null,
                      popularity: episodeValue.popularity ? episodeValue.popularity : null,
                      tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                      rating_percent: episodeValue.rating_percent
                        ? episodeValue.rating_percent
                        : null,
                      site_language: episodeValue.site_language ? episodeValue.site_language : "en",
                      created_by: userId,
                    };
                    const createdEpisode = await model.episode.create(episodeData);
                    actionDate = episodeData.created_at;
                    // create episode translation data
                    if (createdEpisode.id) {
                      const episodeTranslationData = {
                        episode_id: createdEpisode.id,
                        name: episodeValue.name,
                        description: episodeValue.description ? episodeValue.description : null,
                        url: episodeValue.url ? episodeValue.url : null,
                        site_language: episodeValue.site_language
                          ? episodeValue.site_language
                          : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.episodeTranslation.create(episodeTranslationData);
                      actionDate = episodeTranslationData.created_at;
                      // create other language episode translation data
                      if (parsedOtherLanEpisodeData != null && parsedOtherLanEpisodeData != "") {
                        for (const value of parsedOtherLanEpisodeData.list) {
                          if (value.episode_number == episodeValue.episode_number) {
                            const episodeTranslationData = {
                              episode_id: createdEpisode.id,
                              name: value.name,
                              description: value.description ? value.description : null,
                              url: value.url ? value.url : null,
                              site_language: value.site_language ? value.site_language : "en",
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            await model.episodeTranslation.create(episodeTranslationData);
                            actionDate = episodeTranslationData.created_at;
                          }
                        }
                      }
                    }
                    // create poster image of eposides form data
                    if (episodeValue.poster != null && episodeValue.poster != "") {
                      const fileName = episodeValue.poster
                        ? episodeValue.poster.substring(episodeValue.poster.lastIndexOf("/") + 1)
                        : null;
                      const posterImageData = {
                        file_name: fileName ? fileName : null,
                        path: episodeValue.poster ? episodeValue.poster : null,
                        title_id: newTitle.id,
                        season_id: createSeasonData.id ? createSeasonData.id : null,
                        episode_id: createdEpisode.id ? createdEpisode.id : null,
                        list_order: titleImageListOrder,
                        image_category: "poster_image",
                        is_main_poster: "y",
                        site_language: parsedSeasonData.site_language
                          ? parsedSeasonData.site_language
                          : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.titleImage.create(posterImageData);
                      actionDate = posterImageData.created_at;
                      titleImageListOrder += 1;
                    }
                  }
                }
              }

              // for season search_keyword_details,news search keyword, watch on details on the season page
              const seasonSearchKeywordDetails =
                titleSeasonData.season_search_keyword_details != null
                  ? JSON.parse(titleSeasonData.season_search_keyword_details)
                  : null;
              if (
                seasonSearchKeywordDetails != null &&
                seasonSearchKeywordDetails.list.length > 0
              ) {
                for (const value of seasonSearchKeywordDetails.list) {
                  const searchKeywordData = {
                    title_id: newTitle.id,
                    season_id: createSeasonData.id,
                    site_language: value.site_language ? value.site_language : "en",
                    keyword: value.keyword ? value.keyword : null,
                    keyword_type: value.keyword_type ? value.keyword_type : null,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.titleKeyword.create(searchKeywordData);
                  actionDate = searchKeywordData.created_at;
                }
              }
              const seasonNewsKeywordDetails =
                titleSeasonData.season_news_search_keyword_details != null
                  ? JSON.parse(titleSeasonData.season_news_search_keyword_details)
                  : null;
              if (seasonNewsKeywordDetails != null && seasonNewsKeywordDetails.list.length > 0) {
                for (const value of seasonNewsKeywordDetails.list) {
                  const newsKeywordData = {
                    title_id: newTitle.id,
                    season_id: createSeasonData.id ? createSeasonData.id : null,
                    site_language: value.site_language ? value.site_language : "en",
                    keyword: value.keyword ? value.keyword : null,
                    keyword_type: value.keyword_type ? value.keyword_type : null,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.titleKeyword.create(newsKeywordData);
                  actionDate = newsKeywordData.created_at;
                }
              }
              // channel Details update
              const seasonChannelDetails =
                titleSeasonData.season_channel_details != null
                  ? JSON.parse(titleSeasonData.season_channel_details)
                  : null;
              if (seasonChannelDetails != null && seasonChannelDetails.list.length > 0) {
                for (const value of seasonChannelDetails.list) {
                  const channelData = {
                    title_id: newTitle.id,
                    url: value.url ? value.url : null,
                    webtoons_channel_id: value.webtoons_channel_id
                      ? value.webtoons_channel_id
                      : null,
                    season_id: createSeasonData.id ? createSeasonData.id : null,
                    episode_id: value.episode_id ? value.episode_id : null,
                    site_language: value.site_language ? value.site_language : "en",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  await model.webtoonsChannelList.create(channelData);
                  actionDate = channelData.created_at;
                }
              }
              // create data in watch on
              const webtoonsReadList =
                titleSeasonData.read_list_details != null
                  ? JSON.parse(titleSeasonData.read_list_details)
                  : null;
              if (webtoonsReadList != null && webtoonsReadList.list.length > 0) {
                for (const value of webtoonsReadList.list) {
                  if (
                    webtoonsReadData.length === 0 ||
                    webtoonsReadData.indexOf(value.provider_id) === -1
                  ) {
                    webtoonsReadData.push(value.provider_id);
                    const watchOnData = {
                      title_id: newTitle.id,
                      movie_id: value.movie_id ? value.movie_id : null,
                      url: value.url ? value.url : null,
                      type: value.type ? value.type : "read",
                      provider_id: value.provider_id ? value.provider_id : null,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: value.episode_id ? value.episode_id : null,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (newTitle.id) {
                      await model.titleWatchOn.create(watchOnData);
                      actionDate = watchOnData.created_at;
                    }
                  }
                }
              }

              // storing the media details ::
              if (foundMediaData.length > 0) {
                for (const titleMediaData of foundMediaData) {
                  const parsedVideoDetails =
                    titleMediaData.video_details != null
                      ? JSON.parse(titleMediaData.video_details)
                      : null;
                  const parsedImageDetails =
                    titleMediaData.image_details != null
                      ? JSON.parse(titleMediaData.image_details)
                      : null;
                  const parsedPosterDetails =
                    titleMediaData.poster_image_details != null
                      ? JSON.parse(titleMediaData.poster_image_details)
                      : null;
                  const parsedBackgroundImageDetails =
                    titleMediaData.background_image_details != null
                      ? JSON.parse(titleMediaData.background_image_details)
                      : null;
                  if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
                    for (const value of parsedVideoDetails.list) {
                      if (titleSeasonData.id === value.season) {
                        const videoData = {
                          name: value.name,
                          thumbnail: value.thumbnail ? value.thumbnail : null,
                          url: value.url ? value.url : null,
                          type: value.type,
                          quality: value.quality ? value.quality : null,
                          title_id: newTitle.id,
                          season: createSeasonData.id ? createSeasonData.id : null,
                          episode: value.episode ? value.episode : null,
                          source: value.source ? value.source : "local",
                          negative_votes: value.negative_votes ? value.negative_votes : 0,
                          positive_votes: value.positive_votes ? value.positive_votes : 0,
                          reports: value.reports ? value.reports : 0,
                          approved: value.approved ? value.approved : 1,
                          list_order: mediaListOrder,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          user_id: userId,
                          category: value.category ? value.category : "trailer",
                          is_official_trailer: value.is_official_trailer
                            ? value.is_official_trailer
                            : "null",
                          site_language: value.site_language ? value.site_language : "en",
                          created_by: userId,
                          video_source: value.url
                            ? await generalHelper.checkUrlSource(value.url)
                            : "youtube",
                          video_for: "title",
                          no_of_view: value.no_of_view ? value.no_of_view : 0,
                          video_duration: value.video_duration ? value.video_duration : null,
                          ele_no_of_view: 0,
                        };
                        await model.video.create(videoData);
                        actionDate = videoData.created_at;
                        isVideoAdded = true;
                        mediaListOrder += 1;
                      }
                    }
                  }
                  if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
                    for (const value of parsedImageDetails.list) {
                      if (titleSeasonData.id === value.season_id) {
                        const imageData = {
                          original_name: value.original_name ? value.original_name : null,
                          file_name: value.file_name ? value.file_name : null,
                          url: value.url ? value.url : null,
                          path: value.path ? value.path : null,
                          file_size: value.file_size ? value.file_size : null,
                          mime_type: value.mime_type ? value.mime_type : null,
                          file_extension: value.file_extension ? value.file_extension : null,
                          title_id: newTitle.id,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: value.episode_id ? value.episode_id : null,
                          source: value.source ? value.source : "local",
                          approved: value.approved ? value.approved : 1,
                          list_order: titleImageListOrder,
                          image_category: value.image_category ? value.image_category : "image",
                          is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                          site_language: value.site_language ? value.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleImage.create(imageData);
                        actionDate = imageData.created_at;
                        titleImageListOrder += 1;
                      }
                    }
                  }
                  if (parsedPosterDetails != null && parsedPosterDetails.list.length > 0) {
                    for (const posterValue of parsedPosterDetails.list) {
                      if (titleSeasonData.id === posterValue.season_id) {
                        const posterImageData = {
                          original_name: posterValue.original_name
                            ? posterValue.original_name
                            : null,
                          file_name: posterValue.file_name ? posterValue.file_name : null,
                          url: posterValue.url ? posterValue.url : null,
                          path: posterValue.path ? posterValue.path : null,
                          file_size: posterValue.file_size ? posterValue.file_size : null,
                          mime_type: posterValue.mime_type ? posterValue.mime_type : null,
                          file_extension: posterValue.file_extension
                            ? posterValue.file_extension
                            : null,
                          title_id: newTitle.id,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: posterValue.episode_id ? posterValue.episode_id : null,
                          source: posterValue.source ? posterValue.source : "local",
                          approved: posterValue.approved ? posterValue.approved : 1,
                          list_order: titleImageListOrder,
                          image_category: posterValue.image_category
                            ? posterValue.image_category
                            : "poster_image",
                          is_main_poster: posterValue.is_main_poster
                            ? posterValue.is_main_poster
                            : null,
                          site_language: posterValue.site_language
                            ? posterValue.site_language
                            : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleImage.create(posterImageData);
                        actionDate = posterImageData.created_at;
                        titleImageListOrder += 1;
                      }
                    }
                  }
                  if (
                    parsedBackgroundImageDetails != null &&
                    parsedBackgroundImageDetails.list.length > 0
                  ) {
                    for (const value of parsedBackgroundImageDetails.list) {
                      if (titleSeasonData.id === value.season_id) {
                        const backgroundImageData = {
                          original_name: value.original_name ? value.original_name : null,
                          file_name: value.file_name ? value.file_name : null,
                          url: value.url ? value.url : null,
                          path: value.path ? value.path : null,
                          file_size: value.file_size ? value.file_size : null,
                          mime_type: value.mime_type ? value.mime_type : null,
                          file_extension: value.file_extension ? value.file_extension : null,
                          title_id: newTitle.id,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: value.episode_id ? value.episode_id : null,
                          source: value.source ? value.source : "local",
                          approved: value.approved ? value.approved : 1,
                          list_order: titleImageListOrder,
                          image_category: value.image_category ? value.image_category : "bg_image",
                          is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                          site_language: value.site_language ? value.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleImage.create(backgroundImageData);
                        actionDate = backgroundImageData.created_at;
                        titleImageListOrder += 1;
                      }
                    }
                  }
                }
              }

              // -------------- Credit Section
              // // storing the credit data:
              // // Note: for webtoons cast means - Character details

              // ----------------------- For Crew
              if (foundCrewData.length > 0) {
                for (const titleCreditData of foundCrewData) {
                  const parsedCrewDetails =
                    titleCreditData.crew_details != null
                      ? JSON.parse(titleCreditData.crew_details)
                      : null;
                  if (parsedCrewDetails != null && parsedCrewDetails.list.length > 0) {
                    let peopleCrewData = {};
                    for (const crewData of parsedCrewDetails.list) {
                      let peopleId = 0;
                      if (
                        crewData.people_id === "" &&
                        (crewData.cast_name != null || crewData.cast_name != "") &&
                        titleSeasonData.id === crewData.season_id
                      ) {
                        const createCrew = {
                          uuid: await generalHelper.uuidv4(),
                          poster: crewData.poster,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const createPeople = await model.people.create(createCrew);
                        if (createPeople.id) {
                          peopleId = createPeople.id;
                          payloadPeopleList.push({
                            record_id: peopleId,
                            type: "people",
                            action: "add",
                          });
                          peopleCrewData = {
                            people_id: createPeople.id,
                            name: crewData.cast_name,
                            created_at: await customDateTimeHelper.getCurrentDateTime(),
                            created_by: userId,
                            site_language: crewData.site_language ? crewData.site_language : "en",
                          };
                          if (
                            !(await model.peopleTranslation.findOne({
                              where: {
                                people_id: peopleId,
                                site_language: crewData.site_language
                                  ? crewData.site_language
                                  : "en",
                              },
                            }))
                          ) {
                            await model.peopleTranslation.create(peopleCrewData);
                          }
                          // adding image details to the people image table
                          if (crewData.poster) {
                            const fileName = crewData.poster.substring(
                              crewData.poster.lastIndexOf("/") + 1,
                            );
                            const getLastOrder = await model.peopleImages.max("list_order", {
                              where: {
                                people_id: createPeople.id,
                                image_category: "poster_image",
                              },
                            });
                            const peoplePosterImageData = {
                              original_name: fileName ? fileName : null,
                              file_name: fileName ? fileName : null,
                              path: crewData.poster ? crewData.poster : null,
                              people_id: createPeople.id,
                              source: "local",
                              list_order: getLastOrder ? getLastOrder + 1 : 1,
                              image_category: "poster_image",
                              is_main_poster: "y",
                              site_language: crewData.site_language ? crewData.site_language : "en",
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            await model.peopleImages.create(peoplePosterImageData);
                          }
                        }
                      } else {
                        peopleId = crewData.people_id;
                      }
                      if (titleSeasonData.id === crewData.season_id && peopleId) {
                        const crewDataDetails = {
                          people_id: peopleId,
                          creditable_id: newTitle.id,
                          character_name: crewData.character_name ? crewData.character_name : null,
                          list_order: crewData.list_order,
                          department: crewData.department ? crewData.department : null,
                          job: crewData.job ? crewData.job : null,
                          creditable_type: crewData.creditable_type
                            ? crewData.creditable_type
                            : null,
                          is_guest: crewData.is_guest ? crewData.is_guest : 0,
                          season_id: createSeasonData.id ? createSeasonData.id : null,
                          episode_id: crewData.episode_id ? crewData.episode_id : null,
                          site_language: crewData.site_language ? crewData.site_language : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const isCreditableExist = await model.creditable.findOne({
                          where: {
                            people_id: peopleId,
                            creditable_id: newTitle.id,
                            department: crewData.department,
                            job: crewData.job,
                            season_id: createSeasonData.id,
                            creditable_type: crewData.creditable_type,
                            status: "active",
                          },
                        });

                        if (!isCreditableExist) {
                          await model.creditable.create(crewDataDetails);
                          actionDate = crewDataDetails.created_at;
                        }
                        if (crewData.job) {
                          // get departmentSercive
                          const departmentName = crewData.job;
                          const deptId = await model.departmentJob.findOne({
                            attributes: ["department_id"],
                            where: {
                              job_name: departmentName,
                              status: "active",
                            },
                          });
                          // check in department table
                          const jobId = await model.department.findOne({
                            attributes: ["id"],
                            where: {
                              department_name: departmentName,
                              status: "active",
                            },
                          });
                          const peopleJobId =
                            deptId && deptId.department_id
                              ? deptId.department_id
                              : jobId && jobId.id
                              ? jobId.id
                              : "";
                          if (peopleJobId) {
                            // check for people job table
                            const isPeopleJobExist = await model.peopleJobs.findOne({
                              where: {
                                people_id: peopleId,
                                job_id: peopleJobId,
                                status: "active",
                              },
                            });
                            // list order
                            const getLastOrder = await model.peopleJobs.max("list_order", {
                              where: {
                                people_id: peopleId,
                                status: "active",
                              },
                            });
                            if (!isPeopleJobExist) {
                              const data = {
                                people_id: peopleId,
                                job_id: peopleJobId,
                                list_order: getLastOrder ? getLastOrder + 1 : 1,
                                site_language: crewData.site_language
                                  ? crewData.site_language
                                  : "en",
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              await model.peopleJobs.create(data);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }

              // ------------------- For character ----------------------
              const foundCreditData = await model.titleRequestCredit.findOne({
                where: {
                  request_id: latestReqModified,
                  request_season_id: titleSeasonData.id,
                  status: "active",
                },
              });

              if (foundCreditData) {
                // Other language data for the same season number
                let parsedCastDataLength = 0;
                let parsedOtherLanCastDataLength = 0;
                let parsedOtherLanCastData = "";
                const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                  where: {
                    season_no: parsedSeasonData.number,
                    request_id: anotherRequestId,
                  },
                });
                const parsedCastData =
                  foundCreditData.cast_details != null
                    ? JSON.parse(foundCreditData.cast_details)
                    : null;
                if (findSeasonReqId) {
                  const findOtherLanCreditDetails = await model.titleRequestCredit.findOne({
                    where: {
                      request_id: anotherRequestId,
                      request_season_id: findSeasonReqId.id,
                      status: "active",
                    },
                  });
                  if (findOtherLanCreditDetails) {
                    parsedOtherLanCastData =
                      findOtherLanCreditDetails.cast_details != null
                        ? JSON.parse(findOtherLanCreditDetails.cast_details)
                        : null;
                  }
                }

                if (parsedCastData != null) {
                  parsedCastDataLength = parsedCastData.list.length;
                }
                if (parsedOtherLanCastData != null && parsedOtherLanCastData != "") {
                  parsedOtherLanCastDataLength = parsedOtherLanCastData.list.length;
                }

                if (
                  parsedCastDataLength == parsedOtherLanCastDataLength &&
                  parsedCastDataLength > 0
                ) {
                  for (const castData of parsedCastData.list) {
                    const targetKey = "character_name";
                    // Find the index of the object with the matching key-value pair
                    const indexValue = parsedCastData.list.findIndex(
                      (obj) => obj[targetKey] === castData.character_name,
                    );
                    // Get other language character object with index value
                    const objectAtIndex =
                      parsedOtherLanCastDataLength > 0 && parsedOtherLanCastData.list[indexValue]
                        ? parsedOtherLanCastData.list[indexValue]
                        : "";
                    let peopleId = 0;
                    const castDataDetails = {
                      people_id: peopleId,
                      creditable_id: newTitle.id,
                      character_name: castData.character_name ? castData.character_name : null,
                      list_order: castData.list_order,
                      department: castData.department ? castData.department : "character",
                      creditable_type: castData.creditable_type ? castData.creditable_type : null,
                      is_guest: castData.is_guest ? castData.is_guest : 0,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: castData.episode_id ? castData.episode_id : null,
                      site_language: castData.site_language ? castData.site_language : "en",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };

                    const createCharater = await model.creditable.create(castDataDetails);
                    if (createCharater.id) {
                      actionDate = castDataDetails.created_at;
                      // First Object :
                      const characterTrans = {
                        creditables_id: createCharater.id,
                        character_name: castData.character_name,
                        description: castData.description ? castData.description : "",
                        character_image: castData.poster ? castData.poster : "",
                        site_language: castData.site_language ? castData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };

                      const checkFirstTranslation = await model.creditableTranslation.findOne({
                        where: {
                          creditables_id: createCharater.id,
                          character_name: castData.character_name,
                          site_language: castData.site_language,
                          status: "active",
                        },
                      });

                      if (checkFirstTranslation) {
                        await model.creditableTranslation.update(characterTrans, {
                          where: {
                            creditables_id: createCharater.id,
                            character_name: castData.character_name,
                            site_language: castData.site_language,
                            status: "active",
                          },
                        });
                        actionDate = characterTrans.created_at;
                      } else {
                        await model.creditableTranslation.create(characterTrans);
                        actionDate = characterTrans.created_at;
                      }
                      // Translation table :
                      if (parsedOtherLanCastDataLength > 0 && objectAtIndex != "") {
                        // Second Obj for Translation
                        const characterSecondTrans = {
                          creditables_id: createCharater.id,
                          character_name: objectAtIndex.character_name
                            ? objectAtIndex.character_name
                            : "",
                          description: objectAtIndex.description ? objectAtIndex.description : "",
                          character_image: objectAtIndex.poster ? objectAtIndex.poster : "",
                          site_language: objectAtIndex.site_language
                            ? objectAtIndex.site_language
                            : "en",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const checkSecondTranslation = await model.creditableTranslation.findOne({
                          where: {
                            creditables_id: createCharater.id,
                            character_name: objectAtIndex.character_name,
                            site_language: objectAtIndex.site_language,
                            status: "active",
                          },
                        });

                        if (checkSecondTranslation) {
                          await model.creditableTranslation.update(characterSecondTrans, {
                            where: {
                              creditables_id: createCharater.id,
                              character_name: objectAtIndex.character_name,
                              site_language: objectAtIndex.site_language,
                              status: "active",
                            },
                          });
                          actionDate = characterSecondTrans.created_at;
                        } else {
                          await model.creditableTranslation.create(characterSecondTrans);
                          actionDate = characterSecondTrans.created_at;
                        }
                      }
                    }
                  }
                } else if (
                  parsedCastDataLength > parsedOtherLanCastDataLength &&
                  parsedCastDataLength > 0
                ) {
                  for (const castData of parsedCastData.list) {
                    const targetKey = "character_name";
                    // Find the index of the object with the matching key-value pair
                    const indexValue = parsedCastData.list.findIndex(
                      (obj) => obj[targetKey] === castData.character_name,
                    );
                    // Get other language character object with index value
                    const objectAtIndex =
                      parsedOtherLanCastDataLength > 0 && parsedOtherLanCastData.list[indexValue]
                        ? parsedOtherLanCastData.list[indexValue]
                        : "";

                    let peopleId = 0;
                    const castDataDetails = {
                      people_id: peopleId,
                      creditable_id: newTitle.id,
                      character_name: castData.character_name ? castData.character_name : null,
                      list_order: castData.list_order,
                      department: castData.department ? castData.department : "character",
                      creditable_type: castData.creditable_type ? castData.creditable_type : null,
                      is_guest: castData.is_guest ? castData.is_guest : 0,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: castData.episode_id ? castData.episode_id : null,
                      site_language: castData.site_language ? castData.site_language : "en",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };

                    const createCharater = await model.creditable.create(castDataDetails);
                    if (createCharater.id) {
                      actionDate = castDataDetails.created_at;
                      // First Object :
                      const characterTrans = {
                        creditables_id: createCharater.id,
                        character_name: castData.character_name,
                        description: castData.description ? castData.description : "",
                        character_image: castData.poster ? castData.poster : "",
                        site_language: castData.site_language ? castData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      const otherLanguage = castData.site_language == "en" ? "ko" : "en";
                      // Second Obj for Translation
                      const characterSecondTrans = {
                        creditables_id: createCharater.id,
                        character_name: objectAtIndex.character_name
                          ? objectAtIndex.character_name
                          : castData.character_name,
                        description: objectAtIndex.description
                          ? objectAtIndex.description
                          : castData.description
                          ? castData.description
                          : "",
                        character_image: objectAtIndex.poster
                          ? objectAtIndex.poster
                          : castData.poster
                          ? castData.poster
                          : "",
                        site_language: objectAtIndex.site_language
                          ? objectAtIndex.site_language
                          : otherLanguage,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };

                      const checkFirstTranslation = await model.creditableTranslation.findOne({
                        where: {
                          creditables_id: createCharater.id,
                          character_name: castData.character_name,
                          site_language: castData.site_language,
                          status: "active",
                        },
                      });
                      const checkSecondTranslation = await model.creditableTranslation.findOne({
                        where: {
                          creditables_id: createCharater.id,
                          character_name: characterSecondTrans.character_name,
                          site_language: characterSecondTrans.site_language,
                          status: "active",
                        },
                      });
                      if (checkFirstTranslation) {
                        await model.creditableTranslation.update(characterTrans, {
                          where: {
                            creditables_id: createCharater.id,
                            character_name: castData.character_name,
                            site_language: castData.site_language,
                            status: "active",
                          },
                        });
                        actionDate = characterTrans.created_at;
                      } else {
                        await model.creditableTranslation.create(characterTrans);
                        actionDate = characterTrans.created_at;
                      }
                      if (checkSecondTranslation) {
                        await model.creditableTranslation.update(characterSecondTrans, {
                          where: {
                            creditables_id: createCharater.id,
                            character_name: characterSecondTrans.character_name,
                            site_language: characterSecondTrans.site_language,
                            status: "active",
                          },
                        });
                        actionDate = characterSecondTrans.created_at;
                      } else {
                        await model.creditableTranslation.create(characterSecondTrans);
                        actionDate = characterSecondTrans.created_at;
                      }
                    }
                  }
                } else if (
                  parsedOtherLanCastDataLength > parsedCastDataLength &&
                  parsedOtherLanCastDataLength > 0
                ) {
                  for (const castData of parsedOtherLanCastData.list) {
                    const targetKey = "character_name";
                    // Find the index of the object with the matching key-value pair
                    const indexValue = parsedOtherLanCastData.list.findIndex(
                      (obj) => obj[targetKey] === castData.character_name,
                    );

                    // Get other language character object with index value
                    const objectAtIndex =
                      parsedCastDataLength > 0 && parsedCastData.list[indexValue]
                        ? parsedCastData.list[indexValue]
                        : "";
                    let peopleId = 0;
                    const castDataDetails = {
                      people_id: peopleId,
                      creditable_id: newTitle.id,
                      character_name: castData.character_name ? castData.character_name : null,
                      list_order: castData.list_order,
                      department: castData.department ? castData.department : "character",
                      creditable_type: castData.creditable_type ? castData.creditable_type : null,
                      is_guest: castData.is_guest ? castData.is_guest : 0,
                      season_id: createSeasonData.id ? createSeasonData.id : null,
                      episode_id: castData.episode_id ? castData.episode_id : null,
                      site_language: castData.site_language ? castData.site_language : "en",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };

                    const createCharater = await model.creditable.create(castDataDetails);
                    if (createCharater.id) {
                      actionDate = castDataDetails.created_at;
                      // First Object :
                      const characterTrans = {
                        creditables_id: createCharater.id,
                        character_name: castData.character_name,
                        description: castData.description ? castData.description : "",
                        character_image: castData.poster ? castData.poster : "",
                        site_language: castData.site_language ? castData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      const otherLanguage = castData.site_language == "en" ? "ko" : "en";
                      // Second Obj for Translation
                      const characterSecondTrans = {
                        creditables_id: createCharater.id,
                        character_name: objectAtIndex.character_name
                          ? objectAtIndex.character_name
                          : castData.character_name,
                        description: objectAtIndex.description
                          ? objectAtIndex.description
                          : castData.description
                          ? castData.description
                          : "",
                        character_image: objectAtIndex.poster
                          ? objectAtIndex.poster
                          : castData.poster
                          ? castData.poster
                          : "",
                        site_language: objectAtIndex.site_language
                          ? objectAtIndex.site_language
                          : otherLanguage,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };

                      const checkFirstTranslation = await model.creditableTranslation.findOne({
                        where: {
                          creditables_id: createCharater.id,
                          character_name: castData.character_name,
                          site_language: castData.site_language,
                          status: "active",
                        },
                      });
                      const checkSecondTranslation = await model.creditableTranslation.findOne({
                        where: {
                          creditables_id: createCharater.id,
                          character_name: characterSecondTrans.character_name,
                          site_language: characterSecondTrans.site_language,
                          status: "active",
                        },
                      });
                      if (checkFirstTranslation) {
                        await model.creditableTranslation.update(characterTrans, {
                          where: {
                            creditables_id: createCharater.id,
                            character_name: castData.character_name,
                            site_language: castData.site_language,
                            status: "active",
                          },
                        });
                        actionDate = characterTrans.created_at;
                      } else {
                        await model.creditableTranslation.create(characterTrans);
                        actionDate = characterTrans.created_at;
                      }
                      if (checkSecondTranslation) {
                        await model.creditableTranslation.update(characterSecondTrans, {
                          where: {
                            creditables_id: createCharater.id,
                            character_name: characterSecondTrans.character_name,
                            site_language: characterSecondTrans.site_language,
                            status: "active",
                          },
                        });
                        actionDate = characterSecondTrans.created_at;
                      } else {
                        await model.creditableTranslation.create(characterSecondTrans);
                        actionDate = characterSecondTrans.created_at;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      //add scheudle to update search db
      if (
        newTitle.id &&
        findRequestId &&
        findRequestId.length > 0 &&
        findRequestId[0] &&
        findRequestId[0].type
      ) {
        const payload = {
          list: [{ record_id: newTitle.id, type: findRequestId[0].type, action: "add" }],
        };
        schedulerJobService.addJobInScheduler(
          "add title data to search db",
          JSON.stringify(payload),
          "search_db",
          `Sumbit all ${findRequestId[0].type} Details`,
          userId,
        );
        //
        if (payloadPeopleList.length > 0) {
          const payloadPeople = {
            list: payloadPeopleList,
          };
          schedulerJobService.addJobInScheduler(
            "add people data to search db",
            JSON.stringify(payloadPeople),
            "search_db",
            `add people in submit all title Details`,
            userId,
          );
        }
        //add related search db video
        if (isVideoAdded) {
          schedulerJobService.addJobInScheduler(
            "video add in search db",
            JSON.stringify({
              list: [{ item_id: newTitle.id, item_type: findRequestId[0].type, type: "title" }],
            }),
            "update_video_search_data_by_item_id",
            `title video add in search db when title data for (${findRequestId[0].type}) add in submit all`,
            userId,
          );
        }
        //update edit table
        await titleService.titleDataAddEditInEditTbl(
          newTitle.id,
          findRequestId[0].type,
          userId,
          actionDate,
        );
      }
      //

      await model.titleRequestPrimaryDetails.update(
        { request_status: "accept" },
        { where: { relation_id: relationId } },
      );
      res.ok({ message: res.__("Data has been successfully submitted") });
    } else {
      throw StatusError.badRequest(res.__("No data found for the requestId"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
