import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

export const addTvWatch = async (data, titleId, type, seasonId, createdBy, siteLanguage = "en") => {
  try {
    if (data && data != null && data.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const watchData of data) {
        if (watchData && watchData.provider_id && watchData.provider_id != null) {
          const watchOnData = {
            title_id: titleId,
            movie_id: watchData.movie_id ? watchData.movie_id : null,
            type: type ? type : null,
            provider_id: watchData.provider_id ? watchData.provider_id : null,
            season_id: seasonId,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: createdBy,
          };
          const getWatch = await model.titleWatchOn.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              provider_id: watchData.provider_id,
              season_id: seasonId,
              type: type,
            },
          });
          if (!getWatch) {
            await model.titleWatchOn.create(watchOnData);
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
