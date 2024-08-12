import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";

/**
 * editWtCastCrewRequestList
 * @param req
 * @param res
 */
export const editWtCastCrewRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const siteLanguage = req.body.site_language;
    const creditType = req.body.credit_type;
    const seasonPkId = req.body.season_id ? req.body.season_id : "";

    const titleId = req.body.title_id ? req.body.title_id : "";

    // find requestId and creditId is present in request table
    let findCreditId = {};
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
    if (Object.keys(requestCondition).length > 0) {
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

    const findRequestSeasonId = await model.titleRequestSeasonDetails.findOne({
      where: {
        id: draftSeasonId,
        request_id: requestId,
        status: "active",
      },
    });

    /* Fetching the list of character and crew details
    Here cast means character List
    */
    if (foundCredit && foundCredit > 0) {
      const castList =
        findCreditId.cast_details != null ? JSON.parse(findCreditId.cast_details) : null;
      const crewList =
        findCreditId.crew_details != null ? JSON.parse(findCreditId.crew_details) : null;
      // Fetch only when both RequestID and CreditID data is present
      let responseDetails = [];
      if (creditType === "character" && castList != null) {
        // Loop through the list of cast details
        for (const castDetails of castList.list) {
          if (castDetails.season_id === seasonId && castDetails.department === "character") {
            // Presence of season ID means its a TV request - Cast details
            let data = {
              id: castDetails.id,
              temp_id: castDetails.temp_id,
              people_id: castDetails.people_id,
              character_name: castDetails.character_name,
              description: castDetails.description ? castDetails.description : "",
              is_guest: castDetails.is_guest,
              poster: castDetails.poster,
              season_id: castDetails.season_id,
              order: castDetails.list_order,
            };
            responseDetails.push(data);
          }
        }
        res.ok({
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
          character_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else if (creditType === "crew" && crewList != null) {
        // Loop through the list of crew details
        for (const crewDetails of crewList.list) {
          if (crewDetails.season_id === seasonId && crewDetails.department === "crew") {
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
    } else if (findRequestSeasonId) {
      let responseDetails = [];
      const searchParamsCredit = {
        distinct: false,
      };
      //get cast & crew details for Webtoons show
      if (findRequestSeasonId.season_id) {
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
        const crewCondition = {
          creditable_id: titleId,
          season_id: findRequestSeasonId.season_id,
          department: "crew",
          status: "active",
          creditable_type: "title",
        };
        const characterInclude = [
          {
            model: model.creditableTranslation,
            as: "creditableTranslationOne",
            attributes: [
              "id",
              "creditables_id",
              [
                fn(
                  "REPLACE",
                  col("creditableTranslationOne.character_image"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "character_image",
              ],
              "character_name",
              "description",
            ],
            left: true,
            where: {
              status: "active",
              site_language: "en",
            },
            required: false,
          },
          {
            model: model.creditableTranslation,
            as: "creditableTranslationOnel",
            attributes: [
              "id",
              "creditables_id",
              [
                fn(
                  "REPLACE",
                  col("creditableTranslationOnel.character_image"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "character_image",
              ],
              "character_name",
              "description",
            ],
            left: true,
            where: {
              status: "active",
              site_language: "ko",
            },
            required: false,
          },
        ];
        const characterCondition = {
          creditable_id: titleId,
          season_id: seasonPkId,
          department: "character",
          status: "active",
          creditable_type: "title",
        };

        // Webtoons show Cast list
        [peopleCastResult, peopleCrewResult] = await Promise.all([
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            characterInclude,
            characterCondition,
            attributes,
          ),
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            crewCondition,
            attributes,
          ),
        ]);

        // Get character details list
        if (peopleCastResult.count > 0 && creditType === "character") {
          for (const eachRow of peopleCastResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id,
                people_id: eachRow.people_id,
                character_name: "",
                description: "",
                is_guest: eachRow.is_guest ? eachRow.is_guest : eachRow.is_guest == 0 ? 0 : "",
                poster: "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
              };
              const characterNameEn =
                eachRow &&
                eachRow.creditableTranslationOne &&
                eachRow.creditableTranslationOne.character_name
                  ? eachRow.creditableTranslationOne.character_name
                  : "";
              const descriptionEn =
                eachRow &&
                eachRow.creditableTranslationOne &&
                eachRow.creditableTranslationOne.description
                  ? eachRow.creditableTranslationOne.description
                  : "";
              const posterEn =
                eachRow &&
                eachRow.creditableTranslationOne &&
                eachRow.creditableTranslationOne.character_image
                  ? eachRow.creditableTranslationOne.character_image
                  : "";
              const characterNameKo =
                eachRow &&
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.character_name
                  ? eachRow.creditableTranslationOnel.character_name
                  : "";
              const descriptionKo =
                eachRow &&
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.description
                  ? eachRow.creditableTranslationOnel.description
                  : "";
              const posterKo =
                eachRow &&
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.character_image
                  ? eachRow.creditableTranslationOnel.character_image
                  : "";
              data.character_name = siteLanguage == "en" ? characterNameEn : characterNameKo;
              data.description = siteLanguage == "en" ? descriptionEn : descriptionKo;
              data.poster = posterEn ? posterEn : posterKo;
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
              };
              responseDetails.push(data);
            }
          }
        }

        if (creditType === "crew") {
          res.ok({
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
            draft_relation_id: relationId,
            draft_request_id: requestId,
            draft_season_id: draftSeasonId,
            season_id: seasonPkId,
            draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
            character_details:
              responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
          });
        }
      } else {
        if (creditType === "crew") {
          res.ok({
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
            draft_relation_id: relationId,
            draft_request_id: requestId,
            draft_season_id: draftSeasonId,
            season_id: seasonPkId,
            draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
            character_details:
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
      //get character & crew details for webtoons
      if (seasonPkId) {
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
        const characterInclude = [
          {
            model: model.creditableTranslation,
            as: "creditableTranslationOne",
            attributes: [
              "id",
              "creditables_id",
              [
                fn(
                  "REPLACE",
                  col("creditableTranslationOne.character_image"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "character_image",
              ],
              "character_name",
              "description",
            ],
            left: true,
            where: {
              status: "active",
              site_language: "en",
            },
            required: false,
          },
          {
            model: model.creditableTranslation,
            as: "creditableTranslationOnel",
            attributes: [
              "id",
              "creditables_id",
              [
                fn(
                  "REPLACE",
                  col("creditableTranslationOnel.character_image"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "character_image",
              ],
              "character_name",
              "description",
            ],
            left: true,
            where: {
              status: "active",
              site_language: "ko",
            },
            required: false,
          },
        ];
        const characterCondition = {
          creditable_id: titleId,
          season_id: seasonPkId,
          department: "character",
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
        [peopleCastResult, peopleCrewResult] = await Promise.all([
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            characterInclude,
            characterCondition,
            attributes,
          ),
          paginationService.pagination(
            searchParamsCredit,
            model.creditable,
            includeQuery,
            crewCondition,
            attributes,
          ),
        ]);

        // Get character details list
        if (peopleCastResult.count > 0 && creditType === "character") {
          for (const eachRow of peopleCastResult.rows) {
            if (eachRow) {
              let data = {
                id: eachRow.id,
                people_id: eachRow.people_id,
                character_name: "",
                description: "",
                is_guest: eachRow.is_guest ? eachRow.is_guest : eachRow.is_guest == 0 ? 0 : "",
                poster: "",
                season_id: eachRow.season_id ? eachRow.season_id : "",
                order: eachRow.list_order,
              };
              const characterNameEn =
                eachRow &&
                eachRow.creditableTranslationOne &&
                eachRow.creditableTranslationOne.character_name
                  ? eachRow.creditableTranslationOne.character_name
                  : "";
              const descriptionEn =
                eachRow &&
                eachRow.creditableTranslationOne &&
                eachRow.creditableTranslationOne.description
                  ? eachRow.creditableTranslationOne.description
                  : "";
              const posterEn =
                eachRow &&
                eachRow.creditableTranslationOne &&
                eachRow.creditableTranslationOne.character_image
                  ? eachRow.creditableTranslationOne.character_image
                  : "";
              const characterNameKo =
                eachRow &&
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.character_name
                  ? eachRow.creditableTranslationOnel.character_name
                  : "";
              const descriptionKo =
                eachRow &&
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.description
                  ? eachRow.creditableTranslationOnel.description
                  : "";
              const posterKo =
                eachRow &&
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.character_image
                  ? eachRow.creditableTranslationOnel.character_image
                  : "";
              data.character_name = siteLanguage == "en" ? characterNameEn : characterNameKo;
              data.description = siteLanguage == "en" ? descriptionEn : descriptionKo;
              data.poster = posterEn ? posterEn : posterKo;
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
              };
              responseDetails.push(data);
            }
          }
        }
      }
      if (creditType === "crew") {
        res.ok({
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
          crew_details: responseDetails,
        });
      } else {
        res.ok({
          draft_relation_id: relationId,
          draft_request_id: requestId,
          draft_season_id: draftSeasonId,
          season_id: seasonPkId,
          draft_credit_id: findCreditId && findCreditId.id ? findCreditId.id : "",
          character_details: responseDetails,
        });
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
