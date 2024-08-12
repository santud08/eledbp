import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { adminValidation } from "../../validations/index.js";
const newsRouter = Router();

newsRouter.post(
  "/news-status",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["news.update"]),
  adminValidation.newsValidation.newsStatus,
  adminController.news.newsStatus,
);

newsRouter.post(
  "/news-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["news.list"]),
  adminValidation.newsValidation.newsList,
  adminController.news.newsList,
);

export { newsRouter };
