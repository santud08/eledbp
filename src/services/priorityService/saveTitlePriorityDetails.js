import model from "../../models/index.js";
import { tmdbService, kobisService } from "../index.js";

/**
 * saveTitlePriorityDetails- send the priority data to add movie primary details for auto fill
 * when the user clicks on the save button
 * @param req
 * @param type
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

export const saveTitlePriorityDetails = async (req, type) => {
  try {
    const reqData = req.body;
    const titleType = type;
    let resultData = {};
    let tmdbData = {};
    let kobisData = {};

    if (reqData.tmdb_id) {
      const tmdbResults = await tmdbService.fetchTitleDetails(
        type,
        reqData.tmdb_id,
        reqData.language,
      );
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
    }

    if (reqData.kobis_id) {
      const kobisResults = await kobisService.fetchTitleDetails(
        type,
        reqData.kobis_id,
        reqData.language,
      );
      kobisData = kobisResults.results ? kobisResults.results : "";
    }

    // need to create a service to send the type and field name to get the values
    const priorityDetails = await model.priority.findAll({
      where: { type: titleType, status: "active" },
    });

    for (const data of priorityDetails) {
      const priorityArrObj = data.dataValues ? data.dataValues : "";
      //checking for name:
      if (reqData.name == "" && priorityArrObj != "" && priorityArrObj.field_name == "title") {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.title ? tmdbData.title : "";
        const kobisValue = kobisData != "" && kobisData.title ? kobisData.title : "";
        const name = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.name = name;
      }
      //checking for title_status:
      if (
        reqData.title_status == "" &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "status"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.status ? tmdbData.status : "";
        const kobisValue = kobisData != "" && kobisData.status ? kobisData.status : "";
        const titleStatus = await externalValues(
          tmdbPriority,
          kobisPriority,
          tmdbValue,
          kobisValue,
        );
        resultData.title_status = titleStatus;
      }
      //checking for aka:
      if (
        reqData.aka &&
        reqData.aka == "" &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "aka"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.aka ? tmdbData.aka : "";
        const kobisValue = kobisData != "" && kobisData.aka ? kobisData.aka : "";
        const aka = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.aka = aka;
      }
      //checking for summary:
      if (reqData.summary == "" && priorityArrObj != "" && priorityArrObj.field_name == "summary") {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.overview ? tmdbData.overview : "";
        const kobisValue = kobisData != "" && kobisData.overview ? kobisData.overview : "";
        const summary = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.summary = summary;
      }
      //checking for official_site:
      if (
        reqData.official_site == "" &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "official_site"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.homepage ? tmdbData.homepage : "";
        const kobisValue = kobisData != "" && kobisData.homepage ? kobisData.homepage : "";
        const officialSite = await externalValues(
          tmdbPriority,
          kobisPriority,
          tmdbValue,
          kobisValue,
        );
        resultData.official_site = officialSite;
      }
      //checking for runtime:
      if (reqData.runtime == "" && priorityArrObj != "" && priorityArrObj.field_name == "runtime") {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.runtime ? tmdbData.runtime : "";
        const kobisValue = kobisData != "" && kobisData.runtime ? kobisData.runtime : "";
        const runtime = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.runtime = runtime;
      }
      //checking for release date:
      if (
        reqData.release_date == "" &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "release_date"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.release_date ? tmdbData.release_date : "";
        const kobisValue = kobisData != "" && kobisData.release_date ? kobisData.release_date : "";
        const releaseDate = await externalValues(
          tmdbPriority,
          kobisPriority,
          tmdbValue,
          kobisValue,
        );
        resultData.release_date = releaseDate;
      }
      //checking for original_language:
      if (
        reqData.language == "" &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "language"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue =
          tmdbData != "" && tmdbData.original_language ? tmdbData.original_language : "";
        const kobisValue =
          kobisData != "" && kobisData.original_language ? kobisData.original_language : "";
        const language = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.language = language;
      }

      // checking for country details
      if (
        reqData.country &&
        reqData.country.length == 0 &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "country"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue =
          tmdbData != "" &&
          tmdbData.production_countries &&
          tmdbData.production_countries.length > 0
            ? tmdbData.production_countries
            : "";
        const kobisValue =
          kobisData != "" && kobisData.nations && kobisData.nations.length > 0
            ? kobisData.nations
            : "";
        let tmdbCountryCode = [];
        let kobisCountryCode = [];
        if (tmdbValue != "") {
          for (const code of tmdbValue) {
            if (code) {
              const countryDetails = await model.country.findOne({
                attributes: ["id"],
                where: {
                  country_code: code.iso_3166_1,
                },
              });
              tmdbCountryCode.push(countryDetails.id);
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
                    attributes: ["country_id"],
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
              kobisCountryCode.push(countryDetails.id);
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
    }
    return {
      priorityResultData: {
        name: reqData.name ? reqData.name : resultData.name,
        title_status: reqData.title_status ? reqData.title_status : resultData.title_status,
        aka: reqData.aka ? reqData.aka : resultData.aka,
        summary: reqData.summary ? reqData.summary : resultData.summary,
        official_site: reqData.official_site ? reqData.official_site : resultData.official_site,
        runtime: reqData.runtime ? reqData.runtime : resultData.runtime,
        release_date: reqData.release_date ? reqData.release_date : resultData.release_date,
        original_language: reqData.language ? reqData.language : resultData.language,
        country:
          reqData.country && reqData.country.length > 0 ? reqData.country : resultData.country,
      },
    };
  } catch (error) {
    return { priorityResultData: {} };
  }
};
