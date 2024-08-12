import model from "../../models/index.js";
import { Op } from "sequelize";
import { customDateTimeHelper } from "../../helpers/index.js";

export const titleDataAddEditInEditTbl = async (id, type, logUserId, actionDate) => {
  try {
    let returnStr = false;
    let dataModify = "";
    let getInformations = "";
    if (type == "people") {
      getInformations = await model.people.findOne({
        attributes: ["id", "created_at", "created_by"],
        where: { id: id, status: { [Op.ne]: "deleted" } },
      });
    } else {
      getInformations = await model.title.findOne({
        attributes: ["id", "type", "created_at", "created_by"],
        where: { id: id, record_status: { [Op.ne]: "deleted" } },
      });
      type =
        (type == "" || type == "title") && getInformations && getInformations.type
          ? getInformations.type
          : type;
    }

    if (getInformations) {
      const getEditTblInformations = await model.edit.findOne({
        attributes: ["editable_id"],
        where: { editable_id: id, type: type, status: { [Op.ne]: "deleted" } },
      });

      if (getEditTblInformations) {
        const updatedEditTbl = {
          modified_date: actionDate,
          updated_by: logUserId,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        dataModify = await model.edit.update(updatedEditTbl, {
          where: { editable_id: id },
        });
      } else {
        const createData = {
          type: type,
          editable_id: id,
          modified_date: actionDate,
          registration_date: getInformations.created_at ? getInformations.created_at : actionDate,
          created_by: getInformations.created_by ? getInformations.created_by : logUserId,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
        };

        dataModify = await model.edit.create(createData);
      }

      if (dataModify) {
        returnStr = true;
      } else {
        returnStr = false;
      }
    } else {
      returnStr = false;
    }
    return returnStr;
  } catch (error) {
    console.log(error);
    return false;
  }
};
