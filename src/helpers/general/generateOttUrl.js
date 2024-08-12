import { OTT_URL } from "../../utils/constants.js";
import url from "url";

/*
 * method generateOttUrl
 * used to create the full details url of the ott url
 * return full url
 */

export const generateOttUrl = async (ottUrl, params, ottUrlType = null) => {
  let fullUrl = "";
  if (ottUrlType == "search") {
    if (ottUrl && params && params.search_params_values && params.search_params_values.SEARCHTEXT) {
      fullUrl = ottUrl.replace(
        `_:SEARCHTEXT`,
        `${params.search_params_values.SEARCHTEXT.replace("/", "-")}`,
      );
    }
  } else {
    let searchParams = ["ID", "category", "type", "paramname", "title"];
    let searchParamsValues = null;
    let preDefineCategory = "";
    let preDefineType = "";
    let preDefineParamname = "";
    if (params && params.search_params) {
      searchParams = params.search_params;
    }
    if (params && params.search_params_values) {
      searchParamsValues = params.search_params_values;
    }
    if (params && params.type) {
      if (params.type == "movie") {
        if (
          getKeyByValue(OTT_URL, ottUrl) == "apple_itune" ||
          getKeyByValue(OTT_URL, ottUrl) == "apple_tv_plus"
        ) {
          preDefineCategory = "movie";
        }
        if (getKeyByValue(OTT_URL, ottUrl) == "naver_store") {
          preDefineCategory = "movie";
          preDefineType = "movie";
        }
        if (getKeyByValue(OTT_URL, ottUrl) == "wavve") {
          preDefineType = "movie";
          preDefineParamname = "movieid";
        }
        if (getKeyByValue(OTT_URL, ottUrl) == "disney_plus") {
          preDefineCategory = "movies";
        }
      }
      if (params.type == "tv") {
        if (
          getKeyByValue(OTT_URL, ottUrl) == "apple_itune" ||
          getKeyByValue(OTT_URL, ottUrl) == "apple_tv_plus"
        ) {
          preDefineCategory = "show";
        }
        if (getKeyByValue(OTT_URL, ottUrl) == "wavve") {
          preDefineType = "vod";
          preDefineParamname = "programid";
        }

        if (getKeyByValue(OTT_URL, ottUrl) == "naver_store") {
          preDefineType = "broadcasting";
        }

        if (getKeyByValue(OTT_URL, ottUrl) == "disney_plus") {
          preDefineCategory = "series";
        }
      }
    }

    if (ottUrl && searchParams && searchParams.length > 0) {
      for (const eachParams of searchParams) {
        if (eachParams) {
          if (searchParamsValues && typeof searchParamsValues[eachParams] != "undefined") {
            if (eachParams == "title") {
              ottUrl = ottUrl.replace(
                `_:${eachParams}`,
                `${searchParamsValues[eachParams].replace("/", "-")}`,
              );
            } else {
              ottUrl = ottUrl.replace(`_:${eachParams}`, `${searchParamsValues[eachParams]}`);
            }
          }
        }
      }
      if (preDefineCategory) {
        ottUrl = ottUrl.replace(`_:category`, preDefineCategory);
      }
      if (preDefineType) {
        ottUrl = ottUrl.replace(`_:type`, preDefineType);
      }
      if (preDefineParamname) {
        ottUrl = ottUrl.replace(`_:paramname`, preDefineParamname);
      }
      fullUrl = ottUrl;
    }
    if (
      searchParamsValues.ID != "undefined" &&
      fullUrl &&
      (searchParamsValues.ID == "" || searchParamsValues.ID == null)
    ) {
      const parseUrl = url.parse(fullUrl);
      if (parseUrl && parseUrl != "undefined" && parseUrl != null) {
        const protocol = parseUrl.protocol ? parseUrl.protocol : null;
        const host = parseUrl.hostname ? parseUrl.hostname : null;
        if (
          protocol &&
          protocol != "undefined" &&
          protocol != null &&
          host &&
          host != "undefined" &&
          host != null
        ) {
          fullUrl = `${protocol}//${host}`;
        }
      }
    }
  }
  return fullUrl;
};

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};
