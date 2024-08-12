import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col, Op } from "sequelize";

/**
 * connectionList
 * @param req
 * @param res
 */
export const connectionList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const titleId = reqBody.id; //It will be title id
    let language = req.accept_language;
    let getInformations = await model.title.findOne({
      attributes: ["id", "type"],
      where: { id: titleId, record_status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));

    let getRelatedTitleList = [];

    let relatedTitleList = await getInformationsMethod(titleId, language);

    if (relatedTitleList) {
      let list = [];
      for (const eachRow of relatedTitleList) {
        if (eachRow) {
          const record = {
            id:
              eachRow.title &&
              eachRow.title.titleTranslations[0] &&
              eachRow.title.titleTranslations[0].title_id
                ? eachRow.title.titleTranslations[0].title_id
                : "",
            type: eachRow.title && eachRow.title.type ? eachRow.title.type : "",
            title:
              eachRow.title &&
              eachRow.title.titleTranslations[0] &&
              eachRow.title.titleTranslations[0].name
                ? eachRow.title.titleTranslations[0].name
                : "",
            image: eachRow.titleImages && eachRow.titleImages[0] ? eachRow.titleImages[0].path : "",
          };
          list.push(record);
        }
      }
      getRelatedTitleList = list;
    }
    res.ok({
      results: getRelatedTitleList ? getRelatedTitleList : "",
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (titleId, language) => {
  return await model.relatedTitle.findAll({
    limit: 16,
    attributes: ["related_title_id"],
    where: { title_id: titleId, status: "active" },
    include: [
      {
        model: model.title,
        attributes: ["id", "type", "record_status"],
        left: true,
        where: { record_status: "active" },
        required: true,
        include: {
          model: model.titleTranslation,
          left: true,
          attributes: ["title_id", "name", "site_language"],
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      },
      {
        model: model.titleImage,
        attributes: [
          "title_id",
          "original_name",
          "file_name",
          "url",
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        ],
        left: true,
        where: {
          status: "active",
          image_category: "poster_image",
          is_main_poster: "y",
          episode_id: null,
          original_name: {
            [Op.ne]: null,
          },
        },
        required: false,
        separate: true,
        order: [["id", "DESC"]],
      },
    ],
  });
};
