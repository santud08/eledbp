import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";

/**
 * seriesList
 * @param req
 * @param res
 */
export const seriesList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const movieId = reqBody.id; //It will be movie id
    let language = req.accept_language;
    let getInformations = await model.title.findOne({
      attributes: ["id", "type"],
      where: { id: movieId, record_status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));

    let getRelatedSeriesList = [];

    let relatedSeriesList = await getInformationsMethod(movieId, language);

    if (relatedSeriesList) {
      let list = [];
      for (const eachRow of relatedSeriesList) {
        if (eachRow) {
          let record = {
            id: eachRow.title.titleTranslations[0].title_id
              ? eachRow.title.titleTranslations[0].title_id
              : "",
            title: eachRow.title.titleTranslations[0].name
              ? eachRow.title.titleTranslations[0].name
              : "",
            image: eachRow.titleImages && eachRow.titleImages[0] ? eachRow.titleImages[0].path : "",
          };
          list.push(record);
        }
      }
      getRelatedSeriesList = list;
    }
    res.ok({
      results: getRelatedSeriesList ? getRelatedSeriesList : "",
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (movieId, language) => {
  return await model.relatedSeriesTitle.findAll({
    limit: 16,
    attributes: ["related_series_title_id"],
    where: { title_id: movieId, status: "active" },
    include: [
      {
        model: model.title,
        attributes: ["id", "record_status"],
        left: true,
        where: { record_status: "active" },
        required: true,
        include: {
          model: model.titleTranslation,
          left: true,
          attributes: ["title_id", "name", "site_language"],
          where: { status: "active" },
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
        },
        required: false,
      },
    ],
  });
};
