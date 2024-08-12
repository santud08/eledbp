import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userImageUpload,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { adminValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const userRouter = Router();

userRouter.get(
  "/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["user_management.list"]),
  adminValidation.userValidation.userList,
  adminController.user.userList,
);

userRouter.get(
  "/type",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["user_management.view"]),
  adminController.user.userType,
);

userRouter.get(
  "/details/:id",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["user_management.view"]),
  adminValidation.userValidation.userDetails,
  adminController.user.userDetails,
);

userRouter.post(
  "/delete",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["user_management.delete"]),
  adminValidation.userValidation.deleteUser,
  adminController.user.deleteUser,
);

userRouter.post(
  "/add",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["user_management.create"]),
  customFileHelper.customFileUpload(userImageUpload.single("profile_image")),
  adminValidation.userValidation.addUser,
  adminController.user.addUser,
);

userRouter.post(
  "/edit",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["user_management.update"]),
  adminValidation.userValidation.editUser,
  adminController.user.editUser,
);

userRouter.get("/menu", validateApiKey, validateAccessToken, adminController.user.userMenu);

export { userRouter };
