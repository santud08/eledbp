import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Op, Sequelize } from "sequelize";

/**
 * tagList
 * @param req
 * @param res
 */
export const tagList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const categoryId = reqBody.category_id ? reqBody.category_id : "";
    const subCategoryId = reqBody.sub_category_id ? reqBody.sub_category_id : "";
    const tagName = reqBody.tag_name ? reqBody.tag_name.trim() : "";
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";
    const language = req.accept_language;

    // check for parent id existance in tag category table
    if (categoryId) {
      const getCategory = await model.tagCategory.findOne({
        attributes: ["id"],
        where: { id: categoryId, status: { [Op.ne]: "deleted" } },
      });
      if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));
    }

    // check for sub category id existance in tag category table
    if (categoryId && subCategoryId) {
      const getSubCategory = await model.tagCategory.findOne({
        attributes: ["id"],
        where: { id: subCategoryId, parent_id: categoryId, status: { [Op.ne]: "deleted" } },
      });
      if (!getSubCategory) throw StatusError.badRequest(res.__("Invalid sub category id"));
    }

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
    };

    if (sortOrder && sortBy == "category_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("category_name"), sortOrder]];
    } else if (sortOrder && sortBy == "sub_category_name") {
      searchParams.sortOrderObj = [[Sequelize.literal("sub_category_name"), sortOrder]];
    } else if (sortOrder && sortBy == "tag_name_en") {
      searchParams.sortOrderObj = [[Sequelize.literal("tag_name_en"), sortOrder]];
    } else if (sortOrder && sortBy == "tag_name_ko") {
      searchParams.sortOrderObj = [[Sequelize.literal("tag_name_ko"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[sortBy, sortOrder]];
    }
    const attributes = [
      ["id", "tag_id"],
      [
        Sequelize.fn(
          "IFNULL",
          Sequelize.col("tagCategoryOne.tagCategoryTranslationOne.category_name"),
          "",
        ),
        "category_name",
      ],
      [
        Sequelize.fn(
          "IFNULL",
          Sequelize.col("subCategory.tagCategoryTranslationOne.category_name"),
          "",
        ),
        "sub_category_name",
      ],
      [Sequelize.fn("IFNULL", Sequelize.col("tagTranslationOne.display_name"), ""), "tag_name_en"],
      [Sequelize.fn("IFNULL", Sequelize.col("tagTranslationOnel.display_name"), ""), "tag_name_ko"],
    ];

    const includeQuery = [
      {
        model: model.tagTranslation,
        as: "tagTranslationOne",
        attributes: [],
        left: true,
        where: { status: { [Op.ne]: "deleted" }, site_language: "en" },
        required: true,
      },
      {
        model: model.tagTranslation,
        as: "tagTranslationOnel",
        attributes: [],
        left: true,
        where: { status: { [Op.ne]: "deleted" }, site_language: "ko" },
        required: true,
      },
      {
        model: model.tagCategory,
        as: "tagCategoryOne",
        attributes: [],
        left: true,
        where: {
          status: { [Op.ne]: "deleted" },
          parent_id: 0,
        },
        required: true,
        include: [
          {
            model: model.tagCategoryTranslation,
            as: "tagCategoryTranslationOne",
            attributes: [],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
              site_language: language,
            },
            required: true,
          },
        ],
      },
      {
        model: model.tagCategory,
        as: "subCategory",
        attributes: [],
        left: true,
        where: {
          status: { [Op.ne]: "deleted" },
          parent_id: { [Op.ne]: 0 },
        },
        required: true,
        include: [
          {
            model: model.tagCategoryTranslation,
            as: "tagCategoryTranslationOne",
            attributes: [],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
              site_language: language,
            },
            required: true,
          },
        ],
      },
    ];

    const condition = {
      status: { [Op.ne]: "deleted" },
    };

    if (categoryId) {
      condition.tag_main_category_id = categoryId;
    }
    if (subCategoryId) {
      condition.tag_category_id = subCategoryId;
    }
    if (tagName) {
      condition[Op.or] = [
        { "$tagTranslationOne.display_name$": { [Op.like]: `%${tagName}%` } },
        { "$tagTranslationOnel.display_name$": { [Op.like]: `%${tagName}%` } },
      ];
    }
    const getTagSearch = await paginationService.pagination(
      searchParams,
      model.tag,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getTagSearch.count,
      total_pages: getTagSearch.count > 0 ? Math.ceil(getTagSearch.count / limit) : 0,
      result: getTagSearch.rows ? getTagSearch.rows : [],
    });
  } catch (error) {
    next(error);
  }
};
