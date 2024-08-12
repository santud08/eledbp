import model from "../../models/index.js";
import { tmdbService, kobisService } from "../index.js";

/**
 * submitAllTitlePriorityDetails - auto fill the priority data on submission of submit all data.
 * @param foundData
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

export const submitAllTitlePriorityDetails = async (foundData) => {
  try {
    let resultData = {};

    let tmdbData = {};
    let kobisData = {};
    let requestCountryDetails =
      foundData.country_details != null ? JSON.parse(foundData.country_details) : null;

    if (foundData.tmdb_id) {
      const tmdbResults = await tmdbService.fetchTitleDetails(
        foundData.type,
        foundData.tmdb_id,
        foundData.language,
      );
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
    }

    if (foundData.kobis_id) {
      const kobisResults = await kobisService.fetchTitleDetails(
        foundData.type,
        foundData.kobis_id,
        foundData.language,
      );
      kobisData = kobisResults.results ? kobisResults.results : "";
    }

    // need to create a service to send the type and field name to get the values
    const priorityDetails = await model.priority.findAll({
      where: { type: foundData.type, status: "active" },
    });
    for (const data of priorityDetails) {
      resultData.site_language = foundData.site_language;
      const priorityArrObj = data.dataValues ? data.dataValues : "";
      //checking for name:
      if (
        (foundData.name == "" || foundData.name == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "title"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.title ? tmdbData.title : "";
        const kobisValue = kobisData != "" && kobisData.title ? kobisData.title : "";
        const name = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.name = name;
      }
      //checking for title_status:
      if (
        (foundData.title_status == "" || foundData.title_status == null) &&
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
        foundData.aka &&
        (foundData.aka == "" || foundData.aka == null) &&
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
      //checking for summary -- description incase of submit all save API :
      if (
        (foundData.description == "" || foundData.description == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "summary"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.overview ? tmdbData.overview : "";
        const kobisValue = kobisData != "" && kobisData.overview ? kobisData.overview : "";
        const description = await externalValues(
          tmdbPriority,
          kobisPriority,
          tmdbValue,
          kobisValue,
        );
        resultData.description = description;
      }
      //checking for official_site -- affiliate_link for submit all:
      if (
        (foundData.affiliate_link == "" || foundData.affiliate_link == null) &&
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
        resultData.affiliate_link = officialSite;
      }
      //checking for runtime:
      if (
        (foundData.runtime == "" || foundData.runtime == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "runtime"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.runtime ? tmdbData.runtime : "";
        const kobisValue = kobisData != "" && kobisData.runtime ? kobisData.runtime : "";
        const runtime = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.runtime = runtime;
      }
      //checking for release date:
      if (
        (foundData.release_date == "" || foundData.release_date == null) &&
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
        (foundData.language == "" || foundData.language == null) &&
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

      // checking for country details -- it should be country_details
      if (
        (requestCountryDetails == null || requestCountryDetails.list.length == 0) &&
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

    //converting the country details into desired output - for submit all save API
    let requestCountry = [];
    if (requestCountryDetails != null && requestCountryDetails.list.length > 0) {
      for (const value of requestCountryDetails.list) {
        requestCountry.push(value.country_id);
      }
    }

    return {
      priorityResultData: {
        site_language: resultData.site_language,
        name: foundData.name ? foundData.name : resultData.name,
        title_status: foundData.title_status ? foundData.title_status : resultData.title_status,
        aka: foundData.aka ? foundData.aka : resultData.aka,
        description: foundData.description ? foundData.description : resultData.description,
        official_site: foundData.affiliate_link
          ? foundData.affiliate_link
          : resultData.affiliate_link,
        runtime: foundData.runtime ? foundData.runtime : resultData.runtime,
        release_date: foundData.release_date ? foundData.release_date : resultData.release_date,
        original_language: foundData.language ? foundData.language : resultData.language,
        country: requestCountry.length > 0 ? requestCountry : resultData.country,
      },
    };
  } catch (error) {
    return { priorityResultData: {} };
  }
};
