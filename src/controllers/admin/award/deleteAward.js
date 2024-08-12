import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * deleteAward
 * @param req
 * @param res
 */
export const deleteAward = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const awardId = reqBody.award_id ? reqBody.award_id : "";

    // check for award id existance in award table
    const getAwardId = await model.awards.findOne({
      attributes: ["id"],
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!getAwardId) throw StatusError.badRequest(res.__("Invalid award id"));

    // deleted award status
    const deleteAwardData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.awards.update(deleteAwardData, {
      where: { id: awardId },
    });
    // deleted award translation status
    const deleteAwardTranslationData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.awardTranslation.update(deleteAwardTranslationData, {
      where: { award_id: awardId },
    });
    //delete data from search db
    esService.esScheduleDelete(awardId, "award");

    res.ok({
      message: res.__("award deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
