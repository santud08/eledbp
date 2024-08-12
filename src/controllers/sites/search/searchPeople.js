import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { tmdbService, kobisService, paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TMDB_APIS } from "../../../utils/constants.js";
import { envs } from "../../../config/index.js";

/**
 * searchPeople
 * @param req
 * @param res
 */
export const searchPeople = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchType = reqBody.search_type; //value will be title/tmdb_id/kobis_id
    const searchText = reqBody.search_text ? reqBody.search_text.trim() : "";
    const sortingOrder = reqBody.sort_by == "newest" ? "desc" : "asc"; // value will be newest/oldest
    let data = [];
    let peopleResult = [];
    let tmbdResult = [];
    let kobisResult = [];
    let imbdResult = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const tmdbLimit = TMDB_APIS.TMDB_LIMIT;

    const language = req.accept_language;
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: sortingOrder,
    };

    // finding the search_text and listing out all the search related data
    if (searchText) {
      if (searchType == "title") {
        const attributes = [
          "id",
          "birth_date",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "popularity",
        ];
        const modelName = model.people;
        const spiltText = searchText.split(" ");
        const translateCondition = { status: "active" };
        if (spiltText && spiltText != null && spiltText != "undefined" && spiltText.length > 0) {
          if (spiltText.length > 1) {
            const OrArray = [];
            for (const eachSearchText of spiltText) {
              if (eachSearchText) {
                OrArray.push({ name: { [Op.like]: `${eachSearchText}%` } });
              }
            }
            OrArray.push({ name: { [Op.like]: `${searchText}%` } });
            translateCondition[Op.or] = OrArray;
          } else {
            translateCondition.name = { [Op.like]: `${searchText}%` };
          }
        }
        const includeQuery = [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: translateCondition,
            required: true,
          },
        ];

        const condition = {
          status: "active",
        };

        [peopleResult, tmbdResult, kobisResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          ),
          tmdbService.searchPeople(searchText, page, language),

          kobisService.searchPeople(searchText, page, limit, language),
        ]);
      }
      if (searchType == "tiving_id") {
        const attributes = [
          "id",
          "birth_date",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "popularity",
          "tiving_id",
        ];
        const modelName = model.people;
        const includeQuery = [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ];

        const condition = {
          status: "active",
          tiving_id: searchText,
        };

        [peopleResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          ),
        ]);
      }
      if (searchType == "odk_id") {
        const attributes = [
          "id",
          "birth_date",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "popularity",
          "odk_id",
        ];
        const modelName = model.people;
        const includeQuery = [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ];

        const condition = {
          status: "active",
          odk_id: searchText,
        };

        [peopleResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          ),
        ]);
      }
      if (searchType == "tmdb_id") {
        const attributes = [
          "id",
          "birth_date",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "popularity",
        ];
        const includeQuery = [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ];

        const condition = {
          tmdb_id: searchText,
          status: "active",
        };

        [peopleResult, tmbdResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            model.people,
            includeQuery,
            condition,
            attributes,
          ),
          tmdbService.fetchPeopleDetails(searchText, language),
        ]);
      }

      if (searchType == "kobis_id") {
        const attributes = [
          "id",
          "birth_date",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "popularity",
        ];
        const includeQuery = [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ];

        const condition = {
          kobis_id: searchText,
          status: "active",
        };

        [peopleResult, kobisResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            model.people,
            includeQuery,
            condition,
            attributes,
          ),
          kobisService.fetchPeopleDetails(searchText, language),
        ]);
      }

      if (searchType == "imdb_id") {
        const attributes = [
          "id",
          "birth_date",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "popularity",
        ];
        const includeQuery = [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ];

        const condition = {
          imdb_id: searchText,
          status: "active",
        };

        [peopleResult, imbdResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            model.people,
            includeQuery,
            condition,
            attributes,
          ),
          tmdbService.fetchTitleDetailsImdbId("people", searchText, language),
        ]);
      }

      if (peopleResult.count > 0) {
        for (let element of peopleResult.rows) {
          if (element) {
            const requiredFormat = {
              id: element.id,
              people_name:
                element.peopleTranslations && element.peopleTranslations.length > 0
                  ? element.peopleTranslations[0].name
                  : "",
              birth_day: element.birth_date,
              role_name:
                element.peopleTranslations && element.peopleTranslations.length > 0
                  ? element.peopleTranslations[0].known_for
                  : "",
              profile_image: element.poster ? element.poster : "",
            };
            if (searchType == "tiving_id") {
              requiredFormat.tiving_id = element.tiving_id;
            }
            if (searchType == "odk_id") {
              requiredFormat.odk_id = element.odk_id;
            }
            data.push(requiredFormat);
          }
        }
      }

      if (tmbdResult.results) {
        if (searchType == "tmdb_id") {
          if (tmbdResult.results.tmdb_id) {
            tmbdResult.total_records = 1;
            tmbdResult.total_pages = 1;
            tmbdResult.page = page;
            tmbdResult.limit = tmdbLimit;
            const requiredFormat = {
              tmdb_id: tmbdResult.results.tmdb_id,
              people_name: tmbdResult.results.people_name,
              birth_day: tmbdResult.results.birth_day,
              role_name: tmbdResult.results.role_name,
              profile_image: tmbdResult.results.profile_image,
            };
            tmbdResult.results = [];
            tmbdResult.results.push(requiredFormat);
          } else {
            tmbdResult.total_records = 0;
            tmbdResult.total_pages = 0;
            tmbdResult.page = page;
            tmbdResult.limit = tmdbLimit;
            tmbdResult.results = [];
          }
        } else {
          tmbdResult.limit = tmdbLimit;
        }
      } else {
        tmbdResult.total_records = 0;
        tmbdResult.total_pages = 0;
        tmbdResult.page = page;
        tmbdResult.limit = tmdbLimit;
        tmbdResult.results = [];
      }

      if (kobisResult.results) {
        if (searchType == "kobis_id") {
          if (kobisResult.results.kobis_id) {
            kobisResult.total_records = 1;
            kobisResult.total_pages = 1;
            kobisResult.page = page;
            kobisResult.limit = limit;
            const requiredFormat = {
              kobis_id: kobisResult.results.kobis_id,
              people_name: kobisResult.results.people_name,
              birth_day: kobisResult.results.birth_day,
              role_name: kobisResult.results.role_name,
              profile_image: kobisResult.results.profile_image,
            };

            kobisResult.results = [];
            kobisResult.results.push(requiredFormat);
          } else {
            kobisResult.total_records = 0;
            kobisResult.total_pages = 0;
            kobisResult.page = page;
            kobisResult.limit = limit;
            kobisResult.results = [];
          }
        }
      }
      if (imbdResult.results) {
        if (searchType == "imdb_id") {
          if (imbdResult.results.length > 0) {
            imbdResult.total_records = imbdResult.results.length;
            imbdResult.total_pages = Math.ceil(imbdResult.results.length / tmdbLimit);
            imbdResult.page = page;
            imbdResult.limit = tmdbLimit;
            let newImdbRes = [];
            for (const eachRow of imbdResult.results) {
              const requiredFormat = {
                tmdb_id: eachRow.tmdb_id,
                people_name: eachRow.people_name,
                birth_day: eachRow.birth_day,
                role_name: eachRow.role_name,
                profile_image: eachRow.profile_image,
              };
              newImdbRes.push(requiredFormat);
            }
            imbdResult.results = newImdbRes;
          } else {
            imbdResult.total_records = 0;
            imbdResult.total_pages = 0;
            imbdResult.page = page;
            imbdResult.limit = tmdbLimit;
            imbdResult.results = [];
          }
        } else {
          imbdResult.limit = tmdbLimit;
        }
      }

      res.ok({
        internal_data: {
          page: page,
          limit: limit,
          total_records: peopleResult.count,
          total_pages: peopleResult.count > 0 ? Math.ceil(peopleResult.count / limit) : 0,
          results: data,
        },
        tmdb_data: searchType == "imdb_id" ? imbdResult : tmbdResult,
        kobis_data: kobisResult,
      });
    }
  } catch (error) {
    next(error);
  }
};
