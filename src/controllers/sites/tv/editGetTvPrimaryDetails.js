import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { tmdbService } from "../../../services/index.js";
import { fn, col } from "sequelize";

/**
 * editGetTvPrimaryDetails
 * @param req
 * @param res
 */
export const editGetTvPrimaryDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const titleId = reqBody.title_id;
    const findTitleDetails = await model.title.findOne({
      where: { id: titleId, type: "tv", record_status: "active" },
    });

    if (!findTitleDetails) throw StatusError.badRequest(res.__("Invalid title ID"));

    const requestId = reqBody.request_id ? reqBody.request_id : ""; //It will be request  id
    const siteLanguage = reqBody.site_language;
    const titleType = "tv";
    let titleDetails = {};
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
    let tmdbKeywordsData = [];

    // Get the details from the Title - Check for tmdb and kobis id in title
    let dbTitleInformation = await model.title.findOne({
      attributes: [
        "id",
        "imdb_id",
        "tmdb_id",
        "tiving_id",
        "odk_id",
        "affiliate_link",
        "certification",
        "rating",
        "runtime",
        "language",
        "title_status",
        "release_date",
        "release_date_to",
      ],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["name", "description"],
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
    // IF TMDB ID is present then fetch the details to show Data below input box and For priority details
    if (tmdbId) {
      const [tmdbResults, tmdbKeywordsResults] = await Promise.all([
        tmdbService.fetchTitleDetails(titleType, tmdbId, siteLanguage),
        tmdbService.fetchTitleKeywords(titleType, tmdbId, siteLanguage),
      ]);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";

      // search keyword details from TMDB
      tmdbKeywordsData = tmdbKeywordsResults.results ? tmdbKeywordsResults.results : "";

      tmdbDataDetails.search_keyword_details =
        tmdbKeywordsData && tmdbKeywordsData.keywords ? tmdbKeywordsData.keywords : [];

      // TMDB DATA THAT SHOW BELOW THE INPUT BOX
      tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
      tmdbDataDetails.imdb_id = tmdbData && tmdbData.imdb_id ? tmdbData.imdb_id : "";
      tmdbDataDetails.tmdb_title = tmdbData && tmdbData.title ? tmdbData.title : "";
      tmdbDataDetails.tmdb_summery = tmdbData && tmdbData.overview ? tmdbData.overview : "";
      tmdbDataDetails.tmdb_plot_summery =
        tmdbData && tmdbData.tmdb_plot_summery ? tmdbData.tmdb_plot_summery : "";
      tmdbDataDetails.tmdb_official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
    }

    if (requestId) {
      // Check Request for particular language and fetch the language dependency data
      const checkRequest = await model.titleRequestPrimaryDetails.findOne({
        attributes: ["name", "description", "original_work_details"],
        where: {
          id: requestId,
          type: "tv",
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

      // Get request Credit id if exist
      getInformations.name = checkRequest && checkRequest.name ? checkRequest.name : "";
      getInformations.description =
        checkRequest && checkRequest.description ? checkRequest.description : "";
      getInformations.original_work_details =
        checkRequest && checkRequest.original_work_details
          ? checkRequest.original_work_details
          : "";

      [getCreditDetails, getMediaDetails, getTagDetails, getEpisodeDetails, getSeasonDetails] =
        await Promise.all([
          model.titleRequestCredit.findOne({
            attributes: ["id", "request_id"],
            where: { request_id: requestId, status: "active" },
          }),
          model.titleRequestMedia.findOne({
            attributes: ["id", "request_id"],
            where: { request_id: requestId, status: "active" },
          }),
          model.titleRequestTag.findOne({
            attributes: ["id", "request_id"],
            where: { request_id: requestId, status: "active" },
          }),
          model.titleRequestEpisodeDetails.findOne({
            attributes: ["id", "request_id"],
            where: { request_id: requestId, status: "active" },
          }),
          model.titleRequestSeasonDetails.findOne({
            attributes: ["id", "request_id"],
            where: { request_id: requestId, status: "active" },
          }),
        ]);
      // Get search keyword details
      const searchKeywordDetails = JSON.parse(getInformations.search_keyword_details);
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
                  where: { status: "active" },
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
    } else if (titleId && dbTitleInformation) {
      const dbTitleLangDependentInfo = await model.title.findOne({
        attributes: ["id"],
        include: [
          {
            model: model.titleTranslation,
            attributes: ["name", "description"],
            left: true,
            where: {
              status: "active",
              site_language: siteLanguage,
            },
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
          titleDetails.description = dbTitleLangDependentInfo.titleTranslations[0].description
            ? dbTitleLangDependentInfo.titleTranslations[0].description
            : "";
        }
      }

      // Get search  and news search keyword details
      // Get country details;
      // Get Original By
      // connection Details
      const [keywords, getCountry, getOriginalBy, relatedTitleList] = await Promise.all([
        model.titleKeyword.findAll({
          where: {
            title_id: titleId,
            status: "active",
            season_id: null,
          },
          attributes: ["id", "keyword", "keyword_type"],
          separate: true,
          order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
        }),
        model.titleCountries.findAll({
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
        }),
        model.originalWorks.findAll({
          attributes: ["id", "title_id", "ow_type", "ow_title", "ow_original_artis"],
          where: { title_id: titleId, status: "active", site_language: siteLanguage },
        }),
        model.relatedTitle.findAll({
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
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ],
            },
          ],
        }),
      ]);
      if (keywords.length > 0) {
        for (const eachValue of keywords) {
          if (eachValue && eachValue.keyword_type == "search") {
            getSearchKeywordList.push(eachValue.keyword);
          }
        }
      }
      if (getCountry.length > 0) {
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
      if (getOriginalBy.length > 0) {
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
      if (relatedTitleList.length > 0) {
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
    }

    res.ok({
      request_id: requestId,
      title_id: titleId,
      relation_id:
        getInformations && getInformations.relation_id ? getInformations.relation_id : "",
      credit_request_id: getCreditDetails && getCreditDetails.id ? getCreditDetails.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tag_request_id: getTagDetails && getTagDetails.id ? getTagDetails.id : "",
      season_request_id: getSeasonDetails && getSeasonDetails.id ? getSeasonDetails.id : "",
      episode_request_id: getEpisodeDetails && getEpisodeDetails.id ? getEpisodeDetails.id : "",
      tmdb_id: tmdbId
        ? tmdbId
        : getInformations && getInformations.tmdb_id
        ? getInformations.tmdb_id
        : !requestId && dbTitleInformation && dbTitleInformation.tmdb_id
        ? dbTitleInformation.tmdb_id
        : "",
      imdb_id:
        getInformations && getInformations.imdb_id
          ? getInformations.imdb_id
          : !requestId && dbTitleInformation && dbTitleInformation.imdb_id
          ? dbTitleInformation.imdb_id
          : "",
      tiving_id:
        getInformations && getInformations.tiving_id
          ? getInformations.tiving_id
          : !requestId && dbTitleInformation && dbTitleInformation.tiving_id
          ? dbTitleInformation.tiving_id
          : "",
      odk_id:
        getInformations && getInformations.odk_id
          ? getInformations.odk_id
          : !requestId && dbTitleInformation && dbTitleInformation.odk_id
          ? dbTitleInformation.odk_id
          : "",
      title:
        getInformations && getInformations.name
          ? getInformations.name
          : !requestId && titleDetails.name
          ? titleDetails.name
          : "",
      tmdb_title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      summery:
        getInformations && getInformations.description
          ? getInformations.description
          : !requestId && titleDetails.description
          ? titleDetails.description
          : "",
      tmdb_summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      official_site:
        getInformations && getInformations.affiliate_link
          ? getInformations.affiliate_link
          : !requestId && dbTitleInformation && dbTitleInformation.affiliate_link
          ? dbTitleInformation.affiliate_link
          : "",
      tmdb_official_site: tmdbDataDetails.tmdb_official_site
        ? tmdbDataDetails.tmdb_official_site
        : "",
      search_keyword_details: getSearchKeywordList,
      title_status:
        getInformations && getInformations.title_status
          ? getInformations.title_status
          : !requestId && dbTitleInformation && dbTitleInformation.title_status
          ? dbTitleInformation.title_status
          : "",
      status:
        getInformations && getInformations.request_status ? getInformations.request_status : "",
      release_date:
        getInformations && getInformations.release_date
          ? getInformations.release_date
          : !requestId && dbTitleInformation && dbTitleInformation.release_date
          ? dbTitleInformation.release_date
          : "",
      release_date_to:
        getInformations && getInformations.release_date_to
          ? getInformations.release_date_to
          : !requestId && dbTitleInformation && dbTitleInformation.release_date_to
          ? dbTitleInformation.release_date_to
          : "",
      is_rerelease:
        getInformations && getInformations.is_rerelease
          ? getInformations.is_rerelease
          : !requestId && dbTitleInformation && dbTitleInformation.is_rerelease
          ? dbTitleInformation.is_rerelease
          : "",
      rating:
        getInformations && getInformations.rating
          ? getInformations.rating
          : !requestId && dbTitleInformation && dbTitleInformation.rating
          ? dbTitleInformation.rating
          : "",
      runtime:
        getInformations && getInformations.runtime
          ? getInformations.runtime
          : !requestId && dbTitleInformation && dbTitleInformation.runtime
          ? dbTitleInformation.runtime
          : "",
      certification:
        getInformations && getInformations.certification
          ? getInformations.certification
          : !requestId && dbTitleInformation && dbTitleInformation.certification
          ? dbTitleInformation.certification
          : "",
      language:
        getInformations && getInformations.language
          ? getInformations.language
          : !requestId && dbTitleInformation && dbTitleInformation.language
          ? dbTitleInformation.language
          : "",
      countrylist: getCountryList,
      getoriginalWork_list: getOriginalWorkList,
      getconnection_list: getConnectionList,
    });
  } catch (error) {
    next(error);
  }
};
