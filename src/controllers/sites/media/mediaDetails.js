import model from "../../../models/index.js";
import { paginationService, userPermissionService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";
import { generalHelper } from "../../../helpers/index.js";
/**
 * mediaDetails
 * get the media details
 * @param req
 * @param res
 */
export const mediaDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const mediaId = reqBody.id;
    const type = reqBody.type; // Type Value will be video/image/poster
    let resultData = [];

    let includeQuery = [];
    let condition = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;

    const getMedia = await model.title.findOne({
      attributes: ["id", "record_status"],
      where: { id: mediaId, type: "movie", record_status: "active" },
      include: [
        {
          model: model.titleTranslation,
          left: true,
          attributes: ["name", "site_language"],
          where: { status: "active" },
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
              fn("REPLACE", col("titleImages.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
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
        },
        {
          model: model.titleImage,
          attributes: [
            ["original_name", "bg_original_name"],
            ["file_name", "bg_file_name"],
            [
              fn("REPLACE", col("titleImageBg.url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
              "bg_url",
            ],
            [
              fn(
                "REPLACE",
                col("titleImageBg.path"),
                `${envs.s3.BUCKET_URL}`,
                `${envs.aws.cdnUrl}`,
              ),
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
        },
      ],
    });

    if (!getMedia) throw StatusError.badRequest(res.__("Invalid title id"));

    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(req, mediaId, "movie");

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    if (type == "video") {
      const attributes = [
        "id",
        "title_id",
        "name",
        "thumbnail",
        "video_duration",
        "video_source",
        [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "url"],
        "type",
        "site_language",
        "created_at",
      ];

      includeQuery = [
        {
          model: model.title,
          attributes: ["record_status"],
          left: true,
          where: { record_status: "active" },
          required: true,
          include: {
            model: model.titleTranslation,
            left: true,
            attributes: ["title_id", "name", "site_language"],
            where: { status: "active" },
          },
        },
      ];

      condition = {
        title_id: mediaId,
        status: "active",
        video_for: "title",
      };
      resultData = await paginationService.pagination(
        searchParams,
        model.video,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData.count > 0) {
        let videoList = [];
        for (const eachRow of resultData.rows) {
          if (eachRow) {
            const record = {
              id: eachRow.id ? eachRow.id : "",
              title: eachRow.name ? eachRow.name : "",
              link: eachRow.url ? eachRow.url : "",
              thumb: eachRow.thumbnail ? eachRow.thumbnail : "",
              time: eachRow.video_duration
                ? await generalHelper.formatVideoDuration(
                    eachRow.video_duration,
                    eachRow.video_source,
                  )
                : "",
            };
            videoList.push(record);
          }
        }
        resultData.rows = videoList;
      }
    }
    if (type == "image") {
      const attributes = [
        "id",
        "title_id",
        "original_name",
        "file_name",
        "url",
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
      ];
      const includeQuery = [
        {
          model: model.title,
          attributes: ["type", "original_title"],
          left: true,
          where: { record_status: "active" },
          required: false,
        },
      ];

      const condition = {
        title_id: mediaId,
        status: "active",
        image_category: "image",
      };
      resultData = await paginationService.pagination(
        searchParams,
        model.titleImage,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData.count > 0) {
        let imageList = [];
        for (const eachRow of resultData.rows) {
          if (eachRow) {
            const record = {
              id: eachRow.id ? eachRow.id : "",
              link: eachRow.path ? eachRow.path : "",
            };
            imageList.push(record);
          }
        }
        resultData.rows = imageList;
      }
    }
    if (type == "poster") {
      const attributes = [
        "id",
        "title_id",
        "original_name",
        "file_name",
        "url",
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
      ];
      const includeQuery = [
        {
          model: model.title,
          attributes: ["type", "original_title"],
          left: true,
          where: { record_status: "active" },
          required: false,
        },
      ];

      const condition = {
        title_id: mediaId,
        status: "active",
        image_category: "poster_image",
      };
      resultData = await paginationService.pagination(
        searchParams,
        model.titleImage,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData.count > 0) {
        let imageList = [];
        for (const eachRow of resultData.rows) {
          if (eachRow) {
            const record = {
              id: eachRow.id ? eachRow.id : "",
              link: eachRow.path ? eachRow.path : "",
            };
            imageList.push(record);
          }
        }
        resultData.rows = imageList;
      }
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      title:
        getMedia &&
        getMedia.titleTranslations &&
        getMedia.titleTranslations.length > 0 &&
        getMedia.titleTranslations[0].name
          ? getMedia.titleTranslations[0].name
          : "",
      is_edit: isEdit,
      poster_image: !getMedia.titleImages[0] ? "" : getMedia.titleImages[0].path,
      background_image: !getMedia.titleImageBg[0]
        ? ""
        : getMedia.titleImageBg[0].dataValues.bg_path,
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
