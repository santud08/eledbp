import model from "../../models/index.js";
import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * addNewTagDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewTagDocument = async (id, indexName) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const tagId = id;
    const indexValue = indexName;
    let tagElement = {};
    const tagData = await model.tag.findOne({
      attributes: ["id", "name", "type"],
      include: [
        {
          model: model.tagTranslation,
          attributes: ["tag_id", "display_name", "site_language", "status"],
          left: true,
          required: true,
        },
      ],
      where: {
        status: "active",
        id: tagId,
      },
      subQuery: true,
    });

    if (tagData) {
      let nameEnglish = "";
      let nameKorean = "";
      let searchData = {};
      let tagResultData = {};
      let sortingFiledsData = {};

      tagElement.id = tagData.id;
      tagElement.type = "tag";

      if (tagData.tagTranslations.length > 0) {
        for (const translationData of tagData.tagTranslations) {
          if (translationData.site_language == "en") {
            nameEnglish = translationData.display_name ? translationData.display_name : null;
          }
          if (translationData.site_language == "ko") {
            nameKorean = translationData.display_name ? translationData.display_name : null;
          }
        }

        searchData.name_en = nameEnglish ? nameEnglish : null;
        searchData.name_ko = nameKorean ? nameKorean : null;
      }

      // -----------------------------Result data :
      tagResultData.en = {
        name: nameEnglish ? nameEnglish : nameKorean,
      };
      tagResultData.ko = {
        name: nameKorean ? nameKorean : nameEnglish,
      };

      // -----------------------------sorting fields
      sortingFiledsData.name_en = nameEnglish ? nameEnglish : null;
      sortingFiledsData.name_ko = nameKorean ? nameKorean : null;

      tagElement.search = searchData;
      tagElement.results = tagResultData;
      tagElement.sorting_fileds = sortingFiledsData;
    }

    if (Object.keys(tagElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: tagId,
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
                  doc: tagElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: tagElement,
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
            body: tagElement,
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
