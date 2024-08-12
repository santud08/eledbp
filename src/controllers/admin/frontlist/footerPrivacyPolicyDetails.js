import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * footerPrivacyPolicyDetails
 * @param req
 * @param res
 */
export const footerPrivacyPolicyDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const pageType = reqBody.page_type ? reqBody.page_type : ""; // allowed values privacy-policy/terms-of-service/about-us
    const pageId = reqBody.page_id ? reqBody.page_id : "";
    const language = req.accept_language;

    // check for page id existance in custom pages table
    const getInformations = await model.cmsPage.findOne({
      attributes: [
        ["slug", "page_type"],
        ["id", "page_id"],
        ["title", "page_title"],
        ["body", "page_content"],
        "status",
        ["published_at", "date"],
      ],
      where: {
        id: pageId,
        slug: pageType,
        type: "default",
        site_language: language,
        status: { [Op.ne]: "deleted" },
      },
    });
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid page id or page type"));

    res.ok(getInformations);
  } catch (error) {
    next(error);
  }
};
