import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/* *
 * communityMessageSend
 * @param req
 * @param res
 * @param next
 */
export const communityMessageSend = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    let getInformations = [];
    let getFamousId = [];
    const reqBody = req.body;
    const commentableId = reqBody.commentable_id; //It will be title/people id
    const commentableType = reqBody.commentable_type; //It will be title/people
    const tabType = reqBody.tab_type ? reqBody.tab_type : "comment";
    const messageText = reqBody.message_text;
    const spoiler = reqBody.spoiler ? reqBody.spoiler : "n";
    const siteLanguage = req.accept_language;
    const famouseId = tabType == "famous_line" ? req.body.famouse_id : null;

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

    if (getInformations.type == "tv") {
      if (!reqBody.season_id && reqBody.season_id == "") {
        throw StatusError.badRequest(res.__("Please enter season id"));
      }
      const getSeason = await model.season.findOne({
        where: { id: reqBody.season_id, title_id: commentableId, status: "active" },
      });
      if (!getSeason) {
        throw StatusError.badRequest(res.__("Invalid Season ID"));
      }
    }

    let isWebtoons = false;
    if (getInformations.type == "webtoons") {
      isWebtoons = true;
    }

    // Check famous id is exist
    if (tabType == "famous_line") {
      if (commentableType == "title") {
        if (isWebtoons) {
          getFamousId = await model.creditable.findOne({
            attributes: ["id"],
            where: { id: famouseId, status: "active", department: "character" },
          });
        } else {
          getFamousId = await model.people.findOne({
            attributes: ["id", "gender", "birth_date"],
            where: { id: famouseId, status: "active" },
          });
        }
      }
      if (commentableType == "people") {
        getFamousId = await model.title.findOne({
          attributes: ["id", "type", "record_status"],
          where: { id: famouseId, record_status: "active" },
        });
      }
      if (!getFamousId) throw StatusError.badRequest(res.__("Invalid famous id"));
    }

    let dataObj = {
      content: messageText,
      is_spoiler: spoiler,
      community_type: tabType,
      user_id: userId,
      commentable_id: commentableId,
      commentable_type: commentableType,
      season_id: reqBody.season_id ? reqBody.season_id : null,
      site_language: siteLanguage,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    if (isWebtoons) {
      dataObj.character_id = famouseId;
    } else {
      dataObj.famouse_id = famouseId;
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
      message: res.__("Message saved successfully"),
    });
  } catch (error) {
    next(error);
  }
};
