import model from "../../models/index.js";
import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * addNewCompanyDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewCompanyDocument = async (id, indexName) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const companyId = id;
    const indexValue = indexName;
    let companyElement = {};
    const companyData = await model.agency.findOne({
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
        id: companyId,
      },
      subQuery: true,
    });

    if (companyData) {
      let nameEnglish = "";
      let nameKorean = "";
      let searchData = {};
      let companyResultData = {};
      let sortingFiledsData = {};

      companyElement.id = companyData.id;

      if (companyData.agencyTranslations.length > 0) {
        for (const translationData of companyData.agencyTranslations) {
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
    }

    if (Object.keys(companyElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: companyId,
              },
            },
          },
        });

        if (docSearch.hits.total.value > 0) {
          if (docSearch.hits.hits.length > 0) {
            const documentId = docSearch.hits.hits[0]._id ? docSearch.hits.hits[0]._id : null;
            // check for document already exist
            // 1. If exist update the document
            // 2. Else Add a new document to the index
            if (documentId) {
              const res = await searchClient.update({
                index: indexValue,
                id: documentId,
                body: {
                  // New document data you want to update to
                  doc: companyElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: companyElement,
              });
              return res
                ? { status: "success", message: "document is Created" }
                : { status: "error", message: "something is wrong. document is not Created" };
            }
          } else {
            return { status: "error", message: "Index data not found" };
          }
        } else {
          const res = await searchClient.index({
            index: indexValue,
            body: companyElement,
          });
          return res
            ? { status: "success", message: "document is Created" }
            : { status: "error", message: "something is wrong. document is not Created" };
        }
      } else {
        return { status: "error", message: "Index not found" };
      }
    } else {
      return { status: "error", message: "Index Data not found" };
    }
  } catch (error) {
    console.log(error);
    return { status: "sys_error", message: error };
  }
};
