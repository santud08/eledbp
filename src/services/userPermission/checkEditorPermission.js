import { userPermissionService } from "../../services/index.js";

/*
 * checkEditorPermission
 * check the user permission by user role for editor has permission to edit or not
 * return string- y/n
 */

export const checkEditorPermission = async (req, recordId, type) => {
  const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
  const userType = req.userDetails && req.userDetails.user_type ? req.userDetails.user_type : null;
  //check edit permission
  let isEdit = "n";
  if (userType && userId) {
    if (userType == "editor") {
      const checkUserRecordPermission = await userPermissionService.checkUserRecordPermission(
        recordId,
        type,
        userId,
      );
      isEdit = checkUserRecordPermission ? "y" : "n";
    } else if (userType == "admin" || userType == "super_admin") {
      isEdit = "y";
    } else {
      isEdit = "n";
    }
  }
  return isEdit;
};
