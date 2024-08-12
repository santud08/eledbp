import model from "../../../models/index.js";
import { peopleService } from "../../../services/index.js";

/**
 * tmdbRefreshPrimaryDetails
 * @param req
 * @param res
 */
export const tmdbRefreshPrimaryDetails = async (req, res, next) => {
  try {
    const tmdbId = req.query.tmdb_id;
    const peopleId = req.query.people_id;
    const language = req.query.site_language;

    let getSearchKeywordList = [],
      getNewsKeywordList = [],
      getJobList = [],
      otherPeopleData = {},
      peopleResponse = {};

    if (tmdbId && language) {
      // TMDB Data
      peopleResponse = await peopleService.getTmdbRefreshPrimaryDetails(tmdbId, language);

      // Other Data:
      otherPeopleData = await model.people.findOne({
        attributes: [
          "id",
          "tmdb_id",
          "kobis_id",
          "odk_id",
          "tiving_id",
          "facebook_link",
          "instagram_link",
          "twitter_link",
        ],
        where: {
          id: peopleId,
          status: "active",
        },
      });

      // Getting Job Details:
      if (peopleResponse && peopleResponse.job) {
        const jobValue = peopleResponse.job == "Acting" ? "Actors" : peopleResponse.job;
        if (jobValue) {
          const jobDetails = await model.department.findOne({
            attributes: ["id"],
            where: {
              department_name: jobValue,
              status: "active",
            },
            include: [
              {
                model: model.departmentTranslation,
                attributes: ["id", "department_id", "department_name"],
                left: true,
                where: {
                  status: "active",
                  site_language: language,
                },
              },
            ],
          });
          if (jobDetails) {
            const element = {
              id: jobDetails.id,
              job:
                jobDetails &&
                jobDetails.departmentTranslations &&
                jobDetails.departmentTranslations[0] &&
                jobDetails.departmentTranslations[0].department_name
                  ? jobDetails.departmentTranslations[0].department_name
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
      relation_id: "",
      request_id: "",
      media_request_id: "",
      tmdb_id: tmdbId,
      tiving_id: otherPeopleData && otherPeopleData.tiving_id ? otherPeopleData.tiving_id : "",
      odk_id: otherPeopleData && otherPeopleData.odk_id ? otherPeopleData.odk_id : "",
      imdb_id: peopleResponse && peopleResponse.imdb_id ? peopleResponse.imdb_id : "",
      kobis_id: otherPeopleData && otherPeopleData.kobis_id ? otherPeopleData.kobis_id : "",
      name: peopleResponse && peopleResponse.name ? peopleResponse.name : "",
      tmdb_name: "",
      kobis_name: "",
      poster: peopleResponse && peopleResponse.poster ? peopleResponse.poster : "",
      tmdb_poster: "",
      kobis_poster: "",
      gender: peopleResponse && peopleResponse.gender ? peopleResponse.gender : "",
      birth_date: peopleResponse && peopleResponse.birth_day ? peopleResponse.birth_day : "",
      tmdb_birth_date: "",
      kobis_birth_date: "",
      death_date: peopleResponse && peopleResponse.death_day ? peopleResponse.death_day : "",
      tmdb_death_date: "",
      kobis_death_date: "",
      aka: peopleResponse && peopleResponse.aka ? peopleResponse.aka : "",
      tmdb_aka: "",
      kobis_aka: "",
      biography: peopleResponse && peopleResponse.biography ? peopleResponse.biography : "",
      tmdb_biography: "",
      kobis_biography: "",
      official_site:
        peopleResponse && peopleResponse.official_site ? peopleResponse.official_site : "",
      tmdb_official_site: "",
      kobis_official_site: "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsKeywordList,
      facebook: otherPeopleData.facebook_link ? otherPeopleData.facebook_link : "",
      instagram: otherPeopleData.instagram_link ? otherPeopleData.instagram_link : "",
      twitter: otherPeopleData.twitter_link ? otherPeopleData.twitter_link : "",
      countrylist:
        peopleResponse && peopleResponse.place_of_birth ? peopleResponse.place_of_birth : "",
      job: getJobList,
    });
  } catch (error) {
    next(error);
  }
};
