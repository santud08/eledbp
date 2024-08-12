import model from "../../models/index.js";
import { tmdbService, kobisService } from "../index.js";

/**
 * savePeoplePriorityDetails - sending the priority data for auto fill - when the user clicks on save button
 * @param req
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

export const savePeoplePriorityDetails = async (req) => {
  try {
    const reqData = req.body;
    let resultData = {};
    let tmdbData = {};
    let kobisData = {};

    if (reqData.tmdb_id) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(reqData.tmdb_id, reqData.language);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
    }

    if (reqData.kobis_id) {
      const kobisResults = await kobisService.fetchPeopleDetails(
        reqData.kobis_id,
        reqData.language,
      );
      kobisData = kobisResults.results ? kobisResults.results : "";
    }

    // need to create a service to send the type and field name to get the values
    const priorityDetails = await model.priority.findAll({
      where: { type: "people", status: "active" },
    });

    for (const data of priorityDetails) {
      const priorityArrObj = data.dataValues ? data.dataValues : "";
      //checking for name:
      if (reqData.name == "" && priorityArrObj != "" && priorityArrObj.field_name == "name") {
        const tmdbPriority = priorityArrObj["tmdb_field_priority"];
        const kobisPriority = priorityArrObj["kobis_field_priority"];
        const tmdbValue = tmdbData != "" && tmdbData.people_name ? tmdbData.people_name : "";
        const kobisValue = kobisData != "" && kobisData.people_name ? kobisData.people_name : "";
        const name = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
        resultData.name = name;
      }
      //checking for birth_date:
      if (
        reqData.birth_date == "" &&
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
        reqData.death_date == "" &&
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
      //   checking for biography-decription:
      if (
        reqData.biography == "" &&
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
    }
    return {
      priorityResultData: {
        name: reqData.name ? reqData.name : resultData.name,
        birth_date: reqData.birth_date ? reqData.birth_date : resultData.birth_date,
        death_date: reqData.death_date ? reqData.death_date : resultData.death_date,
        biography: reqData.biography ? reqData.biography : resultData.biography,
        official_site: reqData.official_site ? reqData.official_site : resultData.official_site,
      },
    };
  } catch (error) {
    return { priorityResultData: {} };
  }
};
