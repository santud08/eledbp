import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { adminValidation } from "../../validations/index.js";
const settingsRouter = Router();

settingsRouter.post(
  "/front-line/footer/privacy-policy",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.list"]),
  adminValidation.frontlistValidation.footerPrivacyPolicyList,
  adminController.frontlist.footerPrivacyPolicyList,
);

settingsRouter.post(
  "/front-line/footer/privacy-policy/add",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.create"]),
  adminValidation.frontlistValidation.footerPrivacyPolicyAdd,
  adminController.frontlist.footerPrivacyPolicyAdd,
);

settingsRouter.post(
  "/front-line/footer/privacy-policy/edit",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.update"]),
  adminValidation.frontlistValidation.footerPrivacyPolicyEdit,
  adminController.frontlist.footerPrivacyPolicyEdit,
);

settingsRouter.post(
  "/front-line/footer/privacy-policy/details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.view"]),
  adminValidation.frontlistValidation.footerPrivacyPolicyDetails,
  adminController.frontlist.footerPrivacyPolicyDetails,
);

settingsRouter.post(
  "/front-line/footer/privacy-policy/status-change",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.update"]),
  adminValidation.frontlistValidation.footerPrivacyPolicyStatusChange,
  adminController.frontlist.footerPrivacyPolicyStatusChange,
);

settingsRouter.post(
  "/front-line/footer/privacy-policy/delete",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.delete"]),
  adminValidation.frontlistValidation.footerPrivacyPolicyDelete,
  adminController.frontlist.footerPrivacyPolicyDelete,
);

settingsRouter.get(
  "/front-line/main/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.list"]),
  adminController.frontlist.frontLineMainList,
);

settingsRouter.post(
  "/front-line/main/status-change",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.update"]),
  adminValidation.frontlistValidation.frontLineMainStatusChange,
  adminController.frontlist.frontLineMainStatusChange,
);

settingsRouter.post(
  "/front-line/main/top-news/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.list"]),
  adminValidation.frontlistValidation.frontLineMainTopNewsList,
  adminController.frontlist.frontLineMainTopNewsList,
);

settingsRouter.post(
  "/front-line/main/top-news/edit",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.update"]),
  adminValidation.frontlistValidation.frontLineMainTopNewsEdit,
  adminController.frontlist.frontLineMainTopNewsEdit,
);

settingsRouter.post(
  "/front-line/main/top-news/refresh",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["front_lists.update"]),
  adminValidation.frontlistValidation.frontLineMainTopNewsListRefresh,
  adminController.frontlist.frontLineMainTopNewsListRefresh,
);

export { settingsRouter };
