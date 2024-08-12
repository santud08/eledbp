import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import {
  validateAccessToken,
  validateApiKey,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { adminValidation } from "../../validations/index.js";
const dictionaryRouter = Router();

dictionaryRouter.post(
  "/agency/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.list"]),
  adminValidation.agencyValidation.agencyList,
  adminController.agency.agencyList,
);

dictionaryRouter.get(
  "/agency/details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.view"]),
  adminValidation.agencyValidation.agencyDetails,
  adminController.agency.agencyDetails,
);

dictionaryRouter.post(
  "/agency/artist-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.view"]),
  adminValidation.agencyValidation.agencyArtistList,
  adminController.agency.agencyArtistList,
);

dictionaryRouter.get(
  "/agency/auto-generate-code",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.create"]),
  adminController.agency.generateAgencyCode,
);

dictionaryRouter.post(
  "/agency/delete",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.delete"]),
  adminValidation.agencyValidation.agencyDelete,
  adminController.agency.agencyDelete,
);

dictionaryRouter.post(
  "/agency/add",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.create"]),
  adminValidation.agencyValidation.agencyAdd,
  adminController.agency.agencyAdd,
);

dictionaryRouter.post(
  "/agency/edit",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["agency.update"]),
  adminValidation.agencyValidation.agencyEdit,
  adminController.agency.agencyEdit,
);

dictionaryRouter.post(
  "/tag/add-main-category",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.create"]),
  adminValidation.tagValidation.addMainCategory,
  adminController.tag.addMainCategory,
);

dictionaryRouter.post(
  "/tag/add-sub-category",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.create"]),
  adminValidation.tagValidation.addSubCategory,
  adminController.tag.addSubCategory,
);

dictionaryRouter.post(
  "/tag/add-tag",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.create"]),
  adminValidation.tagValidation.addTag,
  adminController.tag.addTag,
);

dictionaryRouter.post(
  "/tag/edit-tag",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.update"]),
  adminValidation.tagValidation.editTag,
  adminController.tag.editTag,
);

dictionaryRouter.post(
  "/tag/delete-tag",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.delete"]),
  adminValidation.tagValidation.deleteTag,
  adminController.tag.deleteTag,
);

dictionaryRouter.post(
  "/tag/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.list"]),
  adminValidation.tagValidation.tagList,
  adminController.tag.tagList,
);

dictionaryRouter.get(
  "/tag/category-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.view"]),
  adminValidation.tagValidation.categoryList,
  adminController.tag.categoryList,
);

dictionaryRouter.get(
  "/tag/sub-category-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.view"]),
  adminValidation.tagValidation.subCategoryList,
  adminController.tag.subCategoryList,
);

dictionaryRouter.get(
  "/tag/data-download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.download"]),
  adminValidation.tagValidation.tagDataExcelDownload,
  adminController.tag.tagDataExcelDownload,
);

dictionaryRouter.get(
  "/tag/details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.view"]),
  adminValidation.tagValidation.tagDetails,
  adminController.tag.tagDetails,
);

//for developer use only start//
dictionaryRouter.post(
  "/tag/add-from-file/manually",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["tag.create"]),
  adminController.tag.tagAddManually,
);
//for developer use only end//

export { dictionaryRouter };
