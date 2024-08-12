import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * addTag
 * @param req
 * @param res
 */
export const addTag = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const parentId = reqBody.parent_id ? reqBody.parent_id : "";
    const subCategoryId = reqBody.sub_category_id ? reqBody.sub_category_id : "";
    const tagNameEn = reqBody.tag_name_en ? reqBody.tag_name_en : "";
    const tagNameKo = reqBody.tag_name_ko ? reqBody.tag_name_ko : "";

    // check for parent id existance in tag category table
    const getCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name", "tag_catgeory_type"],
      where: { id: parentId, status: { [Op.ne]: "deleted" } },
    });
    if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));

    // check for sub category id existance in tag category table
    const getSubCategory = await model.tagCategory.findOne({
      attributes: ["id"],
      where: { id: subCategoryId, parent_id: parentId, status: { [Op.ne]: "deleted" } },
    });
    if (!getSubCategory) throw StatusError.badRequest(res.__("Invalid sub category id"));

    // check for tag name existance in tag table
    const isExistsTagName = await model.tag.findOne({
      attributes: ["id"],
      where: {
        tag_main_category_id: parentId,
        tag_category_id: subCategoryId,
        display_name: tagNameEn,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.tagTranslation,
          attributes: ["tag_id"],
          left: true,
          where: {
            status: { [Op.ne]: "deleted" },
          },
        },
      ],
    });

    if (isExistsTagName) throw StatusError.badRequest(res.__("Tag name already exist"));

    // tag table type Value
    const tagType =
      getCategory && getCategory.tag_catgeory_type == "predefine" && getCategory.slug_name
        ? getCategory.slug_name
        : "custom";
    // Add tag
    const dataTag = {
      name: tagNameEn,
      display_name: tagNameEn,
      type: tagType,
      tag_category_id: subCategoryId,
      tag_main_category_id: parentId,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    const tagId = await model.tag.create(dataTag);
    if (tagId && tagId.id) {
      const bulkCreate = [];
      // Add tag en translation
      if (tagNameEn) {
        bulkCreate.push({
          tag_id: tagId.id,
          site_language: "en",
          display_name: tagNameEn,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (tagNameKo) {
        bulkCreate.push({
          tag_id: tagId.id,
          site_language: "ko",
          display_name: tagNameKo,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }

      if (bulkCreate.length > 0) await model.tagTranslation.bulkCreate(bulkCreate);
      //add data in search db
      esService.esSchedularAddUpdate(tagId.id, "tag", "add");
    }

    res.ok({
      message: res.__("Tag added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
