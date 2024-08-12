import model from "../../../models/index.js";
import { fn, col } from "sequelize";
import { StatusError, envs } from "../../../config/index.js";
import { awardService } from "../../../services/index.js";

/**
 * awardItemsDetails
 * @param req
 * @param res
 */
export const awardItemsDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid id"));
    }
    if (!reqBody.type && reqBody.type == "undefined") {
      throw StatusError.badRequest(res.__("Invalid type"));
    }
    const id = reqBody.id; //It will be people/title id
    const type = reqBody.type; //It will be type people/movie/tv/webtoons
    let language = req.accept_language;
    let results = [];
    let others = [];
    let posterImage = "",
      bgImage = "",
      itemName = "";
    if (type == "people") {
      const getPeople = await model.people.findOne({
        attributes: ["id"],
        where: { id: id, status: "active" },
        include: [
          {
            model: model.peopleTranslation,
            attributes: ["name"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.peopleImages,
            attributes: [
              "original_name",
              "url",
              [
                fn(
                  "REPLACE",
                  col("peopleImages.path"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "path",
              ],
            ],
            left: true,
            where: {
              image_category: "poster_image",
              is_main_poster: "y",
              status: "active",
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
          {
            model: model.peopleImages,
            attributes: [
              ["original_name", "bg_original_name"],
              ["url", "bg_url"],
              [
                fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                "bg_path",
              ],
            ],
            left: true,
            as: "peopleImageBg",
            where: {
              status: "active",
              image_category: "bg_image",
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ],
      });
      if (!getPeople) throw StatusError.badRequest(res.__("Invalid id"));
      //
      itemName = !getPeople.peopleTranslations[0] ? "" : getPeople.peopleTranslations[0].name;
      posterImage = !getPeople.peopleImages[0] ? "" : getPeople.peopleImages[0].path;
      bgImage = !getPeople.peopleImageBg[0] ? "" : getPeople.peopleImageBg[0].dataValues.bg_path;
      [results, others] = await Promise.all([
        awardService.getPeopleNomineeListDetails(id, language),
        awardService.getPeopleOtherNomineeListDetails(id, language),
      ]);
    } else {
      const getTitle = await model.title.findOne({
        attributes: ["id"],
        where: { id: id, type: type, record_status: "active" },
        include: [
          {
            model: model.titleTranslation,
            left: true,
            attributes: ["name", "aka", "description", "plot_summary", "site_language"],
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "url",
              [
                fn(
                  "REPLACE",
                  col("titleImage.path"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "path",
              ],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              ["original_name", "bg_original_name"],
              ["file_name", "bg_file_name"],
              ["url", "bg_url"],
              [
                fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                "bg_path",
              ],
            ],
            left: true,
            as: "titleImageBg",
            where: {
              status: "active",
              image_category: "bg_image",
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ],
      });
      if (!getTitle) throw StatusError.badRequest(res.__("Invalid id"));
      //
      itemName =
        getTitle.titleTranslations[0] && getTitle.titleTranslations[0].name
          ? getTitle.titleTranslations[0].name
          : "";
      posterImage = !getTitle.titleImages[0] ? "" : getTitle.titleImages[0].path;
      bgImage = !getTitle.titleImageBg[0] ? "" : getTitle.titleImageBg[0].dataValues.bg_path;
      results = await awardService.getTitleNomineeListDetails(id, type, language);
    }
    const retResult = {
      item_id: id,
      type: type,
      item_name: itemName,
      poster_image: posterImage,
      bg_image: bgImage,
      results: results,
    };
    if (type == "people") {
      retResult.others = others;
    }
    res.ok(retResult);
  } catch (error) {
    next(error);
  }
};
