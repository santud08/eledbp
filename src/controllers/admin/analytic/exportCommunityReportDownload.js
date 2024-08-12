import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";

/**
 * exportCommunityReportDownload
 * @param req
 * @param res
 */
export const exportCommunityReportDownload = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchCategory = reqBody.search_params.category
      ? reqBody.search_params.category
      : "movie";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";
    const listType = reqBody.list_type ? reqBody.list_type : "comment";

    const language = req.accept_language;
    const searchParams = {
      sortBy: "",
      sortOrder: "",
    };

    searchParams.sortOrderObj = [[Sequelize.literal("main_comment_count"), "desc"]];

    const commentableType = searchCategory == "people" ? searchCategory : "title";
    const attributes = [
      "commentable_id",
      [
        Sequelize.fn(
          "communityCountReport",
          `${listType}`,
          Sequelize.col("community.commentable_id"),
          `${commentableType}`,
          "main",
        ),
        "main_comment_count",
      ],
      [
        Sequelize.fn(
          "communityCountReport",
          `${listType}`,
          Sequelize.col("community.commentable_id"),
          `${commentableType}`,
          "sub",
        ),
        "sub_comment_count",
      ],
      [
        Sequelize.fn(
          "communityCountReport",
          `${listType}`,
          Sequelize.col("community.commentable_id"),
          `${commentableType}`,
          "like",
        ),
        "like_count",
      ],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
      commentable_type: commentableType,
      community_type: listType,
    };
    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("community.created_at")),
        {
          [Op.gte]: searchStartDate,
        },
      );
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("community.created_at")),
        {
          [Op.lte]: searchEndDate,
        },
      );
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("community.created_at")),
        {
          [Op.between]: [searchStartDate, searchEndDate],
        },
      );
    }
    let includeQuery = [];
    if (searchCategory == "people") {
      includeQuery = [
        {
          model: model.people,
          attributes: ["id", "status"],
          where: { status: { [Op.ne]: "deleted" } },
          required: true,
          include: {
            model: model.peopleTranslation,
            attributes: ["id", "people_id", "name", "site_language"],
            where: {
              status: "active",
            },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        },
      ];
    } else {
      const titleCondition = { record_status: { [Op.ne]: "deleted" }, type: searchCategory };
      includeQuery = [
        {
          model: model.title,
          attributes: ["id", "type", "record_status"],
          where: titleCondition,
          required: true,
          include: {
            model: model.titleTranslation,
            attributes: ["id", "title_id", "name", "site_language"],
            where: {
              status: "active",
            },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        },
      ];
    }

    let resultData = await paginationService.paginationWithGroupBy(
      searchParams,
      model.community,
      includeQuery,
      condition,
      attributes,
      ["commentable_id"],
    );

    const options = {
      encoding: "UTF-8",
    };
    const workbook = new excel.Workbook();
    // For Basic Sheet
    let workSheetName = "";
    workSheetName = `${res.__(listType == "famous_line" ? "FamousLines" : listType)}`;
    let filename = res.__("Community");
    const categoryList = await generalHelper.analytiFilterCategoryList("community_report");
    workSheetName = `${res.__(
      searchCategory == "tv" ? "TvShows" : categoryList[searchCategory],
    )}_${workSheetName}`;
    filename = `${filename}_${workSheetName}`;
    if (searchStartDate) {
      const fileFormStartDate = await customDateTimeHelper.changeDateFormat(
        searchStartDate,
        "YYYYMMDD",
      );
      filename = `${filename}_${fileFormStartDate}`;
    }
    if (searchEndDate) {
      const fileFormEndtDate = await customDateTimeHelper.changeDateFormat(
        searchEndDate,
        "YYYYMMDD",
      );
      filename = `${filename}_${fileFormEndtDate}`;
    }
    if (!searchStartDate && !searchEndDate) {
      filename = `${filename}_${res.__("AllPeriod")}`;
    }

    //const worksheet = workbook.addWorksheet(res.__("report details"));
    const worksheet = workbook.addWorksheet(workSheetName);
    worksheet.columns = [
      { header: res.__("Title"), key: "title", width: 25 },
      { header: res.__("Main Comment"), key: "main_comment_count", width: 25 },
      { header: res.__("Sub Comment Count"), key: "sub_comment_count", width: 25 },
      { header: res.__("Like Count"), key: "like_count", width: 25 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    if (resultData.rows && resultData.rows.length > 0) {
      for (const ed of resultData.rows) {
        if (ed) {
          let record = {
            //id: ed.dataValues.commentable_id ? ed.dataValues.commentable_id : "",
            title: "",
            //type: "",
            main_comment_count: ed.dataValues.main_comment_count
              ? ed.dataValues.main_comment_count
              : 0,
            sub_comment_count: ed.dataValues.sub_comment_count
              ? ed.dataValues.sub_comment_count
              : 0,
            like_count: ed.dataValues.like_count ? ed.dataValues.like_count : 0,
          };
          if (searchCategory == "people") {
            record.title =
              ed.dataValues.person &&
              ed.dataValues.person.peopleTranslations &&
              ed.dataValues.person.peopleTranslations.length > 0 &&
              ed.dataValues.person.peopleTranslations[0] &&
              ed.dataValues.person.peopleTranslations[0].name
                ? ed.dataValues.person.peopleTranslations[0].name
                : "";
            //record.type = searchCategory;
          } else {
            record.title =
              ed.dataValues.title &&
              ed.dataValues.title.titleTranslations &&
              ed.dataValues.title.titleTranslations.length > 0 &&
              ed.dataValues.title.titleTranslations[0] &&
              ed.dataValues.title.titleTranslations[0].name
                ? ed.dataValues.title.titleTranslations[0].name
                : "";
            //record.type =
            //  ed.dataValues.title && ed.dataValues.title.type ? ed.dataValues.title.type : "";
          }
          worksheet.addRow(record);
        }
      }
    } else {
      throw StatusError.badRequest(res.__("no records to export"));
    }

    //const curDate = await customDateTimeHelper.changeDateFormat(Date.now(), "YYYYMMDD_HHmmss");

    const downloadPath = "public/download_file/";

    //const filename = `community_report_${curDate}.xlsx`;
    filename = `${filename}.xlsx`;
    await workbook.xlsx.writeFile(`${downloadPath}/${filename}`, options);
    res.ok({
      path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
    });
  } catch (error) {
    next(error);
  }
};
