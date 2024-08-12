import model from "../../models/index.js";
import { fn, col, Sequelize } from "sequelize";
import { searchClient, envs, isSearchClient } from "../../config/index.js";

/**
 * addNewPeopleDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewPeopleDocument = async (id, indexName) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const peopleId = id;
    const indexValue = indexName;
    let peopleElement = {};
    const peopleData = await model.people.findOne({
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
        id: peopleId,
      },
      subQuery: true,
    });

    if (peopleData) {
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

      peopleElement.id = peopleData.id;
      peopleElement.uuid = peopleData.uuid ? peopleData.uuid : null;
      peopleElement.type = "people";

      if (peopleData.peopleTranslations.length > 0) {
        for (const translationData of peopleData.peopleTranslations) {
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
        searchData.aka = peopleData.peopleTranslations[0].known_for
          ? peopleData.peopleTranslations[0].known_for
          : null;
      }
      if (peopleData.peopleImages.length > 0) {
        posterImage = peopleData.peopleImages[0].path ? peopleData.peopleImages[0].path : null;
      }
      if (peopleData.peopleKeywords.length > 0) {
        for (const keywordData of peopleData.peopleKeywords) {
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
      peopleResultData.birth_date = peopleData.birth_date ? peopleData.birth_date : null;
      peopleResultData.death_date = peopleData.death_date ? peopleData.death_date : null;

      // worklist:
      if (peopleData.creditables.length > 0) {
        for (const creditablesData of peopleData.creditables) {
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
      sortingFiledsData.popularity = peopleData.popularity_order
        ? peopleData.popularity_order
        : null; // popularity logic function field
      sortingFiledsData.birth_date = peopleResultData.birth_date;

      peopleElement.search = searchData;
      peopleElement.results = peopleResultData;
      peopleElement.sorting_fileds = sortingFiledsData;
    }
    if (Object.keys(peopleElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: peopleId,
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
                  doc: peopleElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: peopleElement,
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
            body: peopleElement,
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
