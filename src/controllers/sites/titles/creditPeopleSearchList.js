import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

/**
 * creditPeopleSearchList
 * @param req
 * @param res
 */
export const creditPeopleSearchList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const defautlPageNo = 1;
    const page = req.body.page ? req.body.page : defautlPageNo;
    const limit = req.body.limit ? req.body.limit : PAGINATION_LIMIT;
    const searchText = req.body.search_text ? req.body.search_text : "";
    let data = [];
    let peopleResult = [];
    const language = req.body.site_language;
    const searchParams = {
      page: page,
      limit: limit,
      distinct: true,
      raw: false,
    };

    // finding the search_text and listing out all the search related data
    if (searchText) {
      const attributes = [
        "id",
        [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
      ];
      const modelName = model.people;
      const includeQuery = [
        {
          model: model.peopleTranslation,
          attributes: ["name"],
          left: true,
          where: {
            name: { [Op.like]: `%${searchText}%` },
            site_language: language,
            status: "active",
          },
          required: true,
        },
      ];

      const condition = {
        status: "active",
      };

      peopleResult = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );
      if (peopleResult.count > 0) {
        for (let element of peopleResult.rows) {
          const requiredFormat = {
            people_id: element.id,
            people_name:
              element.peopleTranslations && element.peopleTranslations[0]
                ? element.peopleTranslations[0].name
                : "",
            people_poster: element.poster,
          };
          data.push(requiredFormat);
        }
      }
      res.ok({
        page: page,
        limit: limit,
        total_records: peopleResult.count,
        total_pages: peopleResult.count > 0 ? Math.ceil(peopleResult.count / limit) : 0,
        results: data,
      });
    }
  } catch (error) {
    next(error);
  }
};
