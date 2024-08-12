import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { esService, schedulerJobService } from "../../../services/index.js";

/**
 * statusChange
 * @param req
 * @param res
 */
export const statusChange = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const editId = reqBody.edit_id;
    const getType = reqBody.type;
    let getEditDetails = "";
    let updateStatus = "";
    if (!editId && editId == "undefined") {
      throw StatusError.badRequest(res.__("Invalid edit id"));
    }
    // check edit id exists or not
    if (getType == "people") {
      getEditDetails = await model.edit.findOne({
        where: { status: { [Op.ne]: "deleted" }, id: editId },
        attributes: ["id", "editable_id"],
        include: [
          {
            model: model.people,
            attributes: [["id", "people_id"], "status"],
            left: true,
          },
        ],
      });

      if (!getEditDetails) throw StatusError.badRequest(res.__("Invalid edit id"));

      const peopleId = getEditDetails.dataValues.person.dataValues.people_id;
      const changeStatus =
        getEditDetails.dataValues.person.status == "active" ? "inactive" : "active";

      const updateData = {
        status: changeStatus,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: loginUserId,
      };
      updateStatus = await model.people.update(updateData, {
        where: { id: peopleId },
      });
      if (changeStatus == "inactive") {
        //delete data from search db
        Promise.all([
          esService.esScheduleDelete(peopleId, getType),
          esService.esScheduleDeleteVideoByItemId(peopleId, getType),
        ]);
      }
      if (changeStatus == "active") {
        //add data newly
        Promise.all([
          esService.esSchedularAddUpdate(peopleId, getType, "edit"),
          schedulerJobService.addJobInScheduler(
            "video add in search db",
            JSON.stringify({
              list: [{ item_id: peopleId, item_type: "people", type: "people" }],
            }),
            "update_video_search_data_by_item_id",
            "people video add in search db when people status update",
            loginUserId,
          ),
        ]);
      }
    } else {
      getEditDetails = await model.edit.findOne({
        where: { id: editId, type: getType, status: { [Op.ne]: "deleted" } },
        attributes: ["id", "editable_id"],
        include: [
          {
            model: model.title,
            where: { type: getType, record_status: { [Op.ne]: "deleted" } },
            attributes: [["id", "title_id"], "record_status"],
            left: true,
          },
        ],
      });

      if (!getEditDetails) throw StatusError.badRequest(res.__("Invalid edit id"));
      const titleId = getEditDetails.dataValues.title.dataValues.title_id;
      const changeStatus =
        getEditDetails.dataValues.title.dataValues.record_status == "active"
          ? "inactive"
          : "active";

      const updateData = {
        record_status: changeStatus,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: loginUserId,
      };
      updateStatus = await model.title.update(updateData, {
        where: { id: titleId },
      });
      if (changeStatus == "inactive") {
        //delete data from search db
        Promise.all([
          esService.esScheduleDelete(titleId, getType),
          esService.esScheduleDeleteVideoByItemId(titleId, getType),
        ]);
      }
      if (changeStatus == "active") {
        //add data newly
        Promise.all([
          esService.esSchedularAddUpdate(titleId, getType, "edit"),
          schedulerJobService.addJobInScheduler(
            "video add in search db",
            JSON.stringify({
              list: [{ item_id: titleId, item_type: getType, type: "title" }],
            }),
            "update_video_search_data_by_item_id",
            "title video add in search db when title status update",
            loginUserId,
          ),
        ]);
      }
    }

    if (updateStatus) {
      res.ok({
        message: res.__("Status changed successfully."),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
