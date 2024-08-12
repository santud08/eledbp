import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import model from "../../models/index.js";

/**
 * fetchTvChannels
 * get the tv channel
 * @param tmdbId - tmdb id
 * @param language
 */
export const fetchTvChannels = async (tmdbId, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };

    const API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}`;

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
      const results =
        result.networks && result.networks != null && result.networks != "undefined"
          ? result.networks
          : null;
      if (results && results != null && results != "undefined" && results.length > 0) {
        const networks = [];
        for (const item of results) {
          if (item) {
            const getNetwork = await model.tvNetworks.findOne({
              where: { tmdb_network_id: item.id, status: "active" },
            });
            if (getNetwork && getNetwork.id) {
              const getNetObj = {
                tv_network_id: getNetwork.id,
                tv_network_name: getNetwork.network_name,
                tv_network_logo: item.logo_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${item.logo_path}`
                  : "",
              };
              networks.push(getNetObj);
            }
          }
        }
        searchResult.results = networks;
      }
    }
    return searchResult;
  } catch (error) {
    return { results: [] };
  }
};
