import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { titleRequestService, titleService, tmdbService } from "../../../services/index.js";

/**
 * editSeasonDetails
 * @param req
 * @param res
 */
export const editSeasonDetails = async (req, res, next) => {
  try {
    let titleId = req.body.title_id ? req.body.title_id : "";
    let tmdbId = req.body.tmdb_id ? req.body.tmdb_id : "";
    let seasonPkId = req.body.season_id ? req.body.season_id : "";
    const userId = req.userDetails.userId;
    const draftRequestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    let draftSeasonID = req.body.draft_season_id ? req.body.draft_season_id : null;
    const releaseDate = req.body.release_date
      ? await customDateTimeHelper.changeDateFormat(req.body.release_date, "YYYY-MM-DD")
      : null;
    const releaseDateTo = req.body.release_date_to
      ? await customDateTimeHelper.changeDateFormat(req.body.release_date_to, "YYYY-MM-DD")
      : null;
    const siteLanguage = req.body.site_language;
    const titleType = "tv";
    let data = {};
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    data.season_id = seasonPkId ? seasonPkId : null;

    // check for request id present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: draftRequestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
        type: "tv",
      },
    });
    // creating Request id and season request Id before add or edit the season details
    // 1. Create RequestID
    let newRequestId = [];
    let seasonReqId = [];
    if (!findRequestId) {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForTv(
        titleId,
        userId,
        siteLanguage,
        titleType,
        draftRequestId,
      );
    }
    if (newRequestId.length > 0) {
      for (const value of newRequestId) {
        if (value && value.draft_site_language == siteLanguage) {
          data.request_id = value.draft_request_id;
        }
      }
    } else {
      data.request_id = draftRequestId;
    }

    // For news search keyword - only for korean data ----
    // check for request id present or not
    const findRequestData = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
        type: "tv",
      },
    });

    // Get country details
    let countryArr = [];
    const coutryList = findRequestData.country_details
      ? JSON.parse(findRequestData.country_details)
      : "";
    if (coutryList) {
      for (const eachCountry of coutryList.list) {
        if (eachCountry && eachCountry.country_id) {
          countryArr.push(eachCountry.country_id);
        }
      }
    }
    const isKorean = await titleService.isKoreanData(countryArr);

    // -------------------------- End of news search keyword checking
    let responseDataDetails = [];
    const checkSeasonId = await model.titleRequestSeasonDetails.findOne({
      where: { request_id: data.request_id, status: "active" },
    });
    if (!checkSeasonId) {
      seasonReqId = await titleRequestService.createSeasonRequestId(
        titleId,
        userId,
        siteLanguage,
        data.request_id,
        seasonPkId,
      );
      if (seasonReqId) {
        for (const value of seasonReqId) {
          responseDataDetails.push(value);
        }
      }
    }
    // get tmdb_title_id from the primary details page
    const seasonNo = req.body.season_no;
    const seasonName = req.body.season_name ? req.body.season_name.trim() : null;
    const summary = req.body.summary ? req.body.summary : null;
    const poster = req.file != undefined ? req.file.location : null;
    const episode_count = req.body.episode_count ? req.body.episode_count : 0;
    const aka = req.body.aka ? req.body.aka : null;
    const imageAction = req.body.image_action ? req.body.image_action : "";

    const reqId = data.request_id;

    /* 1.getting all the saved season details with respect to season ID and except the requested season_id for update scenario
       2.checking whether seasonId is already present for that request id */
    let [findAllSeasonDetails, findId] = await Promise.all([
      model.titleRequestSeasonDetails.findAll({
        where: { request_id: reqId, status: "active", id: { [Op.ne]: draftSeasonID } },
      }),
      model.titleRequestSeasonDetails.findOne({
        where: { id: draftSeasonID, request_id: reqId, status: "active" },
      }),
    ]);
    let dbPosterImage = "";
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

    // finding poster values for the existing season data - from the main table
    let originalSeasonImage = "";
    if (seasonPkId) {
      const seasonPoster = await model.season.findOne({
        where: {
          id: seasonPkId,
          title_id: titleId,
          site_language: siteLanguage,
          status: "active",
        },
      });
      originalSeasonImage =
        seasonPoster && seasonPoster.dataValues && seasonPoster.dataValues.poster
          ? seasonPoster.dataValues.poster
          : null;
    }

    // Getting poster image from the TMDB for the season no - For TMDB refresh
    let tmdbSeasonImage = "";
    if (tmdbId && seasonNo) {
      const tmdbSeasonData = await tmdbService.fetchTvSeasonDetails(tmdbId, seasonNo, siteLanguage);

      tmdbSeasonImage =
        tmdbSeasonData && tmdbSeasonData.results && tmdbSeasonData.results.poster_image
          ? tmdbSeasonData.results.poster_image
          : "";
    }

    /* season Id not present in request body -but the total records of that particular request id >0 - will create a new seasonId request
    1. New season added after adding some other season and checking for other season req for season No and season date validation
    2. updating existing season req and checking for other season req for season No and season date validation
    3. Adding first season of the title and also updating the existing req if only one season req is present - no need season no and date validation*/
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
                  id: seasonPkId,
                  release_date: releaseDate,
                  release_date_to: releaseDateTo,
                  poster:
                    imageAction === "tmdb"
                      ? tmdbSeasonImage
                      : imageAction === "unchanged" && seasonPkId
                      ? originalSeasonImage
                      : poster,
                  number: seasonNo,
                  season_name: seasonName,
                  title_id: titleId,
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
                id: seasonPkId,
                release_date: releaseDate,
                release_date_to: releaseDateTo,
                poster:
                  imageAction === "tmdb"
                    ? tmdbSeasonImage
                    : imageAction === "unchanged" && seasonPkId
                    ? originalSeasonImage
                    : poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: titleId,
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
                id: seasonPkId,
                release_date: releaseDate,
                release_date_to: releaseDateTo,
                poster:
                  imageAction === "tmdb"
                    ? tmdbSeasonImage
                    : imageAction === "unchanged" && seasonPkId
                    ? originalSeasonImage
                    : poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: titleId,
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
              id: seasonPkId,
              release_date: releaseDate,
              release_date_to: releaseDateTo,
              poster:
                imageAction === "tmdb"
                  ? tmdbSeasonImage
                  : imageAction === "unchanged" && seasonPkId
                  ? originalSeasonImage
                  : poster,
              number: seasonNo,
              season_name: seasonName,
              title_id: titleId,
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
                  id: seasonPkId,
                  release_date: releaseDate,
                  release_date_to: releaseDateTo,
                  poster:
                    imageAction === "tmdb"
                      ? tmdbSeasonImage
                      : imageAction === "unchanged"
                      ? dbPosterImage
                      : poster,
                  number: seasonNo,
                  season_name: seasonName,
                  title_id: titleId,
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
                id: seasonPkId,
                release_date: releaseDate,
                release_date_to: releaseDateTo,
                poster:
                  imageAction === "tmdb"
                    ? tmdbSeasonImage
                    : imageAction === "unchanged"
                    ? dbPosterImage
                    : poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: titleId,
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
                id: seasonPkId,
                release_date: releaseDate,
                release_date_to: releaseDateTo,
                poster:
                  imageAction === "tmdb"
                    ? tmdbSeasonImage
                    : imageAction === "unchanged"
                    ? dbPosterImage
                    : poster,
                number: seasonNo,
                season_name: seasonName,
                title_id: titleId,
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
              id: seasonPkId,
              release_date: releaseDate,
              release_date_to: releaseDateTo,
              poster:
                imageAction === "tmdb"
                  ? tmdbSeasonImage
                  : imageAction === "unchanged"
                  ? dbPosterImage
                  : poster,
              number: seasonNo,
              season_name: seasonName,
              title_id: titleId,
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
      data.season_details = {
        id: seasonPkId,
        release_date: releaseDate,
        release_date_to: releaseDateTo,
        poster:
          imageAction === "tmdb"
            ? tmdbSeasonImage
            : imageAction === "unchanged" && seasonPkId
            ? originalSeasonImage
            : poster,
        number: seasonNo,
        season_name: seasonName,
        title_id: titleId,
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
    let watch_on_stream_list = [];
    if (req.body.watch_on_stream && req.body.watch_on_stream != "") {
      for (const watchOnStream of req.body.watch_on_stream) {
        const stream = JSON.parse(watchOnStream);
        const element = {
          id: stream.id,
          title_id: titleId,
          movie_id: stream.ott_provider_provided_id,
          url: "",
          type: "stream",
          provider_id: stream.ott_provider_id,
          season_id: seasonPkId,
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        watch_on_stream_list.push(element);
      }
    }
    data.season_watch_on_stream_details = { list: watch_on_stream_list };
    // watch_on_rent_details:
    let watch_on_rent_list = [];
    if (req.body.watch_on_rent && req.body.watch_on_rent != "") {
      for (const watchOnRent of req.body.watch_on_rent) {
        const rent = JSON.parse(watchOnRent);
        const element = {
          id: rent.id,
          title_id: titleId,
          movie_id: rent.ott_provider_provided_id,
          url: "",
          type: "rent",
          provider_id: rent.ott_provider_id,
          season_id: seasonPkId,
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        watch_on_rent_list.push(element);
      }
    }
    data.season_watch_on_rent_details = { list: watch_on_rent_list };
    //watch_on_buy details:
    let watch_on_buy_list = [];
    if (req.body.watch_on_buy && req.body.watch_on_buy != "") {
      for (const watchOnBuy of req.body.watch_on_buy) {
        const buy = JSON.parse(watchOnBuy);
        const element = {
          id: buy.id,
          title_id: titleId,
          movie_id: buy.ott_provider_provided_id,
          url: "",
          type: "buy",
          provider_id: buy.ott_provider_id,
          season_id: seasonPkId,
          episode_id: "",
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };

        watch_on_buy_list.push(element);
      }
    }
    data.season_watch_on_buy_details = { list: watch_on_buy_list };

    //Channel details:
    let channel_list = [];
    if (req.body.channel && req.body.channel != "") {
      for (const channel of req.body.channel) {
        const channelData = JSON.parse(channel);
        const element = {
          id: channelData.id,
          title_id: titleId,
          url: "",
          tv_network_id: channelData.tv_network_id,
          season_id: seasonPkId,
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
          title_id: titleId,
          site_language: siteLanguage,
          keyword: keyword,
          keyword_type: "search",
          season_id: seasonPkId,
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
          title_id: titleId,
          site_language: siteLanguage,
          keyword: keyword,
          keyword_type: "news",
          season_id: seasonPkId,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        news_search_keyword.push(element);
      }
    } else {
      if (reqId && siteLanguage == "en") {
        const gettvName = await model.titleRequestPrimaryDetails.findOne({
          where: {
            id: reqId,
            status: "active",
            request_status: "draft",
            site_language: siteLanguage,
            type: "tv",
          },
        });
        if (gettvName && gettvName.name && isKorean) {
          const element = {
            id: "",
            title_id: titleId,
            site_language: siteLanguage,
            keyword: gettvName.name,
            keyword_type: "news",
            season_id: seasonPkId,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          news_search_keyword.push(element);
        }
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
      // creating response
      const [seasonData, getRelationData] = await Promise.all([
        model.titleRequestSeasonDetails.findAll({
          attributes: ["id", "request_id", "season_id"],
          where: { id: createdSeasonId.id },
        }),
        model.titleRequestPrimaryDetails.findOne({
          where: {
            id: data.request_id,
            site_language: siteLanguage,
            request_status: "draft",
          },
        }),
      ]);
      let responseDetails = [];
      for (let element of seasonData) {
        let requiredFormat = {
          draft_relation_id:
            getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
          draft_request_id: element.request_id,
          draft_season_id: element.id,
          season_id: element.season_id,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    } else {
      //  finding season ID and then updating the existing fields if there are corrections
      if (draftSeasonID === findId.id) {
        data.updated_at = await customDateTimeHelper.getCurrentDateTime();
        data.updated_by = userId;

        // updating the SeasonId and
        await model.titleRequestSeasonDetails.update(data, {
          where: { id: draftSeasonID, request_id: reqId, status: "active" },
        });
        // creating response
        const [updatedSeason, getRelationData] = await Promise.all([
          model.titleRequestSeasonDetails.findAll({
            where: { id: draftSeasonID, status: "active" },
          }),
          model.titleRequestPrimaryDetails.findOne({
            where: {
              id: data.request_id,
              site_language: siteLanguage,
              request_status: "draft",
            },
          }),
        ]);
        let responseDetails = [];
        for (let element of updatedSeason) {
          let requiredFormat = {
            draft_relation_id:
              getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
            draft_request_id: element.request_id,
            draft_season_id: element.id,
            season_id: element.season_id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Season ID"));
      }
    }
  } catch (error) {
    next(error);
  }
};
