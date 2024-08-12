import model from "../../models/index.js";
import { Op, fn, col } from "sequelize";
import { searchClient, envs, isSearchClient } from "../../config/index.js";

/**
 * addNewWebtoonsDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewWebtoonsDocument = async (id, indexName) => {
  try {
    const webtoonsId = id;
    const indexValue = indexName;
    let webtoonsElement = {};
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const webtoonsData = await model.title.findOne({
      attributes: ["id", "uuid", "type", "release_date", "calculate_popularity", "title_status"],
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
        {
          model: model.weeklyTelecast,
          attributes: ["title_id", "telecast_day", "status"],
          left: true,
          required: false,
          where: { status: "active" },
        },
      ],
      where: {
        type: "webtoons",
        record_status: "active",
        id: webtoonsId,
      },
      subQuery: true,
    });

    if (webtoonsData) {
      let nameEnglish = "";
      let descriptionEnglish = "";
      let nameKorean = "";
      let descriptionKorean = "";
      let reReleaseDate = "";
      let posterImage = "";
      let keywordArry = [];
      let searchData = {};
      let webtoonsResultData = {};
      let sortingFiledsData = {};
      webtoonsElement.id = webtoonsData.id;
      webtoonsElement.uuid = webtoonsData.uuid ? webtoonsData.uuid : null;
      webtoonsElement.type = webtoonsData.type ? webtoonsData.type : "webtoons";
      if (webtoonsData.titleTranslations.length > 0) {
        for (const translationData of webtoonsData.titleTranslations) {
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
      let weeklyTelecastData = [];
      if (webtoonsData.weeklyTelecasts.length > 0) {
        for (const weeklyTelecast of webtoonsData.weeklyTelecasts) {
          if (weeklyTelecast && weeklyTelecast.telecast_day) {
            weeklyTelecastData.push(weeklyTelecast.telecast_day);
          }
        }
      }
      let seasonAka = "";
      if (webtoonsData.seasons.length > 0) {
        let list = [];
        reReleaseDate = webtoonsData.seasons[0].release_date
          ? webtoonsData.seasons[0].release_date
          : null;
        for (const seasonValue of webtoonsData.seasons) {
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

      if (webtoonsData.titleImages.length > 0) {
        posterImage = webtoonsData.titleImages[0].path ? webtoonsData.titleImages[0].path : null;
      }

      if (webtoonsData.titleKeywords.length > 0) {
        for (const keywordData of webtoonsData.titleKeywords) {
          if (keywordData.keyword) {
            keywordArry.push(keywordData.keyword);
          }
        }
      }
      searchData.keywords = keywordArry;

      // -----------------------------Result data :
      webtoonsResultData.en = {
        name: nameEnglish ? nameEnglish : nameKorean,
        description: descriptionEnglish ? descriptionEnglish : descriptionKorean,
      };
      webtoonsResultData.ko = {
        name: nameKorean ? nameKorean : nameEnglish,
        description: descriptionKorean ? descriptionKorean : descriptionEnglish,
      };

      webtoonsResultData.poster_image = posterImage ? posterImage : null;
      webtoonsResultData.release_date = reReleaseDate
        ? reReleaseDate
        : webtoonsData.release_date
        ? webtoonsData.release_date
        : null;
      webtoonsResultData.title_status = webtoonsData.title_status
        ? webtoonsData.title_status
        : null;

      webtoonsResultData.weekly_telecast =
        weeklyTelecastData && weeklyTelecastData.length > 0 ? weeklyTelecastData.toString() : null;

      // -----------------------------sorting fields
      sortingFiledsData.popularity = webtoonsData.calculate_popularity
        ? webtoonsData.calculate_popularity
        : null; // popularity logic function field
      sortingFiledsData.release_date = webtoonsResultData.release_date;

      webtoonsElement.search = searchData;
      webtoonsElement.results = webtoonsResultData;
      webtoonsElement.sorting_fileds = sortingFiledsData;
    }

    if (Object.keys(webtoonsElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: webtoonsId,
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
                  doc: webtoonsElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: webtoonsElement,
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
            body: webtoonsElement,
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
