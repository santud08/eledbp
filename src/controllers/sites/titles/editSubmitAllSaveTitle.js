import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import {
  departmentService,
  tmdbService,
  schedulerJobService,
  importTitleTmdbService,
  titleService,
} from "../../../services/index.js";
import { v4 as uuidv4 } from "uuid";

/**
 * editSubmitAllSaveTitle
 * @param req
 * @param res
 */
export const editSubmitAllSaveTitle = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.draft_relation_id;
    const titleId = req.body.title_id;
    const titleType = req.body.title_type;
    let actionDate = "";
    let isVideoModified = false;
    let payloadPeopleList = [];

    //save title primary details
    const findRequestId = await model.titleRequestPrimaryDetails.findAll({
      where: {
        relation_id: relationId,
        title_id: titleId,
        type: titleType,
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
        // record_status: findRequestId[0].record_status,
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.title.update(titleData, {
        where: { id: titleId },
      });
      actionDate = titleData.updated_at;

      const newTitle = await model.title.findOne({
        where: { id: titleId, record_status: "active" },
      });

      // ---------------------------------Language dependent values---------------------------------
      // Finding all the request with respect to language- inserting data into titltranslation
      for (const titleValue of findRequestId) {
        const titleTranslationData = {
          title_id: newTitle.id,
          site_language: titleValue.site_language,
          name: titleValue.name ? titleValue.name : null,
          aka: findRequestId[0].aka ? findRequestId[0].aka : null,
          plot_summary: titleValue.plot_summary ? titleValue.plot_summary : null,
          description: titleValue.description ? titleValue.description : null,
          tagline: findRequestId[0].tagline ? findRequestId[0].tagline : null,
        };
        const languageIndependent = {
          aka: findRequestId[0].aka ? findRequestId[0].aka : null,
          tagline: findRequestId[0].tagline ? findRequestId[0].tagline : null,
          synopsis: findRequestId[0].synopsis ? findRequestId[0].synopsis : null,
        };
        const getTitleTranslation = await model.titleTranslation.findOne({
          where: {
            title_id: newTitle.id,
            status: "active",
            site_language: titleValue.site_language,
          },
        });
        if (getTitleTranslation) {
          titleTranslationData.updated_by = userId;
          titleTranslationData.updated_at = await customDateTimeHelper.getCurrentDateTime();
          await model.titleTranslation.update(titleTranslationData, {
            where: { id: getTitleTranslation.id, title_id: newTitle.id },
          });
          actionDate = titleTranslationData.updated_at;
        } else {
          titleTranslationData.created_by = userId;
          titleTranslationData.created_at = await customDateTimeHelper.getCurrentDateTime();
          await model.titleTranslation.create(titleTranslationData);
          actionDate = titleTranslationData.created_at;

          // update the language independent values:
          languageIndependent.updated_by = userId;
          languageIndependent.updated_at = await customDateTimeHelper.getCurrentDateTime();
          await model.titleTranslation.update(languageIndependent, {
            where: { title_id: newTitle.id, status: "active" },
          });
          actionDate = languageIndependent.updated_at;
        }

        //   create the data in the Original works table
        const originalWorksDetails =
          titleValue.original_work_details != null
            ? JSON.parse(titleValue.original_work_details)
            : null;
        if (originalWorksDetails != null && originalWorksDetails.list.length > 0) {
          const oolData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.originalWorks.update(oolData, {
            where: {
              title_id: newTitle.id,
              site_language: titleValue.site_language,
              status: "active",
            },
          });
          actionDate = oolData.updated_at;

          for (const value of originalWorksDetails.list) {
            const originalWorksData = {
              title_id: newTitle.id,
              ow_type: value.ow_type,
              ow_title: value.ow_title,
              ow_original_artis: value.ow_original_artis,
              site_language: titleValue.site_language,
            };
            if (value.id) {
              const getOriginalWorks = await model.originalWorks.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  site_language: value.site_language
                    ? value.site_language
                    : titleValue.site_language,
                },
              });
              originalWorksData.status = "active";
              originalWorksData.updated_at = await customDateTimeHelper.getCurrentDateTime();
              originalWorksData.updated_by = userId;
              if (getOriginalWorks) {
                await model.originalWorks.update(originalWorksData, {
                  where: { id: getOriginalWorks.id, title_id: newTitle.id },
                });
                actionDate = originalWorksData.updated_at;
              }
            } else {
              originalWorksData.created_at = await customDateTimeHelper.getCurrentDateTime();
              originalWorksData.created_by = userId;
              const checkOriginalWorks = await model.originalWorks.findOne({
                where: {
                  title_id: newTitle.id,
                  status: "active",
                  ow_type: value.ow_type,
                  ow_title: value.ow_title,
                  ow_original_artis: value.ow_original_artis,
                  site_language: value.site_language
                    ? value.site_language
                    : titleValue.site_language,
                },
              });
              if (!checkOriginalWorks) {
                await model.originalWorks.create(originalWorksData);
                actionDate = originalWorksData.created_at;
              }
            }
          }
        } else {
          const getOriginalWorks = await model.originalWorks.findAll({
            where: {
              title_id: newTitle.id,
              site_language: titleValue.site_language,
              status: "active",
            },
          });
          if (getOriginalWorks && getOriginalWorks.length > 0) {
            const owuData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.originalWorks.update(owuData, {
              where: {
                title_id: newTitle.id,
                site_language: titleValue.site_language,
                status: "active",
              },
            });
            actionDate = owuData.updated_at;
          }
        }
      }

      // list creteded to remove the duplicate of the following field
      const reReleaseList = [];
      const watchOnStreamList = [];
      const watchOnBuyList = [];
      const watchOnRentList = [];

      // -----------------------Language independent data----------------------------------
      if (findRequestId[0].type === "movie" && newTitle.id) {
        //   create the data in the Title countries table
        const countryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (countryDetails != null && countryDetails.list.length > 0) {
          const uoctData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.titleCountries.update(uoctData, {
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          actionDate = uoctData.updated_at;

          for (const value of countryDetails.list) {
            const titleCountries = {
              title_id: newTitle.id,
              country_id: value.country_id,
              site_language: value.site_language ? value.site_language : "en",
            };
            if (value.id) {
              const getTitleCountries = await model.titleCountries.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  country_id: value.country_id,
                },
              });
              titleCountries.status = "active";
              titleCountries.updated_at = await customDateTimeHelper.getCurrentDateTime();
              titleCountries.updated_by = userId;
              if (getTitleCountries) {
                await model.titleCountries.update(titleCountries, {
                  where: { id: getTitleCountries.id, title_id: newTitle.id },
                });
                actionDate = titleCountries.updated_at;
              }
            } else {
              titleCountries.created_by = userId;
              titleCountries.created_at = await customDateTimeHelper.getCurrentDateTime();
              const checkTitleCountries = await model.titleCountries.findOne({
                where: {
                  country_id: value.country_id,
                  title_id: newTitle.id,
                  status: "active",
                },
              });
              if (!checkTitleCountries) {
                await model.titleCountries.create(titleCountries);
                actionDate = titleCountries.created_at;
              }
            }
          }
        } else {
          const getTitleCountries = await model.titleCountries.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getTitleCountries && getTitleCountries.length > 0) {
            const unctData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.titleCountries.update(unctData, {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            });
            actionDate = unctData.updated_at;
          }
        }

        //   create the data in the Rerelease table
        const reReleaseDetails =
          findRequestId[0].re_release_details != null
            ? JSON.parse(findRequestId[0].re_release_details)
            : null;
        if (reReleaseDetails != null && reReleaseDetails.list.length > 0) {
          const ortData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.titleReRelease.update(ortData, {
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          actionDate = ortData.updated_at;

          for (const value of reReleaseDetails.list) {
            if (reReleaseList.length === 0 || reReleaseList.indexOf(value.re_release_date) === -1) {
              reReleaseList.push(value.re_release_date);

              const titleReReleaseDate = {
                title_id: newTitle.id,
                re_release_date: value.re_release_date,
              };

              if (value.id) {
                const getTitleReRelease = await model.titleReRelease.findOne({
                  where: {
                    id: value.id,
                    title_id: newTitle.id,
                    re_release_date: value.re_release_date,
                  },
                });
                titleReReleaseDate.status = "active";
                titleReReleaseDate.updated_at = await customDateTimeHelper.getCurrentDateTime();
                titleReReleaseDate.updated_by = userId;
                if (getTitleReRelease) {
                  await model.titleReRelease.update(titleReReleaseDate, {
                    where: { id: getTitleReRelease.id, title_id: newTitle.id },
                  });
                  actionDate = titleReReleaseDate.updated_at;
                }
              } else {
                titleReReleaseDate.created_at = await customDateTimeHelper.getCurrentDateTime();
                titleReReleaseDate.created_by = userId;
                const checkTitleReRelease = await model.titleReRelease.findOne({
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    re_release_date: value.re_release_date,
                  },
                });
                if (!checkTitleReRelease) {
                  await model.titleReRelease.create(titleReReleaseDate);
                  actionDate = titleReReleaseDate.created_at;
                }
              }
            }
          }
        } else {
          const getTitleReRelease = await model.titleReRelease.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getTitleReRelease && getTitleReRelease.length > 0) {
            const urtData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.titleReRelease.update(urtData, {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            });
            actionDate = urtData.updated_at;
          }
        }

        //   create the data in the series table
        const seriesDetails =
          findRequestId[0].series_details != null
            ? JSON.parse(findRequestId[0].series_details)
            : null;
        let combinationSeries = [];
        if (seriesDetails != null && seriesDetails.list.length > 0) {
          const orsdData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.relatedSeriesTitle.update(orsdData, {
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          actionDate = orsdData.updated_at;

          for (const value of seriesDetails.list) {
            const seriesData = {
              title_id: newTitle.id,
              related_series_title_id: value.related_title_id,
              site_language: value.site_language ? value.site_language : "en",
            };
            if (value.id) {
              const getRelatedSeriesTitle = await model.relatedSeriesTitle.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  related_series_title_id: value.related_title_id,
                },
              });
              seriesData.status = "active";
              seriesData.updated_at = await customDateTimeHelper.getCurrentDateTime();
              seriesData.updated_by = userId;
              if (getRelatedSeriesTitle) {
                await model.relatedSeriesTitle.update(seriesData, {
                  where: { id: getRelatedSeriesTitle.id, title_id: newTitle.id },
                });
                actionDate = seriesData.updated_at;
              }
            } else if (!value.id && value.tmdb_id && !value.related_title_id) {
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
            } else if (!value.id && value.related_title_id) {
              seriesData.created_at = await customDateTimeHelper.getCurrentDateTime();
              seriesData.created_by = userId;
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
        } else {
          const getRelatedSeriesTitle = await model.relatedSeriesTitle.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getRelatedSeriesTitle && getRelatedSeriesTitle.length > 0) {
            const grstData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.relatedSeriesTitle.update(grstData, {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            });
            actionDate = grstData.updated_at;
          }
        }

        //   create the data in the connection table
        const connectionDetails =
          findRequestId[0].connection_details != null
            ? JSON.parse(findRequestId[0].connection_details)
            : null;
        if (connectionDetails != null && connectionDetails.list.length > 0) {
          const rtcolData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.relatedTitle.update(rtcolData, {
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          actionDate = rtcolData.updated_at;

          for (const value of connectionDetails.list) {
            const connectionData = {
              title_id: newTitle.id,
              related_title_id: value.related_title_id,
              site_language: value.site_language ? value.site_language : "en",
              season_id: value.season_id ? value.season_id : null,
              episode_id: value.episode_id ? value.episode_id : null,
            };
            if (value.id) {
              const getRelatedTitle = await model.relatedTitle.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  related_title_id: value.related_title_id,
                },
              });
              connectionData.status = "active";
              connectionData.updated_at = await customDateTimeHelper.getCurrentDateTime();
              connectionData.updated_by = userId;
              if (getRelatedTitle) {
                await model.relatedTitle.update(connectionData, {
                  where: { id: getRelatedTitle.id, title_id: newTitle.id },
                });
                actionDate = connectionData.updated_at;
              }
            } else {
              connectionData.created_at = await customDateTimeHelper.getCurrentDateTime();
              connectionData.created_by = userId;
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
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }
              if (!checkOtherConnection) {
                const connectionOtherData = {
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
                await model.relatedTitle.create(connectionOtherData);
                actionDate = connectionOtherData.created_at;
              }
            }
          }
        } else {
          const getRelatedTitle = await model.relatedTitle.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getRelatedTitle && getRelatedTitle.length > 0) {
            const cretData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.relatedTitle.update(cretData, {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            });
            actionDate = cretData.updated_at;
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
          const oltkwData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.titleKeyword.update(oltkwData, {
            where: {
              title_id: newTitle.id,
              keyword_type: "search",
              status: "active",
            },
          });
          actionDate = oltkwData.updated_at;

          for (const value of searchKeywordDetails.list) {
            if (value.keyword) {
              const searchKeywordData = {
                title_id: newTitle.id,
                site_language: findRequestId[0].site_language,
                keyword: value.keyword ? value.keyword : null,
                keyword_type: value.keyword_type ? value.keyword_type : null,
              };

              const getTitleKeyword = await model.titleKeyword.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  keyword_type: "search",
                  keyword: value.keyword,
                },
              });

              if (getTitleKeyword) {
                searchKeywordData.status = "active";
                searchKeywordData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                searchKeywordData.updated_by = userId;
                await model.titleKeyword.update(searchKeywordData, {
                  where: { id: getTitleKeyword.id, title_id: newTitle.id },
                });
                actionDate = searchKeywordData.updated_at;
              } else {
                searchKeywordData.created_at = await customDateTimeHelper.getCurrentDateTime();
                searchKeywordData.created_by = userId;
                const checkTitleKeyword = await model.titleKeyword.findOne({
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    keyword: value.keyword ? value.keyword : null,
                    keyword_type: value.keyword_type ? value.keyword_type : "search",
                  },
                });
                if (!checkTitleKeyword) {
                  await model.titleKeyword.create(searchKeywordData);
                  actionDate = searchKeywordData.created_at;
                }
              }
            }
          }
        } else {
          const getTitleKeyword = await model.titleKeyword.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
              keyword_type: "search",
            },
          });
          if (getTitleKeyword && getTitleKeyword.length > 0) {
            const rtkwupData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.titleKeyword.update(rtkwupData, {
              where: {
                title_id: newTitle.id,
                keyword_type: "search",
                status: "active",
              },
            });
            actionDate = rtkwupData.updated_at;
          }
        }
        if (newsKeywordDetails != null && newsKeywordDetails.list.length > 0) {
          const nkwtData = {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          };
          await model.titleKeyword.update(nkwtData, {
            where: {
              title_id: newTitle.id,
              keyword_type: "news",
              status: "active",
            },
          });
          actionDate = nkwtData.updated_at;

          for (const value of newsKeywordDetails.list) {
            if (value.keyword) {
              const newsKeywordData = {
                title_id: newTitle.id,
                site_language: value.site_language ? value.site_language : "en",
                keyword: value.keyword ? value.keyword : null,
                keyword_type: value.keyword_type ? value.keyword_type : null,
              };

              const getNewsTitleKeyword = await model.titleKeyword.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  keyword_type: "news",
                  keyword: value.keyword,
                },
              });

              if (getNewsTitleKeyword) {
                newsKeywordData.status = "active";
                newsKeywordData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                newsKeywordData.updated_by = userId;
                await model.titleKeyword.update(newsKeywordData, {
                  where: { id: getNewsTitleKeyword.id, title_id: newTitle.id },
                });
                actionDate = newsKeywordData.updated_at;
              } else {
                newsKeywordData.created_at = await customDateTimeHelper.getCurrentDateTime();
                newsKeywordData.created_by = userId;
                const checkNewsTitleKeyword = await model.titleKeyword.findOne({
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    keyword: value.keyword ? value.keyword : null,
                    keyword_type: value.keyword_type ? value.keyword_type : "news",
                  },
                });
                if (!checkNewsTitleKeyword) {
                  await model.titleKeyword.create(newsKeywordData);
                  actionDate = newsKeywordData.created_at;
                }
              }
            }
          }
        } else {
          const getNewsTitleKeyword = await model.titleKeyword.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
              keyword_type: "news",
            },
          });
          if (getNewsTitleKeyword && getNewsTitleKeyword.length > 0) {
            const nkwtupData = {
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
              status: "deleted",
            };
            await model.titleKeyword.update(nkwtupData, {
              where: {
                title_id: newTitle.id,
                keyword_type: "news",
                status: "active",
              },
            });
            actionDate = nkwtupData.updated_at;
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
          await model.titleWatchOn.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                type: "stream",
                status: "active",
              },
            },
          );
          for (const value of watchOnStreamDetails.list) {
            if (
              value &&
              value.provider_id != "undefined" &&
              value.provider_id != null &&
              (watchOnStreamList.length === 0 ||
                watchOnStreamList.indexOf(value.provider_id) === -1)
            ) {
              watchOnStreamList.push(value.provider_id);
              const watchOnData = {
                title_id: newTitle.id,
                movie_id: value.movie_id ? value.movie_id : null,
                url: value.url ? value.url : null,
                type: value.type ? value.type : "stream",
                provider_id: value.provider_id ? value.provider_id : null,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
              };
              if (value.id) {
                const getTitleWatchOnStream = await model.titleWatchOn.findOne({
                  where: {
                    id: value.id,
                    title_id: newTitle.id,
                    type: "stream",
                  },
                });
                watchOnData.status = "active";
                watchOnData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                watchOnData.updated_by = userId;
                if (getTitleWatchOnStream) {
                  await model.titleWatchOn.update(watchOnData, {
                    where: { id: getTitleWatchOnStream.id, title_id: newTitle.id },
                  });
                  actionDate = watchOnData.updated_at;
                }
              } else {
                watchOnData.created_at = await customDateTimeHelper.getCurrentDateTime();
                watchOnData.created_by = userId;
                const checkTitleWatchOnStream = await model.titleWatchOn.findOne({
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    provider_id: value.provider_id,
                    type: "stream",
                  },
                });
                if (!checkTitleWatchOnStream) {
                  await model.titleWatchOn.create(watchOnData);
                  actionDate = watchOnData.created_at;
                }
              }
            }
          }
        } else {
          const getTitleWatchOnStream = await model.titleWatchOn.findAll({
            where: {
              title_id: newTitle.id,
              type: "stream",
              status: "active",
            },
          });
          if (getTitleWatchOnStream && getTitleWatchOnStream.length > 0) {
            await model.titleWatchOn.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  type: "stream",
                  status: "active",
                },
              },
            );
          }
        }
        if (watchOnRentDetails != null && watchOnRentDetails.list.length > 0) {
          await model.titleWatchOn.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                type: "rent",
                status: "active",
              },
            },
          );
          for (const value of watchOnRentDetails.list) {
            if (
              value &&
              value.provider_id != "undefined" &&
              value.provider_id != null &&
              (watchOnRentList.length === 0 || watchOnRentList.indexOf(value.provider_id) === -1)
            ) {
              watchOnRentList.push(value.provider_id);
              const watchOnData = {
                title_id: newTitle.id,
                movie_id: value.movie_id ? value.movie_id : null,
                url: value.url ? value.url : null,
                type: value.type ? value.type : "rent",
                provider_id: value.provider_id ? value.provider_id : null,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
              };
              if (value.id) {
                const getTitleWatchOnRent = await model.titleWatchOn.findOne({
                  where: {
                    id: value.id,
                    title_id: newTitle.id,
                    type: "rent",
                  },
                });
                watchOnData.status = "active";
                watchOnData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                watchOnData.updated_by = userId;
                if (getTitleWatchOnRent) {
                  await model.titleWatchOn.update(watchOnData, {
                    where: { id: getTitleWatchOnRent.id, title_id: newTitle.id },
                  });
                  actionDate = watchOnData.updated_at;
                }
              } else {
                watchOnData.created_at = await customDateTimeHelper.getCurrentDateTime();
                watchOnData.created_by = userId;
                const checkTitleWatchOnRent = await model.titleWatchOn.findOne({
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    provider_id: value.provider_id,
                    type: "rent",
                  },
                });
                if (!checkTitleWatchOnRent) {
                  await model.titleWatchOn.create(watchOnData);
                  actionDate = watchOnData.created_at;
                }
              }
            }
          }
        } else {
          const getTitleWatchOnRent = await model.titleWatchOn.findAll({
            where: {
              title_id: newTitle.id,
              type: "rent",
              status: "active",
            },
          });
          if (getTitleWatchOnRent && getTitleWatchOnRent.length > 0) {
            await model.titleWatchOn.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  type: "rent",
                  status: "active",
                },
              },
            );
          }
        }
        if (watchOnBuyDetails != null && watchOnBuyDetails.list.length > 0) {
          await model.titleWatchOn.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                type: "buy",
                status: "active",
              },
            },
          );
          for (const value of watchOnBuyDetails.list) {
            if (
              value &&
              value.provider_id != "undefined" &&
              value.provider_id != null &&
              (watchOnBuyList.length === 0 || watchOnBuyList.indexOf(value.provider_id) === -1)
            ) {
              watchOnBuyList.push(value.provider_id);
              const watchOnData = {
                title_id: newTitle.id,
                movie_id: value.movie_id ? value.movie_id : null,
                url: value.url ? value.url : null,
                type: value.type ? value.type : "buy",
                provider_id: value.provider_id ? value.provider_id : null,
                season_id: value.season_id ? value.season_id : null,
                episode_id: value.episode_id ? value.episode_id : null,
              };
              if (value.id) {
                const getTitleWatchOnBuy = await model.titleWatchOn.findOne({
                  where: {
                    id: value.id,
                    title_id: newTitle.id,
                    type: "buy",
                  },
                });
                watchOnData.status = "active";
                watchOnData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                watchOnData.updated_by = userId;
                if (getTitleWatchOnBuy) {
                  await model.titleWatchOn.update(watchOnData, {
                    where: { id: getTitleWatchOnBuy.id, title_id: newTitle.id },
                  });
                  actionDate = watchOnData.updated_at;
                }
              } else {
                watchOnData.created_at = await customDateTimeHelper.getCurrentDateTime();
                watchOnData.created_by = userId;
                const checkTitleWatchOnBuy = await model.titleWatchOn.findOne({
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    provider_id: value.provider_id,
                    type: "buy",
                  },
                });
                if (!checkTitleWatchOnBuy) {
                  await model.titleWatchOn.create(watchOnData);
                  actionDate = watchOnData.created_at;
                }
              }
            }
          }
        } else {
          const getTitleWatchOnBuy = await model.titleWatchOn.findAll({
            where: {
              title_id: newTitle.id,
              type: "buy",
              status: "active",
            },
          });
          if (getTitleWatchOnBuy && getTitleWatchOnBuy.length > 0) {
            await model.titleWatchOn.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  type: "buy",
                  status: "active",
                },
              },
            );
          }
        }

        // ------------------------------media details---------------------------------
        // storing the media details type movie::
        let requestId = [];
        let foundMediaData = [];
        for (const value of findRequestId) {
          if (value.id) {
            requestId.push(value.id);
          }
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
          // video details
          if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
            await model.video.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                  video_for: "title",
                },
              },
            );
            isVideoModified = true;

            for (const value of parsedVideoDetails.list) {
              if (value) {
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
                  user_id: userId,
                  category: value.category ? value.category : "trailer",
                  is_official_trailer: value.is_official_trailer
                    ? value.is_official_trailer
                    : "null",
                  site_language: value.site_language ? value.site_language : "en",
                  video_source: value.url
                    ? await generalHelper.checkUrlSource(value.url)
                    : "youtube",
                  video_for: "title",
                  no_of_view: value.no_of_view ? value.no_of_view : 0,
                  video_duration: value.video_duration ? value.video_duration : null,
                };
                if (value.id) {
                  const getTitleVideo = await model.video.findOne({
                    where: {
                      id: value.id,
                      title_id: newTitle.id,
                      video_for: "title",
                    },
                  });
                  videoData.status = "active";
                  videoData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                  videoData.updated_by = userId;
                  if (getTitleVideo) {
                    await model.video.update(videoData, {
                      where: { id: getTitleVideo.id, title_id: newTitle.id },
                    });
                    actionDate = videoData.updated_at;
                  }
                  isVideoModified = true;
                } else {
                  const getLastOrder = await model.video.max("list_order", {
                    where: {
                      title_id: newTitle.id,
                      video_for: "title",
                    },
                  });
                  videoData.list_order = getLastOrder ? getLastOrder + 1 : 1;
                  videoData.created_at = await customDateTimeHelper.getCurrentDateTime();
                  videoData.created_by = userId;
                  videoData.ele_no_of_view = 0;
                  const checkTitleVideo = await model.video.findOne({
                    where: {
                      title_id: newTitle.id,
                      status: "active",
                      name: value.name,
                      url: value.url ? value.url : null,
                      type: value.type,
                      video_for: "title",
                    },
                  });
                  if (!checkTitleVideo) {
                    await model.video.create(videoData);
                    actionDate = videoData.created_at;
                    isVideoModified = true;
                  }
                }
              }
            }
          } else {
            const getTitleVideo = await model.video.findAll({
              where: {
                title_id: newTitle.id,
                status: "active",
                video_for: "title",
              },
            });
            if (getTitleVideo && getTitleVideo.length > 0) {
              await model.video.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    video_for: "title",
                  },
                },
              );
              isVideoModified = true;
            }
          }
          // image details
          if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
            await model.titleImage.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                  image_category: "image",
                },
              },
            );
            for (const value of parsedImageDetails.list) {
              if (value) {
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
                  image_category: value.image_category ? value.image_category : "image",
                  is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                  site_language: value.site_language ? value.site_language : "en",
                };
                if (value.id) {
                  const getTitleImage = await model.titleImage.findOne({
                    where: {
                      id: value.id,
                      title_id: newTitle.id,
                      image_category: value.image_category ? value.image_category : "image",
                    },
                  });
                  imageData.status = "active";
                  imageData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                  imageData.updated_by = userId;
                  if (getTitleImage) {
                    await model.titleImage.update(imageData, {
                      where: { id: getTitleImage.id, title_id: newTitle.id },
                    });
                    actionDate = imageData.updated_at;
                  }
                } else {
                  const getLastOrder = await model.titleImage.max("list_order", {
                    where: {
                      title_id: newTitle.id,
                      image_category: "image",
                    },
                  });
                  imageData.list_order = getLastOrder ? getLastOrder + 1 : 1;
                  imageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                  imageData.created_by = userId;
                  const checkTitleImage = await model.titleImage.findOne({
                    where: {
                      title_id: newTitle.id,
                      status: "active",
                      image_category: value.image_category ? value.image_category : "image",
                      original_name: value.original_name ? value.original_name : null,
                      file_name: value.file_name ? value.file_name : null,
                    },
                  });
                  if (!checkTitleImage) {
                    await model.titleImage.create(imageData);
                    actionDate = imageData.created_at;
                  }
                }
              }
            }
          } else {
            const getTitleImage = await model.titleImage.findAll({
              where: {
                title_id: newTitle.id,
                image_category: "image",
                status: "active",
              },
            });
            if (getTitleImage && getTitleImage.length > 0) {
              await model.titleImage.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    image_category: "image",
                  },
                },
              );
            }
          }
          // poster details
          if (parsedPosterDetails != null && parsedPosterDetails.list.length > 0) {
            await model.titleImage.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                  image_category: "poster_image",
                },
              },
            );
            for (const posterValue of parsedPosterDetails.list) {
              if (posterValue) {
                const posterImageData = {
                  original_name: posterValue.original_name ? posterValue.original_name : null,
                  file_name: posterValue.file_name ? posterValue.file_name : null,
                  url: posterValue.url ? posterValue.url : null,
                  path: posterValue.path ? posterValue.path : null,
                  file_size: posterValue.file_size ? posterValue.file_size : null,
                  mime_type: posterValue.mime_type ? posterValue.mime_type : null,
                  file_extension: posterValue.file_extension ? posterValue.file_extension : null,
                  title_id: newTitle.id,
                  season_id: posterValue.season_id ? posterValue.season_id : null,
                  episode_id: posterValue.episode_id ? posterValue.episode_id : null,
                  source: posterValue.source ? posterValue.source : "local",
                  approved: posterValue.approved ? posterValue.approved : 1,
                  image_category: posterValue.image_category,
                  is_main_poster: posterValue.is_main_poster ? posterValue.is_main_poster : null,
                  site_language: posterValue.site_language ? posterValue.site_language : "en",
                };
                if (posterValue.id) {
                  const getTitlePosterImage = await model.titleImage.findOne({
                    where: {
                      id: posterValue.id,
                      title_id: newTitle.id,
                      image_category: posterValue.image_category
                        ? posterValue.image_category
                        : "poster_image",
                    },
                  });
                  posterImageData.status = "active";
                  posterImageData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                  posterImageData.updated_by = userId;
                  if (getTitlePosterImage) {
                    await model.titleImage.update(posterImageData, {
                      where: { id: getTitlePosterImage.id, title_id: newTitle.id },
                    });
                    actionDate = posterImageData.updated_at;
                  }
                } else {
                  const getLastOrder = await model.titleImage.max("list_order", {
                    where: {
                      title_id: newTitle.id,
                      image_category: "poster_image",
                    },
                  });
                  posterImageData.list_order = getLastOrder ? getLastOrder + 1 : 1;
                  posterImageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                  posterImageData.created_by = userId;
                  const checkTitlePosterImage = await model.titleImage.findOne({
                    where: {
                      title_id: newTitle.id,
                      status: "active",
                      image_category: posterValue.image_category
                        ? posterValue.image_category
                        : "poster_image",
                      original_name: posterValue.original_name ? posterValue.original_name : null,
                      file_name: posterValue.file_name ? posterValue.file_name : null,
                    },
                  });
                  if (!checkTitlePosterImage) {
                    await model.titleImage.create(posterImageData);
                    actionDate = posterImageData.created_at;
                  }
                }
              }
            }
          } else {
            const getTitlePosterImage = await model.titleImage.findAll({
              where: {
                title_id: newTitle.id,
                image_category: "poster_image",
                status: "active",
              },
            });
            if (getTitlePosterImage && getTitlePosterImage.length > 0) {
              await model.titleImage.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    image_category: "poster_image",
                  },
                },
              );
            }
          }
          // background image
          if (
            parsedBackgroundImageDetails != null &&
            parsedBackgroundImageDetails.list.length > 0
          ) {
            await model.titleImage.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                  image_category: "bg_image",
                },
              },
            );
            for (const value of parsedBackgroundImageDetails.list) {
              if (value) {
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
                  image_category: value.image_category ? value.image_category : "bg_image",
                  is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                  site_language: value.site_language ? value.site_language : "en",
                };
                if (value.id) {
                  const getTitleBgImage = await model.titleImage.findOne({
                    where: {
                      id: value.id,
                      title_id: newTitle.id,
                      image_category: value.image_category ? value.image_category : "bg_image",
                    },
                  });
                  backgroundImageData.status = "active";
                  backgroundImageData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                  backgroundImageData.updated_by = userId;
                  if (getTitleBgImage) {
                    await model.titleImage.update(backgroundImageData, {
                      where: { id: getTitleBgImage.id, title_id: newTitle.id },
                    });
                    actionDate = backgroundImageData.updated_at;
                  }
                } else {
                  const getLastOrder = await model.titleImage.max("list_order", {
                    where: {
                      title_id: newTitle.id,
                      image_category: "bg_image",
                    },
                  });
                  backgroundImageData.list_order = getLastOrder ? getLastOrder + 1 : 1;
                  backgroundImageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                  backgroundImageData.created_by = userId;
                  const checkTitleBgImage = await model.titleImage.findOne({
                    where: {
                      title_id: newTitle.id,
                      status: "active",
                      image_category: value.image_category ? value.image_category : "bg_image",
                      original_name: value.original_name ? value.original_name : null,
                      file_name: value.file_name ? value.file_name : null,
                    },
                  });
                  if (!checkTitleBgImage) {
                    await model.titleImage.create(backgroundImageData);
                    actionDate = backgroundImageData.created_at;
                  }
                }
              }
            }
          } else {
            const getTitleBgImage = await model.titleImage.findAll({
              where: {
                title_id: newTitle.id,
                image_category: "bg_image",
                status: "active",
              },
            });
            if (getTitleBgImage && getTitleBgImage.length > 0) {
              await model.titleImage.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    title_id: newTitle.id,
                    status: "active",
                    image_category: "bg_image",
                  },
                },
              );
            }
          }
        }
        // -----------------------------credit details-------------------------------------
        let foundCreditData = [];
        // storing the credit data:
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
            await model.creditable.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  status: "active",
                  creditable_id: newTitle.id,
                  department: "cast",
                  creditable_type: "title",
                },
              },
            );
            for (const castData of parsedCastDetails.list) {
              if (castData) {
                let peopleId = 0;
                if (
                  castData.people_id === "" &&
                  (castData.cast_name != null || castData.cast_name != "")
                )
                  if (castData.tmdb_id) {
                    // Two scenarios:
                    // 1. people Id is not present and TMDB id present
                    // 2. people Id is not present and TMDB id is not present - create new people pop up modal
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
                      const peopleData = {
                        people_id: createPeople.id,
                        name: castData.cast_name,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      if (
                        !(await model.peopleTranslation.findOne({
                          where: { people_id: peopleId, site_language: "en" },
                        }))
                      ) {
                        await model.peopleTranslation.create(peopleData);
                      }
                      // adding poster image details to the people image table
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
                else {
                  peopleId = castData.people_id ? castData.people_id : "";
                }
                if (peopleId) {
                  const castDataDetails = {
                    people_id: peopleId,
                    creditable_id: newTitle.id,
                    character_name: castData.character_name ? castData.character_name : null,
                    list_order: castData.list_order,
                    department: castData.department ? castData.department : "cast",
                    job: castData.job ? castData.job : null,
                    creditable_type: castData.creditable_type ? castData.creditable_type : "title",
                    is_guest: castData.is_guest ? castData.is_guest : 0,
                    season_id: castData.season_id ? castData.season_id : null,
                    episode_id: castData.episode_id ? castData.episode_id : null,
                    site_language: castData.site_language ? castData.site_language : "en",
                  };
                  // adding people Job details
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
                  // creditable table Update
                  if (castData.id) {
                    const getTitleCreditable = await model.creditable.findOne({
                      where: {
                        id: castData.id,
                        creditable_id: newTitle.id,
                        department: "cast",
                        creditable_type: "title",
                      },
                    });
                    castDataDetails.status = "active";
                    castDataDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
                    castDataDetails.updated_by = userId;
                    if (getTitleCreditable) {
                      await model.creditable.update(castDataDetails, {
                        where: {
                          id: getTitleCreditable.id,
                          creditable_id: newTitle.id,
                          department: "cast",
                          creditable_type: "title",
                        },
                      });
                      actionDate = castDataDetails.updated_at;
                    }
                  } else {
                    castDataDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
                    castDataDetails.created_by = userId;
                    const checkTitleCreditable = await model.creditable.findOne({
                      where: {
                        status: "active",
                        people_id: peopleId,
                        creditable_id: newTitle.id,
                        character_name: castData.character_name ? castData.character_name : null,
                        department: castData.department ? castData.department : "cast",
                        job: castData.job ? castData.job : null,
                        creditable_type: castData.creditable_type
                          ? castData.creditable_type
                          : "title",
                      },
                    });
                    if (!checkTitleCreditable) {
                      await model.creditable.create(castDataDetails);
                      actionDate = castDataDetails.created_at;
                    }
                  }
                }
              }
            }
          } else {
            const getTitleCreditable = await model.creditable.findAll({
              where: {
                creditable_id: newTitle.id,
                department: "cast",
                creditable_type: "title",
                status: "active",
              },
            });
            if (getTitleCreditable && getTitleCreditable.length > 0) {
              await model.creditable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    status: "active",
                    creditable_id: newTitle.id,
                    department: "cast",
                    creditable_type: "title",
                  },
                },
              );
            }
          }
          if (parsedCrewDetails != null && parsedCrewDetails.list.length > 0) {
            let peopleCrewData = {};
            await model.creditable.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  status: "active",
                  creditable_id: newTitle.id,
                  department: "crew",
                  creditable_type: "title",
                },
              },
            );
            for (const crewData of parsedCrewDetails.list) {
              if (crewData) {
                let cpeopleId = 0;
                if (
                  crewData.people_id === "" &&
                  (crewData.cast_name != null || crewData.cast_name != "")
                )
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
                      cpeopleId = getPeople.id;
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
                          getPeopleData.results.adult && getPeopleData.results.adult === true
                            ? 1
                            : 0;
                        createCrew.popularity = getPeopleData.results.popularity
                          ? getPeopleData.results.popularity
                          : null;
                      }
                      const createPeople = await model.people.create(createCrew);
                      if (createPeople.id) {
                        cpeopleId = createPeople.id;
                        payloadPeopleList.push({
                          record_id: cpeopleId,
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
                              people_id: cpeopleId,
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
                            cpeopleId,
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
                            people_id: cpeopleId,
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
                          people_id: cpeopleId,
                          created_by: userId,
                        };
                        schedularAddData.push(schedularData);

                        // add data to the schedular table - people primary details other language
                        const schedularPrimaryData = {
                          tmdb_id: crewData.tmdb_id,
                          site_language: siteLanguage,
                          people_id: cpeopleId,
                          created_by: userId,
                          expected_site_language: swipLanguage,
                        };
                        schedularPrimaryAddData.push(schedularPrimaryData);
                      }
                    }
                  } else {
                    const createCrew = {
                      poster: crewData.poster,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    const createPeople = await model.people.create(createCrew);
                    if (createPeople.id) {
                      cpeopleId = createPeople.id;
                      payloadPeopleList.push({
                        record_id: cpeopleId,
                        type: "people",
                        action: "add",
                      });
                      const peopleCrewData = {
                        people_id: createPeople.id,
                        name: crewData.cast_name,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      if (
                        !(await model.peopleTranslation.findOne({
                          where: { people_id: cpeopleId, site_language: "en" },
                        }))
                      ) {
                        await model.peopleTranslation.create(peopleCrewData);
                      }
                      // adding poster image details to the people image table
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
                else {
                  cpeopleId = crewData.people_id ? crewData.people_id : "";
                }
                if (cpeopleId) {
                  const crewDataDetails = {
                    people_id: cpeopleId,
                    creditable_id: newTitle.id,
                    character_name: crewData.character_name ? crewData.character_name : null,
                    list_order: crewData.list_order,
                    department: crewData.department ? crewData.department : "crew",
                    job: crewData.job ? crewData.job : null,
                    creditable_type: crewData.creditable_type ? crewData.creditable_type : "title",
                    is_guest: crewData.is_guest ? crewData.is_guest : 0,
                    season_id: crewData.season_id ? crewData.season_id : null,
                    episode_id: crewData.episode_id ? crewData.episode_id : null,
                    site_language: crewData.site_language ? crewData.site_language : "en",
                  };

                  // adding data to people job
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
                          people_id: cpeopleId,
                          job_id: peopleJobId,
                          status: "active",
                        },
                      });
                      // list order
                      const getLastOrder = await model.peopleJobs.max("list_order", {
                        where: {
                          people_id: cpeopleId,
                          status: "active",
                        },
                      });
                      if (!isPeopleJobExist) {
                        const data = {
                          people_id: cpeopleId,
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
                  // Updating the exiting record
                  if (crewData.id) {
                    const getTitleCreditableCrew = await model.creditable.findOne({
                      where: {
                        id: crewData.id,
                        creditable_id: newTitle.id,
                        department: "crew",
                        creditable_type: "title",
                      },
                    });
                    crewDataDetails.status = "active";
                    crewDataDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
                    crewDataDetails.updated_by = userId;
                    if (getTitleCreditableCrew) {
                      await model.creditable.update(crewDataDetails, {
                        where: {
                          id: getTitleCreditableCrew.id,
                          creditable_id: newTitle.id,
                          department: "crew",
                          creditable_type: "title",
                        },
                      });
                      actionDate = crewDataDetails.updated_at;
                    }
                  } else {
                    crewDataDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
                    crewDataDetails.created_by = userId;
                    const checkTitleCreditableCrew = await model.creditable.findOne({
                      where: {
                        status: "active",
                        people_id: cpeopleId,
                        creditable_id: newTitle.id,
                        character_name: crewData.character_name ? crewData.character_name : null,
                        department: crewData.department ? crewData.department : "crew",
                        job: crewData.job ? crewData.job : null,
                        creditable_type: crewData.creditable_type
                          ? crewData.creditable_type
                          : "title",
                      },
                    });
                    if (!checkTitleCreditableCrew) {
                      await model.creditable.create(crewDataDetails);
                      actionDate = crewDataDetails.created_at;
                    }
                  }
                }
              }
            }
          } else {
            const getTitleCreditableCrew = await model.creditable.findAll({
              where: {
                creditable_id: newTitle.id,
                department: "crew",
                creditable_type: "title",
                status: "active",
              },
            });
            if (getTitleCreditableCrew && getTitleCreditableCrew.length > 0) {
              await model.creditable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    status: "active",
                    creditable_id: newTitle.id,
                    department: "crew",
                    creditable_type: "title",
                  },
                },
              );
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
                "Edit Sumbit all Movie Details",
                userId,
              ),
              schedulerJobService.addJobInScheduler(
                "add other language people primary data",
                JSON.stringify(primaryDetailsPayload),
                "people_language_primary_data",
                "Edit Sumbit all Movie Details",
                userId,
              ),
            ]);
          }
        }

        // -----------------------------Tag Data--------------------------------------------
        // create data for the tag section:
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
            //find genre tags
            const genreOldTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: "genre",
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (genreOldTags && genreOldTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: genreOldTags,
                    },
                  },
                },
              );
            }
            for (const value of parsedGenreDetails.list) {
              const genreData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
              };
              if (value.id) {
                const getTagGable = await model.tagGable.findOne({
                  where: {
                    id: value.id,
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                genreData.status = "active";
                genreData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                genreData.updated_by = userId;
                if (getTagGable) {
                  await model.tagGable.update(genreData, {
                    where: { id: getTagGable.id, taggable_id: newTitle.id },
                  });
                  actionDate = genreData.updated_at;
                }
              } else {
                genreData.created_at = await customDateTimeHelper.getCurrentDateTime();
                genreData.created_by = userId;
                const checkTagGable = await model.tagGable.findOne({
                  where: {
                    status: "active",
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                if (!checkTagGable) {
                  await model.tagGable.create(genreData);
                  actionDate = genreData.created_at;
                }
              }
            }
          } else {
            //find genre tags
            const genreOldTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: "genre",
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (genreOldTags && genreOldTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: genreOldTags,
                    },
                  },
                },
              );
            }
          }
          if (parsedTagDetails != null && parsedTagDetails.list.length > 0) {
            //find other tags
            const otherTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: { [Op.ne]: "genre" },
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (otherTags && otherTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: otherTags,
                    },
                  },
                },
              );
            }
            for (const value of parsedTagDetails.list) {
              const tagData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
              };
              if (value.id) {
                const getTagGable = await model.tagGable.findOne({
                  where: {
                    id: value.id,
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                tagData.status = "active";
                tagData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                tagData.updated_by = userId;
                if (getTagGable) {
                  await model.tagGable.update(tagData, {
                    where: { id: getTagGable.id, taggable_id: newTitle.id },
                  });
                  actionDate = tagData.updated_at;
                }
              } else {
                tagData.created_at = await customDateTimeHelper.getCurrentDateTime();
                tagData.created_by = userId;
                const checkTagGable = await model.tagGable.findOne({
                  where: {
                    status: "active",
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                if (!checkTagGable) {
                  await model.tagGable.create(tagData);
                  actionDate = tagData.created_at;
                }
              }
            }
          } else {
            //find other tags
            const otherTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: { [Op.ne]: "genre" },
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (otherTags && otherTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: otherTags,
                    },
                  },
                },
              );
            }
          }
          // }
        }
      }
      if (findRequestId[0].type === "tv" && newTitle.id) {
        //   create the data in the Title countries table
        const countryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (countryDetails != null && countryDetails.list.length > 0) {
          await model.titleCountries.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            },
          );
          for (const value of countryDetails.list) {
            const titleCountries = {
              title_id: newTitle.id,
              country_id: value.country_id,
              site_language: value.site_language ? value.site_language : "en",
            };
            if (value.id) {
              const getTitleCountries = await model.titleCountries.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  country_id: value.country_id,
                },
              });
              titleCountries.status = "active";
              titleCountries.updated_at = await customDateTimeHelper.getCurrentDateTime();
              titleCountries.updated_by = userId;
              if (getTitleCountries) {
                await model.titleCountries.update(titleCountries, {
                  where: { id: getTitleCountries.id, title_id: newTitle.id },
                });
                actionDate = titleCountries.updated_at;
              }
            } else {
              titleCountries.created_by = userId;
              titleCountries.created_at = await customDateTimeHelper.getCurrentDateTime();
              const checkTitleCountries = await model.titleCountries.findOne({
                where: {
                  country_id: value.country_id,
                  title_id: newTitle.id,
                  status: "active",
                },
              });
              if (!checkTitleCountries) {
                await model.titleCountries.create(titleCountries);
                actionDate = titleCountries.created_at;
              }
            }
          }
        } else {
          const getTitleCountries = await model.titleCountries.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getTitleCountries && getTitleCountries.length > 0) {
            await model.titleCountries.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                },
              },
            );
          }
        }

        //   create the data in the connection table
        const connectionDetails =
          findRequestId[0].connection_details != null
            ? JSON.parse(findRequestId[0].connection_details)
            : null;
        if (connectionDetails != null && connectionDetails.list.length > 0) {
          await model.relatedTitle.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            },
          );
          for (const value of connectionDetails.list) {
            const connectionData = {
              title_id: newTitle.id,
              related_title_id: value.related_title_id,
              site_language: findRequestId[0].site_language,
              season_id: value.season_id ? value.season_id : null,
              episode_id: value.episode_id ? value.episode_id : null,
            };
            if (value.id) {
              const getRelatedTitle = await model.relatedTitle.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  related_title_id: value.related_title_id,
                },
              });
              connectionData.status = "active";
              connectionData.updated_at = await customDateTimeHelper.getCurrentDateTime();
              connectionData.updated_by = userId;
              if (getRelatedTitle) {
                await model.relatedTitle.update(connectionData, {
                  where: { id: getRelatedTitle.id, title_id: newTitle.id },
                });
                actionDate = connectionData.updated_at;
              }
            } else {
              connectionData.created_at = await customDateTimeHelper.getCurrentDateTime();
              connectionData.created_by = userId;
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
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }
              if (!checkOtherConnection) {
                const connectionOtherData = {
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
                await model.relatedTitle.create(connectionOtherData);
                actionDate = connectionOtherData.created_at;
              }
            }
          }
        } else {
          const getRelatedTitle = await model.relatedTitle.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getRelatedTitle && getRelatedTitle.length > 0) {
            await model.relatedTitle.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                },
              },
            );
          }
        }
        // create a data for title_keywords details-tv details page-search keyword:
        const searchKeywordDetails =
          findRequestId[0].search_keyword_details != null
            ? JSON.parse(findRequestId[0].search_keyword_details)
            : null;
        if (searchKeywordDetails != null && searchKeywordDetails.list.length > 0) {
          await model.titleKeyword.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                keyword_type: "search",
                status: "active",
                season_id: null,
              },
            },
          );
          for (const value of searchKeywordDetails.list) {
            if (value.keyword) {
              const searchKeywordData = {
                title_id: newTitle.id,
                site_language: findRequestId[0].site_language,
                keyword: value.keyword ? value.keyword : null,
                keyword_type: value.keyword_type ? value.keyword_type : null,
              };

              const getTitleKeyword = await model.titleKeyword.findOne({
                where: {
                  title_id: newTitle.id,
                  keyword_type: "search",
                  keyword: value.keyword,
                },
              });

              if (getTitleKeyword) {
                searchKeywordData.status = "active";
                searchKeywordData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                searchKeywordData.updated_by = userId;
                await model.titleKeyword.update(searchKeywordData, {
                  where: { id: getTitleKeyword.id, title_id: newTitle.id },
                });
                actionDate = searchKeywordData.updated_at;
              } else {
                searchKeywordData.created_at = await customDateTimeHelper.getCurrentDateTime();
                searchKeywordData.created_by = userId;
                await model.titleKeyword.create(searchKeywordData);
                actionDate = searchKeywordData.created_at;
              }
            }
          }
        } else {
          const getTitleKeyword = await model.titleKeyword.findAll({
            where: {
              title_id: newTitle.id,
              keyword_type: "search",
              status: "active",
            },
          });
          if (getTitleKeyword && getTitleKeyword.length > 0) {
            await model.titleKeyword.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  keyword_type: "search",
                  status: "active",
                  season_id: null,
                },
              },
            );
          }
        }
        // -----------------------------Tag Data--------------------------------------------
        // create data for the tag section:
        let requestId = [];
        for (const value of findRequestId) {
          if (value.id) {
            requestId.push(value.id);
          }
        }
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
            //find genre tags
            const genreOldTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: "genre",
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (genreOldTags && genreOldTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: genreOldTags,
                    },
                  },
                },
              );
            }
            for (const value of parsedGenreDetails.list) {
              const genreData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
              };
              if (value.id) {
                const getTagGable = await model.tagGable.findOne({
                  where: {
                    id: value.id,
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                genreData.status = "active";
                genreData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                genreData.updated_by = userId;
                if (getTagGable) {
                  await model.tagGable.update(genreData, {
                    where: { id: getTagGable.id, taggable_id: newTitle.id },
                  });
                  actionDate = genreData.updated_at;
                }
              } else {
                genreData.created_at = await customDateTimeHelper.getCurrentDateTime();
                genreData.created_by = userId;
                const checkTagGable = await model.tagGable.findOne({
                  where: {
                    status: "active",
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                if (!checkTagGable) {
                  await model.tagGable.create(genreData);
                  actionDate = genreData.created_at;
                }
              }
            }
          } else {
            //find genre tags
            const genreOldTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: "genre",
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (genreOldTags && genreOldTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: genreOldTags,
                    },
                  },
                },
              );
            }
          }
          if (parsedTagDetails != null && parsedTagDetails.list.length > 0) {
            //find other tags
            const otherTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: { [Op.ne]: "genre" },
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (otherTags && otherTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: otherTags,
                    },
                  },
                },
              );
            }
            for (const value of parsedTagDetails.list) {
              const tagData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
              };
              if (value.id) {
                const getTagGable = await model.tagGable.findOne({
                  where: {
                    id: value.id,
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                tagData.status = "active";
                tagData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                tagData.updated_by = userId;
                if (getTagGable) {
                  await model.tagGable.update(tagData, {
                    where: { id: getTagGable.id, taggable_id: newTitle.id },
                  });
                  actionDate = tagData.updated_at;
                }
              } else {
                tagData.created_at = await customDateTimeHelper.getCurrentDateTime();
                tagData.created_by = userId;
                const checkTagGable = await model.tagGable.findOne({
                  where: {
                    status: "active",
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                if (!checkTagGable) {
                  await model.tagGable.create(tagData);
                  actionDate = tagData.created_at;
                }
              }
            }
          } else {
            //find other tags
            const otherTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: { [Op.ne]: "genre" },
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (otherTags && otherTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: otherTags,
                    },
                  },
                },
              );
            }
          }
          // }
        }

        // ----------------- season related details -----------------
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
        // latestReqModified - latest season request for first language
        // anotherRequestId - if another request is generated for another language - it is used for season translation tables
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

        const [foundSeasonData, foundCreditData, foundMediaData, foundEpisodeDataDetails] =
          await Promise.all([
            model.titleRequestSeasonDetails.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
            model.titleRequestCredit.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
            model.titleRequestMedia.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
            model.titleRequestEpisodeDetails.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
          ]);

        // Season Details:
        let newSeasonAdded = [];
        if (foundSeasonData && foundSeasonData.length > 0) {
          for (const titleSeasonData of foundSeasonData) {
            const seasonWatchOnStreamList = [];
            const seasonWatchOnBuyList = [];
            const seasonWatchOnRentList = [];
            if (titleSeasonData) {
              const parsedSeasonData =
                titleSeasonData.season_details != null
                  ? JSON.parse(titleSeasonData.season_details)
                  : null;
              if (parsedSeasonData != null) {
                const seasonData = {
                  release_date: parsedSeasonData.release_date
                    ? parsedSeasonData.release_date
                    : null,
                  release_date_to: parsedSeasonData.release_date_to
                    ? parsedSeasonData.release_date_to
                    : null,
                  poster: parsedSeasonData.poster ? parsedSeasonData.poster : null,
                  number: parsedSeasonData.number,
                  season_name: parsedSeasonData.season_name ? parsedSeasonData.season_name : null,
                  title_tmdb_id: newTitle.tmdb_id ? newTitle.tmdb_id : null,
                  summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                  aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                  episode_count: parsedSeasonData.episode_count,
                  site_language: parsedSeasonData.site_language
                    ? parsedSeasonData.site_language
                    : "en",
                };
                let createSeasonData = null;
                if (parsedSeasonData.id) {
                  const getTitleSeason = await model.season.findOne({
                    where: {
                      id: parsedSeasonData.id,
                      title_id: newTitle.id,
                    },
                  });
                  seasonData.status = "active";
                  seasonData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                  seasonData.updated_by = userId;
                  if (getTitleSeason) {
                    await model.season.update(seasonData, {
                      where: {
                        id: getTitleSeason.id,
                        title_id: newTitle.id,
                      },
                    });
                    actionDate = seasonData.updated_at;
                    // season Translation details:
                    let seasonTranslationData = {
                      season_id: getTitleSeason.id,
                      season_name: parsedSeasonData.season_name
                        ? parsedSeasonData.season_name
                        : null,
                      summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                      aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                      site_language: parsedSeasonData.site_language
                        ? parsedSeasonData.site_language
                        : "en",
                    };
                    const seasonTranslation = await model.seasonTranslation.findOne({
                      where: {
                        season_id: getTitleSeason.id,
                        site_language: parsedSeasonData.site_language
                          ? parsedSeasonData.site_language
                          : "en",
                      },
                    });
                    if (seasonTranslation) {
                      seasonTranslationData.updated_at =
                        await customDateTimeHelper.getCurrentDateTime();
                      seasonTranslationData.updated_by = userId;
                      await model.seasonTranslation.update(seasonTranslationData, {
                        where: {
                          season_id: getTitleSeason.id,
                          site_language: parsedSeasonData.site_language
                            ? parsedSeasonData.site_language
                            : "en",
                        },
                      });
                      actionDate = seasonTranslationData.updated_at;
                    } else {
                      seasonTranslationData.created_at =
                        await customDateTimeHelper.getCurrentDateTime();
                      seasonTranslationData.created_by = userId;
                      await model.seasonTranslation.create(seasonTranslationData);
                      actionDate = seasonTranslationData.created_at;
                    }

                    // other request season details:
                    if (anotherRequestId) {
                      const anotherRequestDetails = await model.titleRequestSeasonDetails.findOne({
                        where: {
                          request_id: anotherRequestId,
                          season_no: titleSeasonData.season_no,
                        },
                      });
                      if (anotherRequestDetails) {
                        const anotherParsedSeasonData =
                          anotherRequestDetails.season_details != null
                            ? JSON.parse(anotherRequestDetails.season_details)
                            : null;
                        if (anotherParsedSeasonData) {
                          const seasonTranslationDataTwo = {
                            season_id: getTitleSeason.id,
                            season_name: anotherParsedSeasonData.season_name
                              ? anotherParsedSeasonData.season_name
                              : null,
                            summary: anotherParsedSeasonData.summary
                              ? anotherParsedSeasonData.summary
                              : null,
                            aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                            episode_count: anotherParsedSeasonData.episode_count,
                            site_language: anotherParsedSeasonData.site_language
                              ? anotherParsedSeasonData.site_language
                              : "en",
                          };
                          const seasonSecondReqData = await model.seasonTranslation.findOne({
                            where: {
                              season_id: getTitleSeason.id,
                              site_language: anotherParsedSeasonData.site_language
                                ? anotherParsedSeasonData.site_language
                                : "en",
                            },
                          });
                          if (seasonSecondReqData) {
                            seasonTranslationDataTwo.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            seasonTranslationDataTwo.updated_by = userId;
                            await model.seasonTranslation.update(seasonTranslationDataTwo, {
                              where: {
                                season_id: getTitleSeason.id,
                                site_language: anotherParsedSeasonData.site_language
                                  ? anotherParsedSeasonData.site_language
                                  : "en",
                              },
                            });
                            actionDate = seasonTranslationDataTwo.updated_at;
                          } else {
                            seasonTranslationDataTwo.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            seasonTranslationDataTwo.created_by = userId;
                            await model.seasonTranslation.create(seasonTranslationDataTwo);
                            actionDate = seasonTranslationDataTwo.created_at;
                          }
                        }
                      }
                    }
                  }
                  createSeasonData = await model.season.findOne({
                    where: {
                      id: parsedSeasonData.id,
                      title_id: newTitle.id,
                    },
                  });
                  if (createSeasonData) {
                    // for season search_keyword_details,news search keyword, watch on details on the season page
                    const seasonSearchKeywordDetails =
                      titleSeasonData.season_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_search_keyword_details)
                        : null;
                    if (
                      seasonSearchKeywordDetails != null &&
                      seasonSearchKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "search",
                            status: "active",
                            season_id: createSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonSearchKeywordDetails.list) {
                        if (value.keyword) {
                          const searchKeywordData = {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              keyword: value.keyword,
                              season_id: createSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            searchKeywordData.status = "active";
                            searchKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.updated_by = userId;
                            await model.titleKeyword.update(searchKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                              },
                            });
                            actionDate = searchKeywordData.updated_at;
                          } else {
                            searchKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.created_by = userId;
                            await model.titleKeyword.create(searchKeywordData);
                            actionDate = searchKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "search",
                          season_id: createSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              status: "active",
                              season_id: createSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    const seasonNewsKeywordDetails =
                      titleSeasonData.season_news_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_news_search_keyword_details)
                        : null;
                    if (
                      seasonNewsKeywordDetails != null &&
                      seasonNewsKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "news",
                            status: "active",
                            season_id: createSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonNewsKeywordDetails.list) {
                        if (value.keyword) {
                          const newsKeywordData = {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              keyword: value.keyword,
                              season_id: createSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            newsKeywordData.status = "active";
                            newsKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.updated_by = userId;
                            await model.titleKeyword.update(newsKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                              },
                            });
                            actionDate = newsKeywordData.updated_at;
                          } else {
                            newsKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.created_by = userId;
                            await model.titleKeyword.create(newsKeywordData);
                            actionDate = newsKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "news",
                          season_id: createSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              status: "active",
                              season_id: createSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    // channel Details update
                    const seasonChannelDetails =
                      titleSeasonData.season_channel_details != null
                        ? JSON.parse(titleSeasonData.season_channel_details)
                        : null;
                    if (seasonChannelDetails != null && seasonChannelDetails.list.length > 0) {
                      await model.titleChannelList.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            status: "active",
                          },
                        },
                      );
                      for (const value of seasonChannelDetails.list) {
                        if (value) {
                          const channelData = {
                            title_id: newTitle.id,
                            url: value.url ? value.url : null,
                            tv_network_id: value.tv_network_id ? value.tv_network_id : null,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            episode_id: value.episode_id ? value.episode_id : null,
                            site_language: value.site_language ? value.site_language : "en",
                          };
                          if (value.id) {
                            const getTitleChannel = await model.titleChannelList.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                              },
                            });
                            channelData.status = "active";
                            channelData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.updated_by = userId;
                            if (getTitleChannel) {
                              await model.titleChannelList.update(channelData, {
                                where: {
                                  id: getTitleChannel.id,
                                  title_id: newTitle.id,
                                  season_id: createSeasonData.id,
                                },
                              });
                              actionDate = channelData.updated_at;
                            }
                          } else {
                            channelData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.created_by = userId;
                            const checkTitleChannel = await model.titleChannelList.findOne({
                              where: {
                                title_id: newTitle.id,
                                status: "active",
                                url: value.url ? value.url : null,
                                tv_network_id: value.tv_network_id ? value.tv_network_id : null,
                                season_id: createSeasonData.id ? createSeasonData.id : null,
                                episode_id: value.episode_id ? value.episode_id : null,
                              },
                            });
                            if (!checkTitleChannel) {
                              await model.titleChannelList.create(channelData);
                              actionDate = channelData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getTitleChannel = await model.titleChannelList.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleChannel && getTitleChannel.length > 0) {
                        await model.titleChannelList.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createSeasonData.id,
                              status: "active",
                            },
                          },
                        );
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
                    //watch on stream
                    if (
                      seasonWatchOnStreamDetails != null &&
                      seasonWatchOnStreamDetails.list.length > 0
                    ) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            status: "active",
                            type: "stream",
                          },
                        },
                      );
                      for (const value of seasonWatchOnStreamDetails.list) {
                        if (
                          value &&
                          (seasonWatchOnStreamList.length === 0 ||
                            seasonWatchOnStreamList.indexOf(value.provider_id) === -1)
                        ) {
                          seasonWatchOnStreamList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "stream",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getStreamData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                                type: "stream",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getStreamData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getStreamData.id,
                                  title_id: newTitle.id,
                                  season_id: createSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkStream = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "stream",
                                season_id: createSeasonData.id ? createSeasonData.id : null,
                              },
                            });
                            if (!checkStream) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getStreamData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createSeasonData.id,
                          type: "stream",
                          status: "active",
                        },
                      });
                      if (getStreamData && getStreamData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createSeasonData.id,
                              status: "active",
                              type: "stream",
                            },
                          },
                        );
                      }
                    }
                    // watch on rent
                    if (
                      seasonWatchOnRentDetails != null &&
                      seasonWatchOnRentDetails.list.length > 0
                    ) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            status: "active",
                            type: "rent",
                          },
                        },
                      );
                      for (const value of seasonWatchOnRentDetails.list) {
                        if (
                          value &&
                          (seasonWatchOnRentList.length === 0 ||
                            seasonWatchOnRentList.indexOf(value.provider_id) === -1)
                        ) {
                          seasonWatchOnRentList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "rent",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getRentData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                                type: "rent",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getRentData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getRentData.id,
                                  title_id: newTitle.id,
                                  season_id: createSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkRent = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "rent",
                                season_id: createSeasonData.id ? createSeasonData.id : null,
                              },
                            });
                            if (!checkRent) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getRentData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createSeasonData.id,
                          type: "rent",
                          status: "active",
                        },
                      });
                      if (getRentData && getRentData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createSeasonData.id,
                              status: "active",
                              type: "rent",
                            },
                          },
                        );
                      }
                    }
                    // watch on buy
                    if (
                      seasonWatchOnBuyDetails != null &&
                      seasonWatchOnBuyDetails.list.length > 0
                    ) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            status: "active",
                            type: "buy",
                          },
                        },
                      );
                      for (const value of seasonWatchOnBuyDetails.list) {
                        if (
                          value &&
                          (seasonWatchOnBuyList.length === 0 ||
                            seasonWatchOnBuyList.indexOf(value.provider_id) === -1)
                        ) {
                          seasonWatchOnBuyList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "buy",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getBuyData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                                type: "buy",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getBuyData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getBuyData.id,
                                  title_id: newTitle.id,
                                  season_id: createSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkBuy = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "buy",
                                season_id: createSeasonData.id ? createSeasonData.id : null,
                              },
                            });
                            if (!checkBuy) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getBuyData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createSeasonData.id,
                          type: "buy",
                          status: "active",
                        },
                      });
                      if (getBuyData && getBuyData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createSeasonData.id,
                              status: "active",
                              type: "buy",
                            },
                          },
                        );
                      }
                    }
                  }
                } else {
                  seasonData.title_id = newTitle.id;
                  seasonData.created_at = await customDateTimeHelper.getCurrentDateTime();
                  seasonData.created_by = userId;
                  const createNewSeasonData = await model.season.create(seasonData);
                  if (createNewSeasonData.id) {
                    // create record for season translation:
                    const seasonTranslationData = {
                      season_id: createNewSeasonData.id,
                      season_name: parsedSeasonData.season_name
                        ? parsedSeasonData.season_name
                        : null,
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
                          season_no: titleSeasonData.season_no,
                        },
                      });
                      if (anotherRequestDetails) {
                        const anotherParsedSeasonData =
                          anotherRequestDetails.season_details != null
                            ? JSON.parse(anotherRequestDetails.season_details)
                            : null;
                        if (anotherParsedSeasonData) {
                          const seasonTranslationData = {
                            season_id: createNewSeasonData.id,
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

                    // for season search_keyword_details,news search keyword, watch on details on the season page
                    const seasonSearchKeywordDetails =
                      titleSeasonData.season_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_search_keyword_details)
                        : null;
                    if (
                      seasonSearchKeywordDetails != null &&
                      seasonSearchKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "search",
                            status: "active",
                            season_id: createNewSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonSearchKeywordDetails.list) {
                        if (value.keyword) {
                          const searchKeywordData = {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              keyword: value.keyword,
                              season_id: createNewSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            searchKeywordData.status = "active";
                            searchKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.updated_by = userId;
                            await model.titleKeyword.update(searchKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                              },
                            });
                            actionDate = searchKeywordData.updated_at;
                          } else {
                            searchKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.created_by = userId;
                            await model.titleKeyword.create(searchKeywordData);
                            actionDate = searchKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "search",
                          season_id: createNewSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              status: "active",
                              season_id: createNewSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    const seasonNewsKeywordDetails =
                      titleSeasonData.season_news_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_news_search_keyword_details)
                        : null;
                    if (
                      seasonNewsKeywordDetails != null &&
                      seasonNewsKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "news",
                            status: "active",
                            season_id: createNewSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonNewsKeywordDetails.list) {
                        if (value.keyword) {
                          const newsKeywordData = {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              keyword: value.keyword,
                              season_id: createNewSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            newsKeywordData.status = "active";
                            newsKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.updated_by = userId;
                            await model.titleKeyword.update(newsKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                              },
                            });
                            actionDate = newsKeywordData.updated_at;
                          } else {
                            newsKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.created_by = userId;
                            await model.titleKeyword.create(newsKeywordData);
                            actionDate = newsKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "news",
                          season_id: createNewSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              status: "active",
                              season_id: createNewSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    // channel Details update
                    const seasonChannelDetails =
                      titleSeasonData.season_channel_details != null
                        ? JSON.parse(titleSeasonData.season_channel_details)
                        : null;
                    if (seasonChannelDetails != null && seasonChannelDetails.list.length > 0) {
                      await model.titleChannelList.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            status: "active",
                          },
                        },
                      );
                      for (const value of seasonChannelDetails.list) {
                        if (value) {
                          const channelData = {
                            title_id: newTitle.id,
                            url: value.url ? value.url : null,
                            tv_network_id: value.tv_network_id ? value.tv_network_id : null,
                            season_id: createNewSeasonData.id,
                            episode_id: value.episode_id ? value.episode_id : null,
                            site_language: value.site_language ? value.site_language : "en",
                          };
                          if (value.id) {
                            const getTitleChannel = await model.titleChannelList.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                              },
                            });
                            channelData.status = "active";
                            channelData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.updated_by = userId;
                            if (getTitleChannel) {
                              await model.titleChannelList.update(channelData, {
                                where: {
                                  id: getTitleChannel.id,
                                  title_id: newTitle.id,
                                  season_id: createNewSeasonData.id,
                                },
                              });
                              actionDate = channelData.updated_at;
                            }
                          } else {
                            channelData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.created_by = userId;
                            const checkTitleChannel = await model.titleChannelList.findOne({
                              where: {
                                title_id: newTitle.id,
                                status: "active",
                                url: value.url ? value.url : null,
                                tv_network_id: value.tv_network_id ? value.tv_network_id : null,
                                season_id: createNewSeasonData.id,
                                episode_id: value.episode_id ? value.episode_id : null,
                              },
                            });
                            if (!checkTitleChannel) {
                              await model.titleChannelList.create(channelData);
                              actionDate = channelData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getTitleChannel = await model.titleChannelList.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createNewSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleChannel && getTitleChannel.length > 0) {
                        await model.titleChannelList.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createNewSeasonData.id,
                              status: "active",
                            },
                          },
                        );
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
                    //watch on stream
                    if (
                      seasonWatchOnStreamDetails != null &&
                      seasonWatchOnStreamDetails.list.length > 0
                    ) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            status: "active",
                            type: "stream",
                          },
                        },
                      );
                      for (const value of seasonWatchOnStreamDetails.list) {
                        if (
                          value &&
                          (seasonWatchOnStreamList.length === 0 ||
                            seasonWatchOnStreamList.indexOf(value.provider_id) === -1)
                        ) {
                          seasonWatchOnStreamList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "stream",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createNewSeasonData.id,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getStreamData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                                type: "stream",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getStreamData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getStreamData.id,
                                  title_id: newTitle.id,
                                  season_id: createNewSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkStream = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "stream",
                                season_id: createNewSeasonData.id,
                              },
                            });
                            if (!checkStream) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getStreamData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createNewSeasonData.id,
                          type: "stream",
                          status: "active",
                        },
                      });
                      if (getStreamData && getStreamData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createNewSeasonData.id,
                              status: "active",
                              type: "stream",
                            },
                          },
                        );
                      }
                    }
                    // watch on rent
                    if (
                      seasonWatchOnRentDetails != null &&
                      seasonWatchOnRentDetails.list.length > 0
                    ) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            status: "active",
                            type: "rent",
                          },
                        },
                      );
                      for (const value of seasonWatchOnRentDetails.list) {
                        if (
                          value &&
                          (seasonWatchOnRentList.length === 0 ||
                            seasonWatchOnRentList.indexOf(value.provider_id) === -1)
                        ) {
                          seasonWatchOnRentList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "rent",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createNewSeasonData.id,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getRentData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                                type: "rent",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getRentData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getRentData.id,
                                  title_id: newTitle.id,
                                  season_id: createNewSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkRent = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "rent",
                                season_id: createNewSeasonData.id,
                              },
                            });
                            if (!checkRent) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getRentData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createNewSeasonData.id,
                          type: "rent",
                          status: "active",
                        },
                      });
                      if (getRentData && getRentData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createNewSeasonData.id,
                              status: "active",
                              type: "rent",
                            },
                          },
                        );
                      }
                    }
                    // watch on buy
                    if (
                      seasonWatchOnBuyDetails != null &&
                      seasonWatchOnBuyDetails.list.length > 0
                    ) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            status: "active",
                            type: "buy",
                          },
                        },
                      );
                      for (const value of seasonWatchOnBuyDetails.list) {
                        if (
                          value &&
                          (seasonWatchOnBuyList.length === 0 ||
                            seasonWatchOnBuyList.indexOf(value.provider_id) === -1)
                        ) {
                          seasonWatchOnBuyList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "buy",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createNewSeasonData.id,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getBuyData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                                type: "buy",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getBuyData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getBuyData.id,
                                  title_id: newTitle.id,
                                  season_id: createNewSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkBuy = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "buy",
                                season_id: createNewSeasonData.id,
                              },
                            });
                            if (!checkBuy) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getBuyData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createNewSeasonData.id,
                          type: "buy",
                          status: "active",
                        },
                      });
                      if (getBuyData && getBuyData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createNewSeasonData.id,
                              status: "active",
                              type: "buy",
                            },
                          },
                        );
                      }
                    }
                  }
                  const addedSeasonData = {
                    draft_request_id: titleSeasonData.request_id,
                    draft_season_id: titleSeasonData.id,
                    season_no: titleSeasonData.season_no,
                    new_season_id: createNewSeasonData.id,
                    equivalent_season_id: 0,
                  };
                  if (anotherRequestId) {
                    const equivalentSeasonId = await model.titleRequestSeasonDetails.findOne({
                      where: {
                        request_id: anotherRequestId,
                        season_no: titleSeasonData.season_no,
                        status: "active",
                      },
                    });
                    addedSeasonData.equivalent_season_id =
                      equivalentSeasonId && equivalentSeasonId.id ? equivalentSeasonId.id : 0;
                  }
                  newSeasonAdded.push(addedSeasonData);
                }
              }
            }
          }
        }
        // Episode Details:
        if (foundEpisodeDataDetails && foundEpisodeDataDetails.length > 0) {
          for (const foundEpisodeData of foundEpisodeDataDetails) {
            if (foundEpisodeData && foundEpisodeData.dataValues) {
              // let seasonDetails = {};
              if (foundEpisodeData.dataValues.season_id) {
                const seasonId = foundEpisodeData.dataValues.season_id;
                const seasonDetails = await model.season.findOne({
                  where: {
                    id: seasonId,
                    status: "active",
                    title_id: newTitle.id,
                  },
                });
                const parsedEpisodeData =
                  foundEpisodeData.dataValues.episode_details != null
                    ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                    : null;

                if (parsedEpisodeData != null && seasonDetails) {
                  await model.episode.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonDetails.id
                          ? seasonDetails.id
                          : foundEpisodeData.dataValues.season_id,
                      },
                    },
                  );
                  for (const episodeValue of parsedEpisodeData.list) {
                    if (episodeValue) {
                      let createdEpisode = null;
                      if (episodeValue.id) {
                        const episodeUpData = {
                          name: episodeValue.name,
                          episode_number: episodeValue.episode_number
                            ? episodeValue.episode_number
                            : 1,
                          description: episodeValue.description ? episodeValue.description : null,
                          poster: episodeValue.poster ? episodeValue.poster : null,
                          release_date: episodeValue.release_date
                            ? episodeValue.release_date
                            : null,
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
                          site_language: episodeValue.site_language
                            ? episodeValue.site_language
                            : titleData.site_language,
                        };
                        const getTitleSeasonEpisode = await model.episode.findOne({
                          where: {
                            id: episodeValue.id,
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        });
                        episodeUpData.status = "active";
                        episodeUpData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                        episodeUpData.updated_by = userId;
                        if (getTitleSeasonEpisode) {
                          await model.episode.update(episodeUpData, {
                            where: {
                              id: getTitleSeasonEpisode.id,
                              title_id: newTitle.id,
                            },
                          });
                          actionDate = episodeUpData.updated_at;

                          // episodeTranslationData
                          let episodeTranslationData = {
                            episode_id: getTitleSeasonEpisode.id,
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                            name: episodeValue.name,
                            description: episodeValue.description ? episodeValue.description : null,
                          };

                          const findEpisodeTranslation = await model.episodeTranslation.findOne({
                            where: {
                              episode_id: getTitleSeasonEpisode.id,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                            },
                          });
                          if (findEpisodeTranslation) {
                            episodeTranslationData.status = "active";
                            episodeTranslationData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            episodeTranslationData.updated_by = userId;
                            await model.episodeTranslation.update(episodeTranslationData, {
                              where: {
                                episode_id: getTitleSeasonEpisode.id,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                              },
                            });
                            actionDate = episodeTranslationData.updated_at;
                          } else {
                            episodeTranslationData.status = "active";
                            episodeTranslationData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            episodeTranslationData.created_by = userId;
                            await model.episodeTranslation.create(episodeTranslationData);
                            actionDate = episodeTranslationData.created_at;
                          }
                        }
                        createdEpisode = await model.episode.findOne({
                          where: {
                            id: episodeValue.id,
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        });
                      } else {
                        const episodeData = {
                          name: episodeValue.name,
                          description: episodeValue.description ? episodeValue.description : null,
                          poster: episodeValue.poster ? episodeValue.poster : null,
                          release_date: episodeValue.release_date
                            ? episodeValue.release_date
                            : null,
                          title_id: newTitle.id,
                          season_id: seasonDetails.id
                            ? seasonDetails.id
                            : foundEpisodeData.season_id,
                          season_number: seasonDetails.number,
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
                          site_language: episodeValue.site_language
                            ? episodeValue.site_language
                            : titleData.site_language,
                          created_by: userId,
                        };
                        createdEpisode = await model.episode.create(episodeData);
                        // Create Episode translation:
                        if (createdEpisode.id) {
                          actionDate = episodeData.created_at;

                          const episodeTranslationData = {
                            episode_id: createdEpisode.id,
                            name: episodeValue.name,
                            description: episodeValue.description ? episodeValue.description : null,
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                            created_at: await customDateTimeHelper.getCurrentDateTime(),
                            created_by: userId,
                          };
                          const findEpisodeTranslation = await model.episodeTranslation.findOne({
                            where: {
                              episode_id: createdEpisode.id,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                            },
                          });
                          if (!findEpisodeTranslation) {
                            await model.episodeTranslation.create(episodeTranslationData);
                            actionDate = episodeTranslationData.created_at;
                          }
                        }
                        // Other language data for the same season number
                        let parsedOtherLanEpisodeData = "";
                        const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                          where: {
                            season_no: seasonDetails.number,
                            request_id: anotherRequestId,
                          },
                        });
                        if (findSeasonReqId) {
                          const findOtherLanEpisodeDetails =
                            await model.titleRequestEpisodeDetails.findOne({
                              where: {
                                request_id: anotherRequestId,
                                request_season_id: findSeasonReqId.id,
                                status: "active",
                              },
                            });
                          if (findOtherLanEpisodeDetails) {
                            parsedOtherLanEpisodeData =
                              findOtherLanEpisodeDetails.episode_details != null
                                ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                : null;
                            if (
                              parsedOtherLanEpisodeData != null &&
                              parsedOtherLanEpisodeData != ""
                            ) {
                              for (const value of parsedOtherLanEpisodeData.list) {
                                if (
                                  value.episode_number == episodeValue.episode_number &&
                                  value.name
                                ) {
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
                        }
                      }
                      // create poster image of eposides form data
                      if (episodeValue.poster != null && episodeValue.poster != "") {
                        const fileName = episodeValue.poster
                          ? episodeValue.poster.substring(episodeValue.poster.lastIndexOf("/") + 1)
                          : null;
                        await model.titleImage.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              status: "active",
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                              image_category: "poster_image",
                              episode_id: createdEpisode.id ? createdEpisode.id : null,
                            },
                          },
                        );

                        const getLastOrder = await model.titleImage.max("list_order", {
                          where: {
                            title_id: newTitle.id,
                            image_category: "poster_image",
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        });
                        const posterImageData = {
                          file_name: fileName,
                          path: episodeValue.poster ? episodeValue.poster : null,
                          title_id: newTitle.id,
                          season_id: seasonDetails.id
                            ? seasonDetails.id
                            : foundEpisodeData.season_id,
                          episode_id: createdEpisode.id ? createdEpisode.id : null,
                          list_order: getLastOrder ? getLastOrder + 1 : 1,
                          image_category: "poster_image",
                          is_main_poster: "y",
                          site_language: episodeValue.site_language
                            ? episodeValue.site_language
                            : titleData.site_language,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const getTitleSeasonEpisodeImage = await model.titleImage.findOne({
                          where: {
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.season_id,
                            image_category: "poster_image",
                            path: episodeValue.poster ? episodeValue.poster : null,
                            episode_id: createdEpisode.id ? createdEpisode.id : null,
                          },
                        });
                        if (getTitleSeasonEpisodeImage) {
                          await model.titleImage.update(
                            {
                              updated_at: (actionDate =
                                await customDateTimeHelper.getCurrentDateTime()),
                              updated_by: userId,
                              status: "active",
                            },
                            {
                              where: {
                                id: getTitleSeasonEpisodeImage.id,
                                title_id: newTitle.id,
                              },
                            },
                          );
                        } else {
                          await model.titleImage.create(posterImageData);
                          actionDate = posterImageData.created_at;
                        }
                      }
                    }
                  }
                } else {
                  const getTitleSeasonEpisode = await model.episode.findAll({
                    where: {
                      title_id: newTitle.id,
                      season_id: foundEpisodeData.dataValues.season_id,
                      status: "active",
                    },
                  });
                  if (getTitleSeasonEpisode && getTitleSeasonEpisode.length > 0) {
                    await model.episode.update(
                      {
                        updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                        updated_by: userId,
                        status: "deleted",
                      },
                      {
                        where: {
                          status: "active",
                          title_id: newTitle.id,
                          season_id: foundEpisodeData.dataValues.season_id,
                        },
                      },
                    );
                  }
                }
              } else if (!foundEpisodeData.dataValues.season_id && newSeasonAdded.length > 0) {
                for (const seasonValue of newSeasonAdded) {
                  if (
                    foundEpisodeData.dataValues.request_season_id == seasonValue.draft_season_id
                  ) {
                    const seasonId = seasonValue.new_season_id;
                    const seasonDetails = await model.season.findOne({
                      where: {
                        id: seasonId,
                        status: "active",
                        title_id: newTitle.id,
                      },
                    });
                    const parsedEpisodeData =
                      foundEpisodeData.dataValues.episode_details != null
                        ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                        : null;

                    if (parsedEpisodeData != null && seasonDetails) {
                      await model.episode.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            status: "active",
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        },
                      );
                      for (const episodeValue of parsedEpisodeData.list) {
                        if (episodeValue) {
                          let createdEpisode = null;
                          if (episodeValue.id) {
                            const episodeUpData = {
                              name: episodeValue.name,
                              description: episodeValue.description
                                ? episodeValue.description
                                : null,
                              poster: episodeValue.poster ? episodeValue.poster : null,
                              release_date: episodeValue.release_date
                                ? episodeValue.release_date
                                : null,
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
                              season_number: seasonDetails.number ? seasonDetails.number : 1,
                              episode_number: episodeValue.episode_number
                                ? episodeValue.episode_number
                                : 1,
                              tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                              rating_percent: episodeValue.rating_percent
                                ? episodeValue.rating_percent
                                : null,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                            };
                            const getTitleSeasonEpisode = await model.episode.findOne({
                              where: {
                                id: episodeValue.id,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.dataValues.season_id,
                              },
                            });
                            episodeUpData.status = "active";
                            episodeUpData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            episodeUpData.updated_by = userId;
                            if (getTitleSeasonEpisode) {
                              await model.episode.update(episodeUpData, {
                                where: {
                                  id: getTitleSeasonEpisode.id,
                                  title_id: newTitle.id,
                                },
                              });
                              actionDate = episodeUpData.updated_at;
                              // episodeTranslationData
                              const episodeTranslationData = {
                                episode_id: getTitleSeasonEpisode.id,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                name: episodeValue.name,
                                description: episodeValue.description
                                  ? episodeValue.description
                                  : null,
                              };

                              const findEpisodeTranslation = await model.episodeTranslation.findOne(
                                {
                                  where: {
                                    episode_id: getTitleSeasonEpisode.id,
                                    site_language: episodeValue.site_language
                                      ? episodeValue.site_language
                                      : titleData.site_language,
                                  },
                                },
                              );
                              if (findEpisodeTranslation) {
                                episodeTranslationData.status = "active";
                                episodeTranslationData.updated_at =
                                  await customDateTimeHelper.getCurrentDateTime();
                                episodeTranslationData.updated_by = userId;
                                await model.episodeTranslation.update(episodeTranslationData, {
                                  where: {
                                    episode_id: getTitleSeasonEpisode.id,
                                    site_language: episodeValue.site_language
                                      ? episodeValue.site_language
                                      : titleData.site_language,
                                  },
                                });
                                actionDate = episodeTranslationData.updated_at;
                              } else {
                                episodeTranslationData.status = "active";
                                episodeTranslationData.created_at =
                                  await customDateTimeHelper.getCurrentDateTime();
                                episodeTranslationData.created_by = userId;
                                await model.episodeTranslation.create(episodeTranslationData);
                                actionDate = episodeTranslationData.created_at;
                              }
                            }
                            createdEpisode = await model.episode.findOne({
                              where: {
                                id: episodeValue.id,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.dataValues.season_id,
                              },
                            });
                          } else {
                            const episodeData = {
                              name: episodeValue.name,
                              description: episodeValue.description
                                ? episodeValue.description
                                : null,
                              poster: episodeValue.poster ? episodeValue.poster : null,
                              release_date: episodeValue.release_date
                                ? episodeValue.release_date
                                : null,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                              season_number: seasonDetails.number ? seasonDetails.number : 1,
                              episode_number: episodeValue.episode_number
                                ? episodeValue.episode_number
                                : 1,
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
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              created_by: userId,
                            };
                            createdEpisode = await model.episode.create(episodeData);
                            // Create Episode translation:
                            if (createdEpisode.id) {
                              actionDate = episodeData.created_at;

                              const episodeTranslationData = {
                                episode_id: createdEpisode.id,
                                name: episodeValue.name,
                                description: episodeValue.description
                                  ? episodeValue.description
                                  : null,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              const findEpisodeTranslation = await model.episodeTranslation.findOne(
                                {
                                  where: {
                                    episode_id: createdEpisode.id,
                                    site_language: episodeValue.site_language
                                      ? episodeValue.site_language
                                      : titleData.site_language,
                                  },
                                },
                              );
                              if (!findEpisodeTranslation) {
                                await model.episodeTranslation.create(episodeTranslationData);
                                actionDate = episodeTranslationData.created_at;
                              }
                            }
                            // Other language data for the same season number
                            let parsedOtherLanEpisodeData = "";
                            const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                              where: {
                                season_no: seasonDetails.number,
                                request_id: anotherRequestId,
                              },
                            });
                            if (findSeasonReqId) {
                              const findOtherLanEpisodeDetails =
                                await model.titleRequestEpisodeDetails.findOne({
                                  where: {
                                    request_id: anotherRequestId,
                                    request_season_id: findSeasonReqId.id,
                                    status: "active",
                                  },
                                });
                              if (findOtherLanEpisodeDetails) {
                                parsedOtherLanEpisodeData =
                                  findOtherLanEpisodeDetails.episode_details != null
                                    ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                    : null;
                                if (
                                  parsedOtherLanEpisodeData != null &&
                                  parsedOtherLanEpisodeData != ""
                                ) {
                                  for (const value of parsedOtherLanEpisodeData.list) {
                                    if (
                                      value.episode_number == episodeValue.episode_number &&
                                      value.name
                                    ) {
                                      const episodeTranslationData = {
                                        episode_id: createdEpisode.id,
                                        name: value.name,
                                        description: value.description ? value.description : null,
                                        site_language: value.site_language
                                          ? value.site_language
                                          : "en",
                                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                                        created_by: userId,
                                      };
                                      await model.episodeTranslation.create(episodeTranslationData);
                                      actionDate = episodeTranslationData.created_at;
                                    }
                                  }
                                }
                              }
                            }
                          }
                          // create poster image of eposides form data
                          if (episodeValue.poster != null && episodeValue.poster != "") {
                            const fileName = episodeValue.poster
                              ? episodeValue.poster.substring(
                                  episodeValue.poster.lastIndexOf("/") + 1,
                                )
                              : null;
                            await model.titleImage.update(
                              {
                                updated_at: (actionDate =
                                  await customDateTimeHelper.getCurrentDateTime()),
                                updated_by: userId,
                                status: "deleted",
                              },
                              {
                                where: {
                                  status: "active",
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.dataValues.season_id,
                                  image_category: "poster_image",
                                  episode_id: createdEpisode.id ? createdEpisode.id : null,
                                },
                              },
                            );

                            const getLastOrder = await model.titleImage.max("list_order", {
                              where: {
                                title_id: newTitle.id,
                                image_category: "poster_image",
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.dataValues.season_id,
                              },
                            });
                            const posterImageData = {
                              file_name: fileName,
                              path: episodeValue.poster ? episodeValue.poster : null,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                              episode_id: createdEpisode.id ? createdEpisode.id : null,
                              list_order: getLastOrder ? getLastOrder + 1 : 1,
                              image_category: "poster_image",
                              is_main_poster: "y",
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            const getTitleSeasonEpisodeImage = await model.titleImage.findOne({
                              where: {
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.season_id,
                                image_category: "poster_image",
                                path: episodeValue.poster ? episodeValue.poster : null,
                                episode_id: createdEpisode.id ? createdEpisode.id : null,
                              },
                            });
                            if (getTitleSeasonEpisodeImage) {
                              await model.titleImage.update(
                                {
                                  updated_at: (actionDate =
                                    await customDateTimeHelper.getCurrentDateTime()),
                                  updated_by: userId,
                                  status: "active",
                                },
                                {
                                  where: {
                                    id: getTitleSeasonEpisodeImage.id,
                                    title_id: newTitle.id,
                                  },
                                },
                              );
                            } else {
                              await model.titleImage.create(posterImageData);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Episode other request ID:
        if (anotherRequestId) {
          const anotherRequestEpisodeDetails = await model.titleRequestEpisodeDetails.findAll({
            where: {
              request_id: anotherRequestId,
              status: "active",
            },
          });
          if (anotherRequestEpisodeDetails && anotherRequestEpisodeDetails.length > 0) {
            for (const foundEpisodeData of anotherRequestEpisodeDetails) {
              if (foundEpisodeData && foundEpisodeData.dataValues) {
                if (foundEpisodeData.dataValues.season_id) {
                  const seasonId = foundEpisodeData.dataValues.season_id;
                  const seasonDetails = await model.season.findOne({
                    where: {
                      id: seasonId,
                      status: "active",
                      title_id: newTitle.id,
                    },
                  });
                  const parsedEpisodeData =
                    foundEpisodeData.dataValues.episode_details != null
                      ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                      : null;

                  if (parsedEpisodeData != null && seasonDetails) {
                    for (const episodeValue of parsedEpisodeData.list) {
                      if (episodeValue) {
                        let createdEpisode = null;
                        if (episodeValue.id) {
                          const episodeUpData = {
                            name: episodeValue.name,
                            episode_number: episodeValue.episode_number
                              ? episodeValue.episode_number
                              : 1,
                            description: episodeValue.description ? episodeValue.description : null,
                            poster: episodeValue.poster ? episodeValue.poster : null,
                            release_date: episodeValue.release_date
                              ? episodeValue.release_date
                              : null,
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
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                          };
                          const getTitleSeasonEpisode = await model.episode.findOne({
                            where: {
                              id: episodeValue.id,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                            },
                          });
                          episodeUpData.status = "active";
                          episodeUpData.updated_at =
                            await customDateTimeHelper.getCurrentDateTime();
                          episodeUpData.updated_by = userId;
                          if (getTitleSeasonEpisode) {
                            await model.episode.update(episodeUpData, {
                              where: {
                                id: getTitleSeasonEpisode.id,
                                title_id: newTitle.id,
                              },
                            });
                            actionDate = episodeUpData.updated_at;

                            // episodeTranslationData
                            let episodeTranslationData = {
                              episode_id: getTitleSeasonEpisode.id,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              name: episodeValue.name,
                              description: episodeValue.description
                                ? episodeValue.description
                                : null,
                            };

                            const findEpisodeTranslation = await model.episodeTranslation.findOne({
                              where: {
                                episode_id: getTitleSeasonEpisode.id,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                              },
                            });
                            if (findEpisodeTranslation) {
                              episodeTranslationData.status = "active";
                              episodeTranslationData.updated_at =
                                await customDateTimeHelper.getCurrentDateTime();
                              episodeTranslationData.updated_by = userId;
                              await model.episodeTranslation.update(episodeTranslationData, {
                                where: {
                                  episode_id: getTitleSeasonEpisode.id,
                                  site_language: episodeValue.site_language
                                    ? episodeValue.site_language
                                    : titleData.site_language,
                                },
                              });
                              actionDate = episodeTranslationData.updated_at;
                            } else {
                              episodeTranslationData.status = "active";
                              episodeTranslationData.created_at =
                                await customDateTimeHelper.getCurrentDateTime();
                              episodeTranslationData.created_by = userId;
                              await model.episodeTranslation.create(episodeTranslationData);
                              actionDate = episodeTranslationData.created_at;
                            }
                          }
                          createdEpisode = await model.episode.findOne({
                            where: {
                              id: episodeValue.id,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                            },
                          });
                        } else {
                          const episodeData = {
                            name: episodeValue.name,
                            description: episodeValue.description ? episodeValue.description : null,
                            poster: episodeValue.poster ? episodeValue.poster : null,
                            release_date: episodeValue.release_date
                              ? episodeValue.release_date
                              : null,
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.season_id,
                            season_number: seasonDetails.number,
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
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                            created_by: userId,
                          };
                          const findEpisodeData = await model.episode.findOne({
                            where: {
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                              episode_number: episodeValue.episode_number,
                              status: "active",
                            },
                          });
                          let episodeId = 0;
                          if (findEpisodeData) {
                            episodeId = findEpisodeData.id;
                          } else {
                            createdEpisode = await model.episode.create(episodeData);
                            episodeId = createdEpisode.id;
                          }
                          // Create Episode translation:
                          if (episodeId) {
                            const episodeTranslationData = {
                              episode_id: episodeId,
                              name: episodeValue.name,
                              description: episodeValue.description
                                ? episodeValue.description
                                : null,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            const findEpisodeTranslation = await model.episodeTranslation.findOne({
                              where: {
                                episode_id: episodeId,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                              },
                            });
                            if (!findEpisodeTranslation) {
                              await model.episodeTranslation.create(episodeTranslationData);
                              actionDate = episodeTranslationData.created_at;
                            }
                          }
                          // Other language data for the same season number
                          let parsedOtherLanEpisodeData = "";
                          const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                            where: {
                              season_no: seasonDetails.number,
                              request_id: anotherRequestId,
                            },
                          });
                          if (findSeasonReqId && episodeId) {
                            const findOtherLanEpisodeDetails =
                              await model.titleRequestEpisodeDetails.findOne({
                                where: {
                                  request_id: anotherRequestId,
                                  request_season_id: findSeasonReqId.id,
                                  status: "active",
                                },
                              });
                            if (findOtherLanEpisodeDetails) {
                              parsedOtherLanEpisodeData =
                                findOtherLanEpisodeDetails.episode_details != null
                                  ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                  : null;
                              if (
                                parsedOtherLanEpisodeData != null &&
                                parsedOtherLanEpisodeData != ""
                              ) {
                                for (const value of parsedOtherLanEpisodeData.list) {
                                  if (
                                    value.episode_number == episodeValue.episode_number &&
                                    value.name
                                  ) {
                                    const episodeTranslationData = {
                                      episode_id: episodeId,
                                      name: value.name,
                                      description: value.description ? value.description : null,
                                      site_language: value.site_language
                                        ? value.site_language
                                        : "en",
                                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                                      created_by: userId,
                                    };
                                    await model.episodeTranslation.create(episodeTranslationData);
                                    actionDate = episodeTranslationData.created_at;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                } else if (!foundEpisodeData.dataValues.season_id && newSeasonAdded.length > 0) {
                  for (const seasonValue of newSeasonAdded) {
                    if (
                      foundEpisodeData.dataValues.request_season_id ==
                      seasonValue.equivalent_season_id
                    ) {
                      const seasonId = seasonValue.new_season_id;
                      const seasonDetails = await model.season.findOne({
                        where: {
                          id: seasonId,
                          status: "active",
                          title_id: newTitle.id,
                        },
                      });
                      const parsedEpisodeData =
                        foundEpisodeData.dataValues.episode_details != null
                          ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                          : null;

                      if (parsedEpisodeData != null && seasonDetails) {
                        await model.episode.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              status: "active",
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                            },
                          },
                        );
                        for (const episodeValue of parsedEpisodeData.list) {
                          if (episodeValue) {
                            let createdEpisode = null;
                            if (episodeValue.id) {
                              const episodeUpData = {
                                name: episodeValue.name,
                                description: episodeValue.description
                                  ? episodeValue.description
                                  : null,
                                poster: episodeValue.poster ? episodeValue.poster : null,
                                release_date: episodeValue.release_date
                                  ? episodeValue.release_date
                                  : null,
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
                                popularity: episodeValue.popularity
                                  ? episodeValue.popularity
                                  : null,
                                season_number: seasonDetails.number ? seasonDetails.number : 1,
                                episode_number: episodeValue.episode_number
                                  ? episodeValue.episode_number
                                  : 1,
                                tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                                rating_percent: episodeValue.rating_percent
                                  ? episodeValue.rating_percent
                                  : null,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.season_id,
                              };
                              const getTitleSeasonEpisode = await model.episode.findOne({
                                where: {
                                  id: episodeValue.id,
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.dataValues.season_id,
                                },
                              });
                              episodeUpData.status = "active";
                              episodeUpData.updated_at =
                                await customDateTimeHelper.getCurrentDateTime();
                              episodeUpData.updated_by = userId;
                              if (getTitleSeasonEpisode) {
                                await model.episode.update(episodeUpData, {
                                  where: {
                                    id: getTitleSeasonEpisode.id,
                                    title_id: newTitle.id,
                                  },
                                });
                                actionDate = episodeUpData.updated_at;

                                // episodeTranslationData
                                const episodeTranslationData = {
                                  episode_id: getTitleSeasonEpisode.id,
                                  site_language: episodeValue.site_language
                                    ? episodeValue.site_language
                                    : titleData.site_language,
                                  name: episodeValue.name,
                                  description: episodeValue.description
                                    ? episodeValue.description
                                    : null,
                                };

                                const findEpisodeTranslation =
                                  await model.episodeTranslation.findOne({
                                    where: {
                                      episode_id: getTitleSeasonEpisode.id,
                                      site_language: episodeValue.site_language
                                        ? episodeValue.site_language
                                        : titleData.site_language,
                                    },
                                  });
                                if (findEpisodeTranslation) {
                                  episodeTranslationData.status = "active";
                                  episodeTranslationData.updated_at =
                                    await customDateTimeHelper.getCurrentDateTime();
                                  episodeTranslationData.updated_by = userId;
                                  await model.episodeTranslation.update(episodeTranslationData, {
                                    where: {
                                      episode_id: getTitleSeasonEpisode.id,
                                      site_language: episodeValue.site_language
                                        ? episodeValue.site_language
                                        : titleData.site_language,
                                    },
                                  });
                                  actionDate = episodeTranslationData.updated_at;
                                } else {
                                  episodeTranslationData.status = "active";
                                  episodeTranslationData.created_at =
                                    await customDateTimeHelper.getCurrentDateTime();
                                  episodeTranslationData.created_by = userId;
                                  await model.episodeTranslation.create(episodeTranslationData);
                                  actionDate = episodeTranslationData.created_at;
                                }
                              }
                              createdEpisode = await model.episode.findOne({
                                where: {
                                  id: episodeValue.id,
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.dataValues.season_id,
                                },
                              });
                            } else {
                              const episodeData = {
                                name: episodeValue.name,
                                description: episodeValue.description
                                  ? episodeValue.description
                                  : null,
                                poster: episodeValue.poster ? episodeValue.poster : null,
                                release_date: episodeValue.release_date
                                  ? episodeValue.release_date
                                  : null,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.season_id,
                                season_number: seasonDetails.number ? seasonDetails.number : 1,
                                episode_number: episodeValue.episode_number
                                  ? episodeValue.episode_number
                                  : 1,
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
                                popularity: episodeValue.popularity
                                  ? episodeValue.popularity
                                  : null,
                                tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                                rating_percent: episodeValue.rating_percent
                                  ? episodeValue.rating_percent
                                  : null,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                created_by: userId,
                              };
                              const findEpisodeData = await model.episode.findOne({
                                where: {
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.season_id,
                                  episode_number: episodeValue.episode_number,
                                  status: "active",
                                },
                              });
                              let episodeId = 0;
                              if (findEpisodeData) {
                                episodeId = findEpisodeData.id;
                              } else {
                                createdEpisode = await model.episode.create(episodeData);
                                episodeId = createdEpisode.id;
                                actionDate = episodeData.created_at;
                              }
                              // Create Episode translation:
                              if (episodeId) {
                                const episodeTranslationData = {
                                  episode_id: episodeId,
                                  name: episodeValue.name,
                                  description: episodeValue.description
                                    ? episodeValue.description
                                    : null,
                                  site_language: episodeValue.site_language
                                    ? episodeValue.site_language
                                    : titleData.site_language,
                                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                                  created_by: userId,
                                };
                                const findEpisodeTranslation =
                                  await model.episodeTranslation.findOne({
                                    where: {
                                      episode_id: episodeId,
                                      site_language: episodeValue.site_language
                                        ? episodeValue.site_language
                                        : titleData.site_language,
                                    },
                                  });
                                if (!findEpisodeTranslation) {
                                  await model.episodeTranslation.create(episodeTranslationData);
                                  actionDate = episodeTranslationData.created_at;
                                }
                              }
                              // Other language data for the same season number
                              let parsedOtherLanEpisodeData = "";
                              const findSeasonReqId = await model.titleRequestSeasonDetails.findOne(
                                {
                                  where: {
                                    season_no: seasonDetails.number,
                                    request_id: anotherRequestId,
                                  },
                                },
                              );
                              if (findSeasonReqId && episodeId) {
                                const findOtherLanEpisodeDetails =
                                  await model.titleRequestEpisodeDetails.findOne({
                                    where: {
                                      request_id: anotherRequestId,
                                      request_season_id: findSeasonReqId.id,
                                      status: "active",
                                    },
                                  });
                                if (findOtherLanEpisodeDetails) {
                                  parsedOtherLanEpisodeData =
                                    findOtherLanEpisodeDetails.episode_details != null
                                      ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                      : null;
                                  if (
                                    parsedOtherLanEpisodeData != null &&
                                    parsedOtherLanEpisodeData != ""
                                  ) {
                                    for (const value of parsedOtherLanEpisodeData.list) {
                                      if (
                                        value.episode_number == episodeValue.episode_number &&
                                        value.name
                                      ) {
                                        const episodeTranslationData = {
                                          episode_id: episodeId,
                                          name: value.name,
                                          description: value.description ? value.description : null,
                                          site_language: value.site_language
                                            ? value.site_language
                                            : "en",
                                          created_at:
                                            await customDateTimeHelper.getCurrentDateTime(),
                                          created_by: userId,
                                        };
                                        await model.episodeTranslation.create(
                                          episodeTranslationData,
                                        );
                                        actionDate = episodeTranslationData.created_at;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Media Details with respect to season
        // storing the media details ::
        if (foundMediaData && foundMediaData.length > 0) {
          for (const titleMediaData of foundMediaData) {
            let seasonId = "";
            let parsedVideoDetails = "";
            let parsedImageDetails = "";
            let parsedPosterDetails = "";
            let parsedBackgroundImageDetails = "";
            let seasonDetails = {};
            if (titleMediaData.season_id) {
              seasonId = titleMediaData.season_id;
              seasonDetails = await model.season.findOne({
                where: {
                  id: seasonId,
                  status: "active",
                  title_id: newTitle.id,
                },
              });
              parsedVideoDetails =
                titleMediaData.video_details != null
                  ? JSON.parse(titleMediaData.video_details)
                  : null;
              parsedImageDetails =
                titleMediaData.image_details != null
                  ? JSON.parse(titleMediaData.image_details)
                  : null;
              parsedPosterDetails =
                titleMediaData.poster_image_details != null
                  ? JSON.parse(titleMediaData.poster_image_details)
                  : null;
              parsedBackgroundImageDetails =
                titleMediaData.background_image_details != null
                  ? JSON.parse(titleMediaData.background_image_details)
                  : null;
            } else if (!titleMediaData.season_id && newSeasonAdded.length > 0) {
              for (const seasonValue of newSeasonAdded) {
                if (titleMediaData.request_season_id == seasonValue.draft_season_id) {
                  seasonId = seasonValue.new_season_id;
                  seasonDetails = await model.season.findOne({
                    where: {
                      id: seasonId,
                      status: "active",
                      title_id: newTitle.id,
                    },
                  });
                  parsedVideoDetails =
                    titleMediaData.video_details != null
                      ? JSON.parse(titleMediaData.video_details)
                      : null;
                  parsedImageDetails =
                    titleMediaData.image_details != null
                      ? JSON.parse(titleMediaData.image_details)
                      : null;
                  parsedPosterDetails =
                    titleMediaData.poster_image_details != null
                      ? JSON.parse(titleMediaData.poster_image_details)
                      : null;
                  parsedBackgroundImageDetails =
                    titleMediaData.background_image_details != null
                      ? JSON.parse(titleMediaData.background_image_details)
                      : null;
                }
              }
            }

            const getLastOrder = await model.titleImage.max("list_order", {
              where: {
                title_id: newTitle.id,
                season_id: seasonId,
              },
            });
            if (seasonDetails && Object.keys(seasonDetails).length > 0) {
              if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
                await model.video.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      video_for: "title",
                      title_id: newTitle.id,
                      season: seasonId,
                    },
                  },
                );
                isVideoModified = true;
                const getVideoLastOrder = await model.video.max("list_order", {
                  where: {
                    title_id: newTitle.id,
                    season: seasonId,
                    video_for: "title",
                  },
                });

                for (const value of parsedVideoDetails.list) {
                  const videoData = {
                    name: value.name,
                    thumbnail: value.thumbnail ? value.thumbnail : null,
                    url: value.url ? value.url : null,
                    type: value.type,
                    quality: value.quality ? value.quality : null,
                    title_id: newTitle.id,
                    season: seasonId,
                    episode: value.episode ? value.episode : null,
                    source: value.source ? value.source : "local",
                    negative_votes: value.negative_votes ? value.negative_votes : 0,
                    positive_votes: value.positive_votes ? value.positive_votes : 0,
                    reports: value.reports ? value.reports : 0,
                    approved: value.approved ? value.approved : 1,
                    list_order: getVideoLastOrder ? getVideoLastOrder + 1 : 1,
                    user_id: userId,
                    category: value.category ? value.category : "trailer",
                    is_official_trailer: value.is_official_trailer
                      ? value.is_official_trailer
                      : "n",
                    site_language: value.site_language ? value.site_language : "en",
                    video_source: value.url
                      ? await generalHelper.checkUrlSource(value.url)
                      : "youtube",
                    video_for: "title",
                    no_of_view: value.no_of_view ? value.no_of_view : 0,
                    video_duration: value.video_duration ? value.video_duration : null,
                  };
                  if (value.id) {
                    const getTitleSeasonVideo = await model.video.findOne({
                      where: {
                        id: value.id,
                        title_id: newTitle.id,
                        season: seasonId,
                        video_for: "title",
                      },
                    });
                    if (getTitleSeasonVideo) {
                      await model.video.update(
                        {
                          is_official_trailer: value.is_official_trailer
                            ? value.is_official_trailer
                            : "n",
                          thumbnail: value.thumbnail ? value.thumbnail : null,
                          no_of_view: value.no_of_view ? value.no_of_view : 0,
                          video_duration: value.video_duration ? value.video_duration : null,
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "active",
                        },
                        {
                          where: {
                            id: getTitleSeasonVideo.id,
                            title_id: newTitle.id,
                            season: seasonId,
                            video_for: "title",
                          },
                        },
                      );
                      isVideoModified = true;
                    }
                  } else {
                    videoData.ele_no_of_view = 0;
                    videoData.created_at = await customDateTimeHelper.getCurrentDateTime();
                    videoData.created_by = userId;
                    await model.video.create(videoData);
                    actionDate = videoData.created_at;
                    isVideoModified = true;
                  }
                }
              } else {
                const getTitleSeasonVideo = await model.video.findAll({
                  where: {
                    title_id: newTitle.id,
                    season: seasonDetails.id,
                    status: "active",
                    video_for: "title",
                  },
                });
                if (getTitleSeasonVideo && getTitleSeasonVideo.length > 0) {
                  await model.video.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season: seasonId,
                        video_for: "title",
                      },
                    },
                  );
                  isVideoModified = true;
                }
              }
              // Image
              if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
                await model.titleImage.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season_id: seasonDetails.id,
                      image_category: "image",
                      episode_id: null,
                    },
                  },
                );
                for (const value of parsedImageDetails.list) {
                  if (value) {
                    const imageData = {
                      original_name: value.original_name ? value.original_name : null,
                      file_name: value.file_name ? value.file_name : null,
                      url: value.url ? value.url : null,
                      path: value.path ? value.path : null,
                      file_size: value.file_size ? value.file_size : null,
                      mime_type: value.mime_type ? value.mime_type : null,
                      file_extension: value.file_extension ? value.file_extension : null,
                      title_id: newTitle.id,
                      season_id: seasonDetails.id,

                      episode_id: value.episode_id ? value.episode_id : null,
                      source: value.source ? value.source : "local",
                      approved: value.approved ? value.approved : 1,
                      list_order: getLastOrder ? getLastOrder + 1 : 1,
                      image_category: value.image_category ? value.image_category : "image",
                      is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                      site_language: value.site_language ? value.site_language : "en",
                    };
                    if (value.id) {
                      const getTitleImage = await model.titleImage.findOne({
                        where: {
                          id: value.id,
                          title_id: newTitle.id,
                          season_id: seasonId,
                          image_category: "image",
                        },
                      });
                      if (getTitleImage) {
                        await model.titleImage.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "active",
                          },
                          {
                            where: {
                              id: getTitleImage.id,
                              title_id: newTitle.id,
                              season_id: seasonId,
                            },
                          },
                        );
                      }
                    } else {
                      imageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                      imageData.created_by = userId;
                      await model.titleImage.create(imageData);
                      actionDate = imageData.created_at;
                    }
                  }
                }
              } else {
                const getTitleImage = await model.titleImage.findAll({
                  where: {
                    title_id: newTitle.id,
                    season_id: seasonId,
                    image_category: "image",
                  },
                });
                if (getTitleImage && getTitleImage.length > 0) {
                  await model.titleImage.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonId,
                        image_category: "image",
                        episode_id: null,
                      },
                    },
                  );
                }
              }
              // poster image
              if (parsedPosterDetails != null && parsedPosterDetails.list.length > 0) {
                await model.titleImage.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season_id: seasonId,
                      image_category: "poster_image",
                      episode_id: null,
                    },
                  },
                );
                for (const posterValue of parsedPosterDetails.list) {
                  if (posterValue) {
                    const posterImageData = {
                      original_name: posterValue.original_name ? posterValue.original_name : null,
                      file_name: posterValue.file_name ? posterValue.file_name : null,
                      url: posterValue.url ? posterValue.url : null,
                      path: posterValue.path ? posterValue.path : null,
                      file_size: posterValue.file_size ? posterValue.file_size : null,
                      mime_type: posterValue.mime_type ? posterValue.mime_type : null,
                      file_extension: posterValue.file_extension
                        ? posterValue.file_extension
                        : null,
                      title_id: newTitle.id,
                      season_id: seasonId,
                      episode_id: posterValue.episode_id ? posterValue.episode_id : null,
                      source: posterValue.source ? posterValue.source : "local",
                      approved: posterValue.approved ? posterValue.approved : 1,
                      list_order: getLastOrder ? getLastOrder + 1 : 1,
                      image_category: posterValue.image_category
                        ? posterValue.image_category
                        : "poster_image",
                      is_main_poster: posterValue.is_main_poster
                        ? posterValue.is_main_poster
                        : null,
                      site_language: posterValue.site_language ? posterValue.site_language : "en",
                    };
                    if (posterValue.id) {
                      const getTitleSeasonImage = await model.titleImage.findOne({
                        where: {
                          id: posterValue.id,
                          title_id: newTitle.id,
                          season_id: seasonId,
                          image_category: "poster_image",
                        },
                      });
                      if (getTitleSeasonImage) {
                        await model.titleImage.update(
                          {
                            is_main_poster: posterValue.is_main_poster
                              ? posterValue.is_main_poster
                              : "n",
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "active",
                          },
                          {
                            where: {
                              id: getTitleSeasonImage.id,
                              title_id: newTitle.id,
                              season_id: seasonId,
                            },
                          },
                        );
                      }
                    } else {
                      posterImageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                      posterImageData.created_by = userId;
                      await model.titleImage.create(posterImageData);
                      actionDate = posterImageData.created_at;
                    }
                  }
                }
              } else {
                const getTitleSeasonImage = await model.titleImage.findAll({
                  where: {
                    title_id: newTitle.id,
                    season_id: seasonId,
                    image_category: "poster_image",
                  },
                });
                if (getTitleSeasonImage && getTitleSeasonImage.length > 0) {
                  await model.titleImage.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonId,
                        image_category: "poster_image",
                        episode_id: null,
                      },
                    },
                  );
                }
              }
              // background image
              if (
                parsedBackgroundImageDetails != null &&
                parsedBackgroundImageDetails.list.length > 0
              ) {
                await model.titleImage.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season_id: seasonId,
                      image_category: "bg_image",
                      episode_id: null,
                    },
                  },
                );
                for (const value of parsedBackgroundImageDetails.list) {
                  if (value) {
                    const backgroundImageData = {
                      original_name: value.original_name ? value.original_name : null,
                      file_name: value.file_name ? value.file_name : null,
                      url: value.url ? value.url : null,
                      path: value.path ? value.path : null,
                      file_size: value.file_size ? value.file_size : null,
                      mime_type: value.mime_type ? value.mime_type : null,
                      file_extension: value.file_extension ? value.file_extension : null,
                      title_id: newTitle.id,
                      season_id: seasonId,
                      episode_id: value.episode_id ? value.episode_id : null,
                      source: value.source ? value.source : "local",
                      approved: value.approved ? value.approved : 1,
                      list_order: getLastOrder ? getLastOrder + 1 : 1,
                      image_category: value.image_category ? value.image_category : "bg_image",
                      is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                      site_language: value.site_language ? value.site_language : "en",
                    };
                    if (value.id) {
                      const getTitleSeasonImage = await model.titleImage.findOne({
                        where: {
                          id: value.id,
                          title_id: newTitle.id,
                          season_id: seasonId,
                          image_category: "bg_image",
                        },
                      });
                      if (getTitleSeasonImage) {
                        await model.titleImage.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "active",
                          },
                          {
                            where: {
                              id: getTitleSeasonImage.id,
                              title_id: newTitle.id,
                              season_id: seasonId,
                            },
                          },
                        );
                      }
                    } else {
                      backgroundImageData.created_at =
                        await customDateTimeHelper.getCurrentDateTime();
                      backgroundImageData.created_by = userId;
                      await model.titleImage.create(backgroundImageData);
                      actionDate = backgroundImageData.created_at;
                    }
                  }
                }
              } else {
                const getTitleSeasonImage = await model.titleImage.findAll({
                  where: {
                    title_id: newTitle.id,
                    season_id: seasonId,
                    image_category: "bg_image",
                  },
                });
                if (getTitleSeasonImage && getTitleSeasonImage.length > 0) {
                  await model.titleImage.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonId,
                        image_category: "bg_image",
                        episode_id: null,
                      },
                    },
                  );
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
            let seasonId = "";
            let seasonDetails = {};
            let parsedCastDetails = "";
            let parsedCrewDetails = "";
            if (titleCreditData.season_id) {
              seasonId = titleCreditData.season_id;
              seasonDetails = await model.season.findOne({
                where: {
                  id: seasonId,
                  status: "active",
                  title_id: newTitle.id,
                },
              });
              parsedCastDetails =
                titleCreditData.cast_details != null
                  ? JSON.parse(titleCreditData.cast_details)
                  : null;
              parsedCrewDetails =
                titleCreditData.crew_details != null
                  ? JSON.parse(titleCreditData.crew_details)
                  : null;
            } else if (!titleCreditData.season_id && newSeasonAdded.length > 0) {
              for (const seasonValue of newSeasonAdded) {
                if (titleCreditData.request_season_id == seasonValue.draft_season_id) {
                  seasonId = seasonValue.new_season_id;
                  seasonDetails = await model.season.findOne({
                    where: {
                      id: seasonId,
                      status: "active",
                      title_id: newTitle.id,
                    },
                  });

                  parsedCastDetails =
                    titleCreditData.cast_details != null
                      ? JSON.parse(titleCreditData.cast_details)
                      : null;
                  parsedCrewDetails =
                    titleCreditData.crew_details != null
                      ? JSON.parse(titleCreditData.crew_details)
                      : null;
                }
              }
            }

            if (seasonDetails && Object.keys(seasonDetails).length > 0) {
              if (parsedCastDetails != null && parsedCastDetails.list.length > 0) {
                let peopleData = {};
                await model.creditable.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      creditable_id: newTitle.id,
                      season_id: seasonId,
                      department: "cast",
                    },
                  },
                );
                for (const castData of parsedCastDetails.list) {
                  let peopleId = 0;
                  if (
                    castData &&
                    castData.people_id === "" &&
                    (castData.cast_name != null || castData.cast_name != "") &&
                    seasonId
                  )
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
                              site_language: castData.site_language ? castData.site_language : "en",
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            await model.peopleImages.create(peoplePosterImageData);
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

                        // adding poster image details to the people image table
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
                            file_name: fileName,
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
                  else {
                    peopleId = castData.people_id ? castData.people_id : "";
                  }
                  if (seasonId && peopleId) {
                    const castDataDetails = {
                      people_id: peopleId,
                      creditable_id: newTitle.id,
                      character_name: castData.character_name ? castData.character_name : null,
                      list_order: castData.list_order,
                      department: castData.department ? castData.department : null,
                      job: castData.job ? castData.job : null,
                      creditable_type: castData.creditable_type ? castData.creditable_type : null,
                      is_guest: castData.is_guest ? castData.is_guest : 0,
                      season_id: seasonId,
                      episode_id: castData.episode_id ? castData.episode_id : null,
                      site_language: castData.site_language ? castData.site_language : "en",
                    };
                    // adding people Job details
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
                    if (castData.id) {
                      const getCastData = await model.creditable.findOne({
                        where: {
                          id: castData.id,
                          creditable_id: newTitle.id,
                          season_id: seasonId,
                          department: "cast",
                        },
                      });
                      castDataDetails.status = "active";
                      castDataDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
                      castDataDetails.updated_by = userId;
                      if (getCastData) {
                        await model.creditable.update(castDataDetails, {
                          where: {
                            id: getCastData.id,
                            creditable_id: newTitle.id,
                            season_id: seasonId,
                          },
                        });
                        actionDate = castDataDetails.updated_at;
                      }
                    } else {
                      castDataDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
                      castDataDetails.created_by = userId;
                      await model.creditable.create(castDataDetails);
                      actionDate = castDataDetails.created_at;
                    }
                  }
                }
              } else {
                const getCastData = await model.creditable.findAll({
                  where: {
                    creditable_id: newTitle.id,
                    season_id: seasonId,
                    department: "cast",
                    status: "active",
                  },
                });
                if (getCastData && getCastData.length > 0) {
                  await model.creditable.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        creditable_id: newTitle.id,
                        season_id: seasonId,
                        department: "cast",
                      },
                    },
                  );
                }
              }
              if (parsedCrewDetails != null && parsedCrewDetails.list.length > 0) {
                let peopleCrewData = {};
                await model.creditable.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      creditable_id: newTitle.id,
                      season_id: seasonId,
                      department: "crew",
                    },
                  },
                );
                for (const crewData of parsedCrewDetails.list) {
                  let cpeopleId = 0;
                  if (
                    crewData &&
                    crewData.people_id === "" &&
                    (crewData.cast_name != null || crewData.cast_name != "") &&
                    crewData.season_id
                  )
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
                        cpeopleId = getPeople.id;
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
                            getPeopleData.results.adult && getPeopleData.results.adult === true
                              ? 1
                              : 0;
                          createCrew.popularity = getPeopleData.results.popularity
                            ? getPeopleData.results.popularity
                            : null;
                        }
                        const createPeople = await model.people.create(createCrew);
                        if (createPeople.id) {
                          cpeopleId = createPeople.id;
                          payloadPeopleList.push({
                            record_id: cpeopleId,
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
                                people_id: cpeopleId,
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
                              cpeopleId,
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
                              people_id: cpeopleId,
                              site_language: crewData.site_language ? crewData.site_language : "en",
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
                            people_id: cpeopleId,
                            created_by: userId,
                          };
                          schedularAddData.push(schedularData);

                          // add data to the schedular table - people primary details other language
                          const schedularPrimaryData = {
                            tmdb_id: crewData.tmdb_id,
                            site_language: siteLanguage,
                            people_id: cpeopleId,
                            created_by: userId,
                            expected_site_language: swipLanguage,
                          };
                          schedularPrimaryAddData.push(schedularPrimaryData);
                        }
                      }
                    } else {
                      const createCrew = {
                        poster: crewData.poster,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      const createPeople = await model.people.create(createCrew);
                      if (createPeople.id) {
                        cpeopleId = createPeople.id;
                        payloadPeopleList.push({
                          record_id: cpeopleId,
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
                              people_id: cpeopleId,
                              site_language: crewData.site_language ? crewData.site_language : "en",
                            },
                          }))
                        ) {
                          await model.peopleTranslation.create(peopleCrewData);
                        }
                        // adding poster image details to the people image table
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
                            file_name: fileName,
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
                  else {
                    cpeopleId = crewData.people_id ? crewData.people_id : "";
                  }
                  if (crewData.season_id && cpeopleId) {
                    const crewDataDetails = {
                      people_id: cpeopleId,
                      creditable_id: newTitle.id,
                      character_name: crewData.character_name ? crewData.character_name : null,
                      list_order: crewData.list_order,
                      department: crewData.department ? crewData.department : "crew",
                      job: crewData.job ? crewData.job : null,
                      creditable_type: crewData.creditable_type ? crewData.creditable_type : null,
                      is_guest: crewData.is_guest ? crewData.is_guest : 0,
                      season_id: seasonId,
                      episode_id: crewData.episode_id ? crewData.episode_id : null,
                      site_language: crewData.site_language ? crewData.site_language : "en",
                    };
                    // adding data to people job
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
                            people_id: cpeopleId,
                            job_id: peopleJobId,
                            status: "active",
                          },
                        });
                        // list order
                        const getLastOrder = await model.peopleJobs.max("list_order", {
                          where: {
                            people_id: cpeopleId,
                            status: "active",
                          },
                        });
                        if (!isPeopleJobExist) {
                          const data = {
                            people_id: cpeopleId,
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
                    if (crewData.id) {
                      const getCrewData = await model.creditable.findOne({
                        where: {
                          id: crewData.id,
                          creditable_id: newTitle.id,
                          season_id: seasonId,
                          department: "crew",
                        },
                      });
                      crewDataDetails.status = "active";
                      crewDataDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
                      crewDataDetails.updated_by = userId;
                      if (getCrewData) {
                        await model.creditable.update(crewDataDetails, {
                          where: {
                            id: getCrewData.id,
                            creditable_id: newTitle.id,
                            season_id: seasonId,
                          },
                        });
                        actionDate = crewDataDetails.updated_at;
                      }
                    } else {
                      crewDataDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
                      crewDataDetails.created_by = userId;
                      await model.creditable.create(crewDataDetails);
                      actionDate = crewDataDetails.created_at;
                    }
                  }
                }
              } else {
                const getCrewData = await model.creditable.findAll({
                  where: {
                    creditable_id: newTitle.id,
                    season_id: seasonId,
                    department: "crew",
                  },
                });
                if (getCrewData && getCrewData.length > 0) {
                  await model.creditable.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        creditable_id: newTitle.id,
                        season_id: seasonId,
                        department: "crew",
                      },
                    },
                  );
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
      if (findRequestId[0].type === "webtoons" && newTitle.id) {
        await model.title.update(
          {
            avg_rating: await titleService.calculateWebtoonsRating(
              titleId,
              findRequestId[0].rating ? findRequestId[0].rating : null,
            ),
          },
          {
            where: {
              id: newTitle.id,
              record_status: "active",
            },
          },
        );

        //   create the data in the Title countries table
        const countryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (countryDetails != null && countryDetails.list.length > 0) {
          await model.titleCountries.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            },
          );
          for (const value of countryDetails.list) {
            const titleCountries = {
              title_id: newTitle.id,
              country_id: value.country_id,
              site_language: value.site_language ? value.site_language : "en",
            };
            if (value.id) {
              const getTitleCountries = await model.titleCountries.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  country_id: value.country_id,
                },
              });
              titleCountries.status = "active";
              titleCountries.updated_at = await customDateTimeHelper.getCurrentDateTime();
              titleCountries.updated_by = userId;
              if (getTitleCountries) {
                await model.titleCountries.update(titleCountries, {
                  where: { id: getTitleCountries.id, title_id: newTitle.id },
                });
                actionDate = titleCountries.updated_at;
              }
            } else {
              titleCountries.created_by = userId;
              titleCountries.created_at = await customDateTimeHelper.getCurrentDateTime();
              const checkTitleCountries = await model.titleCountries.findOne({
                where: {
                  country_id: value.country_id,
                  title_id: newTitle.id,
                  status: "active",
                },
              });
              if (!checkTitleCountries) {
                await model.titleCountries.create(titleCountries);
                actionDate = titleCountries.created_at;
              }
            }
          }
        } else {
          const getTitleCountries = await model.titleCountries.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getTitleCountries && getTitleCountries.length > 0) {
            await model.titleCountries.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                },
              },
            );
          }
        }

        //   create the data in the connection table
        const connectionDetails =
          findRequestId[0].connection_details != null
            ? JSON.parse(findRequestId[0].connection_details)
            : null;
        if (connectionDetails != null && connectionDetails.list.length > 0) {
          await model.relatedTitle.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            },
          );
          for (const value of connectionDetails.list) {
            const connectionData = {
              title_id: newTitle.id,
              related_title_id: value.related_title_id,
              site_language: findRequestId[0].site_language,
              season_id: value.season_id ? value.season_id : null,
              episode_id: value.episode_id ? value.episode_id : null,
            };
            if (value.id) {
              const getRelatedTitle = await model.relatedTitle.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  related_title_id: value.related_title_id,
                },
              });
              connectionData.status = "active";
              connectionData.updated_at = await customDateTimeHelper.getCurrentDateTime();
              connectionData.updated_by = userId;
              if (getRelatedTitle) {
                await model.relatedTitle.update(connectionData, {
                  where: { id: getRelatedTitle.id, title_id: newTitle.id },
                });
                actionDate = connectionData.updated_at;
              }
            } else {
              connectionData.created_at = await customDateTimeHelper.getCurrentDateTime();
              connectionData.created_by = userId;
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
                await model.relatedTitle.create(connectionData);
                actionDate = connectionData.created_at;
              }

              if (!checkOtherConnection) {
                const connectionOtherData = {
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
                await model.relatedTitle.create(connectionOtherData);
                actionDate = connectionOtherData.created_at;
              }
            }
          }
        } else {
          const getRelatedTitle = await model.relatedTitle.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getRelatedTitle && getRelatedTitle.length > 0) {
            await model.relatedTitle.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                },
              },
            );
          }
        }
        // create a data for title_keywords details-tv details page-search keyword:
        const searchKeywordDetails =
          findRequestId[0].search_keyword_details != null
            ? JSON.parse(findRequestId[0].search_keyword_details)
            : null;
        if (searchKeywordDetails != null && searchKeywordDetails.list.length > 0) {
          await model.titleKeyword.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                keyword_type: "search",
                status: "active",
                season_id: null,
              },
            },
          );
          for (const value of searchKeywordDetails.list) {
            if (value.keyword) {
              const searchKeywordData = {
                title_id: newTitle.id,
                site_language: findRequestId[0].site_language,
                keyword: value.keyword ? value.keyword : null,
                keyword_type: value.keyword_type ? value.keyword_type : null,
              };

              const getTitleKeyword = await model.titleKeyword.findOne({
                where: {
                  title_id: newTitle.id,
                  keyword_type: "search",
                  keyword: value.keyword,
                },
              });

              if (getTitleKeyword) {
                searchKeywordData.status = "active";
                searchKeywordData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                searchKeywordData.updated_by = userId;
                await model.titleKeyword.update(searchKeywordData, {
                  where: { id: getTitleKeyword.id, title_id: newTitle.id },
                });
                actionDate = searchKeywordData.updated_at;
              } else {
                searchKeywordData.created_at = await customDateTimeHelper.getCurrentDateTime();
                searchKeywordData.created_by = userId;
                await model.titleKeyword.create(searchKeywordData);
                actionDate = searchKeywordData.created_at;
              }
            }
          }
        } else {
          const getTitleKeyword = await model.titleKeyword.findAll({
            where: {
              title_id: newTitle.id,
              keyword_type: "search",
              status: "active",
            },
          });
          if (getTitleKeyword && getTitleKeyword.length > 0) {
            await model.titleKeyword.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  keyword_type: "search",
                  status: "active",
                  season_id: null,
                },
              },
            );
          }
        }

        //   create the data in the or update weeklyTelecast data
        const weeklyTeleDetails =
          findRequestId[0].weekly_telecast_details != null
            ? JSON.parse(findRequestId[0].weekly_telecast_details)
            : null;
        if (weeklyTeleDetails != null && weeklyTeleDetails.list.length > 0) {
          await model.weeklyTelecast.update(
            {
              updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
              updated_by: userId,
              status: "deleted",
            },
            {
              where: {
                title_id: newTitle.id,
                status: "active",
              },
            },
          );
          for (const value of weeklyTeleDetails.list) {
            const titleWeeklyTeleDetails = {
              title_id: newTitle.id,
              telecast_day: value.telecast_day,
              site_language: value.site_language ? value.site_language : "en",
            };
            if (value.id) {
              const getWeeklyTeleDetails = await model.weeklyTelecast.findOne({
                where: {
                  id: value.id,
                  title_id: newTitle.id,
                  telecast_day: value.telecast_day,
                },
              });
              titleWeeklyTeleDetails.status = "active";
              titleWeeklyTeleDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
              titleWeeklyTeleDetails.updated_by = userId;
              if (getWeeklyTeleDetails) {
                await model.weeklyTelecast.update(titleWeeklyTeleDetails, {
                  where: { id: getWeeklyTeleDetails.id, title_id: newTitle.id },
                });
                actionDate = titleWeeklyTeleDetails.updated_at;
              }
            } else {
              titleWeeklyTeleDetails.created_by = userId;
              titleWeeklyTeleDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
              const checkTelecastDetails = await model.weeklyTelecast.findOne({
                where: {
                  telecast_day: value.telecast_day,
                  title_id: newTitle.id,
                  status: "active",
                },
              });
              if (!checkTelecastDetails) {
                await model.weeklyTelecast.create(titleWeeklyTeleDetails);
                actionDate = titleWeeklyTeleDetails.created_at;
              }
            }
          }
        } else {
          const getWeeklytelecast = await model.weeklyTelecast.findAll({
            where: {
              title_id: newTitle.id,
              status: "active",
            },
          });
          if (getWeeklytelecast && getWeeklytelecast.length > 0) {
            await model.weeklyTelecast.update(
              {
                updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                updated_by: userId,
                status: "deleted",
              },
              {
                where: {
                  title_id: newTitle.id,
                  status: "active",
                },
              },
            );
          }
        }

        // -----------------------------Tag Data--------------------------------------------
        // create data for the tag section:
        let requestId = [];
        for (const value of findRequestId) {
          if (value.id) {
            requestId.push(value.id);
          }
        }
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
            //find genre tags
            const genreOldTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: "genre",
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (genreOldTags && genreOldTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: genreOldTags,
                    },
                  },
                },
              );
            }
            for (const value of parsedGenreDetails.list) {
              const genreData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
              };
              if (value.id) {
                const getTagGable = await model.tagGable.findOne({
                  where: {
                    id: value.id,
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                genreData.status = "active";
                genreData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                genreData.updated_by = userId;
                if (getTagGable) {
                  await model.tagGable.update(genreData, {
                    where: { id: getTagGable.id, taggable_id: newTitle.id },
                  });
                  actionDate = genreData.updated_at;
                }
              } else {
                genreData.created_at = await customDateTimeHelper.getCurrentDateTime();
                genreData.created_by = userId;
                const checkTagGable = await model.tagGable.findOne({
                  where: {
                    status: "active",
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                if (!checkTagGable) {
                  await model.tagGable.create(genreData);
                  actionDate = genreData.created_at;
                }
              }
            }
          } else {
            //find genre tags
            const genreOldTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: "genre",
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (genreOldTags && genreOldTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: genreOldTags,
                    },
                  },
                },
              );
            }
          }
          if (parsedTagDetails != null && parsedTagDetails.list.length > 0) {
            //find other tags
            const otherTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: { [Op.ne]: "genre" },
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (otherTags && otherTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: otherTags,
                    },
                  },
                },
              );
            }
            for (const value of parsedTagDetails.list) {
              const tagData = {
                tag_id: value.tag_id,
                tag_name: value.tag_name,
                taggable_id: newTitle.id,
                taggable_type: value.taggable_type,
                site_language: value.site_language,
                user_id: userId,
                score: value.score,
              };
              if (value.id) {
                const getTagGable = await model.tagGable.findOne({
                  where: {
                    id: value.id,
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                tagData.status = "active";
                tagData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                tagData.updated_by = userId;
                if (getTagGable) {
                  await model.tagGable.update(tagData, {
                    where: { id: getTagGable.id, taggable_id: newTitle.id },
                  });
                  actionDate = tagData.updated_at;
                }
              } else {
                tagData.created_at = await customDateTimeHelper.getCurrentDateTime();
                tagData.created_by = userId;
                const checkTagGable = await model.tagGable.findOne({
                  where: {
                    status: "active",
                    taggable_id: newTitle.id,
                    tag_id: value.tag_id,
                    taggable_type: value.taggable_type,
                  },
                });
                if (!checkTagGable) {
                  await model.tagGable.create(tagData);
                  actionDate = tagData.created_at;
                }
              }
            }
          } else {
            //find other tags
            const otherTags = await model.tagGable
              .findAll({
                include: [
                  {
                    model: model.tag,
                    left: true,
                    where: {
                      status: "active",
                      type: { [Op.ne]: "genre" },
                    },
                    required: true,
                  },
                ],
                where: { taggable_id: newTitle.id, status: "active", taggable_type: "title" },
                attributes: ["tag_id"],
                raw: true,
              })
              .then((tags) => tags.map((tag) => tag.tag_id));
            if (otherTags && otherTags.length > 0) {
              await model.tagGable.update(
                {
                  updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                  updated_by: userId,
                  status: "deleted",
                },
                {
                  where: {
                    taggable_id: newTitle.id,
                    status: "active",
                    taggable_type: "title",
                    tag_id: {
                      [Op.in]: otherTags,
                    },
                  },
                },
              );
            }
          }
          // }
        }

        // ----------------- season related details -----------------
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
        // latestReqModified - latest season request for first language
        // anotherRequestId - if another request is generated for another language - it is used for season translation tables
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

        const [foundSeasonData, foundCreditData, foundMediaData, foundEpisodeDataDetails] =
          await Promise.all([
            model.titleRequestSeasonDetails.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
            model.titleRequestCredit.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
            model.titleRequestMedia.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
            model.titleRequestEpisodeDetails.findAll({
              where: { request_id: latestReqModified, status: "active" },
            }),
          ]);

        // Season Details:
        let newSeasonAdded = [];
        if (foundSeasonData && foundSeasonData.length > 0) {
          for (const titleSeasonData of foundSeasonData) {
            const readList = [];
            if (titleSeasonData) {
              const parsedSeasonData =
                titleSeasonData.season_details != null
                  ? JSON.parse(titleSeasonData.season_details)
                  : null;
              if (parsedSeasonData != null) {
                const seasonData = {
                  release_date: parsedSeasonData.release_date
                    ? parsedSeasonData.release_date
                    : null,
                  poster: parsedSeasonData.poster ? parsedSeasonData.poster : null,
                  number: parsedSeasonData.number,
                  season_name: parsedSeasonData.season_name ? parsedSeasonData.season_name : null,
                  title_tmdb_id: newTitle.tmdb_id ? newTitle.tmdb_id : null,
                  summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                  aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                  episode_count: parsedSeasonData.episode_count,
                  site_language: parsedSeasonData.site_language
                    ? parsedSeasonData.site_language
                    : "en",
                };
                let createSeasonData = null;
                if (parsedSeasonData.id) {
                  const getTitleSeason = await model.season.findOne({
                    where: {
                      id: parsedSeasonData.id,
                      title_id: newTitle.id,
                    },
                  });
                  seasonData.status = "active";
                  seasonData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                  seasonData.updated_by = userId;
                  if (getTitleSeason) {
                    await model.season.update(seasonData, {
                      where: {
                        id: getTitleSeason.id,
                        title_id: newTitle.id,
                      },
                    });
                    actionDate = seasonData.updated_at;
                    // season Translation details:
                    let seasonTranslationData = {
                      season_id: getTitleSeason.id,
                      season_name: parsedSeasonData.season_name
                        ? parsedSeasonData.season_name
                        : null,
                      summary: parsedSeasonData.summary ? parsedSeasonData.summary : null,
                      aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                      site_language: parsedSeasonData.site_language
                        ? parsedSeasonData.site_language
                        : "en",
                    };
                    const seasonTranslation = await model.seasonTranslation.findOne({
                      where: {
                        season_id: getTitleSeason.id,
                        site_language: parsedSeasonData.site_language
                          ? parsedSeasonData.site_language
                          : "en",
                      },
                    });
                    if (seasonTranslation) {
                      seasonTranslationData.updated_at =
                        await customDateTimeHelper.getCurrentDateTime();
                      seasonTranslationData.updated_by = userId;
                      await model.seasonTranslation.update(seasonTranslationData, {
                        where: {
                          season_id: getTitleSeason.id,
                          site_language: parsedSeasonData.site_language
                            ? parsedSeasonData.site_language
                            : "en",
                        },
                      });
                      actionDate = seasonTranslationData.updated_at;
                    } else {
                      seasonTranslationData.created_at =
                        await customDateTimeHelper.getCurrentDateTime();
                      seasonTranslationData.created_by = userId;
                      await model.seasonTranslation.create(seasonTranslationData);
                      actionDate = seasonTranslationData.created_at;
                    }

                    // other request season details:
                    if (anotherRequestId) {
                      const anotherRequestDetails = await model.titleRequestSeasonDetails.findOne({
                        where: {
                          request_id: anotherRequestId,
                          season_no: titleSeasonData.season_no,
                        },
                      });
                      if (anotherRequestDetails) {
                        const anotherParsedSeasonData =
                          anotherRequestDetails.season_details != null
                            ? JSON.parse(anotherRequestDetails.season_details)
                            : null;
                        if (anotherParsedSeasonData) {
                          const seasonTranslationDataTwo = {
                            season_id: getTitleSeason.id,
                            season_name: anotherParsedSeasonData.season_name
                              ? anotherParsedSeasonData.season_name
                              : null,
                            summary: anotherParsedSeasonData.summary
                              ? anotherParsedSeasonData.summary
                              : null,
                            aka: parsedSeasonData.aka ? parsedSeasonData.aka : null,
                            episode_count: anotherParsedSeasonData.episode_count,
                            site_language: anotherParsedSeasonData.site_language
                              ? anotherParsedSeasonData.site_language
                              : "en",
                          };
                          const seasonSecondReqData = await model.seasonTranslation.findOne({
                            where: {
                              season_id: getTitleSeason.id,
                              site_language: anotherParsedSeasonData.site_language
                                ? anotherParsedSeasonData.site_language
                                : "en",
                            },
                          });
                          if (seasonSecondReqData) {
                            seasonTranslationDataTwo.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            seasonTranslationDataTwo.updated_by = userId;
                            await model.seasonTranslation.update(seasonTranslationDataTwo, {
                              where: {
                                season_id: getTitleSeason.id,
                                site_language: anotherParsedSeasonData.site_language
                                  ? anotherParsedSeasonData.site_language
                                  : "en",
                              },
                            });
                            actionDate = seasonTranslationDataTwo.updated_at;
                          } else {
                            seasonTranslationDataTwo.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            seasonTranslationDataTwo.created_by = userId;
                            await model.seasonTranslation.create(seasonTranslationDataTwo);
                            actionDate = seasonTranslationDataTwo.created_at;
                          }
                        }
                      }
                    }
                  }
                  createSeasonData = await model.season.findOne({
                    where: {
                      id: parsedSeasonData.id,
                      title_id: newTitle.id,
                    },
                  });
                  if (createSeasonData) {
                    // for season search_keyword_details,news search keyword, watch on details on the season page
                    const seasonSearchKeywordDetails =
                      titleSeasonData.season_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_search_keyword_details)
                        : null;
                    if (
                      seasonSearchKeywordDetails != null &&
                      seasonSearchKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "search",
                            status: "active",
                            season_id: createSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonSearchKeywordDetails.list) {
                        if (value.keyword) {
                          const searchKeywordData = {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              keyword: value.keyword,
                              season_id: createSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            searchKeywordData.status = "active";
                            searchKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.updated_by = userId;
                            await model.titleKeyword.update(searchKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                              },
                            });
                            actionDate = searchKeywordData.updated_at;
                          } else {
                            searchKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.created_by = userId;
                            await model.titleKeyword.create(searchKeywordData);
                            actionDate = searchKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "search",
                          season_id: createSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              status: "active",
                              season_id: createSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    const seasonNewsKeywordDetails =
                      titleSeasonData.season_news_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_news_search_keyword_details)
                        : null;
                    if (
                      seasonNewsKeywordDetails != null &&
                      seasonNewsKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "news",
                            status: "active",
                            season_id: createSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonNewsKeywordDetails.list) {
                        if (value.keyword) {
                          const newsKeywordData = {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              keyword: value.keyword,
                              season_id: createSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            newsKeywordData.status = "active";
                            newsKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.updated_by = userId;
                            await model.titleKeyword.update(newsKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                              },
                            });
                            actionDate = newsKeywordData.updated_at;
                          } else {
                            newsKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.created_by = userId;
                            await model.titleKeyword.create(newsKeywordData);
                            actionDate = newsKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "news",
                          season_id: createSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              status: "active",
                              season_id: createSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    // channel Details update
                    const seasonChannelDetails =
                      titleSeasonData.season_channel_details != null
                        ? JSON.parse(titleSeasonData.season_channel_details)
                        : null;
                    if (seasonChannelDetails != null && seasonChannelDetails.list.length > 0) {
                      await model.webtoonsChannelList.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            status: "active",
                          },
                        },
                      );
                      for (const value of seasonChannelDetails.list) {
                        if (value) {
                          const channelData = {
                            title_id: newTitle.id,
                            url: value.url ? value.url : null,
                            webtoons_channel_id: value.webtoons_channel_id
                              ? value.webtoons_channel_id
                              : null,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            episode_id: value.episode_id ? value.episode_id : null,
                            site_language: value.site_language ? value.site_language : "en",
                          };
                          if (value.id) {
                            const getTitleChannel = await model.webtoonsChannelList.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                              },
                            });
                            channelData.status = "active";
                            channelData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.updated_by = userId;
                            if (getTitleChannel) {
                              await model.webtoonsChannelList.update(channelData, {
                                where: {
                                  id: getTitleChannel.id,
                                  title_id: newTitle.id,
                                  season_id: createSeasonData.id,
                                },
                              });
                              actionDate = channelData.updated_at;
                            }
                          } else {
                            channelData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.created_by = userId;
                            const checkTitleChannel = await model.webtoonsChannelList.findOne({
                              where: {
                                title_id: newTitle.id,
                                status: "active",
                                url: value.url ? value.url : null,
                                webtoons_channel_id: value.webtoons_channel_id
                                  ? value.webtoons_channel_id
                                  : null,
                                season_id: createSeasonData.id ? createSeasonData.id : null,
                                episode_id: value.episode_id ? value.episode_id : null,
                              },
                            });
                            if (!checkTitleChannel) {
                              await model.webtoonsChannelList.create(channelData);
                              actionDate = channelData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getTitleChannel = await model.webtoonsChannelList.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleChannel && getTitleChannel.length > 0) {
                        await model.webtoonsChannelList.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createSeasonData.id,
                              status: "active",
                            },
                          },
                        );
                      }
                    }
                    // create data in watch on
                    const readDetails =
                      titleSeasonData.read_list_details != null
                        ? JSON.parse(titleSeasonData.read_list_details)
                        : null;

                    //watch on stream
                    if (readDetails != null && readDetails.list.length > 0) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createSeasonData.id,
                            status: "active",
                            type: "read",
                          },
                        },
                      );
                      for (const value of readDetails.list) {
                        if (
                          value &&
                          (readList.length === 0 || readList.indexOf(value.provider_id) === -1)
                        ) {
                          readList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "read",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createSeasonData.id ? createSeasonData.id : null,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getStreamData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createSeasonData.id,
                                type: "read",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getStreamData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getStreamData.id,
                                  title_id: newTitle.id,
                                  season_id: createSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkStream = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "read",
                                season_id: createSeasonData.id ? createSeasonData.id : null,
                              },
                            });
                            if (!checkStream) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getStreamData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createSeasonData.id,
                          type: "read",
                          status: "active",
                        },
                      });
                      if (getStreamData && getStreamData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createSeasonData.id,
                              status: "active",
                              type: "read",
                            },
                          },
                        );
                      }
                    }
                  }
                } else {
                  seasonData.title_id = newTitle.id;
                  seasonData.created_at = await customDateTimeHelper.getCurrentDateTime();
                  seasonData.created_by = userId;
                  const createNewSeasonData = await model.season.create(seasonData);
                  if (createNewSeasonData.id) {
                    actionDate = seasonData.created_at;

                    // create record for season translation:
                    const seasonTranslationData = {
                      season_id: createNewSeasonData.id,
                      season_name: parsedSeasonData.season_name
                        ? parsedSeasonData.season_name
                        : null,
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
                          season_no: titleSeasonData.season_no,
                        },
                      });
                      if (anotherRequestDetails) {
                        const anotherParsedSeasonData =
                          anotherRequestDetails.season_details != null
                            ? JSON.parse(anotherRequestDetails.season_details)
                            : null;
                        if (anotherParsedSeasonData) {
                          const seasonTranslationData = {
                            season_id: createNewSeasonData.id,
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
                    // for season search_keyword_details,news search keyword, watch on details on the season page
                    const seasonSearchKeywordDetails =
                      titleSeasonData.season_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_search_keyword_details)
                        : null;
                    if (
                      seasonSearchKeywordDetails != null &&
                      seasonSearchKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "search",
                            status: "active",
                            season_id: createNewSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonSearchKeywordDetails.list) {
                        if (value.keyword) {
                          const searchKeywordData = {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              keyword: value.keyword,
                              season_id: createNewSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            searchKeywordData.status = "active";
                            searchKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.updated_by = userId;
                            await model.titleKeyword.update(searchKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                              },
                            });
                            actionDate = searchKeywordData.updated_at;
                          } else {
                            searchKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            searchKeywordData.created_by = userId;
                            await model.titleKeyword.create(searchKeywordData);
                            actionDate = searchKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "search",
                          season_id: createNewSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "search",
                              status: "active",
                              season_id: createNewSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    const seasonNewsKeywordDetails =
                      titleSeasonData.season_news_search_keyword_details != null
                        ? JSON.parse(titleSeasonData.season_news_search_keyword_details)
                        : null;
                    if (
                      seasonNewsKeywordDetails != null &&
                      seasonNewsKeywordDetails.list.length > 0
                    ) {
                      await model.titleKeyword.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            keyword_type: "news",
                            status: "active",
                            season_id: createNewSeasonData.id,
                          },
                        },
                      );
                      for (const value of seasonNewsKeywordDetails.list) {
                        if (value.keyword) {
                          const newsKeywordData = {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            site_language: value.site_language ? value.site_language : "en",
                            keyword: value.keyword ? value.keyword : null,
                            keyword_type: value.keyword_type ? value.keyword_type : null,
                          };
                          const getTitleKeyword = await model.titleKeyword.findOne({
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              keyword: value.keyword,
                              season_id: createNewSeasonData.id,
                            },
                          });
                          if (getTitleKeyword) {
                            newsKeywordData.status = "active";
                            newsKeywordData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.updated_by = userId;
                            await model.titleKeyword.update(newsKeywordData, {
                              where: {
                                id: getTitleKeyword.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                              },
                            });
                            actionDate = newsKeywordData.updated_at;
                          } else {
                            newsKeywordData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            newsKeywordData.created_by = userId;
                            await model.titleKeyword.create(newsKeywordData);
                            actionDate = newsKeywordData.created_at;
                          }
                        }
                      }
                    } else {
                      const getTitleKeyword = await model.titleKeyword.findAll({
                        where: {
                          title_id: newTitle.id,
                          keyword_type: "news",
                          season_id: createNewSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleKeyword && getTitleKeyword.length > 0) {
                        await model.titleKeyword.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              keyword_type: "news",
                              status: "active",
                              season_id: createNewSeasonData.id,
                            },
                          },
                        );
                      }
                    }
                    // channel Details update
                    const seasonChannelDetails =
                      titleSeasonData.season_channel_details != null
                        ? JSON.parse(titleSeasonData.season_channel_details)
                        : null;
                    if (seasonChannelDetails != null && seasonChannelDetails.list.length > 0) {
                      await model.webtoonsChannelList.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            status: "active",
                          },
                        },
                      );
                      for (const value of seasonChannelDetails.list) {
                        if (value) {
                          const channelData = {
                            title_id: newTitle.id,
                            url: value.url ? value.url : null,
                            webtoons_channel_id: value.webtoons_channel_id
                              ? value.webtoons_channel_id
                              : null,
                            season_id: createNewSeasonData.id,
                            episode_id: value.episode_id ? value.episode_id : null,
                            site_language: value.site_language ? value.site_language : "en",
                          };
                          if (value.id) {
                            const getTitleChannel = await model.webtoonsChannelList.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                              },
                            });
                            channelData.status = "active";
                            channelData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.updated_by = userId;
                            if (getTitleChannel) {
                              await model.webtoonsChannelList.update(channelData, {
                                where: {
                                  id: getTitleChannel.id,
                                  title_id: newTitle.id,
                                  season_id: createNewSeasonData.id,
                                },
                              });
                              actionDate = channelData.updated_at;
                            }
                          } else {
                            channelData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            channelData.created_by = userId;
                            const checkTitleChannel = await model.webtoonsChannelList.findOne({
                              where: {
                                title_id: newTitle.id,
                                status: "active",
                                url: value.url ? value.url : null,
                                webtoons_channel_id: value.webtoons_channel_id
                                  ? value.webtoons_channel_id
                                  : null,
                                season_id: createNewSeasonData.id,
                                episode_id: value.episode_id ? value.episode_id : null,
                              },
                            });
                            if (!checkTitleChannel) {
                              await model.webtoonsChannelList.create(channelData);
                              actionDate = channelData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getTitleChannel = await model.webtoonsChannelList.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createNewSeasonData.id,
                          status: "active",
                        },
                      });
                      if (getTitleChannel && getTitleChannel.length > 0) {
                        await model.webtoonsChannelList.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createNewSeasonData.id,
                              status: "active",
                            },
                          },
                        );
                      }
                    }
                    // create data in watch on
                    const readDetails =
                      titleSeasonData.read_list_details != null
                        ? JSON.parse(titleSeasonData.read_list_details)
                        : null;
                    //watch on stream
                    if (readDetails != null && readDetails.list.length > 0) {
                      await model.titleWatchOn.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            title_id: newTitle.id,
                            season_id: createNewSeasonData.id,
                            status: "active",
                            type: "read",
                          },
                        },
                      );
                      for (const value of readDetails.list) {
                        if (
                          value &&
                          (readList.length === 0 || readList.indexOf(value.provider_id) === -1)
                        ) {
                          readList.push(value.provider_id);
                          const watchOnData = {
                            title_id: newTitle.id,
                            movie_id: value.movie_id ? value.movie_id : null,
                            url: value.url ? value.url : null,
                            type: value.type ? value.type : "read",
                            provider_id: value.provider_id ? value.provider_id : null,
                            season_id: createNewSeasonData.id,
                            episode_id: value.episode_id ? value.episode_id : null,
                          };
                          if (value.id) {
                            const getStreamData = await model.titleWatchOn.findOne({
                              where: {
                                id: value.id,
                                title_id: newTitle.id,
                                season_id: createNewSeasonData.id,
                                type: "read",
                              },
                            });
                            watchOnData.status = "active";
                            watchOnData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.updated_by = userId;
                            if (getStreamData) {
                              await model.titleWatchOn.update(watchOnData, {
                                where: {
                                  id: getStreamData.id,
                                  title_id: newTitle.id,
                                  season_id: createNewSeasonData.id,
                                },
                              });
                              actionDate = watchOnData.updated_at;
                            }
                          } else {
                            watchOnData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            watchOnData.created_by = userId;
                            const checkStream = await model.titleWatchOn.findOne({
                              where: {
                                provider_id: value.provider_id,
                                title_id: newTitle.id,
                                status: "active",
                                type: "read",
                                season_id: createNewSeasonData.id,
                              },
                            });
                            if (!checkStream) {
                              await model.titleWatchOn.create(watchOnData);
                              actionDate = watchOnData.created_at;
                            }
                          }
                        }
                      }
                    } else {
                      const getStreamData = await model.titleWatchOn.findAll({
                        where: {
                          title_id: newTitle.id,
                          season_id: createNewSeasonData.id,
                          type: "read",
                          status: "active",
                        },
                      });
                      if (getStreamData && getStreamData.length > 0) {
                        await model.titleWatchOn.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              title_id: newTitle.id,
                              season_id: createNewSeasonData.id,
                              status: "active",
                              type: "read",
                            },
                          },
                        );
                      }
                    }
                  }

                  const addedSeasonData = {
                    draft_request_id: titleSeasonData.request_id,
                    draft_season_id: titleSeasonData.id,
                    season_no: titleSeasonData.season_no,
                    new_season_id: createNewSeasonData.id,
                    equivalent_season_id: 0,
                  };
                  if (anotherRequestId) {
                    const equivalentSeasonId = await model.titleRequestSeasonDetails.findOne({
                      where: {
                        request_id: anotherRequestId,
                        season_no: titleSeasonData.season_no,
                        status: "active",
                      },
                    });
                    addedSeasonData.equivalent_season_id =
                      equivalentSeasonId && equivalentSeasonId.id ? equivalentSeasonId.id : 0;
                  }
                  newSeasonAdded.push(addedSeasonData);
                }
              }
            }
          }
        }
        // Episode Details:
        if (foundEpisodeDataDetails && foundEpisodeDataDetails.length > 0) {
          for (const foundEpisodeData of foundEpisodeDataDetails) {
            if (foundEpisodeData && foundEpisodeData.dataValues) {
              if (foundEpisodeData.dataValues.season_id) {
                const seasonId = foundEpisodeData.dataValues.season_id;
                const seasonDetails = await model.season.findOne({
                  where: {
                    id: seasonId,
                    status: "active",
                    title_id: newTitle.id,
                  },
                });
                const parsedEpisodeData =
                  foundEpisodeData.dataValues.episode_details != null
                    ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                    : null;

                if (parsedEpisodeData != null && seasonDetails) {
                  await model.episode.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonDetails.id
                          ? seasonDetails.id
                          : foundEpisodeData.dataValues.season_id,
                      },
                    },
                  );
                  for (const episodeValue of parsedEpisodeData.list) {
                    if (episodeValue) {
                      let createdEpisode = null;
                      if (episodeValue.id) {
                        const episodeUpData = {
                          name: episodeValue.name,
                          episode_number: episodeValue.episode_number
                            ? episodeValue.episode_number
                            : 1,
                          url: episodeValue.url ? episodeValue.url : null,
                          poster: episodeValue.poster ? episodeValue.poster : null,
                          release_date: episodeValue.release_date
                            ? episodeValue.release_date
                            : null,
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
                          site_language: episodeValue.site_language
                            ? episodeValue.site_language
                            : titleData.site_language,
                        };
                        const getTitleSeasonEpisode = await model.episode.findOne({
                          where: {
                            id: episodeValue.id,
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        });
                        episodeUpData.status = "active";
                        episodeUpData.updated_at = await customDateTimeHelper.getCurrentDateTime();
                        episodeUpData.updated_by = userId;
                        if (getTitleSeasonEpisode) {
                          await model.episode.update(episodeUpData, {
                            where: {
                              id: getTitleSeasonEpisode.id,
                              title_id: newTitle.id,
                            },
                          });
                          actionDate = episodeUpData.updated_at;

                          // episodeTranslationData
                          let episodeTranslationData = {
                            episode_id: getTitleSeasonEpisode.id,
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                            name: episodeValue.name,
                            url: episodeValue.url ? episodeValue.url : null,
                          };

                          const findEpisodeTranslation = await model.episodeTranslation.findOne({
                            where: {
                              episode_id: getTitleSeasonEpisode.id,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                            },
                          });
                          if (findEpisodeTranslation) {
                            episodeTranslationData.status = "active";
                            episodeTranslationData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            episodeTranslationData.updated_by = userId;
                            await model.episodeTranslation.update(episodeTranslationData, {
                              where: {
                                episode_id: getTitleSeasonEpisode.id,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                              },
                            });
                            actionDate = episodeTranslationData.updated_at;
                          } else {
                            episodeTranslationData.status = "active";
                            episodeTranslationData.created_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            episodeTranslationData.created_by = userId;
                            await model.episodeTranslation.create(episodeTranslationData);
                            actionDate = episodeTranslationData.created_at;
                          }
                        }
                        createdEpisode = await model.episode.findOne({
                          where: {
                            id: episodeValue.id,
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        });
                      } else {
                        const episodeData = {
                          name: episodeValue.name,
                          url: episodeValue.url ? episodeValue.url : null,
                          poster: episodeValue.poster ? episodeValue.poster : null,
                          release_date: episodeValue.release_date
                            ? episodeValue.release_date
                            : null,
                          title_id: newTitle.id,
                          season_id: seasonDetails.id
                            ? seasonDetails.id
                            : foundEpisodeData.season_id,
                          season_number: seasonDetails.number,
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
                          site_language: episodeValue.site_language
                            ? episodeValue.site_language
                            : titleData.site_language,
                          created_by: userId,
                        };
                        createdEpisode = await model.episode.create(episodeData);
                        actionDate = episodeData.created_at;

                        // Create Episode translation:
                        if (createdEpisode.id) {
                          const episodeTranslationData = {
                            episode_id: createdEpisode.id,
                            name: episodeValue.name,
                            url: episodeValue.url ? episodeValue.url : null,
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                            created_at: await customDateTimeHelper.getCurrentDateTime(),
                            created_by: userId,
                          };
                          const findEpisodeTranslation = await model.episodeTranslation.findOne({
                            where: {
                              episode_id: createdEpisode.id,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                            },
                          });
                          if (!findEpisodeTranslation) {
                            await model.episodeTranslation.create(episodeTranslationData);
                            actionDate = episodeTranslationData.created_at;
                          }
                        }
                        // Other language data for the same season number
                        let parsedOtherLanEpisodeData = "";
                        const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                          where: {
                            season_no: seasonDetails.number,
                            request_id: anotherRequestId,
                          },
                        });
                        if (findSeasonReqId) {
                          const findOtherLanEpisodeDetails =
                            await model.titleRequestEpisodeDetails.findOne({
                              where: {
                                request_id: anotherRequestId,
                                request_season_id: findSeasonReqId.id,
                                status: "active",
                              },
                            });
                          if (findOtherLanEpisodeDetails) {
                            parsedOtherLanEpisodeData =
                              findOtherLanEpisodeDetails.episode_details != null
                                ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                : null;
                            if (
                              parsedOtherLanEpisodeData != null &&
                              parsedOtherLanEpisodeData != ""
                            ) {
                              for (const value of parsedOtherLanEpisodeData.list) {
                                if (
                                  value.episode_number == episodeValue.episode_number &&
                                  value.name
                                ) {
                                  const episodeTranslationData = {
                                    episode_id: createdEpisode.id,
                                    name: value.name,
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
                        }
                      }
                      // create poster image of eposides form data
                      if (episodeValue.poster != null && episodeValue.poster != "") {
                        const fileName = episodeValue.poster
                          ? episodeValue.poster.substring(episodeValue.poster.lastIndexOf("/") + 1)
                          : null;
                        await model.titleImage.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              status: "active",
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                              image_category: "poster_image",
                              episode_id: createdEpisode.id ? createdEpisode.id : null,
                            },
                          },
                        );

                        const getLastOrder = await model.titleImage.max("list_order", {
                          where: {
                            title_id: newTitle.id,
                            image_category: "poster_image",
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        });
                        const posterImageData = {
                          file_name: fileName,
                          path: episodeValue.poster ? episodeValue.poster : null,
                          title_id: newTitle.id,
                          season_id: seasonDetails.id
                            ? seasonDetails.id
                            : foundEpisodeData.season_id,
                          episode_id: createdEpisode.id ? createdEpisode.id : null,
                          list_order: getLastOrder ? getLastOrder + 1 : 1,
                          image_category: "poster_image",
                          is_main_poster: "y",
                          site_language: episodeValue.site_language
                            ? episodeValue.site_language
                            : titleData.site_language,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const getTitleSeasonEpisodeImage = await model.titleImage.findOne({
                          where: {
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.season_id,
                            image_category: "poster_image",
                            path: episodeValue.poster ? episodeValue.poster : null,
                            episode_id: createdEpisode.id ? createdEpisode.id : null,
                          },
                        });
                        if (getTitleSeasonEpisodeImage) {
                          await model.titleImage.update(
                            {
                              updated_at: (actionDate =
                                await customDateTimeHelper.getCurrentDateTime()),
                              updated_by: userId,
                              status: "active",
                            },
                            {
                              where: {
                                id: getTitleSeasonEpisodeImage.id,
                                title_id: newTitle.id,
                              },
                            },
                          );
                        } else {
                          await model.titleImage.create(posterImageData);
                          actionDate = posterImageData.created_at;
                        }
                      }
                    }
                  }
                } else {
                  const getTitleSeasonEpisode = await model.episode.findAll({
                    where: {
                      title_id: newTitle.id,
                      season_id: foundEpisodeData.dataValues.season_id,
                      status: "active",
                    },
                  });
                  if (getTitleSeasonEpisode && getTitleSeasonEpisode.length > 0) {
                    await model.episode.update(
                      {
                        updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                        updated_by: userId,
                        status: "deleted",
                      },
                      {
                        where: {
                          status: "active",
                          title_id: newTitle.id,
                          season_id: foundEpisodeData.dataValues.season_id,
                        },
                      },
                    );
                  }
                }
              } else if (!foundEpisodeData.dataValues.season_id && newSeasonAdded.length > 0) {
                for (const seasonValue of newSeasonAdded) {
                  if (
                    foundEpisodeData.dataValues.request_season_id ==
                    seasonValue.equivalent_season_id
                  ) {
                    const seasonId = seasonValue.new_season_id;
                    const seasonDetails = await model.season.findOne({
                      where: {
                        id: seasonId,
                        status: "active",
                        title_id: newTitle.id,
                      },
                    });
                    const parsedEpisodeData =
                      foundEpisodeData.dataValues.episode_details != null
                        ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                        : null;

                    if (parsedEpisodeData != null && seasonDetails) {
                      await model.episode.update(
                        {
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "deleted",
                        },
                        {
                          where: {
                            status: "active",
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.dataValues.season_id,
                          },
                        },
                      );
                      for (const episodeValue of parsedEpisodeData.list) {
                        if (episodeValue) {
                          let createdEpisode = null;
                          if (episodeValue.id) {
                            const episodeUpData = {
                              name: episodeValue.name,
                              url: episodeValue.url ? episodeValue.url : null,
                              poster: episodeValue.poster ? episodeValue.poster : null,
                              release_date: episodeValue.release_date
                                ? episodeValue.release_date
                                : null,
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
                              season_number: seasonDetails.number ? seasonDetails.number : 1,
                              episode_number: episodeValue.episode_number
                                ? episodeValue.episode_number
                                : 1,
                              tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                              rating_percent: episodeValue.rating_percent
                                ? episodeValue.rating_percent
                                : null,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                            };
                            const getTitleSeasonEpisode = await model.episode.findOne({
                              where: {
                                id: episodeValue.id,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.dataValues.season_id,
                              },
                            });
                            episodeUpData.status = "active";
                            episodeUpData.updated_at =
                              await customDateTimeHelper.getCurrentDateTime();
                            episodeUpData.updated_by = userId;
                            if (getTitleSeasonEpisode) {
                              await model.episode.update(episodeUpData, {
                                where: {
                                  id: getTitleSeasonEpisode.id,
                                  title_id: newTitle.id,
                                },
                              });
                              actionDate = episodeUpData.updated_at;

                              // episodeTranslationData
                              const episodeTranslationData = {
                                episode_id: getTitleSeasonEpisode.id,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                name: episodeValue.name,
                                url: episodeValue.url ? episodeValue.url : null,
                              };

                              const findEpisodeTranslation = await model.episodeTranslation.findOne(
                                {
                                  where: {
                                    episode_id: getTitleSeasonEpisode.id,
                                    site_language: episodeValue.site_language
                                      ? episodeValue.site_language
                                      : titleData.site_language,
                                  },
                                },
                              );
                              if (findEpisodeTranslation) {
                                episodeTranslationData.status = "active";
                                episodeTranslationData.updated_at =
                                  await customDateTimeHelper.getCurrentDateTime();
                                episodeTranslationData.updated_by = userId;
                                await model.episodeTranslation.update(episodeTranslationData, {
                                  where: {
                                    episode_id: getTitleSeasonEpisode.id,
                                    site_language: episodeValue.site_language
                                      ? episodeValue.site_language
                                      : titleData.site_language,
                                  },
                                });
                                actionDate = episodeTranslationData.updated_at;
                              } else {
                                episodeTranslationData.status = "active";
                                episodeTranslationData.created_at =
                                  await customDateTimeHelper.getCurrentDateTime();
                                episodeTranslationData.created_by = userId;
                                await model.episodeTranslation.create(episodeTranslationData);
                                actionDate = episodeTranslationData.created_at;
                              }
                            }
                            createdEpisode = await model.episode.findOne({
                              where: {
                                id: episodeValue.id,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.dataValues.season_id,
                              },
                            });
                          } else {
                            const episodeData = {
                              name: episodeValue.name,
                              url: episodeValue.url ? episodeValue.url : null,
                              poster: episodeValue.poster ? episodeValue.poster : null,
                              release_date: episodeValue.release_date
                                ? episodeValue.release_date
                                : null,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                              season_number: seasonDetails.number ? seasonDetails.number : 1,
                              episode_number: episodeValue.episode_number
                                ? episodeValue.episode_number
                                : 1,
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
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              created_by: userId,
                            };
                            createdEpisode = await model.episode.create(episodeData);
                            actionDate = episodeData.created_at;

                            // Create Episode translation:
                            if (createdEpisode.id) {
                              const episodeTranslationData = {
                                episode_id: createdEpisode.id,
                                name: episodeValue.name,
                                url: episodeValue.url ? episodeValue.url : null,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                created_at: await customDateTimeHelper.getCurrentDateTime(),
                                created_by: userId,
                              };
                              const findEpisodeTranslation = await model.episodeTranslation.findOne(
                                {
                                  where: {
                                    episode_id: createdEpisode.id,
                                    site_language: episodeValue.site_language
                                      ? episodeValue.site_language
                                      : titleData.site_language,
                                  },
                                },
                              );
                              if (!findEpisodeTranslation) {
                                await model.episodeTranslation.create(episodeTranslationData);
                                actionDate = episodeTranslationData.created_at;
                              }
                            }
                            // Other language data for the same season number
                            let parsedOtherLanEpisodeData = "";
                            const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                              where: {
                                season_no: seasonDetails.number,
                                request_id: anotherRequestId,
                              },
                            });
                            if (findSeasonReqId) {
                              const findOtherLanEpisodeDetails =
                                await model.titleRequestEpisodeDetails.findOne({
                                  where: {
                                    request_id: anotherRequestId,
                                    request_season_id: findSeasonReqId.id,
                                    status: "active",
                                  },
                                });
                              if (findOtherLanEpisodeDetails) {
                                parsedOtherLanEpisodeData =
                                  findOtherLanEpisodeDetails.episode_details != null
                                    ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                    : null;
                                if (
                                  parsedOtherLanEpisodeData != null &&
                                  parsedOtherLanEpisodeData != ""
                                ) {
                                  for (const value of parsedOtherLanEpisodeData.list) {
                                    if (
                                      value.episode_number == episodeValue.episode_number &&
                                      value.name
                                    ) {
                                      const episodeTranslationData = {
                                        episode_id: createdEpisode.id,
                                        name: value.name,
                                        url: value.url ? value.url : null,
                                        site_language: value.site_language
                                          ? value.site_language
                                          : "en",
                                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                                        created_by: userId,
                                      };
                                      await model.episodeTranslation.create(episodeTranslationData);
                                      actionDate = episodeTranslationData.created_at;
                                    }
                                  }
                                }
                              }
                            }
                          }
                          // create poster image of eposides form data
                          if (episodeValue.poster != null && episodeValue.poster != "") {
                            const fileName = episodeValue.poster
                              ? episodeValue.poster.substring(
                                  episodeValue.poster.lastIndexOf("/") + 1,
                                )
                              : null;
                            await model.titleImage.update(
                              {
                                updated_at: (actionDate =
                                  await customDateTimeHelper.getCurrentDateTime()),
                                updated_by: userId,
                                status: "deleted",
                              },
                              {
                                where: {
                                  status: "active",
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.dataValues.season_id,
                                  image_category: "poster_image",
                                  episode_id: createdEpisode.id ? createdEpisode.id : null,
                                },
                              },
                            );

                            const getLastOrder = await model.titleImage.max("list_order", {
                              where: {
                                title_id: newTitle.id,
                                image_category: "poster_image",
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.dataValues.season_id,
                              },
                            });
                            const posterImageData = {
                              file_name: fileName,
                              path: episodeValue.poster ? episodeValue.poster : null,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                              episode_id: createdEpisode.id ? createdEpisode.id : null,
                              list_order: getLastOrder ? getLastOrder + 1 : 1,
                              image_category: "poster_image",
                              is_main_poster: "y",
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            const getTitleSeasonEpisodeImage = await model.titleImage.findOne({
                              where: {
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.season_id,
                                image_category: "poster_image",
                                path: episodeValue.poster ? episodeValue.poster : null,
                                episode_id: createdEpisode.id ? createdEpisode.id : null,
                              },
                            });
                            if (getTitleSeasonEpisodeImage) {
                              await model.titleImage.update(
                                {
                                  updated_at: (actionDate =
                                    await customDateTimeHelper.getCurrentDateTime()),
                                  updated_by: userId,
                                  status: "active",
                                },
                                {
                                  where: {
                                    id: getTitleSeasonEpisodeImage.id,
                                    title_id: newTitle.id,
                                  },
                                },
                              );
                            } else {
                              await model.titleImage.create(posterImageData);
                              actionDate = posterImageData.created_at;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        // Episode other request ID:
        if (anotherRequestId) {
          const anotherRequestEpisodeDetails = await model.titleRequestEpisodeDetails.findAll({
            where: {
              request_id: anotherRequestId,
              status: "active",
            },
          });
          if (anotherRequestEpisodeDetails && anotherRequestEpisodeDetails.length > 0) {
            for (const foundEpisodeData of anotherRequestEpisodeDetails) {
              if (foundEpisodeData && foundEpisodeData.dataValues) {
                if (foundEpisodeData.dataValues.season_id) {
                  const seasonId = foundEpisodeData.dataValues.season_id;
                  const seasonDetails = await model.season.findOne({
                    where: {
                      id: seasonId,
                      status: "active",
                      title_id: newTitle.id,
                    },
                  });
                  const parsedEpisodeData =
                    foundEpisodeData.dataValues.episode_details != null
                      ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                      : null;

                  if (parsedEpisodeData != null && seasonDetails) {
                    for (const episodeValue of parsedEpisodeData.list) {
                      if (episodeValue) {
                        let createdEpisode = null;
                        if (episodeValue.id) {
                          const episodeUpData = {
                            name: episodeValue.name,
                            episode_number: episodeValue.episode_number
                              ? episodeValue.episode_number
                              : 1,
                            url: episodeValue.url ? episodeValue.url : null,
                            poster: episodeValue.poster ? episodeValue.poster : null,
                            release_date: episodeValue.release_date
                              ? episodeValue.release_date
                              : null,
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
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                          };
                          const getTitleSeasonEpisode = await model.episode.findOne({
                            where: {
                              id: episodeValue.id,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                            },
                          });
                          episodeUpData.status = "active";
                          episodeUpData.updated_at =
                            await customDateTimeHelper.getCurrentDateTime();
                          episodeUpData.updated_by = userId;
                          if (getTitleSeasonEpisode) {
                            await model.episode.update(episodeUpData, {
                              where: {
                                id: getTitleSeasonEpisode.id,
                                title_id: newTitle.id,
                              },
                            });
                            actionDate = episodeUpData.updated_at;

                            // episodeTranslationData
                            let episodeTranslationData = {
                              episode_id: getTitleSeasonEpisode.id,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              name: episodeValue.name,
                              url: episodeValue.url ? episodeValue.url : null,
                            };

                            const findEpisodeTranslation = await model.episodeTranslation.findOne({
                              where: {
                                episode_id: getTitleSeasonEpisode.id,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                              },
                            });
                            if (findEpisodeTranslation) {
                              episodeTranslationData.status = "active";
                              episodeTranslationData.updated_at =
                                await customDateTimeHelper.getCurrentDateTime();
                              episodeTranslationData.updated_by = userId;
                              await model.episodeTranslation.update(episodeTranslationData, {
                                where: {
                                  episode_id: getTitleSeasonEpisode.id,
                                  site_language: episodeValue.site_language
                                    ? episodeValue.site_language
                                    : titleData.site_language,
                                },
                              });
                              actionDate = episodeTranslationData.updated_at;
                            } else {
                              episodeTranslationData.status = "active";
                              episodeTranslationData.created_at =
                                await customDateTimeHelper.getCurrentDateTime();
                              episodeTranslationData.created_by = userId;
                              await model.episodeTranslation.create(episodeTranslationData);
                              actionDate = episodeTranslationData.created_at;
                            }
                          }
                          createdEpisode = await model.episode.findOne({
                            where: {
                              id: episodeValue.id,
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                            },
                          });
                        } else {
                          const episodeData = {
                            name: episodeValue.name,
                            url: episodeValue.url ? episodeValue.url : null,
                            poster: episodeValue.poster ? episodeValue.poster : null,
                            release_date: episodeValue.release_date
                              ? episodeValue.release_date
                              : null,
                            title_id: newTitle.id,
                            season_id: seasonDetails.id
                              ? seasonDetails.id
                              : foundEpisodeData.season_id,
                            season_number: seasonDetails.number,
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
                            site_language: episodeValue.site_language
                              ? episodeValue.site_language
                              : titleData.site_language,
                            created_by: userId,
                          };
                          const findEpisodeData = await model.episode.findOne({
                            where: {
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.season_id,
                              episode_number: episodeValue.episode_number,
                              status: "active",
                            },
                          });
                          let episodeId = 0;
                          if (findEpisodeData) {
                            episodeId = findEpisodeData.id;
                          } else {
                            createdEpisode = await model.episode.create(episodeData);
                            episodeId = createdEpisode.id;
                            actionDate = episodeData.created_at;
                          }
                          // Create Episode translation:
                          if (episodeId) {
                            const episodeTranslationData = {
                              episode_id: episodeId,
                              name: episodeValue.name,
                              url: episodeValue.url ? episodeValue.url : null,
                              site_language: episodeValue.site_language
                                ? episodeValue.site_language
                                : titleData.site_language,
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                              created_by: userId,
                            };
                            const findEpisodeTranslation = await model.episodeTranslation.findOne({
                              where: {
                                episode_id: episodeId,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                              },
                            });
                            if (!findEpisodeTranslation) {
                              await model.episodeTranslation.create(episodeTranslationData);
                              actionDate = episodeTranslationData.created_at;
                            }
                          }
                          // Other language data for the same season number
                          let parsedOtherLanEpisodeData = "";
                          const findSeasonReqId = await model.titleRequestSeasonDetails.findOne({
                            where: {
                              season_no: seasonDetails.number,
                              request_id: anotherRequestId,
                            },
                          });
                          if (findSeasonReqId && episodeId) {
                            const findOtherLanEpisodeDetails =
                              await model.titleRequestEpisodeDetails.findOne({
                                where: {
                                  request_id: anotherRequestId,
                                  request_season_id: findSeasonReqId.id,
                                  status: "active",
                                },
                              });
                            if (findOtherLanEpisodeDetails) {
                              parsedOtherLanEpisodeData =
                                findOtherLanEpisodeDetails.episode_details != null
                                  ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                  : null;
                              if (
                                parsedOtherLanEpisodeData != null &&
                                parsedOtherLanEpisodeData != ""
                              ) {
                                for (const value of parsedOtherLanEpisodeData.list) {
                                  if (
                                    value.episode_number == episodeValue.episode_number &&
                                    value.name
                                  ) {
                                    const episodeTranslationData = {
                                      episode_id: episodeId,
                                      name: value.name,
                                      url: value.url ? value.url : null,
                                      site_language: value.site_language
                                        ? value.site_language
                                        : "en",
                                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                                      created_by: userId,
                                    };
                                    await model.episodeTranslation.create(episodeTranslationData);
                                    actionDate = episodeTranslationData.created_at;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                } else if (!foundEpisodeData.dataValues.season_id && newSeasonAdded.length > 0) {
                  for (const seasonValue of newSeasonAdded) {
                    if (
                      foundEpisodeData.dataValues.request_season_id == seasonValue.draft_season_id
                    ) {
                      const seasonId = seasonValue.new_season_id;
                      const seasonDetails = await model.season.findOne({
                        where: {
                          id: seasonId,
                          status: "active",
                          title_id: newTitle.id,
                        },
                      });
                      const parsedEpisodeData =
                        foundEpisodeData.dataValues.episode_details != null
                          ? JSON.parse(foundEpisodeData.dataValues.episode_details)
                          : null;

                      if (parsedEpisodeData != null && seasonDetails) {
                        await model.episode.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "deleted",
                          },
                          {
                            where: {
                              status: "active",
                              title_id: newTitle.id,
                              season_id: seasonDetails.id
                                ? seasonDetails.id
                                : foundEpisodeData.dataValues.season_id,
                            },
                          },
                        );
                        for (const episodeValue of parsedEpisodeData.list) {
                          if (episodeValue) {
                            let createdEpisode = null;
                            if (episodeValue.id) {
                              const episodeUpData = {
                                name: episodeValue.name,
                                url: episodeValue.url ? episodeValue.url : null,
                                poster: episodeValue.poster ? episodeValue.poster : null,
                                release_date: episodeValue.release_date
                                  ? episodeValue.release_date
                                  : null,
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
                                popularity: episodeValue.popularity
                                  ? episodeValue.popularity
                                  : null,
                                season_number: seasonDetails.number ? seasonDetails.number : 1,
                                episode_number: episodeValue.episode_number
                                  ? episodeValue.episode_number
                                  : 1,
                                tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                                rating_percent: episodeValue.rating_percent
                                  ? episodeValue.rating_percent
                                  : null,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.season_id,
                              };
                              const getTitleSeasonEpisode = await model.episode.findOne({
                                where: {
                                  id: episodeValue.id,
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.dataValues.season_id,
                                },
                              });
                              episodeUpData.status = "active";
                              episodeUpData.updated_at =
                                await customDateTimeHelper.getCurrentDateTime();
                              episodeUpData.updated_by = userId;
                              if (getTitleSeasonEpisode) {
                                await model.episode.update(episodeUpData, {
                                  where: {
                                    id: getTitleSeasonEpisode.id,
                                    title_id: newTitle.id,
                                  },
                                });
                                actionDate = episodeUpData.updated_at;

                                // episodeTranslationData
                                const episodeTranslationData = {
                                  episode_id: getTitleSeasonEpisode.id,
                                  site_language: episodeValue.site_language
                                    ? episodeValue.site_language
                                    : titleData.site_language,
                                  name: episodeValue.name,
                                  url: episodeValue.url ? episodeValue.url : null,
                                };

                                const findEpisodeTranslation =
                                  await model.episodeTranslation.findOne({
                                    where: {
                                      episode_id: getTitleSeasonEpisode.id,
                                      site_language: episodeValue.site_language
                                        ? episodeValue.site_language
                                        : titleData.site_language,
                                    },
                                  });
                                if (findEpisodeTranslation) {
                                  episodeTranslationData.status = "active";
                                  episodeTranslationData.updated_at =
                                    await customDateTimeHelper.getCurrentDateTime();
                                  episodeTranslationData.updated_by = userId;
                                  await model.episodeTranslation.update(episodeTranslationData, {
                                    where: {
                                      episode_id: getTitleSeasonEpisode.id,
                                      site_language: episodeValue.site_language
                                        ? episodeValue.site_language
                                        : titleData.site_language,
                                    },
                                  });
                                  actionDate = episodeTranslationData.updated_at;
                                } else {
                                  episodeTranslationData.status = "active";
                                  episodeTranslationData.created_at =
                                    await customDateTimeHelper.getCurrentDateTime();
                                  episodeTranslationData.created_by = userId;
                                  await model.episodeTranslation.create(episodeTranslationData);
                                  actionDate = episodeTranslationData.created_at;
                                }
                              }
                              createdEpisode = await model.episode.findOne({
                                where: {
                                  id: episodeValue.id,
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.dataValues.season_id,
                                },
                              });
                            } else {
                              const episodeData = {
                                name: episodeValue.name,
                                url: episodeValue.url ? episodeValue.url : null,
                                poster: episodeValue.poster ? episodeValue.poster : null,
                                release_date: episodeValue.release_date
                                  ? episodeValue.release_date
                                  : null,
                                title_id: newTitle.id,
                                season_id: seasonDetails.id
                                  ? seasonDetails.id
                                  : foundEpisodeData.season_id,
                                season_number: seasonDetails.number ? seasonDetails.number : 1,
                                episode_number: episodeValue.episode_number
                                  ? episodeValue.episode_number
                                  : 1,
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
                                popularity: episodeValue.popularity
                                  ? episodeValue.popularity
                                  : null,
                                tmdb_id: episodeValue.tmdb_id ? episodeValue.tmdb_id : null,
                                rating_percent: episodeValue.rating_percent
                                  ? episodeValue.rating_percent
                                  : null,
                                site_language: episodeValue.site_language
                                  ? episodeValue.site_language
                                  : titleData.site_language,
                                created_by: userId,
                              };
                              const findEpisodeData = await model.episode.findOne({
                                where: {
                                  title_id: newTitle.id,
                                  season_id: seasonDetails.id
                                    ? seasonDetails.id
                                    : foundEpisodeData.season_id,
                                  episode_number: episodeValue.episode_number,
                                  status: "active",
                                },
                              });
                              let episodeId = 0;
                              if (findEpisodeData) {
                                episodeId = findEpisodeData.id;
                              } else {
                                createdEpisode = await model.episode.create(episodeData);
                                episodeId = createdEpisode.id;
                                actionDate = episodeData.created_at;
                              }
                              // Create Episode translation:
                              if (episodeId) {
                                const episodeTranslationData = {
                                  episode_id: episodeId,
                                  name: episodeValue.name,
                                  url: episodeValue.url ? episodeValue.url : null,
                                  site_language: episodeValue.site_language
                                    ? episodeValue.site_language
                                    : titleData.site_language,
                                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                                  created_by: userId,
                                };
                                const findEpisodeTranslation =
                                  await model.episodeTranslation.findOne({
                                    where: {
                                      episode_id: episodeId,
                                      site_language: episodeValue.site_language
                                        ? episodeValue.site_language
                                        : titleData.site_language,
                                    },
                                  });
                                if (!findEpisodeTranslation) {
                                  await model.episodeTranslation.create(episodeTranslationData);
                                  actionDate = episodeTranslationData.created_at;
                                }
                              }
                              // Other language data for the same season number
                              let parsedOtherLanEpisodeData = "";
                              const findSeasonReqId = await model.titleRequestSeasonDetails.findOne(
                                {
                                  where: {
                                    season_no: seasonDetails.number,
                                    request_id: anotherRequestId,
                                  },
                                },
                              );
                              if (findSeasonReqId && episodeId) {
                                const findOtherLanEpisodeDetails =
                                  await model.titleRequestEpisodeDetails.findOne({
                                    where: {
                                      request_id: anotherRequestId,
                                      request_season_id: findSeasonReqId.id,
                                      status: "active",
                                    },
                                  });
                                if (findOtherLanEpisodeDetails) {
                                  parsedOtherLanEpisodeData =
                                    findOtherLanEpisodeDetails.episode_details != null
                                      ? JSON.parse(findOtherLanEpisodeDetails.episode_details)
                                      : null;
                                  if (
                                    parsedOtherLanEpisodeData != null &&
                                    parsedOtherLanEpisodeData != ""
                                  ) {
                                    for (const value of parsedOtherLanEpisodeData.list) {
                                      if (
                                        value.episode_number == episodeValue.episode_number &&
                                        value.name
                                      ) {
                                        const episodeTranslationData = {
                                          episode_id: episodeId,
                                          name: value.name,
                                          url: value.url ? value.url : null,
                                          site_language: value.site_language
                                            ? value.site_language
                                            : "en",
                                          created_at:
                                            await customDateTimeHelper.getCurrentDateTime(),
                                          created_by: userId,
                                        };
                                        await model.episodeTranslation.create(
                                          episodeTranslationData,
                                        );
                                        actionDate = episodeTranslationData.created_at;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Media Details with respect to season
        // storing the media details ::
        if (foundMediaData && foundMediaData.length > 0) {
          for (const titleMediaData of foundMediaData) {
            let seasonId = "";
            let parsedVideoDetails = "";
            let parsedImageDetails = "";
            let parsedPosterDetails = "";
            let parsedBackgroundImageDetails = "";
            let seasonDetails = {};
            if (titleMediaData.season_id) {
              seasonId = titleMediaData.season_id;
              seasonDetails = await model.season.findOne({
                where: {
                  id: seasonId,
                  status: "active",
                  title_id: newTitle.id,
                },
              });
              parsedVideoDetails =
                titleMediaData.video_details != null
                  ? JSON.parse(titleMediaData.video_details)
                  : null;
              parsedImageDetails =
                titleMediaData.image_details != null
                  ? JSON.parse(titleMediaData.image_details)
                  : null;
              parsedPosterDetails =
                titleMediaData.poster_image_details != null
                  ? JSON.parse(titleMediaData.poster_image_details)
                  : null;
              parsedBackgroundImageDetails =
                titleMediaData.background_image_details != null
                  ? JSON.parse(titleMediaData.background_image_details)
                  : null;
            } else if (!titleMediaData.season_id && newSeasonAdded.length > 0) {
              for (const seasonValue of newSeasonAdded) {
                if (titleMediaData.request_season_id == seasonValue.draft_season_id) {
                  seasonId = seasonValue.new_season_id;
                  seasonDetails = await model.season.findOne({
                    where: {
                      id: seasonId,
                      status: "active",
                      title_id: newTitle.id,
                    },
                  });
                  parsedVideoDetails =
                    titleMediaData.video_details != null
                      ? JSON.parse(titleMediaData.video_details)
                      : null;
                  parsedImageDetails =
                    titleMediaData.image_details != null
                      ? JSON.parse(titleMediaData.image_details)
                      : null;
                  parsedPosterDetails =
                    titleMediaData.poster_image_details != null
                      ? JSON.parse(titleMediaData.poster_image_details)
                      : null;
                  parsedBackgroundImageDetails =
                    titleMediaData.background_image_details != null
                      ? JSON.parse(titleMediaData.background_image_details)
                      : null;
                }
              }
            }

            const getLastOrder = await model.titleImage.max("list_order", {
              where: {
                title_id: newTitle.id,
                season_id: seasonId,
              },
            });
            if (seasonDetails && Object.keys(seasonDetails).length > 0) {
              if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
                await model.video.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season: seasonId,
                      video_for: "title",
                    },
                  },
                );
                isVideoModified = true;
                const getVideoLastOrder = await model.video.max("list_order", {
                  where: {
                    title_id: newTitle.id,
                    season: seasonId,
                    video_for: "title",
                  },
                });

                for (const value of parsedVideoDetails.list) {
                  const videoData = {
                    name: value.name,
                    thumbnail: value.thumbnail ? value.thumbnail : null,
                    url: value.url ? value.url : null,
                    type: value.type,
                    quality: value.quality ? value.quality : null,
                    title_id: newTitle.id,
                    season: seasonId,
                    episode: value.episode ? value.episode : null,
                    source: value.source ? value.source : "local",
                    negative_votes: value.negative_votes ? value.negative_votes : 0,
                    positive_votes: value.positive_votes ? value.positive_votes : 0,
                    reports: value.reports ? value.reports : 0,
                    approved: value.approved ? value.approved : 1,
                    list_order: getVideoLastOrder ? getVideoLastOrder + 1 : 1,
                    user_id: userId,
                    category: value.category ? value.category : "trailer",
                    is_official_trailer: value.is_official_trailer
                      ? value.is_official_trailer
                      : "n",
                    site_language: value.site_language ? value.site_language : "en",
                    video_source: value.url
                      ? await generalHelper.checkUrlSource(value.url)
                      : "youtube",
                    video_for: "title",
                    no_of_view: value.no_of_view ? value.no_of_view : 0,
                    video_duration: value.video_duration ? value.video_duration : null,
                  };
                  if (value.id) {
                    const getTitleSeasonVideo = await model.video.findOne({
                      where: {
                        id: value.id,
                        title_id: newTitle.id,
                        season: seasonId,
                        video_for: "title",
                      },
                    });
                    if (getTitleSeasonVideo) {
                      await model.video.update(
                        {
                          thumbnail: value.thumbnail ? value.thumbnail : null,
                          no_of_view: value.no_of_view ? value.no_of_view : 0,
                          video_duration: value.video_duration ? value.video_duration : null,
                          is_official_trailer: value.is_official_trailer
                            ? value.is_official_trailer
                            : "n",
                          updated_at: (actionDate =
                            await customDateTimeHelper.getCurrentDateTime()),
                          updated_by: userId,
                          status: "active",
                        },
                        {
                          where: {
                            id: getTitleSeasonVideo.id,
                            title_id: newTitle.id,
                            season: seasonId,
                            video_for: "title",
                          },
                        },
                      );
                      isVideoModified = true;
                    }
                  } else {
                    videoData.ele_no_of_view = 0;
                    videoData.created_at = await customDateTimeHelper.getCurrentDateTime();
                    videoData.created_by = userId;
                    await model.video.create(videoData);
                    actionDate = videoData.created_at;
                    isVideoModified = true;
                  }
                }
              } else {
                const getTitleSeasonVideo = await model.video.findAll({
                  where: {
                    title_id: newTitle.id,
                    season: seasonDetails.id,
                    status: "active",
                    video_for: "title",
                  },
                });
                if (getTitleSeasonVideo && getTitleSeasonVideo.length > 0) {
                  await model.video.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season: seasonId,
                        video_for: "title",
                      },
                    },
                  );
                  isVideoModified = true;
                }
              }
              // Image
              if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
                await model.titleImage.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season_id: seasonDetails.id,
                      image_category: "image",
                      episode_id: null,
                    },
                  },
                );
                for (const value of parsedImageDetails.list) {
                  if (value) {
                    const imageData = {
                      original_name: value.original_name ? value.original_name : null,
                      file_name: value.file_name ? value.file_name : null,
                      url: value.url ? value.url : null,
                      path: value.path ? value.path : null,
                      file_size: value.file_size ? value.file_size : null,
                      mime_type: value.mime_type ? value.mime_type : null,
                      file_extension: value.file_extension ? value.file_extension : null,
                      title_id: newTitle.id,
                      season_id: seasonDetails.id,
                      episode_id: value.episode_id ? value.episode_id : null,
                      source: value.source ? value.source : "local",
                      approved: value.approved ? value.approved : 1,
                      list_order: getLastOrder ? getLastOrder + 1 : 1,
                      image_category: value.image_category ? value.image_category : "image",
                      is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                      site_language: value.site_language ? value.site_language : "en",
                    };
                    if (value.id) {
                      const getTitleImage = await model.titleImage.findOne({
                        where: {
                          id: value.id,
                          title_id: newTitle.id,
                          season_id: seasonId,
                          image_category: "image",
                        },
                      });
                      if (getTitleImage) {
                        await model.titleImage.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "active",
                          },
                          {
                            where: {
                              id: getTitleImage.id,
                              title_id: newTitle.id,
                              season_id: seasonId,
                            },
                          },
                        );
                      }
                    } else {
                      imageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                      imageData.created_by = userId;
                      await model.titleImage.create(imageData);
                      actionDate = imageData.created_at;
                    }
                  }
                }
              } else {
                const getTitleImage = await model.titleImage.findAll({
                  where: {
                    title_id: newTitle.id,
                    season_id: seasonId,
                    image_category: "image",
                  },
                });
                if (getTitleImage && getTitleImage.length > 0) {
                  await model.titleImage.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonId,
                        image_category: "image",
                        episode_id: null,
                      },
                    },
                  );
                }
              }
              // poster image
              if (parsedPosterDetails != null && parsedPosterDetails.list.length > 0) {
                await model.titleImage.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season_id: seasonId,
                      image_category: "poster_image",
                      episode_id: null,
                    },
                  },
                );
                for (const posterValue of parsedPosterDetails.list) {
                  if (posterValue) {
                    const posterImageData = {
                      original_name: posterValue.original_name ? posterValue.original_name : null,
                      file_name: posterValue.file_name ? posterValue.file_name : null,
                      url: posterValue.url ? posterValue.url : null,
                      path: posterValue.path ? posterValue.path : null,
                      file_size: posterValue.file_size ? posterValue.file_size : null,
                      mime_type: posterValue.mime_type ? posterValue.mime_type : null,
                      file_extension: posterValue.file_extension
                        ? posterValue.file_extension
                        : null,
                      title_id: newTitle.id,
                      season_id: seasonId,
                      episode_id: posterValue.episode_id ? posterValue.episode_id : null,
                      source: posterValue.source ? posterValue.source : "local",
                      approved: posterValue.approved ? posterValue.approved : 1,
                      list_order: getLastOrder ? getLastOrder + 1 : 1,
                      image_category: posterValue.image_category
                        ? posterValue.image_category
                        : "poster_image",
                      is_main_poster: posterValue.is_main_poster
                        ? posterValue.is_main_poster
                        : null,
                      site_language: posterValue.site_language ? posterValue.site_language : "en",
                    };
                    if (posterValue.id) {
                      const getTitleSeasonImage = await model.titleImage.findOne({
                        where: {
                          id: posterValue.id,
                          title_id: newTitle.id,
                          season_id: seasonId,
                          image_category: "poster_image",
                        },
                      });
                      if (getTitleSeasonImage) {
                        await model.titleImage.update(
                          {
                            is_main_poster: posterValue.is_main_poster
                              ? posterValue.is_main_poster
                              : "n",
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "active",
                          },
                          {
                            where: {
                              id: getTitleSeasonImage.id,
                              title_id: newTitle.id,
                              season_id: seasonId,
                            },
                          },
                        );
                      }
                    } else {
                      posterImageData.created_at = await customDateTimeHelper.getCurrentDateTime();
                      posterImageData.created_by = userId;
                      await model.titleImage.create(posterImageData);
                      actionDate = posterImageData.created_at;
                    }
                  }
                }
              } else {
                const getTitleSeasonImage = await model.titleImage.findAll({
                  where: {
                    title_id: newTitle.id,
                    season_id: seasonId,
                    image_category: "poster_image",
                  },
                });
                if (getTitleSeasonImage && getTitleSeasonImage.length > 0) {
                  await model.titleImage.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonId,
                        image_category: "poster_image",
                        episode_id: null,
                      },
                    },
                  );
                }
              }
              // background image
              if (
                parsedBackgroundImageDetails != null &&
                parsedBackgroundImageDetails.list.length > 0
              ) {
                await model.titleImage.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      title_id: newTitle.id,
                      season_id: seasonId,
                      image_category: "bg_image",
                      episode_id: null,
                    },
                  },
                );
                for (const value of parsedBackgroundImageDetails.list) {
                  if (value) {
                    const backgroundImageData = {
                      original_name: value.original_name ? value.original_name : null,
                      file_name: value.file_name ? value.file_name : null,
                      url: value.url ? value.url : null,
                      path: value.path ? value.path : null,
                      file_size: value.file_size ? value.file_size : null,
                      mime_type: value.mime_type ? value.mime_type : null,
                      file_extension: value.file_extension ? value.file_extension : null,
                      title_id: newTitle.id,
                      season_id: seasonId,
                      episode_id: value.episode_id ? value.episode_id : null,
                      source: value.source ? value.source : "local",
                      approved: value.approved ? value.approved : 1,
                      list_order: getLastOrder ? getLastOrder + 1 : 1,
                      image_category: value.image_category ? value.image_category : "bg_image",
                      is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                      site_language: value.site_language ? value.site_language : "en",
                    };
                    if (value.id) {
                      const getTitleSeasonImage = await model.titleImage.findOne({
                        where: {
                          id: value.id,
                          title_id: newTitle.id,
                          season_id: seasonId,
                          image_category: "bg_image",
                        },
                      });
                      if (getTitleSeasonImage) {
                        await model.titleImage.update(
                          {
                            updated_at: (actionDate =
                              await customDateTimeHelper.getCurrentDateTime()),
                            updated_by: userId,
                            status: "active",
                          },
                          {
                            where: {
                              id: getTitleSeasonImage.id,
                              title_id: newTitle.id,
                              season_id: seasonId,
                            },
                          },
                        );
                      }
                    } else {
                      backgroundImageData.created_at =
                        await customDateTimeHelper.getCurrentDateTime();
                      backgroundImageData.created_by = userId;
                      await model.titleImage.create(backgroundImageData);
                      actionDate = backgroundImageData.created_at;
                    }
                  }
                }
              } else {
                const getTitleSeasonImage = await model.titleImage.findAll({
                  where: {
                    title_id: newTitle.id,
                    season_id: seasonId,
                    image_category: "bg_image",
                  },
                });
                if (getTitleSeasonImage && getTitleSeasonImage.length > 0) {
                  await model.titleImage.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        title_id: newTitle.id,
                        season_id: seasonId,
                        image_category: "bg_image",
                        episode_id: null,
                      },
                    },
                  );
                }
              }
            }
          }
        }

        // storing the credit data:
        let newCharacterArr = [];
        if (foundCreditData.length > 0) {
          for (const titleCreditData of foundCreditData) {
            let seasonId = "";
            let seasonDetails = {};
            let parsedCastDetails = "";
            let parsedCrewDetails = "";
            if (titleCreditData.season_id) {
              seasonId = titleCreditData.season_id;
              seasonDetails = await model.season.findOne({
                where: {
                  id: seasonId,
                  status: "active",
                  title_id: newTitle.id,
                },
              });
              parsedCastDetails =
                titleCreditData.cast_details != null
                  ? JSON.parse(titleCreditData.cast_details)
                  : null;
              parsedCrewDetails =
                titleCreditData.crew_details != null
                  ? JSON.parse(titleCreditData.crew_details)
                  : null;
            } else if (!titleCreditData.season_id && newSeasonAdded.length > 0) {
              for (const seasonValue of newSeasonAdded) {
                if (titleCreditData.request_season_id == seasonValue.draft_season_id) {
                  seasonId = seasonValue.new_season_id;
                  seasonDetails = await model.season.findOne({
                    where: {
                      id: seasonId,
                      status: "active",
                      title_id: newTitle.id,
                    },
                  });

                  parsedCastDetails =
                    titleCreditData.cast_details != null
                      ? JSON.parse(titleCreditData.cast_details)
                      : null;
                  parsedCrewDetails =
                    titleCreditData.crew_details != null
                      ? JSON.parse(titleCreditData.crew_details)
                      : null;
                }
              }
            }
            if (seasonDetails && Object.keys(seasonDetails).length > 0) {
              if (parsedCastDetails != null && parsedCastDetails.list.length > 0) {
                await model.creditable.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      creditable_id: newTitle.id,
                      season_id: seasonId,
                      department: "character",
                    },
                  },
                );
                for (const castData of parsedCastDetails.list) {
                  let peopleId = 0;
                  if (seasonId) {
                    const castDataDetails = {
                      people_id: peopleId,
                      creditable_id: newTitle.id,
                      character_name: castData.character_name ? castData.character_name : null,
                      list_order: castData.list_order,
                      department: castData.department ? castData.department : "character",
                      creditable_type: castData.creditable_type ? castData.creditable_type : null,
                      is_guest: castData.is_guest ? castData.is_guest : 0,
                      season_id: seasonId,
                      episode_id: castData.episode_id ? castData.episode_id : null,
                      site_language: castData.site_language ? castData.site_language : "en",
                    };
                    // Translation Object :
                    const characterTrans = {
                      character_name: castData.character_name ? castData.character_name : "",
                      description: castData.description ? castData.description : "",
                      character_image: castData.poster ? castData.poster : "",
                      site_language: castData.site_language ? castData.site_language : "en",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    if (castData.id) {
                      characterTrans.creditables_id = castData.id;
                      const getCastData = await model.creditable.findOne({
                        where: {
                          id: castData.id,
                          creditable_id: newTitle.id,
                          season_id: seasonId,
                          department: "character",
                        },
                      });
                      castDataDetails.status = "active";
                      castDataDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
                      castDataDetails.updated_by = userId;
                      if (getCastData) {
                        await model.creditable.update(castDataDetails, {
                          where: {
                            id: getCastData.id,
                            creditable_id: newTitle.id,
                            season_id: seasonId,
                          },
                        });
                        actionDate = castDataDetails.updated_at;

                        const checkFirstTranslation = await model.creditableTranslation.findOne({
                          where: {
                            creditables_id: getCastData.id,
                            site_language: castData.site_language,
                            status: "active",
                          },
                        });
                        if (checkFirstTranslation) {
                          await model.creditableTranslation.update(characterTrans, {
                            where: {
                              creditables_id: getCastData.id,
                              site_language: castData.site_language,
                              status: "active",
                            },
                          });
                          actionDate = characterTrans.updated_at;
                        } else {
                          await model.creditableTranslation.create(characterTrans);
                          actionDate = characterTrans.created_at;
                          // This is for mapping new character - another language. Since we dont have the common mapping we use the temp_id
                          const element = { ...characterTrans, temp_id: castData.temp_id };
                          newCharacterArr.push(element);
                        }
                      }
                    } else {
                      castDataDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
                      castDataDetails.created_by = userId;
                      const createCharater = await model.creditable.create(castDataDetails);
                      if (createCharater.id) {
                        actionDate = castDataDetails.created_at;
                        characterTrans.creditables_id = createCharater.id;
                        const checkFirstTranslation = await model.creditableTranslation.findOne({
                          where: {
                            creditables_id: createCharater.id,
                            character_name: castData.character_name,
                            site_language: castData.site_language,
                            status: "active",
                          },
                        });
                        if (!checkFirstTranslation) {
                          await model.creditableTranslation.create(characterTrans);
                          actionDate = characterTrans.created_at;
                          // This is for mapping new character - another language. Since we dont have the common mapping we use the temp_id
                          const element = { ...characterTrans, temp_id: castData.temp_id };
                          newCharacterArr.push(element);
                        }
                      }
                    }
                  }
                }
              } else {
                const getCastData = await model.creditable.findAll({
                  where: {
                    creditable_id: newTitle.id,
                    season_id: seasonId,
                    department: "character",
                    status: "active",
                  },
                });
                if (getCastData && getCastData.length > 0) {
                  await model.creditable.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        creditable_id: newTitle.id,
                        season_id: seasonId,
                        department: "character",
                      },
                    },
                  );
                }
              }
              if (parsedCrewDetails != null && parsedCrewDetails.list.length > 0) {
                let peopleCrewData = {};
                await model.creditable.update(
                  {
                    updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                    updated_by: userId,
                    status: "deleted",
                  },
                  {
                    where: {
                      status: "active",
                      creditable_id: newTitle.id,
                      season_id: seasonId,
                      department: "crew",
                    },
                  },
                );
                for (const crewData of parsedCrewDetails.list) {
                  let cpeopleId = 0;
                  if (
                    crewData &&
                    crewData.people_id === "" &&
                    (crewData.cast_name != null || crewData.cast_name != "") &&
                    crewData.season_id
                  ) {
                    const createCrew = {
                      poster: crewData.poster,
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    const createPeople = await model.people.create(createCrew);
                    if (createPeople.id) {
                      cpeopleId = createPeople.id;
                      payloadPeopleList.push({
                        record_id: cpeopleId,
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
                            people_id: cpeopleId,
                            site_language: crewData.site_language ? crewData.site_language : "en",
                          },
                        }))
                      ) {
                        await model.peopleTranslation.create(peopleCrewData);
                      }
                      // adding poster image details to the people image table
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
                          file_name: fileName,
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
                    cpeopleId = crewData.people_id ? crewData.people_id : "";
                  }
                  if (crewData.season_id && cpeopleId) {
                    const crewDataDetails = {
                      people_id: cpeopleId,
                      creditable_id: newTitle.id,
                      character_name: crewData.character_name ? crewData.character_name : null,
                      list_order: crewData.list_order,
                      department: crewData.department ? crewData.department : "crew",
                      job: crewData.job ? crewData.job : null,
                      creditable_type: crewData.creditable_type ? crewData.creditable_type : null,
                      is_guest: crewData.is_guest ? crewData.is_guest : 0,
                      season_id: seasonId,
                      episode_id: crewData.episode_id ? crewData.episode_id : null,
                      site_language: crewData.site_language ? crewData.site_language : "en",
                    };
                    // adding data to people job
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
                            people_id: cpeopleId,
                            job_id: peopleJobId,
                            status: "active",
                          },
                        });
                        // list order
                        const getLastOrder = await model.peopleJobs.max("list_order", {
                          where: {
                            people_id: cpeopleId,
                            status: "active",
                          },
                        });
                        if (!isPeopleJobExist) {
                          const data = {
                            people_id: cpeopleId,
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
                    if (crewData.id) {
                      const getCrewData = await model.creditable.findOne({
                        where: {
                          id: crewData.id,
                          creditable_id: newTitle.id,
                          season_id: seasonId,
                          department: "crew",
                        },
                      });
                      crewDataDetails.status = "active";
                      crewDataDetails.updated_at = await customDateTimeHelper.getCurrentDateTime();
                      crewDataDetails.updated_by = userId;
                      if (getCrewData) {
                        await model.creditable.update(crewDataDetails, {
                          where: {
                            id: getCrewData.id,
                            creditable_id: newTitle.id,
                            season_id: seasonId,
                          },
                        });
                        actionDate = crewDataDetails.updated_at;
                      }
                    } else {
                      crewDataDetails.created_at = await customDateTimeHelper.getCurrentDateTime();
                      crewDataDetails.created_by = userId;
                      await model.creditable.create(crewDataDetails);
                      actionDate = crewDataDetails.created_at;
                    }
                  }
                }
              } else {
                const getCrewData = await model.creditable.findAll({
                  where: {
                    creditable_id: newTitle.id,
                    season_id: seasonId,
                    department: "crew",
                  },
                });
                if (getCrewData && getCrewData.length > 0) {
                  await model.creditable.update(
                    {
                      updated_at: (actionDate = await customDateTimeHelper.getCurrentDateTime()),
                      updated_by: userId,
                      status: "deleted",
                    },
                    {
                      where: {
                        status: "active",
                        creditable_id: newTitle.id,
                        season_id: seasonId,
                        department: "crew",
                      },
                    },
                  );
                }
              }
            }
          }
        }

        // Credit other request ID:
        if (anotherRequestId) {
          const anotherRequestCreditDetails = await model.titleRequestCredit.findAll({
            where: {
              request_id: anotherRequestId,
              status: "active",
            },
          });
          if (anotherRequestCreditDetails.length > 0) {
            for (const titleCreditData of anotherRequestCreditDetails) {
              let seasonId = "";
              let seasonDetails = {};
              let parsedCastDetails = "";
              if (titleCreditData.season_id) {
                seasonId = titleCreditData.season_id;
                seasonDetails = await model.season.findOne({
                  where: {
                    id: seasonId,
                    status: "active",
                    title_id: newTitle.id,
                  },
                });
                parsedCastDetails =
                  titleCreditData.cast_details != null
                    ? JSON.parse(titleCreditData.cast_details)
                    : null;
              } else if (!titleCreditData.season_id && newSeasonAdded.length > 0) {
                for (const seasonValue of newSeasonAdded) {
                  if (titleCreditData.request_season_id == seasonValue.equivalent_season_id) {
                    seasonId = seasonValue.new_season_id;
                    seasonDetails = await model.season.findOne({
                      where: {
                        id: seasonId,
                        status: "active",
                        title_id: newTitle.id,
                      },
                    });

                    parsedCastDetails =
                      titleCreditData.cast_details != null
                        ? JSON.parse(titleCreditData.cast_details)
                        : null;
                  }
                }
              }
              if (seasonDetails && Object.keys(seasonDetails).length > 0) {
                if (parsedCastDetails != null && parsedCastDetails.list.length > 0) {
                  for (const castData of parsedCastDetails.list) {
                    if (seasonId) {
                      // Translation Object :
                      const characterTrans = {
                        character_name: castData.character_name ? castData.character_name : "",
                        description: castData.description ? castData.description : "",
                        character_image: castData.poster ? castData.poster : "",
                        site_language: castData.site_language ? castData.site_language : "en",
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      if (castData.id) {
                        characterTrans.creditables_id = castData.id;
                        const getCastData = await model.creditable.findOne({
                          where: {
                            id: castData.id,
                            creditable_id: newTitle.id,
                            season_id: seasonId,
                            department: "character",
                          },
                        });
                        if (getCastData) {
                          const checkFirstTranslation = await model.creditableTranslation.findOne({
                            where: {
                              creditables_id: getCastData.id,
                              site_language: castData.site_language,
                              status: "active",
                            },
                          });
                          if (checkFirstTranslation) {
                            await model.creditableTranslation.update(characterTrans, {
                              where: {
                                creditables_id: getCastData.id,
                                site_language: castData.site_language,
                                status: "active",
                              },
                            });
                            actionDate = characterTrans.updated_at;
                          } else {
                            await model.creditableTranslation.create(characterTrans);
                            actionDate = characterTrans.created_at;
                          }
                        }
                      } else {
                        // Translation Id will be already created in the previous req
                        const filteredObj =
                          newCharacterArr.length > 0
                            ? newCharacterArr.filter((obj) => obj.temp_id >= castData.temp_id)
                            : "";
                        const characCredId =
                          filteredObj && filteredObj[0].creditables_id
                            ? filteredObj[0].creditables_id
                            : "";
                        if (characCredId) {
                          const checkFirstTranslation = await model.creditableTranslation.findOne({
                            where: {
                              creditables_id: characCredId,
                              site_language: castData.site_language,
                              status: "active",
                            },
                          });

                          if (!checkFirstTranslation) {
                            characterTrans.creditables_id = characCredId;
                            await model.creditableTranslation.create(characterTrans);
                            actionDate = characterTrans.created_at;
                          }
                        }
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
      if (titleId && titleType) {
        const payload = { list: [{ record_id: titleId, type: titleType, action: "edit" }] };
        schedulerJobService.addJobInScheduler(
          "edit title data to search db",
          JSON.stringify(payload),
          "search_db",
          `Sumbit all ${titleType} Details`,
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
        if (isVideoModified) {
          schedulerJobService.addJobInScheduler(
            "video add in search db",
            JSON.stringify({
              list: [{ item_id: titleId, item_type: titleType, type: "title" }],
            }),
            "update_video_search_data_by_item_id",
            `title video add in search db when title data for (${titleType}) edit in edit submit all`,
            userId,
          );
        }
        //update edit table
        await titleService.titleDataAddEditInEditTbl(titleId, titleType, userId, actionDate);
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
