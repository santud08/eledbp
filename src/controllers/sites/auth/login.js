import bcrypt from "bcrypt";
import { userService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";
import models from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * User login
 * @param req
 * @param res
 * @param next
 */
export const login = async (req, res, next) => {
  try {
    const reqBody = req.body;
    // get user details by email
    const email = reqBody.email;

    const userDetails = await userService.getByEmail(email);
    if (!userDetails) throw StatusError.badRequest({ email: res.__("email does not exists") });

    // comparing the password:
    const isSame = await bcrypt.compare(reqBody.password, userDetails.password);
    if (!isSame) throw StatusError.badRequest({ password: res.__("Password does not match") });

    // generating the tokens
    const result = await userService.generateTokens(userDetails.email);

    // Fetching the role ID and role_name from edb_user_roles and edb_roles
    const getUserRole = await models.userRole.findOne({
      include: [
        {
          model: models.role,
          where: { status: "active" },
        },
      ],
      where: { user_id: userDetails.id, status: "active" },
    });

    // Fetching the user_theme from "edb_css_themes"
    const userTheme = await models.cssTheme.findOne({
      where: { user_id: userDetails.id, status: "active" },
    });

    //update last login
    const updateDate = await customDateTimeHelper.getCurrentDateTime();
    const updateUserData = {
      last_login: updateDate,
      updated_at: updateDate,
      updated_by: userDetails.id,
    };
    await models.user.update(updateUserData, {
      where: { id: userDetails.id },
    });

    res.ok({
      user_id: userDetails.id,
      username: userDetails.username,
      email: userDetails.email,
      user_role_id: getUserRole ? getUserRole.role_id : "",
      user_type: getUserRole && getUserRole.role ? getUserRole.role.role_name : "",
      is_admin:
        getUserRole &&
        getUserRole.role &&
        (getUserRole.role.role_name == "admin" ||
          getUserRole.role.role_name == "super_admin" ||
          getUserRole.role.role_name == "editor")
          ? "y"
          : "n",
      theme: userTheme ? userTheme.name : "dark",
      profile_image: userDetails.avatar,
      token: result.access_token,
      token_expiry: result.access_token_expiry,
      user_default_language: userDetails.language ? userDetails.language : "en",
    });
  } catch (error) {
    next(error);
  }
};
