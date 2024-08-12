import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * tagDetails
 * @param req
 * @param res
 */
export const tagDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const tagId = reqBody.tag_id ? reqBody.tag_id : "";
    const language = req.accept_language;

    // check for tag id existance in tag table
    const getTagId = await model.tag.findOne({
      attributes: ["id"],
      include: [
        {
          model: model.tagTranslation,
          attributes: ["tag_id", "display_name", "site_language"],
          left: true,
          where: {
            status: { [Op.ne]: "deleted" },
          },
          required: true,
        },
        {
          model: model.tagCategory,
          as: "tagCategoryOne",
          attributes: ["id", "parent_id", "slug_name"],
          left: true,
          where: {
            status: { [Op.ne]: "deleted" },
            parent_id: 0,
          },
          include: [
            {
              model: model.tagCategoryTranslation,
              attributes: ["id", "category_name", "tag_category_id"],
              left: true,
              where: {
                status: { [Op.ne]: "deleted" },
                site_language: language,
              },
            },
          ],
        },
        {
          model: model.tagCategory,
          as: "subCategory",
          attributes: ["id", "parent_id", "slug_name"],
          left: true,
          where: {
            status: { [Op.ne]: "deleted" },
            parent_id: { [Op.ne]: 0 },
          },
          include: [
            {
              model: model.tagCategoryTranslation,
              attributes: ["id", "category_name", "tag_category_id"],
              left: true,
              where: {
                status: { [Op.ne]: "deleted" },

                site_language: language,
              },
            },
          ],
        },
      ],
      where: { id: tagId, status: { [Op.ne]: "deleted" } },
    });
    if (!getTagId) throw StatusError.badRequest(res.__("Invalid tag id"));

    let enData = {};
    let koData = {};
    let category = {};
    if (getTagId) {
      if (getTagId.tagTranslations && getTagId.tagTranslations.length > 0) {
        for (const data of getTagId.tagTranslations) {
          if (data.dataValues.site_language == "en") {
            enData = {
              tag_name_en: data.dataValues.display_name,
            };
          }
          if (data.dataValues.site_language == "ko") {
            koData = {
              tag_name_ko: data.dataValues.display_name,
            };
          }
        }
      }
      category = {
        category_id:
          getTagId.tagCategoryOne && getTagId.tagCategoryOne.id ? getTagId.tagCategoryOne.id : "",
        category_name:
          getTagId.tagCategoryOne &&
          getTagId.tagCategoryOne.tagCategoryTranslations &&
          getTagId.tagCategoryOne.tagCategoryTranslations.length > 0
            ? getTagId.tagCategoryOne.tagCategoryTranslations[0].category_name
            : "",
        sub_category_id:
          getTagId.subCategory && getTagId.subCategory.id ? getTagId.subCategory.id : "",
        sub_category_name:
          getTagId.subCategory &&
          getTagId.subCategory.tagCategoryTranslations &&
          getTagId.subCategory.tagCategoryTranslations.length > 0
            ? getTagId.subCategory.tagCategoryTranslations[0].category_name
            : "",
      };
    }

    res.ok({
      tag_id: getTagId ? getTagId.id : "",
      ...enData,
      ...koData,
      ...category,
    });
  } catch (error) {
    next(error);
  }
};
