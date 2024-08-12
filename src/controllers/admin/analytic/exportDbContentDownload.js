import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import excel from "exceljs";
import { analyticService } from "../../../services/index.js";

/**
 * exportDbContentDownload
 * @param req
 * @param res
 */
export const exportDbContentDownload = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const category = reqBody.category ? reqBody.category : "";
    const dateType = reqBody.date_type ? reqBody.date_type : "";
    const searchStartDate = reqBody.start_date ? reqBody.start_date : "";
    const searchEndDate = reqBody.end_date ? reqBody.end_date : "";
    if (!category) throw StatusError.badRequest(res.__("Invalid category"));
    if (searchStartDate && searchEndDate) {
      if (new Date(searchStartDate) > new Date(searchEndDate)) {
        throw StatusError.badRequest(res.__("end date always greater than equal to start date"));
      }
    }

    if (category != "all") {
      if (!dateType) throw StatusError.badRequest(res.__("Invalid date type"));
      if (!searchEndDate || !searchStartDate) {
        throw StatusError.badRequest(res.__("select start date & end date"));
      }
      const getEndDate = await customDateTimeHelper.changeDateFormat(searchEndDate, "YYYY-MM-DD");
      if (dateType == "daily") {
        const getEndDateRange = await customDateTimeHelper.getDateFromCurrentDate(
          "add",
          1,
          "month",
          searchStartDate,
          "YYYY-MM-DD",
        );
        if (getEndDate > getEndDateRange)
          throw StatusError.badRequest(res.__("select valid date range with in a month"));
      }
      if (dateType == "monthly") {
        const getEndDateRange = await customDateTimeHelper.getDateFromCurrentDate(
          "add",
          12,
          "month",
          searchStartDate,
          "YYYY-MM-DD",
        );
        if (getEndDate > getEndDateRange)
          throw StatusError.badRequest(res.__("select valid date range with in 12 months"));
      }
    }

    let results = [];
    let movieTotalCount = 0,
      movieActiveCount = 0,
      movieInactiveCount = 0,
      tvTotalCount = 0,
      tvActiveCount = 0,
      tvInactiveCount = 0,
      webtoonsTotalCount = 0,
      webtoonsActiveCount = 0,
      webtoonsInactiveCount = 0,
      peopleTotalCount = 0,
      peopleActiveCount = 0,
      peopleInactiveCount = 0,
      awardsTotalCount = 0,
      awardsActiveCount = "-",
      awardsInactiveCount = "-",
      videoTotalCount = 0,
      videoActiveCount = "-",
      videoInactiveCount = "-",
      allTotalCount = 0,
      allActiveCount = 0,
      allInactiveCount = 0;
    let condition = {};

    if (category == "all") {
      // Add extra conditions for Startdate
      if (searchStartDate && !searchEndDate) {
        condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
          [Op.gte]: searchStartDate,
        });
      }
      // Add extra conditions for Enddate
      if (searchEndDate && !searchStartDate) {
        condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
          [Op.lte]: searchEndDate,
        });
      }
      // Add extra conditions for Startdate & EndDate
      if (searchStartDate && searchEndDate) {
        condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
          [Op.between]: [searchStartDate, searchEndDate],
        });
      }
      [
        movieActiveCount,
        movieInactiveCount,
        tvActiveCount,
        tvInactiveCount,
        webtoonsActiveCount,
        webtoonsInactiveCount,
        peopleActiveCount,
        peopleInactiveCount,
        awardsTotalCount,
        videoTotalCount,
      ] = await Promise.all([
        model.title.count({
          where: { record_status: "active", type: "movie", ...condition },
        }),
        model.title.count({
          where: { record_status: "inactive", type: "movie", ...condition },
        }),
        model.title.count({
          where: { record_status: "active", type: "tv", ...condition },
        }),
        model.title.count({
          where: { record_status: "inactive", type: "tv", ...condition },
        }),
        model.title.count({
          where: { record_status: "active", type: "webtoons", ...condition },
        }),
        model.title.count({
          where: { record_status: "inactive", type: "webtoons", ...condition },
        }),
        model.people.count({
          where: { status: "active", ...condition },
        }),
        model.people.count({
          where: { status: "inactive", ...condition },
        }),
        model.awards.count({
          where: { status: "active", ...condition },
        }),
        model.video.count({
          where: { status: "active", ...condition },
        }),
      ]);
      //movie
      movieTotalCount = movieActiveCount + movieInactiveCount;
      results.push({
        category: "movie",
        total_count: movieTotalCount,
        total_active_count: movieActiveCount,
        total_inactive_count: movieInactiveCount,
      });
      //tv
      tvTotalCount = tvActiveCount + tvInactiveCount;
      results.push({
        category: "tv",
        total_count: tvTotalCount,
        total_active_count: tvActiveCount,
        total_inactive_count: tvInactiveCount,
      });
      //webtoons
      webtoonsTotalCount = webtoonsActiveCount + webtoonsInactiveCount;
      results.push({
        category: "webtoons",
        total_count: webtoonsTotalCount,
        total_active_count: webtoonsActiveCount,
        total_inactive_count: webtoonsInactiveCount,
      });
      //people
      peopleTotalCount = peopleActiveCount + peopleInactiveCount;
      results.push({
        category: "people",
        total_count: peopleTotalCount,
        total_active_count: peopleActiveCount,
        total_inactive_count: peopleInactiveCount,
      });
      //awards
      results.push({
        category: "awards",
        total_count: awardsTotalCount,
        total_active_count: awardsActiveCount,
        total_inactive_count: awardsInactiveCount,
      });
      //video
      results.push({
        category: "video",
        total_count: videoTotalCount,
        total_active_count: videoActiveCount,
        total_inactive_count: videoInactiveCount,
      });

      allTotalCount =
        movieTotalCount +
        tvTotalCount +
        webtoonsTotalCount +
        peopleTotalCount +
        awardsTotalCount +
        videoTotalCount;
      allActiveCount = movieActiveCount + tvActiveCount + webtoonsActiveCount + peopleActiveCount;
      allInactiveCount =
        movieInactiveCount + tvInactiveCount + webtoonsInactiveCount + peopleInactiveCount;
      results.unshift({
        category: "all",
        total_count: allTotalCount,
        total_active_count: allActiveCount,
        total_inactive_count: allInactiveCount,
      });

      //results.sort((a, b) => b.total_count - a.total_count);
    }
    const options = {
      encoding: "UTF-8",
    };
    //let sheetName = res.__("report details");
    let filename = res.__("DBContent");
    let workSheetName = "";
    const categoryList = await generalHelper.analytiFilterCategoryList("db_content_report");
    workSheetName = `${res.__(category == "tv" ? "TvShows" : categoryList[category])}`;

    let headerColumns = [
      { header: res.__("Category"), key: "category", width: 25 },
      { header: res.__("Total Count"), key: "total_count", width: 25 },
      { header: res.__("Total Active"), key: "total_active_count", width: 25 },
      { header: res.__("Total Inactive"), key: "total_inactive_count", width: 25 },
    ];
    if (dateType == "daily") {
      //sheetName = res.__("daily report details");
      workSheetName = `${workSheetName}_${res.__("Daily")}`;
      headerColumns = [
        { header: res.__("Date"), key: "date", width: 25 },
        { header: res.__("Total Works"), key: "total_count", width: 25 },
        { header: res.__("Works Got Added Today"), key: "total_added_today", width: 25 },
        { header: res.__("Total Active"), key: "total_active_count", width: 25 },
        { header: res.__("Total Inactive"), key: "total_inactive_count", width: 25 },
        { header: res.__("Works Got Added Active"), key: "total_today_active_count", width: 25 },
        {
          header: res.__("Works Got Added Inactive"),
          key: "total_today_inactive_count",
          width: 25,
        },
      ];
    } else if (dateType == "monthly") {
      //sheetName = res.__("monthly report details");
      workSheetName = `${workSheetName}_${res.__("Monthly")}`;
      headerColumns = [
        { header: res.__("Months"), key: "months", width: 25 },
        { header: res.__("Total Works"), key: "total_count", width: 25 },
        { header: res.__("Works Got Added In A Month"), key: "total_added_in_month", width: 25 },
        {
          header: res.__("Total Active Works In Month"),
          key: "total_month_active_count",
          width: 25,
        },
        {
          header: res.__("Total Inactive Works In Month"),
          key: "total_month_inactive_count",
          width: 25,
        },
      ];
    } else if (dateType == "yearly") {
      //sheetName = res.__("yearly report details");
      workSheetName = `${workSheetName}_${res.__("Yearly")}`;
      headerColumns = [
        { header: res.__("Years"), key: "years", width: 25 },
        { header: res.__("Total Works"), key: "total_count", width: 25 },
        { header: res.__("Works Got Added In A Year"), key: "total_added_in_year", width: 25 },
        { header: res.__("Total Active Works In Year"), key: "total_year_active_count", width: 25 },
        {
          header: res.__("Total Inactive Works In Year"),
          key: "total_year_inactive_count",
          width: 25,
        },
      ];
    }

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

    const workbook = new excel.Workbook();
    //const worksheet = workbook.addWorksheet(sheetName);
    const worksheet = workbook.addWorksheet(workSheetName);
    worksheet.columns = headerColumns;
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    // For Basic Sheet
    if (category == "all") {
      if (results && results.length > 0) {
        for (const row of results) {
          if (row) {
            row.category = res.__(
              await generalHelper.analytiFilterCategoryList("db_content_report", row.category),
            );
            worksheet.addRow(row);
          }
        }
      } else {
        throw StatusError.badRequest(res.__("no records to export"));
      }
    } else {
      results = await analyticService.generateDbContentReportResult(
        dateType,
        category,
        searchStartDate,
        searchEndDate,
      );
      if (results && results.length > 0) {
        for (const row of results) {
          if (row) {
            worksheet.addRow(row);
          }
        }
      } else {
        throw StatusError.badRequest(res.__("no records to export"));
      }
    }

    //const curDate = await customDateTimeHelper.changeDateFormat(Date.now(), "YYYYMMDD_HHmmss");

    const downloadPath = "public/download_file/";

    //const filename = `db_content_analytic_${curDate}.xlsx`;
    filename = `${filename}.xlsx`;
    await workbook.xlsx.writeFile(`${downloadPath}/${filename}`, options);
    res.ok({
      path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
    });
  } catch (error) {
    next(error);
  }
};
