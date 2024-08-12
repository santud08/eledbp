import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import { adminValidation } from "../../validations/index.js";
import {
  validateAccessToken,
  validateApiKey,
  awardImageUpload,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { customFileHelper } from "../../helpers/index.js";

const awardsRouter = Router();

awardsRouter.get(
  "/awards/sector-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.sectorList,
  adminController.award.sectorList,
);

awardsRouter.get(
  "/awards/work-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.workList,
  adminController.award.workList,
);

awardsRouter.get(
  "/awards/character-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.characterList,
  adminController.award.characterList,
);

awardsRouter.post(
  "/awards/delete-award",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.delete"]),
  adminValidation.awardValidation.deleteAward,
  adminController.award.deleteAward,
);

awardsRouter.get(
  "/awards/round-details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.roundDetails,
  adminController.award.roundDetails,
);

awardsRouter.post(
  "/awards/delete-nominees",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.delete"]),
  adminValidation.awardValidation.deleteNominees,
  adminController.award.deleteNominees,
);

awardsRouter.post(
  "/award/add",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.create"]),
  customFileHelper.customFileUpload(awardImageUpload.single("poster_image")),
  adminValidation.awardValidation.awardAdd,
  adminController.award.awardAdd,
);

awardsRouter.post(
  "/award/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.list"]),
  adminValidation.awardValidation.awardList,
  adminController.award.awardList,
);

awardsRouter.get(
  "/award/info/:award_id",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminController.award.awardInfo,
);

awardsRouter.post(
  "/awards/add-sector",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.create"]),
  adminValidation.awardValidation.addSector,
  adminController.award.addSector,
);

awardsRouter.post(
  "/awards/edit-sector",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.update"]),
  adminValidation.awardValidation.editSector,
  adminController.award.editSector,
);

awardsRouter.post(
  "/awards/delete-sector",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.delete"]),
  adminValidation.awardValidation.deleteSector,
  adminController.award.deleteSector,
);

awardsRouter.post(
  "/award/edit",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.update"]),
  customFileHelper.customFileUpload(awardImageUpload.single("poster_image")),
  adminValidation.awardValidation.awardEdit,
  adminController.award.awardEdit,
);

awardsRouter.get(
  "/award/past-details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.awardPastDetails,
  adminController.award.awardPastDetails,
);

awardsRouter.get(
  "/awards/sector-details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.sectorDetails,
  adminController.award.sectorDetails,
);

awardsRouter.get(
  "/awards/sectors",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.awardSectorList,
  adminController.award.awardSectorList,
);

awardsRouter.post(
  "/award/add-nominee",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.create"]),
  adminValidation.awardValidation.awardNomineeAdd,
  adminController.award.awardNomineeAdd,
);

awardsRouter.post(
  "/awards/add-round",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.create"]),
  adminValidation.awardValidation.addRound,
  adminController.award.addRound,
);

awardsRouter.get(
  "/awards/round-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.roundList,
  adminController.award.roundList,
);

awardsRouter.get(
  "/awards/nominee-details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.view"]),
  adminValidation.awardValidation.nomineeDetails,
  adminController.award.nomineeDetails,
);

awardsRouter.post(
  "/awards/edit-nominee",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.update"]),
  adminValidation.awardValidation.awardNomineeEdit,
  adminController.award.awardNomineeEdit,
);

awardsRouter.post(
  "/awards/edit-round",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.update"]),
  adminValidation.awardValidation.editRound,
  adminController.award.editRound,
);

awardsRouter.post(
  "/awards/delete-round",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.delete"]),
  adminValidation.awardValidation.deleteRound,
  adminController.award.deleteRound,
);

awardsRouter.post(
  "/awards/sector/save-order",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["award.update"]),
  adminValidation.awardValidation.editSectorListOrder,
  adminController.award.editSectorListOrder,
);

export { awardsRouter };
