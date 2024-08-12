import model from "../../../models/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * tvNetworkList
 * @param req
 * @param res
 */
export const tvNetworkList = async (req, res, next) => {
  try {
    let data = [];
    // Fetching the list of tv networks
    const tvNetworksList = await model.tvNetworks.findAll({ where: { status: "active" } });

    if (tvNetworksList.length > 0) {
      for (let element of tvNetworksList) {
        let networksData = {
          tv_network_id: element.id,
          tmdb_network_id: element.tmdb_network_id,
          network_name: element.network_name,
          icon: element.logo ? await generalHelper.generateNetworkLogoUrl(req, element.logo) : "",
        };
        data.push(networksData);
      }
    }
    res.ok({
      results: data,
    });
  } catch (error) {
    next(error);
  }
};
