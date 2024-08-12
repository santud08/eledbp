import model from "../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { TABLES } from "../../utils/constants.js";

export const getPeopleOtherNomineeListDetails = async (peopleId, language) => {
  try {
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
        ],
      },
    ];

    const findNominee = await model.awardNominees.findAll({
      attributes: ["id", "nominee_type", "work_id", "award_id"],
      where: {
        status: "active",
        character_id: peopleId,
        [Op.or]: [{ work_id: { [Op.eq]: null } }, { work_id: { [Op.eq]: "" } }],
      },
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
              nominee.dataValues.awardSector.dataValues.awardSectorTranslations[0].division_name
                ? nominee.dataValues.awardSector.dataValues.awardSectorTranslations[0].division_name
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
    return nominees;
  } catch (error) {
    return [];
  }
};
