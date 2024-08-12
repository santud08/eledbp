import model from "../../../models/index.js";
import { Sequelize, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * knownForList
 * @param req
 * @param res
 */
export const knownForList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    if (!reqBody.person_id && reqBody.person_id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid people id"));
    }
    const peopleId = reqBody.person_id; //It will be people id

    const page = 1;
    const limit = 8;

    let resultData = [];

    let language = req.accept_language;
    const getCurrentDate = await customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD");

    const getInformations = await model.people.findOne({
      where: { id: peopleId, status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid people id"));

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
      subQuery: false,
    };

    const attributes = [
      "id",
      "people_id",
      "creditable_id",
      [
        fn("calculateTitlePopularityBasedOnPeople", col("creditable_id"), getCurrentDate),
        "popularity_order",
      ],
    ];

    const includeQuery = [
      {
        model: model.title,
        attributes: ["id", "record_status", "type"],
        left: true,
        where: { record_status: "active" },
        include: [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "id",
              "title_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            left: true,
            where: {
              image_category: "poster_image",
              is_main_poster: "y",
              status: "active",
              episode_id: null,
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ],
        required: true,
      },
    ];

    const condition = {
      status: "active",
      people_id: peopleId,
      creditable_type: "title",
    };

    searchParams.sortOrderObj = [[Sequelize.literal("popularity_order"), "DESC"]];

    const groupBy = ["titles.id"];
    resultData = await paginationService.paginationWithGroupBy(
      searchParams,
      model.creditable,
      includeQuery,
      condition,
      attributes,
      groupBy,
    );

    const resCount =
      typeof resultData.count == "object" ? resultData.count.length : resultData.count;
    delete resultData.count;
    resultData.count = resCount;

    if (resultData.count > 0 && resultData.rows.length > 0) {
      let titleList = [];
      for (const eachRow of resultData.rows) {
        if (eachRow) {
          const record = {
            title_id:
              eachRow.dataValues &&
              eachRow.dataValues.titles.length > 0 &&
              eachRow.dataValues.titles[0].id
                ? eachRow.dataValues.titles[0].id
                : "",
            title_type:
              eachRow.dataValues &&
              eachRow.dataValues.titles.length > 0 &&
              eachRow.dataValues.titles[0].type
                ? eachRow.dataValues.titles[0].type
                : "",
            title_name:
              eachRow.dataValues &&
              eachRow.dataValues.titles.length > 0 &&
              eachRow.dataValues.titles[0].titleTranslations[0].name
                ? eachRow.dataValues.titles[0].titleTranslations[0].name
                : "",
            poster_image:
              eachRow.dataValues &&
              eachRow.dataValues.titles.length > 0 &&
              eachRow.dataValues.titles[0].titleImages &&
              eachRow.dataValues.titles[0].titleImages.length > 0 &&
              eachRow.dataValues.titles[0].titleImages[0].path
                ? eachRow.dataValues.titles[0].titleImages[0].path
                : "",
          };
          titleList.push(record);
        }
      }
      resultData.rows = titleList;
    }

    res.ok({
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
