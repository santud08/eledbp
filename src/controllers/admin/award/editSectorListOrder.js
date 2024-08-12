import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * editSectorListOrder
 * @param req
 * @param res
 */
export const editSectorListOrder = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;

    const sectorIds = reqBody.sector_id_order ? reqBody.sector_id_order : [];
    const awardId = reqBody.award_id ? reqBody.award_id : "";

    const getAward = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));
    if (!sectorIds || sectorIds.length == 0)
      throw StatusError.badRequest(res.__("Invalid sector id"));

    const getAwardSector = await model.awardSectors.findAll({
      attributes: ["id"],
      where: { id: { [Op.in]: sectorIds }, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardSector || getAwardSector.length != sectorIds.length)
      throw StatusError.badRequest(res.__("Invalid sector id"));

    if (sectorIds.length > 0) {
      let listOrder = 1;
      for (const sector of sectorIds) {
        if (sector) {
          const sectorData = {
            list_order: listOrder,
            updated_by: userId,
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };

          await model.awardSectors.update(sectorData, {
            where: {
              id: sector,
              award_id: awardId,
            },
          });
          listOrder = listOrder + 1;
        }
      }
    }

    res.ok({
      message: res.__("award sector list order updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
