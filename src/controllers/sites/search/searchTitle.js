import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { tmdbService, kobisService, paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TMDB_APIS } from "../../../utils/constants.js";
import { envs } from "../../../config/index.js";

/**
 * searchTitle
 * @param req
 * @param res
 */
export const searchTitle = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const titleType = reqBody.title_type; // value may be movie/tv/webtoons
    const searchType = reqBody.search_type; //value will be title/tmdb_id/kobis_id
    const searchText = reqBody.search_text ? reqBody.search_text.trim() : "";
    const sortingOrder = reqBody.sort_by == "newest" ? "desc" : "asc"; // value will be newest/oldest
    let data = [];
    let titleResult = [];
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
      sortBy: "year",
      sortOrder: sortingOrder,
    };

    // finding the search_text and listing out all the search related data
    if (searchText) {
      //let whereQuery = {};
      if (searchType == "title") {
        const attributes = ["id", "type", "year", "release_date", "original_title"];
        const modelName = model.title;
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
            translateCondition.name = { [Op.like]: `%${searchText}%` };
          }
        }
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: translateCondition,
            required: true,
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          type: titleType,
          record_status: "active",
        };

        [titleResult, tmbdResult, kobisResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          ),
          titleType != "webtoons"
            ? tmdbService.searchTitles(titleType, searchText, page, language)
            : [],

          titleType != "webtoons"
            ? kobisService.searchTitles(titleType, searchText, page, limit, language)
            : [],
        ]);
      }
      if (searchType == "tiving_id") {
        const attributes = ["id", "tiving_id", "type", "year", "release_date", "original_title"];
        const modelName = model.title;
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          type: titleType,
          tiving_id: searchText,
          record_status: "active",
        };

        [titleResult] = await Promise.all([
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
        const attributes = ["id", "odk_id", "type", "year", "release_date", "original_title"];
        const modelName = model.title;
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          type: titleType,
          odk_id: searchText,
          record_status: "active",
        };

        [titleResult] = await Promise.all([
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
        const attributes = ["id", "type", "year", "release_date", "original_title"];
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          tmdb_id: searchText,
          type: titleType,
          record_status: "active",
        };

        [titleResult, tmbdResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            model.title,
            includeQuery,
            condition,
            attributes,
          ),
          titleType != "webtoons"
            ? tmdbService.fetchTitleDetails(titleType, searchText, language)
            : [],
        ]);
      }
      if (searchType == "kobis_id") {
        const attributes = ["id", "type", "year", "release_date", "original_title"];
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          kobis_id: searchText,
          type: titleType,
          record_status: "active",
        };

        [titleResult, kobisResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            model.title,
            includeQuery,
            condition,
            attributes,
          ),
          kobisService.fetchTitleDetails(titleType, searchText, language),
        ]);
      }

      if (searchType == "imdb_id") {
        const attributes = ["id", "type", "year", "release_date", "original_title"];
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          imdb_id: searchText,
          type: titleType,
          record_status: "active",
        };

        [titleResult, imbdResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            model.title,
            includeQuery,
            condition,
            attributes,
          ),
          tmdbService.fetchTitleDetailsImdbId(titleType, searchText, language),
        ]);
      }

      if (searchType == "naver_id") {
        const attributes = ["id", "naver_id", "type", "year", "release_date", "original_title"];
        const modelName = model.title;
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          type: titleType,
          naver_id: searchText,
          record_status: "active",
        };

        [titleResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          ),
        ]);
      }

      if (searchType == "kakao_id") {
        const attributes = ["id", "kakao_id", "type", "year", "release_date", "original_title"];
        const modelName = model.title;
        const includeQuery = [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "description", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ];

        const condition = {
          type: titleType,
          kakao_id: searchText,
          record_status: "active",
        };

        [titleResult] = await Promise.all([
          paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          ),
        ]);
      }

      if (titleResult.count > 0) {
        for (let element of titleResult.rows) {
          const requiredFormat = {
            id: element.id,
            title:
              element.titleTranslations && element.titleTranslations[0]
                ? element.titleTranslations[0].name
                : "",
            original_title: element.original_title,
            release_date: element.release_date,
            overview:
              element.titleTranslations && element.titleTranslations[0]
                ? element.titleTranslations[0].description
                : "",
            poster_image:
              element.titleImages && element.titleImages[0] && element.titleImages[0].path
                ? element.titleImages[0].path
                : "",
            year: element.year,
          };
          if (searchType == "tiving_id") {
            requiredFormat.tiving_id = element.tiving_id;
          }
          if (searchType == "odk_id") {
            requiredFormat.odk_id = element.odk_id;
          }
          if (searchType == "naver_id") {
            requiredFormat.naver_id = element.naver_id;
          }
          if (searchType == "kakao_id") {
            requiredFormat.kakao_id = element.kakao_id;
          }
          data.push(requiredFormat);
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
              title: tmbdResult.results.title,
              original_title: tmbdResult.results.original_title,
              release_date: tmbdResult.results.release_date,
              overview: tmbdResult.results.overview,
              poster_image: tmbdResult.results.poster_image,
              year: tmbdResult.results.year,
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
              title: kobisResult.results.title,
              original_title: kobisResult.results.original_title,
              release_date: kobisResult.results.release_date,
              overview: kobisResult.results.overview,
              poster_image: kobisResult.results.poster_image,
              year: kobisResult.results.year,
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
                title: eachRow.title,
                original_title: eachRow.original_title,
                release_date: eachRow.release_date,
                overview: eachRow.overview,
                poster_image: eachRow.poster_image,
                year: eachRow.year,
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
        type: titleType,
        internal_data: {
          page: page,
          limit: limit,
          total_records: titleResult.count,
          total_pages: titleResult.count > 0 ? Math.ceil(titleResult.count / limit) : 0,
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
