import models from "../../models/index.js";
import { Op } from "sequelize";

export const getDepartmentIdByName = async (departmentName, status = null) => {
  const condition = { department_name: departmentName };
  if (status) {
    condition.status = status;
  } else {
    condition.status = { [Op.ne]: "deleted" };
  }
  const result = await models.department.findOne({
    attributes: ["id"],
    where: condition,
  });
  return result && result.id ? result.id : null;
};
