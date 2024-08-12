import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";

export const addJobInScheduler = async (
  quee,
  payload,
  type,
  description,
  createdBy,
  createdAt = null,
) => {
  try {
    if (
      payload &&
      payload != null &&
      payload != "undefined" &&
      quee &&
      quee != null &&
      quee != "undefined" &&
      type &&
      type != null &&
      type != "undefined"
    ) {
      const insertData = {
        queue: quee,
        payload: payload,
        type: type,
        description: description ? description : null,
        created_by: createdBy ? createdBy : null,
        status: "pending",
        created_at: !createdAt ? await customDateTimeHelper.getCurrentDateTime() : createdAt,
      };
      const res = await model.schedulerJobs.create(insertData);
      return res;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};
