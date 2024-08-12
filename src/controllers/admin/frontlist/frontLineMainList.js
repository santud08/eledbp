import model from "../../../models/index.js";

/**
 * frontLineMainList
 * @param req
 * @param res
 */
export const frontLineMainList = async (req, res, next) => {
  try {
    let getSettingsKeywordList = [];
    const getSettingsDetails = await model.settings.findOne({
      where: { name: "settings.front_lists.main", status: "active" },
    });
    if (getSettingsDetails) {
      const settingValue =
        getSettingsDetails.value != null && getSettingsDetails.value != ""
          ? JSON.parse(getSettingsDetails.value)
          : null;
      if (settingValue) {
        for (const settingsKeyword in settingValue) {
          if (settingsKeyword) {
            const record = {
              area_name: res.__(settingsKeyword),
              area_key: settingsKeyword,
              status: settingValue[settingsKeyword] == true ? "active" : "inactive",
            };
            getSettingsKeywordList.push(record);
          }
        }
      }
    }
    res.ok({
      results: getSettingsKeywordList,
    });
  } catch (error) {
    next(error);
  }
};
