import model from "../../../models/index.js";
import { Op } from "sequelize";
import { StatusError } from "../../../config/index.js";

/**
 * tagSearchList
 * @param req
 * @param res
 */
export const tagSearchList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const mainCategoryId = reqBody.main_catid; //It will be main category id
    const subCategoryId = reqBody.sub_catid; //It will be sub category id
    const searchText = req.query.search_text; //It will be search_text (Optional)
    let getTagList = [];
    const language = req.query.language;

    const getParentCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { id: mainCategoryId, parent_id: 0, status: "active" },
    });

    if (!getParentCategory) throw StatusError.badRequest(res.__("Invalid parent category id"));

    const getSubCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { id: subCategoryId, parent_id: { [Op.ne]: 0 }, status: "active" },
    });

    if (!getSubCategory) throw StatusError.badRequest(res.__("Invalid sub category id"));

    // Get Tag List
    const getTags = await model.tag.findAll({
      attributes: ["id", "type"],
      where: {
        tag_main_category_id: mainCategoryId,
        tag_category_id: subCategoryId,
        status: "active",
      },
      include: [
        {
          model: model.tagTranslation,
          attributes: ["tag_id", "display_name", "site_language"],
          left: true,
          where: {
            display_name: { [Op.like]: `%${searchText}%` },
            status: "active",
          },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          required: true,
        },
      ],
    });

    if (getTags) {
      let list = [];
      for (const eachRow of getTags) {
        if (eachRow) {
          const record = {
            id:
              eachRow.tagTranslations[0] && eachRow.tagTranslations[0].tag_id
                ? eachRow.tagTranslations[0].tag_id
                : "",
            title:
              eachRow.tagTranslations[0] && eachRow.tagTranslations[0].display_name
                ? eachRow.tagTranslations[0].display_name
                : "",
          };

          list.push(record);
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
