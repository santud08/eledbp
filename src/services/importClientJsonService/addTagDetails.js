import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { TAG_SCORE } from "../../utils/constants.js";
import { titleService } from "../../services/index.js";

/**
 * addTagDetails
 * @param details
 */
export const addTagDetails = async (titleId, dataArr, userId, language = "ko") => {
  try {
    if (dataArr.length > 0) {
      let actionDate = "";
      let recordId = "";
      for (const value of dataArr) {
        if (value) {
          const tagDetails = await model.tag.findOne({
            where: {
              id: value.idx,
              status: "active",
            },
          });
          if (tagDetails) {
            const tagId = tagDetails.id;
            const tagData = {
              tag_id: tagId,
              taggable_id: titleId,
              taggable_type: "title",
              site_language: language,
              user_id: userId,
              score: value.score ? value.score : TAG_SCORE,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            const checkTag = await model.tagGable.findOne({
              attributes: ["id", "score"],
              where: { tag_id: tagId, taggable_id: titleId, status: "active" },
            });
            if (!checkTag) {
              await model.tagGable.create(tagData);
              recordId = titleId;
              actionDate = tagData.created_at;
            } else {
              const dbScore = checkTag.score ? checkTag.score : "";
              const dbId = checkTag.id ? checkTag.id : 0;
              if (dbScore && dbScore != value.score && dbId > 0) {
                await model.tagGable.update({ score: value.score }, { where: { id: dbId } });
                recordId = titleId;
                actionDate = tagData.created_at;
              }
            }
          }
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", userId, actionDate);
    }
  } catch (error) {
    return { results: {} };
  }
};
