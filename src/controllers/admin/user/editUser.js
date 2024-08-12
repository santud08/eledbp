import model from "../../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import { MAIL_TEMPLATE } from "../../../utils/constants.js";
import { emailService } from "../../../services/index.js";

/**
 * editUser
 * @param req
 * @param res
 */
export const editUser = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const roleId = reqBody.role_id ? reqBody.role_id : "";
    const userId = reqBody.id ? reqBody.id : "";
    const fullName = reqBody.name ? reqBody.name : "";
    const password = reqBody.password ? reqBody.password : "";
    const firstName = fullName.substring(0, fullName.indexOf(" "))
      ? fullName.substring(0, fullName.indexOf(" "))
      : fullName.substring(fullName.indexOf(" ") + 1);
    const lastName = !fullName.substring(0, fullName.indexOf(" "))
      ? ""
      : fullName.substring(fullName.indexOf(" ") + 1);

    if (!userId) throw StatusError.badRequest(res.__("Invalid id"));

    // check for user id existance in table
    const isExistsUser = await model.user.findOne({
      attributes: ["id", "email", "created_by"],
      where: {
        id: userId,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (!isExistsUser) throw StatusError.badRequest(res.__("Invalid id"));

    const isExistsRole = await model.role.findOne({
      attributes: ["id", "role_name"],
      where: {
        id: roleId,
        status: "active",
      },
    });

    if (!isExistsRole) throw StatusError.badRequest(res.__("invalid role"));

    if (userId === loginUserId) {
      throw StatusError.badRequest(res.__("you can not edit the current loggedin user details"));
    }

    // add details
    let userDetails = {
      first_name: firstName,
      last_name: lastName,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: loginUserId,
    };
    if (password) {
      userDetails.password = await bcrypt.hash(password, envs.passwordSalt);
    }
    const [userInformation] = await model.user.update(userDetails, {
      where: { id: userId },
    });

    if (userInformation > 0) {
      const checkUserRole = await model.userRole.findOne({
        where: { user_id: userId, status: "active" },
      });
      let isRoleChange = false;
      let isFirstModification = false;
      if (checkUserRole && checkUserRole.id > 0) {
        const roleUpdate = {
          role_id: roleId,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: loginUserId,
        };

        await model.userRole.update(roleUpdate, {
          where: { id: checkUserRole.id, user_id: userId },
        });
        if (roleId != checkUserRole.role_id) {
          isRoleChange = true;
          if (checkUserRole.updated_at) {
            isFirstModification = false;
          } else {
            isFirstModification = true;
          }
        }
      } else {
        const roleCreate = {
          user_id: userId,
          role_id: roleId,
          status: "active",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: loginUserId,
        };
        await model.userRole.create(roleCreate);
        isRoleChange = true;
        isFirstModification = true;
      }

      //mail send for user create
      if (isExistsUser.email && isRoleChange) {
        const roleName = isExistsRole.role_name
          ? await generalHelper.getRoleNameByKey(isExistsRole.role_name)
          : "";
        const emailTemplate =
          userId == isExistsUser.created_by && isFirstModification
            ? "allotment_confirmation"
            : "user_role_change_notification";
        await emailService.sendEmail(isExistsUser.email, emailTemplate, "", "", {
          pageTitle: "",
          firstName: firstName,
          email: isExistsUser.email,
          name: fullName,
          userRole: roleName,
          password: password,
          supportMail: MAIL_TEMPLATE.SUPPORT_MAIL,
          thanksFrom: MAIL_TEMPLATE.TAHNKS_FROM,
          address: MAIL_TEMPLATE.ADDRESS,
          telNo: MAIL_TEMPLATE.TEL,
          faxNo: MAIL_TEMPLATE.FAX,
        });
      }

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
