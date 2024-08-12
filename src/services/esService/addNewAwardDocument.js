import model from "../../models/index.js";
import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * addNewAwardDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewAwardDocument = async (id, indexName) => {
  try {
    const awardId = id;
    const indexValue = indexName;
    let awardElement = {};
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const awardData = await model.awards.findOne({
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
        id: awardId,
      },
    });

    if (awardData) {
      let nameEnglish = "";
      let descriptionEnglish = "";
      let nameKorean = "";
      let descriptionKorean = "";
      let posterImage = "";
      let searchData = {};
      let awardResultData = {};
      let sortingFiledsData = {};
      let roundDate = "";
      awardElement.id = awardData.id;
      awardElement.uuid = awardData.uuid ? awardData.uuid : null;
      if (awardData.dataValues.awardTranslations.length > 0) {
        for (const translationData of awardData.dataValues.awardTranslations) {
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

      if (awardData.dataValues.awardImageOne) {
        posterImage = awardData.dataValues.awardImageOne.url
          ? awardData.dataValues.awardImageOne.url
          : null;
      }

      if (awardData.dataValues.awardRounds.length > 0) {
        roundDate = awardData.dataValues.awardRounds[0].round_date
          ? awardData.dataValues.awardRounds[0].round_date
          : null;
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
    }

    if (Object.keys(awardElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: awardId,
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
                  doc: awardElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: awardElement,
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
            body: awardElement,
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
