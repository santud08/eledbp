import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";

/**
 * addPeoplePrimaryDetails
 * @param req
 * @param res
 */
export const addPeoplePrimaryDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.relation_id;
    data.name = req.body.name ? req.body.name.trim() : null;
    data.known_for = req.body.aka ? req.body.aka : null;
    data.description = req.body.biography ? req.body.biography : null;
    data.gender = req.body.gender ? req.body.gender : null;
    data.birth_date = req.body.birth_date ? req.body.birth_date : null;
    data.death_date = req.body.death_date ? req.body.death_date : null;
    data.tmdb_id = req.body.tmdb_id ? req.body.tmdb_id : null;
    data.kobis_id = req.body.kobis_id ? req.body.kobis_id : null;
    data.tiving_id = req.body.tiving_id ? req.body.tiving_id : null;
    data.odk_id = req.body.odk_id ? req.body.odk_id : null;
    data.official_site = req.body.official_site ? req.body.official_site : null;
    data.facebook_link = req.body.facebook ? req.body.facebook : null;
    data.instagram_link = req.body.instagram ? req.body.instagram : null;
    data.twitter_link = req.body.twitter ? req.body.twitter : null;
    data.imdb_id = req.body.imdb_id ? req.body.imdb_id : null;
    data.site_language = req.body.site_language;

    // Initial request language data
    const firstLangName = data.name;
    const firstLangBiograpgy = data.description;
    // data for other language -> name and biography
    let nameOtherLang = "";
    let biographyOtherLang = "";
    const otherLanguage = data.site_language === "en" ? "ko" : "en";
    if (data.tmdb_id) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(data.tmdb_id, otherLanguage);
      const tmdbData = tmdbResults.results ? tmdbResults.results : "";
      nameOtherLang = tmdbData && tmdbData.people_name ? tmdbData.people_name : "";
      biographyOtherLang = tmdbData && tmdbData.biography ? tmdbData.biography : "";
    }

    // country details
    let country_list = [];

    if (req.body.country) {
      const element = {
        id: "",
        people_id: "",
        country_id: "",
        birth_place: req.body.country,
        site_language: data.site_language,
        status: "",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        created_by: userId,
        updated_by: "",
      };
      country_list.push(element);
    }
    data.country_details = { list: country_list };

    // search keyword  details
    let search_keyword = [];
    if (req.body.search_keyword) {
      const searchKeywordArr = req.body.search_keyword.split(",");
      for (const keyword of searchKeywordArr) {
        const element = {
          id: "",
          people_id: "",
          site_language: data.site_language,
          keyword: keyword,
          keyword_type: "search",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        search_keyword.push(element);
      }
    }
    data.search_keyword_details = { list: search_keyword };

    // news search keyword  details
    let news_keyword = [];
    if (req.body.news_keyword) {
      const newsSearchKeywordArr = req.body.news_keyword.split(",");
      for (const keyword of newsSearchKeywordArr) {
        const element = {
          id: "",
          people_id: "",
          site_language: data.site_language,
          keyword: keyword,
          keyword_type: "news",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        news_keyword.push(element);
      }
    } else {
      if (data.site_language == "en" && data.name) {
        const element = {
          id: "",
          people_id: "",
          site_language: data.site_language,
          keyword: data.name,
          keyword_type: "news",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        news_keyword.push(element);
      }
    }
    data.news_keyword_details = { list: news_keyword };

    // Job details
    let Job_list = [];
    if (req.body.job && req.body.job.length > 0) {
      for (const job of req.body.job) {
        if (job) {
          const element = {
            id: "",
            people_id: "",
            job_id: job,
            list_order: "",
            site_language: data.site_language,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          Job_list.push(element);
        }
      }
    }
    data.job_details = { list: Job_list };

    // Storing TMDB poster Image:
    let tmdbPoster = "";
    if (data.tmdb_id) {
      const isExist = await model.people.findOne({
        where: {
          tmdb_id: data.tmdb_id,
          status: "active",
        },
      });
      if (isExist) throw StatusError.badRequest(res.__("TMDB ID already exist"));
      const tmdbResults = await tmdbService.fetchPeopleDetails(data.tmdb_id, data.site_language);
      const tmdbData = tmdbResults.results ? tmdbResults.results : "";
      tmdbPoster = tmdbData && tmdbData.profile_image ? tmdbData.profile_image : "";
    }

    if (relationId && relationId != "") {
      const peopleRequest = await model.peopleRequestPrimaryDetails.findOne({
        where: {
          relation_id: relationId,
          status: "active",
          request_status: "draft",
          site_language: data.site_language,
        },
      });
      if (!peopleRequest) {
        data.poster =
          req.file && req.file != undefined && req.file.location ? req.file.location : tmdbPoster;
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = data.user_id;
        data.relation_id = relationId;
        const createdRequest = await model.peopleRequestPrimaryDetails.create(data);
        // generating the response data
        const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
          attributes: ["id", "relation_id", "site_language"],
          where: { relation_id: createdRequest.relation_id, site_language: data.site_language },
        });
        let responseDetails = [];
        for (let element of findRequestId) {
          let requiredFormat = {
            user_id: element.user_id,
            draft_request_id: element.id,
            draft_relation_id: element.relation_id,
            draft_site_language: element.site_language,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        //request is already generated for that people and for that language.
        // if request is present for that language fetch and edit
        if (peopleRequest.site_language === data.site_language) {
          data.poster =
            req.file && req.file != undefined && req.file.location
              ? req.file.location
              : peopleRequest.poster;
          data.updated_at = await customDateTimeHelper.getCurrentDateTime();
          data.updated_by = data.user_id;
          await model.peopleRequestPrimaryDetails.update(data, {
            where: {
              relation_id: relationId,
              site_language: data.site_language,
              status: "active",
            },
          });
          // creating response
          const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
            attributes: ["id", "relation_id", "site_language"],
            where: {
              relation_id: peopleRequest.relation_id,
              status: "active",
              site_language: data.site_language,
            },
          });
          let responseDetails = [];
          for (let element of findRequestId) {
            let requiredFormat = {
              user_id: userId,
              draft_request_id: element.id,
              draft_relation_id: element.relation_id,
              draft_site_language: element.site_language,
            };
            responseDetails.push(requiredFormat);
          }
          res.ok({ data: responseDetails });
        } else {
          throw StatusError.badRequest(res.__("languageDoesnotMatched"));
        }
      }
    } else {
      // Creating Request ID for the first time
      data.poster =
        req.file && req.file != undefined && req.file.location ? req.file.location : tmdbPoster;
      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = data.user_id;

      // generating relation Id for the first time
      const createdRequest = await model.peopleRequestPrimaryDetails.create(data);

      // updating the relation_id with respect to request_id
      data.relation_id = createdRequest.id;

      await model.peopleRequestPrimaryDetails.update(data, {
        where: { id: createdRequest.id, status: "active" },
      });

      // creating record for other langugae:
      data.site_language = otherLanguage;
      data.name = nameOtherLang ? nameOtherLang : firstLangName;
      data.description = biographyOtherLang ? biographyOtherLang : firstLangBiograpgy;
      await model.peopleRequestPrimaryDetails.create(data);
      // creating response
      const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
        attributes: ["id", "relation_id", "site_language"],
        where: { relation_id: data.relation_id, status: "active" },
      });
      let responseDetails = [];
      for (let element of findRequestId) {
        let requiredFormat = {
          user_id: userId,
          draft_request_id: element.id,
          draft_relation_id: element.relation_id,
          draft_site_language: element.site_language,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
