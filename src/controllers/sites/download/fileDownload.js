import { customFileHelper } from "../../../helpers/index.js";
import fs from "fs";

/**
 * Donwload file from encoded url
 * @param req
 * @param res
 * @param next
 */
export const fileDownload = async (req, res, next) => {
  try {
    const url = Buffer.from(req.query.url, "hex").toString("utf8");
    const type = typeof req.query.ul == "undefined" || req.query.ul == true ? true : false;
    if (url) {
      res.download(url, url.split("/").pop(), function (err) {
        if (err) {
          console.log(err);
        }
        if (type) {
          customFileHelper.customFileUnlink(fs, url);
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
