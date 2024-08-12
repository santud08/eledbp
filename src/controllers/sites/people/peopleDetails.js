import model from "../../../models/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import {
  paginationService,
  awardService,
  userPermissionService,
  userService,
} from "../../../services/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * peopleDetails
 * @param req
 * @param res
 */
export const peopleDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid people id"));
    }
    const peopleId = reqBody.id; //It will be people id
    let getCountryList = "";
    let getDepartmentList = "";

    let imageResultData = [],
      videoResultData = [];

    let imageIncludeQuery = [],
      videoIncludeQuery = [];

    let videoCondition = [],
      imageCondition = [];

    const page = 1;
    const limit = 3;

    let language = req.accept_language;
    const getCurrentDate = await customDateTimeHelper.getCurrentDateTime("YYYY-MM-DD");

    let getInformations = await getInformationsMethod(userId, peopleId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid people id"));

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    const searchImageParams = {
      page: 1,
      limit: 5,
      sortBy: "id",
      sortOrder: "desc",
    };

    // Get Country
    const getCountry = await model.peopleCountries.findAll({
      attributes: ["people_id", "country_id", "birth_place"],
      where: {
        people_id: peopleId,
        birth_place: { [Op.ne]: null },
        status: "active",
      },
    });

    if (getCountry) {
      let list = [];
      for (const eachRow of getCountry) {
        if (eachRow) {
          const name = eachRow && eachRow.birth_place ? eachRow.birth_place : "";
          list.push(name);
        }
      }
      getCountryList = list;
    }

    // Get Department
    const getDepartment = await model.peopleJobs.findAll({
      attributes: ["people_id", "job_id"],
      where: { people_id: peopleId, status: "active" },
      include: [
        {
          model: model.department,
          left: true,
          attributes: ["id"],
          where: { status: "active" },
          required: true,
          include: {
            model: model.departmentTranslation,
            attributes: ["department_id", "department_name", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        },
      ],
    });

    if (getDepartment) {
      let list = [];
      for (const eachRow of getDepartment) {
        if (eachRow) {
          const name =
            eachRow.department &&
            eachRow.department.departmentTranslations[0] &&
            eachRow.department.departmentTranslations[0].department_name
              ? eachRow.department.departmentTranslations[0].department_name
              : "";
          list.push(name);
        }
      }
      getDepartmentList = list;
    }

    // Media for videos
    const videoAttributes = [
      ["id", "video_id"],
      ["name", "title"],
      ["thumbnail", "thumb"],
      ["video_duration", "time"],
      ["video_source", "type"],
      [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
    ];

    videoIncludeQuery = [
      {
        model: model.people,
        attributes: [],
        left: true,
        where: { status: "active" },
        required: true,
      },
    ];

    videoCondition = {
      title_id: peopleId,
      status: "active",
      video_for: "people",
    };
    videoResultData = await paginationService.pagination(
      searchParams,
      model.video,
      videoIncludeQuery,
      videoCondition,
      videoAttributes,
    );

    // Media for images
    const imageAttributes = [
      ["id", "image_id"],
      [Sequelize.fn("IFNULL", null, ""), "title"],
      [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
    ];
    imageIncludeQuery = [
      {
        model: model.people,
        attributes: [],
        left: true,
        where: { status: "active" },
        required: false,
      },
    ];

    imageCondition = {
      people_id: peopleId,
      status: "active",
      image_category: "image",
    };
    imageResultData = await paginationService.pagination(
      searchImageParams,
      model.peopleImages,
      imageIncludeQuery,
      imageCondition,
      imageAttributes,
    );

    // Work Cast count for movie
    const getMovieCast = await model.title.findAndCountAll({
      attributes: [
        ["id", "title_id"],
        [Sequelize.fn("date_format", Sequelize.col("release_date"), "%Y"), "year"],
        [Sequelize.fn("IFNULL", Sequelize.col("titleImageOne.path"), ""), "poster_image"],
        [Sequelize.fn("IFNULL", Sequelize.col("titleTranslationOne.name"), ""), "title_name"],
      ],
      where: {
        type: "movie",
        release_date: {
          [Op.lte]: getCurrentDate,
        },
      },
      include: [
        {
          model: model.creditable,
          left: true,
          attributes: ["character_name"],
          where: {
            people_id: peopleId,
            creditable_type: "title",
            department: "cast",
            status: "active",
          },
          required: true,
        },
        {
          model: model.titleTranslation,
          as: "titleTranslationOne",
          attributes: [],
          left: true,
          where: { status: "active" },
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

    // Work Crew count for movie
    const getMovieCrew = await model.title.findAndCountAll({
      attributes: [
        ["id", "title_id"],
        [Sequelize.fn("date_format", Sequelize.col("release_date"), "%Y"), "year"],
        [Sequelize.fn("IFNULL", Sequelize.col("titleImageOne.path"), ""), "poster_image"],
        [Sequelize.fn("IFNULL", Sequelize.col("titleTranslationOne.name"), ""), "title_name"],
      ],
      where: {
        type: "movie",
        release_date: {
          [Op.lte]: getCurrentDate,
        },
      },
      include: [
        {
          model: model.creditable,
          left: true,
          attributes: ["character_name"],
          where: {
            people_id: peopleId,
            creditable_type: "title",
            department: "crew",
            status: "active",
          },
          required: true,
        },
        {
          model: model.titleTranslation,
          as: "titleTranslationOne",
          attributes: [],
          left: true,
          where: { status: "active" },
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

    // Work Cast count for Tv
    const getTvCast = await model.creditable.findAndCountAll({
      attributes: [
        "creditable_id",
        "character_name",
        "job",
        [Sequelize.fn("date_format", Sequelize.col("seasonOne.release_date"), "%Y"), "year"],
      ],
      where: {
        people_id: peopleId,
        creditable_type: "title",
        department: "cast",
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
          attributes: [["id", "title_id"], "type"],
          where: {
            type: "tv",
            record_status: "active",
          },
          required: true,
          include: [
            {
              model: model.titleTranslation,
              attributes: ["name", "aka"],
              left: true,
              where: { status: "active" },
              required: true,
            },
            {
              model: model.titleImage,
              attributes: ["original_name", "file_name", "url", "path"],
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
        },
      ],
      required: true,
      distinct: true,
    });

    // Work Crew count for Tv
    const getTvCrew = await model.creditable.findAndCountAll({
      attributes: [
        "creditable_id",
        "character_name",
        "job",
        [Sequelize.fn("date_format", Sequelize.col("seasonOne.release_date"), "%Y"), "year"],
      ],
      where: {
        people_id: peopleId,
        creditable_type: "title",
        department: "crew",
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
          attributes: [["id", "title_id"], "type"],
          where: {
            type: "tv",
            record_status: "active",
          },
          required: true,
          include: [
            {
              model: model.titleTranslation,
              attributes: ["name", "aka"],
              left: true,
              where: { status: "active" },
              required: true,
            },
            {
              model: model.titleImage,
              attributes: ["original_name", "file_name", "url", "path"],
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
        },
      ],
      required: true,
      distinct: true,
    });

    // Work Crew count for webtoons
    const webtoonHide = await userService.checkUserWebtoonMenu(req);
    let getWebtoonsCrew = { rows: [], count: 0 };
    if (!webtoonHide) {
      getWebtoonsCrew = await model.creditable.findAndCountAll({
        attributes: [
          "creditable_id",
          "character_name",
          "job",
          [Sequelize.fn("date_format", Sequelize.col("seasonOne.release_date"), "%Y"), "year"],
        ],
        where: {
          people_id: peopleId,
          creditable_type: "title",
          department: "crew",
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
            attributes: [["id", "title_id"], "type"],
            where: {
              type: "webtoons",
              record_status: "active",
            },
            required: true,
            include: [
              {
                model: model.titleTranslation,
                attributes: ["name", "aka"],
                left: true,
                where: { status: "active" },
                required: true,
              },
              {
                model: model.titleImage,
                attributes: ["original_name", "file_name", "url", "path"],
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
          },
        ],
        required: true,
        distinct: true,
      });
    }

    const awards = await awardService.getPeopleWinnerAndNomineeCount(peopleId);
    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(req, peopleId, "people");

    let biography =
      getInformations.peopleTranslations[0] && getInformations.peopleTranslations[0].description
        ? getInformations.peopleTranslations[0].description
        : "";
    if (biography == "")
      biography =
        getInformations.peopleTranslations[1] && getInformations.peopleTranslations[1].description
          ? getInformations.peopleTranslations[1].description
          : "";
    res.ok({
      id: getInformations.id ? getInformations.id : "",
      name:
        getInformations.peopleTranslations[0] && getInformations.peopleTranslations[0].name
          ? getInformations.peopleTranslations[0].name
          : "",
      is_edit: isEdit,
      gender: getInformations.gender ? getInformations.gender : "",
      dob: getInformations.birth_date
        ? await customDateTimeHelper.changeDateFormat(getInformations.birth_date, "MMM DD,YYYY")
        : "",
      death_date: getInformations.death_date
        ? await customDateTimeHelper.changeDateFormat(getInformations.death_date, "MMM DD,YYYY")
        : "",
      poster_image: !getInformations.peopleImages[0] ? "" : getInformations.peopleImages[0].path,
      bg_image: !getInformations.peopleImageBg[0]
        ? ""
        : getInformations.peopleImageBg[0].dataValues.bg_path,
      profession: getDepartmentList,
      countries: getCountryList,
      biography: biography,
      aka:
        getInformations.peopleTranslations[0] && getInformations.peopleTranslations[0].known_for
          ? getInformations.peopleTranslations[0].known_for
          : "",
      no_of_likes: getInformations.dataValues.numberOfLikes
        ? getInformations.dataValues.numberOfLikes
        : 0,
      is_liked: getInformations.dataValues.is_liked ? getInformations.dataValues.is_liked : "n",
      social_media: {
        facebook: getInformations.facebook_link ? getInformations.facebook_link : "",
        instagram: getInformations.instagram_link ? getInformations.instagram_link : "",
        twitter: getInformations.twitter_link ? getInformations.twitter_link : "",
      },
      awards: awards ? awards : {},
      media: {
        videos: videoResultData.count > 0 ? videoResultData.rows : [],
        images: imageResultData.count > 0 ? imageResultData.rows : [],
      },
      works: {
        movies: [
          {
            type: "cast",
            no_of_count: getMovieCast.count,
          },
          {
            type: "crew",
            no_of_count: getMovieCrew.count,
          },
        ],
        tv: [
          {
            type: "cast",
            no_of_count: getTvCast.count,
          },
          {
            type: "crew",
            no_of_count: getTvCrew.count,
          },
        ],
        webtoons: [
          {
            type: "crew",
            no_of_count: getWebtoonsCrew.count,
          },
        ],
      },
      ads: "",
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
      "death_date",
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
