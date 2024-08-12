import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import model from "../../../models/index.js";
const { contactUs } = model;

/**
 * User can contactUs with details
 * @param req
 * @param res
 * @param next
 */
export const contact = async (req, res, next) => {
  try {
    const reqBody = req.body;
    // prepare data for insertion
    let data = {
      name: reqBody.name,
      email: reqBody.email,
      type: reqBody.type,
      message: reqBody.message,
      site_language: req.accept_language,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    if (req.userDetails && req.userDetails.userId) {
      data.created_by = req.userDetails.userId;
      data.user_id = req.userDetails.userId;
    }
    // contact details insertion
    const result = await contactUs.create(data);
    if (result.id) {
      res.ok({
        message: res.__("Data successfully submitted"),
      });
    } else {
      throw StatusError.badRequest(res.__("serverError"));
    }
  } catch (error) {
    next(error);
  }
};
