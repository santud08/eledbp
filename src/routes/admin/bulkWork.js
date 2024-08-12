import { Router } from "express";
import { adminController } from "../../controllers/index.js";
import { adminValidation } from "../../validations/index.js";
import {
  validateAccessToken,
  validateApiKey,
  importFileUpload,
  userAdminAccessControl,
} from "../../middleware/index.js";
import { customFileHelper } from "../../helpers/index.js";

const bulkWorkRouter = Router();

bulkWorkRouter.post(
  "/import/file-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.list"]),
  adminValidation.importValidation.importFileList,
  adminController.importData.importFileList,
);

bulkWorkRouter.post(
  "/import/file-details",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.view"]),
  adminValidation.importValidation.importFileDetails,
  adminController.importData.importFileDetails,
);

bulkWorkRouter.get(
  "/import/data/file/tmdbid/samples",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.download"]),
  adminValidation.importValidation.downloadSample,
  adminController.importData.downloadTmdbIdSample,
);

bulkWorkRouter.post(
  "/import/data/tmdbid/xls",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.create"]),
  customFileHelper.customFileUpload(importFileUpload.single("importfile")),
  adminController.importData.importXlsTmdbIdData,
);

bulkWorkRouter.post(
  "/import/data/tmdbid/json",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.create"]),
  customFileHelper.customFileUpload(importFileUpload.single("importfile")),
  adminController.importData.importJsonTmdbIdData,
);

bulkWorkRouter.post(
  "/export/list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["export.list"]),
  adminValidation.exportValidation.exportList,
  adminController.exportData.exportList,
);

bulkWorkRouter.get(
  "/export/list/download",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["export.download"]),
  adminValidation.exportValidation.exportListDownload,
  adminController.exportData.exportListDownload,
);

bulkWorkRouter.get(
  "/work-list/search-type-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["worklist.view", "award.view"]),
  adminController.worklist.searchTypeList,
);

bulkWorkRouter.get(
  "/work-list/search-id-type-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["worklist.view"]),
  adminController.worklist.searchIdTypeList,
);

bulkWorkRouter.post(
  "/work-list",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["worklist.list"]),
  adminValidation.worklistValidation.workList,
  adminController.worklist.workList,
);

bulkWorkRouter.post(
  "/work-list/export",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["worklist.download"]),
  adminValidation.worklistValidation.downloadWorkList,
  adminController.worklist.downloadWorkList,
);

/** Older,currently not in used -start**/
bulkWorkRouter.post(
  "/import/data/xls",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.create"]),
  customFileHelper.customFileUpload(importFileUpload.single("importfile")),
  adminController.importData.importXlsData,
);

bulkWorkRouter.post(
  "/import/data/json",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.create"]),
  customFileHelper.customFileUpload(importFileUpload.single("importfile")),
  adminController.importData.importJsonData,
);

bulkWorkRouter.get(
  "/import/data/file/samples",
  validateApiKey,
  validateAccessToken,
  userAdminAccessControl(["import.download"]),
  adminValidation.importValidation.downloadSample,
  adminController.importData.downloadSample,
);
/** Older,currently not in used -end**/

//for developer use only-start//
bulkWorkRouter.post(
  "/import/data/tmdbid/manually",
  validateApiKey,
  validateAccessToken,
  adminController.importData.importTmdbDataManually,
);

bulkWorkRouter.post(
  "/import/data/people-job/manually",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updatePeopleDepartment,
);

bulkWorkRouter.post(
  "/import/data/update/title-vote-count/manually",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updateTitleVoteCount,
);

bulkWorkRouter.post(
  "/import/data/people-aka/manually",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updatePeopleAka,
);

bulkWorkRouter.post(
  "/import/data/people-country/manually",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updatePeopleCountry,
);

bulkWorkRouter.post(
  "/import/data/people-media/add-in-scheduler",
  validateApiKey,
  validateAccessToken,
  adminController.importData.addPeopleMediaInScheduleJob,
);

bulkWorkRouter.post(
  "/import/client-json-data",
  validateApiKey,
  validateAccessToken,
  adminController.importData.importClientJsonData,
);

bulkWorkRouter.post(
  "/update/series/related-title-combinations",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updateTitleSeriesCombinationData,
);

bulkWorkRouter.post(
  "/update/tv-videos-from-tmdb",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updateTvVideosFromTmdb,
);

bulkWorkRouter.post(
  "/import/update-tag-json-data",
  validateApiKey,
  validateAccessToken,
  adminController.importData.UpdateJsonTag,
);

bulkWorkRouter.post(
  "/import/update-tv-last-air-date",
  validateApiKey,
  validateAccessToken,
  adminController.importData.updateTvLastAirDate,
);
//for developer use only-end//

export { bulkWorkRouter };
