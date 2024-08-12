import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op, Sequelize } from "sequelize";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import publicIp from "public-ip";
import { paginationService } from "../../../services/index.js";

/**
 * tagDataExcelDownload
 * @param req
 * @param res
 */
export const tagDataExcelDownload = async (req, res, next) => {
  try {
    const categoryId = req.query.category_id ? req.query.category_id : "";
    const subCategoryId = req.query.sub_category_id ? req.query.sub_category_id : "";
    const tagName = req.query.tag_name ? req.query.tag_name : "";
    const language = req.accept_language ? req.accept_language : "en";
    const sortOrder = req.query.sort_order ? req.query.sort_order : "DESC";
    const sortBy = req.query.sort_by ? req.query.sort_by : "id";
    const userId = req.userDetails.userId;

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
      page: "",
      limit: "",
      sortBy: "",
      sortOrder: "",
    };

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TagList");
    worksheet.columns = [
      { header: res.__("Main category"), key: "category_name", width: 25 },
      { header: res.__("Sub category"), key: "sub_category_name", width: 25 },
      { header: res.__("English Tags Name"), key: "tag_name_en", width: 25 },
      { header: res.__("Korean Tags Name"), key: "tag_name_ko", width: 25 },
    ];
    // Making first line in excel bold
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // New code start from here
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

    if (getTagSearch) {
      for (let eachRow of getTagSearch.rows) {
        if (eachRow) {
          const record = {
            tag_id: eachRow.tag_id,
            category_name: eachRow.dataValues.category_name ? eachRow.dataValues.category_name : "",
            sub_category_name: eachRow.dataValues.sub_category_name
              ? eachRow.dataValues.sub_category_name
              : "",
            tag_name_en: eachRow.dataValues.tag_name_en ? eachRow.dataValues.tag_name_en : "",
            tag_name_ko: eachRow.dataValues.tag_name_en ? eachRow.dataValues.tag_name_ko : "",
          };
          worksheet.addRow(record);
        }
      }
    }

    // New code end

    const path = "public/download_file/";
    const filename = `tags_${Date.now()}.xlsx`;
    const options = {
      encoding: "UTF-8",
    };
    const logDetails = {
      ip: await publicIp.v4(),
      type: "download_tag",
      user_id: userId,
      item_id: userId,
      event_type: "download",
      result: "fail",
    };
    await workbook.xlsx.writeFile(`${path}/${filename}`, options).then(() => {
      customDateTimeHelper.getCurrentDateTime().then((value) => {
        //save log details
        logDetails.result = "success";
        const logData = {
          user_id: userId,
          item_id: userId,
          type: "tag",
          event_type: "download",
          details: logDetails,
          created_by: userId,
          created_at: value,
        };
        model.usersActivity.create(logData);
        res.ok({
          path: Buffer.from(`${path}${filename}`).toString("hex"),
        });
      });
    });
  } catch (error) {
    next(error);
  }
};
