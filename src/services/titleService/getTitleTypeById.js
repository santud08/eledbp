import model from "../../models/index.js";
import { Op } from "sequelize";

export const getTitleTypeById = async (id, status = null) => {
  try {
    let condition = { id: id };
    if (status) {
      condition.record_status = status;
    } else {
      condition.record_status = { [Op.ne]: "deleted" };
    }
    const getInformation = await model.title.findOne({
      attributes: ["type"],
      where: condition,
    });
    return !getInformation ? "" : getInformation.type;
  } catch (error) {
    console.log(error);
    return "";
  }
};
