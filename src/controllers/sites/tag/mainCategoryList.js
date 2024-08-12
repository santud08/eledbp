import model from "../../../models/index.js";
import { Op } from "sequelize";

/**
 * mainCategoryList
 * @param req
 * @param res
 */
export const mainCategoryList = async (req, res, next) => {
  try {
    let getParentCategoryList = [];
    const language = req.query.language;
    const type = req.query.type;

    const includeWhere =
      type == "all"
        ? { parent_id: 0, status: "active" }
        : { parent_id: 0, slug_name: { [Op.ne]: "genre" }, status: "active" };
    // Get parent category
    const getParentCategory = await model.tagCategory.findAll({
      attributes: ["id", "slug_name"],
      where: includeWhere,
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

    if (getParentCategory) {
      let list = [];
      for (const eachRow of getParentCategory) {
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
        getParentCategoryList = list;
      }
    }
    res.ok({
      results: getParentCategoryList,
    });
  } catch (error) {
    next(error);
  }
};
