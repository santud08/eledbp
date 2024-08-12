import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * pageViewByTypeDownload
 * @param req
 * @param res
 */
export const pageViewByTypeDownload = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchPageTitle = reqBody.search_params.page_title
      ? reqBody.search_params.page_title
      : "";
    const searchStartDate = reqBody.search_params.start_date
      ? reqBody.search_params.start_date
      : "";
    const searchEndDate = reqBody.search_params.end_date ? reqBody.search_params.end_date : "";
    const listType = reqBody.list_type ? reqBody.list_type : "movie";

    const searchParams = {
      sortBy: "id",
      sortOrder: "desc",
    };

    const attributes = [
      "user_email",
      [Sequelize.col("activity.user_session_id"), "session_id"],
      "page_title",
      ["page_url", "type_id"],
      ["referrer_url", "referrer"],
      ["view_start_at", "view_at"],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };

    //page title
    if (searchPageTitle) {
      condition.page_title = { [Op.like]: `%${searchPageTitle}%` };
    }

    //page type
    if (listType) {
      condition.page_type = listType;
    }
    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
        [Op.gte]: searchStartDate,
      });
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
        [Op.lte]: searchEndDate,
      });
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("view_start_at")), {
        [Op.between]: [searchStartDate, searchEndDate],
      });
    }

    const includeQuery = [
      {
        model: model.activity,
        attributes: ["id"],
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
    workSheetName = `${res.__(listType)}`;
    let filename = res.__("PageView");
    filename = `${workSheetName}_${filename}`;
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
      { header: res.__("Page Title"), key: "page_title", width: 25 },
      { header: res.__("Type Id"), key: "type_id", width: 25 },
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
            page_title: ed.page_title,
            type_id: ed.dataValues.type_id,
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
