import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { tmdbService, kobisService, priorityService } from "../../../services/index.js";

/**
 * showPeoplePrimaryDetails
 * @param req
 * @param res
 */
export const showPeoplePrimaryDetails = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.query.relation_id ? req.query.relation_id : "";
    const kobisId = req.query.kobis_id ? req.query.kobis_id : "";
    const tmdbId = req.query.tmdb_id ? req.query.tmdb_id : "";
    const siteLanguage = req.query.site_language;
    const type = "people";
    let tmdbData = {};
    let kobisData = {};
    let kobisDataDetails = {};
    let tmdbDataDetails = {};
    let priorityResults = {};
    let getSearchKeywordList = [],
      getNewsKeywordList = [],
      getJobList = [];

    let getInformations = {};
    let getMediaDetails = {};

    // Get TMDB Details
    if (tmdbId) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(tmdbId, siteLanguage);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
      tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
      tmdbDataDetails.imdb_id = tmdbData && tmdbData.imdb_id ? tmdbData.imdb_id : "";
      tmdbDataDetails.name = tmdbData && tmdbData.people_name ? tmdbData.people_name : "";
      tmdbDataDetails.birth_day = tmdbData && tmdbData.birth_day ? tmdbData.birth_day : "";
      tmdbDataDetails.death_day = tmdbData && tmdbData.death_day ? tmdbData.death_day : "";
      tmdbDataDetails.aka =
        tmdbData && tmdbData.also_known_as && tmdbData.also_known_as.length > 0
          ? tmdbData.also_known_as
          : "";
      tmdbDataDetails.biography = tmdbData && tmdbData.biography ? tmdbData.biography : "";
      tmdbDataDetails.poster = tmdbData && tmdbData.profile_image ? tmdbData.profile_image : "";
      tmdbDataDetails.official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
    }

    //Get KOBIS Details
    if (kobisId) {
      const kobisResults = await kobisService.fetchPeopleDetails(kobisId, siteLanguage);
      kobisData = kobisResults.results ? kobisResults.results : "";

      kobisDataDetails.kobis_id = kobisData && kobisData.kobis_id ? kobisData.kobis_id : "";
      kobisDataDetails.name = kobisData && kobisData.people_name ? kobisData.people_name : "";
      kobisDataDetails.birth_day = kobisData && kobisData.birth_day ? kobisData.birth_day : "";
      kobisDataDetails.poster = kobisData && kobisData.profile_image ? kobisData.profile_image : "";
      kobisDataDetails.aka = kobisData && kobisData.also_known_as ? kobisData.also_known_as : "";
      kobisDataDetails.biography = kobisData && kobisData.biography ? kobisData.biography : "";
      kobisDataDetails.official_site =
        kobisData && kobisData.homepages && kobisData.homepages.length > 0
          ? kobisData.homepage
          : "";
    }

    let isPeopleRequestExist = [];
    if (relationId) {
      isPeopleRequestExist = await model.peopleRequestPrimaryDetails.findAll({
        where: {
          relation_id: relationId,
          request_status: "draft",
          status: "active",
        },
      });
    }

    if (isPeopleRequestExist.length > 0) {
      const checkRequest = await model.peopleRequestPrimaryDetails.findOne({
        attributes: ["name", "description", "request_status", "site_language"],
        where: {
          relation_id: relationId,
          site_language: siteLanguage,
          request_status: "draft",
          status: "active",
        },
      });

      getInformations = await model.peopleRequestPrimaryDetails.findOne({
        attributes: [
          "id",
          "relation_id",
          "known_for",
          "gender",
          "birth_date",
          "poster",
          "kobis_id",
          "imdb_id",
          "tmdb_id",
          "tiving_id",
          "odk_id",
          "official_site",
          "facebook_link",
          "instagram_link",
          "twitter_link",
          "views",
          "allow_update",
          "fully_synced",
          "popularity",
          "death_date",
          "adult",
          "search_keyword_details",
          "news_keyword_details",
          "country_details",
          "job_details",
          "request_status",
          "site_language",
        ],
        where: {
          relation_id: relationId,
          request_status: "draft",
          status: "active",
        },
      });
      getInformations.name = checkRequest && checkRequest.name ? checkRequest.name : "";
      getInformations.description =
        checkRequest && checkRequest.description ? checkRequest.description : "";

      // Get request Media id if exist
      getMediaDetails = await model.peopleRequestMedia.findOne({
        attributes: ["id", "request_id"],
        where: { request_id: getInformations.id, status: "active" },
      });

      // Get search keyword details
      const searchKeywordDetails =
        getInformations.search_keyword_details != null
          ? JSON.parse(getInformations.search_keyword_details)
          : null;
      if (searchKeywordDetails && searchKeywordDetails.list.length > 0) {
        let list = [];
        for (const searchKeyword of searchKeywordDetails.list) {
          if (searchKeyword) {
            const keyword = searchKeyword.keyword ? searchKeyword.keyword : "";
            const record = {
              search_keyword: keyword,
            };
            list.push(record);
          }
          getSearchKeywordList = list;
        }
      }

      // Get news keyword details
      const newsKeywordDetails =
        getInformations.news_keyword_details != null
          ? JSON.parse(getInformations.news_keyword_details)
          : null;
      if (newsKeywordDetails && newsKeywordDetails.list.length > 0) {
        let list = [];
        for (const newsKeyword of newsKeywordDetails.list) {
          if (newsKeyword) {
            const keyword = newsKeyword.keyword ? newsKeyword.keyword : "";
            const record = {
              news_keyword: keyword,
            };
            list.push(record);
          }
          getNewsKeywordList = list;
        }
      }

      // Get country details
      const countryDetails =
        getInformations.country_details != null
          ? JSON.parse(getInformations.country_details)
          : null;
      if (countryDetails && countryDetails.list.length > 0) {
        for (const eachCountry of countryDetails.list) {
          if (eachCountry) {
            getInformations.country_name = eachCountry.birth_place ? eachCountry.birth_place : "";
          }
        }
      }

      // Get Job details
      const jobDetails =
        getInformations.job_details != null ? JSON.parse(getInformations.job_details) : null;
      if (jobDetails && jobDetails.list.length > 0) {
        let list = [];
        for (const eachJob of jobDetails.list) {
          if (eachJob.job_id) {
            const id = eachJob.job_id;
            // Get country name
            const getJob = await model.department.findOne({
              attributes: ["id"],
              where: { id: id, status: "active" },
              include: [
                {
                  model: model.departmentTranslation,
                  left: true,
                  attributes: ["department_name"],
                  where: {
                    status: "active",
                  },
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ],
            });
            if (getJob) {
              const jobName = getJob.departmentTranslations[0].department_name
                ? getJob.departmentTranslations[0].department_name
                : "";
              const record = {
                id: id,
                job: jobName,
              };
              list.push(record);
            }
          }
          getJobList = list;
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
        where: { type: type, status: "active" },
      });

      // calling the priority service for auto-fill:
      priorityResults = await priorityService.autoFillPeoplePriorityDetails(
        priorityDetails,
        tmdbData,
        kobisData,
        siteLanguage,
      );
    }

    res.ok({
      relation_id: relationId,
      request_id: getInformations && getInformations.id ? getInformations.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tmdb_id: getInformations.tmdb_id
        ? getInformations.tmdb_id
        : tmdbDataDetails.tmdb_id
        ? tmdbDataDetails.tmdb_id
        : "",
      tiving_id: getInformations && getInformations.tiving_id ? getInformations.tiving_id : "",
      odk_id: getInformations && getInformations.odk_id ? getInformations.odk_id : "",
      imdb_id: getInformations.imdb_id
        ? getInformations.imdb_id
        : tmdbDataDetails.imdb_id
        ? tmdbDataDetails.imdb_id
        : "",
      kobis_id: getInformations.kobis_id
        ? getInformations.kobis_id
        : kobisDataDetails.kobis_id
        ? kobisDataDetails.kobis_id
        : "",
      name: getInformations.name
        ? getInformations.name
        : priorityResults.name
        ? priorityResults.name
        : "",
      tmdb_name: tmdbDataDetails.name ? tmdbDataDetails.name : "",
      kobis_name: kobisDataDetails.name ? kobisDataDetails.name : "",
      poster:
        getInformations && getInformations.poster
          ? getInformations.poster
          : tmdbDataDetails.poster
          ? tmdbDataDetails.poster
          : "",
      kobis_poster: kobisDataDetails.poster ? kobisDataDetails.poster : "",
      gender: getInformations.gender
        ? getInformations.gender
        : priorityResults.gender
        ? priorityResults.gender
        : "",
      birth_date: getInformations.birth_date
        ? getInformations.birth_date
        : priorityResults.birth_date
        ? priorityResults.birth_date
        : "",
      tmdb_birth_date: tmdbDataDetails.birth_day ? tmdbDataDetails.birth_day : "",
      kobis_birth_date: kobisDataDetails.birth_day ? kobisDataDetails.birth_day : "",
      death_date: getInformations.death_date
        ? getInformations.death_date
        : priorityResults.death_date
        ? priorityResults.death_date
        : "",
      tmdb_death_date: tmdbDataDetails.death_day ? tmdbDataDetails.death_day : "",
      kobis_death_date: kobisDataDetails.death_date ? kobisDataDetails.death_date : "",
      aka: getInformations.known_for
        ? getInformations.known_for
        : priorityResults.aka
        ? priorityResults.aka
        : "",
      tmdb_aka: tmdbDataDetails.aka ? tmdbDataDetails.aka : "",
      kobis_aka: kobisDataDetails.aka ? kobisDataDetails.aka : "",
      biography: getInformations.description
        ? getInformations.description
        : priorityResults.biography
        ? priorityResults.biography
        : "",
      tmdb_biography: tmdbDataDetails.biography ? tmdbDataDetails.biography : "",
      kobis_biography: kobisDataDetails.biography ? kobisDataDetails.biography : "",
      official_site: getInformations.official_site
        ? getInformations.official_site
        : priorityResults.official_site
        ? priorityResults.official_site
        : "",
      tmdb_official_site: tmdbDataDetails.official_site ? tmdbDataDetails.official_site : "",
      kobis_official_site: kobisDataDetails.official_site ? kobisDataDetails.official_site : "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsKeywordList,
      facebook: getInformations.facebook_link ? getInformations.facebook_link : "",
      instagram: getInformations.instagram_link ? getInformations.instagram_link : "",
      twitter: getInformations.twitter_link ? getInformations.twitter_link : "",
      countrylist: getInformations.country_name
        ? getInformations.country_name
        : priorityResults.country_name
        ? priorityResults.country_name
        : "",
      job:
        getJobList.length > 0
          ? getJobList
          : priorityResults.job && priorityResults.job.length > 0
          ? priorityResults.job
          : [],
    });
  } catch (error) {
    next(error);
  }
};
