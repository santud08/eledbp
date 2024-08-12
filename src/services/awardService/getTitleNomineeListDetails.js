import model from "../../models/index.js";
import { Sequelize, fn, col, Op } from "sequelize";
import { TABLES } from "../../utils/constants.js";
import { envs } from "../../config/index.js";

export const getTitleNomineeListDetails = async (titleId, type, language) => {
  try {
    const getAwards = await model.awardNominees.findAll({
      attributes: ["id", "award_id"],
      where: { status: "active", work_id: titleId },
      include: [
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
              attributes: ["url"],
              left: true,
              where: { status: "active" },
              required: false,
            },
          ],
        },
      ],
      group: ["award_id"],
      order: [
        [model.awards, model.awardTranslation, "award_name", "ASC"],
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
            attributes: [
              "id",
              "people_id",
              "original_name",
              "file_name",
              "url",
              [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
            ],
            where: {
              image_category: "poster_image",
              is_main_poster: "y",
              status: "active",
              path: { [Op.ne]: null },
            },
            required: true,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ],
      },
    ];

    if (getAwards && getAwards.length > 0) {
      for (const award of getAwards) {
        if (award && award.id > 0 && award.award_id > 0) {
          const awardId = award.award_id;
          const findNominee = await model.awardNominees.findAll({
            attributes: ["id", "nominee_type", "work_id", "character_id"],
            where: { status: "active", work_id: titleId, award_id: awardId },
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
                const characterId = nominee.dataValues.character_id;
                let character = "";
                if (characterId) {
                  character =
                    nominee.dataValues.person &&
                    nominee.dataValues.person.dataValues &&
                    nominee.dataValues.person.dataValues.peopleTranslations &&
                    nominee.dataValues.person.dataValues.peopleTranslations.length > 0 &&
                    nominee.dataValues.person.dataValues.peopleTranslations[0] &&
                    nominee.dataValues.person.dataValues.peopleTranslations[0].name
                      ? nominee.dataValues.person.dataValues.peopleTranslations[0].name
                      : "";
                }
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
                  character_id: characterId,
                  character_name: character,
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
            award_id: awardId,
            award_name:
              award.dataValues.award &&
              award.dataValues.award.dataValues &&
              award.dataValues.award.dataValues.awardTranslations &&
              award.dataValues.award.dataValues.awardTranslations.length > 0 &&
              award.dataValues.award.dataValues.awardTranslations[0] &&
              award.dataValues.award.dataValues.awardTranslations[0].award_name
                ? award.dataValues.award.dataValues.awardTranslations[0].award_name
                : "",
            award_image:
              award.dataValues.award &&
              award.dataValues.award.dataValues &&
              award.dataValues.award.dataValues.awardImageOne &&
              award.dataValues.award.dataValues.awardImageOne.url
                ? award.dataValues.award.dataValues.awardImageOne.url
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
