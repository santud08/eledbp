import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { customFileHelper } from "../../helpers/index.js";

/**
 * fetchTvSeasonImages
 * fetch the tv season image list
 * @param tmdbId - tmdb/tv id
 * @param seasonNo - season number
 * @param type - poster_image/bg_image/image
 * @param language - language
 */
export const fetchTvSeasonImages = async (tmdbId, seasonNo, type, language = "en") => {
  try {
    let searchParams = {};
    if (language) {
      searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    } else {
      searchParams = { api_key: envs.TMDB_API_KEY };
    }
    const API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/season/${seasonNo}/images`;
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
    const searchResult = { results: {} };
    if (result) {
      let imageResults = {};
      let fetchType = "posters";
      if (type == "bg_image") fetchType = "backdrops";
      if (type && fetchType && result[fetchType] && result[fetchType].length > 0) {
        for (const eachData of result[fetchType]) {
          if (eachData) {
            imageResults[type] = imageResults[type] || [];
            const fileName = eachData.file_path ? eachData.file_path.replace("/", "") : "";
            const imgObj = {
              originalname: fileName,
              filename: fileName,
              path: eachData.file_path
                ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.file_path}`
                : "",
              size: "",
              file_extension: eachData.file_path
                ? await customFileHelper.getFileExtByFileName(eachData.file_path)
                : "",
              mime_type: "",
            };
            imageResults[type].push(imgObj);
          }
        }
      } else {
        imageResults["bg_image"] = [];
        if (result["backdrops"] && result["backdrops"].length > 0) {
          for (const eachData of result["backdrops"]) {
            if (eachData) {
              const fileName = eachData.file_path ? eachData.file_path.replace("/", "") : "";

              const imgObj = {
                originalname: fileName,
                filename: fileName,
                path: eachData.file_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.file_path}`
                  : "",
                size: "",
                file_extension: eachData.file_path
                  ? await customFileHelper.getFileExtByFileName(eachData.file_path)
                  : "",
                mime_type: "",
              };
              imageResults["bg_image"].push(imgObj);
            }
          }
        }
        imageResults["poster_image"] = [];
        if (result["posters"] && result["posters"].length > 0) {
          for (const eachData of result["posters"]) {
            if (eachData) {
              const fileName = eachData.file_path ? eachData.file_path.replace("/", "") : "";
              const imgObj = {
                originalname: fileName,
                filename: fileName,
                path: eachData.file_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.file_path}`
                  : "",
                size: "",
                file_extension: eachData.file_path
                  ? await customFileHelper.getFileExtByFileName(eachData.file_path)
                  : "",
                mime_type: "",
              };
              imageResults["poster_image"].push(imgObj);
            }
          }
        }
      }
      searchResult.results = imageResults;
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
