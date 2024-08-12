import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { tmdbService, kobisService } from "../../../services/index.js";
import { envs } from "../../../config/index.js";
import { Op, fn, col } from "sequelize";

/**
 * editShowPeoplePrimaryDetails
 * @param req
 * @param res
 */
export const editShowPeoplePrimaryDetails = async (req, res, next) => {
  try {
    let tmdbData = {};
    let kobisData = {};
    let kobisDataDetails = {};
    let tmdbDataDetails = {};
    let getSearchKeywordList = [],
      getNewsKeywordList = [],
      getJobList = [];

    let getInformations = {};
    let getMediaDetails = {};
    let peopleDetails = {};

    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const siteLanguage = req.query.site_language;
    const relationId = req.query.relation_id ? req.query.relation_id : "";
    const peopleId = req.query.people_id ? req.query.people_id : "";

    // Get people Information
    let dbPeopleInformation = await model.people.findOne({
      attributes: [
        "id",
        "gender",
        "birth_date",
        "death_date",
        [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
        "kobis_id",
        "imdb_id",
        "tmdb_id",
        "tiving_id",
        "odk_id",
        "official_site",
        "facebook_link",
        "instagram_link",
        "twitter_link",
      ],
      include: [
        {
          model: model.peopleTranslation,
          attributes: ["people_id", "name", "description", "known_for", "birth_place"],
          left: true,
          where: {
            status: "active",
          },
          separate: true,
          order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
          required: false,
        },
      ],
      where: {
        id: peopleId,
        status: "active",
      },
    });

    // Get TMDB Details
    if (dbPeopleInformation && dbPeopleInformation.tmdb_id) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(
        dbPeopleInformation.tmdb_id,
        siteLanguage,
      );
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
      tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
      tmdbDataDetails.imdb_id = tmdbData && tmdbData.imdb_id ? tmdbData.imdb_id : "";
      tmdbDataDetails.name = tmdbData && tmdbData.people_name ? tmdbData.people_name : "";
      tmdbDataDetails.birth_day = tmdbData && tmdbData.birth_day ? tmdbData.birth_day : "";
      tmdbDataDetails.death_day = tmdbData && tmdbData.death_day ? tmdbData.death_day : "";
      tmdbDataDetails.aka = tmdbData && tmdbData.also_known_as ? tmdbData.also_known_as : "";
      tmdbDataDetails.biography = tmdbData && tmdbData.biography ? tmdbData.biography : "";
      tmdbDataDetails.poster = tmdbData && tmdbData.profile_image ? tmdbData.profile_image : "";
      tmdbDataDetails.official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
    }

    //Get KOBIS Details
    if (dbPeopleInformation && dbPeopleInformation.kobis_id) {
      const kobisResults = await kobisService.fetchPeopleDetails(
        dbPeopleInformation.kobis_id,
        siteLanguage,
      );
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
          site_language: siteLanguage,
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
          "death_date",
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

      // Get country details
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
    } else if (dbPeopleInformation) {
      // people details from translation table
      const dbLanguageDepenentInformation = await model.people.findOne({
        attributes: ["id"],
        include: [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "description", "known_for", "birth_place"],
            left: true,
            where: {
              status: "active",
              site_language: siteLanguage,
            },
            required: false,
          },
        ],
        where: {
          id: peopleId,
          status: "active",
        },
      });
      if (dbPeopleInformation.peopleTranslations.length > 0) {
        peopleDetails.known_for = dbPeopleInformation.peopleTranslations[0].known_for
          ? dbPeopleInformation.peopleTranslations[0].known_for
          : "";
      }
      if (dbLanguageDepenentInformation.peopleTranslations.length > 0) {
        peopleDetails.name = dbLanguageDepenentInformation.peopleTranslations[0].name
          ? dbLanguageDepenentInformation.peopleTranslations[0].name
          : "";
        peopleDetails.description = dbLanguageDepenentInformation.peopleTranslations[0].description
          ? dbLanguageDepenentInformation.peopleTranslations[0].description
          : "";
      }

      const peopleImageDetails = await model.peopleImages.findOne({
        attributes: [
          "id",
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        ],
        where: {
          people_id: peopleId,
          image_category: "poster_image",
          status: "active",
        },
        separate: true,
        order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
      });
      peopleDetails.poster =
        peopleImageDetails && peopleImageDetails.path ? peopleImageDetails.path : "";
      // Get Country - Country details
      const countryList = await model.peopleCountries.findAll({
        attributes: ["people_id", "country_id", "birth_place"],
        where: { people_id: peopleId, birth_place: { [Op.ne]: null }, status: "active" },
      });
      if (countryList.length > 0) {
        for (const value of countryList) {
          if (value) {
            getInformations.country_name = value.birth_place ? value.birth_place : "";
          }
        }
      }

      // Get People Department- For JOB field
      const jobList = await model.peopleJobs.findAll({
        attributes: ["people_id", "job_id"],
        where: { people_id: peopleId, status: "active" },
        include: [
          {
            model: model.department,
            left: true,
            attributes: ["id"],
            where: { status: "active" },
            required: true,
            include: {
              model: model.departmentTranslation,
              attributes: ["department_id", "department_name", "site_language"],
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
      if (jobList.length > 0) {
        for (const value of jobList) {
          if (value) {
            const element = {
              id: value.job_id ? value.job_id : "",
              job:
                value.department &&
                value.department.departmentTranslations.length > 0 &&
                value.department.departmentTranslations[0].department_name
                  ? value.department.departmentTranslations[0].department_name
                  : "",
            };
            getJobList.push(element);
          }
        }
      }

      // Get people search Keyword details:
      const searchKeywordList = await model.peopleKeywords.findAll({
        attributes: ["keyword"],
        where: {
          people_id: peopleId,
          keyword_type: "search",
          status: "active",
        },
      });
      if (searchKeywordList) {
        for (const value of searchKeywordList) {
          if (value) {
            const record = {
              search_keyword: value.keyword ? value.keyword : "",
            };
            getSearchKeywordList.push(record);
          }
        }
      }

      // Get people search Keyword details:
      const newsKeywordList = await model.peopleKeywords.findAll({
        where: {
          people_id: peopleId,
          keyword_type: "news",
          status: "active",
        },
      });
      if (newsKeywordList) {
        for (const value of newsKeywordList) {
          if (value) {
            const record = {
              news_keyword: value.keyword ? value.keyword : "",
            };
            getNewsKeywordList.push(record);
          }
        }
      }
    }
    res.ok({
      relation_id: relationId,
      people_id: peopleId,
      request_id: getInformations && getInformations.id ? getInformations.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tmdb_id:
        getInformations && getInformations.tmdb_id
          ? getInformations.tmdb_id
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && dbPeopleInformation.tmdb_id
          ? dbPeopleInformation.tmdb_id
          : "",
      tiving_id:
        getInformations && getInformations.tiving_id
          ? getInformations.tiving_id
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && dbPeopleInformation.tiving_id
          ? dbPeopleInformation.tiving_id
          : "",
      odk_id:
        getInformations && getInformations.odk_id
          ? getInformations.odk_id
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && dbPeopleInformation.odk_id
          ? dbPeopleInformation.odk_id
          : "",
      imdb_id:
        getInformations && getInformations.imdb_id
          ? getInformations.imdb_id
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && dbPeopleInformation.imdb_id
          ? dbPeopleInformation.imdb_id
          : "",
      kobis_id:
        getInformations && getInformations.kobis_id
          ? getInformations.kobis_id
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && dbPeopleInformation.kobis_id
          ? dbPeopleInformation.kobis_id
          : "",
      name:
        getInformations && getInformations.name
          ? getInformations.name
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && peopleDetails.name
          ? peopleDetails.name
          : "",
      tmdb_name: tmdbDataDetails.name ? tmdbDataDetails.name : "",
      kobis_name: kobisDataDetails.name ? kobisDataDetails.name : "",
      poster:
        getInformations && getInformations.poster
          ? getInformations.poster
          : isPeopleRequestExist.length == 0 && peopleDetails.poster
          ? peopleDetails.poster
          : "",
      tmdb_poster: tmdbDataDetails.poster ? tmdbDataDetails.poster : "",
      kobis_poster: kobisDataDetails.poster ? kobisDataDetails.poster : "",
      gender:
        getInformations && getInformations.gender
          ? getInformations.gender
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && dbPeopleInformation.gender
          ? dbPeopleInformation.gender
          : "",
      birth_date:
        getInformations && getInformations.birth_date
          ? getInformations.birth_date
          : isPeopleRequestExist.length == 0 &&
            dbPeopleInformation &&
            dbPeopleInformation.birth_date
          ? dbPeopleInformation.birth_date
          : "",
      tmdb_birth_date: tmdbDataDetails.birth_day ? tmdbDataDetails.birth_day : "",
      kobis_birth_date: kobisDataDetails.birth_day ? kobisDataDetails.birth_day : "",
      death_date:
        getInformations && getInformations.death_date
          ? getInformations.death_date
          : isPeopleRequestExist.length == 0 &&
            dbPeopleInformation &&
            dbPeopleInformation.death_date
          ? dbPeopleInformation.death_date
          : "",
      tmdb_death_date: tmdbDataDetails.death_date ? tmdbDataDetails.death_date : "",
      kobis_death_date: kobisDataDetails.death_date ? kobisDataDetails.death_date : "",
      aka:
        getInformations && getInformations.known_for
          ? getInformations.known_for
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && peopleDetails.known_for
          ? peopleDetails.known_for
          : "",
      tmdb_aka: tmdbDataDetails.aka ? tmdbDataDetails.aka : "",
      kobis_aka: kobisDataDetails.aka ? kobisDataDetails.aka : "",
      biography:
        getInformations && getInformations.description
          ? getInformations.description
          : isPeopleRequestExist.length == 0 && dbPeopleInformation && peopleDetails.description
          ? peopleDetails.description
          : "",
      tmdb_biography: tmdbDataDetails.biography ? tmdbDataDetails.biography : "",
      kobis_biography: kobisDataDetails.biography ? kobisDataDetails.biography : "",
      official_site:
        getInformations && getInformations.official_site
          ? getInformations.official_site
          : isPeopleRequestExist.length == 0 &&
            dbPeopleInformation &&
            dbPeopleInformation.official_site
          ? dbPeopleInformation.official_site
          : "",
      tmdb_official_site: tmdbDataDetails.official_site ? tmdbDataDetails.official_site : "",
      kobis_official_site: kobisDataDetails.official_site ? kobisDataDetails.official_site : "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsKeywordList,
      facebook:
        getInformations && getInformations.facebook_link
          ? getInformations.facebook_link
          : isPeopleRequestExist.length == 0 &&
            dbPeopleInformation &&
            dbPeopleInformation.facebook_link
          ? dbPeopleInformation.facebook_link
          : "",
      instagram:
        getInformations && getInformations.instagram_link
          ? getInformations.instagram_link
          : isPeopleRequestExist.length == 0 &&
            dbPeopleInformation &&
            dbPeopleInformation.instagram_link
          ? dbPeopleInformation.instagram_link
          : "",
      twitter:
        getInformations && getInformations.twitter_link
          ? getInformations.twitter_link
          : isPeopleRequestExist.length == 0 &&
            dbPeopleInformation &&
            dbPeopleInformation.twitter_link
          ? dbPeopleInformation.twitter_link
          : "",
      countrylist: getInformations.country_name ? getInformations.country_name : "",
      job: getJobList,
    });
  } catch (error) {
    next(error);
  }
};
