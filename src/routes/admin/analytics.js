import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import { adminValidation } from "../../validations/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userAdminAccessControl,
} from "../../middleware/index.js";

const analyticsRouter = Router();

analyticsRouter.get(
  "/category-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.list"]),
  adminValidation.analyticValidation.categoryList,
  adminController.analytic.categoryList,
);

analyticsRouter.get(
  "/db-content",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.list"]),
  adminValidation.analyticValidation.dbContent,
  adminController.analytic.dbContent,
);

analyticsRouter.get(
  "/export/db-content/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.view"]),
  adminValidation.analyticValidation.exportDbContentDownload,
  adminController.analytic.exportDbContentDownload,
);

analyticsRouter.post(
  "/community/report/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.list"]),
  adminValidation.analyticValidation.communityReportList,
  adminController.analytic.communityReportList,
);

analyticsRouter.post(
  "/export/community/report/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.view"]),
  adminValidation.analyticValidation.exportCommunityReportDownload,
  adminController.analytic.exportCommunityReportDownload,
);

analyticsRouter.post(
  "/user/feedback/report/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.list"]),
  adminValidation.analyticValidation.userFeedbackReportList,
  adminController.analytic.userFeedbackReportList,
);

analyticsRouter.post(
  "/export/user/feedback/report/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["bulk_report.view"]),
  adminValidation.analyticValidation.exportUserFeedbackReportDownload,
  adminController.analytic.exportUserFeedbackReportDownload,
);

analyticsRouter.post(
  "/statistics/page/view",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.pageView,
  adminController.statistics.pageView,
);

analyticsRouter.post(
  "/statistics/page/view/by-type",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.pageViewByType,
  adminController.statistics.pageViewByType,
);

analyticsRouter.post(
  "/statistics/page/search",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.pageSearch,
  adminController.statistics.pageSearch,
);

analyticsRouter.post(
  "/statistics/page/view/by-session",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.viewPageBySession,
  adminController.statistics.viewPageBySession,
);

analyticsRouter.post(
  "/statistics/page/view/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.pageViewDownload,
  adminController.statistics.pageViewDownload,
);

analyticsRouter.post(
  "/statistics/page/view/by-type/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.pageViewByTypeDownload,
  adminController.statistics.pageViewByTypeDownload,
);

analyticsRouter.post(
  "/statistics/page/search/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.pageSearchDownload,
  adminController.statistics.pageSearchDownload,
);

analyticsRouter.post(
  "/statistics/page/view/by-session/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["statistics.list"]),
  adminValidation.statisticsValidation.viewPageBySessionDownload,
  adminController.statistics.viewPageBySessionDownload,
);

export { analyticsRouter };
