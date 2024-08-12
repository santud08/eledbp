import model from "../../models/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { searchClient, isSearchClient } from "../../config/index.js";
import { TABLES } from "../../utils/constants.js";

/**
 * addNewVideoDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewVideoDocument = async (id, indexName) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }

    const videoId = id;
    const indexValue = indexName;
    let videoElement = {};

    let condition = {
      id: videoId,
      status: "active",
      [Op.and]: Sequelize.literal(`
        CASE
          WHEN video_for = 'title' THEN titleOne.id IS NOT NULL
          WHEN video_for = 'people' THEN person.id IS NOT NULL
          ELSE video_for IS NOT NULL
        END
      `),
    };

    const attributes = [
      "id",
      [Sequelize.fn("IFNULL", Sequelize.col("url"), ""), "video_path"],
      ["name", "video_title"],
      [fn("getEditListName", col("video.title_id"), col("video_for"), "en"), "title_name_en"],
      [fn("getEditListName", col("video.title_id"), col("video_for"), "ko"), "title_name_ko"],
      [
        Sequelize.literal(
          `(CASE WHEN no_of_view = 0 THEN ele_no_of_view
              ELSE no_of_view END)`,
        ),
        "no_of_views",
      ],
      ["created_at", "registration_date"],
      "video_source",
      ["title_id", "item_id"],
      "video_for",
      "thumbnail",
      "video_duration",
    ];

    const includeQuery = [
      {
        model: model.title,
        as: "titleOne",
        attributes: [],
        where: { record_status: "active" },
        required: false,
        include: [
          {
            model: model.titleTranslation,
            attributes: [],
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.TITLE_TRANSLATION_TABLE} WHERE ${TABLES.TITLE_TRANSLATION_TABLE}.title_id = titleOne.id AND status='active' ORDER BY site_language ASC LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
        ],
      },
      {
        model: model.people,
        attributes: [],
        where: { status: "active" },
        required: false,
        include: [
          {
            model: model.peopleTranslation,
            attributes: [],
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.PEOPLE_TRANSLATION_TABLE} WHERE ${TABLES.PEOPLE_TRANSLATION_TABLE}.people_id = person.id AND status='active' ORDER BY site_language ASC LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
        ],
      },
    ];

    const videoData = await model.video.findOne({
      attributes: attributes,
      include: includeQuery,
      where: condition,
      subQuery: false,
    });

    if (videoData) {
      let nameEnglish = "";
      let descriptionEnglish = "";
      let nameKorean = "";
      let descriptionKorean = "";
      let registrationDate = "";
      let videoPath = "";
      let searchData = {};
      let videoResultData = {};
      let sortingFiledsData = {};

      videoElement.id = videoData.id ? videoData.id : id;
      if (videoData.dataValues.video_title) {
        descriptionEnglish = videoData.dataValues.title_name_en
          ? videoData.dataValues.title_name_en
          : null;
        nameEnglish = videoData.dataValues.video_title ? videoData.dataValues.video_title : null;
        nameKorean = videoData.dataValues.video_title ? videoData.dataValues.video_title : null;
        descriptionKorean = videoData.dataValues.title_name_ko
          ? videoData.dataValues.title_name_ko
          : null;

        searchData.name_en = nameEnglish ? nameEnglish : null;
        searchData.name_ko = nameKorean ? nameKorean : null;
      }

      if (videoData.dataValues.registration_date) {
        registrationDate = videoData.dataValues.registration_date;
      }

      if (videoData.dataValues.video_path) {
        videoPath = videoData.dataValues.video_path;
      }

      // -----------------------------Result data :
      videoResultData.en = {
        name: nameEnglish ? nameEnglish : nameKorean,
        title_name: descriptionEnglish ? descriptionEnglish : descriptionKorean,
      };
      videoResultData.ko = {
        name: nameKorean ? nameKorean : nameEnglish,
        title_name: descriptionKorean ? descriptionKorean : descriptionEnglish,
      };

      videoResultData.video_path = videoPath ? videoPath : null;
      videoResultData.video_thumb = videoData.dataValues.thumbnail
        ? videoData.dataValues.thumbnail
        : null;
      videoResultData.video_duration = videoData.dataValues.video_duration
        ? videoData.dataValues.video_duration
        : null;
      videoResultData.registration_date = registrationDate ? registrationDate : null;
      videoResultData.video_source = videoData.video_source ? videoData.video_source : null;
      videoResultData.video_for = videoData.video_for ? videoData.video_for : null;
      videoResultData.item_id = videoData.dataValues.item_id ? videoData.dataValues.item_id : null;

      // -----------------------------sorting fields
      sortingFiledsData.popularity = videoData.dataValues.no_of_views
        ? videoData.dataValues.no_of_views
        : null; // popularity logic function field
      sortingFiledsData.registration_date = videoResultData.registration_date;

      videoElement.search = searchData;
      videoElement.results = videoResultData;
      videoElement.sorting_fileds = sortingFiledsData;
    }

    if (Object.keys(videoElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: videoId,
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
                  doc: videoElement,
                },
              });

              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: videoElement,
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
            body: videoElement,
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
