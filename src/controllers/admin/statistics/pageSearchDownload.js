import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import excel from "exceljs";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * pageSearchDownload
 * @param req
 * @param res
 */
export const pageSearchDownload = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchSearchKeyword = reqBody.search_params.search_keyword
      ? reqBody.search_params.search_keyword
      : "";
    const searchLandingKeyword = reqBody.search_params.landing_keyword
      ? reqBody.search_params.landing_keyword
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
      ["search_text", "search_keyword"],
      ["landing_text", "landing_keyword"],
      ["search_sort", "sort"],
      "release_date",
      "created_at",
    ];

    let condition = {
      status: { [Op.ne]: "deleted" },
    };

    //search keyword
    if (searchSearchKeyword) {
      condition.search_text = { [Op.like]: `%${searchSearchKeyword}%` };
    }

    //landing keyword
    if (searchLandingKeyword) {
      condition.landing_text = { [Op.like]: `%${searchLandingKeyword}%` };
    }

    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("searchActivity.created_at")),
        {
          [Op.gte]: searchStartDate,
        },
      );
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("searchActivity.created_at")),
        {
          [Op.lte]: searchEndDate,
        },
      );
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.and] = Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("searchActivity.created_at")),
        {
          [Op.between]: [searchStartDate, searchEndDate],
        },
      );
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
      model.searchActivity,
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
    workSheetName = `${res.__("All")}`;
    let filename = res.__("Search");

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
      { header: res.__("Search Keyword"), key: "search_keyword", width: 25 },
      { header: res.__("Landing Keyword"), key: "landing_keyword", width: 25 },
      { header: res.__("Sort"), key: "sort", width: 25 },
      { header: res.__("Release Date"), key: "release_date", width: 25 },
      { header: res.__("Created Date"), key: "created_at", width: 25 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    if (resultData.rows && resultData.rows.length > 0) {
      for (const ed of resultData.rows) {
        if (ed) {
          const rowFormat = {
            search_keyword: ed.dataValues.search_keyword,
            landing_keyword: ed.dataValues.landing_keyword,
            sort: ed.dataValues.sort,
            release_date: ed.release_date,
            created_at: ed.created_at,
          };
          worksheet.addRow(rowFormat);
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
