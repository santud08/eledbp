import model from "../../../models/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { searchClient } from "../../../config/index.js";
import { TABLES } from "../../../utils/constants.js";

/**
 * esVideoDocument
 * @param req
 * @param res
 */

export const esVideoDocument = async (req, res, next) => {
  try {
    let videoDataSet = [];
    let videoCount = 0;
    const offset = req.body.offset ? req.body.offset : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const indexName = !req.body.index_name ? "search-video" : req.body.index_name;

    let condition = {
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

    const videoData = await model.video.findAndCountAll({
      offset: parseInt(offset),
      limit: parseInt(limit),
      attributes: attributes,
      include: includeQuery,
      where: condition,
      subQuery: false,
    });

    const totalRecords = videoData.count ? videoData.count : 0;
    let getData = videoData.rows ? videoData.rows : [];

    if (getData.length > 0) {
      for (const value of getData) {
        let nameEnglish = "";
        let descriptionEnglish = "";
        let nameKorean = "";
        let descriptionKorean = "";
        let videoPath = "";
        let searchData = {};
        let registrationDate = "";
        let videoResultData = {};
        let sortingFiledsData = {};
        const videoElement = {
          id: value.id,
        };
        if (value.dataValues.video_title) {
          descriptionEnglish = value.dataValues.title_name_en
            ? value.dataValues.title_name_en
            : null;
          nameEnglish = value.dataValues.video_title ? value.dataValues.video_title : null;
          nameKorean = value.dataValues.video_title ? value.dataValues.video_title : null;
          descriptionKorean = value.dataValues.title_name_ko
            ? value.dataValues.title_name_ko
            : null;

          searchData.name_en = nameEnglish ? nameEnglish : null;
          searchData.name_ko = nameKorean ? nameKorean : null;
        }

        if (value.dataValues.registration_date) {
          registrationDate = value.dataValues.registration_date;
        }

        if (value.dataValues.video_path) {
          videoPath = value.dataValues.video_path;
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
        videoResultData.video_thumb = value.dataValues.thumbnail
          ? value.dataValues.thumbnail
          : null;
        videoResultData.video_duration = value.dataValues.video_duration
          ? value.dataValues.video_duration
          : null;
        videoResultData.registration_date = registrationDate ? registrationDate : null;
        videoResultData.video_source = value.video_source ? value.video_source : null;
        videoResultData.video_for = value.video_for ? value.video_for : null;
        videoResultData.item_id = value.dataValues.item_id ? value.dataValues.item_id : null;

        // -----------------------------sorting fields
        sortingFiledsData.popularity = value.dataValues.no_of_views
          ? value.dataValues.no_of_views
          : null; // popularity logic function field
        sortingFiledsData.registration_date = videoResultData.registration_date;

        videoElement.search = searchData;
        videoElement.results = videoResultData;
        videoElement.sorting_fileds = sortingFiledsData;
        videoDataSet.push(videoElement);
      }
    }

    if (videoDataSet.length > 0) {
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
                  registration_date: {
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
                      title_name: {
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
                      title_name: {
                        type: "text",
                        index: false,
                      },
                    },
                  },
                  video_path: {
                    type: "text",
                    index: false,
                  },
                  video_thumb: {
                    type: "text",
                    index: false,
                  },
                  video_duration: {
                    type: "text",
                    index: false,
                  },
                  video_source: {
                    type: "text",
                    index: false,
                  },
                  video_for: {
                    type: "text",
                    index: true,
                  },
                  registration_date: {
                    type: "date",
                    index: false,
                  },
                  item_id: {
                    type: "long",
                    index: true,
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

      const titleDataSet = videoDataSet;

      const operations = titleDataSet.flatMap((doc) => [{ index: { _index: indexName } }, doc]);

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
      videoCount = await searchClient.count({ index: indexName });
    }
    res.ok({
      message: res.__("success"),
      offset: offset,
      limit: limit,
      total_records: totalRecords,
      total_pages: totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0,
      search_result: videoCount,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
