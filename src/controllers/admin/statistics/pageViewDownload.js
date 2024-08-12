import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * pageViewDownload
 * @param req
 * @param res
 */
export const pageViewDownload = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchAccessPlatform = reqBody.search_params.access_platform
      ? reqBody.search_params.access_platform
      : "";
    const searchPageType = reqBody.search_params.page_type ? reqBody.search_params.page_type : "";
    const searchPageTitle = reqBody.search_params.page_title
      ? reqBody.search_params.page_title
      : "";
    const searchUtmSource = reqBody.search_params.utm_source
      ? reqBody.search_params.utm_source
      : "";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";

    const searchParams = {
      sortBy: "id",
      sortOrder: "desc",
    };

    const attributes = [
      "user_email",
      [Sequelize.col("activity.access_platform"), "access_platform"],
      "page_type",
      "page_title",
      ["page_url", "type_id"],
      [Sequelize.col("activity.utm_source"), "utm_source"],
      [Sequelize.col("activity.utm_medium"), "utm_medium"],
      [Sequelize.col("activity.utm_content"), "utm_content"],
      [Sequelize.col("activity.utm_term"), "utm_term"],
      ["referrer_url", "referrer"],
      ["view_start_at", "view_at"],
      [Sequelize.col("activity.user_session_id"), "session_id"],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };
    let andCondition = [];
    //access platform
    if (searchAccessPlatform) {
      andCondition.push({
        "$activity.access_platform$": { [Op.like]: `%${searchAccessPlatform}%` },
      });
    }
    //page title
    if (searchPageTitle) {
      condition.page_title = { [Op.like]: `%${searchPageTitle}%` };
    }
    //utm source
    if (searchUtmSource) {
      andCondition.push({ "$activity.utm_source$": { [Op.like]: `%${searchUtmSource}%` } });
    }
    //page type
    if (searchPageType) {
      condition.page_type = searchPageType;
    }
    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      andCondition.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
          [Op.gte]: searchStartDate,
        }),
      );
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      andCondition.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
          [Op.lte]: searchEndDate,
        }),
      );
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      andCondition.push(
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
      );
    }

    if (andCondition.length > 0) {
      condition[Op.and] = andCondition;
    }

    const includeQuery = [
      {
        model: model.activity,
        attributes: [],
        where: { status: { [Op.ne]: "deleted" } },
        required: true,
      },
    ];

    let resultData = await paginationService.pagination(
      searchParams,
      model.pageVisit,
      includeQuery,
      condition,
      attributes,
    );

    const options = {
      encoding: "UTF-8",
    };
    const workbook = new excel.Workbook();
    // For Basic Sheet
    let workSheetName = "";
    workSheetName = `${res.__(!searchPageType ? "All" : searchPageType)}`;
    let filename = res.__("PageView");

    filename = workSheetName != res.__("All") ? `${filename}_${workSheetName}` : filename;
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

    const worksheet = workbook.addWorksheet(workSheetName);
    worksheet.columns = [
      { header: res.__("User Id"), key: "user_email", width: 25 },
      { header: res.__("Access Platform"), key: "access_platform", width: 25 },
      { header: res.__("Page Type"), key: "page_type", width: 25 },
      { header: res.__("Page Title"), key: "page_title", width: 25 },
      { header: res.__("Type Id"), key: "type_id", width: 25 },
      { header: res.__("UTM Source"), key: "utm_source", width: 25 },
      { header: res.__("UTM Medium"), key: "utm_medium", width: 25 },
      { header: res.__("UTM Content"), key: "utm_content", width: 25 },
      { header: res.__("UTM Term"), key: "utm_term", width: 25 },
      { header: res.__("Referrer"), key: "referrer", width: 25 },
      { header: res.__("Page Viewed Date & Time"), key: "view_at", width: 25 },
      { header: res.__("Session Id"), key: "session_id", width: 25 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    if (resultData.rows && resultData.rows.length > 0) {
      for (const ed of resultData.rows) {
        if (ed) {
          const formatRow = {
            user_email: ed.user_email,
            access_platform: ed.dataValues.access_platform,
            page_type: ed.page_type,
            page_title: ed.page_title,
            type_id: ed.dataValues.type_id,
            utm_source: ed.dataValues.utm_source,
            utm_medium: ed.dataValues.utm_medium,
            utm_content: ed.dataValues.utm_content,
            utm_term: ed.dataValues.utm_term,
            referrer: ed.dataValues.referrer,
            view_at: ed.dataValues.view_at,
            session_id: ed.dataValues.session_id,
          };
          worksheet.addRow(formatRow);
        }
      }
    } else {
      throw StatusError.badRequest(res.__("no records to export"));
    }

    const downloadPath = "public/download_file/";
    filename = `${filename}.xlsx`;
    await workbook.xlsx.writeFile(`${downloadPath}/${filename}`, options);
    res.ok({
      path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
    });
  } catch (error) {
    next(error);
  }
};
