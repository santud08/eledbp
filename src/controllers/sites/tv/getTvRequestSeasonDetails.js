import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { tmdbService } from "../../../services/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * getTvRequestSeasonDetails
 * @param req
 * @param res
 */
export const getTvRequestSeasonDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid request id"));
    }

    const requestId = reqBody.id; //It will be request  id
    const seasonId = req.query.season_id ? req.query.season_id : ""; //It will be season  id
    const language = req.query.language;
    // tmdb_id and season_no - if season_request is not created then we will get details from tmdb
    const tmdbId = req.query.tmdb_id ? req.query.tmdb_id : "";
    const seasonNo = req.query.season_no ? req.query.season_no : "";
    const specialSeason = seasonNo == 0 ? true : false;

    const titleType = "tv";
    let tmdbWatchData = [];
    let getNewsSearchKeywordList = [],
      getStreamList = [],
      getRentList = [],
      getBuyList = [],
      getChannelList = [],
      getSearchKeywordList = [];
    let seasonDetails = {};
    let tmdbSeasonDetails = {};
    let tmdbSeasonShowDetails = {};

    // The details from TMDB are fetched for suggestion below input box
    if (tmdbId && seasonNo) {
      const [seasonData, seasonAkaResult] = await Promise.all([
        tmdbService.fetchTvSeasonDetails(tmdbId, seasonNo, language),
        tmdbService.fetchTitleAka(titleType, tmdbId, language),
      ]);
      if (seasonData && seasonData.results) {
        tmdbSeasonShowDetails.season_name = seasonData.results.season_name;
        tmdbSeasonShowDetails.summary = seasonData.results.overview;
      }
      // AKA
      if (seasonAkaResult && seasonAkaResult.results) {
        tmdbSeasonShowDetails.aka = seasonAkaResult.results.aka ? seasonAkaResult.results.aka : "";
        tmdbSeasonShowDetails.akaList =
          seasonAkaResult.results.list && seasonAkaResult.results.list.length > 0
            ? seasonAkaResult.results.list
            : "";
      }
    }
    if (seasonId) {
      // if seasonId is not empty then get details from season table
      const getSeasonInformations = await model.titleRequestSeasonDetails.findOne({
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
          id: seasonId,
          request_id: requestId,
          status: "active",
        },
      });

      if (!getSeasonInformations) throw StatusError.badRequest(res.__("Invalid Season ID"));

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
      // Get Stream details
      const streamDetails = JSON.parse(getSeasonInformations.season_watch_on_stream_details);
      if (streamDetails) {
        let list = [];
        for (const stream of streamDetails.list) {
          if (stream) {
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
    } else if (tmdbId) {
      if (seasonNo) {
        let listType = null;
        // fetch season details from tmdb with respect to tmdb_id and season_no
        const [tmdbSeasonData, tmdbTitleAkaResult, tmdbWatchDetails, tmdbChannelDetails] =
          await Promise.all([
            tmdbService.fetchTvSeasonDetails(tmdbId, seasonNo, language),
            tmdbService.fetchTitleAka(titleType, tmdbId, language),
            tmdbService.fetchTitleWatch(titleType, tmdbId, listType, "ko"),
            tmdbService.fetchTvChannels(tmdbId, language),
          ]);
        if (tmdbSeasonData && tmdbSeasonData.results) {
          tmdbSeasonDetails.season_no = tmdbSeasonData.results.season_number;
          tmdbSeasonDetails.season_name = tmdbSeasonData.results.season_name;
          tmdbSeasonDetails.display_image = tmdbSeasonData.results.poster_image;
          tmdbSeasonDetails.release_date = tmdbSeasonData.results.release_date;
          tmdbSeasonDetails.total_episode = tmdbSeasonData.results.no_of_episode;
          tmdbSeasonDetails.summary = tmdbSeasonData.results.overview;
        }
        if (tmdbTitleAkaResult && tmdbTitleAkaResult.results) {
          tmdbSeasonDetails.aka = tmdbTitleAkaResult.results.all_aka
            ? tmdbTitleAkaResult.results.all_aka
            : "";
          tmdbSeasonDetails.akaList =
            tmdbTitleAkaResult.results.list && tmdbTitleAkaResult.results.list.length > 0
              ? tmdbTitleAkaResult.results.list
              : "";
        }
        if (tmdbWatchDetails && tmdbWatchDetails.results) {
          // TMDB WATCH DETAILS:
          tmdbWatchData =
            tmdbWatchDetails && tmdbWatchDetails.results ? tmdbWatchDetails.results : "";
          //Watch on Details from TMDB
          //1.Stream
          if (tmdbWatchData.stream && tmdbWatchData.stream.length > 0) {
            for (const stream of tmdbWatchData.stream) {
              if (stream) {
                const record = {
                  provider_id: stream.provider_id,
                  movie_id: stream.movie_id,
                  provider_name: stream.provider_name,
                  ott_logo_path: stream.ott_logo_path,
                };
                getStreamList.push(record);
              }
            }
          }
          //2.Rent
          if (tmdbWatchData.rent && tmdbWatchData.rent.length > 0) {
            for (const rent of tmdbWatchData.rent) {
              if (rent) {
                const record = {
                  provider_id: rent.provider_id,
                  movie_id: rent.movie_id,
                  provider_name: rent.provider_name,
                  ott_logo_path: rent.ott_logo_path,
                };
                getRentList.push(record);
              }
            }
          }
          //3.Buy
          if (tmdbWatchData.buy && tmdbWatchData.buy.length > 0) {
            for (const buy of tmdbWatchData.buy) {
              if (buy) {
                const record = {
                  provider_id: buy.provider_id,
                  movie_id: buy.movie_id,
                  provider_name: buy.provider_name,
                  ott_logo_path: buy.ott_logo_path,
                };
                getBuyList.push(record);
              }
            }
          }
        }
        if (tmdbChannelDetails && tmdbChannelDetails.results) {
          for (const value of tmdbChannelDetails.results) {
            const record = {
              tv_network_id: value.tv_network_id,
              tv_network_name: value.tv_network_name,
              tv_network_logo: value.tv_network_logo,
            };
            getChannelList.push(record);
          }
        }
      } else if (specialSeason) {
        // season no 0 - special season
        const seasonNo = 0;
        let listType = null;
        const [tmdbSeasonData, tmdbTitleAkaResult, tmdbWatchDetails, tmdbChannelDetails] =
          await Promise.all([
            tmdbService.fetchTvSeasonDetails(tmdbId, seasonNo, language),
            tmdbService.fetchTitleAka(titleType, tmdbId, language),
            tmdbService.fetchTitleWatch(titleType, tmdbId, listType, "ko"),
            tmdbService.fetchTvChannels(tmdbId, language),
          ]);
        if (tmdbSeasonData && tmdbSeasonData.results) {
          tmdbSeasonDetails.season_no = tmdbSeasonData.results.season_number;
          tmdbSeasonDetails.season_name = tmdbSeasonData.results.season_name;
          tmdbSeasonDetails.display_image = tmdbSeasonData.results.poster_image;
          tmdbSeasonDetails.release_date = tmdbSeasonData.results.release_date;
          tmdbSeasonDetails.total_episode = tmdbSeasonData.results.no_of_episode;
          tmdbSeasonDetails.summary = tmdbSeasonData.results.overview;
        }
        if (tmdbTitleAkaResult && tmdbTitleAkaResult.results) {
          tmdbSeasonDetails.aka = tmdbTitleAkaResult.results.aka
            ? tmdbTitleAkaResult.results.aka
            : "";
          tmdbSeasonDetails.akaList =
            tmdbTitleAkaResult.results.list && tmdbTitleAkaResult.results.list.length > 0
              ? tmdbTitleAkaResult.results.list
              : "";
        }
        if (tmdbWatchDetails && tmdbWatchDetails.results) {
          // TMDB WATCH DETAILS:
          tmdbWatchData =
            tmdbWatchDetails && tmdbWatchDetails.results ? tmdbWatchDetails.results : "";

          //Watch on Details from TMDB
          //1.Stream
          if (tmdbWatchData.stream && tmdbWatchData.stream.length > 0) {
            for (const stream of tmdbWatchData.stream) {
              if (stream) {
                const record = {
                  provider_id: stream.provider_id,
                  movie_id: stream.movie_id,
                  provider_name: stream.provider_name,
                  ott_logo_path: stream.ott_logo_path,
                };
                getStreamList.push(record);
              }
            }
          }
          //2.Rent
          if (tmdbWatchData.rent && tmdbWatchData.rent.length > 0) {
            for (const rent of tmdbWatchData.rent) {
              if (rent) {
                const record = {
                  provider_id: rent.provider_id,
                  movie_id: rent.movie_id,
                  provider_name: rent.provider_name,
                  ott_logo_path: rent.ott_logo_path,
                };
                getRentList.push(record);
              }
            }
          }
          //3.Buy
          if (tmdbWatchData.buy && tmdbWatchData.buy.length > 0) {
            for (const buy of tmdbWatchData.buy) {
              if (buy) {
                const record = {
                  provider_id: buy.provider_id,
                  movie_id: buy.movie_id,
                  provider_name: buy.provider_name,
                  ott_logo_path: buy.ott_logo_path,
                };
                getBuyList.push(record);
              }
            }
          }
        }
        if (tmdbChannelDetails && tmdbChannelDetails.results) {
          for (const value of tmdbChannelDetails.results) {
            const record = {
              tv_network_id: value.tv_network_id,
              tv_network_name: value.tv_network_name,
              tv_network_logo: value.tv_network_logo,
            };
            getChannelList.push(record);
          }
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
          : !seasonId && tmdbSeasonDetails.season_no != "" && tmdbSeasonDetails.season_no
          ? tmdbSeasonDetails.season_no
          : !seasonId && tmdbSeasonDetails.season_no == 0
          ? 0
          : "",
      season_name: seasonDetails.season_name
        ? seasonDetails.season_name
        : !seasonId && tmdbSeasonDetails.season_name
        ? tmdbSeasonDetails.season_name
        : "",
      tmdb_season_name: tmdbSeasonShowDetails.season_name ? tmdbSeasonShowDetails.season_name : "",
      display_image: seasonDetails.poster
        ? seasonDetails.poster
        : !seasonId && tmdbSeasonDetails.display_image
        ? tmdbSeasonDetails.display_image
        : "",
      release_date: seasonDetails.release_date
        ? seasonDetails.release_date
        : !seasonId && tmdbSeasonDetails.release_date
        ? tmdbSeasonDetails.release_date
        : "",
      release_date_to: seasonDetails.release_date_to ? seasonDetails.release_date_to : "",
      total_episode: seasonDetails.episode_count
        ? seasonDetails.episode_count
        : !seasonId && tmdbSeasonDetails.total_episode
        ? tmdbSeasonDetails.total_episode
        : "",
      plot: seasonDetails.summary
        ? seasonDetails.summary
        : !seasonId && tmdbSeasonDetails.summary
        ? tmdbSeasonDetails.summary
        : "",
      tmdb_plot: tmdbSeasonShowDetails.summary ? tmdbSeasonShowDetails.summary : "",
      aka: seasonDetails.aka
        ? seasonDetails.aka
        : !seasonId && tmdbSeasonDetails.aka
        ? tmdbSeasonDetails.aka
        : "",
      tmdb_aka: tmdbSeasonShowDetails.akaList ? tmdbSeasonShowDetails.akaList : "",
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
