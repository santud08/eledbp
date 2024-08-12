import { tmdbService, titleService } from "../index.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * getTmdbRefreshTvData
 * @param tmdbId  //
 * @param titleId  // movie id
 * @param language // en, ko
 */
export const getTmdbRefreshTvData = async (tmdbId, titleId, language) => {
  try {
    const titleType = "tv";
    let tmdbData = [];
    let tmdbDataDetails = {};

    // IF TMDB ID is present then fetch the details to show Data below input box and For priority details
    // In this service Title keyword is removed - If needed in future it can be added from getmovie primary details

    const [tmdbResults, tmdbTitleCertification, getImdbId] = await Promise.all([
      tmdbService.fetchTitleDetails(titleType, tmdbId, language),
      tmdbService.fetchTitleCertification(titleType, tmdbId, "ko"),
      tmdbService.fetchTitleImdbId(titleType, tmdbId, language),
    ]);
    tmdbData = tmdbResults.results ? tmdbResults.results : "";

    // IMDB data
    // IMDB ID details from TMDB
    tmdbData.imdb_id =
      getImdbId && getImdbId.results && getImdbId.results.imdb_id ? getImdbId.results.imdb_id : "";

    // Certification details from TMDB
    tmdbData.certification =
      tmdbTitleCertification.results && tmdbTitleCertification.results.certification_key
        ? tmdbTitleCertification.results.certification_key
        : "";
    // TMDB DATA THAT SHOW BELOW THE INPUT BOX
    tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
    tmdbDataDetails.imdb_id = tmdbData.imdb_id;
    tmdbDataDetails.tmdb_title = tmdbData && tmdbData.title ? tmdbData.title : "";
    tmdbDataDetails.tmdb_summery = tmdbData && tmdbData.overview ? tmdbData.overview : "";
    tmdbDataDetails.tmdb_plot_summery =
      tmdbData && tmdbData.tmdb_plot_summery ? tmdbData.tmdb_plot_summery : "";
    tmdbDataDetails.tmdb_official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";

    tmdbData.runtime =
      tmdbData.episode_run_time &&
      tmdbData.episode_run_time != null &&
      tmdbData.episode_run_time != "undefined" &&
      tmdbData.episode_run_time.length > 0 &&
      tmdbData.episode_run_time[0]
        ? tmdbData.episode_run_time[0]
        : null;

    // Required format for watch Details
    // Country list:countryFormat
    // Get the other data: tivying_id, odk_id, kobis_id,plot_summary,search_keyword,news_search_keyword,footfalls,original work,connections,Re-release
    const tmdbCountry = tmdbData.production_countries ? tmdbData.production_countries : [];
    const [countryDetails, otherData, statusValue] = await Promise.all([
      titleService.countryFormat(titleId, titleType, tmdbCountry, language, null),
      titleService.otherTitleData(titleId, titleType, language),
      generalHelper.titleStatusKeyByValue(titleType, tmdbData.status),
    ]);

    // title id will be added in final response
    return {
      request_id: "",
      title_id: titleId,
      relation_id: "",
      credit_request_id: "",
      media_request_id: "",
      tag_request_id: "",
      season_request_id: "",
      episode_request_id: "",
      tmdb_id: tmdbId,
      imdb_id: tmdbDataDetails.imdb_id ? tmdbDataDetails.imdb_id : "",
      tiving_id: otherData && otherData.tiving_id ? otherData.tiving_id : "",
      odk_id: otherData && otherData.odk_id ? otherData.odk_id : "",
      title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      tmdb_title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      tmdb_summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      plot_summery: tmdbDataDetails.tmdb_plot_summery
        ? tmdbDataDetails.tmdb_plot_summery
        : otherData && otherData.plot_summery
        ? otherData.plot_summery
        : "",
      official_site: tmdbDataDetails.tmdb_official_site ? tmdbDataDetails.tmdb_official_site : "",
      tmdb_official_site: tmdbDataDetails.tmdb_official_site
        ? tmdbDataDetails.tmdb_official_site
        : "",
      search_keyword_details:
        otherData && otherData.search_keyword_details ? otherData.search_keyword_details : [],
      title_status: statusValue ? statusValue : "",
      status: "",
      release_date: tmdbData.release_date ? tmdbData.release_date : "",
      release_date_to: tmdbData.release_date_to ? tmdbData.release_date_to : "",
      rating: otherData && otherData.rating ? otherData.rating : "",
      runtime: tmdbData.runtime ? tmdbData.runtime : "",
      certification: tmdbData.certification ? tmdbData.certification : "",
      language: tmdbData.original_language ? tmdbData.original_language : "",
      countrylist: countryDetails ? countryDetails.countryList : [],
      getoriginalWork_list:
        otherData && otherData.getoriginalWork_list ? otherData.getoriginalWork_list : [],
      getconnection_list:
        otherData && otherData.getconnection_list ? otherData.getconnection_list : [],
    };
  } catch (error) {
    console.log("error", error);
    return {};
  }
};
