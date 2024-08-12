import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Op } from "sequelize";

/**
 * footerPrivacyPolicyList
 * @param req
 * @param res
 */
export const footerPrivacyPolicyList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const pageType = reqBody.page_type ? reqBody.page_type : ""; // allowed values privacy-policy/terms-of-service/about-us
    const language = req.accept_language;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "published_at",
      sortOrder: "desc",
    };
    const attributes = ["id", "title", "status", "published_at"];
    const includeQuery = [];
    const condition = {
      slug: pageType,
      type: "default",
      status: { [Op.ne]: "deleted" },
      site_language: language,
    };
    const getCmsPageList = await paginationService.pagination(
      searchParams,
      model.cmsPage,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getCmsPageList.count,
      page_type: pageType,
      total_pages: getCmsPageList.count > 0 ? Math.ceil(getCmsPageList.count / limit) : 0,
      result: getCmsPageList.rows,
    });
  } catch (error) {
    next(error);
  }
};
