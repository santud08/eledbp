import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";

/**
 * exportUserFeedbackReportDownload
 * @param req
 * @param res
 */
export const exportUserFeedbackReportDownload = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchCategory = reqBody.search_params.category
      ? reqBody.search_params.category
      : "movie";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";
    const listType = reqBody.list_type ? reqBody.list_type : "like";

    const language = req.accept_language;
    const searchParams = {
      sortBy: "",
      sortOrder: "",
    };

    searchParams.sortOrderObj = [[Sequelize.literal("total_count"), "desc"]];
    let attributes = [];
    let findModelTable = model.favourites;
    let searchType = "title";
    let groupBy = ["favourable_id"];
    let condition = {
      status: "active",
    };
    let dateFilter = "favourites.created_at";
    if (searchCategory == "movie" || searchCategory == "tv" || searchCategory == "webtoons") {
      searchType = "title";
    } else if (searchCategory == "people") {
      searchType = "people";
    } else if (searchCategory == "awards") {
      searchType = "award";
    }

    if (listType == "share") {
      attributes = [
        ["shared_id", "record_id"],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "facebook",
          ),
          "facebook_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "twitter",
          ),
          "twitter_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "mail",
          ),
          "mail_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "link",
          ),
          "link_count",
        ],
        [
          Sequelize.fn(
            "sharedCountReport",
            Sequelize.col("shared.shared_id"),
            `${searchType}`,
            "all",
          ),
          "total_count",
        ],
      ];
      findModelTable = model.shared;
      groupBy = ["shared_id"];
      condition["shared_type"] = searchType;
      dateFilter = "shared.created_at";
    } else if (listType == "rating") {
      findModelTable = model.ratings;
      attributes = [
        ["ratingable_id", "record_id"],
        [
          Sequelize.fn(
            "starRatingCountReport",
            Sequelize.col("ratings.ratingable_id"),
            `${searchType}`,
          ),
          "total_count",
        ],
      ];
      groupBy = ["ratingable_id"];
      condition["ratingable_type"] = searchType;
      dateFilter = "ratings.created_at";
    } else {
      attributes = [
        ["favourable_id", "record_id"],
        [
          Sequelize.fn(
            "favouritesCountReport",
            Sequelize.col("favourites.favourable_id"),
            `${searchType}`,
          ),
          "total_count",
        ],
      ];
      findModelTable = model.favourites;
      groupBy = ["favourable_id"];
      condition["favourable_type"] = searchType;
      dateFilter = "favourites.created_at";
    }

    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
        [Op.gte]: searchStartDate,
      });
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
        [Op.lte]: searchEndDate,
      });
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
        [Op.between]: [searchStartDate, searchEndDate],
      });
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
    } else if (searchCategory == "awards") {
      includeQuery = [
        {
          model: model.awards,
          attributes: ["id", "status"],
          where: { status: { [Op.ne]: "deleted" } },
          required: true,
          include: {
            model: model.awardTranslation,
            attributes: ["id", "award_id", "award_name", "site_language"],
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
      findModelTable,
      includeQuery,
      condition,
      attributes,
      groupBy,
    );
    const options = {
      encoding: "UTF-8",
    };
    const workbook = new excel.Workbook();

    // For Basic Sheet
    let worksheetColumns = [];
    let workSheetName = "";
    let filename = res.__("UserFeedback");
    const categoryList = await generalHelper.analytiFilterCategoryList("user_feedback_report");
    if (listType == "share") {
      worksheetColumns = [
        { header: res.__("Title"), key: "title", width: 25 },
        { header: res.__("Facebook"), key: "facebook_count", width: 25 },
        { header: res.__("Twitter"), key: "twitter_count", width: 25 },
        { header: res.__("Mail"), key: "mail_count", width: 25 },
        { header: res.__("Link"), key: "link_count", width: 25 },
        { header: res.__("Share Count"), key: "total_count", width: 25 },
      ];
      workSheetName = res.__("Share");
    } else if (listType == "rating") {
      worksheetColumns = [
        { header: res.__("Title"), key: "title", width: 25 },
        { header: res.__("Star Rating Count"), key: "total_count", width: 25 },
      ];
      workSheetName = res.__("StarRating");
    } else {
      worksheetColumns = [
        { header: res.__("Title"), key: "title", width: 25 },
        { header: res.__("Like Count"), key: "total_count", width: 25 },
      ];
      workSheetName = res.__("Like");
    }
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
    worksheet.columns = worksheetColumns;
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    if (resultData.rows && resultData.rows.length > 0) {
      for (const ed of resultData.rows) {
        if (ed) {
          let record = {
            //id: ed.dataValues.record_id ? ed.dataValues.record_id : "",
            title: "",
            // type: "",
          };
          if (listType == "share") {
            record.facebook_count = ed.dataValues.facebook_count ? ed.dataValues.facebook_count : 0;
            record.twitter_count = ed.dataValues.twitter_count ? ed.dataValues.twitter_count : 0;
            record.mail_count = ed.dataValues.mail_count ? ed.dataValues.mail_count : 0;
            record.link_count = ed.dataValues.link_count ? ed.dataValues.link_count : 0;
          }
          record.total_count = ed.dataValues.total_count ? ed.dataValues.total_count : 0;
          if (searchCategory == "people") {
            record.title =
              ed.dataValues.person &&
              ed.dataValues.person.peopleTranslations &&
              ed.dataValues.person.peopleTranslations.length > 0 &&
              ed.dataValues.person.peopleTranslations[0] &&
              ed.dataValues.person.peopleTranslations[0].name
                ? ed.dataValues.person.peopleTranslations[0].name
                : "";
            // record.type = searchCategory;
          } else if (searchCategory == "awards") {
            record.title =
              ed.dataValues.award &&
              ed.dataValues.award.awardTranslations &&
              ed.dataValues.award.awardTranslations.length > 0 &&
              ed.dataValues.award.awardTranslations[0] &&
              ed.dataValues.award.awardTranslations[0].award_name
                ? ed.dataValues.award.awardTranslations[0].award_name
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
            // ed.dataValues.title && ed.dataValues.title.type ? ed.dataValues.title.type : "";
          }
          worksheet.addRow(record);
        }
      }
    } else {
      throw StatusError.badRequest(res.__("no records to export"));
    }

    //const curDate = await customDateTimeHelper.changeDateFormat(Date.now(), "YYYYMMDD_HHmmss");

    const downloadPath = "public/download_file/";

    //const filename = `user_feedback_report_${curDate}.xlsx`;
    filename = `${filename}.xlsx`;
    await workbook.xlsx.writeFile(`${downloadPath}/${filename}`, options);
    res.ok({
      path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
    });
  } catch (error) {
    next(error);
  }
};
