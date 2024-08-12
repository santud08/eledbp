import model from "../../../models/index.js";
import { fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";

/**
 * search
 * @param req
 * @param res
 */
export const tagDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const tagId = reqBody.tag_id;
    const type = reqBody.type; //value will be all/movie/tv/webtoons
    let data = [];
    const showDay = "";
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    let includeQuery = [];
    let condition = [];

    const language = req.accept_language;
    let searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    let whereTitleQuery =
      type != "all" ? { type: type, record_status: "active" } : { record_status: "active" };
    const attributes = ["tag_id", "taggable_id", "taggable_type"];
    const modelName = model.tagGable;
    let getTag = await model.tag.findOne({
      where: { status: "active", id: tagId },
      attributes: ["id", "name"],
      include: {
        model: model.tagTranslation,
        left: true,
        attributes: ["display_name", "site_language"],
        where: { status: "active" },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
    });
    if (!getTag) throw StatusError.badRequest(res.__("Invalid tag id"));

    includeQuery = [
      {
        model: model.title,
        attributes: ["id", "release_date", "type", "title_status"],
        left: true,
        where: whereTitleQuery,
        required: true,
        include: {
          model: model.titleTranslation,
          left: true,
          attributes: ["name", "description", "site_language"],
          where: { status: "active" },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      },
      {
        model: model.titleImage,
        attributes: [
          "title_id",
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
      },
    ];

    condition = {
      tag_id: tagId,
      taggable_type: "title",
      status: "active",
    };
    const result = await paginationService.pagination(
      searchParams,
      modelName,
      includeQuery,
      condition,
      attributes,
    );

    if (result.count > 0) {
      for (let element of result.rows) {
        const requiredFormat = {
          id: element.taggable_id,
          type: element.title && element.title.type ? element.title.type : "",
          title:
            element.title.titleTranslations && element.title.titleTranslations[0]
              ? element.title.titleTranslations[0].name
              : "",
          release_date: element.title.release_date,
          tag_status:
            element.title.title_status && type == "webtoons" ? element.title.title_status : "",
          overview:
            element.title.titleTranslations && element.title.titleTranslations[0]
              ? element.title.titleTranslations[0].description
              : "",
          poster_image:
            element.titleImages && element.titleImages[0] && element.titleImages[0].path
              ? element.titleImages[0].path
              : "",
          show_day: showDay,
        };
        data.push(requiredFormat);
      }
    }

    res.ok({
      tag_name:
        getTag &&
        getTag.tagTranslations &&
        getTag.tagTranslations[0] &&
        getTag.tagTranslations[0].display_name
          ? getTag.tagTranslations[0].display_name
          : "",
      page: page,
      limit: limit,
      total_records: result.count,
      total_pages: result.count > 0 ? Math.ceil(result.count / limit) : 0,
      results: data,
    });
  } catch (error) {
    next(error);
  }
};
