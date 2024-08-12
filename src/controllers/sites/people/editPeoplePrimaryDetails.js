import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { tmdbService } from "../../../services/index.js";

/**
 * editPeoplePrimaryDetails
 * @param req
 * @param res
 */
export const editPeoplePrimaryDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.relation_id;
    data.people_id = req.body.people_id ? req.body.people_id : null;
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
    data.imdb_id = req.body.imdb_id ? req.body.imdb_id : null;
    data.official_site = req.body.official_site ? req.body.official_site : null;
    data.facebook_link = req.body.facebook ? req.body.facebook : null;
    data.instagram_link = req.body.instagram ? req.body.instagram : null;
    data.twitter_link = req.body.twitter ? req.body.twitter : null;

    const imageAction = req.body.image_action ? req.body.image_action : "";

    // site_langugae
    data.site_language = req.body.site_language;

    const peopleDetails = await model.people.findOne({
      where: { id: data.people_id, status: "active" },
    });

    if (!peopleDetails) throw StatusError.badRequest(res.__("Invalid People Id"));
    // check for tmdb already exists:
    if (data.tmdb_id) {
      const tmdbExists = await model.people.findOne({
        where: {
          tmdb_id: data.tmdb_id,
          status: "active",
          id: {
            [Op.ne]: data.people_id,
          },
        },
      });
      if (tmdbExists) throw StatusError.badRequest(res.__("TMDB ID already exist"));
    }
    // check for odk_id already exists:
    if (data.odk_id) {
      const odkExists = await model.people.findOne({
        where: {
          odk_id: data.odk_id,
          status: "active",
          id: {
            [Op.ne]: data.people_id,
          },
        },
      });
      if (odkExists) throw StatusError.badRequest(res.__("ODK ID already exist"));
    }
    // check for Kobis id already exists:
    if (data.kobis_id) {
      const kobisExists = await model.people.findOne({
        where: {
          kobis_id: data.kobis_id,
          status: "active",
          id: {
            [Op.ne]: data.people_id,
          },
        },
      });
      if (kobisExists) throw StatusError.badRequest(res.__("KOBIS ID already exist"));
    }

    // Getting poster image from TMDB:
    // Storing TMDB poster Image:
    let tmdbPoster = "";
    if (data.tmdb_id) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(data.tmdb_id, data.site_language);
      const tmdbData = tmdbResults.results ? tmdbResults.results : "";
      tmdbPoster = tmdbData && tmdbData.profile_image ? tmdbData.profile_image : "";
    }

    // country details
    let countryListDetails = [];

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
      countryListDetails.push(element);
    }

    data.country_details = { list: countryListDetails };

    // search keyword  details
    let searchKeywords = [];
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
        searchKeywords.push(element);
      }
    }
    data.search_keyword_details = { list: searchKeywords };

    // news search keyword  details
    let newsKeywords = [];
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
        newsKeywords.push(element);
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
        newsKeywords.push(element);
      }
    }
    data.news_keyword_details = { list: newsKeywords };

    // Job details
    let JobListDetails = [];
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
          JobListDetails.push(element);
        }
      }
    }
    data.job_details = { list: JobListDetails };

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
          imageAction && imageAction == "tmdb"
            ? tmdbPoster
            : req.file && req.file != undefined && req.file.location
            ? req.file.location
            : peopleDetails.poster;
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = data.user_id;
        data.relation_id = relationId;
        const createdRequest = await model.peopleRequestPrimaryDetails.create(data);
        // generating the response data
        const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
          attributes: ["id", "relation_id", "site_language"],
          where: {
            relation_id: createdRequest.relation_id,
            status: "active",
            site_language: data.site_language,
          },
        });
        let responseDetails = [];
        for (const element of findRequestId) {
          const requiredFormat = {
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
            imageAction && imageAction == "tmdb"
              ? tmdbPoster
              : req.file && req.file != undefined && req.file.location
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
          for (const element of findRequestId) {
            const requiredFormat = {
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
        imageAction && imageAction == "tmdb"
          ? tmdbPoster
          : req.file && req.file != undefined && req.file.location
          ? req.file.location
          : peopleDetails.poster;
      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = data.user_id;

      // generating relation Id for the first time
      const createdRequest = await model.peopleRequestPrimaryDetails.create(data);

      // updating the relation_id with respect to request_id
      data.relation_id = createdRequest.id;

      await model.peopleRequestPrimaryDetails.update(data, {
        where: { id: createdRequest.id, status: "active" },
      });
      // creating response
      const findRequestId = await model.peopleRequestPrimaryDetails.findOne({
        attributes: ["id", "relation_id", "site_language"],
        where: { id: createdRequest.id, status: "active", site_language: data.site_language },
      });
      let responseDetails = [];
      if (findRequestId) {
        const requiredFormat = {
          user_id: userId,
          draft_request_id: findRequestId.id,
          draft_relation_id: findRequestId.relation_id,
          draft_site_language: findRequestId.site_language,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    }
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};
