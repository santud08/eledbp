import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * editGetWtRequestSeasonDetails
 * @param req
 * @param res
 */
export const editGetWtRequestSeasonDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const titleId = reqBody.title_id;
    if (!titleId && titleId == "undefined") {
      throw StatusError.badRequest(res.__("title ID is required "));
    }
    const requestId = reqBody.draft_request_id ? reqBody.draft_request_id : ""; //It will be draft request  id
    const draftSeasonId = reqBody.draft_season_id ? reqBody.draft_season_id : ""; //It will be draft season  id
    const seasonPkId = reqBody.season_id ? reqBody.season_id : "";
    const siteLanguage = reqBody.language;

    let getReadList = [],
      getChannelList = [];
    let seasonDetails = {};
    let getNewsSearchKeywordList = [];
    let getSearchKeywordList = [];
    let getSeasonInformations = {};

    getSeasonInformations = await model.titleRequestSeasonDetails.findOne({
      attributes: [
        "id",
        "request_id",
        "season_details",
        "season_search_keyword_details",
        "season_news_search_keyword_details",
        "season_channel_details",
        "season_connection_details",
        "read_list_details",
      ],
      where: {
        id: draftSeasonId,
        request_id: requestId,
        status: "active",
      },
    });
    const foundSeason =
      getSeasonInformations != null ? Object.keys(getSeasonInformations).length : null;

    if (foundSeason != null && foundSeason > 0) {
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
        for (const value of readDetails.list) {
          if (value) {
            const readPkId = value.id ? value.id : "";
            const movieId = value.movie_id ? value.movie_id : "";
            const providerId = value.provider_id ? value.provider_id : "";
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
                id: readPkId,
                provider_id: providerId,
                read_id: movieId,
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
            const channelId = channel.id ? channel.id : "";
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
                id: channelId,
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
    } else if (titleId && seasonPkId) {
      // Get the details from the Season - Check for tmdb in title
      seasonDetails = await model.season.findOne({
        where: {
          id: seasonPkId,
          title_id: titleId,
          status: "active",
        },
      });
      if (!seasonDetails) throw StatusError.badRequest(res.__("Invalid season ID "));
      // Get season Translation details
      const seasonTranslationDetails = await model.seasonTranslation.findOne({
        attributes: ["season_name", "summary"],
        where: { season_id: seasonPkId, site_language: siteLanguage, status: "active" },
      });
      const seasonName =
        seasonTranslationDetails && seasonTranslationDetails.season_name
          ? seasonTranslationDetails.season_name
          : "";
      const seasonSummary =
        seasonTranslationDetails && seasonTranslationDetails.summary
          ? seasonTranslationDetails.summary
          : "";
      seasonDetails.season_name = seasonName;
      seasonDetails.summary = seasonSummary;
      // Watch On Details --- Read details from watch on table
      const watchOnDetails = await model.titleWatchOn.findAll({
        attributes: ["id", "title_id", "movie_id", "type", "provider_id", "season_id"],
        where: { title_id: titleId, season_id: seasonPkId, status: "active", type: "read" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "logo_path"],
            where: { status: "active", available_for: "webtoons" },
          },
        ],
      });
      if (watchOnDetails) {
        let readList = [];
        for (const eachRow of watchOnDetails) {
          if (eachRow) {
            if (eachRow.ottServiceProvider) {
              const record = {
                id: eachRow.id ? eachRow.id : "",
                provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                read_id: eachRow.movie_id ? eachRow.movie_id : "",
                provider_name: eachRow.ottServiceProvider.ott_name
                  ? eachRow.ottServiceProvider.ott_name
                  : "",
                ott_logo_path: eachRow.ottServiceProvider.logo_path
                  ? await generalHelper.generateWtLogoUrl(req, eachRow.ottServiceProvider.logo_path)
                  : "",
              };
              readList.push(record);
            }
          }
        }
        getReadList = readList;
      }
      // Get search keyword details
      const titleKeywords = await model.titleKeyword.findAll({
        where: {
          title_id: titleId,
          season_id: seasonPkId,
          status: "active",
        },
        attributes: ["id", "keyword", "keyword_type", "season_id"],
      });
      if (titleKeywords && titleKeywords.length > 0) {
        for (const eachValue of titleKeywords) {
          if (eachValue && eachValue.keyword && eachValue.keyword_type == "search") {
            getSearchKeywordList.push({ search_keyword: eachValue.keyword });
          } else if (eachValue && eachValue.keyword && eachValue.keyword_type == "news") {
            getNewsSearchKeywordList.push({ news_keyword: eachValue.keyword });
          }
        }
      }
      // Channel Details - list is in the ott service provider
      let relatedChannelList = await model.webtoonsChannelList.findAll({
        attributes: ["id", "webtoons_channel_id", "title_id", "season_id"],
        include: [
          {
            model: model.ottServiceProvider,
            attributes: ["id", "ott_name", "provider_url", "logo_path"],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
            },
            required: true,
          },
        ],
        where: {
          season_id: seasonPkId,
          title_id: titleId,
          status: "active",
        },
      });
      if (relatedChannelList) {
        for (const eachRow of relatedChannelList) {
          if (eachRow) {
            const element = {
              id: eachRow.id,
              webtoons_channel_id: eachRow.webtoons_channel_id ? eachRow.webtoons_channel_id : "",
              webtoons_channel_name: eachRow.ottServiceProvider.ott_name
                ? eachRow.ottServiceProvider.ott_name
                : "",
              webtoons_channel_logo: eachRow.ottServiceProvider.logo_path
                ? await generalHelper.generateWtLogoUrl(req, eachRow.ottServiceProvider.logo_path)
                : "",
            };
            getChannelList.push(element);
          }
        }
      }
    }
    res.ok({
      title_id: titleId,
      request_id: requestId,
      season_id: seasonPkId,
      request_season_id: draftSeasonId,
      season_no: seasonDetails ? seasonDetails.number : "",
      season_name: seasonDetails ? seasonDetails.season_name : "",
      display_image: seasonDetails ? seasonDetails.poster : "",
      release_date: seasonDetails ? seasonDetails.release_date : "",
      release_date_to: seasonDetails ? seasonDetails.release_date_to : "",
      total_episode: seasonDetails ? seasonDetails.episode_count : "",
      plot: seasonDetails ? seasonDetails.summary : "",
      aka: seasonDetails ? seasonDetails.aka : "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsSearchKeywordList,
      getRead_list: getReadList,
      getChannel_list: getChannelList,
    });
  } catch (error) {
    next(error);
  }
};
