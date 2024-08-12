import model from "../../../models/index.js";
import { paginationService, userPermissionService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op, fn, col } from "sequelize";
import { generalHelper } from "../../../helpers/index.js";

/**
 * seasonTvMediaDetails
 * @param req
 * @param res
 */

export const seasonTvMediaDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const mediaId = reqBody.id;
    const seasonId = reqBody.season_id;
    const type = reqBody.type; // Type Value will be video/image/poster
    let resultData = [];
    let includeQuery = [];
    let condition = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const language = req.accept_language;

    // Check mediaId & season id is exist
    const getMedia = await model.title.findOne({
      attributes: [
        "id",
        "type",
        "release_date",
        "year",
        "country",
        "certification",
        "runtime",
        "language",
        "footfalls",
        "affiliate_link",
        "rating",
        "tmdb_vote_average",
        "record_status",
      ],
      where: { id: mediaId, type: "tv", record_status: "active" },
      include: [
        {
          model: model.titleTranslation,
          left: true,
          attributes: ["title_id", "name"],
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
            [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "url"],
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
            image_category: "poster_image",
            is_main_poster: "y",
            original_name: {
              [Op.ne]: null,
            },
          },
          required: false,
        },
        {
          model: model.titleImage,
          attributes: [
            ["original_name", "bg_original_name"],
            ["file_name", "bg_file_name"],
            ["url", "bg_url"],
            ["path", "bg_path"],
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
        {
          model: model.season,
          attributes: ["id", "title_id", "season_name"],
          left: true,
          where: {
            id: seasonId,
            status: "active",
          },
          include: [
            {
              model: model.seasonTranslation,
              attributes: ["id", "season_id", "season_name", "site_language"],
              left: true,
              where: { status: "active" },
              required: false,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          ],
          required: true,
        },
      ],
    });

    if (!getMedia) throw StatusError.badRequest(res.__("Invalid title or season id"));

    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(req, mediaId, "tv");

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };
    // get video list
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
      ];

      condition = {
        title_id: mediaId,
        season: seasonId,
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
              video_id: eachRow.id ? eachRow.id : "",
              video_name: eachRow.name ? eachRow.name : "",
              video_link: eachRow.url ? eachRow.url : "",
              video_thumb: eachRow.thumbnail ? eachRow.thumbnail : "",
              video_time: eachRow.video_duration
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
    // get image list
    if (type == "image") {
      const attributes = [
        "id",
        "title_id",
        "original_name",
        "file_name",
        [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "url"],
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
      ];
      const includeQuery = [
        {
          model: model.title,
          attributes: ["type", "original_title"],
          left: true,
          where: { record_status: "active" },
          required: true,
        },
      ];

      const condition = {
        title_id: mediaId,
        season_id: seasonId,
        status: "active",
        image_category: "image",
        original_name: {
          [Op.ne]: null,
        },
        episode_id: {
          [Op.eq]: null,
        },
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
              image_id: eachRow.id ? eachRow.id : "",
              image_link: eachRow.path ? eachRow.path : "",
            };
            imageList.push(record);
          }
        }
        resultData.rows = imageList;
      }
    }
    // get poster list
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
          required: true,
        },
      ];

      const condition = {
        title_id: mediaId,
        season_id: seasonId,
        status: "active",
        image_category: "poster_image",
        original_name: {
          [Op.ne]: null,
        },
        episode_id: {
          [Op.eq]: null,
        },
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
              poster_image_id: eachRow.id ? eachRow.id : "",
              poster_image_link: eachRow.path ? eachRow.path : "",
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
      title_name:
        getMedia &&
        getMedia.titleTranslations &&
        getMedia.titleTranslations.length > 0 &&
        getMedia.titleTranslations[0] &&
        getMedia.titleTranslations[0].name
          ? getMedia.titleTranslations[0].name
          : "",
      is_edit: isEdit,
      title_poster_image: !getMedia.titleImages[0] ? "" : getMedia.titleImages[0].path,
      background_image: !getMedia.titleImageBg[0]
        ? ""
        : getMedia.titleImageBg[0].dataValues.bg_path,
      season_id:
        getMedia &&
        getMedia.dataValues.seasons &&
        getMedia.dataValues.seasons.length > 0 &&
        getMedia.dataValues.seasons[0] &&
        getMedia.dataValues.seasons[0].id
          ? getMedia.dataValues.seasons[0].id
          : "",
      season_name:
        getMedia &&
        getMedia.dataValues.seasons &&
        getMedia.dataValues.seasons.length > 0 &&
        getMedia.dataValues.seasons[0] &&
        getMedia.dataValues.seasons[0].dataValues.seasonTranslations &&
        getMedia.dataValues.seasons[0].dataValues.seasonTranslations.length > 0 &&
        getMedia.dataValues.seasons[0].dataValues.seasonTranslations[0].season_name
          ? getMedia.dataValues.seasons[0].dataValues.seasonTranslations[0].season_name
          : "",
      tv_season_meadia_list: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
