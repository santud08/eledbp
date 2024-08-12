import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { envs } from "../../../config/index.js";
import { SOUTH_KOREA_COUNTRY, PEOPLE_SETTINGS } from "../../../utils/constants.js";

/**
 * bornToday
 * @param req
 * @param res
 * @param next
 */
export const bornToday = async (req, res, next) => {
  try {
    const language = req.accept_language;
    const reqDate = req.query.date ? req.query.date : null;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    let getSettingsDetails = {};
    let getCurrentDate = null;
    if (reqDate) {
      [getCurrentDate, getSettingsDetails] = await Promise.all([
        customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
      ]);
    } else {
      [getCurrentDate, getSettingsDetails] = await Promise.all([
        customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD"),
        // check for setting - whether the particular section is enabled
        model.settings.findOne({
          where: { name: "settings.front_lists.main", status: "active" },
        }),
      ]);
    }

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    // // ----------------------Born Today-------------------------------
    let bornToday = {};
    let bornTodayList = [];

    if (settingValue != null && settingValue.born_today === true) {
      const todayDateAndMonth = await customDateTimeHelper.changeDateFormat(
        getCurrentDate,
        "MM-DD",
      );
      const bornTodayAttributes = ["id", "birth_date", ["popularity_order", "popularity_count"]];

      const bornTodayIncludeQueryKo = [
        {
          model: model.peopleTranslation,
          attributes: ["people_id", "name", "birth_place", "site_language"],
          left: true,
          where: {
            status: "active",
          },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
        {
          model: model.peopleCountries,
          attributes: ["people_id", "country_id"],
          left: true,
          where: { status: "active", birth_place: { [Op.like]: `%${SOUTH_KOREA_COUNTRY}%` } },
          required: true,
        },
        {
          model: model.peopleImages,
          attributes: [
            "id",
            "people_id",
            "original_name",
            "file_name",
            "url",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          where: {
            image_category: "poster_image",
            is_main_poster: "y",
            status: "active",
            path: { [Op.ne]: null },
          },
          required: true,
          separate: true, //get the recently added image
          order: [["id", "DESC"]],
        },
      ];
      let firstLimit = 20;
      const todayDateMonthAndYear = await customDateTimeHelper.changeDateFormat(
        getCurrentDate,
        "MMM DD,YYYY",
      );

      const bornTodayConditionKo = {
        status: "active",
        death_date: null,
        [Op.and]: [{ poster: { [Op.ne]: null } }, { poster: { [Op.ne]: "" } }],
      };
      const bornTodayCondition = {
        status: "active",
        death_date: null,
        [Op.and]: [{ poster: { [Op.ne]: null } }, { poster: { [Op.ne]: "" } }],
        [Op.or]: [
          { "$peopleCountry.birth_place$": { [Op.notLike]: `%${SOUTH_KOREA_COUNTRY}%` } },
          { "$peopleCountry.birth_place$": null },
        ],
      };

      bornTodayCondition[Sequelize.col("date_format(birth_date,'%m-%d')")] = Sequelize.where(
        Sequelize.fn("date_format", Sequelize.col("birth_date"), "%m-%d"),
        todayDateAndMonth,
      );

      bornTodayConditionKo[Sequelize.col("date_format(birth_date,'%m-%d')")] = Sequelize.where(
        Sequelize.fn("date_format", Sequelize.col("birth_date"), "%m-%d"),
        todayDateAndMonth,
      );

      const bornTodayInformationKoPeople = await model.people.findAll({
        attributes: bornTodayAttributes,
        include: bornTodayIncludeQueryKo,
        where: bornTodayConditionKo,
        order: [[Sequelize.literal("popularity_count"), "DESC"]],
        offset: 0,
        limit: firstLimit,
        distinct: true,
      });

      if (bornTodayInformationKoPeople && bornTodayInformationKoPeople.length > 0) {
        for (const eachRow of bornTodayInformationKoPeople) {
          if (eachRow && eachRow.dataValues) {
            const record = {
              people_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              people_name:
                eachRow.dataValues.peopleTranslations &&
                eachRow.dataValues.peopleTranslations.length > 0 &&
                eachRow.dataValues.peopleTranslations[0] &&
                eachRow.dataValues.peopleTranslations[0].name
                  ? eachRow.dataValues.peopleTranslations[0].name
                  : "",
              people_image:
                eachRow.dataValues.peopleImages &&
                eachRow.dataValues.peopleImages.length > 0 &&
                eachRow.dataValues.peopleImages[0] &&
                eachRow.dataValues.peopleImages[0].path
                  ? eachRow.dataValues.peopleImages[0].path.replace(
                      "p/original",
                      `p/${peopleImageW}`,
                    )
                  : "",
            };
            bornTodayList.push(record);
          }
        }
      }
      bornToday.today_date = todayDateMonthAndYear;
      bornToday.people_lists = bornTodayList;
    }

    res.ok({
      born_today: bornToday,
    });
  } catch (error) {
    next(error);
  }
};
