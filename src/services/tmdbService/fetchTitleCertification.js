import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { languageService } from "../../services/index.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * fetchTitleCertification
 * get the title certification
 * @param type - movie/tv
 * @param tmdbId - tmdb id
 * @param language
 */

export const fetchTitleCertification = async (type, tmdbId, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    let API_URL = "";
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/release_dates`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/content_ratings`;
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
    const searchResult = { results: { certification_key: "", certification_text: "" } };
    if (result) {
      let results = result.results && result.results.length > 0 ? result.results : [];

      if (results && results.length > 0) {
        const isoLan = await languageService.getIsoCode(language);
        if (isoLan) {
          let certificationText = "";
          let certification = "";
          if (type == "movie") {
            const getRelease = results.filter(function (value) {
              return value.iso_3166_1 == isoLan;
            });
            if (getRelease && getRelease.length > 0) {
              if (getRelease[0].release_dates && getRelease[0].release_dates.length > 0) {
                if (
                  getRelease[0].release_dates[0] &&
                  getRelease[0].release_dates[0].certification
                ) {
                  certificationText = getRelease[0].release_dates[0].certification;
                }
                if (certificationText == "") {
                  if (
                    getRelease[0].release_dates[1] &&
                    getRelease[0].release_dates[1].certification
                  ) {
                    certificationText = getRelease[0].release_dates[1].certification;
                  }
                }
              }
            }
          } else if (type == "tv") {
            const getRelease = results.filter(function (value) {
              return value.iso_3166_1 == isoLan;
            });
            if (getRelease && getRelease.length > 0) {
              if (getRelease[0] && getRelease[0].rating) {
                certificationText = getRelease[0].rating;
              }
              if (certificationText == "") {
                if (getRelease[1] && getRelease[1].rating) {
                  certificationText = getRelease[1].rating;
                }
              }
            }
          }

          if (certificationText && certificationText != null && certificationText != "undefined") {
            certification = await generalHelper.titleCertificationKeyByValue(
              type,
              certificationText.toLowerCase(),
            );
          }
          searchResult.results = {
            certification_key: certification,
            certification_text: certificationText,
          };
        }
      }
    }
    return searchResult;
  } catch (error) {
    return { results: { certification_key: "", certification_text: "" } };
  }
};
