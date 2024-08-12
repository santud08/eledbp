import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";

export const getTvNetworkFile = async () => {
  try {
    const fetchDate = await customDateTimeHelper.getCurrentUTCTime("MM_DD_YYYY");
    const currentDate = await customDateTimeHelper.getCurrentDateTime();
    const fileName = `${fetchDate}.json.gz`;
    const convertFileName = `${fetchDate}.json`;
    const data = await tmdbService.getTvNetworkListFile(fileName, convertFileName);
    console.log("data", data);
    if (data && data.length > 0) {
      console.log(
        `${consoleColors.fg.blue} network-data-found-to-generate-import-file \n ${consoleColors.reset}`,
      );
    } else {
      console.log(
        `${consoleColors.fg.red} no-network-data-found-to-generate-import-file \n ${consoleColors.reset}`,
      );
    }
    console.log("tv network import file from export fetch at: ", fetchDate);
    console.log("service update tv networks export file runs at: ", currentDate);
    console.log(
      `${consoleColors.fg.green} network-data-imported file generated successfully \n ${consoleColors.reset}`,
    );
  } catch (error) {
    console.log(error);
  }
};
