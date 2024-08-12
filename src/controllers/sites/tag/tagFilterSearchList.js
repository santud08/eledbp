import model from "../../../models/index.js";
import { Op, Sequelize, fn } from "sequelize";
import { StatusError } from "../../../config/index.js";

/**
 * tagFilterSearchList
 * @param req
 * @param res
 */
export const tagFilterSearchList = async (req, res, next) => {
  try {
    const mainCategoryId = req.query.category_id; //It will be main category id
    const subCategoryId = req.query.subcategory_id; //It will be sub category id
    const searchText = req.query.search_text ? req.query.search_text.trim() : ""; //It will be search_text (Optional)
    let getTagList = [];
    const language = req.accept_language;

    if (mainCategoryId) {
      const getParentCategory = await model.tagCategory.findOne({
        attributes: ["id", "slug_name"],
        where: { id: mainCategoryId, parent_id: 0, status: "active" },
      });

      if (!getParentCategory) throw StatusError.badRequest(res.__("Invalid parent category id"));
    }

    if (subCategoryId) {
      const getSubCategory = await model.tagCategory.findOne({
        attributes: ["id", "slug_name"],
        where: { id: subCategoryId, parent_id: { [Op.ne]: 0 }, status: "active" },
      });

      if (!getSubCategory) throw StatusError.badRequest(res.__("Invalid sub category id"));
    }

    const whereCondition =
      mainCategoryId && subCategoryId
        ? { tag_main_category_id: mainCategoryId, tag_category_id: subCategoryId, status: "active" }
        : mainCategoryId && !subCategoryId
        ? { tag_main_category_id: mainCategoryId, status: "active" }
        : !mainCategoryId && subCategoryId
        ? { tag_category_id: subCategoryId, status: "active" }
        : { status: "active" };
    // Get Tag List
    let isKorean = false;
    let sortOrderObj = [[Sequelize.literal("tag.id"), "ASC"]];
    if (language == "ko") {
      isKorean = true;
    }
    if (searchText) {
      const match = searchText.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g,
      );
      if (match) {
        isKorean = true;
      }
      sortOrderObj = [
        [Sequelize.literal("tag_name"), "ASC"],
        [Sequelize.literal("tag.id"), "ASC"],
      ];
    }

    const getTags = await model.tag.findAll({
      attributes: [
        "id",
        "type",
        [
          Sequelize.fn(
            "IFNULL",
            fn(
              "getTagTranslateName",
              Sequelize.fn("IFNULL", Sequelize.col("tag.id"), ""),
              isKorean ? "ko" : "en",
            ),
            fn(
              "getTagTranslateName",
              Sequelize.fn("IFNULL", Sequelize.col("tag.id"), ""),
              isKorean ? "en" : "ko",
            ),
          ),
          "tag_name",
        ],
      ],
      where: whereCondition,
      include: [
        {
          model: model.tagTranslation,
          attributes: ["tag_id", "display_name", "site_language"],
          left: true,
          where: {
            display_name: { [Op.like]: `${searchText}%` },
            status: "active",
          },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          required: true,
        },
      ],
      order: sortOrderObj,
      distinct: true,
    });

    if (getTags) {
      let list = [];
      for (const eachRow of getTags) {
        if (eachRow) {
          if (
            eachRow.tagTranslations &&
            eachRow.tagTranslations[0] &&
            eachRow.tagTranslations[0] != "undefined" &&
            eachRow.tagTranslations[0].display_name
          ) {
            if (eachRow.tagTranslations[0].display_name.trim() != "") {
              const record = {
                id:
                  eachRow.tagTranslations[0] && eachRow.tagTranslations[0].tag_id
                    ? eachRow.tagTranslations[0].tag_id
                    : "",
                title:
                  eachRow.tagTranslations[0] && eachRow.tagTranslations[0].display_name
                    ? eachRow.tagTranslations[0].display_name.trim()
                    : "",
              };

              list.push(record);
            }
          }
        }
      }
      getTagList = list;
    }
    res.ok({
      results: getTagList,
    });
  } catch (error) {
    next(error);
  }
};
