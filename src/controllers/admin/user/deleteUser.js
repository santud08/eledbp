import model from "../../../models/index.js";
import { Op } from "sequelize";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * deleteUser
 * @param req
 * @param res
 */
export const deleteUser = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const userId = reqBody.id ? reqBody.id : "";
    if (!userId) throw StatusError.badRequest(res.__("Invalid id"));

    const checkUserId = await model.user.count({
      where: { status: { [Op.ne]: "deleted" }, id: userId },
    });
    if (checkUserId == 0) throw StatusError.badRequest(res.__("Invalid id"));
    const loginUserId = req.userDetails.userId;
    if (userId === loginUserId) {
      throw StatusError.badRequest(res.__("you can not delete the current loggedin user"));
    }
    const userDetails = {
      status: "deleted",
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: loginUserId,
    };
    const [userInformation] = await model.user.update(userDetails, {
      where: { id: userId },
    });
    if (userInformation > 0) {
      await model.userRole.update(userDetails, {
        where: { user_id: userId, status: { [Op.ne]: "deleted" } },
      });
      res.ok({
        message: res.__("success"),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
