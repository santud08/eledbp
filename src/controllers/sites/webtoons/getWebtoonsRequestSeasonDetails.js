import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * getWebtoonsRequestSeasonDetails
 * @param req
 * @param res
 */
export const getWebtoonsRequestSeasonDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid request id"));
    }

    const requestId = reqBody.id; //It will be request  id
    const seasonId = req.query.season_id ? req.query.season_id : ""; //It will be season  id
    const language = req.query.language;

    const titleType = "webtoons";
    let getNewsSearchKeywordList = [],
      getReadList = [],
      getChannelList = [],
      getSearchKeywordList = [];
    let seasonDetails = {};

    // check for request id present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
        site_language: language,
        type: titleType,
      },
    });
    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    const getSeasonInformations = await model.titleRequestSeasonDetails.findOne({
      where: {
        id: seasonId,
        request_id: requestId,
        status: "active",
      },
    });

    if (!getSeasonInformations) throw StatusError.badRequest(res.__("Invalid Season ID"));

    if (getSeasonInformations) {
      seasonDetails = JSON.parse(getSeasonInformations.season_details);

      // Get news keyword details
      const newsKeywordDetails = JSON.parse(
        getSeasonInformations.season_news_search_keyword_details,
      );
      if (newsKeywordDetails) {
        let list = [];
        for (const newsKeyword of newsKeywordDetails.list) {
          if (newsKeyword) {
            const keyword = newsKeyword.keyword ? newsKeyword.keyword : "";
            const record = {
              news_keyword: keyword,
            };
            list.push(record);
          }
          getNewsSearchKeywordList = list;
        }
      }

      // search keyword details:
      const searchKeywordDetails = JSON.parse(getSeasonInformations.season_search_keyword_details);
      if (searchKeywordDetails) {
        let list = [];
        for (const searchKeyword of searchKeywordDetails.list) {
          if (searchKeyword) {
            const keyword = searchKeyword.keyword ? searchKeyword.keyword : "";
            const record = {
              search_keyword: keyword,
            };
            list.push(record);
          }
          getSearchKeywordList = list;
        }
      }
      // Get Read details
      const readDetails = JSON.parse(getSeasonInformations.read_list_details);
      if (readDetails) {
        let list = [];
        for (const read of readDetails.list) {
          if (read) {
            const readId = read.movie_id ? read.movie_id : "";
            const providerId = read.provider_id ? read.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "list_order", "logo_path"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateWtLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                provider_id: providerId,
                read_id: readId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getReadList = list;
        }
      }
      // get channel details:
      const channelDetails = JSON.parse(getSeasonInformations.season_channel_details);
      if (channelDetails) {
        let list = [];
        for (const channel of channelDetails.list) {
          if (channel) {
            const webtoonsChannelId = channel.webtoons_channel_id
              ? channel.webtoons_channel_id
              : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "list_order", "logo_path"],
              where: { id: webtoonsChannelId, status: "active" },
            });
            if (getProviderDetails) {
              const id = getProviderDetails.id ? getProviderDetails.id : "";
              const networkName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const networkLogo = getProviderDetails.logo_path
                ? await generalHelper.generateWtLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                webtoons_channel_id: id,
                webtoons_channel_name: networkName,
                webtoons_channel_logo: networkLogo,
              };
              list.push(record);
            }
          }
          getChannelList = list;
        }
      }
    }
    res.ok({
      request_id: requestId,
      request_season_id: seasonId,
      season_no:
        seasonDetails.number != "" && seasonDetails.number
          ? seasonDetails.number
          : seasonDetails.number == 0
          ? 0
          : "",
      season_name: seasonDetails.season_name ? seasonDetails.season_name : "",
      display_image: seasonDetails.poster ? seasonDetails.poster : "",
      release_date: seasonDetails.release_date ? seasonDetails.release_date : "",
      total_episode: seasonDetails.episode_count ? seasonDetails.episode_count : "",
      plot: seasonDetails.summary ? seasonDetails.summary : "",
      aka: seasonDetails.aka ? seasonDetails.aka : "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsSearchKeywordList,
      getRead_list: getReadList,
      getChannel_list: getChannelList,
    });
  } catch (error) {
    next(error);
  }
};
