import model from "../../../models/index.js";
import { paginationService, userPermissionService } from "../../../services/index.js";
import { PAGINATION_LIMIT, PEOPLE_SETTINGS } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";

/**
 * webtoonsCharacterCrewDetails
 * @param req
 * @param res
 */
export const webtoonsCharacterCrewDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const titleId = reqBody.id;
    const seasonId = reqBody.season_id;
    const type = reqBody.type; // Type Value will be character/crew
    let resultData = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;

    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;

    const getInformations = await model.title.findOne({
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
      where: { id: titleId, type: "webtoons", record_status: "active" },
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
        {
          model: model.season,
          attributes: ["id", "title_id", "season_name"],
          left: true,
          required: true,
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
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          ],
        },
      ],
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title or season id"));

    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(req, titleId, "webtoons");

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "list_order",
      sortOrder: "ASC",
    };

    const attributes = [
      "people_id",
      "creditable_id",
      "season_id",
      "department",
      "creditable_type",
      "character_name",
      "job",
      "list_order",
    ];
    let includeQuery = [];
    if (type == "character") {
      includeQuery = [
        {
          model: model.creditableTranslation,
          attributes: [
            "id",
            "character_name",
            [
              fn("REPLACE", col("character_image"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
              "character_image",
            ],
            "site_language",
            "description",
          ],
          left: true,
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ];
    } else {
      includeQuery = [
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
    }

    const condition = {
      creditable_id: titleId,
      season_id: seasonId,
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
      let recordList = [];
      for (const eachRow of resultData.rows) {
        if (eachRow) {
          let record = {
            id: "",
            name: "",
            description: "",
            designation: "",
            image: "",
          };
          if (eachRow.department == "character") {
            record.name =
              eachRow.creditableTranslations &&
              eachRow.creditableTranslations.length > 0 &&
              eachRow.creditableTranslations[0].character_name
                ? eachRow.creditableTranslations[0].character_name
                : "";
            record.description =
              eachRow.creditableTranslations &&
              eachRow.creditableTranslations.length > 0 &&
              eachRow.creditableTranslations[0].description
                ? eachRow.creditableTranslations[0].description
                : "";
            record.image =
              eachRow.creditableTranslations &&
              eachRow.creditableTranslations[0] &&
              eachRow.creditableTranslations[0].character_image
                ? eachRow.creditableTranslations[0].character_image.replace(
                    "p/original",
                    `p/${peopleImageW}`,
                  )
                : "";
          } else {
            record.id = eachRow.people_id ? eachRow.people_id : "";
            record.name =
              eachRow.person &&
              eachRow.person.peopleTranslations[0] &&
              eachRow.person.peopleTranslations[0].name
                ? eachRow.person.peopleTranslations[0].name
                : "";
            record.designation = eachRow.job ? eachRow.job : "";
            record.image =
              eachRow.person &&
              eachRow.person.peopleImages[0] &&
              eachRow.person.peopleImages[0].path
                ? eachRow.person.peopleImages[0].path.replace("p/original", `p/${peopleImageW}`)
                : "";
          }
          recordList.push(record);
        }
      }
      resultData.rows = recordList;
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      title:
        getInformations.titleTranslations[0] && getInformations.titleTranslations[0].name
          ? getInformations.titleTranslations[0].name
          : "",
      is_edit: isEdit,
      poster_image: !getInformations.titleImages[0] ? "" : getInformations.titleImages[0].path,
      background_image: !getInformations.titleImageBg[0]
        ? ""
        : getInformations.titleImageBg[0].dataValues.bg_path,
      season_name:
        getInformations.seasons &&
        getInformations.seasons.length > 0 &&
        getInformations.seasons[0] &&
        getInformations.seasons[0].seasonTranslations &&
        getInformations.seasons[0].seasonTranslations.length > 0 &&
        getInformations.seasons[0].seasonTranslations[0] &&
        getInformations.seasons[0].seasonTranslations[0].season_name
          ? getInformations.seasons[0].seasonTranslations[0].season_name
          : "",
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};