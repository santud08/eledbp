import model from "../../../models/index.js";
import { fn, col, Sequelize } from "sequelize";
import { searchClient, envs } from "../../../config/index.js";

/**
 * esPeopleDocument
 * @param req
 * @param res
 */

export const esPeopleDocument = async (req, res, next) => {
  try {
    let peopleDataSet = [];
    let titleCount = 0;
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const indexName = !req.body.index_name ? "search-people" : req.body.index_name;

    const peopleData = await model.people.findAll({
      offset: parseInt(offset),
      limit: parseInt(limit),
      attributes: ["id", "uuid", "birth_date", "death_date", "popularity_order"],
      include: [
        {
          model: model.peopleTranslation,
          attributes: ["people_id", "name", "known_for", "description", "site_language", "status"],
          left: true,
          required: true,
        },
        {
          model: model.peopleKeywords,
          attributes: ["people_id", "keyword", "status"],
          left: true,
          where: {
            status: "active",
            keyword_type: "search",
          },
          required: false,
        },
        {
          model: model.creditable,
          attributes: ["people_id", "creditable_id"],
          left: true,
          where: { creditable_type: "title", status: "active" },
          required: true,
          include: {
            model: model.title,
            attributes: ["id"],
            left: true,
            where: { record_status: "active" },
            include: {
              model: model.titleTranslation,
              left: true,
              required: true,
              attributes: ["title_id", "name", "site_language"],
              where: { status: "active" },
            },
          },
          separate: true,
          group: [Sequelize.col("creditable_id"), Sequelize.col("people_id")],
          order: [["creditable_id", "DESC"]],
          subQuery: true,
        },
        {
          model: model.peopleImages,
          attributes: [
            "people_id",
            "file_name",
            "url",
            "source",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: { image_category: "poster_image", is_main_poster: "y" },
          required: false,
          separate: true, //get the recently added image
          order: [["id", "DESC"]],
        },
      ],
      where: {
        status: "active",
      },
      subQuery: true,
    });

    const totalRecords = await model.people.count({
      where: {
        status: "active",
      },
    });
    let getData = peopleData;

    if (getData.length > 0) {
      for (const value of getData) {
        let nameEnglish = "";
        let titleNameEnglish = "";
        let descriptionEnglish = "";
        let nameKorean = "";
        let titleNameKorean = "";
        let descriptionKorean = "";
        let posterImage = "";
        let keywordArry = [];
        let searchData = {};
        let peopleResultData = {};
        let sortingFiledsData = {};
        let workListDetails = {};
        let workListEnData = [];
        let workListKoData = [];
        const peopleElement = {
          id: value.id,
          uuid: value.uuid ? value.uuid : null,
          type: "people",
        };
        if (value.peopleTranslations.length > 0) {
          for (const translationData of value.peopleTranslations) {
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
          searchData.aka = value.peopleTranslations[0].known_for
            ? value.peopleTranslations[0].known_for
            : null;
        }
        if (value.peopleImages.length > 0) {
          posterImage = value.peopleImages[0].path ? value.peopleImages[0].path : null;
        }
        if (value.peopleKeywords.length > 0) {
          for (const keywordData of value.peopleKeywords) {
            if (keywordData.keyword) {
              keywordArry.push(keywordData.keyword);
            }
          }
        }
        searchData.keywords = keywordArry;
        // -----------------------------Result data :
        peopleResultData.en = {
          name: nameEnglish ? nameEnglish : nameKorean,
          description: descriptionEnglish ? descriptionEnglish : descriptionKorean,
        };
        peopleResultData.ko = {
          name: nameKorean ? nameKorean : nameEnglish,
          description: descriptionKorean ? descriptionKorean : descriptionEnglish,
        };

        peopleResultData.poster_image = posterImage ? posterImage : null;
        peopleResultData.birth_date = value.birth_date ? value.birth_date : null;
        peopleResultData.death_date = value.death_date ? value.death_date : null;

        // worklist:
        if (value.creditables.length > 0) {
          for (const creditablesData of value.creditables) {
            if (creditablesData.titles && creditablesData.titles.length > 0) {
              for (const titleData of creditablesData.titles) {
                if (titleData.titleTranslations.length > 0) {
                  for (const translationData of titleData.titleTranslations) {
                    if (translationData.site_language == "en" && translationData.title_id) {
                      titleNameEnglish = translationData.name ? translationData.name : null;
                    }
                    if (translationData.site_language == "ko") {
                      titleNameKorean = translationData.name ? translationData.name : null;
                    }
                  }
                  const titleID = titleData.id;
                  const enPushName = titleNameEnglish
                    ? titleNameEnglish
                    : titleNameKorean
                    ? titleNameKorean
                    : null;
                  const koPushName = titleNameKorean
                    ? titleNameKorean
                    : titleNameEnglish
                    ? titleNameEnglish
                    : null;
                  const enElement = {
                    title_id: titleID,
                    title_name: enPushName,
                  };
                  const koElement = {
                    title_id: titleID,
                    title_name: koPushName,
                  };
                  if (enPushName && workListEnData.length < 4) workListEnData.push(enElement);
                  if (koPushName && workListKoData.length < 4) workListKoData.push(koElement);
                }
              }
            }
          }
        }
        workListDetails.en = workListEnData;
        workListDetails.ko = workListKoData;
        peopleResultData.work_list = workListDetails;

        // -----------------------------sorting fields
        sortingFiledsData.popularity = value.popularity_order ? value.popularity_order : null; // popularity logic function field
        sortingFiledsData.birth_date = peopleResultData.birth_date;

        peopleElement.search = searchData;
        peopleElement.results = peopleResultData;
        peopleElement.sorting_fileds = sortingFiledsData;
        peopleDataSet.push(peopleElement);
      }
    }
    // ------------------------

    if (peopleDataSet.length > 0) {
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
                  birth_date: {
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
                  birth_date: {
                    type: "date",
                    index: false,
                  },
                  death_date: {
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
              work_list: {
                type: "object",
                properties: {
                  en: {
                    type: "object",
                    properties: {
                      title_id: {
                        type: "integer",
                        index: false,
                      },
                      title_name: {
                        type: "text",
                        index: false,
                      },
                    },
                  },
                  ko: {
                    type: "object",
                    properties: {
                      title_id: {
                        type: "integer",
                        index: false,
                      },
                      title_name: {
                        type: "text",
                        index: false,
                      },
                    },
                  },
                  poster_image: {
                    type: "text",
                    index: false,
                  },
                  birth_date: {
                    type: "date",
                    index: false,
                  },
                  death_date: {
                    type: "date",
                    index: false,
                  },
                },
              },
            },
          },
        });
      }

      const operations = peopleDataSet.flatMap((doc) => [{ index: { _index: indexName } }, doc]);
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
