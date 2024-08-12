import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { KOBIS_APIS } from "../../utils/constants.js";

/**
 * fetchPeopleDetails for kobis api
 * @param details
 */
export const fetchPeopleDetails = async (kobisId, language = "en") => {
  try {
    const API_URL = KOBIS_APIS.GET_PEOPLE_DETAILS_API_URL;
    const searchParams = { key: envs.KOBIS_API_KEY };
    searchParams.peopleCd = kobisId;
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
        if (results.data && results.data.peopleInfoResult) {
          return results.data.peopleInfoResult;
        } else {
          return [];
        }
      } else {
        return [];
      }
    });
    const searchResult = {};
    if (result && result.peopleInfo) {
      if (result.peopleInfo.peopleCd) {
        const peopleResults = {};
        peopleResults.source = result.source;
        peopleResults.kobis_id = result.peopleInfo.peopleCd;
        peopleResults.people_name =
          language == "en" && result.peopleInfo.peopleNmEn != ""
            ? result.peopleInfo.peopleNmEn
            : result.peopleInfo.peopleNm;
        peopleResults.role_name = result.peopleInfo.repRoleNm;
        peopleResults.gender = result.peopleInfo.sex;
        peopleResults.birth_day = "";
        peopleResults.profile_image = "";

        delete result.peopleInfo.peopleCd;
        delete result.peopleInfo.peopleNm;
        delete result.peopleInfo.peopleNmEn;
        delete result.peopleInfo.sex;

        searchResult.results = { ...peopleResults, ...result.peopleInfo };
        return searchResult;
      } else {
        return { results: {} };
      }
    } else {
      return { results: {} };
    }
  } catch (error) {
    return { results: {} };
  }
};
