import model from "../../../models/index.js";
import { searchClient } from "../../../config/index.js";

/**
 * esAwardDocument
 * @param req
 * @param res
 */

export const esAwardDocument = async (req, res, next) => {
  try {
    let awardDataset = [];
    let awardCount = 0;
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const indexName = !req.body.index_name ? "search-award" : req.body.index_name;
    const awardData = await model.awards.findAll({
      offset: parseInt(offset),
      limit: parseInt(limit),
      attributes: ["id", "uuid"],
      include: [
        {
          model: model.awardTranslation,
          attributes: ["award_id", "award_name", "award_explanation", "site_language"],
          where: { status: "active" },
          left: true,
          required: true,
        },
        {
          model: model.awardImages,
          as: "awardImageOne",
          attributes: ["url"],
          left: true,
          where: { status: "active" },
          required: false,
        },
        {
          model: model.awardRounds,
          attributes: ["round_date"],
          where: { status: "active" },
          required: false,
          separate: true, //get the recently added image
          order: [["round_date", "DESC"]],
        },
      ],
      where: {
        status: "active",
      },
    });

    const totalRecords = await model.awards.count({
      where: {
        status: "active",
      },
    });
    let getData = awardData;

    if (getData.length > 0) {
      for (const value of getData) {
        let nameEnglish = "";
        let nameKorean = "";
        let descriptionEnglish = "";
        let descriptionKorean = "";
        let posterImage = "";
        let roundDate = "";
        let searchData = {};
        let awardResultData = {};
        let sortingFiledsData = {};
        const awardElement = {
          id: value.id,
          uuid: value.uuid,
        };
        if (value.awardTranslations.length > 0) {
          for (const translationData of value.awardTranslations) {
            if (translationData.site_language == "en") {
              nameEnglish = translationData.award_name ? translationData.award_name : null;
              descriptionEnglish = translationData.award_explanation
                ? translationData.award_explanation
                : null;
            }
            if (translationData.site_language == "ko") {
              nameKorean = translationData.award_name ? translationData.award_name : null;
              descriptionKorean = translationData.award_explanation
                ? translationData.award_explanation
                : null;
            }
          }

          searchData.name_en = nameEnglish ? nameEnglish : null;
          searchData.name_ko = nameKorean ? nameKorean : null;
        }
        if (value.awardImageOne) {
          posterImage = value.awardImageOne.url ? value.awardImageOne.url : null;
        }
        if (value.awardRounds.length > 0) {
          roundDate = value.awardRounds[0].round_date ? value.awardRounds[0].round_date : null;
        }
        // -----------------------------Result data :
        awardResultData.en = {
          name: nameEnglish ? nameEnglish : nameKorean,
          description: descriptionEnglish ? descriptionEnglish : descriptionKorean,
        };
        awardResultData.ko = {
          name: nameKorean ? nameKorean : nameEnglish,
          description: descriptionKorean ? descriptionKorean : descriptionEnglish,
        };
        awardResultData.poster_image = posterImage ? posterImage : null;
        awardResultData.date = roundDate ? roundDate : null;

        // -----------------------------sorting fields
        sortingFiledsData.name_en = nameEnglish ? nameEnglish : null;
        sortingFiledsData.name_ko = nameKorean ? nameKorean : null;

        awardElement.search = searchData;
        awardElement.results = awardResultData;
        awardElement.sorting_fileds = sortingFiledsData;
        awardDataset.push(awardElement);
      }
    }

    if (awardDataset.length > 0) {
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
                  name_en: {
                    type: "keyword",
                  },
                  name_ko: {
                    type: "keyword",
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
                  date: {
                    type: "date",
                    index: false,
                  },
                },
              },
              search: {
                type: "object",
                properties: {
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
              uuid: {
                type: "text",
                index: false,
              },
            },
          },
        });
      }

      const operations = awardDataset.flatMap((doc) => [{ index: { _index: indexName } }, doc]);

      const bulkResponse = await searchClient.bulk({ refresh: true, operations });

      if (bulkResponse.errors) {
        const erroredDocuments = [];
        // The items array has the same order of the awardDataset we just indexed.
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

      awardCount = await searchClient.count({ index: indexName });
    }
    res.ok({
      message: res.__("success"),
      offset: offset,
      limit: limit,
      total_records: totalRecords,
      total_pages: totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0,
      search_result: awardCount,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
