import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Sequelize, fn, col } from "sequelize";

/**
 * userSettings
 * @param req
 * @param res
 */
export const userSettings = async (req, res, next) => {
  try {
    const myPageUserId = req.userDetails.userId ? req.userDetails.userId : null;
    if (!myPageUserId) throw StatusError.badRequest(res.__("Invalid user id"));

    // check for user existance in user table
    const isMyPageUserExist = await model.user.findOne({
      attributes: [
        "id",
        [Sequelize.literal(`CONCAT(first_name, ' ', last_name)`), "username"],
        "email",
        [fn("REPLACE", col("avatar"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "avatar"],
        "language",
      ],
      where: { id: myPageUserId, status: "active" },
    });
    if (!isMyPageUserExist) throw StatusError.badRequest(res.__("user is not registered"));

    const resultObj = {
      user_id: isMyPageUserExist.id ? isMyPageUserExist.id : "",
      user_name: isMyPageUserExist.username ? isMyPageUserExist.username : "",
      user_email: isMyPageUserExist.email ? isMyPageUserExist.email : "",
      user_profile_image: isMyPageUserExist.avatar ? isMyPageUserExist.avatar : "",
      user_default_language: isMyPageUserExist.language ? isMyPageUserExist.language : "en",
    };

    res.ok({ result: resultObj });
  } catch (error) {
    next(error);
  }
};
