import { logService } from "../../../services/index.js";
import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import publicIp from "public-ip";

/**
 * logUserActivity
 * @param req
 * @param res
 */
export const logUserActivity = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const id = reqBody.id ? reqBody.id : "";
    const type = reqBody.type ? reqBody.type : "";
    const userSessionId = reqBody.user_session_id ? reqBody.user_session_id : "";
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : "";
    const userName = req.userDetails && req.userDetails.name ? req.userDetails.name : "";
    const email = req.userDetails && req.userDetails.email ? req.userDetails.email : "";
    let itemName = "";
    let itemDescription = "";
    let seasonId = "";
    let titleType = "";
    const language = req.accept_language;

    if (id && type == "people") {
      // Check people is exist
      const getData = await model.people.findOne({
        attributes: ["id"],
        where: { id: id, status: "active" },
        include: {
          model: model.peopleTranslation,
          attributes: ["name", "description"],
          left: true,
          where: { status: "active" },
        },
      });
      if (!getData) throw StatusError.badRequest(res.__("Invalid id"));
      itemName =
        getData &&
        getData.peopleTranslations &&
        getData.peopleTranslations.length > 0 &&
        getData.peopleTranslations[0].name
          ? getData.peopleTranslations[0].name
          : "";
      itemDescription =
        getData &&
        getData.peopleTranslations &&
        getData.peopleTranslations.length > 0 &&
        getData.peopleTranslations[0].description
          ? getData.peopleTranslations[0].description
          : "";
    } else if (id && type == "title") {
      // Check movie/tv/webtoons is exist
      const getData = await model.title.findOne({
        attributes: ["id", "type"],
        where: { id: id, record_status: "active" },
        include: [
          {
            model: model.titleTranslation,
            required: false,
            attributes: ["name", "description"],
            where: { status: "active" },
          },
          {
            model: model.creditable,
            attributes: ["season_id"],
            required: false,
            where: {
              creditable_id: id,
              creditable_type: "title",
              status: "active",
            },
          },
        ],
      });
      if (!getData) throw StatusError.badRequest(res.__("Invalid id"));
      itemName =
        getData &&
        getData.titleTranslations &&
        getData.titleTranslations.length > 0 &&
        getData.titleTranslations[0].name
          ? getData.titleTranslations[0].name
          : "";
      itemDescription =
        getData &&
        getData.titleTranslations &&
        getData.titleTranslations.length > 0 &&
        getData.titleTranslations[0].description
          ? getData.titleTranslations[0].description
          : "";
      seasonId =
        getData &&
        getData.dataValues.type == "tv" &&
        getData.creditables &&
        getData.creditables.length > 0
          ? getData.creditables[0].season_id
          : "";
      titleType = getData.dataValues.type ? getData.dataValues.type : "";
    } else if (id && type == "video") {
      // Check video is exist
      const getData = await model.video.findOne({
        attributes: ["id", "name"],
        where: { id: id, status: "active" },
      });
      itemName = getData && getData.name ? getData.name : "";
    } else if (id && type == "tag") {
      // Check tag is exist
      const getData = await model.tag.findOne({
        attributes: ["id"],
        where: { id: id, status: "active" },
        include: {
          model: model.tagTranslation,
          attributes: ["display_name"],
          left: true,
          where: { status: "active" },
        },
      });
      if (!getData) throw StatusError.badRequest(res.__("Invalid id"));
      itemName =
        getData &&
        getData.tagTranslations &&
        getData.tagTranslations.length > 0 &&
        getData.tagTranslations[0].display_name
          ? getData.tagTranslations[0].display_name
          : "";
    }
    const logDetails = {
      event_type: "view",
      user_id: userId ? userId : null,
      user_session_id: userSessionId ? userSessionId : null,
      item_id: id,
      type: type,
    };
    logDetails.log_details = {
      ip: await publicIp.v4(),
      user_id: userId ? userId : "",
      user_name: userName,
      user_email: email,
      user_session_id: userSessionId,
      season_id: seasonId,
      item_id: id,
      item_name: itemName,
      item_description: itemDescription,
      type: titleType ? titleType : type,
      site_language: language,
      agent_information: {},
    };
    await logService.insertLogDetails(logDetails);

    res.ok({
      message: res.__("Log added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
