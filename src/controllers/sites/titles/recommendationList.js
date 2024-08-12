import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { StatusError, envs } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { TITLE_SETTINGS } from "../../../utils/constants.js";

/**
 * recommendationList
 * @param req
 * @param res
 */
export const recommendationList = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const titleId = reqBody.id; //It will be title id
    let getGenreList = [];
    let language = req.accept_language;
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;

    const reqDate = reqBody.date ? reqBody.date : null;
    let getCurrentDate = null;
    if (reqDate) {
      getCurrentDate = await customDateTimeHelper.changeDateFormat(reqDate, "YYYY-MM-DD");
    } else {
      getCurrentDate = await customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD");
    }
    let getInformations = await model.title.findOne({
      attributes: ["id", "type"],
      where: { id: titleId, record_status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));
    const type = getInformations.type;
    // Get Genre
    let getGenre = await model.tagGable.findAll({
      attributes: ["tag_id", "taggable_id", "taggable_type"],
      where: {
        taggable_id: titleId,
        taggable_type: "title",
        status: "active",
      },
      include: [
        {
          model: model.tag,
          left: true,
          attributes: ["id", "type"],
          where: { type: "genre", status: "active" },
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

    if (getGenre) {
      let list = [];
      for (const eachRow of getGenre) {
        if (eachRow) {
          let tag_id = eachRow.tagTranslations[0].tag_id ? eachRow.tagTranslations[0].tag_id : "";
          list.push(tag_id);
        }
      }
      getGenreList = list;
    }

    let getRecommendationList = [];

    let recommendationList = await getInformationsMethod(
      titleId,
      getGenreList,
      language,
      type,
      getCurrentDate,
    );

    if (recommendationList) {
      let list = [];
      for (const eachRow of recommendationList) {
        if (eachRow) {
          let record = {
            id: eachRow.title.titleTranslations[0].title_id
              ? eachRow.title.titleTranslations[0].title_id
              : "",
            title: eachRow.title.titleTranslations[0].name
              ? eachRow.title.titleTranslations[0].name
              : "",
            image:
              eachRow.titleImages && eachRow.titleImages[0]
                ? eachRow.titleImages[0].path.replace("p/original", `p/${tittleImageW}`)
                : "",
          };
          list.push(record);
        }
      }
      getRecommendationList = list;
    }
    res.ok({
      results: getRecommendationList ? getRecommendationList : "",
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (titleId, getGenreList, language, type, getCurrentDate) => {
  let includesObj = [],
    orderObj = [];
  let conditions = {};
  if (type == "movie") {
    includesObj = [
      {
        model: model.tag,
        attributes: ["type"],
        left: true,
        where: { type: "genre", status: "active" },
        required: true,
      },
      {
        model: model.title,
        attributes: ["id", "record_status", "release_date"],
        left: true,
        where: { record_status: "active", type: type },
        required: true,
        include: [
          {
            model: model.titleTranslation,
            left: true,
            attributes: ["title_id", "name", "site_language"],
            where: { status: "active" },
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleReRelease,
            attributes: ["title_id", "re_release_date"],
            left: true,
            where: {
              status: "active",
            },
            required: false,
          },
        ],
      },
      {
        model: model.titleImage,
        attributes: [
          "title_id",
          "file_name",
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        ],
        left: true,
        where: {
          status: "active",
          image_category: "poster_image",
          is_main_poster: "y",
          episode_id: {
            [Op.eq]: null,
          },
          path: {
            [Op.ne]: null,
          },
        },
        limit: 1,
        required: false,
      },
    ];
    orderObj = [
      [model.title, "release_date", "DESC"],
      [model.title, model.titleReRelease, "re_release_date", "DESC"],
      [model.title, "id", "DESC"],
    ];
    conditions = {
      taggable_id: {
        [Op.ne]: titleId,
      },
      tag_id: {
        [Op.in]: getGenreList,
      },
      taggable_type: "title",
      status: "active",
      [Op.or]: [
        {
          "$title.release_date$": {
            [Op.and]: {
              [Op.lte]: getCurrentDate,
              [Op.ne]: null,
            },
          },
        },
        {
          "$title.titleReReleases.re_release_date$": {
            [Op.and]: {
              [Op.lte]: getCurrentDate,
              [Op.ne]: null,
            },
          },
        },
      ],
    };
  }
  if (type == "tv") {
    includesObj = [
      {
        model: model.tag,
        attributes: ["type"],
        left: true,
        where: { type: "genre", status: "active" },
        required: true,
      },
      {
        model: model.title,
        attributes: ["id", "record_status", "release_date"],
        left: true,
        where: { record_status: "active", type: type },
        required: true,
        include: [
          {
            model: model.titleTranslation,
            left: true,
            attributes: ["title_id", "name", "site_language"],
            where: { status: "active" },
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.season,
            attributes: ["id", "release_date", "number"],
            left: true,
            where: {
              status: "active",
              release_date: {
                [Op.and]: {
                  [Op.lte]: getCurrentDate,
                  [Op.ne]: null,
                },
              },
            },
            required: false,
          },
        ],
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
          episode_id: {
            [Op.eq]: null,
          },
          path: {
            [Op.ne]: null,
          },
        },
        limit: 1,
        required: false,
      },
    ];
    orderObj = [
      [model.title, model.season, "release_date", "DESC"],
      [model.title, "id", "DESC"],
    ];
    conditions = {
      taggable_id: {
        [Op.ne]: titleId,
      },
      tag_id: {
        [Op.in]: getGenreList,
      },
      taggable_type: "title",
      status: "active",
    };
  }
  return await model.tagGable.findAll({
    limit: 16,
    attributes: ["taggable_id", "taggable_type"],
    where: conditions,
    group: ["taggable_id"],
    include: includesObj,
    order: orderObj ? orderObj : false,
    subQuery: false,
  });
};
