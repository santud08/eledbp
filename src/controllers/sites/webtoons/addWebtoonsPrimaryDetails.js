import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { v4 as uuidv4 } from "uuid";

/**
 * addWebtoonsPrimaryDetails
 * @param req
 * @param res
 */
export const addWebtoonsPrimaryDetails = async (req, res, next) => {
  try {
    let data = {};
    data.user_id = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: data.user_id } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.relation_id;
    data.type = "webtoons";
    data.name = req.body.name ? req.body.name.trim() : null;
    data.description = req.body.summary ? req.body.summary : null;
    data.affiliate_link = req.body.official_site ? req.body.official_site : null;
    data.tmdb_id = req.body.tmdb_id ? req.body.tmdb_id : null;
    data.naver_id = req.body.naver_id ? req.body.naver_id : null;
    data.kakao_id = req.body.kakao_id ? req.body.kakao_id : null;
    const releaseYear = req.body.release_date
      ? await customDateTimeHelper.changeDateFormat(req.body.release_date, "YYYY")
      : null;
    data.year = releaseYear != null ? releaseYear : null;
    data.title_status = req.body.title_status;
    data.release_date = req.body.release_date ? req.body.release_date : null;
    data.release_date_to = req.body.release_date_to ? req.body.release_date_to : null;
    data.language = req.body.language ? req.body.language : null;
    data.rating = req.body.rating ? req.body.rating : null;
    data.certification = req.body.certification ? req.body.certification : null;
    // Initial request language data
    const firstLangName = data.name;
    const firstDescription = data.description;

    // site_langugae and other language
    data.site_language = req.body.site_language;
    const otherLanguage = data.site_language === "en" ? "ko" : "en";

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

    // Weekly telecast details
    let telecast_list = [];
    for (const day of req.body.weekly_telecast_days) {
      const element = {
        id: "",
        title_id: "",
        telecast_day: day,
        status: "",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        created_by: data.user_id,
        updated_by: "",
      };
      telecast_list.push(element);
    }
    data.weekly_telecast_details = { list: telecast_list };

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

    // checking for tmdb_id,naver_id, present in title table.

    if (data.naver_id) {
      const naverExists = await model.title.findOne({
        where: { type: data.type, naver_id: data.naver_id, record_status: "active" },
      });
      if (naverExists) throw StatusError.badRequest(res.__("Naver ID already exist"));
    }
    if (data.kakao_id) {
      const kakaoExists = await model.title.findOne({
        where: { type: data.type, kakao_id: data.kakao_id, record_status: "active" },
      });
      if (kakaoExists) throw StatusError.badRequest(res.__("Kakao ID already exist"));
    }

    if (data.tmdb_id) {
      const tmdbExists = await model.title.findOne({
        where: { type: data.type, tmdb_id: data.tmdb_id, record_status: "active" },
      });
      if (tmdbExists) throw StatusError.badRequest(res.__("TMDB ID already exist"));
    }

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
      data.name = firstLangName;
      data.description = firstDescription;
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
  } catch (error) {
    next(error);
  }
};
