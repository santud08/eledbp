import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { v4 as uuidv4 } from "uuid";
import { tmdbService } from "../../../services/index.js";

/**
 * addTvPrimaryDetails
 * @param req
 * @param res
 */
export const addTvPrimaryDetails = async (req, res, next) => {
  try {
    let data = {};
    data.user_id = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: data.user_id } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.relation_id;
    data.tmdb_id = req.body.tmdb_id ? req.body.tmdb_id : null;
    data.type = "tv";
    data.name = req.body.name ? req.body.name.trim() : null;
    data.description = req.body.summary ? req.body.summary : null;
    data.affiliate_link = req.body.official_site ? req.body.official_site : null;
    data.tiving_id = req.body.tiving_id ? req.body.tiving_id : null;
    data.odk_id = req.body.odk_id ? req.body.odk_id : null;

    // Initial request language data
    const firstLangName = data.name;
    const firstDescription = data.description;

    // site_langugae
    data.site_language = req.body.site_language;

    // checking for tmdb_id
    let tmdbData = [];
    // data for other language
    let tmdbOtherLangData = [];
    let titleOtherLang = "";
    let summeryOtherLang = "";
    const otherLanguage = data.site_language === "en" ? "ko" : "en";
    if (data.tmdb_id && data.tmdb_id != null) {
      [tmdbData, tmdbOtherLangData] = await Promise.all([
        tmdbService.fetchTitleDetails(data.type, data.tmdb_id, data.site_language),
        tmdbService.fetchTitleDetails(data.type, data.tmdb_id, otherLanguage),
      ]);
      const tmdbObjectLength = Object.keys(tmdbData.results).length;
      const tmdbOtherLangObjectLength = Object.keys(tmdbOtherLangData.results).length;
      // Auto filling from the tmdb data
      if (tmdbObjectLength > 0) {
        data.imdb_id = req.body.imdb_id ? req.body.imdb_id : tmdbData.results.imdb_id;

        // sending data from tmdb for internal
        data.tmdb_vote_average = tmdbData.results.vote_average
          ? tmdbData.results.vote_average
          : null;
        data.tmdb_vote_count = tmdbData.results.vote_count ? tmdbData.results.vote_count : null;
        data.tagline = tmdbData.results.tagline ? tmdbData.results.tagline : null;
        data.backdrop = tmdbData.results.backdrop_path ? tmdbData.results.backdrop_path : null;
        data.budget = tmdbData.results.budget ? tmdbData.results.budget : null;
        data.revenue = tmdbData.results.revenue ? tmdbData.results.revenue : null;
        data.popularity = tmdbData.results.popularity ? tmdbData.results.popularity : null;
        if (tmdbData.results.adult == false) {
          data.adult = 0;
        } else {
          data.adult = 1;
        }
      } else {
        data.imdb_id = req.body.imdb_id ? req.body.imdb_id : null;
      }

      //
      //otherLanguage -> title,summary,plot,Original Work
      if (tmdbOtherLangObjectLength > 0) {
        const tmdbOtherLangDetails = tmdbOtherLangData.results ? tmdbOtherLangData.results : "";
        titleOtherLang =
          tmdbOtherLangDetails && tmdbOtherLangDetails.title ? tmdbOtherLangDetails.title : "";
        summeryOtherLang =
          tmdbOtherLangDetails && tmdbOtherLangDetails.overview
            ? tmdbOtherLangDetails.overview
            : "";
      }
    } else {
      data.imdb_id = req.body.imdb_id ? req.body.imdb_id : null;
    }

    const releaseYear = req.body.release_date ? new Date(req.body.release_date) : null;
    data.year = releaseYear != null ? releaseYear.getFullYear() : null;

    data.title_status = req.body.title_status;
    data.release_date = req.body.release_date ? req.body.release_date : null;
    data.release_date_to = req.body.release_date_to ? req.body.release_date_to : null;
    data.runtime = req.body.runtime ? req.body.runtime : null;
    data.language = req.body.language ? req.body.language : null;
    data.rating = req.body.rating ? req.body.rating : null;
    data.certification = req.body.certification ? req.body.certification : null;

    // country details
    let country_list = [];
    for (const country of req.body.country) {
      const element = {
        id: "",
        title_id: "",
        country_id: country,
        status: "",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        created_by: data.user_id,
        updated_by: "",
      };
      country_list.push(element);
    }
    data.country_details = { list: country_list };

    // original work details:
    let original_work_list = [];
    for (const original_work of req.body.original_work) {
      const element = {
        id: "",
        title_id: "",
        ow_type: original_work.type,
        ow_title: original_work.title,
        ow_original_artis: original_work.original_artist,
        site_language: data.site_language,
        status: "",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        created_by: data.user_id,
        updated_by: "",
      };
      original_work_list.push(element);
    }
    data.original_work_details = { list: original_work_list };

    // connection details
    let connection_list = [];
    for (const connection of req.body.connections) {
      const element = {
        id: "",
        title_id: "",
        related_title_id: connection,
        site_language: data.site_language,
        season_id: "",
        episode_id: "",
        status: "",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        created_by: data.user_id,
        updated_by: "",
      };
      connection_list.push(element);
    }
    data.connection_details = { list: connection_list };

    // search keyword  details
    let search_keyword = [];
    if (req.body.search_keyword != "") {
      const searchKeywordArr = req.body.search_keyword.split(",");
      for (const keyword of searchKeywordArr) {
        const element = {
          id: "",
          title_id: "",
          site_language: data.site_language,
          keyword: keyword,
          keyword_type: "search",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };
        search_keyword.push(element);
      }
    }
    data.search_keyword_details = { list: search_keyword };

    // checking for either of tmdb_id present in title table.
    let tmdbExists = [];
    if (data.tmdb_id) {
      tmdbExists = await model.title.findOne({
        where: { type: data.type, tmdb_id: data.tmdb_id, record_status: "active" },
      });
      if (tmdbExists) throw StatusError.badRequest(res.__("TMDB ID already exist"));
    }

    if ((!tmdbExists || tmdbExists.length == 0) && data.type === "tv") {
      if (relationId) {
        const titleRequest = await model.titleRequestPrimaryDetails.findOne({
          where: {
            relation_id: relationId,
            status: "active",
            request_status: "draft",
            site_language: data.site_language,
          },
        });
        if (!titleRequest) {
          data.created_at = await customDateTimeHelper.getCurrentDateTime();
          data.created_by = data.user_id;
          data.uuid = uuidv4();
          data.relation_id = relationId;
          const createdRequest = await model.titleRequestPrimaryDetails.create(data);
          // generating the response data
          const findRequestId = await model.titleRequestPrimaryDetails.findAll({
            attributes: ["id", "relation_id", "user_id", "site_language"],
            where: {
              relation_id: createdRequest.relation_id,
              status: "active",
              site_language: data.site_language,
            },
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
          //request is already generated for that title and for that language.
          // if request is present for that language fetch and edit
          if (titleRequest.site_language === data.site_language) {
            data.updated_at = await customDateTimeHelper.getCurrentDateTime();
            data.updated_by = data.user_id;

            await model.titleRequestPrimaryDetails.update(data, {
              where: {
                relation_id: relationId,
                site_language: data.site_language,
                status: "active",
              },
            });
            // creating response
            const findRequestId = await model.titleRequestPrimaryDetails.findAll({
              attributes: ["id", "relation_id", "user_id", "site_language"],
              where: {
                relation_id: titleRequest.relation_id,
                status: "active",
                site_language: data.site_language,
              },
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
            throw StatusError.badRequest(res.__("languageDoesnotMatched"));
          }
        }
      } else {
        // Creating Request ID for the first time
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = data.user_id;
        data.uuid = uuidv4();

        // generating relation Id for the first time

        const createdRequest = await model.titleRequestPrimaryDetails.create(data);

        // updating the relation_id with respect to request_id
        data.relation_id = createdRequest.id;

        await model.titleRequestPrimaryDetails.update(data, {
          where: { id: createdRequest.id, status: "active" },
        });

        // creating record for other langugae:
        data.site_language = otherLanguage;
        data.uuid = uuidv4();
        data.name = titleOtherLang ? titleOtherLang : firstLangName;
        data.description = summeryOtherLang ? summeryOtherLang : firstDescription;
        data.original_work_details = { list: [] };
        await model.titleRequestPrimaryDetails.create(data);
        // creating response
        const findRequestId = await model.titleRequestPrimaryDetails.findAll({
          attributes: ["id", "relation_id", "user_id", "site_language"],
          where: { relation_id: data.relation_id, status: "active" },
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
      }
    }
  } catch (error) {
    next(error);
  }
};
