import model from "../../models/index.js";
import { Op } from "sequelize";

/*
 * checkPermission
 * check the user permission by user role id & permission
 * return boolean
 */
export const checkPermission = async (roleId, permission) => {
  let returnStr = false;
  let condition = { status: "active" };
  if (permission.length > 1) {
    condition[Op.or] = permission.map((eachper) => ({ name: eachper }));
  } else {
    condition.name = permission;
  }
  const getPermission = await model.userRolePermission.findOne({
    attributes: ["id"],
    raw: true,
    include: [
      {
        model: model.permission,
        attributes: [],
        where: condition,
        required: true,
      },
      { model: model.role, attributes: [], where: { status: "active" }, required: true },
    ],
    where: { user_role_id: roleId, status: "active" },
  });
  if (getPermission && getPermission != null && getPermission != "undefined") {
    returnStr = true;
  }

  return returnStr;
};
