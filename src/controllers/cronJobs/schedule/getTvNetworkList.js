import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";

export const getTvNetworkList = async () => {
  try {
    const fetchDate = await customDateTimeHelper.getCurrentUTCTime("MM_DD_YYYY");
    const currentDate = await customDateTimeHelper.getCurrentDateTime();
    const fileName = `${fetchDate}.json.gz`;
    const convertFileName = `${fetchDate}.json`;
    const data = await tmdbService.getTvNetworkListFile(fileName, convertFileName);
    console.log("data", data);
    if (data && data.length > 0) {
      console.log(
        `${consoleColors.fg.blue} network-data-found-to-import \n ${consoleColors.reset}`,
      );
      for (const eachData of data) {
        if (eachData) {
          const tmdbNetworkId = eachData.id;
          const tmdbNetworkName = eachData.name;
          const getImage = await tmdbService.fetchNetworkImages(tmdbNetworkId);
          let logoImage = "";
          let logoImageName = "";
          console.log(
            `${consoleColors.fg.magenta} network-data-${tmdbNetworkId}-${tmdbNetworkName} processing... \n ${consoleColors.reset}`,
          );
          if (getImage) {
            logoImage =
              getImage.logos && getImage.logos.length > 0 ? getImage.logos[0].file_path : "";
            logoImageName = logoImage ? logoImage.replace("/", "") : "";
          }
          const checkExt = await model.tvNetworks.findOne({
            where: {
              tmdb_network_id: tmdbNetworkId,
            },
          });
          if (checkExt) {
            const updateData = {
              tmdb_network_id: tmdbNetworkId,
              network_name: tmdbNetworkName,
              logo: logoImageName,
              status: "active",
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.tvNetworks.update(updateData, { where: { id: checkExt.id } });
            console.log(
              `${consoleColors.fg.green} network-data-${tmdbNetworkId}-${tmdbNetworkName} updated successfully \n ${consoleColors.reset}`,
            );
          } else {
            const createData = {
              tmdb_network_id: tmdbNetworkId,
              network_name: tmdbNetworkName,
              logo: logoImageName,
              status: "active",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.tvNetworks.create(createData);
            console.log(
              `${consoleColors.fg.green} network-data-${tmdbNetworkId}-${tmdbNetworkName} imported successfully \n ${consoleColors.reset}`,
            );
          }
          if (logoImage) {
            await tmdbService.getTvNetworkImageFile(logoImageName, logoImage);
          }
          console.log(
            `${consoleColors.fg.yellow} network-data-${tmdbNetworkId}-${tmdbNetworkName} process end \n ${consoleColors.reset}`,
          );
        }
      }
    } else {
      console.log(
        `${consoleColors.fg.red} no-network-data-found-to-import \n ${consoleColors.reset}`,
      );
    }
    console.log("tv network import from file export fetch at: ", fetchDate);
    console.log("service update tv networks export file runs at: ", currentDate);
    console.log(
      `${consoleColors.fg.green} network-data-imported Quee completed successfully \n ${consoleColors.reset}`,
    );
  } catch (error) {
    console.log(error);
  }
};
