import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * userWithdrawal
 * @param req
 * @param res
 */
export const userWithdrawal = async (req, res, next) => {
  try {
    const userLogId = req.userDetails.userId;
    if (!userLogId) throw StatusError.badRequest(res.__("Invalid user id"));

    const reqBody = req.body;
    const userId = reqBody.user_id; // to delete the user record
    const reason = reqBody.reason ? reqBody.reason : ""; // to update reasons

    // checking for user details
    const userDetails = await model.user.findOne({
      where: {
        id: userId,
        status: "active",
      },
    });
    if (!userDetails) throw StatusError.badRequest(res.__("Invalid user id"));
    const currentDateTime = await customDateTimeHelper.getCurrentDateTime();
    if (userDetails) {
      await model.user
        .update(
          {
            status: "withdrawal",
            updated_at: currentDateTime,
            updated_by: userId,
            withdrawal_reason: reason,
          },
          {
            where: {
              id: userId,
              status: "active",
            },
          },
        )
        .then(() => {
          res.ok({ message: res.__("account deleted successfully") });
        })
        .catch(() => {
          throw StatusError.serverError(res.__("something went wrong"));
        });
    }
  } catch (error) {
    next(error);
  }
};
