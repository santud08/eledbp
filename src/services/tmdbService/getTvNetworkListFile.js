import axios from "axios";
import https from "https";
import { TMDB_APIS } from "../../utils/constants.js";
import fs from "fs";
import zlib from "zlib";

/**
 * getTvNetworkListFile by export
 * @param fileName
 */
export const getTvNetworkListFile = async (fileName, convertFileName) => {
  try {
    let API_URL = "";
    if (fileName) {
      API_URL = `${TMDB_APIS.TV_NETWORK_EXPORT_API_URL}${fileName}`;
    } else {
      return [];
    }
    const downloadDestination = `public/download/export_tv_networks/${fileName}`;
    const convertFileNameDestination = `public/download/export_tv_networks/${convertFileName}`;
    if (!fs.existsSync(downloadDestination)) {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const axiosConfig = {
        method: "get",
        url: `${API_URL}`,
        httpsAgent: agent,
        responseType: "arraybuffer",
      };
      return await axios(axiosConfig).then((results) => {
        if (results) {
          if (results.data) {
            fs.writeFileSync(downloadDestination, results.data);
            const gunzip = zlib.createGunzip();
            const rstream = fs.createReadStream(downloadDestination);
            const wstream = fs.createWriteStream(convertFileNameDestination);
            rstream.pipe(gunzip).pipe(wstream);
            const readData = fs.readFileSync(convertFileNameDestination, { encoding: "utf8" });
            if (readData) {
              const spiltArr = readData.split("\n");
              let finalArr = [];
              for (const eObj of spiltArr) {
                if (eObj) finalArr.push(JSON.parse(eObj));
              }
              return finalArr;
            }
            return [];
          } else {
            return [];
          }
        } else {
          return [];
        }
      });
    } else {
      if (!fs.existsSync(convertFileNameDestination)) {
        const gunzip = zlib.createGunzip();
        const rstream = fs.createReadStream(downloadDestination);
        const wstream = fs.createWriteStream(convertFileNameDestination);
        rstream.pipe(gunzip).pipe(wstream);
      }
      const readData = fs.readFileSync(convertFileNameDestination, { encoding: "utf8" });
      if (readData) {
        const spiltArr = readData.split("\n");
        let finalArr = [];
        for (const eObj of spiltArr) {
          if (eObj) finalArr.push(JSON.parse(eObj));
        }
        return finalArr;
      }
      return [];
    }
  } catch (error) {
    return [];
  }
};
