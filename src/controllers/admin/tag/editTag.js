import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * editTag
 * @param req
 * @param res
 */
export const editTag = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const parentId = reqBody.parent_id ? reqBody.parent_id : "";
    const subCategoryId = reqBody.sub_category_id ? reqBody.sub_category_id : "";
    const tagId = reqBody.tag_id ? reqBody.tag_id : "";
    const tagNameEn = reqBody.tag_name_en ? reqBody.tag_name_en : "";
    const tagNameKo = reqBody.tag_name_ko ? reqBody.tag_name_ko : "";

    // check for parent id existance in tag category table
    const getCategory = await model.tagCategory.findOne({
      attributes: ["id"],
      where: { id: parentId, status: { [Op.ne]: "deleted" } },
    });
    if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));
    // check for sub category id existance in tag category table
    const getSubCategory = await model.tagCategory.findOne({
      attributes: ["id"],
      where: { id: subCategoryId, parent_id: parentId, status: { [Op.ne]: "deleted" } },
    });
    if (!getSubCategory) throw StatusError.badRequest(res.__("Invalid sub category id"));

    // check for tag id existance in tag table
    const getTagId = await model.tag.findOne({
      attributes: ["id"],
      where: { id: tagId, status: { [Op.ne]: "deleted" } },
    });
    if (!getTagId) throw StatusError.badRequest(res.__("Invalid tag id"));

    // edit tag name

    if (tagNameEn) {
      // update tag table
      const dataTagName = {
        name: tagNameEn,
        display_name: tagNameEn,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.tag.update(dataTagName, {
        where: {
          tag_main_category_id: parentId,
          tag_category_id: subCategoryId,
          status: { [Op.ne]: "deleted" },
        },
      });
      // update tag translation table
      const dataTagTranslation = {
        display_name: tagNameEn,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.tagTranslation.update(dataTagTranslation, {
        where: {
          tag_id: tagId,
          site_language: "en",
          status: { [Op.ne]: "deleted" },
        },
      });
    }
    if (tagNameKo) {
      // update tag translation table
      const dataTagTranslation = {
        display_name: tagNameKo,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.tagTranslation.update(dataTagTranslation, {
        where: {
          tag_id: tagId,
          site_language: "ko",
          status: { [Op.ne]: "deleted" },
        },
      });
    }
    //
    //add data in search db
    esService.esSchedularAddUpdate(tagId, "tag", "edit");

    res.ok({
      message: res.__("Tag updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
