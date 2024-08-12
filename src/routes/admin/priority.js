import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { adminValidation } from "../../validations/index.js";
const priorityRouter = Router();

priorityRouter.get(
  "/",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["priority.list"]),
  adminValidation.priorityValidation.priorityList,
  adminController.priority.priorityList,
);

priorityRouter.get(
  "/set-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["priority.list"]),
  adminController.priority.prioritySetList,
);

priorityRouter.post(
  "/save",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["priority.update"]),
  adminValidation.priorityValidation.priorityListSave,
  adminController.priority.priorityListSave,
);

export { priorityRouter };
