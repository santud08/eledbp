import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * footerPrivacyPolicyDelete
 * @param req
 * @param res
 */
export const footerPrivacyPolicyDelete = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const userId = req.userDetails.userId;
    const pageType = reqBody.page_type ? reqBody.page_type : ""; // allowed values privacy-policy/terms-of-service/about-us
    const pageId = reqBody.page_id ? reqBody.page_id : "";
    const language = req.accept_language;

    // check for page id existance in custom pages table
    const getInformations = await model.cmsPage.findOne({
      attributes: ["id", "slug", "type", "status"],
      where: {
        id: pageId,
        slug: pageType,
        type: "default",
        site_language: language,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid page id or page type"));

    // Delete page status
    const deleteData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.cmsPage.update(deleteData, {
      where: { id: pageId },
    });

    res.ok({
      message: res.__("Page deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
