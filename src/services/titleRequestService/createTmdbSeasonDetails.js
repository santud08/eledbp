import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { tmdbService, titleService } from "../../services/index.js";

export const createTmdbSeasonDetails = async (
  tmdbId,
  siteLanguage,
  seasonNo,
  userId,
  draftRequestId,
  titleFirstLanName,
  countryArr,
) => {
  try {
    const data = {};
    let responseDetails = [];
    let tmdbSeasonList = [];
    tmdbSeasonList = await tmdbService.fetchTvSeasons(tmdbId, siteLanguage);
    const tmdbSeasonNumberList = [];
    if (tmdbSeasonList && tmdbSeasonList.results && tmdbSeasonList.results.length > 0) {
      for (const value of tmdbSeasonList.results) {
        if (value) {
          tmdbSeasonNumberList.push(value.season_number);
        }
      }
    }
    const isKorean = await titleService.isKoreanData(countryArr);
    let news_search_keyword = [];
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

    if (tmdbSeasonNumberList && tmdbSeasonNumberList.length > 0) {
      const titleType = "tv";
      const listType = null;
      for (const value of tmdbSeasonNumberList) {
        if (value != seasonNo) {
          let tmdbWatchData = [];
          let watch_on_stream_list = [];
          let watch_on_rent_list = [];
          let watch_on_buy_list = [];
          let channel_list = [];
          const [seasonDetails, tmdbTitleAkaResult, tmdbWatchDetails, tmdbChannelDetails] =
            await Promise.all([
              tmdbService.fetchTvSeasonDetails(tmdbId, value, siteLanguage),
              tmdbService.fetchTitleAka(titleType, tmdbId, siteLanguage),
              tmdbService.fetchTitleWatch(titleType, tmdbId, listType, "ko"),
              tmdbService.fetchTvChannels(tmdbId, siteLanguage),
            ]);
          // AKA details from TMDB
          seasonDetails.aka =
            tmdbTitleAkaResult.results && tmdbTitleAkaResult.results.aka
              ? tmdbTitleAkaResult.results.aka
              : "";
          // TMDB WATCH DETAILS:
          tmdbWatchData =
            tmdbWatchDetails && tmdbWatchDetails.results ? tmdbWatchDetails.results : "";
          if (seasonDetails && seasonDetails.results) {
            const seasonObj = seasonDetails.results;
            data.season_no = seasonObj.season_number;
            data.season_details = {
              id: "",
              release_date: seasonObj.release_date ? seasonObj.release_date : null,
              release_date_to: "",
              poster: seasonObj.poster_image ? seasonObj.poster_image : null,
              number: seasonObj.season_number
                ? seasonObj.season_number
                : seasonObj.season_number == 0
                ? 0
                : 1,
              season_name: seasonObj.season_name ? seasonObj.season_name.trim() : "",
              title_id: "",
              title_tmdb_id: tmdbId,
              allow_update: "",
              summary: seasonObj.overview,
              aka: seasonDetails.aka,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              episode_count: seasonObj.no_of_episode,
              site_language: siteLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
          }
          //Watch on Details from TMDB
          //1.Stream
          if (tmdbWatchData.stream && tmdbWatchData.stream.length > 0) {
            for (const stream of tmdbWatchData.stream) {
              if (stream) {
                const record = {
                  id: "",
                  title_id: "",
                  movie_id: stream.movie_id,
                  url: "",
                  type: "stream",
                  provider_id: stream.provider_id,
                  season_id: "",
                  episode_id: "",
                  status: "",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  updated_at: "",
                  created_by: userId,
                  updated_by: "",
                };
                watch_on_stream_list.push(record);
              }
            }
          }
          //2.Rent
          if (tmdbWatchData.rent && tmdbWatchData.rent.length > 0) {
            for (const rent of tmdbWatchData.rent) {
              if (rent) {
                const record = {
                  id: "",
                  title_id: "",
                  movie_id: rent.movie_id,
                  url: "",
                  type: "rent",
                  provider_id: rent.provider_id,
                  season_id: "",
                  episode_id: "",
                  status: "",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  updated_at: "",
                  created_by: userId,
                  updated_by: "",
                };
                watch_on_rent_list.push(record);
              }
            }
          }
          //3.Buy
          if (tmdbWatchData.buy && tmdbWatchData.buy.length > 0) {
            for (const buy of tmdbWatchData.buy) {
              if (buy) {
                const record = {
                  id: "",
                  title_id: "",
                  movie_id: buy.movie_id,
                  url: "",
                  type: "buy",
                  provider_id: buy.provider_id,
                  season_id: "",
                  episode_id: "",
                  status: "",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  updated_at: "",
                  created_by: userId,
                  updated_by: "",
                };
                watch_on_buy_list.push(record);
              }
            }
          }
          //channel
          if (tmdbChannelDetails && tmdbChannelDetails.results) {
            for (const value of tmdbChannelDetails.results) {
              if (value) {
                const element = {
                  id: "",
                  title_id: "",
                  url: "",
                  tv_network_id: value.tv_network_id,
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
          }
          data.season_watch_on_stream_details = { list: watch_on_stream_list };
          data.season_watch_on_rent_details = { list: watch_on_rent_list };
          data.season_watch_on_buy_details = { list: watch_on_buy_list };
          data.season_search_keyword_details = { list: [] };
          data.season_news_search_keyword_details = { list: news_search_keyword };
          data.season_channel_details = { list: channel_list };
          data.request_id = draftRequestId;
          data.created_at = await customDateTimeHelper.getCurrentDateTime();
          data.created_by = userId;
          // creating Season ID
          await model.titleRequestSeasonDetails.create(data);

          // if resonse is needed then use below code
          const createdSeasonDetails = await model.titleRequestSeasonDetails.findAll({
            where: {
              request_id: draftRequestId,
              status: "active",
            },
          });
          if (createdSeasonDetails) {
            for (const seasonValue of createdSeasonDetails) {
              const element = {
                draft_request_id: seasonValue.request_id,
                draft_season_id: seasonValue.id,
              };
              responseDetails.push(element);
            }
          }
        }
      }
    }
    return responseDetails;
  } catch (e) {
    return { responseDetails: [] };
  }
};
