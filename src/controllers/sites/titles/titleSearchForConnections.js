import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * titleSearchForConnections
 * @param req
 * @param res
 */
export const titleSearchForConnections = async (req, res, next) => {
  try {
    const defautlPageNo = 1;
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : "";
    const searchText = req.query.search_text ? req.query.search_text : "";
    const searchType = req.query.search_type ? req.query.search_type : "";
    const page = req.query.page ? req.query.page : defautlPageNo;
    const limit = req.query.limit ? req.query.limit : PAGINATION_LIMIT;

    let data = [];
    let titleResult = [];
    const searchParams = {
      page: page,
      limit: limit,
      distinct: true,
      raw: false,
    };

    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    // finding the search_text and listing out all the search related data
    if (searchText) {
      const attributes = ["id", "type", "year", "release_date", "original_title"];
      const modelName = model.title;
      const includeQuery = [
        {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "site_language"],
          left: true,
          where: {
            [Op.and]: [{ name: { [Op.ne]: "" } }, { name: { [Op.like]: `%${searchText}%` } }],
            status: "active",
          },
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

      const condition = {
        type: searchType ? searchType : { [Op.in]: ["movie", "tv", "webtoons"] },
        record_status: "active",
      };

      titleResult = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );

      if (titleResult.count > 0) {
        for (let element of titleResult.rows) {
          const requiredFormat = {
            title_id: element.id,
            title_name:
              element.titleTranslations && element.titleTranslations[0]
                ? element.titleTranslations[0].name
                : "",
            title_type: element.type,
            title_poster:
              element.titleImages && element.titleImages[0] && element.titleImages[0].path
                ? element.titleImages[0].path
                : "",
          };
          data.push(requiredFormat);
        }
      }
      res.ok({
        page: page,
        limit: limit,
        total_records: titleResult.count,
        total_pages: titleResult.count > 0 ? Math.ceil(titleResult.count / limit) : 0,
        results: data,
      });
    }
  } catch (error) {
    next(error);
  }
};
