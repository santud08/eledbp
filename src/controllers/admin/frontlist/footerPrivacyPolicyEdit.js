import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * footerPrivacyPolicyEdit
 * @param req
 * @param res
 */
export const footerPrivacyPolicyEdit = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const pageType = reqBody.page_type ? reqBody.page_type : ""; // allowed values privacy-policy/terms-of-service/about-us
    const pageId = reqBody.page_id ? reqBody.page_id : "";
    const pageContent = reqBody.content ? reqBody.content : "";
    const language = reqBody.language ? reqBody.language : req.accept_language;
    const pageTitle = reqBody.title ? reqBody.title : "";
    const publishedDate = reqBody.date ? reqBody.date : "";

    // check for page id existance in custom pages table
    const isExists = await model.cmsPage.findOne({
      attributes: ["id", "title", "slug", "type"],
      where: {
        id: pageId,
        slug: pageType,
        type: "default",
        status: { [Op.ne]: "deleted" },
        site_language: language,
      },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid page id or page type"));

    // check duplicate page title exists
    const isExistsTitle = await model.cmsPage.findOne({
      attributes: ["id", "title", "slug", "type"],
      where: {
        title: pageTitle,
        slug: pageType,
        type: "default",
        id: { [Op.ne]: pageId },
        status: { [Op.ne]: "deleted" },
        site_language: language,
      },
    });
    if (isExistsTitle) throw StatusError.badRequest(res.__("This page title is already exist"));

    const updateData = {
      title: pageTitle,
      body: pageContent,
      published_at: await customDateTimeHelper.changeDateFormat(
        publishedDate,
        "YYYY-MM-DD HH:mm:ss",
      ),
      updated_by: userId,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    await model.cmsPage.update(updateData, {
      where: { id: pageId },
    });
    res.ok({
      message: res.__("Content updated successfully."),
    });
  } catch (error) {
    next(error);
  }
};
