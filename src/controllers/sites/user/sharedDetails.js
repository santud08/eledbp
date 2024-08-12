import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * sharedDetails
 * @param req
 * @param res
 */
export const sharedDetails = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const type = req.body.type;
    const sharedId = req.body.shared_id;
    const sharedIn = req.body.shared_channel;
    const language = req.accept_language ? req.accept_language : "en";

    // check for user existance in shared table
    let findModel = model.title;
    let condition = { id: sharedId };
    if (type == "people") {
      findModel = model.people;
      condition.status = "active";
    } else if (type == "award") {
      findModel = model.awards;
      condition.status = "active";
    } else {
      findModel = model.title;
      condition.record_status = "active";
    }
    const isExistsSharedId = await findModel.findOne({
      where: condition,
    });
    if (!isExistsSharedId) throw StatusError.badRequest(res.__("invalid shared id"));

    const createData = {
      shared_id: sharedId,
      site_language: language,
      user_id: userId,
      shared_type: type,
      shared_in: sharedIn,
      status: "active",
      created_by: userId,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    await model.shared.create(createData);

    res.ok({
      message: res.__("success"),
    });
  } catch (error) {
    next(error);
  }
};
