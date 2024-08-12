import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { searchClient, envs } from "../../../config/index.js";

/**
 * esMovieDocument
 * @param req
 * @param res
 */

export const esMovieDocument = async (req, res, next) => {
  try {
    let movieDataSet = [];
    let titleCount = 0;
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const indexName = !req.body.index_name ? "search-movie" : req.body.index_name;
    const movieData = await model.title.findAll({
      offset: parseInt(offset),
      limit: parseInt(limit),
      attributes: ["id", "uuid", "type", "release_date", "calculate_popularity"],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "aka", "description", "site_language", "status"],
          left: true,
          required: true,
        },
        {
          model: model.titleReRelease,
          attributes: ["title_id", "re_release_date", "status"],
          left: true,
          where: {
            status: "active",
          },
          separate: true,
          order: [["re_release_date", "DESC"]],
          required: false,
          limit: 1,
        },
        {
          model: model.titleKeyword,
          attributes: ["title_id", "keyword", "status"],
          left: true,
          where: {
            status: "active",
            keyword_type: "search",
          },
          required: false,
        },
        {
          model: model.titleImage,
          attributes: [
            "title_id",
            "file_name",
            "url",
            "source",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
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
      ],
      where: {
        type: "movie",
        record_status: "active",
      },
      subQuery: true,
    });

    const totalRecords = await model.title.count({
      where: {
        type: "movie",
        record_status: "active",
      },
    });
    let getData = movieData;

    if (getData.length > 0) {
      for (const value of getData) {
        let nameEnglish = "";
        let descriptionEnglish = "";
        let nameKorean = "";
        let descriptionKorean = "";
        let reReleaseDate = "";
        let posterImage = "";
        let keywordArry = [];
        let searchData = {};
        let movieResultData = {};
        let sortingFiledsData = {};
        const movieElement = {
          id: value.id,
          uuid: value.uuid ? value.uuid : null,
          type: value.type ? value.type : "movie",
        };
        if (value.titleTranslations.length > 0) {
          for (const translationData of value.titleTranslations) {
            if (translationData.site_language == "en") {
              nameEnglish = translationData.name ? translationData.name : null;
              descriptionEnglish = translationData.description ? translationData.description : null;
            }
            if (translationData.site_language == "ko") {
              nameKorean = translationData.name ? translationData.name : null;
              descriptionKorean = translationData.description ? translationData.description : null;
            }
          }

          searchData.name_en = nameEnglish ? nameEnglish : null;
          searchData.name_ko = nameKorean ? nameKorean : null;

          searchData.aka = value.titleTranslations[0].aka ? value.titleTranslations[0].aka : null;
        }
        if (value.titleReReleases.length > 0) {
          reReleaseDate = value.titleReReleases[0].re_release_date
            ? value.titleReReleases[0].re_release_date
            : null;
        }
        if (value.titleImages.length > 0) {
          posterImage = value.titleImages[0].path ? value.titleImages[0].path : null;
        }

        if (value.titleKeywords.length > 0) {
          for (const keywordData of value.titleKeywords) {
            if (keywordData.keyword) {
              keywordArry.push(keywordData.keyword);
            }
          }
        }
        searchData.keywords = keywordArry;

        // -----------------------------Result data :
        movieResultData.en = {
          name: nameEnglish ? nameEnglish : nameKorean,
          description: descriptionEnglish ? descriptionEnglish : descriptionKorean,
        };
        movieResultData.ko = {
          name: nameKorean ? nameKorean : nameEnglish,
          description: descriptionKorean ? descriptionKorean : descriptionEnglish,
        };

        movieResultData.poster_image = posterImage ? posterImage : null;
        movieResultData.release_date = reReleaseDate
          ? reReleaseDate
          : value.release_date
          ? value.release_date
          : null;

        // -----------------------------sorting fields
        sortingFiledsData.popularity = value.calculate_popularity
          ? value.calculate_popularity
          : null; // popularity logic function field
        sortingFiledsData.release_date = movieResultData.release_date;

        movieElement.search = searchData;
        movieElement.results = movieResultData;
        movieElement.sorting_fileds = sortingFiledsData;
        movieDataSet.push(movieElement);
      }
    }

    if (movieDataSet.length > 0) {
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      if (!checkIndex) {
        await searchClient.indices.create({
          index: indexName,
          mappings: {
            properties: {
              id: {
                type: "long",
                index: true,
              },
              sorting_fileds: {
                type: "object",
                properties: {
                  popularity: {
                    type: "integer",
                    index: false,
                  },
                  release_date: {
                    type: "date",
                    index: false,
                  },
                },
              },
              results: {
                type: "object",
                properties: {
                  en: {
                    type: "object",
                    properties: {
                      name: {
                        type: "text",
                        index: false,
                      },
                      description: {
                        type: "text",
                        index: false,
                      },
                    },
                  },
                  ko: {
                    type: "object",
                    properties: {
                      name: {
                        type: "text",
                        index: false,
                      },
                      description: {
                        type: "text",
                        index: false,
                      },
                    },
                  },
                  poster_image: {
                    type: "text",
                    index: false,
                  },
                  release_date: {
                    type: "date",
                    index: false,
                  },
                },
              },
              search: {
                type: "object",
                properties: {
                  aka: {
                    type: "text",
                    index: true,
                  },
                  keywords: {
                    type: "text",
                    index: true,
                  },
                  name_en: {
                    type: "text",
                    index: true,
                  },
                  name_ko: {
                    type: "text",
                    index: true,
                  },
                },
              },
              type: {
                type: "text",
                index: true,
              },
              uuid: {
                type: "text",
                index: false,
              },
            },
          },
        });
      }

      const titleDataSet = movieDataSet;

      const operations = titleDataSet.flatMap((doc) => [{ index: { _index: indexName } }, doc]);

      const bulkResponse = await searchClient.bulk({ refresh: true, operations });

      if (bulkResponse.errors) {
        const erroredDocuments = [];
        // The items array has the same order of the titleDataSet we just indexed.
        // The presence of the `error` key indicates that the operation
        // that we did for the document has failed.
        bulkResponse.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              // If the status is 429 it means that you can retry the document,
              // otherwise it's very likely a mapping error, and you should
              // fix the document before to try it again.
              status: action[operation].status,
              error: action[operation].error,
              operation: operations[i * 2],
              document: operations[i * 2 + 1],
            });
          }
        });
        console.log("erroredDocuments", erroredDocuments);
      }

      titleCount = await searchClient.count({ index: indexName });
    }
    res.ok({
      message: res.__("success"),
      offset: offset,
      limit: limit,
      total_records: totalRecords,
      total_pages: totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0,
      search_result: titleCount,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
