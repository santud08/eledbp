import model from "../../../models/index.js";
import { envs, StatusError } from "../../../config/index.js";
import { fn, col } from "sequelize";

/**
 * getWebtoonsPrimaryDetails
 * @param req
 * @param res
 */
export const getWebtoonsPrimaryDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;

    const requestId = reqBody.request_id ? reqBody.request_id : ""; //It will be request  id
    const language = reqBody.site_language;
    const titleType = "webtoons";
    let getSearchKeywordList = [],
      getOriginalWorkList = [],
      getCountryList = [],
      getConnectionList = [],
      getWeeklyTelecastList = [];

    let getInformations = {},
      getCreditDetails = {},
      getMediaDetails = {},
      getTagDetails = {},
      getSeasonDetails = {},
      getEpisodeDetails = {};

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: titleType,
        status: "active",
        request_status: "draft",
        site_language: language,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    if (requestId) {
      /* Check Request for particular language and fetch the language dependency data
        1. checkRequest for language dependency data
        2. getInformation for language independent data
      */
      const checkRequest = await model.titleRequestPrimaryDetails.findOne({
        attributes: ["name", "description", "original_work_details"],
        where: {
          id: requestId,
          type: "webtoons",
          site_language: language,
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
          "tmdb_id",
          "naver_id",
          "kakao_id",
          "affiliate_link",
          "certification",
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
          "weekly_telecast_details",
        ],
        where: {
          id: requestId,
          type: "webtoons",
          status: "active",
          request_status: "draft",
        },
      });

      getInformations.name = checkRequest && checkRequest.name ? checkRequest.name : "";
      getInformations.description =
        checkRequest && checkRequest.description ? checkRequest.description : "";
      getInformations.original_work_details =
        checkRequest && checkRequest.plot_summary ? checkRequest.original_work_details : "";
      // Get request credit_id,media_id,tag_id,episode_id,season_id if exist
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
      const searchKeywordDetails = getInformations.search_keyword_details
        ? JSON.parse(getInformations.search_keyword_details)
        : "";
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
            const id = eachCountry.country_id ? eachCountry.country_id : "";
            // Get country name
            const getCountry = await model.country.findOne({
              attributes: ["id"],
              where: { id: id, status: "active" },
              include: [
                {
                  model: model.countryTranslation,
                  left: true,
                  attributes: ["country_name"],
                  where: {
                    status: "active",
                  },
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
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
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
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
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
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

      // Get weekly_telecast_days
      const weeklyTelecastDetails = getInformations.weekly_telecast_details
        ? JSON.parse(getInformations.weekly_telecast_details)
        : "";
      if (weeklyTelecastDetails) {
        for (const weekdays of weeklyTelecastDetails.list) {
          if (weekdays) {
            const weekdaysData = weekdays.telecast_day ? weekdays.telecast_day : "";
            getWeeklyTelecastList.push(weekdaysData);
          }
        }
      }
    }
    res.ok({
      request_id: requestId,
      relation_id:
        getInformations && getInformations.relation_id ? getInformations.relation_id : "",
      credit_request_id: getCreditDetails && getCreditDetails.id ? getCreditDetails.id : "",
      media_request_id: getMediaDetails && getMediaDetails.id ? getMediaDetails.id : "",
      tag_request_id: getTagDetails && getTagDetails.id ? getTagDetails.id : "",
      season_request_id: getSeasonDetails && getSeasonDetails.id ? getSeasonDetails.id : "",
      episode_request_id: getEpisodeDetails && getEpisodeDetails.id ? getEpisodeDetails.id : "",
      tmdb_id: getInformations.tmdb_id ? getInformations.tmdb_id : "",
      naver_id: getInformations.naver_id ? getInformations.naver_id : "",
      kakao_id: getInformations.kakao_id ? getInformations.kakao_id : "",
      title: getInformations.name ? getInformations.name : "",
      summery: getInformations.description ? getInformations.description : "",
      official_site: getInformations.affiliate_link ? getInformations.affiliate_link : "",
      search_keyword_details: getSearchKeywordList.length > 0 ? getSearchKeywordList : [],
      title_status: getInformations.title_status ? getInformations.title_status : "",
      release_date: getInformations.release_date ? getInformations.release_date : "",
      release_date_to: getInformations.release_date_to ? getInformations.release_date_to : "",
      rating: getInformations.rating ? getInformations.rating : "",
      certification: getInformations.certification ? getInformations.certification : "",
      language: getInformations.language ? getInformations.language : "",
      countrylist: getCountryList.length > 0 ? getCountryList : [],
      getoriginalWork_list: getOriginalWorkList,
      getconnection_list: getConnectionList,
      weekly_telecast_details: getWeeklyTelecastList.length > 0 ? getWeeklyTelecastList : [],
    });
  } catch (error) {
    next(error);
  }
};
