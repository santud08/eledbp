import model from "../../../models/index.js";
import { awsService } from "../../../services/index.js";
import { Op } from "sequelize";
import { envs } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * importJsonTmdbIdData
 * @param req
 * @param res
 */
export const importJsonTmdbIdData = async (req, res, next) => {
  try {
    const s3 = new awsService.AWS.S3();
    const bucketName = envs.s3.BUCKET_NAME;
    let jsonData = [];
    const userId = req.userDetails.userId;

    if (req.file) {
      const fileDetails = req.file;
      //Insert Json file details in imported_files table
      const originalname = fileDetails.originalname ? fileDetails.originalname : "";
      const filename = fileDetails.key ? fileDetails.key : "";
      const insertJsonFile = {
        file_original_name: originalname,
        file_name: filename,
        source: "tmdb_file",
        upload_status: "pending",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      const importFileData = await model.importFiles.create(insertJsonFile);
      const importedFileId = importFileData.id;

      //Read Json sheet
      const params = {
        Bucket: bucketName + "/uploads/bulks/import",
        Key: fileDetails.key,
      };
      const stream = await s3.getObject(params).promise();
      jsonData = JSON.parse(stream.Body.toString("utf8")).data;

      if (jsonData.length > 0) {
        for (let getValue of jsonData) {
          let getType = getValue["type"] ? getValue["type"] : "";
          getType = getType == "Movie" ? "movie" : getType;
          getType = getType == "TV" ? "tv" : getType;
          const programCode = getValue["program_code"] ? getValue["program_code"] : "";
          const getTmdbId =
            getValue["tmdb_id"] !== null &&
            getValue["tmdb_id"] !== "" &&
            getValue["tmdb_id"] !== undefined
              ? getValue["tmdb_id"]
              : "";
          const getTitle =
            getValue["title_name"] !== null &&
            getValue["title_name"] !== "" &&
            getValue["title_name"] !== undefined
              ? getValue["title_name"]
              : null;
          // Generate Unik Code
          const whl = true;
          let generatedCode = "";
          if (programCode) {
            generatedCode = programCode;
          } else {
            while (whl) {
              generatedCode = await generalHelper.generateBulkImportCode(getType);
              const isExists = await model.importData.findOne({
                where: { uuid: generatedCode },
              });
              if (!isExists) {
                break;
              }
            }
          }

          // Check if type is not(movie,tv)
          if (getType != "movie" && getType != "tv") {
            const insertData = {
              imported_file_id: importedFileId,
              type: getType,
              uuid: generatedCode,
              tmdb_id: getTmdbId,
              title_name: getTitle,
              message: "Type must be Movie or TV",
              source: "tmdb_file",
              import_status: "failure",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.importData.create(insertData);
          } else if (getTmdbId == "") {
            const insertData = {
              imported_file_id: importedFileId,
              type: getType,
              uuid: generatedCode,
              tmdb_id: getTmdbId,
              title_name: getTitle,
              message: "you must provide tmdb_id",
              source: "tmdb_file",
              import_status: "failure",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.importData.create(insertData);
          } else {
            // check TMDB Id exist or not
            const checkTmdbId = await model.importData.findOne({
              attributes: ["id"],
              where: {
                tmdb_id: getTmdbId,
                imported_file_id: importedFileId,
                type: getType,
                status: { [Op.ne]: "deleted" },
              },
            });

            if (checkTmdbId) {
              const insertData = {
                imported_file_id: importedFileId,
                type: getType,
                uuid: generatedCode,
                tmdb_id: getTmdbId,
                title_name: getTitle,
                message: "TMDB Id already exist",
                source: "tmdb_file",
                import_status: "duplicate",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.importData.create(insertData);
            } else {
              const insertData = {
                imported_file_id: importedFileId,
                type: getType,
                uuid: generatedCode,
                tmdb_id: getTmdbId,
                title_name: getTitle,
                message: "",
                source: "tmdb_file",
                import_status: "pending",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.importData.create(insertData);
            }
          }
        }
      } else {
        //update status
        const updateimportFiles = {
          upload_status: "failed",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.importFiles.update(updateimportFiles, {
          where: { id: importedFileId },
        });
      }

      res.ok({ message: res.__("success") });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
