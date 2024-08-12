import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Sequelize, fn, col } from "sequelize";

/**
 * userInformation
 * @param req
 * @param res
 */
export const userInformation = async (req, res, next) => {
  try {
    const myPageUserId = req.userDetails.userId ? req.userDetails.userId : null;
    if (!myPageUserId) throw StatusError.badRequest(res.__("Invalid user id"));

    // // check for user existance in user table
    const userDetails = await model.user.findOne({
      attributes: [
        "id",
        [Sequelize.literal(`CONCAT(first_name, ' ', last_name)`), "username"],
        [fn("REPLACE", col("avatar"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "avatar"],
      ],
      where: { id: myPageUserId, status: "active" },
    });
    if (!userDetails) throw StatusError.badRequest(res.__("user is not registered"));

    const resultObj = {
      user_id: userDetails.id ? userDetails.id : "",
      user_name: userDetails.username ? userDetails.username : "",
      profile_pic: userDetails.avatar ? userDetails.avatar : "",
      user_level: "",
      user_points: 0,
    };

    res.ok({ result: resultObj });
  } catch (error) {
    next(error);
  }
};
