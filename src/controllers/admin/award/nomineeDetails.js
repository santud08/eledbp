import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { TABLES, TITLE_SETTINGS, PEOPLE_SETTINGS } from "../../../utils/constants.js";

/**
 * nomineeDetails
 * @param req
 * @param res
 */
export const nomineeDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const roundId = reqBody.round_id ? reqBody.round_id : "";
    const nomineeId = reqBody.nominee_id ? reqBody.nominee_id : "";
    const language = req.accept_language;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    // check for award id existance in award table
    const getAwardId = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardId) throw StatusError.badRequest(res.__("Invalid award id"));

    // check for award id existance in award table
    const getRoundId = await model.awardRounds.findOne({
      attributes: ["id"],
      where: { id: roundId, status: { [Op.ne]: "deleted" } },
    });
    if (!getRoundId) throw StatusError.badRequest(res.__("Invalid round id"));

    const getNomineeId = await model.awardNominees.findOne({
      attributes: ["id"],
      where: { id: nomineeId, status: { [Op.ne]: "deleted" } },
    });
    if (!getNomineeId) throw StatusError.badRequest(res.__("Invalid nominee id"));
    const includeQuery = [
      {
        model: model.awardRounds,
        attributes: ["award_id", "round_name"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: true,
      },
      {
        model: model.awardSectors,
        attributes: ["id"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: false,
        include: [
          {
            model: model.awardSectorTranslations,
            attributes: ["award_sector_id", "division_name", "site_language"],
            left: true,
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE} WHERE ${
                    TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE
                  }.award_sector_id = awardSector.id AND status='active' ORDER BY site_language ${
                    language == "ko" ? "DESC" : "ASC"
                  } LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
        ],
      },
      {
        model: model.title,
        attributes: ["id"],
        left: true,
        where: { record_status: { [Op.ne]: "deleted" } },
        required: false,
        include: [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "site_language"],
            left: true,
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.TITLE_TRANSLATION_TABLE} WHERE ${
                    TABLES.TITLE_TRANSLATION_TABLE
                  }.title_id = title.id AND status='active' ORDER BY site_language ${
                    language == "ko" ? "DESC" : "ASC"
                  } LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
          {
            model: model.titleImage,
            as: "titleImageOne",
            attributes: [
              [
                fn(
                  "REPLACE",
                  fn(
                    "REPLACE",
                    col("title.titleImageOne.path"),
                    `${envs.s3.BUCKET_URL}`,
                    `${envs.aws.cdnUrl}`,
                  ),
                  "p/original",
                  `p/${tittleImageW}`,
                ),
                "thumbnail",
              ],
            ],
            left: true,
            where: {
              status: "active",
              image_category: "poster_image",
              episode_id: null,
              is_main_poster: "y",
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            order: [["id", "DESC"]],
          },
        ],
      },
      {
        model: model.people,
        attributes: ["id"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: false,
        include: [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "site_language"],
            left: true,
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.PEOPLE_TRANSLATION_TABLE} WHERE ${
                    TABLES.PEOPLE_TRANSLATION_TABLE
                  }.people_id = person.id AND status='active' ORDER BY site_language ${
                    language == "ko" ? "DESC" : "ASC"
                  } LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
          {
            model: model.peopleImages,
            as: "peopleImagesOne",
            attributes: [
              [
                fn(
                  "REPLACE",
                  fn(
                    "REPLACE",
                    col("person.peopleImagesOne.path"),
                    `${envs.s3.BUCKET_URL}`,
                    `${envs.aws.cdnUrl}`,
                  ),
                  "p/original",
                  `p/${peopleImageW}`,
                ),
                "thumbnail",
              ],
            ],
            left: true,
            where: {
              image_category: "poster_image",
              is_main_poster: "y",
              status: "active",
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
            order: [["id", "DESC"]],
          },
        ],
      },
    ];
    const getNominee = await model.awardNominees.findOne({
      attributes: [
        "id",
        "award_id",
        "round_id",
        "sector_id",
        "work_id",
        "character_id",
        "nominee_type",
        "comment",
        "is_work_thumbnail",
      ],
      include: includeQuery,
      where: {
        id: nomineeId,
        award_id: awardId,
        round_id: roundId,
        status: { [Op.ne]: "deleted" },
      },
    });
    let getNomineeDetails = {};
    if (getNominee) {
      getNomineeDetails.nominee_id = getNominee.id;
      getNomineeDetails.award_id = getNominee.award_id;
      getNomineeDetails.round_id = getNominee.round_id;
      getNomineeDetails.sector_id = getNominee.sector_id;
      getNomineeDetails.sector =
        getNominee.awardSector &&
        getNominee.awardSector.awardSectorTranslations &&
        getNominee.awardSector.awardSectorTranslations.length > 0 &&
        getNominee.awardSector.awardSectorTranslations[0] &&
        getNominee.awardSector.awardSectorTranslations[0].division_name
          ? getNominee.awardSector.awardSectorTranslations[0].division_name
          : "";
      getNomineeDetails.work_id = getNominee.work_id;
      getNomineeDetails.work =
        getNominee.title &&
        getNominee.title.titleTranslations &&
        getNominee.title.titleTranslations.length > 0 &&
        getNominee.title.titleTranslations[0] &&
        getNominee.title.titleTranslations[0].name
          ? getNominee.title.titleTranslations[0].name
          : "";
      getNomineeDetails.work_thumbnail =
        getNominee.title &&
        getNominee.title.titleImageOne &&
        getNominee.title.titleImageOne &&
        getNominee.title.titleImageOne.dataValues &&
        getNominee.title.titleImageOne.dataValues.thumbnail
          ? getNominee.title.titleImageOne.dataValues.thumbnail
          : "";
      getNomineeDetails.character_id = getNominee.character_id;
      getNomineeDetails.character =
        getNominee.person &&
        getNominee.person.peopleTranslations &&
        getNominee.person.peopleTranslations.length > 0 &&
        getNominee.person.peopleTranslations[0] &&
        getNominee.person.peopleTranslations[0].name
          ? getNominee.person.peopleTranslations[0].name
          : "";
      getNomineeDetails.character_thumbnail =
        getNominee.person &&
        getNominee.person.peopleImagesOne &&
        getNominee.person.peopleImagesOne &&
        getNominee.person.peopleImagesOne.dataValues &&
        getNominee.person.peopleImagesOne.dataValues.thumbnail
          ? getNominee.person.peopleImagesOne.dataValues.thumbnail
          : "";
      getNomineeDetails.status = getNominee.nominee_type;
      getNomineeDetails.comment = getNominee.comment;
      getNomineeDetails.is_work_thumbnail = getNominee.is_work_thumbnail;
    }
    res.ok(getNomineeDetails);
  } catch (error) {
    next(error);
  }
};
