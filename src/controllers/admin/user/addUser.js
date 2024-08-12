import model from "../../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { MAIL_TEMPLATE } from "../../../utils/constants.js";
import { emailService } from "../../../services/index.js";

/**
 * addUser
 * @param req
 * @param res
 */
export const addUser = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const roleId = reqBody.role_id ? reqBody.role_id : "";
    const email = reqBody.email ? reqBody.email : "";
    const fullName = reqBody.name ? reqBody.name : "";
    const password = reqBody.password ? reqBody.password : "";
    const firstName = fullName.substring(0, fullName.indexOf(" "))
      ? fullName.substring(0, fullName.indexOf(" "))
      : fullName.substring(fullName.indexOf(" ") + 1);
    const lastName = !fullName.substring(0, fullName.indexOf(" "))
      ? ""
      : fullName.substring(fullName.indexOf(" ") + 1);

    let fileLocation = "";

    if (req.file) {
      const fileDetails = req.file;
      fileLocation = fileDetails.location ? fileDetails.location : "";
    }

    // check for user email existance in table
    const isExistsUser = await model.user.findOne({
      attributes: ["id"],
      where: {
        email: email,
        status: { [Op.ne]: "deleted" },
      },
    });

    if (isExistsUser) throw StatusError.badRequest(res.__("emailAlreadyExists"));

    const isExistsRole = await model.role.findOne({
      attributes: ["id", "role_name"],
      where: {
        id: roleId,
        status: "active",
      },
    });

    if (!isExistsRole) throw StatusError.badRequest(res.__("invalid role"));

    // add details
    const userDetails = {
      uuid: uuidv4(),
      username: email,
      email: email,
      first_name: firstName,
      last_name: lastName,
      avatar: fileLocation,
      password: await bcrypt.hash(password, envs.passwordSalt),
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: loginUserId,
    };
    const userInformation = await model.user.create(userDetails);
    if (userInformation && userInformation.id > 0) {
      const roleCreate = {
        user_id: userInformation.id,
        role_id: roleId,
        status: "active",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: loginUserId,
      };
      await model.userRole.create(roleCreate);
      //mail send for user create
      const roleName = isExistsRole.role_name
        ? await generalHelper.getRoleNameByKey(isExistsRole.role_name)
        : "";
      await emailService.sendEmail(email, "allotment_confirmation", "", "", {
        pageTitle: "",
        firstName: firstName,
        email: email,
        name: fullName,
        userRole: roleName,
        password: password,
        supportMail: MAIL_TEMPLATE.SUPPORT_MAIL,
        thanksFrom: MAIL_TEMPLATE.TAHNKS_FROM,
        address: MAIL_TEMPLATE.ADDRESS,
        telNo: MAIL_TEMPLATE.TEL,
        faxNo: MAIL_TEMPLATE.FAX,
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
