import model from "../../models/index.js";
import { fn, col } from "sequelize";
import { envs } from "../../config/index.js";
import { tmdbService } from "../../services/index.js";

/**
 * getTmdbRefreshCreditData
 * @param tmdbId
 * @param creditType // cast or crew
 * @param titleId
 * @param titleType
 * @param language
 * @param seasonNumber // needed for the tv credit details for getting tmdb details wrt season no
 * @param seasonId // needed for the tv credit details - for getting main table id
 */
export const getTmdbRefreshCreditData = async (
  tmdbId,
  creditType,
  titleId,
  titleType,
  language = "en",
  seasonNumber = null,
  seasonId,
) => {
  try {
    let responseDetails = [];
    let peopleIdDetails = {};

    if (titleType === "movie") {
      const tmdbCreditData = await tmdbService.fetchTitleCredits(
        titleType,
        tmdbId,
        creditType,
        language,
      );

      if (tmdbCreditData && tmdbCreditData.results && tmdbCreditData.results.cast) {
        if (tmdbCreditData.results.cast.length > 0) {
          for (const value of tmdbCreditData.results.cast) {
            if (value) {
              if (value.cast_name && value.tmdb_id) {
                // check 11db whether the cast name is present or not - if present then fetch the id
                peopleIdDetails = await model.people.findOne({
                  attributes: [
                    "id",
                    "tmdb_id",
                    [
                      fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "poster",
                    ],
                  ],
                  where: { tmdb_id: value.tmdb_id, status: "active" },
                  include: [
                    {
                      model: model.peopleTranslation,
                      attributes: ["people_id", "name", "site_language"],
                      where: { status: "active" },
                      left: true,
                      required: false,
                      separate: true,
                      order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                    },
                  ],
                });
              }
              let data = {
                people_id: peopleIdDetails && peopleIdDetails.id ? peopleIdDetails.id : "",
                cast_name: value.cast_name,
                character_name: value.character_name,
                job: value.job,
                is_guest: value.is_guest && value.is_guest == "n" ? 0 : 1,
                poster: value.poster
                  ? value.poster
                  : peopleIdDetails && peopleIdDetails.poster
                  ? peopleIdDetails.poster
                  : "",
                tmdb_id: value.tmdb_id ? value.tmdb_id : "",
                order: "",
              };
              let castId = "";
              if (peopleIdDetails && peopleIdDetails.id) {
                const creditId = await model.creditable.findOne({
                  attributes: ["id"],
                  where: {
                    creditable_id: titleId,
                    department: "cast",
                    people_id: peopleIdDetails.id,
                    status: "active",
                    character_name: value.character_name,
                    job: value.job,
                  },
                });
                castId = creditId && creditId.id ? creditId.id : "";
              }
              data.id = castId;
              responseDetails.push(data);
            }
          }
        }
      } else if (tmdbCreditData && tmdbCreditData.results && tmdbCreditData.results.crew) {
        if (tmdbCreditData.results.crew.length > 0) {
          for (const value of tmdbCreditData.results.crew) {
            if (value) {
              if (value.cast_name && value.tmdb_id) {
                // check 11db whether the cast name is present or not - if present then fetch the id
                peopleIdDetails = await model.people.findOne({
                  attributes: [
                    "id",
                    "tmdb_id",
                    [
                      fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "poster",
                    ],
                  ],
                  where: { tmdb_id: value.tmdb_id, status: "active" },
                  include: [
                    {
                      model: model.peopleTranslation,
                      attributes: ["people_id", "name", "site_language"],
                      where: { status: "active" },
                      left: true,
                      required: false,
                      separate: true,
                      order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                    },
                  ],
                });
              }
              let data = {
                people_id: peopleIdDetails && peopleIdDetails.id ? peopleIdDetails.id : "",
                cast_name: value.cast_name,
                job: value.job,
                poster: value.poster
                  ? value.poster
                  : peopleIdDetails && peopleIdDetails.poster
                  ? peopleIdDetails.poster
                  : "",
                tmdb_id: value.tmdb_id ? value.tmdb_id : "",
                order: "",
              };
              let crewId = "";
              if (peopleIdDetails && peopleIdDetails.id) {
                const creditId = await model.creditable.findOne({
                  attributes: ["id"],
                  where: {
                    creditable_id: titleId,
                    department: "crew",
                    people_id: peopleIdDetails.id,
                    status: "active",
                    job: value.job,
                  },
                });
                crewId = creditId && creditId.id ? creditId.id : "";
              }
              data.id = crewId;
              responseDetails.push(data);
            }
          }
        }
      }
    }

    if (titleType === "tv" && seasonNumber) {
      // Fetch all the data from season table with respect to request ID

      const tmdbCreditData = await tmdbService.fetchTvSeasonCredit(
        tmdbId,
        seasonNumber,
        creditType,
        language,
      );
      if (
        creditType === "cast" &&
        tmdbCreditData &&
        tmdbCreditData.results &&
        tmdbCreditData.results.cast
      ) {
        if (tmdbCreditData.results.cast.length > 0) {
          for (const value of tmdbCreditData.results.cast) {
            if (value) {
              if (value.cast_name && value.tmdb_id) {
                peopleIdDetails = await model.people.findOne({
                  attributes: [
                    "id",
                    "tmdb_id",
                    [
                      fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "poster",
                    ],
                  ],
                  where: { tmdb_id: value.tmdb_id, status: "active" },
                  include: [
                    {
                      model: model.peopleTranslation,
                      attributes: ["name", "site_language"],
                      where: { name: value.cast_name, status: "active" },
                      left: true,
                      required: false,
                      separate: true,
                      order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                    },
                  ],
                });
              }
              let data = {
                people_id: peopleIdDetails && peopleIdDetails.id ? peopleIdDetails.id : "",
                cast_name: value.cast_name,
                character_name: value.character_name,
                job: value.job,
                is_guest: value.is_guest && value.is_guest == "n" ? 0 : 1,
                poster: value.poster
                  ? value.poster
                  : peopleIdDetails && peopleIdDetails.poster
                  ? peopleIdDetails.poster
                  : "",
                season_id: seasonId ? seasonId : "",
                order: "",
              };
              let castId = "";
              if (peopleIdDetails && peopleIdDetails.id) {
                const creditId = await model.creditable.findOne({
                  attributes: ["id"],
                  where: {
                    creditable_id: titleId,
                    department: "cast",
                    people_id: peopleIdDetails.id,
                    status: "active",
                    character_name: value.character_name,
                    job: value.job,
                    season_id: seasonId,
                  },
                });
                castId = creditId && creditId.id ? creditId.id : "";
              }
              data.id = castId;
              responseDetails.push(data);
            }
          }
        }
      } else if (
        creditType === "crew" &&
        tmdbCreditData &&
        tmdbCreditData.results &&
        tmdbCreditData.results.crew
      ) {
        if (tmdbCreditData.results.crew.length > 0) {
          for (const value of tmdbCreditData.results.crew) {
            if (value) {
              if (value.cast_name && value.tmdb_id) {
                peopleIdDetails = await model.people.findOne({
                  attributes: [
                    "id",
                    "tmdb_id",
                    [
                      fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "poster",
                    ],
                  ],
                  where: { tmdb_id: value.tmdb_id, status: "active" },
                  include: [
                    {
                      model: model.peopleTranslation,
                      attributes: ["name", "site_language"],
                      where: { name: value.cast_name, status: "active" },
                      left: true,
                      required: false,
                      separate: true,
                      order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                    },
                  ],
                });
              }
              let data = {
                people_id: peopleIdDetails && peopleIdDetails.id ? peopleIdDetails.id : "",
                cast_name: value.cast_name,
                job: value.job,
                poster: value.poster
                  ? value.poster
                  : peopleIdDetails && peopleIdDetails.poster
                  ? peopleIdDetails.poster
                  : "",
                season_id: seasonId ? seasonId : "",
                tmdb_id: value.tmdb_id ? value.tmdb_id : "",
                order: "",
              };
              let crewId = "";
              if (peopleIdDetails && peopleIdDetails.id) {
                const creditId = await model.creditable.findOne({
                  attributes: ["id"],
                  where: {
                    creditable_id: titleId,
                    department: "crew",
                    people_id: peopleIdDetails.id,
                    status: "active",
                    job: value.job,
                    season_id: seasonId,
                  },
                });
                crewId = creditId && creditId.id ? creditId.id : "";
              }
              data.id = crewId;
              responseDetails.push(data);
            }
          }
        }
      }
    }

    // Response based on the type
    if (creditType === "crew") {
      return {
        crew_details: responseDetails,
      };
    } else {
      return {
        cast_details: responseDetails,
      };
    }
  } catch (error) {
    console.log(error);
    return {};
  }
};
