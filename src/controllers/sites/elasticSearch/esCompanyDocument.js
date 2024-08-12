import model from "../../../models/index.js";
import { searchClient } from "../../../config/index.js";

/**
 * esCompanyDocument
 * @param req
 * @param res
 */

export const esCompanyDocument = async (req, res, next) => {
  try {
    let companyDataset = [];
    let companyCount = 0;
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const indexName = !req.body.index_name ? "search-company" : req.body.index_name;
    const companyData = await model.agency.findAll({
      offset: parseInt(offset),
      limit: parseInt(limit),
      attributes: ["id", "agency_code", "email"],
      include: [
        {
          model: model.agencyTranslation,
          attributes: ["agency_id", "name", "site_language"],
          left: true,
          required: true,
        },
      ],
      where: {
        status: "active",
      },
      subQuery: true,
    });

    const totalRecords = await model.agency.count({
      where: {
        status: "active",
      },
    });
    let getData = companyData;

    if (getData.length > 0) {
      for (const value of getData) {
        let nameEnglish = "";
        let nameKorean = "";
        let searchData = {};
        let companyResultData = {};
        let sortingFiledsData = {};
        const companyElement = {
          id: value.id,
        };
        if (value.agencyTranslations.length > 0) {
          for (const translationData of value.agencyTranslations) {
            if (translationData.site_language == "en") {
              nameEnglish = translationData.name ? translationData.name : null;
            }
            if (translationData.site_language == "ko") {
              nameKorean = translationData.name ? translationData.name : null;
            }
          }

          searchData.name_en = nameEnglish ? nameEnglish : null;
          searchData.name_ko = nameKorean ? nameKorean : null;
        }

        // -----------------------------Result data :
        companyResultData.en = {
          name: nameEnglish ? nameEnglish : nameKorean,
        };
        companyResultData.ko = {
          name: nameKorean ? nameKorean : nameEnglish,
        };

        // -----------------------------sorting fields
        sortingFiledsData.name_en = nameEnglish ? nameEnglish : null;
        sortingFiledsData.name_ko = nameKorean ? nameKorean : null;

        companyElement.search = searchData;
        companyElement.results = companyResultData;
        companyElement.sorting_fileds = sortingFiledsData;
        companyDataset.push(companyElement);
      }
    }

    if (companyDataset.length > 0) {
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
                    },
                  },
                  ko: {
                    type: "object",
                    properties: {
                      name: {
                        type: "text",
                        index: false,
                      },
                    },
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
            },
          },
        });
      }

      const operations = companyDataset.flatMap((doc) => [{ index: { _index: indexName } }, doc]);

      const bulkResponse = await searchClient.bulk({ refresh: true, operations });

      if (bulkResponse.errors) {
        const erroredDocuments = [];
        // The items array has the same order of the tagDataset we just indexed.
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

      companyCount = await searchClient.count({ index: indexName });
    }
    res.ok({
      message: res.__("success"),
      offset: offset,
      limit: limit,
      total_records: totalRecords,
      total_pages: totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0,
      search_result: companyCount,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
