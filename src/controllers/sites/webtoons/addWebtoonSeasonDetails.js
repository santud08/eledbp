import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { titleService } from "../../../services/index.js";

/**
 * addWebtoonSeasonDetails
 * @param req
 * @param res
 */
export const addWebtoonSeasonDetails = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    let draftRequestId = req.body.draft_request_id;
    const draftSeasonID = req.body.draft_season_id ? req.body.draft_season_id : null;
    const releaseDate = req.body.release_date
      ? await customDateTimeHelper.changeDateFormat(req.body.release_date, "YYYY-MM-DD")
      : null;
    const siteLanguage = req.body.site_language;
    let data = {};
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    // check for request id present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: draftRequestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
        type: "webtoons",
      },
    });
    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    // check for request id present or not for other language:
    const relationId = findRequestId && findRequestId.relation_id ? findRequestId.relation_id : "";
    const otherLanguage = siteLanguage === "en" ? "ko" : "en";
    const findOtherLangRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        relation_id: relationId,
        status: "active",
        request_status: "draft",
        site_language: otherLanguage,
        type: "webtoons",
      },
    });
    const otherLangRequestId =
      findOtherLangRequestId && findOtherLangRequestId.id ? findOtherLangRequestId.id : "";

    // Get country details
    let countryArr = [];
    const coutryList = findRequestId.country_details
      ? JSON.parse(findRequestId.country_details)
      : "";
    if (coutryList) {
      for (const eachCountry of coutryList.list) {
        if (eachCountry && eachCountry.country_id) {
          countryArr.push(eachCountry.country_id);
        }
      }
    }
    const isKorean = await titleService.isKoreanData(countryArr);

    // get tmdb_title_id from the prrmary details page
    data.request_id = draftRequestId;
    const seasonNo = req.body.season_no;
    const seasonName = req.body.season_name ? req.body.season_name.trim() : null;
    const summary = req.body.summary ? req.body.summary : null;
    const poster = req.file != undefined ? req.file.location : null;
    const episode_count = req.body.episode_count ? req.body.episode_count : 0;
    const aka = req.body.aka ? req.body.aka : null;
    const imageAction = req.body.image_action ? req.body.image_action : "";

    let titleFirstLanName = null;

    titleFirstLanName =
      siteLanguage == "en" && findRequestId.name ? findRequestId.name : findOtherLangRequestId.name;
    /* getting all the saved season details with respect to season ID and except the requested season_id for update scenario
        1. findAllSeasonDetails for season no and release date validation with new season details
    */
    let [findAllSeasonDetails, otherLangSeasonRequest] = await Promise.all([
      model.titleRequestSeasonDetails.findAll({
        where: { request_id: draftRequestId, status: "active", id: { [Op.ne]: draftSeasonID } },
      }),
      model.titleRequestSeasonDetails.findAll({
        where: { request_id: otherLangRequestId, status: "active" },
      }),
    ]);

    let dbPosterImage = "";

    // checking whether seasonId is already present for that request id
    const findId = await model.titleRequestSeasonDetails.findOne({
      where: { id: draftSeasonID, request_id: draftRequestId, status: "active" },
    });

    if (findId) {
      if (findId.dataValues) {
        const parsed_season_details = findId.dataValues.season_details
          ? JSON.parse(findId.dataValues.season_details)
          : null;
        dbPosterImage =
          parsed_season_details != null && parsed_season_details.poster
            ? parsed_season_details.poster
            : null;
      }
    }
    /* season Id not present in request body -but the total records of that particular request id >0 - will create a new seasonId request
    1. New season added after adding some other season and checking for other season req for season No and season date validation
    2. updating existing season req and checking for other season req for season No and season date validation
    3. Adding first season of the title  - no need season no and date validation*/
    if (draftSeasonID === null && findAllSeasonDetails.length > 0) {
      for (const value of findAllSeasonDetails) {
        const parsedSeasonDetails = JSON.parse(value.dataValues.season_details);
        // season No 0 for special seasons :
        if (seasonNo != 0) {
          if (parsedSeasonDetails.number != seasonNo) {
            // same release date validation
            // checking for empty release date and allow it add to the request
            // compare the release date and throw error only if its present
            if (parsedSeasonDetails.release_date) {
              if (parsedSeasonDetails.release_date != releaseDate) {
                data.season_details = {
                  id: "",
                  release_date: releaseDate,
                  poster: poster,
                  number: seasonNo,
                  season_name: seasonName,
                  title_id: "",
                  title_tmdb_id: "",
                  allow_update: "",
                  summary: summary,
                  aka: aka,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  updated_at: "",
                  episode_count: episode_count,
                  site_language: siteLanguage,
                  status: "",
                  created_by: userId,
                  updated_by: "",
                };
              } else {
                throw StatusError.badRequest(
                  res.__("Release Date is already added in previous requests"),
                );
              }
            } else {
              data.season_details = {
                id: "",
                release_date: releaseDate,
                poster: poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: "",
                title_tmdb_id: "",
                allow_update: "",
                summary: summary,
                aka: aka,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                episode_count: episode_count,
                site_language: siteLanguage,
                status: "",
                created_by: userId,
                updated_by: "",
              };
            }
          } else {
            throw StatusError.badRequest(res.__("Season No is already added in previous requests"));
          }
        } else {
          // for season 0 special season checking for only release date validations
          if (parsedSeasonDetails.release_date) {
            if (parsedSeasonDetails.release_date != releaseDate) {
              data.season_details = {
                id: "",
                release_date: releaseDate,
                poster: poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: "",
                title_tmdb_id: "",
                allow_update: "",
                summary: summary,
                aka: aka,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                episode_count: episode_count,
                site_language: siteLanguage,
                status: "",
                created_by: userId,
                updated_by: "",
              };
            } else {
              throw StatusError.badRequest(
                res.__("Release Date is already added in previous requests"),
              );
            }
          } else {
            data.season_details = {
              id: "",
              release_date: releaseDate,
              poster: poster,
              number: seasonNo,
              season_name: seasonName,
              title_id: "",
              title_tmdb_id: "",
              allow_update: "",
              summary: summary,
              aka: aka,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              episode_count: episode_count,
              site_language: siteLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
          }
        }
      }
    } else if (draftSeasonID && findAllSeasonDetails.length > 0) {
      // if season id is present we are updating the record
      for (const value of findAllSeasonDetails) {
        const parsedSeasonDetails = JSON.parse(value.dataValues.season_details);
        // season No 0 for special seasons :
        if (seasonNo != 0) {
          if (parsedSeasonDetails.number != seasonNo) {
            // same release date validation
            // checking for empty release date and allow it add to the request
            // compare the release date and throw error only if its present
            if (parsedSeasonDetails.release_date) {
              if (parsedSeasonDetails.release_date != releaseDate) {
                data.season_details = {
                  id: "",
                  release_date: releaseDate,
                  poster: imageAction == "unchanged" ? dbPosterImage : poster,
                  number: seasonNo,
                  season_name: seasonName,
                  title_id: "",
                  title_tmdb_id: "",
                  allow_update: "",
                  summary: summary,
                  aka: aka,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  updated_at: "",
                  episode_count: episode_count,
                  site_language: siteLanguage,
                  status: "",
                  created_by: userId,
                  updated_by: "",
                };
              } else {
                throw StatusError.badRequest(
                  res.__("Release Date is already added in previous requests"),
                );
              }
            } else {
              data.season_details = {
                id: "",
                release_date: releaseDate,
                poster: imageAction == "unchanged" ? dbPosterImage : poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: "",
                title_tmdb_id: "",
                allow_update: "",
                summary: summary,
                aka: aka,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                episode_count: episode_count,
                site_language: siteLanguage,
                status: "",
                created_by: userId,
                updated_by: "",
              };
            }
          } else {
            throw StatusError.badRequest(res.__("Season No is already added in previous requests"));
          }
        } else {
          // for season 0 special season checking for only release date validations
          if (parsedSeasonDetails.release_date) {
            if (parsedSeasonDetails.release_date != releaseDate) {
              data.season_details = {
                id: "",
                release_date: releaseDate,
                poster: imageAction == "unchanged" ? dbPosterImage : poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: "",
                title_tmdb_id: "",
                allow_update: "",
                summary: summary,
                aka: aka,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                episode_count: episode_count,
                site_language: siteLanguage,
                status: "",
                created_by: userId,
                updated_by: "",
              };
            } else {
              throw StatusError.badRequest(
                res.__("Release Date is already added in previous requests"),
              );
            }
          } else {
            data.season_details = {
              id: "",
              release_date: releaseDate,
              poster: imageAction == "unchanged" ? dbPosterImage : poster,
              number: seasonNo,
              season_name: seasonName,
              title_id: "",
              title_tmdb_id: "",
              allow_update: "",
              summary: summary,
              aka: aka,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              episode_count: episode_count,
              site_language: siteLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
          }
        }
      }
    } else {
      // creating season details for the first time
      // only one season is present and updates its content
      data.season_details = {
        id: "",
        release_date: releaseDate,
        poster: imageAction == "unchanged" ? dbPosterImage : poster,
        number: seasonNo,
        season_name: seasonName,
        title_id: "",
        title_tmdb_id: "",
        allow_update: "",
        summary: summary,
        aka: aka,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_at: "",
        episode_count: episode_count,
        site_language: siteLanguage,
        status: "",
        created_by: userId,
        updated_by: "",
      };
    }
    data.season_no = req.body.season_no;
    // watch_on_stream_details:
    let read_list = [];
    if (req.body.read && req.body.read != "") {
      for (const read of req.body.read) {
        const readData = JSON.parse(read);
        const element = {
          id: "",
          title_id: "",
          movie_id: readData.read_id,
          url: "",
          type: "read",
          provider_id: readData.ott_provider_id,
          season_id: "",
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        read_list.push(element);
      }
    }
    data.read_list_details = { list: read_list };

    //Channel details:
    let channel_list = [];
    if (req.body.channel && req.body.channel != "") {
      for (const channel of req.body.channel) {
        const element = {
          id: "",
          title_id: "",
          url: "",
          webtoons_channel_id: channel,
          season_id: "",
          episode_id: "",
          site_language: siteLanguage,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        channel_list.push(element);
      }
    }
    data.season_channel_details = { list: channel_list };

    // search keyword  details
    let search_keyword = [];
    if (req.body.search_keyword && req.body.search_keyword != "") {
      const searchKeywordArr = req.body.search_keyword.split(",");
      for (const keyword of searchKeywordArr) {
        const element = {
          id: "",
          title_id: "",
          site_language: siteLanguage,
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
    data.season_search_keyword_details = { list: search_keyword };

    // news search keyword  details
    let news_search_keyword = [];
    if (req.body.news_search_keyword && req.body.news_search_keyword != "") {
      const newsSearchKeywordArr = req.body.news_search_keyword.split(",");
      for (const keyword of newsSearchKeywordArr) {
        const element = {
          id: "",
          title_id: "",
          site_language: siteLanguage,
          keyword: keyword,
          keyword_type: "news",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        news_search_keyword.push(element);
      }
    } else {
      if (titleFirstLanName && isKorean) {
        const element = {
          id: "",
          title_id: "",
          site_language: siteLanguage,
          keyword: titleFirstLanName,
          keyword_type: "news",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        news_search_keyword.push(element);
      }
    }
    data.season_news_search_keyword_details = { list: news_search_keyword };

    // season Id is not present for that request_id create the data else update the data
    if (!findId) {
      // Season ID not created so new seasonID is created
      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = userId;
      // creating season ID for the first time
      const createdSeasonId = await model.titleRequestSeasonDetails.create(data);

      // creating season records for other languages:
      // season name and plot
      if (otherLanguage && otherLangRequestId && otherLangSeasonRequest.length == 0) {
        data.request_id = otherLangRequestId;
        data.season_details.site_language = otherLanguage;
        await model.titleRequestSeasonDetails.create(data);
      }
      // creating response
      const seasonData = await model.titleRequestSeasonDetails.findAll({
        attributes: ["id", "request_id"],
        where: { id: createdSeasonId.id },
      });
      let responseDetails = [];
      for (let element of seasonData) {
        let requiredFormat = {
          draft_request_id: element.request_id,
          draft_season_id: element.id,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    } else {
      //  finding season ID and then updating the existing fields if there are corrections
      data.updated_at = await customDateTimeHelper.getCurrentDateTime();
      data.updated_by = userId;

      // updating the SeasonId and
      await model.titleRequestSeasonDetails.update(data, {
        where: { id: draftSeasonID, request_id: draftRequestId, status: "active" },
      });
      // creating response
      const updatedSeason = await model.titleRequestSeasonDetails.findAll({
        where: { id: draftSeasonID, status: "active" },
      });
      let responseDetails = [];
      for (let element of updatedSeason) {
        let requiredFormat = {
          draft_request_id: element.request_id,
          draft_season_id: element.id,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    }
  } catch (error) {
    next(error);
  }
};
