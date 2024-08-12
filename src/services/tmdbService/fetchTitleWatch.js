import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { languageService } from "../../services/index.js";
import model from "../../models/index.js";

/**
 * fetchTitleWatch
 * get the title watch proider
 * @param type - movie/tv
 * @param tmdbId - tmdb id
 * @param listType - rent/buy/stream
 * @param language
 */
export const fetchTitleWatch = async (type, tmdbId, listType = null, language = "en") => {
  try {
    let API_URL = "";
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/watch/providers`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/watch/providers`;
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
    const resultDefaultObj = {};
    if (listType == null) {
      resultDefaultObj.stream = [];
      resultDefaultObj.rent = [];
      resultDefaultObj.buy = [];
    } else {
      resultDefaultObj[listType] = [];
    }
    const searchResult = { results: resultDefaultObj };
    if (result) {
      const results =
        result.results && result.results != null && result.results != "undefined"
          ? result.results
          : null;
      if (results && results != null && results != "undefined" && Object.keys(results).length > 0) {
        const isoLan = await languageService.getIsoCode(language);
        if (isoLan) {
          const getProviders =
            results[isoLan] && results[isoLan] != "undefined" ? results[isoLan] : null;
          if (
            getProviders &&
            getProviders != null &&
            getProviders != "undefined" &&
            Object.keys(getProviders).length > 0
          ) {
            if (
              getProviders.flatrate &&
              getProviders.flatrate.length > 0 &&
              (listType == "stream" || listType == null)
            ) {
              const flatrate = [];
              for (const item of getProviders.flatrate) {
                if (item) {
                  const getOtt = await model.ottServiceProvider.findOne({
                    where: { tmdb_provider_id: item.provider_id, status: "active" },
                  });
                  if (getOtt && getOtt.id) {
                    const getOttObj = {
                      provider_id: getOtt.id,
                      movie_id: "",
                      provider_name: getOtt.ott_name,
                      ott_logo_path: item.logo_path
                        ? `${TMDB_APIS.IMAGES.secure_base_url}original${item.logo_path}`
                        : "",
                    };
                    flatrate.push(getOttObj);
                  }
                }
              }
              searchResult.results.stream = flatrate;
            }
            if (
              getProviders.rent &&
              getProviders.rent.length > 0 &&
              (listType == "rent" || listType == null)
            ) {
              const rent = [];
              for (const item of getProviders.rent) {
                if (item) {
                  const getOtt = await model.ottServiceProvider.findOne({
                    where: { tmdb_provider_id: item.provider_id, status: "active" },
                  });
                  if (getOtt && getOtt.id) {
                    const getOttObj = {
                      provider_id: getOtt.id,
                      movie_id: "",
                      provider_name: getOtt.ott_name,
                      ott_logo_path: item.logo_path
                        ? `${TMDB_APIS.IMAGES.secure_base_url}original${item.logo_path}`
                        : "",
                    };
                    rent.push(getOttObj);
                  }
                }
              }
              searchResult.results.rent = rent;
            }
            if (
              getProviders.buy &&
              getProviders.buy.length > 0 &&
              (listType == "buy" || listType == null)
            ) {
              const buy = [];
              for (const item of getProviders.buy) {
                if (item) {
                  const getOtt = await model.ottServiceProvider.findOne({
                    where: { tmdb_provider_id: item.provider_id, status: "active" },
                  });
                  if (getOtt && getOtt.id) {
                    const getOttObj = {
                      provider_id: getOtt.id,
                      movie_id: "",
                      provider_name: getOtt.ott_name,
                      ott_logo_path: item.logo_path
                        ? `${TMDB_APIS.IMAGES.secure_base_url}original${item.logo_path}`
                        : "",
                    };
                    buy.push(getOttObj);
                  }
                }
              }
              searchResult.results.buy = buy;
            }
          }
        }
      }
    }
    return searchResult;
  } catch (error) {
    return { results: { stream: [], rent: [], buy: [] } };
  }
};
