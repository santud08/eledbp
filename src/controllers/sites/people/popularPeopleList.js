import model from "../../../models/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, PEOPLE_SETTINGS } from "../../../utils/constants.js";
import { envs } from "../../../config/index.js";

/**
 * popularPeopleList
 * @param req
 * @param res
 */
export const popularPeopleList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    let resultData = [];
    let includeQuery = [];
    let condition = {};
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;
    let whereCondition = {};
    let departmentId = reqBody.department_type;
    if (departmentId.length === 0) {
      whereCondition = { status: "active" };
    } else {
      whereCondition = {
        job_id: {
          [Op.in]: departmentId,
        },
        status: "active",
      };
    }
    const searchParams = {
      page: page,
      limit: limit,
    };

    const attributes = [
      "id",
      "poster",
      "gender",
      "tmdb_id",
      "popularity_order",
      "is_korean_birth_place",
    ];
    includeQuery = [
      {
        model: model.peopleTranslation,
        attributes: ["people_id", "name", "site_language"],
        left: true,
        where: { status: "active" },
        required: true,
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
      {
        model: model.peopleJobs,
        attributes: ["job_id", "people_id"],
        left: true,
        where: whereCondition,
        required: true,
      },
      {
        model: model.peopleImages,
        attributes: [
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
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
    ];

    condition = {
      status: "active",
    };
    searchParams.sortOrderObj = [
      [Sequelize.literal("is_korean_birth_place"), "ASC"],
      [Sequelize.literal("popularity_order"), "DESC"],
      [Sequelize.literal("people.id"), "DESC"],
    ];

    resultData = await paginationService.pagination(
      searchParams,
      model.people,
      includeQuery,
      condition,
      attributes,
    );

    const resCount =
      typeof resultData.count == "object" ? resultData.count.length : resultData.count;
    delete resultData.count;
    resultData.count = resCount;
    if (resultData.count > 0) {
      let peopleList = [];
      for (const eachRow of resultData.rows) {
        if (eachRow) {
          const record = {
            id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
            name:
              eachRow.dataValues.peopleTranslations[0] &&
              eachRow.dataValues.peopleTranslations[0].name
                ? eachRow.dataValues.peopleTranslations[0].name
                : "",
            image:
              eachRow.dataValues.peopleImages[0] && eachRow.dataValues.peopleImages[0].path
                ? eachRow.dataValues.peopleImages[0].path.replace("p/original", `p/${peopleImageW}`)
                : "",
          };
          peopleList.push(record);
        }
      }
      resultData.rows = peopleList;
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
