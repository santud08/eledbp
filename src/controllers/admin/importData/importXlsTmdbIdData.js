import model from "../../../models/index.js";
import { awsService } from "../../../services/index.js";
import { Op } from "sequelize";
import xlsx from "xlsx";
import { envs } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * importXlsTmdbIdData
 * @param req
 * @param res
 */
export const importXlsTmdbIdData = async (req, res, next) => {
  try {
    const s3 = new awsService.AWS.S3();
    const bucketName = envs.s3.BUCKET_NAME;
    let excelData = [];
    const userId = req.userDetails.userId;

    if (req.file) {
      const fileDetails = req.file;

      //Insert XL file details in imported_files table
      const originalname = fileDetails.originalname ? fileDetails.originalname : "";
      const filename = fileDetails.key ? fileDetails.key : "";
      const insertXlFile = {
        file_original_name: originalname,
        file_name: filename,
        source: "tmdb_file",
        upload_status: "pending",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      const importFileData = await model.importFiles.create(insertXlFile);
      const importedFileId = importFileData.id;

      //Read XL sheet
      // Reading our test file
      const params = {
        Bucket: `${bucketName}/uploads/bulks/import`,
        Key: fileDetails.key,
      };
      const stream = s3.getObject(params).createReadStream();

      let buffers = [];

      stream.on("data", function (data) {
        buffers.push(data);
      });

      stream.on("end", async () => {
        const buffer = Buffer.concat(buffers);
        const file = xlsx.read(buffer, { cellDates: true, cellText: false });
        const sheets = file.SheetNames;
        if (sheets.length > 0) {
          for (let i = 0; i < sheets.length; i++) {
            excelData = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {
              header: "A",
              //blankrows: true,
              raw: false,
              //dateNF: 'yyyy"-"mm"-"dd',
            });
          }
        }

        if (excelData.length > 0) {
          //validate data of type number or string
          let i = 0;
          for (let checkEachRow of excelData) {
            if (i > 0) {
              const getA =
                checkEachRow["A"] !== null &&
                checkEachRow["A"] !== "" &&
                checkEachRow["A"] !== undefined
                  ? checkEachRow["A"]
                  : null;

              const getC =
                checkEachRow["C"] !== null &&
                checkEachRow["C"] !== "" &&
                checkEachRow["C"] !== undefined
                  ? checkEachRow["C"]
                  : "";

              const getType =
                checkEachRow["E"] !== null &&
                checkEachRow["E"] !== "" &&
                checkEachRow["E"] !== undefined
                  ? checkEachRow["E"] == "Movie"
                    ? "movie"
                    : checkEachRow["E"] == "TV"
                    ? "tv"
                    : ""
                  : "";
              const getTmdbId =
                checkEachRow["F"] !== null &&
                checkEachRow["F"] !== "" &&
                checkEachRow["F"] !== undefined
                  ? checkEachRow["F"]
                  : "";
              // Generate Unik Code
              const whl = true;
              let generatedCode = "";
              if (getC) {
                generatedCode = getC;
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
                  title_name: getA,
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
                  title_name: getA,
                  message: "you must provide TMDBID",
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
                    title_name: getA,
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
                    title_name: getA,
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
            i++;
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
      });

      res.ok({ message: res.__("success") });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
