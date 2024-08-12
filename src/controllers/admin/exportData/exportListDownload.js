import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { StatusError } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { envs } from "../../../config/index.js";

/**
 * exportListDownload
 * @param req
 * @param res
 */
export const exportListDownload = async (req, res, next) => {
  try {
    const exportId = req.query.id ? req.query.id : "";
    // check for id existance in export table
    const getExportData = await model.exportData.findOne({
      attributes: [
        "id",
        "file_name",
        [
          fn("REPLACE", col("file_path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
          "file_path",
        ],
      ],
      where: { id: exportId, status: { [Op.ne]: "deleted" } },
    });
    if (!getExportData) throw StatusError.badRequest(res.__("Invalid id"));

    const path = getExportData.file_path;
    const fileName = getExportData.file_name;
    const destinationPath = `public/download_file/${Date.now()}_${fileName}`;
    if (path) {
      await generalHelper.downloadFileFromUrl(destinationPath, path);
      res.ok({
        path: fileName ? Buffer.from(`${destinationPath}`).toString("hex") : "",
      });
    } else {
      res.ok({
        path: "",
      });
    }
  } catch (error) {
    next(error);
  }
};
