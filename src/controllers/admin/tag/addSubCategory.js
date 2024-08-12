import model from "../../../models/index.js";
import { generalHelper, customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * addSubCategory
 * @param req
 * @param res
 */
export const addSubCategory = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const parentId = reqBody.parent_id ? reqBody.parent_id : "";
    const subCategoryNameEn = reqBody.sub_category_name_en ? reqBody.sub_category_name_en : "";
    const subCategoryNameKo = reqBody.sub_category_name_ko ? reqBody.sub_category_name_ko : "";

    if (!parentId) throw StatusError.badRequest(res.__("Invalid category id"));

    // check for parent id existance in tag category table
    const getCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { id: parentId, status: { [Op.ne]: "deleted" } },
    });

    if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));

    // check for sub category name existance in tag category translation table
    const isExistsSubCategoryName = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { parent_id: parentId, status: { [Op.ne]: "deleted" } },
      include: [
        {
          model: model.tagCategoryTranslation,
          left: true,
          attributes: ["category_name", "tag_category_id"],
          where: {
            [Op.or]: [{ category_name: subCategoryNameEn }, { category_name: subCategoryNameKo }],
            status: { [Op.ne]: "deleted" },
          },
        },
      ],
    });
    if (isExistsSubCategoryName) throw StatusError.badRequest(res.__("Sub category already exist"));

    const whl = true;
    let slugName = "";
    let rslug = subCategoryNameEn;
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

    // Add sub category
    const dataSubCategory = {
      parent_id: parentId,
      slug_name: slugName,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    const subCategoryId = await model.tagCategory.create(dataSubCategory);
    if (subCategoryId && subCategoryId.id) {
      const bulkCreate = [];
      // Add sub category en translation
      if (subCategoryNameEn) {
        bulkCreate.push({
          tag_category_id: subCategoryId.id,
          site_language: "en",
          category_name: subCategoryNameEn,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (subCategoryNameKo) {
        bulkCreate.push({
          tag_category_id: subCategoryId.id,
          site_language: "ko",
          category_name: subCategoryNameKo,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (bulkCreate.length > 0) await model.tagCategoryTranslation.bulkCreate(bulkCreate);
    }

    res.ok({
      message: res.__("Sub category added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
