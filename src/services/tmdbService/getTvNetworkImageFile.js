import axios from "axios";
import https from "https";
import fs from "fs";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * getTvNetworkImageFile by image url
 * @param pathName
 */
export const getTvNetworkImageFile = async (fileName, pathName) => {
  try {
    if (pathName && pathName) {
      const downloadDestination = `src/assets/images/network/${fileName}`;
      const copyFileNameDestination = `${TMDB_APIS.IMAGES.secure_base_url}original${pathName}`;
      if (!fs.existsSync(downloadDestination)) {
        const agent = new https.Agent({
          rejectUnauthorized: false,
        });
        const axiosConfig = {
          method: "get",
          url: `${copyFileNameDestination}`,
          httpsAgent: agent,
          responseType: "stream",
        };
        return await axios(axiosConfig).then((results) => {
          if (results) {
            if (results.data) {
              const wstream = fs.createWriteStream(downloadDestination);
              results.data.pipe(wstream);
            }
          }
        });
      }
      return downloadDestination;
    } else {
      return "";
    }
  } catch (error) {
    return "";
  }
};
