import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * deleteTag
 * @param req
 * @param res
 */
export const deleteTag = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const tagId = reqBody.tag_id ? reqBody.tag_id : "";

    // check for tag id existance in tag table
    const getTagId = await model.tag.findOne({
      attributes: ["id"],
      where: { id: tagId, status: { [Op.ne]: "deleted" } },
    });
    if (!getTagId) throw StatusError.badRequest(res.__("Invalid tag id"));

    // deleted tag status
    const deleteTagData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.tag.update(deleteTagData, {
      where: { id: tagId },
    });
    // deleted tag translation status
    const deleteTagTranslationData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.tagTranslation.update(deleteTagTranslationData, {
      where: { tag_id: tagId },
    });

    //delete data from search db
    esService.esScheduleDelete(tagId, "tag");

    res.ok({
      message: res.__("Tag deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
