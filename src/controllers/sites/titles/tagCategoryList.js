import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * tagCategoryList
 * @param req
 * @param res
 */
export const tagCategoryList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const movieId = reqBody.id; //It will be title id
    let getParentCategoryList = [];
    let getTags = [];
    let language = req.accept_language;
    let getInformations = await model.title.findOne({
      attributes: ["id", "type"],
      where: { id: movieId, record_status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));

    // Get parent category
    let getParentCategory = await model.tagCategory.findAll({
      attributes: ["id", "slug_name"],
      where: { parent_id: 0, status: "active" },
      include: [
        {
          model: model.tagCategoryTranslation,
          left: true,
          attributes: ["category_name", "tag_category_id", "site_language"],
          where: { status: "active" },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
    });

    if (getParentCategory) {
      let list = [];
      for (const eachRow of getParentCategory) {
        if (eachRow) {
          let parent_id = eachRow.id ? eachRow.id : "";
          // Get Tag List

          getTags = await getInformationsMethod(movieId, parent_id, language);

          if (getTags) {
            let record = {
              id: parent_id,
              title:
                eachRow.tagCategoryTranslations[0] &&
                eachRow.tagCategoryTranslations[0].category_name
                  ? eachRow.tagCategoryTranslations[0].category_name
                  : "",
            };

            list.push(record);
          }
        }
        getParentCategoryList = list;
      }
    }
    res.ok({
      results: getParentCategoryList ? getParentCategoryList : "",
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (movieId, parent_id, language) => {
  return await model.tagGable.findOne({
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
        where: { tag_main_category_id: parent_id, status: "active" },
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
};
