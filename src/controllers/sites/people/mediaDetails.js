import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { paginationService, userPermissionService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { fn, col } from "sequelize";

/**
 * mediaDetails
 * @param req
 * @param res
 */
export const mediaDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    if (!reqBody.person_id && reqBody.person_id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid people id"));
    }

    const peopleId = reqBody.person_id; //It will be people id
    const type = reqBody.type; // value will be  video/image

    let resultData = [];

    let imageIncludeQuery = [],
      videoIncludeQuery = [];

    let videoCondition = [],
      imageCondition = [];

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "created_at",
      sortOrder: "ASC",
      //raw: true,
    };

    let language = req.accept_language;

    let getInformations = await getInformationsMethod(peopleId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid people id"));

    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(req, peopleId, "people");

    if (type == "video") {
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
      resultData = await paginationService.pagination(
        searchParams,
        model.video,
        videoIncludeQuery,
        videoCondition,
        videoAttributes,
      );
    }

    if (type == "image") {
      // Media for images
      const imageAttributes = [
        ["id", "image_id"],
        [
          fn("REPLACE", col("peopleImages.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
          "path",
        ],
      ];
      imageIncludeQuery = [
        {
          model: model.people,
          attributes: [],
          left: true,
          where: { status: "active" },
          required: true,
        },
      ];

      imageCondition = {
        people_id: peopleId,
        status: "active",
        image_category: "image",
      };
      resultData = await paginationService.pagination(
        searchParams,
        model.peopleImages,
        imageIncludeQuery,
        imageCondition,
        imageAttributes,
      );
    }

    res.ok({
      id: peopleId,
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      person_name: !getInformations.peopleTranslations[0]
        ? ""
        : getInformations.peopleTranslations[0].name,
      is_edit: isEdit,
      poster_image: !getInformations.peopleImages[0] ? "" : getInformations.peopleImages[0].path,
      background_image: !getInformations.peopleImageBg[0]
        ? ""
        : getInformations.peopleImageBg[0].dataValues.bg_path,
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (peopleId, language) => {
  return await model.people.findOne({
    attributes: ["id", "birth_date", "gender"],
    where: { id: peopleId, status: "active" },
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
