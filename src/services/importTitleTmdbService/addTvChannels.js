import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

export const addTvChannels = async (data, titleId, seasonId, createdBy, siteLanguage = "en") => {
  try {
    if (data && data != null && data.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const channelData of data) {
        if (channelData && channelData.tv_network_id && channelData.tv_network_id != null) {
          const watchOnData = {
            title_id: titleId,
            tv_network_id: channelData.tv_network_id ? channelData.tv_network_id : null,
            season_id: seasonId,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: createdBy,
            site_language: siteLanguage,
          };
          const getChannel = await model.titleChannelList.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              tv_network_id: channelData.tv_network_id,
              season_id: seasonId,
            },
          });
          if (!getChannel) {
            await model.titleChannelList.create(watchOnData);
            actionDate = watchOnData.created_at;
            recordId = titleId;
          }
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
