import model from "../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { isSearchClient } from "../../config/index.js";
import { TABLES } from "../../utils/constants.js";
import { esService } from "../../services/index.js";

/**
 * addNewVideoDocumentByItemId
 * @param itemId // id of the new document to be added by title/people id
 * @param type // item type people/title
 */

export const addNewVideoDocumentByItemId = async (itemId, type) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    const indexName = "search-video";
    let condition = {
      title_id: itemId,
      status: "active",
      video_for: type,
    };

    const attributes = ["id"];
    let includeQuery = [];
    if (type == "people") {
      includeQuery = [
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
    }
    if (type == "title") {
      includeQuery = [
        {
          model: model.title,
          as: "titleOne",
          attributes: [],
          where: { record_status: "active" },
          required: true,
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
      ];
    }

    const videoData = await model.video.findAll({
      attributes: attributes,
      include: includeQuery,
      where: condition,
      subQuery: false,
    });
    let retResArr = [];
    let errorC = 0;
    let successC = 0;
    if (videoData && videoData.length > 0) {
      for (const value of videoData) {
        if (value.id) {
          const vr = await esService.addNewVideoDocument(value.id, indexName);
          retResArr.push(vr);
          if (vr.status == "success") {
            successC = successC + 1;
          } else {
            errorC = errorC + 1;
          }
        }
      }
      return {
        status: "success",
        message: errorC == 0 ? "document created successfully" : "document created with some error",
        success: successC,
        error: errorC,
        results: retResArr,
      };
    } else {
      return { status: "error", message: "Index Data not found" };
    }
  } catch (error) {
    console.log(error);
    return { status: "sys_error", message: error };
  }
};
