import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * editSector
 * @param req
 * @param res
 */
export const editSector = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;

    const sectorId = reqBody.id ? reqBody.id : "";
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const divisionNameKo = reqBody.division_name_ko ? reqBody.division_name_ko : "";
    const divisionNameEn = reqBody.division_name_en ? reqBody.division_name_en : "";
    const status = reqBody.status ? reqBody.status : "active";

    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const getAwardSector = await model.awardSectors.findOne({
      attributes: ["id"],
      where: { id: sectorId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardSector) throw StatusError.badRequest(res.__("Invalid id"));

    if (divisionNameEn == "" && divisionNameKo == "") {
      throw StatusError.badRequest(res.__("Please enter division name"));
    }

    const isExistsDivision = await model.awardSectors.findOne({
      attributes: ["id"],
      where: {
        award_id: awardId,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.awardSectorTranslations,
          attributes: ["division_name", "award_sector_id"],
          left: true,
          where: {
            [Op.or]: [{ division_name: divisionNameEn }, { division_name: divisionNameKo }],
            status: { [Op.ne]: "deleted" },
            award_sector_id: { [Op.ne]: sectorId },
          },
        },
      ],
    });

    if (isExistsDivision) throw StatusError.badRequest(res.__("division already exists"));

    // update award sector table
    const divisionData = {
      award_id: awardId,
      status: status,
      updated_by: userId,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
    };

    await model.awardSectors.update(divisionData, {
      where: {
        id: sectorId,
        status: { [Op.ne]: "deleted" },
      },
    });

    // check for english division name existance in table
    const isExistsEnDivision = await model.awardSectors.findOne({
      attributes: ["id"],
      where: {
        id: sectorId,
        award_id: awardId,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.awardSectorTranslations,
          attributes: ["division_name", "award_sector_id"],
          left: true,
          where: {
            site_language: "en",
            status: { [Op.ne]: "deleted" },
          },
          required: true,
        },
      ],
    });

    if (!isExistsEnDivision) {
      const sectorEnDetails = {
        award_sector_id: sectorId,
        site_language: "en",
        division_name: divisionNameEn,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      await model.awardSectorTranslations.create(sectorEnDetails);
    } else {
      const divisionTranslationData = {
        division_name: divisionNameEn,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };

      await model.awardSectorTranslations.update(divisionTranslationData, {
        where: {
          award_sector_id: sectorId,
          site_language: "en",
          status: { [Op.ne]: "deleted" },
        },
      });
    }

    // check for korean division name existance in table
    const isExistsKoDivision = await model.awardSectors.findOne({
      attributes: ["id"],
      where: {
        id: sectorId,
        award_id: awardId,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.awardSectorTranslations,
          attributes: ["division_name", "award_sector_id"],
          left: true,
          where: {
            site_language: "ko",
            status: { [Op.ne]: "deleted" },
          },
          required: true,
        },
      ],
    });
    if (!isExistsKoDivision) {
      const sectorEnDetails = {
        award_sector_id: sectorId,
        site_language: "ko",
        division_name: divisionNameKo,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      await model.awardSectorTranslations.create(sectorEnDetails);
    } else {
      const divisionTranslationData = {
        division_name: divisionNameKo,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };

      await model.awardSectorTranslations.update(divisionTranslationData, {
        where: {
          award_sector_id: sectorId,
          site_language: "ko",
          status: { [Op.ne]: "deleted" },
        },
      });
    }

    res.ok({
      message: res.__("award division updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
