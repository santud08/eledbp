import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * addSector
 * @param req
 * @param res
 */
export const addSector = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const divisionNameKo = reqBody.division_name_ko ? reqBody.division_name_ko : "";
    const divisionNameEn = reqBody.division_name_en ? reqBody.division_name_en : "";

    // check for award id existance in awards table
    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    if (divisionNameEn == "" && divisionNameKo == "") {
      throw StatusError.badRequest(res.__("Please enter division name"));
    }

    // check for division name existance in table
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
          },
          required: true,
        },
      ],
    });

    if (isExistsDivision) throw StatusError.badRequest(res.__("division already exists"));

    const listOrder = await model.awardSectors.max("list_order", {
      where: {
        award_id: awardId,
      },
    });

    const awardDetails = {
      award_id: awardId,
      list_order: listOrder ? listOrder + 1 : 1,
      created_by: userId,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    const awardSectorInformation = await model.awardSectors.create(awardDetails);
    const awardSectorId = awardSectorInformation.id;
    if (awardSectorInformation && awardSectorId) {
      const bulkCreate = [];
      // Add sector en translation
      if (divisionNameEn) {
        bulkCreate.push({
          award_sector_id: awardSectorId,
          site_language: "en",
          division_name: divisionNameEn,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (divisionNameKo) {
        // Add sector ko translation
        bulkCreate.push({
          award_sector_id: awardSectorId,
          site_language: "ko",
          division_name: divisionNameKo,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }

      if (bulkCreate.length > 0) await model.awardSectorTranslations.bulkCreate(bulkCreate);
    }

    res.ok({
      message: res.__("award division added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
