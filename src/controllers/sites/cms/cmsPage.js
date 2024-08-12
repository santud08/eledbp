import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * User can cms with details
 * @param req
 * @param res
 * @param next
 */
export const cms = async (req, res, next) => {
  try {
    const pages = req.params.page;
    let language = req.accept_language;
    let getpage = await model.cmsPage.findOne({
      where: {
        slug: pages,
        status: "active",
        site_language: language,
      },
      attributes: ["id", "title", "body"],
    });

    if (!getpage) {
      language = await generalHelper.swipeLanguage(language);
      getpage = await model.cmsPage.findOne({
        where: { slug: pages, status: "active", site_language: language },
        attributes: ["id", "title", "body"],
      });
    }
    if (getpage) {
      res.ok({
        title: getpage.title ? getpage.title : "",
        content: getpage.body ? getpage.body : "",
      });
    } else {
      throw StatusError.notFound(res.__("Page not found"));
    }
  } catch (error) {
    next(error);
  }
};
