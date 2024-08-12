import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * frontLineMainStatusChange
 * @param req
 * @param res
 */
export const frontLineMainStatusChange = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const areaKey = reqBody.area_key ? reqBody.area_key : "";
    const status = reqBody.status ? reqBody.status : "";
    const data = {};
    let statusValue = "";
    if (status == "inactive") {
      statusValue = false;
    } else if (status == "active") {
      statusValue = true;
    }

    const getSettingsDetails = await model.settings.findOne({
      where: { name: "settings.front_lists.main", status: "active" },
    });
    if (!getSettingsDetails) throw StatusError.badRequest(res.__("Invalid Inputs"));

    let settingValue =
      getSettingsDetails.value != "" && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    if (settingValue && typeof settingValue[areaKey] != "undefined" && statusValue !== "") {
      settingValue[areaKey] = statusValue;
    }
    data.value = settingValue;

    await model.settings.update(data, {
      where: { id: getSettingsDetails.id, name: "settings.front_lists.main" },
    });

    res.ok({
      message: res.__("Status changed successfully."),
    });
  } catch (error) {
    next(error);
  }
};
