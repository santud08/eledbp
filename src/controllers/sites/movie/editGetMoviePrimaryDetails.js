import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { tmdbService, kobisService } from "../../../services/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { fn, col } from "sequelize";

/**
 * editGetMoviePrimaryDetails
 * @param req
 * @param res
 */
export const editGetMoviePrimaryDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const titleId = reqBody.title_id;
    const findTitleDetails = await model.title.findOne({
      where: { id: titleId, type: "movie", record_status: "active" },
    });

    if (!findTitleDetails) throw StatusError.badRequest(res.__("Invalid title ID"));

    const requestId = reqBody.request_id ? reqBody.request_id : ""; //It will be request  id
    const siteLanguage = reqBody.site_language;
    const titleType = "movie";
    let tmdbData = [];
    let tmdbKeywordsData = [];
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

    let titleDetails = {};

    // Get the details from the Title - Check for tmdb and kobis id in title
    let dbTitleInformation = await model.title.findOne({
      attributes: [
        "id",
        "imdb_id",
        "tmdb_id",
        "tiving_id",
        "odk_id",
        "kobis_id",
        "is_rerelease",
        "affiliate_link",
        "certification",
        "footfalls",
        "runtime",
        "language",
        "title_status",
        "release_date",
      ],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["name", "aka", "plot_summary", "description"],
          left: true,
          where: { status: "active" },
        },
      ],
      where: {
        id: titleId,
        record_status: "active",
        type: titleType,
      },
    });

    const tmdbId = reqBody.tmdb_id
      ? reqBody.tmdb_id
      : dbTitleInformation && dbTitleInformation.tmdb_id
      ? dbTitleInformation.tmdb_id
      : "";
    const kobisId = reqBody.kobis_id ? reqBody.kobis_id : "";

    // IF TMDB ID is present then fetch the details to show Data below input box and For priority details
    if (tmdbId) {
      const [tmdbResults, tmdbKeywordsResults, tmdbTitleAkaResult] = await Promise.all([
        tmdbService.fetchTitleDetails(titleType, tmdbId, siteLanguage),
        tmdbService.fetchTitleKeywords(titleType, tmdbId, siteLanguage),
        tmdbService.fetchTitleAka(titleType, tmdbId, siteLanguage),
      ]);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";

      // AKA details from TMDB
      tmdbData.aka =
        tmdbTitleAkaResult.results && tmdbTitleAkaResult.results.aka
          ? tmdbTitleAkaResult.results.aka
          : "";
      // search keyword details from TMDB
      tmdbKeywordsData = tmdbKeywordsResults.results ? tmdbKeywordsResults.results : "";

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
    }

    // IF KOBIS ID is present then fetch the details to show Data below input box and For priority details
    if (kobisId) {
      const kobisResults = await kobisService.fetchTitleDetails(titleType, kobisId, siteLanguage);
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
          site_language: siteLanguage,
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
        checkRequest && checkRequest.original_work_details
          ? checkRequest.original_work_details
          : "";
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
            const record = {
              id: releaseDate.id,
              date: releaseDate.re_release_date,
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
            const id = eachCountry.id ? eachCountry.id : "";
            const country_id = eachCountry.country_id ? eachCountry.country_id : "";
            // Get country name
            const getCountry = await model.country.findOne({
              attributes: ["id"],
              where: { id: country_id, status: "active" },
              include: [
                {
                  model: model.countryTranslation,
                  left: true,
                  attributes: ["country_name"],
                  where: {
                    status: "active",
                  },
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ],
            });
            if (getCountry) {
              const countryName = getCountry.countryTranslations[0].country_name
                ? getCountry.countryTranslations[0].country_name
                : "";
              const record = {
                id: id,
                country_id: country_id,
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
            const id = stream.id ? stream.id : "";
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
                id: id,
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
            const id = rent.id ? rent.id : "";
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
                id: id,
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
            const id = buy.id ? buy.id : "";
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
                id: id,
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
            const id = connection.id ? connection.id : "";
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
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                id: id,
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
            const id = series.id ? series.id : "";
            const relatedTitleId = series.related_title_id ? series.related_title_id : "";
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
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                id: id,
                title_id: titleId,
                title_name: titleName,
                title_poster: titleImagePath,
              };
              list.push(record);
            }
          }
          getSeriesList = list;
        }
      }
    } else if (titleId && dbTitleInformation) {
      // language dependent fields:
      // Get the details from the Title - Check for tmdb and kobis id in title
      const dbTitleLangDependentInfo = await model.title.findOne({
        attributes: ["id"],
        include: [
          {
            model: model.titleTranslation,
            attributes: ["name", "aka", "plot_summary", "description"],
            left: true,
            where: { status: "active", site_language: siteLanguage },
          },
        ],
        where: {
          id: titleId,
          record_status: "active",
          type: titleType,
        },
      });
      if (dbTitleLangDependentInfo) {
        if (dbTitleLangDependentInfo.titleTranslations.length > 0) {
          titleDetails.name = dbTitleLangDependentInfo.titleTranslations[0].name
            ? dbTitleLangDependentInfo.titleTranslations[0].name
            : "";
          titleDetails.plot_summary = dbTitleLangDependentInfo.titleTranslations[0].plot_summary
            ? dbTitleLangDependentInfo.titleTranslations[0].plot_summary
            : "";
          titleDetails.description = dbTitleLangDependentInfo.titleTranslations[0].description
            ? dbTitleLangDependentInfo.titleTranslations[0].description
            : "";
        }
      }

      if (dbTitleInformation.titleTranslations.length > 0) {
        titleDetails.aka = dbTitleInformation.titleTranslations[0].aka
          ? dbTitleInformation.titleTranslations[0].aka
          : "";
      }
      // Get search  and news search keyword details
      const keywords = await model.titleKeyword.findAll({
        attributes: ["id", "keyword", "keyword_type"],
        where: {
          title_id: titleId,
          status: "active",
        },
        separate: true,
        order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
      });
      if (keywords) {
        for (const eachValue of keywords) {
          if (eachValue && eachValue.keyword_type == "search") {
            getSearchKeywordList.push(eachValue.keyword);
          } else if (eachValue && eachValue.keyword_type == "news") {
            getNewsSearchKeywordList.push(eachValue.keyword);
          }
        }
      }
      // Get Re-release details
      const reReleaseDate = await model.titleReRelease.findAll({
        where: { title_id: titleId, status: "active" },
        attributes: ["id", "re_release_date"],
        order: [["re_release_date", "ASC"]],
      });
      if (reReleaseDate) {
        for (const value of reReleaseDate) {
          if (value) {
            const record = {
              id: value.id,
              date: value.re_release_date,
            };
            getReReleaseDateList.push(record);
          }
        }
      }
      // Get country details
      const getCountry = await model.titleCountries.findAll({
        attributes: ["id", "title_id", "country_id"],
        where: { title_id: titleId, status: "active" },
        include: [
          {
            model: model.country,
            left: true,
            attributes: ["id", "country_name"],
            where: { status: "active" },
            required: true,
            include: {
              model: model.countryTranslation,
              attributes: ["country_id", "country_name", "site_language"],
              left: true,
              where: {
                status: "active",
              },
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              required: false,
            },
          },
        ],
      });
      if (getCountry) {
        let list = [];
        for (const eachRow of getCountry) {
          if (eachRow) {
            const id = eachRow.id ? eachRow.id : "";
            if (eachRow.country && eachRow.country.countryTranslations.length > 0) {
              const countryId = eachRow.country.countryTranslations[0].country_id
                ? eachRow.country.countryTranslations[0].country_id
                : "";
              const name = eachRow.country.countryTranslations[0].country_name
                ? eachRow.country.countryTranslations[0].country_name
                : "";
              const record = {
                id: id,
                country_id: countryId,
                country_name: name,
              };
              list.push(record);
            }
          }
        }
        getCountryList = list;
      }
      // Get Original By
      const getOriginalBy = await model.originalWorks.findAll({
        attributes: ["id", "title_id", "ow_type", "ow_title", "ow_original_artis"],
        where: { title_id: titleId, status: "active", site_language: siteLanguage },
      });
      if (getOriginalBy) {
        let list = [];
        for (const eachRow of getOriginalBy) {
          if (eachRow) {
            const id = eachRow.id ? eachRow.id : "";
            const type = eachRow.ow_type ? eachRow.ow_type : "";
            const title = eachRow.ow_title ? eachRow.ow_title : "";
            const artis = eachRow.ow_original_artis ? eachRow.ow_original_artis : "";
            const record = {
              id: id,
              type: type,
              title: title,
              artis: artis,
            };
            list.push(record);
          }
        }
        getOriginalWorkList = list;
      }
      // Watch On Details
      const watchOnDetails = await model.titleWatchOn.findAll({
        attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
        where: { title_id: titleId, status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      });
      if (watchOnDetails) {
        let streamList = [];
        let rentList = [];
        let buyList = [];
        for (const eachRow of watchOnDetails) {
          if (eachRow) {
            if (eachRow.type && eachRow.type == "stream") {
              if (eachRow.ottServiceProvider) {
                const record = {
                  id: eachRow.id ? eachRow.id : "",
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  provider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  ott_logo_path: eachRow.ottServiceProvider.logo_path
                    ? await generalHelper.generateOttLogoUrl(
                        req,
                        eachRow.ottServiceProvider.logo_path,
                      )
                    : "",
                };
                streamList.push(record);
              }
            }
            if (eachRow.type && eachRow.type == "rent") {
              if (eachRow.ottServiceProvider) {
                const record = {
                  id: eachRow.id ? eachRow.id : "",
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  provider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  ott_logo_path: eachRow.ottServiceProvider.logo_path
                    ? await generalHelper.generateOttLogoUrl(
                        req,
                        eachRow.ottServiceProvider.logo_path,
                      )
                    : "",
                };
                rentList.push(record);
              }
            }
            if (eachRow.type && eachRow.type == "buy") {
              if (eachRow.ottServiceProvider) {
                const record = {
                  id: eachRow.id ? eachRow.id : "",
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  provider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  ott_logo_path: eachRow.ottServiceProvider.logo_path
                    ? await generalHelper.generateOttLogoUrl(
                        req,
                        eachRow.ottServiceProvider.logo_path,
                      )
                    : "",
                };
                buyList.push(record);
              }
            }
          }
        }
        getStreamList = streamList;
        getRentList = rentList;
        getBuyList = buyList;
      }
      // connection Details
      let relatedTitleList = await model.relatedTitle.findAll({
        attributes: ["id", "related_title_id", "title_id"],
        where: { title_id: titleId, status: "active" },
        include: [
          {
            model: model.title,
            attributes: ["id", "record_status"],
            left: true,
            where: { record_status: "active" },
            required: true,
            include: [
              {
                model: model.titleTranslation,
                left: true,
                attributes: ["title_id", "name", "site_language"],
                where: { status: "active" },
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                  status: "active",
                  image_category: "poster_image",
                  is_main_poster: "y",
                },
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                required: false,
              },
            ],
          },
        ],
      });
      if (relatedTitleList) {
        let list = [];
        for (const eachRow of relatedTitleList) {
          if (eachRow) {
            const record = {
              id: eachRow.id ? eachRow.id : "",
              title_id:
                eachRow.title &&
                eachRow.title.titleTranslations.length > 0 &&
                eachRow.title.titleTranslations[0].title_id
                  ? eachRow.title.titleTranslations[0].title_id
                  : "",
              title_name:
                eachRow.title &&
                eachRow.title.titleTranslations.length > 0 &&
                eachRow.title.titleTranslations[0].name
                  ? eachRow.title.titleTranslations[0].name
                  : "",
              title_poster:
                eachRow.title &&
                eachRow.title.titleImages.length > 0 &&
                eachRow.title.titleImages[0].path
                  ? eachRow.title.titleImages[0].path
                  : "",
            };
            list.push(record);
          }
        }
        getConnectionList = list;
      }
      // Series Details
      let relatedSeriesTitleList = await model.relatedSeriesTitle.findAll({
        attributes: ["id", "related_series_title_id", "title_id"],
        where: { title_id: titleId, status: "active" },
        include: [
          {
            model: model.title,
            attributes: ["id", "record_status"],
            left: true,
            where: { record_status: "active" },
            required: true,
            include: [
              {
                model: model.titleTranslation,
                left: true,
                attributes: ["title_id", "name", "site_language"],
                where: { status: "active" },
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                  status: "active",
                  image_category: "poster_image",
                  is_main_poster: "y",
                },
                required: false,
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
            ],
          },
        ],
      });
      if (relatedSeriesTitleList) {
        let list = [];
        for (const eachRow of relatedSeriesTitleList) {
          if (eachRow) {
            const record = {
              id: eachRow.id ? eachRow.id : "",
              title_id:
                eachRow.title &&
                eachRow.title.titleTranslations.length > 0 &&
                eachRow.title.titleTranslations[0].title_id
                  ? eachRow.title.titleTranslations[0].title_id
                  : "",
              title_name:
                eachRow.title &&
                eachRow.title.titleTranslations.length > 0 &&
                eachRow.title.titleTranslations[0].name
                  ? eachRow.title.titleTranslations[0].name
                  : "",
              title_poster:
                eachRow.title &&
                eachRow.title.titleImages.length > 0 &&
                eachRow.title.titleImages[0].path
                  ? eachRow.title.titleImages[0].path
                  : "",
            };
            list.push(record);
          }
        }
        getSeriesList = list;
      }
    }
    res.ok({
      request_id: requestId,
      title_id: titleId,
      credit_request_id: getCreditDetails && getCreditDetails.id ? getCreditDetails.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tag_request_id: getTagDetails && getTagDetails.id ? getTagDetails.id : "",
      relation_id: getInformations.relation_id ? getInformations.relation_id : "",
      tmdb_id: tmdbId
        ? tmdbId
        : getInformations.tmdb_id
        ? getInformations.tmdb_id
        : !requestId && dbTitleInformation.tmdb_id
        ? dbTitleInformation.tmdb_id
        : "",
      imdb_id: getInformations.imdb_id
        ? getInformations.imdb_id
        : !requestId && dbTitleInformation.imdb_id
        ? dbTitleInformation.imdb_id
        : "",
      tiving_id: getInformations.tiving_id
        ? getInformations.tiving_id
        : !requestId && dbTitleInformation.tiving_id
        ? dbTitleInformation.tiving_id
        : "",
      odk_id: getInformations.odk_id
        ? getInformations.odk_id
        : !requestId && dbTitleInformation.odk_id
        ? dbTitleInformation.odk_id
        : "",
      kobis_id: kobisId
        ? kobisId
        : getInformations.kobis_id
        ? getInformations.kobis_id
        : !requestId && dbTitleInformation.kobis_id
        ? dbTitleInformation.kobis_id
        : "",
      title: getInformations.name
        ? getInformations.name
        : !requestId && titleDetails.name
        ? titleDetails.name
        : "",
      tmdb_title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      kobis_title: kobisDataDetails.kobis_title ? kobisDataDetails.kobis_title : "",
      aka: getInformations.aka
        ? getInformations.aka
        : !requestId && titleDetails.aka
        ? titleDetails.aka
        : "",
      tmdb_aka: tmdbDataDetails.tmdb_aka ? tmdbDataDetails.tmdb_aka : "",
      kobis_aka: "",
      summery: getInformations.description
        ? getInformations.description
        : !requestId && titleDetails.description
        ? titleDetails.description
        : "",
      tmdb_summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      kobis_summery: "",
      plot_summery: getInformations.plot_summary
        ? getInformations.plot_summary
        : !requestId && titleDetails.plot_summary
        ? titleDetails.plot_summary
        : "",
      tmdb_plot_summery: tmdbDataDetails.tmdb_plot_summery,
      kobis_plot_summery: kobisDataDetails.kobis_plot_summery,
      official_site: getInformations.affiliate_link
        ? getInformations.affiliate_link
        : !requestId && dbTitleInformation && dbTitleInformation.affiliate_link
        ? dbTitleInformation.affiliate_link
        : "",
      tmdb_official_site: tmdbDataDetails.tmdb_official_site
        ? tmdbDataDetails.tmdb_official_site
        : "",
      kobis_official_site: kobisDataDetails.kobis_official_site
        ? kobisDataDetails.kobis_official_site
        : "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsSearchKeywordList,
      title_status: getInformations.title_status
        ? getInformations.title_status
        : !requestId && dbTitleInformation && dbTitleInformation.title_status
        ? dbTitleInformation.title_status
        : "",
      status: getInformations.request_status ? getInformations.request_status : "",
      release_date: getInformations.release_date
        ? getInformations.release_date
        : !requestId && dbTitleInformation && dbTitleInformation.release_date
        ? dbTitleInformation.release_date
        : "",
      is_rerelease: getInformations.is_rerelease
        ? getInformations.is_rerelease
        : !requestId && dbTitleInformation && dbTitleInformation.is_rerelease
        ? dbTitleInformation.is_rerelease
        : "",
      re_releasedate: getReReleaseDateList,
      footfalls: getInformations.footfalls
        ? getInformations.footfalls
        : !requestId && dbTitleInformation && dbTitleInformation.footfalls
        ? dbTitleInformation.footfalls
        : "",
      runtime: getInformations.runtime
        ? getInformations.runtime
        : !requestId && dbTitleInformation && dbTitleInformation.runtime
        ? dbTitleInformation.runtime
        : "",
      certification: getInformations.certification
        ? getInformations.certification
        : !requestId && dbTitleInformation && dbTitleInformation.certification
        ? dbTitleInformation.certification
        : "",
      language: getInformations.language
        ? getInformations.language
        : !requestId && dbTitleInformation && dbTitleInformation.language
        ? dbTitleInformation.language
        : "",
      countrylist: getCountryList,
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
