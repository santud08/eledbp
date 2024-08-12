import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * subCategoryList
 * @param req
 * @param res
 */
export const subCategoryList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const parentId = reqBody.id; //It will be parent category id
    let getSubCategoryList = [];
    const language = req.query.language;

    const getCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { id: parentId, status: "active" },
    });

    if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));

    // Get sub category
    const getSubCategory = await model.tagCategory.findAll({
      attributes: ["id", "slug_name"],
      where: { parent_id: parentId, status: "active" },
      include: [
        {
          model: model.tagCategoryTranslation,
          left: true,
          attributes: ["category_name", "tag_category_id", "site_language"],
          where: { status: "active" },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
    });

    if (getSubCategory) {
      let list = [];
      for (const eachRow of getSubCategory) {
        if (eachRow) {
          const parentId = eachRow.id ? eachRow.id : "";
          const categoryName =
            eachRow.tagCategoryTranslations[0] && eachRow.tagCategoryTranslations[0].category_name
              ? eachRow.tagCategoryTranslations[0].category_name
              : "";
          const record = {
            id: parentId,
            category_name: categoryName,
          };

          list.push(record);
        }
        getSubCategoryList = list;
      }
    }
    res.ok({
      results: getSubCategoryList,
    });
  } catch (error) {
    next(error);
  }
};
