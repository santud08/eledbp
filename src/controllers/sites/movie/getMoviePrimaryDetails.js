import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { tmdbService, kobisService, priorityService } from "../../../services/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { fn, col } from "sequelize";

/**
 * getMoviePrimaryDetails
 * @param req
 * @param res
 */
export const getMoviePrimaryDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const requestId = reqBody.request_id ? reqBody.request_id : ""; //It will be request  id
    const tmdbId = reqBody.tmdb_id ? reqBody.tmdb_id : "";
    const kobisId = reqBody.kobis_id ? reqBody.kobis_id : "";
    const language = reqBody.site_language;
    const titleType = "movie";
    let tmdbData = [];
    let tmdbKeywordsData = [];
    let tmdbWatchData = [];
    let tmdbMovieSeriesDetails = [];
    let kobisData = [];
    let getSearchKeywordList = [],
      getNewsSearchKeywordList = [],
      getReReleaseDateList = [],
      getOriginalWorkList = [],
      getCountryList = [],
      getStreamList = [],
      getRentList = [],
      getBuyList = [],
      getConnectionList = [],
      getSeriesList = [];

    let tmdbDataDetails = {};
    let kobisDataDetails = {};
    let getInformations = {};
    let getCreditDetails = {};
    let getMediaDetails = {};
    let getTagDetails = {};
    let priorityResults = {};

    // IF TMDB ID is present then fetch the details to show Data below input box and For priority details
    if (tmdbId) {
      let listType = null;
      let dataType = "format";
      const [
        tmdbResults,
        tmdbKeywordsResults,
        tmdbTitleAkaResult,
        tmdbTitleCertification,
        tmdbWatchDetails,
      ] = await Promise.all([
        tmdbService.fetchTitleDetails(titleType, tmdbId, language),
        tmdbService.fetchTitleKeywords(titleType, tmdbId, language),
        tmdbService.fetchTitleAka(titleType, tmdbId, language),
        tmdbService.fetchTitleCertification(titleType, tmdbId, "ko"),
        tmdbService.fetchTitleWatch(titleType, tmdbId, listType, "ko"),
      ]);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
      // search keyword details from TMDB
      tmdbKeywordsData = "";
      // AKA details from TMDB
      tmdbData.aka =
        tmdbTitleAkaResult.results && tmdbTitleAkaResult.results.all_aka
          ? tmdbTitleAkaResult.results.all_aka
          : "";
      tmdbData.akaList =
        tmdbTitleAkaResult.results &&
        tmdbTitleAkaResult.results.list &&
        tmdbTitleAkaResult.results.list.length > 0
          ? tmdbTitleAkaResult.results.list
          : "";
      // Certification details from TMDB
      tmdbData.certification =
        tmdbTitleCertification.results && tmdbTitleCertification.results.certification_key
          ? tmdbTitleCertification.results.certification_key
          : "";
      tmdbDataDetails.search_keyword_details =
        tmdbKeywordsData && tmdbKeywordsData.keywords ? tmdbKeywordsData.keywords : [];
      // TMDB DATA THAT SHOW BELOW THE INPUT BOX
      tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
      tmdbDataDetails.imdb_id = tmdbData && tmdbData.imdb_id ? tmdbData.imdb_id : "";
      tmdbDataDetails.tmdb_title = tmdbData && tmdbData.title ? tmdbData.title : "";
      tmdbDataDetails.tmdb_aka = tmdbData && tmdbData.aka ? tmdbData.aka : "";
      tmdbDataDetails.tmdb_summery = tmdbData && tmdbData.overview ? tmdbData.overview : "";
      tmdbDataDetails.tmdb_plot_summery =
        tmdbData && tmdbData.tmdb_plot_summery ? tmdbData.tmdb_plot_summery : "";
      tmdbDataDetails.tmdb_official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
      // TMDB WATCH DETAILS:
      tmdbWatchData = tmdbWatchDetails && tmdbWatchDetails.results ? tmdbWatchDetails.results : "";
      // TMDB MOVIE SERIES DETAILS:
      const collectionId =
        tmdbData && tmdbData.belongs_to_collection && tmdbData.belongs_to_collection.id
          ? tmdbData.belongs_to_collection.id
          : "";
      if (collectionId) {
        const tmdbMovieSeries = await tmdbService.fetchMovieSeries(
          collectionId,
          dataType,
          language,
        );
        tmdbMovieSeriesDetails = tmdbMovieSeries.results ? tmdbMovieSeries.results : "";
      }
    }

    // IF KOBIS ID is present then fetch the details to show Data below input box and For priority details
    if (kobisId) {
      const kobisResults = await kobisService.fetchTitleDetails(titleType, kobisId, language);
      kobisData = kobisResults.results ? kobisResults.results : "";

      // KOBIS DATA THAT SHOW BELOW THE INPUT BOX
      kobisDataDetails.kobis_id = kobisData && kobisData.kobis_id ? kobisData.kobis_id : "";
      kobisDataDetails.kobis_title = kobisData && kobisData.title ? kobisData.title : "";
      kobisDataDetails.kobis_aka = kobisData && kobisData.kobis_aka ? kobisData.kobis_aka : "";
      kobisDataDetails.kobis_summery =
        kobisData && kobisData.kobis_summery ? kobisData.kobis_summery : "";
      kobisDataDetails.kobis_plot_summery =
        kobisData && kobisData.kobis_plot_summery ? kobisData.kobis_plot_summery : "";
      kobisDataDetails.kobis_official_site =
        kobisData && kobisData.kobis_official_site ? kobisData.kobis_official_site : "";
    }

    if (requestId) {
      // Check Request for particular language and fetch the language dependency data
      const checkRequest = await model.titleRequestPrimaryDetails.findOne({
        attributes: ["name", "description", "plot_summary", "original_work_details"],
        where: {
          id: requestId,
          type: "movie",
          site_language: language,
          status: "active",
          request_status: "draft",
        },
      });

      getInformations = await model.titleRequestPrimaryDetails.findOne({
        attributes: [
          "id",
          "relation_id",
          "aka",
          "type",
          "release_date",
          "imdb_id",
          "tmdb_id",
          "tiving_id",
          "odk_id",
          "kobis_id",
          "affiliate_link",
          "certification",
          "is_rerelease",
          "search_keyword_details",
          "news_keyword_details",
          "title_status",
          "request_status",
          "re_release_details",
          "country_details",
          "footfalls",
          "runtime",
          "language",
          "original_title",
          "watch_on_stream_details",
          "watch_on_rent_details",
          "watch_on_buy_details",
          "connection_details",
          "series_details",
        ],
        where: {
          id: requestId,
          type: "movie",
          status: "active",
          request_status: "draft",
        },
      });

      getInformations.name = checkRequest && checkRequest.name ? checkRequest.name : "";
      getInformations.description =
        checkRequest && checkRequest.description ? checkRequest.description : "";
      getInformations.plot_summary =
        checkRequest && checkRequest.plot_summary ? checkRequest.plot_summary : "";
      getInformations.original_work_details =
        checkRequest && checkRequest.plot_summary ? checkRequest.original_work_details : "";

      // Get request Credit id if exist
      getCreditDetails = await model.titleRequestCredit.findOne({
        attributes: ["id", "request_id"],
        where: { request_id: requestId, status: "active" },
      });
      // Get request Media id if exist
      getMediaDetails = await model.titleRequestMedia.findOne({
        attributes: ["id", "request_id"],
        where: { request_id: requestId, status: "active" },
      });
      // Get request Tag id if exist
      getTagDetails = await model.titleRequestTag.findOne({
        attributes: ["id", "request_id"],
        where: { request_id: requestId, status: "active" },
      });
      // Get search keyword details
      const searchKeywordDetails = getInformations.search_keyword_details
        ? JSON.parse(getInformations.search_keyword_details)
        : "";
      if (searchKeywordDetails) {
        for (const searchKeyword of searchKeywordDetails.list) {
          if (searchKeyword) {
            const keyword = searchKeyword.keyword ? searchKeyword.keyword : "";
            getSearchKeywordList.push(keyword);
          }
        }
      }

      // Get news keyword details
      const newsKeywordDetails = getInformations.news_keyword_details
        ? JSON.parse(getInformations.news_keyword_details)
        : "";
      if (newsKeywordDetails) {
        for (const newsKeyword of newsKeywordDetails.list) {
          if (newsKeyword) {
            const keyword = newsKeyword.keyword ? newsKeyword.keyword : "";
            getNewsSearchKeywordList.push(keyword);
          }
        }
      }
      // Get Re-release details
      const reReleaseDetails = getInformations.re_release_details
        ? JSON.parse(getInformations.re_release_details)
        : "";
      if (reReleaseDetails) {
        let list = [];
        for (const releaseDate of reReleaseDetails.list) {
          if (releaseDate) {
            const date = releaseDate.re_release_date ? releaseDate.re_release_date : "";
            const record = {
              date: date,
            };
            list.push(record);
          }
          getReReleaseDateList = list;
        }
      }
      // Get country details
      const countryDetails = getInformations.country_details
        ? JSON.parse(getInformations.country_details)
        : "";
      if (countryDetails) {
        let list = [];
        for (const eachCountry of countryDetails.list) {
          if (eachCountry) {
            const id = eachCountry.country_id ? eachCountry.country_id : "";
            // Get country name
            const getCountry = await model.country.findOne({
              attributes: ["id"],
              where: { id: id, status: "active" },
              include: [
                {
                  model: model.countryTranslation,
                  left: true,
                  attributes: ["country_name"],
                  where: {
                    status: "active",
                  },
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
            });
            if (getCountry) {
              const countryName = getCountry.countryTranslations[0].country_name
                ? getCountry.countryTranslations[0].country_name
                : "";
              const record = {
                id: id,
                country_name: countryName,
              };
              list.push(record);
            }
          }
          getCountryList = list;
        }
      }
      // Get Original work details
      const originalWorkDetails =
        checkRequest && checkRequest.original_work_details
          ? JSON.parse(checkRequest.original_work_details)
          : "";
      if (originalWorkDetails) {
        let list = [];
        for (const originalWork of originalWorkDetails.list) {
          if (originalWork) {
            const id = originalWork.id ? originalWork.id : "";
            const type = originalWork.ow_type ? originalWork.ow_type : "";
            const title = originalWork.ow_title ? originalWork.ow_title : "";
            const artis = originalWork.ow_original_artis ? originalWork.ow_original_artis : "";
            const record = {
              id: id,
              type: type,
              title: title,
              artis: artis,
            };
            list.push(record);
          }
          getOriginalWorkList = list;
        }
      }
      // Get Stream details
      const streamDetails = getInformations.watch_on_stream_details
        ? JSON.parse(getInformations.watch_on_stream_details)
        : "";
      if (streamDetails) {
        let list = [];
        for (const stream of streamDetails.list) {
          if (stream) {
            const movieId = stream.movie_id ? stream.movie_id : "";
            const providerId = stream.provider_id ? stream.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "logo_path", "list_order"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateOttLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                provider_id: providerId,
                movie_id: movieId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getStreamList = list;
        }
      }
      // Get Rent details
      const rentDetails = getInformations.watch_on_rent_details
        ? JSON.parse(getInformations.watch_on_rent_details)
        : "";
      if (rentDetails) {
        let list = [];
        for (const rent of rentDetails.list) {
          if (rent) {
            const movieId = rent.movie_id ? rent.movie_id : "";
            const providerId = rent.provider_id ? rent.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "logo_path", "list_order"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateOttLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                provider_id: providerId,
                movie_id: movieId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getRentList = list;
        }
      }
      // Get Buy details
      const buyDetails = getInformations.watch_on_buy_details
        ? JSON.parse(getInformations.watch_on_buy_details)
        : "";
      if (buyDetails) {
        let list = [];
        for (const buy of buyDetails.list) {
          if (buy) {
            const movieId = buy.movie_id ? buy.movie_id : "";
            const providerId = buy.provider_id ? buy.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "logo_path", "list_order"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateOttLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                provider_id: providerId,
                movie_id: movieId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getBuyList = list;
        }
      }
      // Get Connection details
      const connectionDetails = getInformations.connection_details
        ? JSON.parse(getInformations.connection_details)
        : "";
      if (connectionDetails) {
        let list = [];
        for (const connection of connectionDetails.list) {
          if (connection) {
            const relatedTitleId = connection.related_title_id ? connection.related_title_id : "";
            // Get Title name
            const getTitleDetails = await model.title.findOne({
              attributes: ["id", "record_status"],
              where: { id: relatedTitleId, record_status: "active" },
              include: [
                {
                  model: model.titleTranslation,
                  left: true,
                  attributes: ["title_id", "name", "site_language"],
                  where: {
                    status: "active",
                  },
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
                {
                  model: model.titleImage,
                  attributes: [
                    "title_id",
                    "original_name",
                    "file_name",
                    "url",
                    [
                      fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "path",
                    ],
                  ],
                  left: true,
                  where: {
                    image_category: "poster_image",
                    is_main_poster: "y",
                  },
                  required: false,
                  separate: true, //get the recently added image
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
            });
            if (getTitleDetails) {
              const titleId =
                getTitleDetails.titleTranslations[0] &&
                getTitleDetails.titleTranslations[0].title_id
                  ? getTitleDetails.titleTranslations[0].title_id
                  : "";
              const titleName =
                getTitleDetails.titleTranslations[0] && getTitleDetails.titleTranslations[0].name
                  ? getTitleDetails.titleTranslations[0].name
                  : "";
              const titleImagePath =
                getTitleDetails.titleImages[0] && getTitleDetails.titleImages[0].path
                  ? getTitleDetails.titleImages[0].path
                  : "";
              const record = {
                title_id: titleId,
                title_name: titleName,
                title_poster: titleImagePath,
              };
              list.push(record);
            }
          }
          getConnectionList = list;
        }
      }
      // Get Series details
      const seriesDetails = getInformations.series_details
        ? JSON.parse(getInformations.series_details)
        : "";
      if (seriesDetails) {
        let list = [];
        for (const series of seriesDetails.list) {
          if (series) {
            const relatedTitleId = series.related_title_id ? series.related_title_id : "";
            const tmdb_id = series.tmdb_id ? series.tmdb_id : "";
            // Get Title name
            if (relatedTitleId) {
              const getTitleDetails = await model.title.findOne({
                attributes: ["id", "record_status"],
                where: { id: relatedTitleId, record_status: "active" },
                include: [
                  {
                    model: model.titleTranslation,
                    left: true,
                    attributes: ["title_id", "name", "site_language"],
                    where: {
                      status: "active",
                    },
                    separate: true,
                    order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                  },
                  {
                    model: model.titleImage,
                    attributes: [
                      "title_id",
                      "original_name",
                      "file_name",
                      "url",
                      [
                        fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    left: true,
                    where: {
                      image_category: "poster_image",
                      is_main_poster: "y",
                    },
                    required: false,
                    separate: true, //get the recently added image
                    order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              if (getTitleDetails) {
                const titleId = getTitleDetails.titleTranslations[0].title_id
                  ? getTitleDetails.titleTranslations[0].title_id
                  : "";
                const titleName = getTitleDetails.titleTranslations[0].name
                  ? getTitleDetails.titleTranslations[0].name
                  : "";
                const titleImagePath =
                  getTitleDetails.titleImages[0] && getTitleDetails.titleImages[0].path
                    ? getTitleDetails.titleImages[0].path
                    : "";
                const record = {
                  title_id: titleId,
                  title_name: titleName,
                  title_poster: titleImagePath,
                  tmdb_id: "",
                };
                list.push(record);
              }
            } else if (tmdb_id) {
              const tmdbResults = await tmdbService.fetchTitleDetails(titleType, tmdb_id, language);

              const tmdbSeriesData = tmdbResults && tmdbResults.results ? tmdbResults.results : "";
              const tmdbTitle = tmdbSeriesData && tmdbSeriesData.title ? tmdbSeriesData.title : "";
              const tmdbPoster =
                tmdbSeriesData && tmdbSeriesData.poster_image ? tmdbSeriesData.poster_image : "";

              const record = {
                title_id: "",
                title_name: tmdbTitle,
                title_poster: tmdbPoster,
                tmdb_id: tmdb_id,
              };
              list.push(record);
            }
          }
          getSeriesList = list;
        }
      }
    } else if (tmdbId || kobisId) {
      // getting the priority details
      const priorityDetails = await model.priority.findAll({
        attributes: [
          "id",
          "field_name",
          "11db_field_priority",
          "tmdb_field_priority",
          "kobis_field_priority",
        ],
        where: { type: titleType, status: "active" },
      });
      // calling the priority service for auto-fill:

      priorityResults = await priorityService.autoFillTitlePriorityDetails(
        priorityDetails,
        tmdbData,
        kobisData,
        tmdbKeywordsData,
        titleType,
        language,
      );

      //Watch on Details from TMDB
      //1.Stream
      if (tmdbWatchData.stream && tmdbWatchData.stream.length > 0) {
        for (const stream of tmdbWatchData.stream) {
          if (stream) {
            const record = {
              provider_id: stream.provider_id,
              movie_id: stream.movie_id,
              provider_name: stream.provider_name,
              ott_logo_path: stream.ott_logo_path,
            };
            getStreamList.push(record);
          }
        }
      }
      //2.Rent
      if (tmdbWatchData.rent && tmdbWatchData.rent.length > 0) {
        for (const rent of tmdbWatchData.rent) {
          if (rent) {
            const record = {
              provider_id: rent.provider_id,
              movie_id: rent.movie_id,
              provider_name: rent.provider_name,
              ott_logo_path: rent.ott_logo_path,
            };
            getRentList.push(record);
          }
        }
      }
      //3.Buy
      if (tmdbWatchData.buy && tmdbWatchData.buy.length > 0) {
        for (const buy of tmdbWatchData.buy) {
          if (buy) {
            const record = {
              provider_id: buy.provider_id,
              movie_id: buy.movie_id,
              provider_name: buy.provider_name,
              ott_logo_path: buy.ott_logo_path,
            };
            getBuyList.push(record);
          }
        }
      }

      // Get Series details
      if (tmdbMovieSeriesDetails.length > 0) {
        for (const series of tmdbMovieSeriesDetails) {
          // check our local db to get the title id if the TMDB ID is already added
          if (series && series.tmdb_id) {
            if (series.tmdb_id != tmdbId) {
              const record = {
                title_id: series.title_id,
                title_name: series.title_name,
                title_poster: series.title_poster,
                tmdb_id: series.tmdb_id,
              };
              getSeriesList.push(record);
            }
          } else if (series && !series.tmdb_id) {
            const record = {
              title_id: series.title_id,
              title_name: series.title_name,
              title_poster: series.title_poster,
              tmdb_id: series.tmdb_id,
            };
            getSeriesList.push(record);
          }
        }
      }
    }

    res.ok({
      request_id: requestId,
      credit_request_id: getCreditDetails && getCreditDetails.id ? getCreditDetails.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tag_request_id: getTagDetails && getTagDetails.id ? getTagDetails.id : "",
      relation_id: getInformations.relation_id ? getInformations.relation_id : "",
      tmdb_id: getInformations.tmdb_id
        ? getInformations.tmdb_id
        : tmdbDataDetails.tmdb_id
        ? tmdbDataDetails.tmdb_id
        : "",
      imdb_id: getInformations.imdb_id
        ? getInformations.imdb_id
        : tmdbDataDetails.imdb_id
        ? tmdbDataDetails.imdb_id
        : "",
      tiving_id: getInformations.tiving_id ? getInformations.tiving_id : "",
      odk_id: getInformations.odk_id ? getInformations.odk_id : "",
      kobis_id: getInformations.kobis_id
        ? getInformations.kobis_id
        : kobisDataDetails.kobis_id
        ? kobisDataDetails.kobis_id
        : "",
      title: getInformations.name
        ? getInformations.name
        : priorityResults.name
        ? priorityResults.name
        : "",
      tmdb_title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      kobis_title: kobisDataDetails.kobis_title ? kobisDataDetails.kobis_title : "",
      aka: getInformations.aka
        ? getInformations.aka
        : priorityResults.aka
        ? priorityResults.aka
        : "",
      tmdb_aka: tmdbData.akaList ? tmdbData.akaList : "",
      kobis_aka: "",
      summery: getInformations.description
        ? getInformations.description
        : priorityResults.summary
        ? priorityResults.summary
        : "",
      tmdb_summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      kobis_summery: "",
      plot_summery: getInformations.plot_summary ? getInformations.plot_summary : "",
      tmdb_plot_summery: "",
      kobis_plot_summery: "",
      official_site: getInformations.affiliate_link
        ? getInformations.affiliate_link
        : priorityResults.official_site
        ? priorityResults.official_site
        : "",
      tmdb_official_site: tmdbDataDetails.tmdb_official_site
        ? tmdbDataDetails.tmdb_official_site
        : "",
      kobis_official_site: "",
      search_keyword_details: requestId
        ? getSearchKeywordList
        : !requestId && priorityResults.search_keywords
        ? priorityResults.search_keywords
        : [],
      news_keyword_details: getNewsSearchKeywordList,
      title_status: getInformations.title_status
        ? getInformations.title_status
        : priorityResults.title_status
        ? priorityResults.title_status
        : "",
      status: getInformations.request_status ? getInformations.request_status : "",
      release_date: getInformations.release_date
        ? getInformations.release_date
        : priorityResults.release_date
        ? priorityResults.release_date
        : "",
      is_rerelease: getInformations.is_rerelease ? getInformations.is_rerelease : "",
      re_releasedate: getReReleaseDateList,
      footfalls: getInformations.footfalls ? getInformations.footfalls : "",
      runtime: getInformations.runtime
        ? getInformations.runtime
        : priorityResults.runtime
        ? priorityResults.runtime
        : "",
      certification: getInformations.certification
        ? getInformations.certification
        : priorityResults.certification
        ? priorityResults.certification
        : "",
      language: getInformations.language
        ? getInformations.language
        : priorityResults.language
        ? priorityResults.language
        : "",
      countrylist: requestId
        ? getCountryList
        : !requestId && priorityResults.country
        ? priorityResults.country
        : [],
      getoriginalWork_list: getOriginalWorkList,
      getstream_list: getStreamList,
      getrent_list: getRentList,
      getbuy_list: getBuyList,
      getconnection_list: getConnectionList,
      getseries_list: getSeriesList,
    });
  } catch (error) {
    next(error);
  }
};
