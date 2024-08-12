import { StatusError } from "../config/index.js";
import { userPermissionService, titleService } from "../services/index.js";

/**
 * This function is used for validating access control for front end user
 * for first phase it is temporary basis need to modify in 2nd phase
 * @param req
 * @param res
 * @param next
 */

export const userAccessControl = (permission, param, section, requestType = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.userDetails.userId ? req.userDetails.userId : "";
      if (!userId) throw StatusError.unauthorized("");
      const userRoleId = req.userDetails.user_role_id ? req.userDetails.user_role_id : "";
      if (!userRoleId) throw StatusError.unauthorized("");
      const userType = req.userDetails.user_type ? req.userDetails.user_type : "";
      if (!userType) throw StatusError.unauthorized("");
      if (userType == "guests" || userType == "users")
        throw StatusError.unauthorized(res.__(`You have no permission to ${section} this section`));
      if (userType == "admin" || userType == "super_admin") {
        next();
      } else if (userType == "editor") {
        if (
          permission &&
          ["title", "movie", "tv", "webtoons", "people"].includes(permission) &&
          section == "edit"
        ) {
          let recordId = "";
          let recordType = "";
          if (param && requestType == "formdata") {
            recordId = !req.headers["x-formdata-id"] ? null : req.headers["x-formdata-id"];
            if (permission == "title") recordType = await titleService.getTitleTypeById(recordId);
            else recordType = permission;
          } else if (param && requestType == null && eval(`req.${param}`)) {
            recordId = eval(`req.${param}`);
            if (permission == "title") recordType = await titleService.getTitleTypeById(recordId);
            else recordType = permission;
          }

          const checkPermission = await userPermissionService.checkUserRecordPermission(
            recordId,
            recordType,
            userId,
          );
          if (!checkPermission) {
            throw StatusError.unauthorized(
              res.__(`You have no permission to ${section} this section`),
            );
          } else {
            next();
          }
        } else {
          throw StatusError.unauthorized(
            res.__(`You have no permission to ${section} this section`),
          );
        }
      } else {
        throw StatusError.unauthorized(res.__(`You have no permission to ${section} this section`));
      }
    } catch (error) {
      next(error);
    }
  };
};
