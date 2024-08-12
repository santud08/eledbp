import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";

/**
 * editCastCrewRequestList
 * @param req
 * @param res
 */
export const editCastCrewRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const siteLanguage = req.body.site_language;
    const titleType = req.body.title_type;
    const creditType = req.body.credit_type;
    const seasonPkId = titleType == "tv" && req.body.season_id ? req.body.season_id : "";

    const titleId = req.body.title_id ? req.body.title_id : "";
    let findRequestSeasonId = {};
    if (titleType == "tv") {
      findRequestSeasonId = await model.titleRequestSeasonDetails.findOne({
        where: {
          id: draftSeasonId,
          request_id: requestId,
          status: "active",
        },
      });
    }

    let tmdbId = "";
    let titleTmdb = "";

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

    let requestCondition = {};
    let seasonId = "";
    if (draftSeasonId) {
      requestCondition = {
        request_id: requestId,
        request_season_id: draftSeasonId,
        status: "active",
      };
      seasonId = draftSeasonId;
    } else if (seasonPkId) {
      requestCondition = {
        request_id: requestId,
        season_id: seasonPkId,
        status: "active",
      };
      seasonId = seasonPkId;
    }
    if (titleType === "tv" && Object.keys(requestCondition).length > 0) {
      findCreditId = await model.titleRequestCredit.findOne({
        where: requestCondition,
        status: "active",
      });
    }

    // get relationID from Request Table
    let getRelationData = {};
    if (requestId) {
      getRelationData = await model.titleRequestPrimaryDetails.findOne({
        where: {
          id: requestId,
          record_status: "active",
        },
      });
    }
    const relationId =
      getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "";
    // getting data for people_id from people and people translation table
    let peopleResult = [];
    let peopleCastResult = [];
    let peopleCrewResult = [];
    const searchParams = {
      sortBy: "id",
      sortOrder: "ASC",
      distinct: true,
      raw: false,
    };
    const condition = {
      status: "active",
    };
    const attributes = ["id", "poster"];
    const modelName = model.people;
    const foundCredit = findCreditId != null ? Object.keys(findCreditId).length : null;
    const foundSeason =
      findRequestSeasonId != null ? Object.keys(findRequestSeasonId).length : null;
    // Fetching the list of cast and crew details
    if (foundCredit && foundCredit > 0) {
      const castList =
        findCreditId.cast_details != null ? JSON.parse(findCreditId.cast_details) : null;
      const crewList =
        findCreditId.crew_details != null ? JSON.parse(findCreditId.crew_details) : null;
      // Fetch only when both RequestID and CreditID data is present
      let responseDetails = [];
      if (creditType === "cast" && castList != null) {
        // Loop through the list of cast details
        for (const castDetails of castList.list) {
          if (titleType == "movie" && castDetails.department === "cast") {
            // Season ID null implies that its a movie cast details
            if (castDetails.people_id === "" || castDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                id: castDetails.id,
                people_id: castDetails.people_id,
                cast_name: castDetails.cast_name,
                character_name: castDetails.character_name,
                job: castDetails.job,
                is_guest: castDetails.is_guest,
                poster: castDetails.poster,
                order: castDetails.list_order,
                tmdb_id: castDetails.tmdb_id,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              const includeQuery = [
                {
                  model: model.peopleTranslation,
                  attributes: ["name"],
                  left: true,
                  where: {
                    people_id: castDetails.people_id,
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ];
              condition.id = castDetails.people_id;
              peopleResult = await paginationService.pagination(
                searchParams,
                modelName,
                includeQuery,
                condition,
                attributes,
              );
              for (let element of peopleResult.rows) {
                let data = {
                  id: castDetails.id,
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  character_name: castDetails.character_name,
                  job: castDetails.job,
                  is_guest: castDetails.is_guest,
                  poster: element.poster,
                  order: castDetails.list_order,
                  tmdb_id: castDetails.tmdb_id,
                };
                responseDetails.push(data);
              }
            }
          } else if (castDetails.season_id === seasonId && castDetails.department === "cast") {
            // Presence of season ID means its a TV request - Cast details
            if (castDetails.people_id === "" || castDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                id: castDetails.id,
                temp_id: castDetails.temp_id,
                people_id: castDetails.people_id,
                cast_name: castDetails.cast_name,
                character_name: castDetails.character_name,
                job: castDetails.job,
                is_guest: castDetails.is_guest,
                poster: castDetails.poster,
                season_id: castDetails.season_id,
                order: castDetails.list_order,
                tmdb_id: castDetails.tmdb_id,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              const includeQuery = [
                {
                  model: model.peopleTranslation,
                  attributes: ["name", "site_language"],
                  left: true,
                  where: {
                    people_id: castDetails.people_id,
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ];
              condition.id = castDetails.people_id;
              peopleResult = await paginationService.pagination(
                searchParams,
                modelName,
                includeQuery,
                condition,
                attributes,
              );
              for (let element of peopleResult.rows) {
                let data = {
                  id: castDetails.id,
                  temp_id: castDetails.temp_id,
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  character_name: castDetails.character_name,
                  job: castDetails.job,
                  is_guest: castDetails.is_guest,
                  poster: element.poster,
                  season_id: castDetails.season_id,
                  order: castDetails.list_order,
                  tmdb_id: castDetails.tmdb_id,
                };
                responseDetails.push(data);
              }
            }
          }
        }
        res.ok({
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
          cast_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else if (creditType === "crew" && crewList != null) {
        // Loop through the list of crew details
        for (const crewDetails of crewList.list) {
          if (titleType == "movie" && crewDetails.department === "crew") {
            // Season ID null implies that its a movie crew details
            if (crewDetails.people_id === "" || crewDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                id: crewDetails.id,
                people_id: crewDetails.people_id,
                cast_name: crewDetails.cast_name,
                job: crewDetails.job,
                poster: crewDetails.poster,
                order: crewDetails.list_order,
                tmdb_id: crewDetails.tmdb_id,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              const includeQuery = [
                {
                  model: model.peopleTranslation,
                  attributes: ["people_id", "name", "site_language"],
                  left: true,
                  where: {
                    people_id: crewDetails.people_id,
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ];
              condition.id = crewDetails.people_id;
              peopleResult = await paginationService.pagination(
                searchParams,
                modelName,
                includeQuery,
                condition,
                attributes,
              );
              for (let element of peopleResult.rows) {
                let data = {
                  id: crewDetails.id,
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  job: crewDetails.job,
                  poster: element.poster,
                  order: crewDetails.list_order,
                  tmdb_id: crewDetails.tmdb_id,
                };
                responseDetails.push(data);
              }
            }
          } else if (crewDetails.season_id === seasonId && crewDetails.department === "crew") {
            // Presence of season ID means its a TV request - Crew details
            if (crewDetails.people_id === "" || crewDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                id: crewDetails.id,
                temp_id: crewDetails.temp_id,
                people_id: crewDetails.people_id,
                cast_name: crewDetails.cast_name,
                job: crewDetails.job,
                season_id: crewDetails.season_id,
                poster: crewDetails.poster,
                order: crewDetails.list_order,
                tmdb_id: crewDetails.tmdb_id,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              const includeQuery = [
                {
                  model: model.peopleTranslation,
                  attributes: ["people_id", "name", "site_language"],
                  left: true,
                  where: {
                    people_id: crewDetails.people_id,
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ];
              condition.id = crewDetails.people_id;
              peopleResult = await paginationService.pagination(
                searchParams,
                modelName,
                includeQuery,
                condition,
                attributes,
              );
              for (let element of peopleResult.rows) {
                let data = {
                  id: crewDetails.id,
                  temp_id: crewDetails.temp_id,
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  job: crewDetails.job,
                  poster: element.poster,
                  season_id: crewDetails.season_id,
                  order: crewDetails.list_order,
                  tmdb_id: crewDetails.tmdb_id,
                };
                responseDetails.push(data);
              }
            }
          }
        }
        res.ok({
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId.id,
          crew_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else {
        res.ok({
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId.id,
          result: [],
        });
      }
    } else if (foundSeason != null && foundSeason > 0) {
      let responseDetails = [];
      const searchParamsCredit = {
        distinct: false,
      };
      //get cast & crew details for Tv show
      if (findRequestSeasonId && findRequestSeasonId.season_id && titleType == "tv") {
        const attributes = [
          "id",
          "people_id",
          "creditable_id",
          "season_id",
          "department",
          "creditable_type",
          "is_guest",
          "character_name",
          "job",
          "list_order",
        ];
        const includeQuery = [
          {
            model: model.people,
            attributes: [
              "id",
              [
                fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                "poster",
              ],
              "tmdb_id",
            ],
            left: true,
            where: { status: "active" },
            required: true,
            include: [
              {
                model: model.peopleTranslation,
                attributes: ["people_id", "name", "known_for"],
                left: true,
                where: {
                  status: "active",
                },
                required: false,
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
              {
                model: model.peopleImages,
                attributes: [
                  "people_id",
                  "original_name",
                  "file_name",
                  "url",
                  "site_language",
                  [
                    fn(
                      "REPLACE",
                      col("peopleImages.path"),
                      `${envs.s3.BUCKET_URL}`,
                      `${envs.aws.cdnUrl}`,
                    ),
                    "path",
                  ],
                ],
                left: true,
                where: {
                  image_category: "poster_image",
                  is_main_poster: "y",
                  status: "active",
                },
                required: false,
                separate: true, //get the recently added image
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
            ],
          },
        ];

        const castCondition = {
          creditable_id: titleId,
          season_id: findRequestSeasonId.season_id,
          department: "cast",
          status: "active",
          creditable_type: "title",
        };

        const crewCondition = {
          creditable_id: titleId,
          season_id: findRequestSeasonId.season_id,
          department: "crew",
          status: "active",
          creditable_type: "title",
        };

        // Tv show Cast list
        [peopleCastResult, peopleCrewResult, titleTmdb] = await Promise.all([
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            castCondition,
            attributes,
          ),
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            crewCondition,
            attributes,
          ),
          model.title.findOne({
            attributes: ["tmdb_id"],
            where: { id: titleId, record_status: "active" },
          }),
        ]);

        // Send TMDB id in response
        tmdbId = titleTmdb && titleTmdb.tmdb_id ? titleTmdb.tmdb_id : "";

        // Get cast details list
        if (peopleCastResult.count > 0 && creditType === "cast") {
          for (const eachRow of peopleCastResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id,
                people_id: eachRow.people_id ? eachRow.people_id : "",
                cast_name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
                character_name: eachRow.character_name ? eachRow.character_name : "",
                job: eachRow.job ? eachRow.job : "",
                is_guest: eachRow.is_guest ? eachRow.is_guest : "",
                poster: eachRow.person && eachRow.person.poster ? eachRow.person.poster : "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
                tmdb_id: eachRow.person && eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
              };
              responseDetails.push(data);
            }
          }
        }

        // Get crew details list
        if (peopleCrewResult.count > 0 && creditType === "crew") {
          for (const eachRow of peopleCrewResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id,
                people_id: eachRow.people_id ? eachRow.people_id : "",
                cast_name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
                job: eachRow.job ? eachRow.job : "",
                poster: eachRow.person && eachRow.person.poster ? eachRow.person.poster : "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
                tmdb_id: eachRow.person && eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
              };
              responseDetails.push(data);
            }
          }
        }

        if (creditType === "crew") {
          res.ok({
            tmdb_id: tmdbId,
            draft_relation_id: relationId,
            draft_request_id: requestId,
            draft_season_id: draftSeasonId,
            season_id: seasonPkId,
            draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
            crew_details:
              responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
          });
        } else {
          res.ok({
            tmdb_id: tmdbId,
            draft_relation_id: relationId,
            draft_request_id: requestId,
            draft_season_id: draftSeasonId,
            season_id: seasonPkId,
            draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
            cast_details:
              responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
          });
        }
      } else {
        if (creditType === "crew") {
          res.ok({
            tmdb_id: tmdbId,
            draft_relation_id: relationId,
            draft_request_id: requestId,
            draft_season_id: draftSeasonId,
            season_id: seasonPkId,
            draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
            crew_details:
              responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
          });
        } else {
          res.ok({
            tmdb_id: tmdbId,
            draft_relation_id: relationId,
            draft_request_id: requestId,
            draft_season_id: draftSeasonId,
            season_id: seasonPkId,
            draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
            cast_details:
              responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
          });
        }
      }
    } else if (titleId) {
      let responseDetails = [];
      const searchParamsCredit = {
        distinct: false,
        sortBy: "list_order",
        sortOrder: "asc",
      };
      //get cast & crew details for Tv show
      if (seasonPkId && titleType == "tv") {
        const attributes = [
          "id",
          "people_id",
          "creditable_id",
          "season_id",
          "department",
          "creditable_type",
          "is_guest",
          "character_name",
          "job",
          "list_order",
        ];
        const includeQuery = [
          {
            model: model.people,
            attributes: [
              "id",
              [
                fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                "poster",
              ],
              "tmdb_id",
            ],
            left: true,
            where: { status: "active" },
            required: true,
            include: [
              {
                model: model.peopleTranslation,
                attributes: ["people_id", "name", "known_for"],
                left: true,
                where: {
                  status: "active",
                },
                required: false,
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
              {
                model: model.peopleImages,
                attributes: [
                  "people_id",
                  "original_name",
                  "file_name",
                  "url",
                  "site_language",
                  [
                    fn(
                      "REPLACE",
                      col("peopleImages.path"),
                      `${envs.s3.BUCKET_URL}`,
                      `${envs.aws.cdnUrl}`,
                    ),
                    "path",
                  ],
                ],
                left: true,
                where: {
                  image_category: "poster_image",
                  is_main_poster: "y",
                  status: "active",
                },
                required: false,
                separate: true, //get the recently added image
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
            ],
          },
        ];

        const castCondition = {
          creditable_id: titleId,
          season_id: seasonPkId,
          department: "cast",
          status: "active",
          creditable_type: "title",
        };

        const crewCondition = {
          creditable_id: titleId,
          season_id: seasonPkId,
          department: "crew",
          status: "active",
          creditable_type: "title",
        };

        // Tv show Cast list and Crew list
        [peopleCastResult, peopleCrewResult, titleTmdb] = await Promise.all([
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            castCondition,
            attributes,
          ),
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            crewCondition,
            attributes,
          ),
          model.title.findOne({
            attributes: ["tmdb_id"],
            where: { id: titleId, record_status: "active" },
          }),
        ]);

        // Send TMDB id in response
        tmdbId = titleTmdb && titleTmdb.tmdb_id ? titleTmdb.tmdb_id : "";
        // Get cast details list
        if (peopleCastResult.count > 0 && creditType === "cast") {
          for (const eachRow of peopleCastResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id,
                people_id: eachRow.people_id ? eachRow.people_id : "",
                cast_name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
                character_name: eachRow.character_name ? eachRow.character_name : "",
                job: eachRow.job ? eachRow.job : "",
                is_guest: eachRow.is_guest ? eachRow.is_guest : "",
                poster: eachRow.person && eachRow.person.poster ? eachRow.person.poster : "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
                tmdb_id: eachRow.person && eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
              };
              responseDetails.push(data);
            }
          }
        }

        // Get crew details list
        if (peopleCrewResult.count > 0 && creditType === "crew") {
          for (const eachRow of peopleCrewResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id,
                people_id: eachRow.people_id ? eachRow.people_id : "",
                cast_name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
                job: eachRow.job ? eachRow.job : "",
                poster: eachRow.person && eachRow.person.poster ? eachRow.person.poster : "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
                tmdb_id: eachRow.person && eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
              };
              responseDetails.push(data);
            }
          }
        }
      }

      //get cast & crew details for Movie
      if (titleType == "movie") {
        const attributes = [
          "id",
          "people_id",
          "creditable_id",
          "season_id",
          "department",
          "creditable_type",
          "is_guest",
          "character_name",
          "job",
          "list_order",
        ];
        const includeQuery = [
          {
            model: model.people,
            attributes: [
              "id",
              [
                fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                "poster",
              ],
              "tmdb_id",
            ],
            left: true,
            where: { status: "active" },
            required: true,
            include: [
              {
                model: model.peopleTranslation,
                attributes: ["people_id", "name", "known_for"],
                left: true,
                where: {
                  status: "active",
                },
                required: false,
                separate: true,
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
              {
                model: model.peopleImages,
                attributes: [
                  "people_id",
                  "original_name",
                  "file_name",
                  "url",
                  [
                    fn(
                      "REPLACE",
                      col("peopleImages.path"),
                      `${envs.s3.BUCKET_URL}`,
                      `${envs.aws.cdnUrl}`,
                    ),
                    "path",
                  ],
                ],
                left: true,
                where: {
                  image_category: "poster_image",
                  is_main_poster: "y",
                  status: "active",
                },
                required: false,
                separate: true, //get the recently added image
                order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
              },
            ],
          },
        ];

        const castCondition = {
          creditable_id: titleId,
          department: "cast",
          status: "active",
          creditable_type: "title",
        };

        const crewCondition = {
          creditable_id: titleId,
          department: "crew",
          status: "active",
          creditable_type: "title",
        };

        // Movie Cast list and Crew list
        [peopleCastResult, peopleCrewResult, titleTmdb] = await Promise.all([
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            castCondition,
            attributes,
          ),
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            crewCondition,
            attributes,
          ),
          model.title.findOne({
            attributes: ["tmdb_id"],
            where: { id: titleId, record_status: "active" },
          }),
        ]);

        // Send TMDB id in response
        tmdbId = titleTmdb && titleTmdb.tmdb_id ? titleTmdb.tmdb_id : "";

        // // Movie Crew list
        // Get cast details list
        if (peopleCastResult.count > 0 && creditType === "cast") {
          for (const eachRow of peopleCastResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id ? eachRow.id : "",
                people_id: eachRow.people_id ? eachRow.people_id : "",
                cast_name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
                character_name: eachRow.character_name ? eachRow.character_name : "",
                job: eachRow.job ? eachRow.job : "",
                is_guest: eachRow.is_guest ? eachRow.is_guest : "",
                poster: eachRow.person && eachRow.person.poster ? eachRow.person.poster : "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
                tmdb_id: eachRow.person && eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
              };
              responseDetails.push(data);
            }
          }
        }

        // Get crew details list
        if (peopleCrewResult.count > 0 && creditType === "crew") {
          for (const eachRow of peopleCrewResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id ? eachRow.id : "",
                people_id: eachRow.people_id ? eachRow.people_id : "",
                cast_name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
                job: eachRow.job ? eachRow.job : "",
                poster: eachRow.person && eachRow.person.poster ? eachRow.person.poster : "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
                tmdb_id: eachRow.person && eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
              };
              responseDetails.push(data);
            }
          }
        }
      }

      if (creditType === "crew") {
        res.ok({
          tmdb_id: tmdbId,
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
          crew_details: responseDetails,
        });
      } else {
        res.ok({
          tmdb_id: tmdbId,
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
          cast_details: responseDetails,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};
