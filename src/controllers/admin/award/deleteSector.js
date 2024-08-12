import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * deleteSector
 * @param req
 * @param res
 */
export const deleteSector = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const sectorId = reqBody.id ? reqBody.id : "";

    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    // check for sector id existance in award sector table
    const getAwardSectorId = await model.awardSectors.findOne({
      attributes: ["id"],
      where: { id: sectorId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardSectorId) throw StatusError.badRequest(res.__("Invalid id"));

    // deleted award sector status
    const deleteSectorData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.awardSectors.update(deleteSectorData, {
      where: { id: sectorId },
    });
    // deleted award sector translation status
    const deleteTranslationData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.awardSectorTranslations.update(deleteTranslationData, {
      where: { award_sector_id: sectorId },
    });

    res.ok({
      message: res.__("award division deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
