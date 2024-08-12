import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { tmdbService, priorityService } from "../../../services/index.js";
import { fn, col } from "sequelize";

/**
 * getTvPrimaryDetails
 * @param req
 * @param res
 */
export const getTvPrimaryDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const requestId = reqBody.request_id ? reqBody.request_id : ""; //It will be request  id
    const language = reqBody.site_language;
    const tmdbId = reqBody.tmdb_id ? reqBody.tmdb_id : "";
    const titleType = "tv";
    let tmdbData = {};
    let getSearchKeywordList = [],
      getOriginalWorkList = [],
      getCountryList = [],
      getConnectionList = [];

    let tmdbDataDetails = {};
    let getInformations = {};
    let getCreditDetails = {};
    let getMediaDetails = {};
    let getTagDetails = {};
    let getSeasonDetails = {};
    let getEpisodeDetails = {};
    let priorityResults = {};
    let tmdbKeywordsData = [];

    // IF TMDB ID is present then fetch the details to show Data below input box and For priority details
    if (tmdbId) {
      const [
        tmdbResults,
        //tmdbKeywordsResults,
        tmdbTitleAkaResult,
        tmdbTitleCertification,
        getImdbId,
      ] = await Promise.all([
        tmdbService.fetchTitleDetails(titleType, tmdbId, language),
        //tmdbService.fetchTitleKeywords(titleType, tmdbId, language),
        tmdbService.fetchTitleAka(titleType, tmdbId, language),
        tmdbService.fetchTitleCertification(titleType, tmdbId, "ko"),
        tmdbService.fetchTitleImdbId(titleType, tmdbId, language),
      ]);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";

      // search keyword details from TMDB
      tmdbKeywordsData = "";

      tmdbDataDetails.search_keyword_details =
        tmdbKeywordsData && tmdbKeywordsData.keywords ? tmdbKeywordsData.keywords : [];

      // AKA details from TMDB
      tmdbData.aka =
        tmdbTitleAkaResult.results && tmdbTitleAkaResult.results.aka
          ? tmdbTitleAkaResult.results.aka
          : "";
      // Certification details from TMDB
      tmdbData.certification =
        tmdbTitleCertification.results && tmdbTitleCertification.results.certification_key
          ? tmdbTitleCertification.results.certification_key
          : "";

      // IMDB ID details from TMDB
      tmdbData.imdb_id =
        getImdbId && getImdbId.results && getImdbId.results.imdb_id
          ? getImdbId.results.imdb_id
          : "";
      // TMDB DATA THAT SHOW BELOW THE INPUT BOX
      tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
      tmdbDataDetails.imdb_id = tmdbData.imdb_id;
      tmdbDataDetails.tmdb_title = tmdbData && tmdbData.title ? tmdbData.title : "";
      tmdbDataDetails.tmdb_summery = tmdbData && tmdbData.overview ? tmdbData.overview : "";
      tmdbDataDetails.tmdb_plot_summery =
        tmdbData && tmdbData.tmdb_plot_summery ? tmdbData.tmdb_plot_summery : "";
      tmdbDataDetails.tmdb_official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
      tmdbData.runtime =
        tmdbData.episode_run_time &&
        tmdbData.episode_run_time != null &&
        tmdbData.episode_run_time != "undefined" &&
        tmdbData.episode_run_time.length > 0 &&
        tmdbData.episode_run_time[0]
          ? tmdbData.episode_run_time[0]
          : null;
    }

    if (requestId) {
      // Check Request for particular language and fetch the language dependency data
      const checkRequest = await model.titleRequestPrimaryDetails.findOne({
        attributes: ["name", "description", "original_work_details"],
        where: {
          id: requestId,
          type: "tv",
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
          "release_date_to",
          "imdb_id",
          "tmdb_id",
          "kobis_id",
          "tiving_id",
          "odk_id",
          "affiliate_link",
          "certification",
          "is_rerelease",
          "search_keyword_details",
          "title_status",
          "request_status",
          "country_details",
          "rating",
          "runtime",
          "language",
          "original_work_details",
          "original_title",
          "connection_details",
        ],
        where: {
          id: requestId,
          type: "tv",
          status: "active",
          request_status: "draft",
        },
      });

      getInformations.name = checkRequest && checkRequest.name ? checkRequest.name : "";
      getInformations.description =
        checkRequest && checkRequest.description ? checkRequest.description : "";
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
      // Get request Episode id if exist
      getEpisodeDetails = await model.titleRequestEpisodeDetails.findOne({
        attributes: ["id", "request_id"],
        where: { request_id: requestId, status: "active" },
      });
      // Get request Season id if exist
      getSeasonDetails = await model.titleRequestSeasonDetails.findOne({
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
              const countryName =
                getCountry.countryTranslations[0] && getCountry.countryTranslations[0].country_name
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
    } else if (tmdbId) {
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
      const kobisData = {}; // KOBIS is only for movie

      priorityResults = await priorityService.autoFillTitlePriorityDetails(
        priorityDetails,
        tmdbData,
        kobisData,
        tmdbKeywordsData,
        titleType,
        language,
      );
    }

    res.ok({
      request_id: requestId,
      relation_id:
        getInformations && getInformations.relation_id ? getInformations.relation_id : "",
      credit_request_id: getCreditDetails && getCreditDetails.id ? getCreditDetails.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tag_request_id: getTagDetails && getTagDetails.id ? getTagDetails.id : "",
      season_request_id: getSeasonDetails && getSeasonDetails.id ? getSeasonDetails.id : "",
      episode_request_id: getEpisodeDetails && getEpisodeDetails.id ? getEpisodeDetails.id : "",
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
      title: getInformations.name
        ? getInformations.name
        : priorityResults.name
        ? priorityResults.name
        : "",
      tmdb_title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      aka: getInformations.aka
        ? getInformations.aka
        : priorityResults.aka
        ? priorityResults.aka
        : "",
      tmdb_aka: tmdbData.aka ? tmdbData.aka : "",
      summery: getInformations.description
        ? getInformations.description
        : priorityResults.summary
        ? priorityResults.summary
        : "",
      tmdb_summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      official_site: getInformations.affiliate_link
        ? getInformations.affiliate_link
        : priorityResults.official_site
        ? priorityResults.official_site
        : "",
      tmdb_official_site: tmdbDataDetails.tmdb_official_site
        ? tmdbDataDetails.tmdb_official_site
        : "",
      search_keyword_details: requestId
        ? getSearchKeywordList
        : !requestId && priorityResults.search_keywords
        ? priorityResults.search_keywords
        : [],
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
      release_date_to: getInformations.release_date_to
        ? getInformations.release_date_to
        : tmdbData.release_date_to
        ? tmdbData.release_date_to
        : "",
      is_rerelease: getInformations.is_rerelease ? getInformations.is_rerelease : "",
      rating: getInformations.rating ? getInformations.rating : "",
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
      getconnection_list: getConnectionList,
    });
  } catch (error) {
    next(error);
  }
};
