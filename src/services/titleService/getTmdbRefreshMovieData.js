import model from "../../models/index.js";
import { tmdbService, titleService } from "../index.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * getTmdbRefreshMovieData
 * @param tmdbId  //
 * @param titleId  // movie id
 * @param language // en, ko
 */
export const getTmdbRefreshMovieData = async (tmdbId, titleId, language) => {
  try {
    const titleType = "movie";
    let tmdbData = [];

    let tmdbWatchData = [];
    let tmdbMovieSeriesDetails = [];
    let getSeriesList = [];
    let tmdbDataDetails = {};
    let kobisDataDetails = {};

    // IF TMDB ID is present then fetch the details to show Data below input box and For priority details
    // In this service Title keyword is removed - If needed in future it can be added from getmovie primary details

    let listType = null;
    let dataType = "format";
    const [tmdbResults, tmdbTitleAkaResult, tmdbTitleCertification, tmdbWatchDetails] =
      await Promise.all([
        tmdbService.fetchTitleDetails(titleType, tmdbId, language),
        tmdbService.fetchTitleAka(titleType, tmdbId, language),
        tmdbService.fetchTitleCertification(titleType, tmdbId, "ko"),
        tmdbService.fetchTitleWatch(titleType, tmdbId, listType, "ko"),
      ]);
    tmdbData = tmdbResults.results ? tmdbResults.results : "";
    // AKA details from TMDB
    tmdbData.aka =
      tmdbTitleAkaResult.results && tmdbTitleAkaResult.results.all_aka
        ? tmdbTitleAkaResult.results.all_aka
        : "";
    tmdbData.akaList =
      tmdbTitleAkaResult.results &&
      tmdbTitleAkaResult.results.list &&
      tmdbTitleAkaResult.results.list.length > 0
        ? tmdbTitleAkaResult.results.list
        : "";
    // Certification details from TMDB
    tmdbData.certification =
      tmdbTitleCertification.results && tmdbTitleCertification.results.certification_key
        ? tmdbTitleCertification.results.certification_key
        : "";
    // TMDB DATA THAT SHOW BELOW THE INPUT BOX
    tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
    tmdbDataDetails.imdb_id = tmdbData && tmdbData.imdb_id ? tmdbData.imdb_id : "";
    tmdbDataDetails.tmdb_title = tmdbData && tmdbData.title ? tmdbData.title : "";
    tmdbDataDetails.tmdb_aka = tmdbData && tmdbData.aka ? tmdbData.aka : "";
    tmdbDataDetails.tmdb_summery = tmdbData && tmdbData.overview ? tmdbData.overview : "";
    tmdbDataDetails.tmdb_plot_summery =
      tmdbData && tmdbData.tmdb_plot_summery ? tmdbData.tmdb_plot_summery : "";
    tmdbDataDetails.tmdb_official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
    // TMDB WATCH DETAILS:
    tmdbWatchData = tmdbWatchDetails && tmdbWatchDetails.results ? tmdbWatchDetails.results : "";
    // TMDB MOVIE SERIES DETAILS:
    const collectionId =
      tmdbData && tmdbData.belongs_to_collection && tmdbData.belongs_to_collection.id
        ? tmdbData.belongs_to_collection.id
        : "";

    // For series Data
    if (collectionId) {
      const tmdbMovieSeries = await tmdbService.fetchMovieSeries(collectionId, dataType, language);
      tmdbMovieSeriesDetails = tmdbMovieSeries.results ? tmdbMovieSeries.results : "";
      // Get Series details
      if (tmdbMovieSeriesDetails.length > 0) {
        for (const series of tmdbMovieSeriesDetails) {
          // check our local db to get the title id if the TMDB ID is already added
          if (series && series.tmdb_id && !series.title_id) {
            if (series.tmdb_id != tmdbId) {
              const record = {
                title_id: series.title_id,
                title_name: series.title_name,
                title_poster: series.title_poster,
                tmdb_id: series.tmdb_id,
              };
              const relatedSeriesTitleList = await model.relatedSeriesTitle.findOne({
                attributes: ["id", "related_series_title_id", "title_id"],
                where: {
                  title_id: titleId,
                  related_series_title_id: series.title_id,
                  status: "active",
                },
              });
              record.id =
                relatedSeriesTitleList && relatedSeriesTitleList.id
                  ? relatedSeriesTitleList.id
                  : "";
              getSeriesList.push(record);
            }
          } else if (series && !series.tmdb_id && series.title_id) {
            if (series.title_id != titleId) {
              const record = {
                title_id: series.title_id,
                title_name: series.title_name,
                title_poster: series.title_poster,
                tmdb_id: series.tmdb_id,
              };
              const relatedSeriesTitleList = await model.relatedSeriesTitle.findOne({
                attributes: ["id", "related_series_title_id", "title_id"],
                where: {
                  title_id: titleId,
                  related_series_title_id: series.title_id,
                  status: "active",
                },
              });
              record.id =
                relatedSeriesTitleList && relatedSeriesTitleList.id
                  ? relatedSeriesTitleList.id
                  : "";
              getSeriesList.push(record);
            }
          }
        }
      }
    }
    // Required format for watch Details
    // Country list:countryFormat
    // Get the other data: tivying_id, odk_id, kobis_id,plot_summary,search_keyword,news_search_keyword,footfalls,original work,connections,Re-release
    const tmdbCountry = tmdbData.production_countries ? tmdbData.production_countries : [];
    const [watchDetails, countryDetails, otherData, statusValue] = await Promise.all([
      titleService.watchOnFormat(titleId, titleType, tmdbWatchData),
      titleService.countryFormat(titleId, titleType, tmdbCountry, language, null),
      titleService.otherTitleData(titleId, titleType, language, null),
      generalHelper.titleStatusKeyByValue(titleType, tmdbData.status),
    ]);

    // title id will be added in final response
    return {
      request_id: "",
      title_id: titleId,
      credit_request_id: "",
      media_request_id: "",
      tag_request_id: "",
      relation_id: "",
      tmdb_id: tmdbId,
      imdb_id: tmdbDataDetails.imdb_id ? tmdbDataDetails.imdb_id : "",
      tiving_id: otherData && otherData.tiving_id ? otherData.tiving_id : "",
      odk_id: otherData && otherData.odk_id ? otherData.odk_id : "",
      kobis_id: otherData && otherData.kobis_id ? otherData.kobis_id : "",
      title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      tmdb_title: tmdbDataDetails.tmdb_title ? tmdbDataDetails.tmdb_title : "",
      kobis_title: kobisDataDetails.kobis_title ? kobisDataDetails.kobis_title : "",
      aka: tmdbData.aka ? tmdbData.aka : "",
      tmdb_aka: tmdbData.akaList ? tmdbData.akaList : "",
      kobis_aka: "",
      summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      tmdb_summery: tmdbDataDetails.tmdb_summery ? tmdbDataDetails.tmdb_summery : "",
      kobis_summery: "",
      plot_summery: tmdbDataDetails.tmdb_plot_summery
        ? tmdbDataDetails.tmdb_plot_summery
        : otherData && otherData.plot_summery
        ? otherData.plot_summery
        : "",
      tmdb_plot_summery: "",
      official_site: tmdbDataDetails.tmdb_official_site ? tmdbDataDetails.tmdb_official_site : "",
      tmdb_official_site: tmdbDataDetails.tmdb_official_site
        ? tmdbDataDetails.tmdb_official_site
        : "",
      kobis_official_site: "",
      search_keyword_details:
        otherData && otherData.search_keyword_details ? otherData.search_keyword_details : [],
      news_keyword_details:
        otherData && otherData.news_keyword_details ? otherData.news_keyword_details : [],
      title_status: statusValue ? statusValue : "",
      status: "",
      release_date: tmdbData.release_date ? tmdbData.release_date : "",
      is_rerelease: otherData && otherData.is_rerelease ? otherData.is_rerelease : "",
      re_releasedate: otherData && otherData.re_releasedate ? otherData.re_releasedate : [],
      footfalls: otherData && otherData.footfalls ? otherData.footfalls : "",
      runtime: tmdbData.runtime ? tmdbData.runtime : "",
      certification: tmdbData.certification ? tmdbData.certification : "",
      language: tmdbData.original_language ? tmdbData.original_language : "",
      countrylist: countryDetails ? countryDetails.countryList : [],
      getoriginalWork_list:
        otherData && otherData.getoriginalWork_list ? otherData.getoriginalWork_list : [],
      getstream_list: watchDetails ? watchDetails.stream : [],
      getrent_list: watchDetails ? watchDetails.rent : [],
      getbuy_list: watchDetails ? watchDetails.buy : [],
      getconnection_list:
        otherData && otherData.getconnection_list ? otherData.getconnection_list : [],
      getseries_list: getSeriesList,
    };
  } catch (error) {
    console.log("error", error);
    return {};
  }
};
