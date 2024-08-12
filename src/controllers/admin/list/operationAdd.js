import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { userRoleService } from "../../../services/index.js";

/**
 * operationAdd
 * @param req
 * @param res
 */
export const operationAdd = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const editId = reqBody.edit_id ? reqBody.edit_id : "";
    const titleId = reqBody.title_id ? reqBody.title_id : "";
    const operation = reqBody.operation ? reqBody.operation : "";

    // check for edit id exist in edit table
    const isExists = await model.edit.findOne({
      where: { id: editId, editable_id: titleId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid edit list id"));

    // check use role
    // [admin,super_admin,editor]
    const checkAllowRoles = await userRoleService.getRoleIdsByRoleNames(
      ["admin", "super_admin", "editor"],
      "ids",
      "active",
    );
    if (checkAllowRoles.length === 0) {
      throw StatusError.badRequest(res.__("Invalid user to change operation"));
    }
    const isExistsUser = await model.user.findOne({
      attributes: ["id"],
      where: {
        id: loginUserId,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: model.userRole,
          attributes: ["role_id"],
          left: true,
          where: {
            user_id: loginUserId,
            role_id: {
              [Op.in]: checkAllowRoles,
            },
            status: { [Op.ne]: "deleted" },
          },
        },
      ],
    });

    if (!isExistsUser) throw StatusError.badRequest(res.__("Invalid user to change operation"));

    const userRoleId = isExistsUser.dataValues.userRole.role_id;
    const userRoleName = await userRoleService.getRoleNameByRoleId(userRoleId);
    if (userRoleName == "editor" && operation == "approve")
      throw StatusError.badRequest(res.__("Editor has no permission to change approve operation"));

    if (userRoleId == "editor") {
      // check editor assign for particular title
      const isExistEditor = await model.edit.findOne({
        attributes: [],
        include: [
          {
            model: model.editor,
            attributes: ["user_id", "editable_id"],
            left: true,
            where: {
              current_status: "allocate",
              user_id: loginUserId,
              editable_id: titleId,
              status: { [Op.ne]: "deleted" },
            },
            required: true,
          },
        ],
        where: { id: editId, editable_id: titleId, status: { [Op.ne]: "deleted" } },
      });

      if (!isExistEditor)
        throw StatusError.badRequest(res.__("This editor has no permission to change operation"));
    }

    const updatedOperation = {
      operation: operation,
      updated_by: loginUserId,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    await model.edit.update(updatedOperation, {
      where: { id: editId, editable_id: titleId },
    });
    res.ok({
      message: res.__("Operation updated successfully"),
    });
  } catch (error) {
    next(error);
  }
};
