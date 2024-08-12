import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

/**
 * addKeywords
 * @param details
 */
export const addKeywords = async (titleId, dataArr, userId, keywordType) => {
  try {
    if (dataArr.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const value of dataArr) {
        if (value) {
          const keywordData = {
            title_id: titleId,
            season_id: null,
            site_language: "en",
            keyword: value,
            keyword_type: keywordType,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: userId,
          };
          await model.titleKeyword.create(keywordData);
          actionDate = keywordData.created_at;
          recordId = titleId;
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", userId, actionDate);
    }
  } catch (error) {
    return { results: {} };
  }
};
