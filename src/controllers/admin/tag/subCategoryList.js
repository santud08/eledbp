import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Op, Sequelize } from "sequelize";

/**
 * subCategoryList
 * @param req
 * @param res
 */
export const subCategoryList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const categoryId = reqBody.category_id ? reqBody.category_id : "";
    const subCategoryName = reqBody.sub_category_name ? reqBody.sub_category_name : "";
    const language = req.accept_language;

    const getCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { id: categoryId, status: { [Op.ne]: "deleted" } },
    });
    if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));

    const conditions = { site_language: language, status: { [Op.ne]: "deleted" } };
    if (subCategoryName) conditions.category_name = { [Op.like]: `%${subCategoryName}%` };

    // Get sub category
    const getSubCategory = await model.tagCategory.findAll({
      attributes: [
        ["parent_id", "category_id"],
        [
          Sequelize.fn("IFNULL", Sequelize.col("tagCategoryTranslationOne.tag_category_id"), ""),
          "sub_category_id",
        ],
        [
          Sequelize.fn("IFNULL", Sequelize.col("tagCategoryTranslationOne.category_name"), ""),
          "category_name",
        ],
      ],
      where: { parent_id: categoryId, status: { [Op.ne]: "deleted" } },
      include: [
        {
          model: model.tagCategoryTranslation,
          as: "tagCategoryTranslationOne",
          left: true,
          attributes: [],
          where: conditions,
        },
      ],
    });

    res.ok({
      results: getSubCategory,
    });
  } catch (error) {
    next(error);
  }
};
