import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { StatusError } from "../../../config/index.js";
import { generalHelper, customDateTimeHelper } from "../../../helpers/index.js";

/**
 * dbContent
 * @param req
 * @param res
 */
export const dbContent = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const category = reqBody.category ? reqBody.category : "";
    const searchStartDate = reqBody.start_date ? reqBody.start_date : "";
    const searchEndDate = reqBody.end_date ? reqBody.end_date : "";
    const dateType = reqBody.date_type ? reqBody.date_type : "";

    if (!category) throw StatusError.badRequest(res.__("Invalid category"));
    if (searchStartDate && searchEndDate) {
      if (new Date(searchStartDate) > new Date(searchEndDate)) {
        throw StatusError.badRequest(res.__("end date always less than equal to start date"));
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

    const categoryList = await generalHelper.analytiFilterCategoryList("db_content_report");

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
    if (category == "movie" || category == "all") {
      [movieActiveCount, movieInactiveCount] = await Promise.all([
        model.title.count({
          where: { record_status: "active", type: "movie", ...condition },
        }),
        model.title.count({
          where: { record_status: "inactive", type: "movie", ...condition },
        }),
      ]);
      movieTotalCount = movieActiveCount + movieInactiveCount;
      results.push({
        category: "movie",
        display_category: res.__(categoryList["movie"]),
        total_count: movieTotalCount,
        total_active_count: movieActiveCount,
        total_inactive_count: movieInactiveCount,
      });
    }
    if (category == "tv" || category == "all") {
      [tvActiveCount, tvInactiveCount] = await Promise.all([
        model.title.count({
          where: { record_status: "active", type: "tv", ...condition },
        }),
        model.title.count({
          where: { record_status: "inactive", type: "tv", ...condition },
        }),
      ]);
      tvTotalCount = tvActiveCount + tvInactiveCount;
      results.push({
        category: "tv",
        display_category: res.__(categoryList["tv"]),
        total_count: tvTotalCount,
        total_active_count: tvActiveCount,
        total_inactive_count: tvInactiveCount,
      });
    }
    if (category == "webtoons" || category == "all") {
      [webtoonsActiveCount, webtoonsInactiveCount] = await Promise.all([
        model.title.count({
          where: { record_status: "active", type: "webtoons", ...condition },
        }),
        model.title.count({
          where: { record_status: "inactive", type: "webtoons", ...condition },
        }),
      ]);
      webtoonsTotalCount = webtoonsActiveCount + webtoonsInactiveCount;
      results.push({
        category: "webtoons",
        display_category: res.__(categoryList["webtoons"]),
        total_count: webtoonsTotalCount,
        total_active_count: webtoonsActiveCount,
        total_inactive_count: webtoonsInactiveCount,
      });
    }
    if (category == "people" || category == "all") {
      [peopleActiveCount, peopleInactiveCount] = await Promise.all([
        model.people.count({
          where: { status: "active", ...condition },
        }),
        model.people.count({
          where: { status: "inactive", ...condition },
        }),
      ]);
      peopleTotalCount = peopleActiveCount + peopleInactiveCount;
      results.push({
        category: "people",
        display_category: res.__(categoryList["people"]),
        total_count: peopleTotalCount,
        total_active_count: peopleActiveCount,
        total_inactive_count: peopleInactiveCount,
      });
    }
    if (category == "awards" || category == "all") {
      awardsTotalCount = await model.awards.count({
        where: { status: "active", ...condition },
      });
      results.push({
        category: "awards",
        display_category: res.__(categoryList["awards"]),
        total_count: awardsTotalCount,
        total_active_count: awardsActiveCount,
        total_inactive_count: awardsInactiveCount,
      });
    }
    if (category == "video" || category == "all") {
      videoTotalCount = await model.video.count({
        where: { status: "active", ...condition },
      });
      results.push({
        category: "video",
        display_category: res.__(categoryList["video"]),
        total_count: videoTotalCount,
        total_active_count: videoActiveCount,
        total_inactive_count: videoInactiveCount,
      });
    }
    if (category == "all") {
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
        display_category: res.__(categoryList["all"]),
        total_count: allTotalCount,
        total_active_count: allActiveCount,
        total_inactive_count: allInactiveCount,
      });

      //results.sort((a, b) => b.total_count - a.total_count);
    }
    res.ok({
      results: results,
    });
  } catch (error) {
    next(error);
  }
};
