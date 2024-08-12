import model from "../../models/index.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * autoFillTitlePriorityDetails- Auto fill details will be sent in response
 * Priority based the TMDB and KOBIS details are sent
 * @param priorityDetails
 * @param tmdbData
 * @param kobisData
 * @param tmdbKeywordsData
 * @param titleType
 * @param language
 */

async function externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue) {
  if (tmdbPriority == 2 && tmdbValue != "") {
    return tmdbValue;
  } else if (kobisPriority == 2 && kobisValue != "") {
    return kobisValue;
  } else if (tmdbPriority == 3 && tmdbValue != "") {
    return tmdbValue;
  } else {
    return kobisValue;
  }
}
async function externalArrayValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue) {
  if (tmdbPriority == 2 && tmdbValue.length > 0) {
    return tmdbValue;
  } else if (kobisPriority == 2 && kobisValue.length > 0) {
    return kobisValue;
  } else if (tmdbPriority == 3 && tmdbValue.length > 0) {
    return tmdbValue;
  } else {
    return kobisValue;
  }
}

export const autoFillTitlePriorityDetails = async (
  priorityDetails,
  tmdbData,
  kobisData,
  tmdbKeywordsData,
  titleType,
  language,
) => {
  try {
    let resultData = {};
    let keywordName = [];

    // get only keyname from search keyword
    if (tmdbKeywordsData.keywords && tmdbKeywordsData.keywords.length > 0) {
      for (const keywords of tmdbKeywordsData.keywords) {
        keywordName.push(keywords.name);
      }
    }

    // Auto fill - Data from tmdb and kobis based on auto fill
    if (priorityDetails.length > 0) {
      for (const data of priorityDetails) {
        const priorityArrObj = data.dataValues ? data.dataValues : "";
        //checking for name:
        if (priorityArrObj && priorityArrObj.field_name == "title") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.title ? tmdbData.title : "";
          const kobisValue = kobisData.title ? kobisData.title : "";
          const name = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.name = name;
        }
        //checking for title_status:
        if (priorityArrObj && priorityArrObj.field_name == "status") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.status ? tmdbData.status : "";
          const kobisValue = kobisData.status ? kobisData.status : "";
          const titleStatus = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          const statusList = await generalHelper.titleStatus(titleType);
          resultData.title_status =
            statusList && titleStatus
              ? Object.keys(statusList).find((key) => statusList[key] === titleStatus)
              : "";
        }
        //checking for aka:
        if (priorityArrObj && priorityArrObj.field_name == "aka") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.aka ? tmdbData.aka : "";
          const kobisValue = kobisData.aka ? kobisData.aka : "";
          const aka = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.aka = aka;
        }
        //checking for summary:
        if (priorityArrObj && priorityArrObj.field_name == "summary") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.overview ? tmdbData.overview : "";
          const kobisValue = kobisData.overview ? kobisData.overview : "";
          const summary = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.summary = summary;
        }
        //checking for official_site:
        if (priorityArrObj && priorityArrObj.field_name == "official_site") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.homepage ? tmdbData.homepage : "";
          const kobisValue = kobisData.homepage ? kobisData.homepage : "";
          const officialSite = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.official_site = officialSite;
        }
        //checking for runtime:
        if (priorityArrObj && priorityArrObj.field_name == "runtime") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.runtime ? tmdbData.runtime : "";
          const kobisValue = kobisData.runtime ? kobisData.runtime : "";
          const runtime = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.runtime = runtime;
        }
        //checking for release date:
        if (priorityArrObj && priorityArrObj.field_name == "release_date") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.release_date ? tmdbData.release_date : "";
          const kobisValue = kobisData.release_date ? kobisData.release_date : "";
          const releaseDate = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.release_date = releaseDate;
        }
        //checking for original_language:
        if (priorityArrObj && priorityArrObj.field_name == "language") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.original_language ? tmdbData.original_language : "";
          const kobisValue = kobisData.original_language ? kobisData.original_language : "";
          const language = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.language = language;
        }
        // checking for country details
        if (priorityArrObj && priorityArrObj.field_name == "country") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue =
            tmdbData.production_countries && tmdbData.production_countries.length > 0
              ? tmdbData.production_countries
              : "";
          const kobisValue =
            kobisData.nations && kobisData.nations.length > 0 ? kobisData.nations : "";
          let tmdbCountryCode = [];
          let kobisCountryCode = [];
          if (tmdbValue != "" && tmdbValue.length > 0) {
            for (const code of tmdbValue) {
              if (code) {
                const countryDetails = await model.country.findOne({
                  attributes: ["id"],
                  where: {
                    country_code: code.iso_3166_1,
                  },
                  include: [
                    {
                      model: model.countryTranslation,
                      attributes: ["country_id", "country_name"],
                      left: true,
                      where: {
                        status: "active",
                        site_language: language,
                      },
                    },
                  ],
                });
                if (countryDetails) {
                  const element = {
                    id: countryDetails.id,
                    country_name:
                      countryDetails.countryTranslations &&
                      countryDetails.countryTranslations[0] &&
                      countryDetails.countryTranslations[0].country_name
                        ? countryDetails.countryTranslations[0].country_name
                        : "",
                  };
                  tmdbCountryCode.push(element);
                }
              }
            }
          }
          if (kobisValue != "") {
            for (const code of kobisValue) {
              if (code) {
                const countryDetails = await model.country.findOne({
                  attributes: ["id"],
                  include: [
                    {
                      model: model.countryTranslation,
                      attributes: ["country_id", "country_name"],
                      left: true,
                      where: {
                        country_name: code.nationNm,
                        status: "active",
                      },
                    },
                  ],
                  where: {
                    status: "active",
                  },
                });
                if (countryDetails) {
                  const element = {
                    id: countryDetails.id,
                    country_name:
                      countryDetails.countryTranslations &&
                      countryDetails.countryTranslations[0] &&
                      countryDetails.countryTranslations[0].country_name
                        ? countryDetails.countryTranslations[0].country_name
                        : "",
                  };
                  kobisCountryCode.push(element);
                }
              }
            }
          }

          const country = await externalArrayValues(
            tmdbPriority,
            kobisPriority,
            tmdbCountryCode,
            kobisCountryCode,
          );
          resultData.country = country;
        }
        // checking for search Keywords
        if (priorityArrObj && priorityArrObj.field_name == "search_keywords") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = keywordName;
          const kobisValue = [];

          const searchKeyword = await externalArrayValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.search_keywords = searchKeyword;
        }
        // Certification
        if (priorityArrObj && priorityArrObj.field_name == "certification") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.certification ? tmdbData.certification : "";
          const kobisValue = kobisData.certification ? kobisData.certification : "";
          const externalTitleCertification = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.certification = externalTitleCertification;
        }
      }
    }
    return resultData;
  } catch (error) {
    return { resultData: {} };
  }
};
