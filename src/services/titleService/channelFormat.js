import model from "../../models/index.js";

/**
 * channelFormat
 * @param titleId
 * @param titleType
 * @param tmdbChannelData // channel details that are from TMDB response
 * @param seasonId
 */

export const channelFormat = async (titleId, titleType, tmdbChannelData, seasonId) => {
  try {
    let getChannelList = [];
    const titleValid = await model.title.findOne({
      where: {
        id: titleId,
        type: titleType,
        record_status: "active",
      },
    });
    if (titleValid) {
      //Channel Details from TMDB
      if (tmdbChannelData) {
        for (const value of tmdbChannelData) {
          let channelId = "";
          const record = {
            tv_network_id: value.tv_network_id,
            tv_network_name: value.tv_network_name,
          };
          if (seasonId) {
            let relatedChannelList = await model.titleChannelList.findOne({
              attributes: ["id", "tv_network_id", "title_id", "season_id"],
              where: {
                season_id: seasonId,
                title_id: titleId,
                status: "active",
              },
            });
            channelId = relatedChannelList && relatedChannelList.id ? relatedChannelList.id : "";
          }
          record.id = channelId;
          getChannelList.push(record);
        }
      }
      return getChannelList;
    } else {
      return getChannelList;
    }
  } catch (e) {
    console.log("error", e);
    return [];
  }
};
