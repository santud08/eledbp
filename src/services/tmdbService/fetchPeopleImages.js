import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { customFileHelper } from "../../helpers/index.js";

/**
 * fetchPeopleImages
 * get the people images
 * @param tmdbId - tmdb id
 * @param language
 */
export const fetchPeopleImages = async (tmdbId, language = "en") => {
  try {
    const API_URL = `${TMDB_APIS.PEOPLE_DETAILS_API_URL}/${tmdbId}/images`;
    let searchParams = {};
    if (language) {
      searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    } else {
      searchParams = { api_key: envs.TMDB_API_KEY };
    }

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
      const imageResults = {};
      imageResults["images"] = [];
      if (result["profiles"] && result["profiles"].length > 0) {
        for (const eachData of result["profiles"]) {
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
            imageResults["images"].push(imgObj);
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
