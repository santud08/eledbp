import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";

/**
 * awardNomineeEdit
 * @param req
 * @param res
 */
export const awardNomineeEdit = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const nomineeId = reqBody.nominee_id ? reqBody.nominee_id : null;
    const awardId = reqBody.award_id ? reqBody.award_id : null;
    const roundId = reqBody.round_id ? reqBody.round_id : null;
    const sectorId = reqBody.sector_id ? reqBody.sector_id : null;
    const workId = reqBody.work_id ? reqBody.work_id : null;
    const characterId = reqBody.character_id ? reqBody.character_id : null;
    const type = reqBody.status ? reqBody.status : "candidate";
    const isWorkThumbnail = reqBody.is_work_thumbnail ? reqBody.is_work_thumbnail : "n";
    const comment = reqBody.comment ? reqBody.comment : "";
    let isExistsCharacter = "";
    let isExistsWorker = "";

    // check for nominee exist in nominee table
    const isNomineeExists = await model.awardNominees.findOne({
      where: {
        id: nomineeId,
        award_id: awardId,
        round_id: roundId,
        status: { [Op.ne]: "deleted" },
      },
    });
    if (!isNomineeExists) throw StatusError.badRequest(res.__("Invalid nominee id"));

    // check for award exist in awards table
    const isExists = await model.awards.findOne({
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid award id"));

    // check for award round exist in round table
    const isExistsRound = await model.awardRounds.findOne({
      where: { id: roundId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExistsRound) throw StatusError.badRequest(res.__("Invalid round id"));

    // check for award sector exist in sector table
    const isExistsSector = await model.awardSectors.findOne({
      where: { id: sectorId, award_id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExistsSector) throw StatusError.badRequest(res.__("Invalid sector id"));

    // check for worker exist
    if (workId) {
      isExistsWorker = await model.title.findOne({
        attributes: [],
        include: [
          {
            model: model.titleTranslation,
            attributes: ["name"],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
            },
            required: true,
          },
        ],
        where: { id: workId, record_status: { [Op.ne]: "deleted" } },
      });
      if (!isExistsWorker) throw StatusError.badRequest(res.__("Invalid work id"));
    }

    // check for character exist while work id not present
    if (characterId) {
      isExistsCharacter = await model.people.findOne({
        attributes: [],
        include: [
          {
            model: model.peopleTranslation,
            attributes: ["name"],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
            },
            required: true,
          },
        ],
        where: { id: characterId, status: { [Op.ne]: "deleted" } },
      });
      if (!isExistsCharacter) throw StatusError.badRequest(res.__("Invalid character id"));
    }

    // check for same multiple work present under sector
    let conditionCheck = {
      id: { [Op.ne]: nomineeId },
      status: { [Op.ne]: "deleted" },
      sector_id: sectorId,
      award_id: awardId,
      round_id: roundId,
    };
    if (workId && characterId) {
      conditionCheck["work_id"] = workId;
      conditionCheck["character_id"] = characterId;
    } else if (workId && !characterId) {
      conditionCheck["work_id"] = workId;
      conditionCheck["character_id"] = null;
    } else if (!workId && characterId) {
      conditionCheck["work_id"] = null;
      conditionCheck["character_id"] = characterId;
    }
    const isExistsWork = await model.awardNominees.findOne({
      attributes: ["id"],
      where: conditionCheck,
    });

    if (isExistsWork) throw StatusError.badRequest(res.__("Same work name already exists"));

    //edit nominee details
    const awardNomineeDetails = {
      award_id: awardId,
      round_id: roundId,
      sector_id: sectorId,
      work: "",
      work_id: workId,
      character: "",
      character_id: characterId,
      nominee_type: type,
      comment: comment,
      is_work_thumbnail: isWorkThumbnail,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: loginUserId,
    };

    const nomineeUpdated = await model.awardNominees.update(awardNomineeDetails, {
      where: { id: nomineeId, status: { [Op.ne]: "deleted" } },
    });

    if (nomineeUpdated) {
      res.ok({
        message: res.__("past award updated successfully"),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};