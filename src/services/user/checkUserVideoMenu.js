import { envs } from "../../config/index.js";

/**
 * checkUserVideoMenu
 * chcek video menu will show or not
 * as per settings
 * @param req
 */
export const checkUserVideoMenu = async (req = null) => {
  try {
    let returnStr = false;
    if (envs.MENU_SETTINGS.HIDE_VIDEO_MENU == "true") {
      if (req && req.userDetails && req.userDetails.user_type) {
        if (req.userDetails.user_type == "guests" || req.userDetails.user_type == "users") {
          returnStr = true;
        } else {
          returnStr = false;
        }
      } else {
        returnStr = true;
      }
    }
    return returnStr;
  } catch (error) {
    return envs.MENU_SETTINGS.HIDE_VIDEO_MENU == "true" ? true : false;
  }
};
