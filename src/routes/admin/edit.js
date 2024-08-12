import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import { adminValidation } from "../../validations/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userAdminAccessControl,
} from "../../middleware/index.js";

const editRouter = Router();

editRouter.get(
  "/title/status-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.view"]),
  adminValidation.listValidation.titleStatusList,
  adminController.listController.titleStatusList,
);

editRouter.get(
  "/operation/type-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.view"]),
  adminController.listController.operationTypeList,
);

editRouter.post(
  "/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.list"]),
  adminValidation.listValidation.editList,
  adminController.listController.editList,
);

editRouter.get(
  "/title-type",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.view"]),
  adminController.listController.titleTypeList,
);

editRouter.post(
  "/add-operation",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.create"]),
  adminValidation.listValidation.operationAdd,
  adminController.listController.operationAdd,
);

editRouter.get(
  "/editor-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.view"]),
  adminValidation.listValidation.editorList,
  adminController.listController.editorList,
);

editRouter.post(
  "/allocate-editor",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.update"]),
  adminValidation.listValidation.allocateEditor,
  adminController.listController.allocateEditor,
);

editRouter.post(
  "/check-title-editor",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.view"]),
  adminValidation.listValidation.checkTitleEditor,
  adminController.listController.checkTitleEditor,
);

editRouter.post(
  "/de-allocate-editor",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.update"]),
  adminValidation.listValidation.deAllocateEditor,
  adminController.listController.deAllocateEditor,
);

editRouter.post(
  "/status-change",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.update"]),
  adminValidation.listValidation.statusChange,
  adminController.listController.statusChange,
);

editRouter.post(
  "/delete",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["list.delete"]),
  adminValidation.listValidation.editDelete,
  adminController.listController.editDelete,
);

export { editRouter };
