import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * agencyDelete
 * @param req
 * @param res
 */
export const agencyDelete = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const userId = req.userDetails.userId;
    const agencyId = reqBody.id ? reqBody.id : ""; // agency id

    // check for agency code existance in agency table
    const isExists = await model.agency.findOne({
      where: { id: agencyId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid agency id"));

    // Delete agency status
    const deleteData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    const [updatedRows] = await model.agency.update(deleteData, {
      where: { id: agencyId },
    });
    if (updatedRows) {
      //delete translation
      const updateAgencyTranslation = {
        status: "deleted",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.agencyTranslation.update(updateAgencyTranslation, {
        where: { agency_id: agencyId, status: { [Op.ne]: "deleted" } },
      });
      //find all managers
      const getManagers = await model.agencyManager
        .findAll({
          attributes: ["id"],
          where: { agency_id: agencyId, status: { [Op.ne]: "deleted" } },
          raw: true,
        })
        .then((managers) => managers.map((manager) => manager.id));
      if (getManagers.length > 0) {
        //delete manager
        const deleteManager = {
          status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.agencyManager.update(deleteManager, {
          where: {
            agency_id: agencyId,
            status: { [Op.ne]: "deleted" },
          },
        });

        //delete manager translation
        const dataManagerTranslation = {
          status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.agencyManagerTranslation.update(dataManagerTranslation, {
          where: { agency_manager_id: { [Op.in]: getManagers }, status: { [Op.ne]: "deleted" } },
        });

        // delete manager artist
        const deleteManagerArtist = {
          status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.agencyManagerArtist.update(deleteManagerArtist, {
          where: {
            agency_id: agencyId,
            agency_manager_id: { [Op.in]: getManagers },
            status: { [Op.ne]: "deleted" },
          },
        });
      }

      //delete data from search db
      esService.esScheduleDelete(agencyId, "company");
    }
    res.ok({
      message: res.__("agency deleted successfully"),
    });
  } catch (error) {
    next(error);
  }
};
