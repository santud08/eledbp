import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { logService, schedulerJobService } from "../../../services/index.js";
import { Sequelize } from "sequelize";

/**
 * updateView
 * @param req
 * @param res
 */
export const updateView = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const id = reqBody.video_id ? reqBody.video_id : "";
    const type = "video";
    const userSessionId = reqBody.user_session_id ? reqBody.user_session_id : "";
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    const userName = req.userDetails && req.userDetails.name ? req.userDetails.name : "";
    const email = req.userDetails && req.userDetails.email ? req.userDetails.email : "";
    let itemName = "";
    const language = req.accept_language;

    const agentInformation =
      req.headers && req.headers["User-Agent"] ? { "user-agent": req.headers["User-Agent"] } : {};
    const clientIp = req.headers && req.headers["client-ip"] ? req.headers["client-ip"] : null;

    const getData = await model.video.findOne({
      attributes: ["id", "name"],
      where: { id: id, status: "active" },
    });
    if (!getData) throw StatusError.badRequest(res.__("Invalid id"));

    const updateData = {
      ele_no_of_view: Sequelize.literal("ele_no_of_view + 1"),
      updated_by: userId,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
    };

    itemName = getData && getData.name ? getData.name : "";
    const logDetails = {
      event_type: "view",
      user_id: userId ? userId : null,
      user_session_id: userSessionId ? userSessionId : null,
      item_id: id,
      type: type,
    };
    logDetails.log_details = {
      ip: clientIp,
      user_id: userId ? userId : "",
      user_name: userName,
      user_email: email,
      user_session_id: userSessionId,
      season_id: null,
      item_id: id,
      item_name: itemName,
      item_description: "",
      type: type,
      site_language: language,
      agent_information: agentInformation,
    };
    await Promise.all([
      await model.video.update(updateData, {
        where: { id: id },
      }),
      logService.insertLogDetails(logDetails),
    ]);
    const payload = { list: [{ record_id: id, type: "video", action: "edit" }] };
    schedulerJobService.addJobInScheduler(
      `edit video data to search db`,
      JSON.stringify(payload),
      "search_db",
      `update search db for video Details from updateView`,
      userId,
    );
    res.ok({
      message: res.__("success"),
    });
  } catch (error) {
    next(error);
  }
};
