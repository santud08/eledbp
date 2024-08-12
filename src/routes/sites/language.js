import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey } from "../../middleware/index.js";

const languageRouter = Router();

languageRouter.get(
  "/language-list",
  validateApiKey,
  siteController.languageController.languageDropdownList,
);

export { languageRouter };
