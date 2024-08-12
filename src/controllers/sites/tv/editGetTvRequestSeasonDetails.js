import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { Op } from "sequelize";

/**
 * editGetTvRequestSeasonDetails
 * @param req
 * @param res
 */
export const editGetTvRequestSeasonDetails = async (req, res, next) => {
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
    const titleType = "tv";
    let tmdbData = [];
    let getStreamList = [],
      getRentList = [],
      getBuyList = [],
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
        "season_watch_on_stream_details",
        "season_watch_on_rent_details",
        "season_watch_on_buy_details",
        "season_channel_details",
        "season_connection_details",
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
      //Get TMDB Details
      const tmdbId =
        seasonDetails && seasonDetails.title_tmdb_id ? seasonDetails.title_tmdb_id : "";
      if (tmdbId) {
        tmdbData = await tmdbService.fetchTitleDetails(titleType, tmdbId, siteLanguage);
      }

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

      // Get Stream details
      const streamDetails = JSON.parse(getSeasonInformations.season_watch_on_stream_details);
      if (streamDetails) {
        let list = [];
        for (const stream of streamDetails.list) {
          if (stream) {
            const streamId = stream.id ? stream.id : "";
            const movieId = stream.movie_id ? stream.movie_id : "";
            const providerId = stream.provider_id ? stream.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "list_order", "logo_path"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateOttLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                id: streamId,
                provider_id: providerId,
                movie_id: movieId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getStreamList = list;
        }
      }

      // Get Rent details
      const rentDetails = JSON.parse(getSeasonInformations.season_watch_on_rent_details);
      if (rentDetails) {
        let list = [];
        for (const rent of rentDetails.list) {
          if (rent) {
            const rentId = rent.id ? rent.id : "";
            const movieId = rent.movie_id ? rent.movie_id : "";
            const providerId = rent.provider_id ? rent.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "list_order", "logo_path"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateOttLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                id: rentId,
                provider_id: providerId,
                movie_id: movieId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getRentList = list;
        }
      }

      // Get Buy details
      const buyDetails = JSON.parse(getSeasonInformations.season_watch_on_buy_details);
      if (buyDetails) {
        let list = [];
        for (const buy of buyDetails.list) {
          if (buy) {
            const buyId = buy.id ? buy.id : "";
            const movieId = buy.movie_id ? buy.movie_id : "";
            const providerId = buy.provider_id ? buy.provider_id : "";
            // Get provider name
            const getProviderDetails = await model.ottServiceProvider.findOne({
              attributes: ["id", "ott_name", "provider_url", "list_order", "logo_path"],
              where: { id: providerId, status: "active" },
            });
            if (getProviderDetails) {
              const providerId = getProviderDetails.id ? getProviderDetails.id : "";
              const providerName = getProviderDetails.ott_name ? getProviderDetails.ott_name : "";
              const providerLogo = getProviderDetails.logo_path
                ? await generalHelper.generateOttLogoUrl(req, getProviderDetails.logo_path)
                : "";
              const record = {
                id: buyId,
                provider_id: providerId,
                movie_id: movieId,
                provider_name: providerName,
                ott_logo_path: providerLogo,
              };
              list.push(record);
            }
          }
          getBuyList = list;
        }
      }

      // get channel details:

      const channelDetails = JSON.parse(getSeasonInformations.season_channel_details);
      if (channelDetails) {
        let list = [];
        for (const channel of channelDetails.list) {
          if (channel) {
            const channelId = channel.id ? channel.id : "";
            const tvNetworkId = channel.tv_network_id ? channel.tv_network_id : "";
            // Get provider name
            const getTvDetails = await model.tvNetworks.findOne({
              attributes: ["id", "network_name", "logo"],
              where: { id: tvNetworkId, status: "active" },
            });
            if (getTvDetails) {
              const id = getTvDetails.id ? getTvDetails.id : "";
              const networkName = getTvDetails.network_name ? getTvDetails.network_name : "";
              const networkLogo = getTvDetails.logo
                ? await generalHelper.generateNetworkLogoUrl(req, getTvDetails.logo)
                : "";
              const record = {
                id: channelId,
                tv_network_id: id,
                tv_network_name: networkName,
                tv_network_logo: networkLogo,
              };
              list.push(record);
            }
          }
          getChannelList = list;
        }
      }
    } else if (titleId && seasonPkId) {
      // Get the details from the Season - Check for tmdb and kobis id in title
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
      // Watch On Details
      const watchOnDetails = await model.titleWatchOn.findAll({
        attributes: ["id", "title_id", "movie_id", "type", "provider_id", "season_id"],
        where: { title_id: titleId, season_id: seasonPkId, status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      });
      if (watchOnDetails) {
        let streamList = [];
        let rentList = [];
        let buyList = [];
        for (const eachRow of watchOnDetails) {
          if (eachRow) {
            if (eachRow.type && eachRow.type == "stream") {
              if (eachRow.ottServiceProvider) {
                const record = {
                  id: eachRow.id ? eachRow.id : "",
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  provider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  ott_logo_path: eachRow.ottServiceProvider.logo_path
                    ? await generalHelper.generateOttLogoUrl(
                        req,
                        eachRow.ottServiceProvider.logo_path,
                      )
                    : "",
                };
                streamList.push(record);
              }
            }
            if (eachRow.type && eachRow.type == "rent") {
              if (eachRow.ottServiceProvider) {
                const record = {
                  id: eachRow.id ? eachRow.id : "",
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  provider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  ott_logo_path: eachRow.ottServiceProvider.logo_path
                    ? await generalHelper.generateOttLogoUrl(
                        req,
                        eachRow.ottServiceProvider.logo_path,
                      )
                    : "",
                };
                rentList.push(record);
              }
            }
            if (eachRow.type && eachRow.type == "buy") {
              if (eachRow.ottServiceProvider) {
                const record = {
                  id: eachRow.id ? eachRow.id : "",
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  provider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  ott_logo_path: eachRow.ottServiceProvider.logo_path
                    ? await generalHelper.generateOttLogoUrl(
                        req,
                        eachRow.ottServiceProvider.logo_path,
                      )
                    : "",
                };
                buyList.push(record);
              }
            }
          }
        }
        getStreamList = streamList;
        getRentList = rentList;
        getBuyList = buyList;
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
      // Channel Details
      let relatedChannelList = await model.titleChannelList.findAll({
        attributes: ["id", "tv_network_id", "title_id", "season_id"],
        include: [
          {
            model: model.tvNetworks,
            as: "tvNetworkOne",
            attributes: ["network_name"],
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
              tv_network_id: eachRow.tv_network_id,
              tv_network_name:
                eachRow.tvNetworkOne && eachRow.tvNetworkOne.network_name
                  ? eachRow.tvNetworkOne.network_name
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
      tmdb_name: tmdbData.length != 0 ? tmdbData.results.title : "",
      display_image: seasonDetails ? seasonDetails.poster : "",
      release_date: seasonDetails ? seasonDetails.release_date : "",
      release_date_to: seasonDetails ? seasonDetails.release_date_to : "",
      total_episode: seasonDetails ? seasonDetails.episode_count : "",
      plot: seasonDetails ? seasonDetails.summary : "",
      tmdb_plot: tmdbData.length != 0 ? tmdbData.results.overview : "",
      aka: seasonDetails ? seasonDetails.aka : "",
      tmdb_aka: "",
      search_keyword_details: getSearchKeywordList,
      news_keyword_details: getNewsSearchKeywordList,
      getstream_list: getStreamList,
      getrent_list: getRentList,
      getbuy_list: getBuyList,
      getChannel_list: getChannelList,
    });
  } catch (error) {
    next(error);
  }
};
