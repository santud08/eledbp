import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { tmdbService, kobisService, titleService } from "../../../services/index.js";

/**
 * editMoviePrimaryDetails
 * @param req
 * @param res
 */
export const editMoviePrimaryDetails = async (req, res, next) => {
  try {
    let data = {};
    data.user_id = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: data.user_id } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    data.title_id = req.body.title_id;
    const titleDetails = await model.title.findOne({
      where: { id: data.title_id, record_status: "active" },
    });

    if (!titleDetails) throw StatusError.badRequest(res.__("Invalid title ID"));

    const relationId = req.body.relation_id;
    data.tmdb_id = req.body.tmdb_id ? req.body.tmdb_id : null;
    data.kobis_id = req.body.kobis_id ? req.body.kobis_id : null;
    data.tiving_id = req.body.tiving_id ? req.body.tiving_id : null;
    data.odk_id = req.body.odk_id ? req.body.odk_id : null;
    data.type = "movie";
    data.name = req.body.name ? req.body.name.trim() : null;
    data.aka = req.body.aka ? req.body.aka : null;
    data.description = req.body.summary ? req.body.summary : null;
    data.plot_summary = req.body.plot ? req.body.plot : null;
    data.affiliate_link = req.body.official_site ? req.body.official_site : null;

    // site_langugae
    data.site_language = req.body.site_language;

    // check for tmdb already exists:
    if (data.tmdb_id) {
      const tmdbExists = await model.title.findOne({
        where: {
          type: data.type,
          tmdb_id: data.tmdb_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (tmdbExists) throw StatusError.badRequest(res.__("TMDB ID already exist"));
    }
    // check for tiving id already exists:
    if (data.tiving_id) {
      const tivingExists = await model.title.findOne({
        where: {
          type: data.type,
          tiving_id: data.tiving_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (tivingExists) throw StatusError.badRequest(res.__("TVING ID already exist"));
    }
    // check for odk_id already exists:
    if (data.odk_id) {
      const odkExists = await model.title.findOne({
        where: {
          type: data.type,
          odk_id: data.odk_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (odkExists) throw StatusError.badRequest(res.__("ODK ID already exist"));
    }
    // check for Kobis id already exists:
    if (data.kobis_id) {
      const kobisExists = await model.title.findOne({
        where: {
          type: data.type,
          kobis_id: data.kobis_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (kobisExists) throw StatusError.badRequest(res.__("KOBIS ID already exist"));
    }

    // check for korean data - for news search keyword auto fill:
    const coutryList =
      req.body.country && req.body.country.length > 0
        ? req.body.country.map((val) => val.country_id)
        : [];

    const isKorean = await titleService.isKoreanData(coutryList);

    // checking for tmdb_id , kobis_id
    let kobisData = [];
    let tmdbData = [];
    if (data.tmdb_id && data.tmdb_id != null) {
      tmdbData = await tmdbService.fetchTitleDetails(data.type, data.tmdb_id, data.site_language);
      const tmdbObjectLength = Object.keys(tmdbData.results).length;

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
    } else {
      data.imdb_id = req.body.imdb_id ? req.body.imdb_id : null;
    }
    if (data.kobis_id && data.type == "movie" && data.kobis_id != null) {
      kobisData = await kobisService.fetchTitleDetails(
        data.type,
        data.kobis_id,
        data.site_language,
      );
      const kobisObjectLength = Object.keys(kobisData.results).length;
      if (kobisObjectLength > 0) {
        // for internal
        data.year = kobisData.results.year ? kobisData.results.year : null;
      }
    }

    // check for imdb_id already exists:
    if (data.imdb_id) {
      const imdbExists = await model.title.findOne({
        where: {
          type: data.type,
          imdb_id: data.imdb_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (imdbExists) throw StatusError.badRequest(res.__("IMDB ID already exist"));
    }

    const releaseYear = req.body.release_date ? new Date(req.body.release_date) : null;
    data.year = releaseYear != null ? releaseYear.getFullYear() : null;

    data.title_status = req.body.title_status;
    data.release_date = req.body.release_date ? req.body.release_date : null;
    data.runtime = req.body.runtime ? req.body.runtime : null;
    data.language = req.body.language ? req.body.language : null;
    data.is_rerelease = req.body.is_rerelease ? req.body.is_rerelease : 0;
    data.footfalls = req.body.footfalls ? req.body.footfalls : null;
    data.certification = req.body.certification ? req.body.certification : null;

    // re-release details
    let re_release_list = [];
    if (data.is_rerelease === 1) {
      for (const date of req.body.re_release) {
        const element = {
          id: date.id,
          title_id: data.title_id,
          re_release_date: date.re_release_date,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: data.user_id,
          updated_at: "",
          updated_by: "",
        };
        re_release_list.push(element);
      }
    }
    data.re_release_details = { list: re_release_list };
    // country details
    let country_list = [];
    if (req.body.country) {
      for (const country of req.body.country) {
        const element = {
          id: country.id,
          title_id: data.title_id,
          country_id: country.country_id,
          site_language: data.site_language,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };
        country_list.push(element);
      }
    }
    data.country_details = { list: country_list };

    // original work details:
    let original_work_list = [];
    if (req.body.original_work) {
      for (const original_work of req.body.original_work) {
        const element = {
          id: original_work.id,
          title_id: data.title_id,
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
    }
    data.original_work_details = { list: original_work_list };

    // watch_on_stream_details:
    let watch_on_stream_list = [];
    if (req.body.watch_on_stream) {
      for (const watch_on_stream of req.body.watch_on_stream) {
        const element = {
          id: watch_on_stream.id,
          title_id: data.title_id,
          movie_id: watch_on_stream.ott_provider_provided_id,
          url: "",
          type: "stream",
          provider_id: watch_on_stream.ott_provider_id,
          season_id: "",
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };
        watch_on_stream_list.push(element);
      }
    }
    data.watch_on_stream_details = { list: watch_on_stream_list };

    // watch_on_rent_details:
    let watch_on_rent_list = [];
    if (req.body.watch_on_rent) {
      for (const watch_on_rent of req.body.watch_on_rent) {
        const element = {
          id: watch_on_rent.id,
          title_id: data.title_id,
          movie_id: watch_on_rent.ott_provider_provided_id,
          url: "",
          type: "rent",
          provider_id: watch_on_rent.ott_provider_id,
          season_id: "",
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };
        watch_on_rent_list.push(element);
      }
    }
    data.watch_on_rent_details = { list: watch_on_rent_list };

    //watch_on_buy details:
    let watch_on_buy_list = [];
    if (req.body.watch_on_buy) {
      for (const watch_on_buy of req.body.watch_on_buy) {
        const element = {
          id: watch_on_buy.id,
          title_id: data.title_id,
          movie_id: watch_on_buy.ott_provider_provided_id,
          url: "",
          type: "buy",
          provider_id: watch_on_buy.ott_provider_id,
          season_id: "",
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };

        watch_on_buy_list.push(element);
      }
    }
    data.watch_on_buy_details = { list: watch_on_buy_list };

    // connection details
    let connection_list = [];
    if (req.body.connections) {
      for (const connection of req.body.connections) {
        const element = {
          id: connection.id,
          title_id: data.title_id,
          related_title_id: connection.related_title_id,
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
    }
    data.connection_details = { list: connection_list };

    // series details
    let series_list = [];
    if (req.body.series) {
      for (const series of req.body.series) {
        const element = {
          id: series.id,
          title_id: data.title_id,
          related_title_id: series.related_series_title_id,
          site_language: data.site_language,
          season_id: "",
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
          tmdb_id: series.tmdb_id ? series.tmdb_id : "",
        };
        series_list.push(element);
      }
    }
    data.series_details = { list: series_list };

    // search keyword  details
    let search_keyword = [];
    if (req.body.search_keyword != "") {
      const searchKeywordArr = req.body.search_keyword.split(",");
      for (const keyword of searchKeywordArr) {
        const element = {
          id: "",
          title_id: data.title_id,
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

    // news search keyword  details
    let news_search_keyword = [];
    if (req.body.news_search_keyword != "") {
      const newsSearchKeywordArr = req.body.news_search_keyword.split(",");
      for (const keyword of newsSearchKeywordArr) {
        const element = {
          id: "",
          title_id: data.title_id,
          site_language: data.site_language,
          keyword: keyword,
          keyword_type: "news",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };
        news_search_keyword.push(element);
      }
    } else {
      if (data.name && isKorean) {
        const element = {
          id: "",
          title_id: data.title_id,
          site_language: data.site_language,
          keyword: data.name,
          keyword_type: "news",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: data.user_id,
          updated_by: "",
        };
        news_search_keyword.push(element);
      }
    }
    data.news_keyword_details = { list: news_search_keyword };

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
          attributes: ["id", "relation_id", "user_id", "site_language", "title_id"],
          where: { relation_id: createdRequest.relation_id, site_language: data.site_language },
        });
        let responseDetails = [];
        for (let element of findRequestId) {
          let requiredFormat = {
            user_id: element.user_id,
            title_id: element.title_id,
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
            attributes: ["id", "relation_id", "user_id", "site_language", "title_id"],
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
              title_id: element.title_id,
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
      // creating response
      const findRequestId = await model.titleRequestPrimaryDetails.findAll({
        attributes: ["id", "relation_id", "user_id", "site_language", "title_id"],
        where: { id: createdRequest.id, status: "active", site_language: data.site_language },
      });
      let responseDetails = [];
      for (let element of findRequestId) {
        let requiredFormat = {
          user_id: element.user_id,
          title_id: element.title_id,
          draft_request_id: element.id,
          draft_relation_id: element.relation_id,
          draft_site_language: element.site_language,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    }
  } catch (error) {
    next(error);
  }
};
