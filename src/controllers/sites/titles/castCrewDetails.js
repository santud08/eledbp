import model from "../../../models/index.js";
import { paginationService, userPermissionService } from "../../../services/index.js";
import { PAGINATION_LIMIT, PEOPLE_SETTINGS } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";

/**
 * castCrewDetails
 * @param req
 * @param res
 */
export const castCrewDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const mediaId = reqBody.id;
    const type = reqBody.type; // Type Value will be cast/crew
    let resultData = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;

    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;

    const getMedia = await model.title.findOne({
      attributes: ["id", "type", "record_status"],
      where: { id: mediaId, record_status: "active" },
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
              fn("REPLACE", col("titleImage.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
              "path",
            ],
          ],
          left: true,
          where: { image_category: "poster_image", is_main_poster: "y" },
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
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "bg_path"],
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

    if (!getMedia) throw StatusError.badRequest(res.__("Invalid title id"));

    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(req, mediaId, getMedia.type);

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "list_order",
      sortOrder: "ASC",
    };

    if (type == "cast" || type == "crew") {
      const attributes = [
        "people_id",
        "creditable_id",
        "department",
        "creditable_type",
        "character_name",
        "job",
        "list_order",
      ];
      const includeQuery = [
        {
          model: model.people,
          attributes: [
            "id",
            [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          ],
          left: true,
          where: { status: "active" },
          required: true,
          include: [
            {
              model: model.peopleTranslation,
              attributes: ["name", "known_for", "site_language"],
              left: true,
              where: { status: "active" },
              required: true,
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
          ],
        },
      ];

      const condition = {
        creditable_id: mediaId,
        department: type,
        status: "active",
        creditable_type: "title",
      };

      resultData = await paginationService.pagination(
        searchParams,
        model.creditable,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData.count > 0) {
        let imageList = [];
        for (const eachRow of resultData.rows) {
          if (eachRow) {
            const departmentType =
              eachRow.department == "cast" ? eachRow.character_name : eachRow.job;
            const record = {
              id: eachRow.people_id ? eachRow.people_id : "",
              name:
                eachRow.person &&
                eachRow.person.peopleTranslations[0] &&
                eachRow.person.peopleTranslations[0].name
                  ? eachRow.person.peopleTranslations[0].name
                  : "",
              designation: departmentType ? departmentType : "",
              image:
                eachRow.person &&
                eachRow.person.peopleImages[0] &&
                eachRow.person.peopleImages[0].path
                  ? eachRow.person.peopleImages[0].path.replace("p/original", `p/${peopleImageW}`)
                  : "",
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
        getMedia.titleTranslations[0] && getMedia.titleTranslations[0].name
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
