import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * viewPageBySessionDownload
 * @param req
 * @param res
 */
export const viewPageBySessionDownload = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchPageType = reqBody.search_params.page_type ? reqBody.search_params.page_type : "";
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
      [Sequelize.col("activity.user_session_id"), "session_id"],
      "page_type",
      "page_title",
      ["page_url", "type_id"],
      ["view_duration", "time_duration"],
      ["view_start_at", "entry_time"],
      ["view_end_at", "exit_time"],
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };

    //page type
    if (searchPageType) {
      condition.page_type = searchPageType;
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
    let filename = res.__("TimeSpentOnEachPage");

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
      { header: res.__("Session Id"), key: "session_id", width: 25 },
      { header: res.__("Page Type"), key: "page_type", width: 25 },
      { header: res.__("Page Title"), key: "page_title", width: 25 },
      { header: res.__("Type Id"), key: "type_id", width: 25 },
      { header: res.__("Total Time Spent"), key: "time_duration", width: 25 },
      { header: res.__("Entry Time"), key: "entry_time", width: 25 },
      { header: res.__("Breakaway Time"), key: "exit_time", width: 25 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    if (resultData.rows && resultData.rows.length > 0) {
      for (const ed of resultData.rows) {
        if (ed) {
          const formatRow = {
            user_email: ed.user_email,
            session_id: ed.dataValues.session_id,
            page_type: ed.user_email,
            page_title: ed.user_email,
            type_id: ed.dataValues.type_id,
            time_duration: ed.dataValues.time_duration,
            entry_time: ed.dataValues.entry_time,
            exit_time: ed.dataValues.exit_time,
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
