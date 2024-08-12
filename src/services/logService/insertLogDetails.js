import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { schedulerJobService } from "../../services/index.js";

export const insertLogDetails = async (paramsData) => {
  const logData = {
    user_id: paramsData.user_id ? paramsData.user_id : null,
    user_session_id: paramsData.user_session_id ? paramsData.user_session_id : null,
    item_id: paramsData.item_id ? paramsData.item_id : "",
    type: paramsData.type ? paramsData.type : "",
    event_type: paramsData.event_type ? paramsData.event_type : "view",
    details: paramsData.log_details,
    created_by: paramsData.user_id ? paramsData.user_id : null,
    created_at: await customDateTimeHelper.getCurrentDateTime(),
  };
  const retRes = await model.usersActivity.create(logData);
  if (paramsData.item_id && paramsData.type) {
    if (["title", "people"].includes(paramsData.type)) {
      let titleType = paramsData.type;
      if (paramsData.type == "title" && paramsData.log_details && paramsData.log_details.type) {
        titleType = paramsData.log_details.type;
      }
      if (titleType) {
        const payload = {
          list: [{ record_id: paramsData.item_id, type: titleType, action: "edit" }],
        };
        schedulerJobService.addJobInScheduler(
          `edit ${paramsData.type} data to search db`,
          JSON.stringify(payload),
          "search_db",
          `update search db for ${titleType} Details from logDetails`,
          paramsData.user_id,
        );
      }
    }
  }
  return retRes;
};
