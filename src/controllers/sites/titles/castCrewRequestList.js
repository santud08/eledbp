import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { tmdbService } from "../../../services/index.js";
import { fn, col } from "sequelize";

/**
 * castCrewRequestList
 * @param req
 * @param res
 */
export const castCrewRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language ? req.body.site_language : "en";
    const titleType = req.body.title_type;
    const seasonId = titleType == "tv" ? req.body.season_id : null;
    const creditType = req.body.credit_type;

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: titleType,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    const tmdbId = findRequestId.tmdb_id ? findRequestId.tmdb_id : "";

    // find requestId and creditId is present in request table
    let findCreditId = {};
    if (titleType === "movie") {
      findCreditId = await model.titleRequestCredit.findOne({
        where: {
          request_id: requestId,
          status: "active",
        },
      });
    }

    if (titleType === "tv") {
      findCreditId = await model.titleRequestCredit.findOne({
        where: {
          request_id: requestId,
          status: "active",
          request_season_id: seasonId,
        },
      });
    }

    // getting data for people_id from people and people translation table
    let peopleResult = [];

    // Fetching the list of cast and crew details
    if (findCreditId && findCreditId != null) {
      const castList =
        findCreditId.cast_details != null ? JSON.parse(findCreditId.cast_details) : null;
      const crewList =
        findCreditId.crew_details != null ? JSON.parse(findCreditId.crew_details) : null;
      // Fetch only when both RequestID and CreditID data is present
      let responseDetails = [];
      if (creditType === "cast" && castList != null) {
        // Loop through the list of cast details
        for (const castDetails of castList.list) {
          if (castDetails.season_id === null && castDetails.department === "cast") {
            // Season ID null implies that its a movie cast details
            if (
              castDetails.people_id &&
              castDetails.people_id != null &&
              castDetails.people_id != "undefined"
            ) {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              peopleResult = await model.people.findOne({
                attributes: ["id", "poster"],
                where: { id: castDetails.people_id, status: "active" },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["people_id", "name", "site_language"],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    separate: true,
                    order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              if (peopleResult) {
                let data = {
                  people_id: peopleResult.id,
                  cast_name:
                    peopleResult.peopleTranslations && peopleResult.peopleTranslations[0]
                      ? peopleResult.peopleTranslations[0].name
                      : "",
                  character_name: castDetails.character_name,
                  job: castDetails.job,
                  is_guest: castDetails.is_guest,
                  poster: peopleResult.poster ? peopleResult.poster : "",
                  tmdb_id: castDetails.tmdb_id ? castDetails.tmdb_id : "",
                  order: castDetails.list_order,
                };
                responseDetails.push(data);
              }
            } else {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                people_id: castDetails.people_id,
                cast_name: castDetails.cast_name,
                character_name: castDetails.character_name,
                job: castDetails.job,
                is_guest: castDetails.is_guest,
                poster: castDetails.poster,
                tmdb_id: castDetails.tmdb_id ? castDetails.tmdb_id : "",
                order: castDetails.list_order,
              };
              responseDetails.push(data);
            }
          } else if (castDetails.season_id === seasonId && castDetails.department === "cast") {
            // Presence of season ID means its a TV request - Cast details
            if (castDetails.people_id === "" || castDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                temp_id: castDetails.temp_id,
                people_id: castDetails.people_id,
                cast_name: castDetails.cast_name,
                character_name: castDetails.character_name,
                job: castDetails.job,
                is_guest: castDetails.is_guest,
                poster: castDetails.poster,
                season_id: castDetails.season_id,
                tmdb_id: castDetails.tmdb_id ? castDetails.tmdb_id : "",
                order: castDetails.list_order,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              peopleResult = await model.people.findOne({
                attributes: ["id", "poster"],
                where: { id: castDetails.people_id, status: "active" },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["people_id", "name", "site_language"],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    separate: true,
                    order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              if (peopleResult) {
                let data = {
                  temp_id: castDetails.temp_id,
                  people_id: peopleResult.id,
                  cast_name:
                    peopleResult.peopleTranslations && peopleResult.peopleTranslations[0]
                      ? peopleResult.peopleTranslations[0].name
                      : "",
                  character_name: castDetails.character_name,
                  job: castDetails.job,
                  is_guest: castDetails.is_guest,
                  poster: castDetails.poster
                    ? castDetails.poster
                    : peopleResult.poster
                    ? peopleResult.poster
                    : "",
                  season_id: castDetails.season_id,
                  tmdb_id: castDetails.tmdb_id ? castDetails.tmdb_id : "",
                  order: castDetails.list_order,
                };
                responseDetails.push(data);
              }
            }
          }
        }
        res.ok({
          draft_request_id: requestId,
          draft_credit_id: findCreditId.id,
          cast_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else if (creditType === "crew" && crewList != null) {
        // Loop through the list of crew details
        for (const crewDetails of crewList.list) {
          if (crewDetails.season_id === null && crewDetails.department === "crew") {
            if (
              crewDetails.people_id &&
              crewDetails.people_id != null &&
              crewDetails.people_id != "undefined"
            ) {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              peopleResult = await model.people.findAll({
                attributes: ["id", "poster"],
                where: { id: crewDetails.people_id, status: "active" },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["people_id", "name", "site_language"],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    separate: true,
                    order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              for (let element of peopleResult) {
                let data = {
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  job: crewDetails.job,
                  poster: element.poster ? element.poster : "",
                  tmdb_id: crewDetails.tmdb_id ? crewDetails.tmdb_id : "",
                  order: crewDetails.list_order,
                };
                responseDetails.push(data);
              }
            } else {
              // Season ID null implies that its a movie crew details
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                people_id: crewDetails.people_id,
                cast_name: crewDetails.cast_name,
                job: crewDetails.job,
                poster: crewDetails.poster,
                tmdb_id: crewDetails.tmdb_id ? crewDetails.tmdb_id : "",
                order: crewDetails.list_order,
              };
              responseDetails.push(data);
            }
          } else if (crewDetails.season_id === seasonId && crewDetails.department === "crew") {
            // Presence of season ID means its a TV request - Crew details
            if (crewDetails.people_id === "" || crewDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                temp_id: crewDetails.temp_id,
                people_id: crewDetails.people_id,
                cast_name: crewDetails.cast_name,
                job: crewDetails.job,
                season_id: crewDetails.season_id,
                poster: crewDetails.poster,
                tmdb_id: crewDetails.tmdb_id ? crewDetails.tmdb_id : "",
                order: crewDetails.list_order,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              peopleResult = await model.people.findAll({
                attributes: ["id", "poster"],
                where: { id: crewDetails.people_id, status: "active" },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["people_id", "name", "site_language"],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    separate: true,
                    order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              for (let element of peopleResult) {
                let data = {
                  temp_id: crewDetails.temp_id,
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  job: crewDetails.job,
                  poster: crewDetails.poster
                    ? crewDetails.poster
                    : element.poster
                    ? element.poster
                    : "",
                  season_id: crewDetails.season_id,
                  tmdb_id: crewDetails.tmdb_id ? crewDetails.tmdb_id : "",
                  order: crewDetails.list_order,
                };
                responseDetails.push(data);
              }
            }
          }
        }
        res.ok({
          draft_request_id: requestId,
          draft_credit_id: findCreditId.id,
          crew_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else {
        res.ok({ draft_request_id: requestId, draft_credit_id: findCreditId.id, result: [] });
      }
    } else if (tmdbId) {
      let responseDetails = [];
      let peopleIdDetails = {};
      if (titleType === "tv" && seasonId) {
        // Fetch all the data from season table with respect to request ID
        const findAllSeasonRequest = await model.titleRequestSeasonDetails.findOne({
          where: {
            request_id: requestId,
            status: "active",
            id: seasonId,
          },
        });
        const parsedSeasonDetails =
          findAllSeasonRequest &&
          findAllSeasonRequest.dataValues &&
          findAllSeasonRequest.dataValues.season_details
            ? JSON.parse(findAllSeasonRequest.dataValues.season_details)
            : "";
        const seasonRequestNumber =
          parsedSeasonDetails && parsedSeasonDetails.number
            ? parsedSeasonDetails.number
            : parsedSeasonDetails.number == 0
            ? 0
            : null;
        if (seasonRequestNumber != null) {
          const tmdbCreditData = await tmdbService.fetchTvSeasonCredit(
            tmdbId,
            seasonRequestNumber,
            creditType,
            siteLanguage,
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
                          fn(
                            "REPLACE",
                            col("poster"),
                            `${envs.s3.BUCKET_URL}`,
                            `${envs.aws.cdnUrl}`,
                          ),
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
                          order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                        },
                      ],
                    });
                  }
                  let data = {
                    temp_id: "",
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
                    season_id: "",
                    tmdb_id: value.tmdb_id ? value.tmdb_id : "",
                    order: "",
                  };
                  responseDetails.push(data);
                }
              }
            }
            res.ok({
              draft_request_id: requestId,
              draft_credit_id: "",
              cast_details: responseDetails,
            });
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
                          fn(
                            "REPLACE",
                            col("poster"),
                            `${envs.s3.BUCKET_URL}`,
                            `${envs.aws.cdnUrl}`,
                          ),
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
                          order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                        },
                      ],
                    });
                  }
                  let data = {
                    temp_id: "",
                    people_id: peopleIdDetails && peopleIdDetails.id ? peopleIdDetails.id : "",
                    cast_name: value.cast_name,
                    job: value.job,
                    poster: value.poster
                      ? value.poster
                      : peopleIdDetails && peopleIdDetails.poster
                      ? peopleIdDetails.poster
                      : "",
                    season_id: "",
                    tmdb_id: value.tmdb_id ? value.tmdb_id : "",
                    order: "",
                  };
                  responseDetails.push(data);
                }
              }
            }
            res.ok({
              draft_request_id: requestId,
              draft_credit_id: "",
              crew_details: responseDetails,
            });
          } else {
            res.ok({ draft_request_id: requestId, draft_credit_id: "", result: [] });
          }
        }
      }
      if (titleType === "movie") {
        const tmdbCreditData = await tmdbService.fetchTitleCredits(
          titleType,
          tmdbId,
          creditType,
          siteLanguage,
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
                        order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                responseDetails.push(data);
              }
            }
          }
          res.ok({
            draft_request_id: requestId,
            draft_credit_id: "",
            cast_details: responseDetails,
          });
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
                        order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
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
                responseDetails.push(data);
              }
            }
          }
          res.ok({
            draft_request_id: requestId,
            draft_credit_id: "",
            crew_details: responseDetails,
          });
        }
      }
    } else {
      res.ok({ draft_request_id: requestId, result: [] });
    }
  } catch (error) {
    next(error);
  }
};
