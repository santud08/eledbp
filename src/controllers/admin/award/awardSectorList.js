import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { StatusError } from "../../../config/index.js";
//import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { paginationService } from "../../../services/index.js";

/**
 * awardSectorList
 * @param req
 * @param res
 */
export const awardSectorList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";

    //const defautlPageNo = 1;
    //const page = reqBody.page ? reqBody.page : defautlPageNo;
    //const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    //const sortOrder = reqBody.sort_order ? reqBody.sort_order : "desc";
    //const sortOrder = reqBody.sort_order ? reqBody.sort_order : "asc";
    //const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";
    //const sortBy = reqBody.sort_by ? reqBody.sort_by : "list_order";

    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const searchParams = {
      //page: page,
      //limit: limit,
      sortBy: "list_order",
      sortOrder: "asc",
    };

    // if (sortOrder && sortBy == "division_name_en") {
    //   searchParams.sortOrderObj = [[Sequelize.literal("division_name_en"), sortOrder]];
    // } else if (sortOrder && sortBy == "division_name_ko") {
    //   searchParams.sortOrderObj = [[Sequelize.literal("division_name_ko"), sortOrder]];
    // } else if (sortOrder && sortBy == "status") {
    //   searchParams.sortOrderObj = [[Sequelize.literal("status"), sortOrder]];
    // } else {
    //   searchParams.sortOrderObj = [[Sequelize.literal("id"), sortOrder]];
    // }

    const modelName = model.awardSectors;
    const attributes = [
      "id",
      "award_id",
      [
        Sequelize.fn("IFNULL", Sequelize.col("awardSectorTranslationsOne.division_name"), ""),
        "division_name_en",
      ],
      [
        Sequelize.fn("IFNULL", Sequelize.col("awardSectorTranslationsOnel.division_name"), ""),
        "division_name_ko",
      ],
      "status",
    ];
    const includeQuery = [
      {
        model: model.awardSectorTranslations,
        as: "awardSectorTranslationsOne",
        attributes: [],
        left: true,
        where: { status: "active", site_language: "en" },
        required: false,
      },
      {
        model: model.awardSectorTranslations,
        as: "awardSectorTranslationsOnel",
        attributes: [],
        left: true,
        where: { status: "active", site_language: "ko" },
        required: false,
      },
    ];
    const condition = {
      status: { [Op.ne]: "deleted" },
      award_id: awardId,
    };
    const awardSectorList = await paginationService.pagination(
      searchParams,
      modelName,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      //page: page,
      //limit: limit,
      total_records: awardSectorList.count,
      //total_pages: awardSectorList.count > 0 ? Math.ceil(awardSectorList.count / limit) : 0,
      results: awardSectorList && awardSectorList.rows ? awardSectorList.rows : [],
    });
  } catch (error) {
    next(error);
  }
};
