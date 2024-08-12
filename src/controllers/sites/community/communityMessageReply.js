import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/* *
 * communityMessageReply
 * @param req
 * @param res
 * @param next
 */
export const communityMessageReply = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const communityId = reqBody.community_id;
    const commentableId = reqBody.commentable_id; //It will be title id
    const commentableType = reqBody.commentable_type;
    const tabType = reqBody.tab_type ? reqBody.tab_type : "comment";
    const replyText = reqBody.reply_text;
    const spoiler = reqBody.spoiler ? reqBody.spoiler : "n";
    const siteLanguage = req.accept_language;

    // check for communityId existance in community table
    const isExistsCommunityId = await model.community.findOne({
      where: { id: communityId, status: "active" },
    });
    if (!isExistsCommunityId) throw StatusError.badRequest(res.__("Invalid community id"));

    let getInformations = {};
    // Check people is exist
    if (commentableType == "people") {
      getInformations = await model.people.findOne({
        attributes: ["id", "gender", "birth_date"],
        where: { id: commentableId, status: "active" },
      });
    }

    // Check title(movie/tv) is exist
    if (commentableType == "title") {
      getInformations = await model.title.findOne({
        attributes: ["id", "type", "record_status"],
        where: { id: commentableId, record_status: "active" },
      });
    }
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid commentable id"));

    let isWebtoons = false;
    if (getInformations.type == "webtoons") {
      isWebtoons = true;
    }

    let dataObj = {
      content: replyText,
      is_spoiler: spoiler,
      parent_id: communityId,
      community_type: tabType,
      user_id: userId,
      commentable_id: commentableId,
      commentable_type: commentableType,
      season_id: isExistsCommunityId.season_id ? isExistsCommunityId.season_id : null,
      site_language: siteLanguage,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    if (isWebtoons) {
      dataObj.character_id = isExistsCommunityId.character_id
        ? isExistsCommunityId.character_id
        : null;
    } else {
      dataObj.famouse_id = isExistsCommunityId.famouse_id ? isExistsCommunityId.famouse_id : null;
    }

    if (tabType != "famous_line") {
      if (typeof req.file != "undefined") {
        dataObj.file_original_name = req.file.originalname;
        dataObj.file_type = req.file.mimetype;
        dataObj.file_name = req.file.location;
      }
    }
    await model.community.create(dataObj);

    res.ok({
      message: res.__("Replied successfully"),
    });
  } catch (error) {
    next(error);
  }
};
