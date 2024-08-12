import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

export const editTitleSearchKeyword = async (data, titleId, createdBy, siteLanguage = "en") => {
  try {
    if (data && data != null && data.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const tmdbKeyword of data) {
        const keyword = tmdbKeyword && tmdbKeyword.name ? tmdbKeyword.name : "";
        const getKeyword = await model.titleKeyword.findOne({
          attributes: ["id", "keyword"],
          where: {
            title_id: titleId,
            keyword: keyword,
            keyword_type: "search",
            site_language: siteLanguage,
          },
        });
        if (!getKeyword) {
          //Insert keyword into edb_title_keywords table for language wise
          const createEnData = {
            keyword: keyword,
            keyword_type: "search",
            title_id: titleId,
            site_language: siteLanguage,
            created_by: createdBy,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          await model.titleKeyword.create(createEnData);
          actionDate = createEnData.created_at;
          recordId = titleId;
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
