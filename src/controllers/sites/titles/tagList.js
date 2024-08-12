import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * tagList
 * @param req
 * @param res
 */
export const tagList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const movieId = reqBody.id; //It will be title id
    const mainCategoryId = reqBody.main_catid; //It will be main category id
    let getTagList = [];
    const language = req.accept_language;
    let getInformations = await model.title.findOne({
      attributes: ["id", "type"],
      where: { id: movieId, record_status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));

    let getCategory = await model.tagCategory.findOne({
      attributes: ["id", "slug_name"],
      where: { id: mainCategoryId, status: "active" },
    });

    if (!getCategory) throw StatusError.badRequest(res.__("Invalid category id"));

    // Get Tag List
    let getTags = await model.tagGable.findAll({
      attributes: ["tag_id", "taggable_id", "taggable_type"],
      where: {
        taggable_id: movieId,
        taggable_type: "title",
        status: "active",
      },
      include: [
        {
          model: model.tag,
          left: true,
          attributes: ["id", "type"],
          where: { tag_main_category_id: mainCategoryId, status: "active" },
        },
        {
          model: model.tagTranslation,
          attributes: ["tag_id", "display_name", "site_language"],
          left: true,
          where: { status: "active" },
          required: false,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
    });

    if (getTags) {
      let list = [];
      for (const eachRow of getTags) {
        if (eachRow) {
          let record = {
            id:
              eachRow.tagTranslations[0] && eachRow.tagTranslations[0].tag_id
                ? eachRow.tagTranslations[0].tag_id
                : "",
            title:
              eachRow.tagTranslations[0] && eachRow.tagTranslations[0].display_name
                ? eachRow.tagTranslations[0].display_name
                : "",
          };

          list.push(record);
        }
      }
      getTagList = list;
    }
    res.ok({
      results: getTagList ? getTagList : "",
    });
  } catch (error) {
    next(error);
  }
};
