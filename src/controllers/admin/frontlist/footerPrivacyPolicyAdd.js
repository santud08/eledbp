import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";

/**
 * footerPrivacyPolicyAdd
 * @param req
 * @param res
 */
export const footerPrivacyPolicyAdd = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const pageType = reqBody.page_type ? reqBody.page_type : ""; // allowed values privacy-policy/terms-of-service/about-us
    const pageTitle = reqBody.title ? reqBody.title : "";
    const publishedDate = reqBody.date ? reqBody.date : "";
    const pageContent = reqBody.content ? reqBody.content : "";
    const language = reqBody.language ? reqBody.language : req.accept_language;

    // check duplicate page title exists
    const isExists = await model.cmsPage.findOne({
      attributes: ["id", "title", "slug", "type"],
      where: {
        title: pageTitle,
        slug: pageType,
        type: "default",
        status: { [Op.ne]: "deleted" },
        site_language: language,
      },
    });
    if (isExists) throw StatusError.badRequest(res.__("This page title is already exist"));

    const dataObj = {
      title: pageTitle,
      body: pageContent,
      slug: pageType,
      site_language: language,
      user_id: userId,
      published_at: await customDateTimeHelper.changeDateFormat(
        publishedDate,
        "YYYY-MM-DD HH:mm:ss",
      ),
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    await model.cmsPage.create(dataObj);
    res.ok({
      message: res.__("Page details added successfully."),
    });
  } catch (error) {
    next(error);
  }
};
