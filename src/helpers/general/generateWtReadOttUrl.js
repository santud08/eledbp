import url from "url";

/*
 * method generateWtReadOttUrl
 * used to create the full details url of the ott url for webtoons
 * return full url
 */

export const generateWtReadOttUrl = async (ottUrl, params, ottUrlType = null) => {
  let fullUrl = "";
  if (ottUrlType == "search") {
    if (ottUrl && params && params.search_params_values && params.search_params_values.SEARCHTEXT) {
      fullUrl = ottUrl.replace(
        `_:SEARCHTEXT`,
        `${params.search_params_values.SEARCHTEXT.replace("/", "-")}`,
      );
    }
  } else {
    let searchParams = ["ID", "KOTITLE"];
    let searchParamsValues = null;

    if (params && params.search_params) {
      searchParams = params.search_params;
    }
    if (params && params.search_params_values) {
      searchParamsValues = params.search_params_values;
    }

    if (ottUrl && searchParams && searchParams.length > 0) {
      for (const eachParams of searchParams) {
        if (eachParams) {
          if (searchParamsValues && typeof searchParamsValues[eachParams] != "undefined") {
            if (eachParams == "KOTITLE") {
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
