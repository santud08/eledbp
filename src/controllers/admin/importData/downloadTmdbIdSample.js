import fs from "fs";

/**
 * downloadTmdbIdSample
 * @param req
 * @param res
 */
export const downloadTmdbIdSample = async (req, res, next) => {
  try {
    const type = req.query.type ? req.query.type : "";

    const fileName = type == "xls" ? "sample.xlsx" : "sample.json";
    const coppyPath = `src/assets/samples/bulk-work/import/tmdb/${fileName}`;
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
