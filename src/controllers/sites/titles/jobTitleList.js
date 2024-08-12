import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { paginationService } from "../../../services/index.js";

/**
 * jobTitleList
 * @param req
 * @param res
 */
export const jobTitleList = async (req, res, next) => {
  try {
    let data = [];
    let jobResult = [];
    const userId = req.userDetails ? req.userDetails.userId : "";
    const language = req.query.site_language ? req.query.site_language : req.accept_language;
    if (userId) {
      // check for user existance in user table
      const isExists = await model.user.findOne({ where: { id: userId } });
      if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));
    }

    // Getting the list from department and department Translation
    const searchParams = {
      distinct: true,
      raw: false,
    };
    const condition = {
      status: "active",
    };
    const attributes = ["id"];
    const modelName = model.department;
    const includeQuery = [
      {
        model: model.departmentTranslation,
        attributes: ["department_name", "site_language"],
        left: true,
        where: {
          status: "active",
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        required: true,
      },
    ];

    jobResult = await paginationService.pagination(
      searchParams,
      modelName,
      includeQuery,
      condition,
      attributes,
    );
    if (jobResult.count > 0) {
      for (let element of jobResult.rows) {
        let requiredFormat = {
          department_id: element.id,
          department_name:
            element.departmentTranslations && element.departmentTranslations[0]
              ? element.departmentTranslations[0].department_name
              : "",
        };
        data.push(requiredFormat);
      }
    }
    res.ok({ results: data });
  } catch (error) {
    next(error);
  }
};
