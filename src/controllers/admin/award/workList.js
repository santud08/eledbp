import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { envs } from "../../../config/index.js";

/**
 * workList
 * @param req
 * @param res
 */
export const workList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const searchText = reqBody.search_text ? reqBody.search_text : "";
    const language = req.accept_language;

    const conditions = { record_status: "active" };
    let includeCondition = {
      status: "active",
    };
    if (searchText) {
      includeCondition[Op.and] = [
        { name: { [Op.ne]: "" } },
        { name: { [Op.like]: `%${searchText}%` } },
      ];
    } else {
      includeCondition[Op.and] = [{ name: { [Op.ne]: "" } }];
    }

    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "desc";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const attributes = ["id", "type"];

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder,
    };

    const includeQuery = [
      {
        model: model.titleTranslation,
        attributes: ["title_id", "name", "site_language"],
        where: includeCondition,
        required: true,
      },
      {
        model: model.titleImage,
        attributes: [
          "title_id",
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        ],
        left: true,
        where: {
          image_category: "poster_image",
          is_main_poster: "y",
          episode_id: null,
          original_name: {
            [Op.ne]: null,
          },
          [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
    ];
    let titleResult = await paginationService.pagination(
      searchParams,
      model.title,
      includeQuery,
      conditions,
      attributes,
    );
    let getWorkList = [];
    if (titleResult.count > 0) {
      for (let element of titleResult.rows) {
        if (element.id) {
          let workName = "";
          if (
            element.titleTranslations &&
            element.titleTranslations[0] &&
            element.titleTranslations[0].site_language == language
          ) {
            workName = element.titleTranslations[0].name;
          } else if (
            element.titleTranslations &&
            element.titleTranslations[1] &&
            element.titleTranslations[1].site_language == language
          ) {
            workName = element.titleTranslations[1].name;
          } else {
            workName = element.titleTranslations[0].name;
          }
          const requiredFormat = {
            work_id: element.id,
            work_name: workName,
            work_type: element.type,
            thumbnail:
              element.titleImages && element.titleImages[0] && element.titleImages[0].path
                ? element.titleImages[0].path
                : "",
          };
          if (workName) getWorkList.push(requiredFormat);
        }
      }
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: titleResult.count,
      total_pages: titleResult.count > 0 ? Math.ceil(titleResult.count / limit) : 0,
      results: getWorkList,
    });
  } catch (error) {
    next(error);
  }
};
