import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS, YOUTUBE_URL, VIMEO_URL } from "../../utils/constants.js";

/**
 * fetchMovieVideos
 * fetch the movie video list
 * @param tmdbId - tmdb/tv id
 * @param seasonNo - season number
 * @param language - language
 */
export const fetchMovieVideos = async (tmdbId, language = "en") => {
  try {
    let searchParams = {};
    if (language) {
      searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    } else {
      searchParams = { api_key: envs.TMDB_API_KEY };
    }
    const API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/videos`;

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const axiosConfig = {
      method: "get",
      url: `${API_URL}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json;charset=utf-8",
      },
      httpsAgent: agent,
      params: searchParams,
    };
    const result = await axios(axiosConfig).then((results) => {
      if (results) {
        if (results.data) {
          return results.data;
        } else {
          return [];
        }
      } else {
        return [];
      }
    });
    const searchResult = { results: [] };
    if (result) {
      const videoResult = [];
      if (result.results && result.results.length > 0) {
        for (const eachData of result.results) {
          if (eachData) {
            let videoUrl = "";
            let videoSource = "";
            if (eachData.site == "YouTube") {
              videoUrl = eachData.key ? `${YOUTUBE_URL}${eachData.key}` : "";
              videoSource = "youtube";
            }
            if (eachData.site == "Vimeo") {
              videoUrl = eachData.key ? `${VIMEO_URL}${eachData.key}` : "";
              videoSource = "vimeo";
            }
            const vType = eachData.type;
            const official = eachData.official;
            const vdoObj = {
              video_title: eachData.name,
              video_url: videoUrl,
              video_source: videoSource,
              is_official_trailer: vType == "Trailer" && official == "true" ? "y" : "n",
            };
            videoResult.push(vdoObj);
          }
        }
      }
      searchResult.results = videoResult;
    }
    return searchResult;
  } catch (error) {
    return { results: [] };
  }
};
