import model from "../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { customDateTimeHelper } from "../../helpers/index.js";

export const generateDbContentReportResult = async (dateType, category, startDate, endDate) => {
  try {
    let retResults = [];
    let dateArr = [];
    let startDateMonthForm = "";
    let startDateYearForm = "";
    if (dateType == "daily") {
      dateArr = await customDateTimeHelper.getAllDatesBetween(
        startDate,
        endDate,
        "day",
        "YYYY-MM-DD",
      );
    } else if (dateType == "monthly") {
      dateArr = await customDateTimeHelper.getAllDatesBetween(startDate, endDate, "day", "YYYY-MM");
      startDateMonthForm = await customDateTimeHelper.changeDateFormat(startDate, "YYYY-MM");
    } else if (dateType == "yearly") {
      dateArr = await customDateTimeHelper.getAllDatesBetween(startDate, endDate, "year", "YYYY");
      startDateYearForm = await customDateTimeHelper.changeDateFormat(startDate, "YYYY");
    }
    let findModel = null;
    let conditions = {};
    let conditionsActive = {};
    let conditionsInactive = {};
    if (category == "movie") {
      conditions = {
        record_status: { [Op.ne]: "deleted" },
        type: "movie",
      };
      conditionsActive = {
        record_status: "active",
        type: "movie",
      };
      conditionsInactive = {
        record_status: "inactive",
        type: "movie",
      };
      findModel = model.title;
    }
    if (category == "tv") {
      conditions = {
        record_status: { [Op.ne]: "deleted" },
        type: "tv",
      };
      conditionsActive = {
        record_status: "active",
        type: "tv",
      };
      conditionsInactive = {
        record_status: "inactive",
        type: "tv",
      };
      findModel = model.title;
    }
    if (category == "webtoons") {
      conditions = {
        record_status: { [Op.ne]: "deleted" },
        type: "webtoons",
      };
      conditionsActive = {
        record_status: "active",
        type: "webtoons",
      };
      conditionsInactive = {
        record_status: "inactive",
        type: "webtoons",
      };
      findModel = model.title;
    }
    if (category == "people") {
      conditions = {
        status: { [Op.ne]: "deleted" },
      };
      conditionsActive = {
        status: "active",
      };
      conditionsInactive = {
        status: "inactive",
      };
      findModel = model.people;
    }
    if (category == "awards") {
      conditions = {
        status: { [Op.ne]: "deleted" },
      };
      conditionsActive = {
        status: "active",
      };
      conditionsInactive = {
        status: "inactive",
      };
      findModel = model.awards;
    }
    if (category == "video") {
      conditions = {
        status: "active",
      };
      conditionsActive = conditions;
      findModel = model.video;
    }

    if (dateArr.length > 0 && findModel) {
      for (const eachRow of dateArr) {
        if (eachRow) {
          let condition = {};
          let conditionDateOnly = {};

          if (dateType == "daily") {
            condition[Op.and] = Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
              [Op.between]: [startDate, eachRow],
            });
            conditionDateOnly[Op.and] = Sequelize.where(
              Sequelize.fn("DATE", Sequelize.col("created_at")),
              {
                [Op.eq]: eachRow,
              },
            );

            const [
              total,
              totalActive,
              totalInactive,
              totalToday,
              totalTodayActive,
              totalTodayInactive,
            ] = await Promise.all([
              findModel.count({
                where: { ...conditions, ...condition },
              }),
              category == "video" || category == "awards"
                ? "-"
                : findModel.count({
                    where: { ...conditionsActive, ...condition },
                  }),
              category == "video" || category == "awards"
                ? "-"
                : findModel.count({
                    where: { ...conditionsInactive, ...condition },
                  }),
              findModel.count({
                where: { ...conditions, ...conditionDateOnly },
              }),
              category == "video" || category == "awards"
                ? "-"
                : findModel.count({
                    where: { ...conditionsActive, ...conditionDateOnly },
                  }),
              category == "video" || category == "awards"
                ? "-"
                : findModel.count({
                    where: { ...conditionsInactive, ...conditionDateOnly },
                  }),
            ]);

            retResults.push({
              date: eachRow,
              total_count: total,
              total_added_today: totalToday,
              total_active_count: totalActive,
              total_inactive_count: totalInactive,
              total_today_active_count: totalTodayActive,
              total_today_inactive_count: totalTodayInactive,
            });
          } else if (dateType == "monthly") {
            condition[Op.and] = [
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.lte]: endDate,
              }),
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.gte]: startDate,
              }),
              Sequelize.where(Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"), {
                [Op.between]: [startDateMonthForm, eachRow],
              }),
            ];

            conditionDateOnly[Op.and] = [
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.lte]: endDate,
              }),
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.gte]: startDate,
              }),
              Sequelize.where(Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"), {
                [Op.eq]: eachRow,
              }),
            ];

            const [total, totalInMonth, totalInMonthActive, totalInMonthInactive] =
              await Promise.all([
                findModel.count({
                  where: { ...conditions, ...condition },
                }),
                findModel.count({
                  where: { ...conditions, ...conditionDateOnly },
                }),
                category == "video" || category == "awards"
                  ? "-"
                  : findModel.count({
                      where: { ...conditionsActive, ...conditionDateOnly },
                    }),
                category == "video" || category == "awards"
                  ? "-"
                  : findModel.count({
                      where: { ...conditionsInactive, ...conditionDateOnly },
                    }),
              ]);
            retResults.push({
              months: eachRow,
              total_count: total,
              total_added_in_month: totalInMonth,
              total_month_active_count: totalInMonthActive,
              total_month_inactive_count: totalInMonthInactive,
            });
          } else if (dateType == "yearly") {
            condition[Op.and] = [
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.lte]: endDate,
              }),
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.gte]: startDate,
              }),
              Sequelize.where(Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y"), {
                [Op.between]: [startDateYearForm, eachRow],
              }),
            ];
            conditionDateOnly[Op.and] = [
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.lte]: endDate,
              }),
              Sequelize.where(Sequelize.fn("DATE", Sequelize.col("created_at")), {
                [Op.gte]: startDate,
              }),
              Sequelize.where(Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y"), {
                [Op.eq]: eachRow,
              }),
            ];

            const [total, totalInYear, totalInYearActive, totalInYearInactive] = await Promise.all([
              findModel.count({
                where: { ...conditions, ...condition },
              }),
              findModel.count({
                where: { ...conditions, ...conditionDateOnly },
              }),
              category == "video" || category == "awards"
                ? "-"
                : findModel.count({
                    where: { ...conditionsActive, ...conditionDateOnly },
                  }),
              category == "video" || category == "awards"
                ? "-"
                : findModel.count({
                    where: { ...conditionsInactive, ...conditionDateOnly },
                  }),
            ]);
            retResults.push({
              years: eachRow,
              total_count: total,
              total_added_in_year: totalInYear,
              total_year_active_count: totalInYearActive,
              total_year_inactive_count: totalInYearInactive,
            });
          }
        }
      }
    }
    return retResults;
  } catch (error) {
    return [];
  }
};
