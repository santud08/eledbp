import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Op, Sequelize } from "sequelize";

/**
 * agencyList
 * @param req
 * @param res
 */
export const agencyList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const agencyId = reqBody.agency_id ? reqBody.agency_id : ""; // agency code A0001
    const agencyName = reqBody.agency_name ? reqBody.agency_name.trim() : "";
    const language = req.accept_language;
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    if (sortOrder && sortBy == "agency_id") {
      searchParams.sortOrderObj = [[Sequelize.literal("agency_id"), sortOrder]];
    } else if (sortOrder && sortBy == "agency_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("agency_name"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[sortBy, sortOrder]];
    }

    const attributes = [
      "id",
      ["agency_code", "agency_id"],
      [Sequelize.fn("IFNULL", Sequelize.col("agencyTranslationOne.name"), ""), "agency_name"],
      [Sequelize.fn("IFNULL", Sequelize.col("agencyTranslationOne.address"), ""), "agency_address"],
      ["phone_number", "agency_tel"],
      ["site_link", "site_url"],
      "instagram_link",
      "facebook_link",
      "twitter_link",
      "youtube_link",
    ];

    const includeQuery = [
      {
        model: model.agencyTranslation,
        as: "agencyTranslationOne",
        attributes: [],
        left: true,
        where: {
          name: { [Op.like]: `%${agencyName}%` },
          status: { [Op.ne]: "deleted" },
          site_language: language,
        },
        required: true,
      },
    ];
    const condition = {
      status: { [Op.ne]: "deleted" },
      [Op.or]: [{ agency_code: { [Op.like]: `%${agencyId}` } }],
    };

    const getAgencyList = await paginationService.pagination(
      searchParams,
      model.agency,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getAgencyList.count,
      total_pages: getAgencyList.count > 0 ? Math.ceil(getAgencyList.count / limit) : 0,
      results: getAgencyList.rows,
    });
  } catch (error) {
    next(error);
  }
};
