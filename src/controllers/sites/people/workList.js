import model from "../../../models/index.js";
import { Sequelize, fn, col, Op } from "sequelize";
import { StatusError, envs } from "../../../config/index.js";
import { generalHelper, customDateTimeHelper } from "../../../helpers/index.js";
import { userService } from "../../../services/index.js";

/**
 * workList
 * @param req
 * @param res
 */
export const workList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    if (!reqBody.person_id && reqBody.person_id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid people id"));
    }
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    const peopleId = reqBody.person_id; //It will be people id
    const titleType = reqBody.title_type; // value will be  movie/tv/webtoons
    const listType = reqBody.list_type; // value will be  cast/crew

    let results = [];
    let getTvDetails = [],
      getMovieDetails = [];

    let language = req.accept_language;
    const swipLanguage = await generalHelper.swipeLanguage(language);

    const getCurrentDate = await customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD");

    let getInformations = await getInformationsMethod(userId, peopleId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid people id"));

    // Work for movie
    if (titleType == "movie") {
      getMovieDetails = await model.title.findAndCountAll({
        attributes: [
          ["id", "title_id"],
          [Sequelize.fn("date_format", Sequelize.col("release_date"), "%Y"), "year"],
          [Sequelize.fn("IFNULL", Sequelize.col("titleImageOne.path"), ""), "poster_image"],
          [
            Sequelize.fn(
              "IFNULL",
              fn(
                "getTitleTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("title.id"), ""),
                language,
              ),
              fn(
                "getTitleTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("title.id"), ""),
                swipLanguage,
              ),
            ),
            "title_name",
          ],
        ],
        where: {
          type: "movie",
          record_status: "active",
          release_date: {
            [Op.lte]: getCurrentDate,
          },
        },
        include: [
          {
            model: model.creditable,
            left: true,
            attributes: ["character_name", "creditable_id", "people_id"],
            where: {
              people_id: peopleId,
              creditable_type: "title",
              department: listType,
              status: "active",
            },
            required: true,
          },
          {
            model: model.titleImage,
            as: "titleImageOne",
            attributes: [],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              is_main_poster: "y",
            },
            required: false,
            order: [["id", "DESC"]],
          },
        ],
        required: true,
        distinct: true,
        order: [["release_date", "DESC"]],
      });

      // Sorting data year wise
      if (getMovieDetails) {
        results = getMovieDetails.rows.reduce(function (r, a) {
          r[a.year] = r[a.year] || [];
          r[a.year] = { year: a.year, list: r[a.year].list || [] };
          r[a.year].list.push({
            title_id: a.dataValues.title_id,
            poster_image: a.dataValues.poster_image,
            title_name: a.dataValues.title_name,
            character_name:
              a.creditables && a.creditables.length > 0 ? a.creditables[0].character_name : "",
          });
          return r;
        }, Object.create(null));
        results = Object.values(results).reverse();
      }
    }

    // Work for Tv
    if (titleType == "tv") {
      getTvDetails = await model.creditable.findAndCountAll({
        attributes: [
          "creditable_id",
          "character_name",
          "job",
          [Sequelize.fn("date_format", Sequelize.col("seasonOne.release_date"), "%Y"), "year"],
        ],
        where: {
          people_id: peopleId,
          creditable_type: "title",
          department: listType,
          status: "active",
        },
        include: [
          {
            model: model.season,
            as: "seasonOne",
            left: true,
            attributes: ["season_name", "release_date", "release_date_to"],
            where: {
              release_date: {
                [Op.lte]: getCurrentDate,
              },
              status: "active",
            },
            required: true,
          },
          {
            model: model.title,
            left: true,
            attributes: [["id", "id"], "type"],
            where: {
              type: "tv",
              record_status: "active",
            },
            required: true,
            include: [
              {
                model: model.titleTranslation,
                attributes: ["name", "aka", "site_language"],
                left: true,
                where: { status: "active" },
                required: true,
                separate: true,
                order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
              },
              {
                model: model.titleImage,
                attributes: [
                  "original_name",
                  "file_name",
                  "url",
                  [
                    fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                    "path",
                  ],
                ],
                left: true,
                where: {
                  status: "active",
                  image_category: "poster_image",
                  is_main_poster: "y",
                  episode_id: null,
                },
                required: false,
                separate: true,
                order: [["id", "DESC"]],
              },
            ],
          },
        ],
        required: true,
        distinct: true,
      });

      //Sorting data year wise
      if (getTvDetails) {
        results = getTvDetails.rows.reduce(function (r, a) {
          r[a.dataValues.year] = r[a.dataValues.year] || [];
          r[a.dataValues.year] = { year: a.dataValues.year, list: r[a.dataValues.year].list || [] };
          r[a.dataValues.year].list.push({
            title_id: a.titles && a.titles.length > 0 ? a.titles[0].dataValues.id : "",
            poster_image:
              a.titles[0].titleImages && a.titles[0].titleImages.length > 0
                ? a.titles[0].titleImages[0].path
                : "",
            title_name:
              a.titles[0].titleTranslations && a.titles[0].titleTranslations.length > 0
                ? a.titles[0].titleTranslations[0].name
                : "",
            character_name: a.dataValues ? a.dataValues.character_name : "",
          });
          return r;
        }, Object.create(null));
        results = Object.values(results).reverse();
      }
    }

    const webtoonHide = await userService.checkUserWebtoonMenu(req);
    // Work for webtoons
    if (titleType == "webtoons" && listType == "crew" && !webtoonHide) {
      getTvDetails = await model.creditable.findAndCountAll({
        attributes: [
          "creditable_id",
          "character_name",
          "job",
          [Sequelize.fn("date_format", Sequelize.col("seasonOne.release_date"), "%Y"), "year"],
        ],
        where: {
          people_id: peopleId,
          creditable_type: "title",
          department: listType,
          status: "active",
        },
        include: [
          {
            model: model.season,
            as: "seasonOne",
            left: true,
            attributes: ["season_name", "release_date", "release_date_to"],
            where: {
              release_date: {
                [Op.lte]: getCurrentDate,
              },
              status: "active",
            },
            required: true,
          },
          {
            model: model.title,
            left: true,
            attributes: [["id", "id"], "type"],
            where: {
              type: "webtoons",
              record_status: "active",
            },
            required: true,
            include: [
              {
                model: model.titleTranslation,
                attributes: ["name", "aka", "site_language"],
                left: true,
                where: { status: "active" },
                required: true,
                separate: true,
                order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
              },
              {
                model: model.titleImage,
                attributes: [
                  "original_name",
                  "file_name",
                  "url",
                  [
                    fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                    "path",
                  ],
                ],
                left: true,
                where: {
                  status: "active",
                  image_category: "poster_image",
                  is_main_poster: "y",
                  episode_id: null,
                },
                required: false,
                separate: true,
                order: [["id", "DESC"]],
              },
            ],
          },
        ],
        required: true,
        distinct: true,
      });

      //Sorting data year wise
      if (getTvDetails) {
        results = getTvDetails.rows.reduce(function (r, a) {
          r[a.dataValues.year] = r[a.dataValues.year] || [];
          r[a.dataValues.year] = { year: a.dataValues.year, list: r[a.dataValues.year].list || [] };
          r[a.dataValues.year].list.push({
            title_id: a.titles && a.titles.length > 0 ? a.titles[0].dataValues.id : "",
            poster_image:
              a.titles[0].titleImages && a.titles[0].titleImages.length > 0
                ? a.titles[0].titleImages[0].path
                : "",
            title_name:
              a.titles[0].titleTranslations && a.titles[0].titleTranslations.length > 0
                ? a.titles[0].titleTranslations[0].name
                : "",
            character_name: a.dataValues ? a.dataValues.character_name : "",
          });
          return r;
        }, Object.create(null));
        results = Object.values(results).reverse();
      }
    }

    res.ok({
      id: peopleId,
      title_type: titleType,
      list_type: listType,
      results: results,
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (userId, peopleId, language) => {
  return await model.people.findOne({
    attributes: [
      "id",
      "birth_date",
      "gender",
      "facebook_link",
      "instagram_link",
      "twitter_link",
      [fn("peopleLikeCount", col("people.id")), "numberOfLikes"],
      [fn("isPeopleLiked", col("people.id"), userId), "is_liked"],
    ],
    where: { id: peopleId, status: "active" },
    include: [
      {
        model: model.peopleTranslation,
        attributes: [
          "people_id",
          "name",
          "description",
          "known_for",
          "birth_place",
          "site_language",
        ],
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
          "file_name",
          "url",
          [
            fn("REPLACE", col("peopleImages.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
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
          ["file_name", "bg_file_name"],
          ["url", "bg_url"],
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "bg_path"],
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
};
