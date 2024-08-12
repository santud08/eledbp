import fs from "fs";

/**
 * downloadSample
 * @param req
 * @param res
 */
export const downloadSample = async (req, res, next) => {
  try {
    const type = req.query.type ? req.query.type : "";

    const fileName = type == "xls" ? "sample.xlsx" : "sample.json";
    const coppyPath = `src/assets/samples/bulk-work/import/${fileName}`;
    const destinationPath = `public/download_file/${fileName}`;
    if (type && coppyPath) {
      fs.copyFileSync(coppyPath, destinationPath);
      res.ok({
        path: Buffer.from(`${destinationPath}`).toString("hex"),
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
