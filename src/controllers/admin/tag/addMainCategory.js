import model from "../../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * addMainCategory
 * @param req
 * @param res
 */
export const addMainCategory = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const categoryNameEn = reqBody.category_name_en ? reqBody.category_name_en : "";
    const categoryNameKo = reqBody.category_name_ko ? reqBody.category_name_ko : "";

    const isExistsMainCategoryName = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { parent_id: 0, status: { [Op.ne]: "deleted" } },
      include: [
        {
          model: model.tagCategoryTranslation,
          left: true,
          attributes: ["category_name", "tag_category_id"],
          where: {
            category_name: categoryNameEn,
            status: { [Op.ne]: "deleted" },
          },
        },
      ],
    });

    const isExistsMainCategoryNameKo = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { parent_id: 0, status: { [Op.ne]: "deleted" } },
      include: [
        {
          model: model.tagCategoryTranslation,
          left: true,
          attributes: ["category_name", "tag_category_id"],
          where: {
            category_name: categoryNameKo,
            status: { [Op.ne]: "deleted" },
          },
        },
      ],
    });

    if (isExistsMainCategoryName) {
      throw StatusError.badRequest(res.__("English field main category already exist"));
    }
    if (isExistsMainCategoryNameKo) {
      throw StatusError.badRequest(res.__("Korean field main category already exist"));
    }

    const whl = true;
    let slugName = "";
    let rslug = categoryNameEn;
    let regenarate = false;
    while (whl) {
      const generatedSlug = await generalHelper.generateSlugName(rslug, regenarate);
      // check for slug name existance in tag category table
      const isExists = await model.tagCategory.findOne({
        where: { status: { [Op.ne]: "deleted" }, slug_name: generatedSlug },
        attributes: ["id", "slug_name"],
      });
      if (!isExists) {
        regenarate = false;
        slugName = generatedSlug;
        break;
      } else {
        regenarate = true;
        rslug = generatedSlug;
      }
    }

    // Add main category
    const dataCategory = {
      parent_id: 0,
      slug_name: slugName,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    const mainCategoryId = await model.tagCategory.create(dataCategory);
    if (mainCategoryId && mainCategoryId.id) {
      // Add main category en translation
      const bulkCreate = [];
      if (categoryNameEn) {
        bulkCreate.push({
          tag_category_id: mainCategoryId.id,
          site_language: "en",
          category_name: categoryNameEn,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (categoryNameKo) {
        bulkCreate.push({
          tag_category_id: mainCategoryId.id,
          site_language: "ko",
          category_name: categoryNameKo,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (bulkCreate.length > 0) await model.tagCategoryTranslation.bulkCreate(bulkCreate);
    }

    res.ok({
      message: res.__("Main category added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
