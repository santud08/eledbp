import model from "../../models/index.js";
import { Op, fn, col } from "sequelize";
import { searchClient, envs, isSearchClient } from "../../config/index.js";

/**
 * addNewTvDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewTvDocument = async (id, indexName) => {
  try {
    const tvId = id;
    const indexValue = indexName;
    let tvElement = {};
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const tvData = await model.title.findOne({
      attributes: ["id", "uuid", "type", "release_date", "calculate_popularity"],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "aka", "description", "site_language", "status"],
          left: true,
          required: true,
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
          model: model.season,
          attributes: ["id", "status", "release_date"],
          left: true,
          include: [
            {
              model: model.seasonTranslation,
              attributes: ["season_id", "aka", "site_language"],
              left: true,
              where: { status: "active" },
              required: false,
            },
          ],
          where: {
            status: "active",
          },
          required: false,
          separate: true,
          order: [["release_date", "DESC"]],
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
        type: "tv",
        record_status: "active",
        id: tvId,
      },
      subQuery: true,
    });

    if (tvData) {
      let nameEnglish = "";
      let descriptionEnglish = "";
      let nameKorean = "";
      let descriptionKorean = "";
      let reReleaseDate = "";
      let posterImage = "";
      let keywordArry = [];
      let searchData = {};
      let tvResultData = {};
      let sortingFiledsData = {};
      tvElement.id = tvData.id;
      tvElement.uuid = tvData.uuid ? tvData.uuid : null;
      tvElement.type = tvData.type ? tvData.type : "tv";
      if (tvData.titleTranslations.length > 0) {
        for (const translationData of tvData.titleTranslations) {
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
      }
      let seasonAka = "";
      if (tvData.seasons.length > 0) {
        let list = [];
        reReleaseDate = tvData.seasons[0].release_date ? tvData.seasons[0].release_date : null;
        for (const seasonValue of tvData.seasons) {
          if (seasonValue) {
            const getAka =
              seasonValue.seasonTranslations[0] && seasonValue.seasonTranslations[0].aka
                ? seasonValue.seasonTranslations[0].aka
                : "";
            list.push(getAka);
          }
        }
        seasonAka = list.join(", ");
      }

      searchData.aka = seasonAka ? seasonAka : null;

      if (tvData.titleImages.length > 0) {
        posterImage = tvData.titleImages[0].path ? tvData.titleImages[0].path : null;
      }

      if (tvData.titleKeywords.length > 0) {
        for (const keywordData of tvData.titleKeywords) {
          if (keywordData.keyword) {
            keywordArry.push(keywordData.keyword);
          }
        }
      }
      searchData.keywords = keywordArry;

      // -----------------------------Result data :
      tvResultData.en = {
        name: nameEnglish ? nameEnglish : nameKorean,
        description: descriptionEnglish ? descriptionEnglish : descriptionKorean,
      };
      tvResultData.ko = {
        name: nameKorean ? nameKorean : nameEnglish,
        description: descriptionKorean ? descriptionKorean : descriptionEnglish,
      };

      tvResultData.poster_image = posterImage ? posterImage : null;
      tvResultData.release_date = reReleaseDate
        ? reReleaseDate
        : tvData.release_date
        ? tvData.release_date
        : null;

      // -----------------------------sorting fields
      sortingFiledsData.popularity = tvData.calculate_popularity
        ? tvData.calculate_popularity
        : null; // popularity logic function field
      sortingFiledsData.release_date = tvResultData.release_date;

      tvElement.search = searchData;
      tvElement.results = tvResultData;
      tvElement.sorting_fileds = sortingFiledsData;
    }

    if (Object.keys(tvElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: tvId,
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
                  doc: tvElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: tvElement,
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
            body: tvElement,
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
