import model from "../../models/index.js";
import { Sequelize, fn, col, Op } from "sequelize";
import { TABLES, TITLE_SETTINGS } from "../../utils/constants.js";
import { envs } from "../../config/index.js";

export const getPeopleNomineeListDetails = async (peopleId, language) => {
  try {
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    const getTitles = await model.awardNominees.findAll({
      attributes: ["id", "work_id"],
      where: {
        status: "active",
        character_id: peopleId,
        [Op.and]: [{ work_id: { [Op.ne]: null } }, { work_id: { [Op.gt]: 0 } }],
      },
      include: [
        {
          model: model.title,
          attributes: ["id", "type", "release_date"],
          left: true,
          where: { record_status: "active" },
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
              attributes: [
                "id",
                "title_id",
                [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
              ],
              left: true,
              where: {
                id: {
                  [Op.eq]: Sequelize.literal(
                    `(SELECT id FROM ${TABLES.TITLE_IMAGE_TABLE} WHERE ${TABLES.TITLE_IMAGE_TABLE}.title_id = title.id AND image_category='poster_image' AND is_main_poster='y' AND status='active' AND episode_id IS NULL AND original_name IS NOT NULL AND path IS NOT NULL AND path!='' ORDER BY id DESC LIMIT 1)`,
                  ),
                },
              },
              required: false,
            },
          ],
        },
      ],
      group: ["work_id"],
      order: [
        [model.title, model.titleTranslation, "name", "ASC"],
        ["id", "desc"],
      ],
    });
    let nomineeDetails = [];
    let subIncludeQuery = [
      {
        model: model.awardSectors,
        attributes: ["id"],
        where: { status: "active" },
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
                  }.award_sector_id = awardSector.id AND status='active' AND division_name IS NOT NULL AND division_name!="" ORDER BY site_language ${
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
        model: model.awards,
        attributes: ["id"],
        where: { status: "active" },
        include: [
          {
            model: model.awardTranslation,
            attributes: ["award_name"],
            left: true,
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.AWARD_TRANSLATION_TABLE} WHERE ${
                    TABLES.AWARD_TRANSLATION_TABLE
                  }.award_id = award.id AND status='active' ORDER BY site_language ${
                    language == "ko" ? "DESC" : "ASC"
                  } LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
          {
            model: model.awardImages,
            as: "awardImageOne",
            attributes: [],
            left: true,
            where: { status: "active" },
            required: false,
          },
        ],
      },
    ];

    if (getTitles && getTitles.length > 0) {
      for (const title of getTitles) {
        if (title && title.id > 0 && title.work_id > 0) {
          const titleId = title.work_id;
          const findNominee = await model.awardNominees.findAll({
            attributes: ["id", "nominee_type", "work_id", "award_id"],
            where: { status: "active", character_id: peopleId, work_id: titleId },
            include: subIncludeQuery,
            order: [
              ["nominee_type", "desc"],
              ["id", "desc"],
            ],
          });
          let nominees = [];
          if (findNominee && findNominee.length > 0) {
            for (const nominee of findNominee) {
              if (nominee) {
                const nomineeType = nominee.dataValues.nominee_type;
                let nomineeRecord = {};
                nomineeRecord = {
                  sector_id: nominee.dataValues.awardSector.id,
                  sector_name:
                    nominee.dataValues.awardSector &&
                    nominee.dataValues.awardSector.dataValues &&
                    nominee.dataValues.awardSector.dataValues.awardSectorTranslations &&
                    nominee.dataValues.awardSector.dataValues.awardSectorTranslations.length > 0 &&
                    nominee.dataValues.awardSector.dataValues.awardSectorTranslations[0] &&
                    nominee.dataValues.awardSector.dataValues.awardSectorTranslations[0]
                      .division_name
                      ? nominee.dataValues.awardSector.dataValues.awardSectorTranslations[0]
                          .division_name
                      : "",
                  award_id:
                    nominee.dataValues.award &&
                    nominee.dataValues.award.dataValues &&
                    nominee.dataValues.award.dataValues.id
                      ? nominee.dataValues.award.dataValues.id
                      : "",
                  award_name:
                    nominee.dataValues.award &&
                    nominee.dataValues.award.dataValues &&
                    nominee.dataValues.award.dataValues.awardTranslations &&
                    nominee.dataValues.award.dataValues.awardTranslations.length > 0 &&
                    nominee.dataValues.award.dataValues.awardTranslations[0] &&
                    nominee.dataValues.award.dataValues.awardTranslations[0].award_name
                      ? nominee.dataValues.award.dataValues.awardTranslations[0].award_name
                      : "",
                  is_winner: nomineeType == "winner" ? "y" : "n",
                };
                if (
                  nomineeRecord &&
                  nomineeRecord.sector_id &&
                  nomineeRecord.sector_id != "undefined" &&
                  nomineeRecord.sector_id != null
                )
                  nominees.push(nomineeRecord);
              }
            }
          }
          const record = {
            title_id: titleId,
            title_name:
              title.dataValues.title &&
              title.dataValues.title.dataValues &&
              title.dataValues.title.dataValues.titleTranslations &&
              title.dataValues.title.dataValues.titleTranslations.length > 0 &&
              title.dataValues.title.dataValues.titleTranslations[0] &&
              title.dataValues.title.dataValues.titleTranslations[0].name
                ? title.dataValues.title.dataValues.titleTranslations[0].name
                : "",
            poster_image:
              title.dataValues.title &&
              title.dataValues.title.dataValues &&
              title.dataValues.title.dataValues.titleImages &&
              title.dataValues.title.dataValues.titleImages.length > 0 &&
              title.dataValues.title.dataValues.titleImages[0] &&
              title.dataValues.title.dataValues.titleImages[0].path
                ? title.dataValues.title.dataValues.titleImages[0].path.replace(
                    "p/original",
                    `p/${tittleImageW}`,
                  )
                : "",
            title_type:
              title.dataValues.title &&
              title.dataValues.title.dataValues &&
              title.dataValues.title.dataValues.type
                ? title.dataValues.title.dataValues.type
                : "",
            release_date:
              title.dataValues.title &&
              title.dataValues.title.dataValues &&
              title.dataValues.title.dataValues.release_date
                ? title.dataValues.title.dataValues.release_date
                : "",
            nominees,
          };
          nomineeDetails.push(record);
        }
      }
    }
    return nomineeDetails;
  } catch (error) {
    return [];
  }
};
