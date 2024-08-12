import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * editDelete
 * @param req
 * @param res
 */
export const editDelete = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const editId = reqBody.edit_id;
    if (!editId && editId == "undefined") {
      throw StatusError.badRequest(res.__("Invalid edit id"));
    }
    // check edit id exists or not
    const getEditDetails = await model.edit.findOne({
      where: { status: { [Op.ne]: "deleted" }, id: editId },
      attributes: ["id", "editable_id", "editor_id", "type"],
    });
    if (!getEditDetails) throw StatusError.badRequest(res.__("Invalid edit id"));
    const editorTblId = getEditDetails.dataValues.editor_id;
    const editableId = getEditDetails.dataValues.editable_id;
    const getType = getEditDetails.dataValues.type;
    const updateData = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: loginUserId,
    };
    const updateStatus = await model.edit.update(updateData, {
      where: { id: editId },
    });

    if (updateStatus) {
      const updateEditorData = {
        status: "deleted",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: loginUserId,
      };
      await model.editor.update(updateEditorData, {
        where: { id: editorTblId },
      });
      if (getType == "people") {
        const updateEditorData = {
          status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: loginUserId,
        };
        await model.people.update(updateEditorData, {
          where: { id: editableId },
        });
        //delete data from search db
        Promise.all([
          esService.esScheduleDelete(editableId, getType),
          esService.esScheduleDeleteVideoByItemId(editableId, getType),
        ]);
      }
      if (getType != "people") {
        const updateEditorData = {
          record_status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: loginUserId,
        };
        await model.title.update(updateEditorData, {
          where: { id: editableId },
        });
        //delete data from search db
        Promise.all([
          esService.esScheduleDelete(editableId, getType),
          esService.esScheduleDeleteVideoByItemId(editableId, getType),
        ]);
      }
      res.ok({
        message: res.__("Deleted successfully"),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
