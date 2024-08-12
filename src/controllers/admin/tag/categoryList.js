import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";

/**
 * categoryList
 * @param req
 * @param res
 */
export const categoryList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const categoryName = reqBody.category_name ? reqBody.category_name : "";
    const language = req.accept_language;

    const conditions = { site_language: language, status: { [Op.ne]: "deleted" } };
    if (categoryName) conditions.category_name = { [Op.like]: `%${categoryName}%` };

    // Get parent category
    const getParentCategory = await model.tagCategory.findAll({
      attributes: [
        ["id", "category_id"],
        [
          Sequelize.fn("IFNULL", Sequelize.col("tagCategoryTranslationOne.category_name"), ""),
          "category_name",
        ],
      ],
      where: { parent_id: 0, status: { [Op.ne]: "deleted" } },
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
      results: getParentCategory,
    });
  } catch (error) {
    next(error);
  }
};
