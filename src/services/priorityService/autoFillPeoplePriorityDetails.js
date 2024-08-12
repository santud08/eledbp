import model from "../../models/index.js";

/**
 * autoFillPeoplePriorityDetails - Auto fill details will be sent in response
 * Priority based the TMDB and KOBIS details are sent
 * @param priorityDetails
 * @param tmdbData
 * @param kobisData
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

// For Array Values
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

export const autoFillPeoplePriorityDetails = async (
  priorityDetails,
  tmdbData,
  kobisData,
  language,
) => {
  try {
    let resultData = {};

    if (priorityDetails.length > 0) {
      for (const data of priorityDetails) {
        const priorityArrObj = data.dataValues ? data.dataValues : "";
        //checking for name:
        if (priorityArrObj && priorityArrObj.field_name == "name") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.people_name ? tmdbData.people_name : "";
          const kobisValue = kobisData.people_name ? kobisData.people_name : "";
          const name = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.name = name;
        }
        //checking for birth_date:
        if (priorityArrObj && priorityArrObj.field_name == "birth_date") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.birth_day ? tmdbData.birth_day : "";
          const kobisValue = kobisData.birth_day ? kobisData.birth_day : "";
          const birthDate = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.birth_date = birthDate;
        }
        //checking for death_date:
        if (priorityArrObj && priorityArrObj.field_name == "death_date") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.death_day ? tmdbData.death_day : "";
          const kobisValue = kobisData.death_day ? kobisData.death_day : "";
          const deathDate = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.death_date = deathDate;
        }
        //   checking for biography-decription:
        if (priorityArrObj && priorityArrObj.field_name == "biography") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.biography ? tmdbData.biography : "";
          const kobisValue = kobisData.biography ? kobisData.biography : "";
          const biography = await externalValues(
            tmdbPriority,
            kobisPriority,
            tmdbValue,
            kobisValue,
          );
          resultData.biography = biography;
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
        //checking for aka:
        if (priorityArrObj && priorityArrObj.field_name == "aka") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.aka ? tmdbData.aka : "";
          const kobisValue = kobisData.also_known_as ? kobisData.also_known_as : "";
          const aka = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.aka = aka;
        }
        //checking for gender:
        if (priorityArrObj && priorityArrObj.field_name == "gender") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue =
            tmdbData.gender && tmdbData.gender == 2
              ? "male"
              : tmdbData.gender && tmdbData.gender == 1
              ? "female"
              : "";
          const kobisValue =
            kobisData.gender && kobisData.gender == "남자"
              ? "male"
              : kobisData.gender && kobisData.gender == "여자"
              ? "female"
              : "";
          const gender = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.gender = gender;
        }

        // checking for Job details
        if (priorityArrObj && priorityArrObj.field_name == "job") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          // Acting - Actor mapping
          const changeValue =
            tmdbData.role_name && tmdbData.role_name == "Acting" ? "Actors" : tmdbData.role_name;
          const changeKobisValue =
            kobisData.role_name && kobisData.role_name == "Acting" ? "Actors" : kobisData.role_name;
          const tmdbValue = changeValue;
          const kobisValue = changeKobisValue;
          let tmdbJobCode = [];
          let kobisJobCode = [];
          if (tmdbValue) {
            const jobDetails = await model.department.findOne({
              attributes: ["id"],
              where: {
                department_name: tmdbValue,
                status: "active",
              },
              include: [
                {
                  model: model.departmentTranslation,
                  attributes: ["id", "department_id", "department_name"],
                  left: true,
                  where: {
                    status: "active",
                    site_language: language,
                  },
                },
              ],
            });
            if (jobDetails) {
              const element = {
                id: jobDetails.id,
                job:
                  jobDetails &&
                  jobDetails.departmentTranslations &&
                  jobDetails.departmentTranslations[0] &&
                  jobDetails.departmentTranslations[0].department_name
                    ? jobDetails.departmentTranslations[0].department_name
                    : "",
              };
              tmdbJobCode.push(element);
            }
          }
          if (kobisValue) {
            const jobDetails = await model.department.findOne({
              attributes: ["id"],
              where: {
                department_name: kobisValue,
                status: "active",
              },
              include: [
                {
                  model: model.departmentTranslation,
                  attributes: ["id", "department_id", "department_name"],
                  left: true,
                  where: {
                    status: "active",
                    site_language: language,
                  },
                },
              ],
            });
            if (jobDetails) {
              const element = {
                id: jobDetails.id,
                job:
                  jobDetails &&
                  jobDetails.departmentTranslations &&
                  jobDetails.departmentTranslations[0] &&
                  jobDetails.departmentTranslations[0].department_name
                    ? jobDetails.departmentTranslations[0].department_name
                    : "",
              };
              kobisJobCode.push(element);
            }
          }
          const jobCode = await externalArrayValues(
            tmdbPriority,
            kobisPriority,
            tmdbJobCode,
            kobisJobCode,
          );
          resultData.job = jobCode;
        }

        // checking for country details - birth place
        if (priorityArrObj && priorityArrObj.field_name == "country") {
          const tmdbPriority = priorityArrObj["tmdb_field_priority"];
          const kobisPriority = priorityArrObj["kobis_field_priority"];
          const tmdbValue = tmdbData.place_of_birth ? tmdbData.place_of_birth : "";
          const kobisValue = kobisData.place_of_birth ? kobisData.place_of_birth : "";
          const country = await externalValues(tmdbPriority, kobisPriority, tmdbValue, kobisValue);
          resultData.country_name = country;
        }
      }
    }
    return resultData;
  } catch (error) {
    return { resultData: {} };
  }
};
