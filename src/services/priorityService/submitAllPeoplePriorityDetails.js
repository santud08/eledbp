import model from "../../models/index.js";
import { tmdbService, kobisService } from "../index.js";
/**
 * submitAllPeoplePriorityDetails-auto fill the priority data on submission of submit all data.
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

export const submitAllPeoplePriorityDetails = async (foundData) => {
  try {
    let resultData = {};
    let tmdbData = {};
    let kobisData = {};

    if (foundData.tmdb_id) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(
        foundData.tmdb_id,
        foundData.language,
      );
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
    }

    if (foundData.kobis_id) {
      const kobisResults = await kobisService.fetchPeopleDetails(
        foundData.kobis_id,
        foundData.language,
      );
      kobisData = kobisResults.results ? kobisResults.results : "";
    }

    // need to create a service to send the type and field name to get the values
    const priorityDetails = await model.priority.findAll({
      where: { type: "people", status: "active" },
    });

    for (const data of priorityDetails) {
      resultData.site_language = foundData.site_language;
      const priorityArrObj = data.dataValues ? data.dataValues : "";
      //checking for name:
      if (
        (foundData.name == "" || foundData.name == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "name"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.people_name ? tmdbData.people_name : "";
        const kobisValue = kobisData != "" && kobisData.people_name ? kobisData.people_name : "";
        const name = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.name = name;
      }
      //checking for birth_date:
      if (
        (foundData.birth_date == "" || foundData.birth_date == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "birth_date"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.birth_day ? tmdbData.birth_day : "";
        const kobisValue = kobisData != "" && kobisData.birth_day ? kobisData.birth_day : "";
        const birthDate = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.birth_date = birthDate;
      }
      //checking for death_date:
      if (
        (foundData.death_date == "" || foundData.death_date == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "death_date"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.death_day ? tmdbData.death_day : "";
        const kobisValue = kobisData != "" && kobisData.death_day ? kobisData.death_day : "";
        const deathDate = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.death_date = deathDate;
      }
      //   checking for biography - description:
      if (
        (foundData.description == "" || foundData.description == null) &&
        priorityArrObj != "" &&
        priorityArrObj.field_name == "biography"
      ) {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.biography ? tmdbData.biography : "";
        const kobisValue = kobisData != "" && kobisData.biography ? kobisData.biography : "";
        const biography = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.biography = biography;
      }
      //checking for official_site:
      if (
        (foundData.official_site == "" || foundData.official_site == null) &&
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
    }
    return {
      priorityResultData: {
        site_language: resultData.site_language,
        name: foundData.name ? foundData.name : resultData.name,
        birth_date: foundData.birth_date ? foundData.birth_date : resultData.birth_date,
        death_date: foundData.death_date ? foundData.death_date : resultData.death_date,
        biography: foundData.biography ? foundData.biography : resultData.biography,
        official_site: foundData.official_site ? foundData.official_site : resultData.official_site,
      },
    };
  } catch (error) {
    return { priorityResultData: {} };
  }
};
