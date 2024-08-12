import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

/**
 * editWtPrimaryDetails
 * @param req
 * @param res
 */
export const editWtPrimaryDetails = async (req, res, next) => {
  try {
    let data = {};
    data.user_id = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: data.user_id } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    //check for the title ID present in Title Table
    data.title_id = req.body.title_id;
    const titleDetails = await model.title.findOne({
      where: { id: data.title_id, type: "webtoons", record_status: "active" },
    });

    if (!titleDetails) throw StatusError.badRequest(res.__("Invalid title ID"));

    const relationId = req.body.relation_id;
    data.tmdb_id = req.body.tmdb_id ? req.body.tmdb_id : null;
    data.type = "webtoons";
    data.name = req.body.name ? req.body.name.trim() : null;
    data.description = req.body.summary ? req.body.summary : null;
    data.affiliate_link = req.body.official_site ? req.body.official_site : null;
    data.naver_id = req.body.naver_id ? req.body.naver_id : null;
    data.kakao_id = req.body.kakao_id ? req.body.kakao_id : null;

    // site_langugae
    data.site_language = req.body.site_language;

    // Checking for TMDB Already exist
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
    // check for naver_id already exists:
    if (data.naver_id) {
      const naverExists = await model.title.findOne({
        where: {
          type: data.type,
          naver_id: data.naver_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (naverExists) throw StatusError.badRequest(res.__("NAVER ID already exist"));
    }
    // check for kakao_id already exists:
    if (data.kakao_id) {
      const kakaoExists = await model.title.findOne({
        where: {
          type: data.type,
          kakao_id: data.kakao_id,
          record_status: "active",
          id: {
            [Op.ne]: data.title_id,
          },
        },
      });
      if (kakaoExists) throw StatusError.badRequest(res.__("KAKAO ID already exist"));
    }

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

    // Weekly telecast details
    let telecast_list = [];
    for (const value of req.body.weekly_telecast_days) {
      const element = {
        id: value.id,
        title_id: data.title_id,
        telecast_day: value.day,
        status: "",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        created_by: data.user_id,
        updated_by: "",
      };
      telecast_list.push(element);
    }
    data.weekly_telecast_details = { list: telecast_list };

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
          where: { relation_id: createdRequest.relation_id },
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
            where: { relation_id: titleRequest.relation_id, status: "active" },
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
      // creating response
      const findRequestId = await model.titleRequestPrimaryDetails.findAll({
        attributes: ["id", "relation_id", "user_id", "site_language"],
        where: { id: createdRequest.id, status: "active" },
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
