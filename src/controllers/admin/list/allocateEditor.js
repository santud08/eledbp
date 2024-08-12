import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { userRoleService } from "../../../services/index.js";

/**
 * allocateEditor
 * @param req
 * @param res
 */
export const allocateEditor = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const editId = reqBody.edit_id ? reqBody.edit_id : [];
    const userId = reqBody.user_id ? reqBody.user_id : "";
    const currentStatus = "allocate";
    let updateEditTbl = "";

    // check use role
    const isExistsUser = await userRoleService.checkUserRole(loginUserId, ["admin", "super_admin"]);

    if (!isExistsUser) throw StatusError.badRequest(res.__("Invalid user to change editor"));

    // check selected user is a editor
    const isEditorExist = await userRoleService.checkUserRole(userId, ["editor"]);

    if (!isEditorExist) throw StatusError.badRequest(res.__("user is not a editor"));

    if (editId.length > 0) {
      for (const id of editId) {
        const isExists = await model.edit.findOne({
          attributes: ["id", "editable_id", "type"],
          where: { id: id, status: { [Op.ne]: "deleted" } },
        });
        if (isExists) {
          const titleId = isExists.editable_id;
          const titleType = isExists.type;
          // check editor
          const checkEditorTbl = await model.editor.findOne({
            attributes: ["id", "editable_id"],
            where: { user_id: userId, editable_id: titleId, status: { [Op.ne]: "deleted" } },
          });
          if (checkEditorTbl) {
            // update editor table
            const updatedEditor = {
              current_status: currentStatus,
              updated_by: loginUserId,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.editor.update(updatedEditor, {
              where: { user_id: userId, editable_id: titleId },
            });
            const editorTblId = checkEditorTbl.id;

            // update edit table
            if (editorTblId) {
              const updatedEditTbl = {
                editor_id: editorTblId,
                updated_by: loginUserId,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              updateEditTbl = await model.edit.update(updatedEditTbl, {
                where: { id: id, editable_id: titleId },
              });
            }
          } else {
            // deleted exist editor
            const updatedEditor = {
              current_status: "deallocate",
              updated_by: loginUserId,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.editor.update(updatedEditor, {
              where: { editable_id: titleId },
            });
            // new editor add
            const editorDetails = {
              user_id: userId,
              editable_id: titleId,
              current_status: currentStatus,
              editable_type: titleType,
              created_by: loginUserId,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            const insertData = await model.editor.create(editorDetails);
            const editorTblId = insertData.id;

            // update edit table
            if (editorTblId) {
              const updatedEditTbl = {
                editor_id: editorTblId,
                updated_by: loginUserId,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
              };
              updateEditTbl = await model.edit.update(updatedEditTbl, {
                where: { id: id, editable_id: titleId },
              });
            }
          }
        }
      }
    }

    if (updateEditTbl) {
      res.ok({
        message: res.__("data updated successfully"),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
