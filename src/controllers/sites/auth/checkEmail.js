import { userService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * checkEmail
 * @param req
 * @param res
 * @param next
 */
export const checkEmail = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const email = reqBody.email;
    const userDetails = await userService.getByEmail(email);
    if (userDetails) throw StatusError.badRequest(res.__("This email is already registered"));
    res.ok({
      message: res.__("Available email"),
      email: email,
    });
  } catch (error) {
    next(error);
  }
};
