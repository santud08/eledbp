import { tmdbService, titleService } from "../../../services/index.js";

/**
 * tmdbRefreshGetSeasonDetails
 * @param req
 * @param res
 */
export const tmdbRefreshGetSeasonDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const language = reqBody.language;

    // tmdb_id and season_no - if season_request is not created then we will get details from tmdb
    const tmdbId = reqBody.tmdb_id;
    const seasonNo = reqBody.season_no;
    const seasonId = reqBody.season_id ? reqBody.season_id : "";
    const titleId = reqBody.title_id;
    const titleType = "tv";
    let tmdbWatchData = [];
    let tmdbChannelData = [];
    let seasonDetails = {};
    let tmdbSeasonDetails = {};

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

    // TMDB WATCH DETAILS:
    tmdbWatchData = tmdbWatchDetails && tmdbWatchDetails.results ? tmdbWatchDetails.results : "";
    tmdbChannelData =
      tmdbChannelDetails && tmdbChannelDetails.results ? tmdbChannelDetails.results : "";

    //otherSeasonData - For search keyword and news search keyword
    const [watchDetails, channelDetails, otherSeasonData] = await Promise.all([
      titleService.watchOnFormat(titleId, titleType, tmdbWatchData, seasonId),
      titleService.channelFormat(titleId, titleType, tmdbChannelData, seasonId),
      titleService.otherSeasonData(titleId, titleType, language, seasonId),
    ]);

    res.ok({
      title_id: titleId,
      request_id: "",
      request_season_id: "",
      season_no: seasonNo,
      season_id: seasonId,
      season_name: tmdbSeasonDetails.season_name ? tmdbSeasonDetails.season_name : "",
      tmdb_name: "",
      display_image: tmdbSeasonDetails.display_image ? tmdbSeasonDetails.display_image : "",
      release_date: tmdbSeasonDetails.release_date ? tmdbSeasonDetails.release_date : "",
      release_date_to: seasonDetails.release_date_to ? seasonDetails.release_date_to : "",
      total_episode: tmdbSeasonDetails.total_episode ? tmdbSeasonDetails.total_episode : "",
      plot: tmdbSeasonDetails.summary ? tmdbSeasonDetails.summary : "",
      tmdb_plot: "",
      aka: tmdbSeasonDetails.aka ? tmdbSeasonDetails.aka : "",
      tmdb_aka: "",
      search_keyword_details:
        otherSeasonData && otherSeasonData.search_keyword_details
          ? otherSeasonData.search_keyword_details
          : [],
      news_keyword_details:
        otherSeasonData && otherSeasonData.news_keyword_details
          ? otherSeasonData.news_keyword_details
          : [],
      getstream_list: watchDetails ? watchDetails.stream : [],
      getrent_list: watchDetails ? watchDetails.rent : [],
      getbuy_list: watchDetails ? watchDetails.buy : [],
      getChannel_list: channelDetails,
    });
  } catch (error) {
    next(error);
  }
};
