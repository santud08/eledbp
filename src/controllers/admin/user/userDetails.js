import model from "../../../models/index.js";
import { Sequelize, Op, col } from "sequelize";
import { StatusError } from "../../../config/index.js";

/**
 * userDetails
 * @param req
 * @param res
 */
export const userDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const userId = reqBody.id ? reqBody.id : "";
    if (!userId) throw StatusError.badRequest(res.__("Invalid id"));

    const checkUserId = await model.user.count({
      where: { status: { [Op.ne]: "deleted" }, id: userId },
    });
    if (checkUserId == 0) throw StatusError.badRequest(res.__("Invalid id"));

    let resultData = {};
    const condition = { status: { [Op.ne]: "deleted" }, id: userId };
    const attributes = [
      "id",
      [Sequelize.literal(`CONCAT(first_name, ' ', last_name)`), "name"],
      [Sequelize.literal(`"******"`), "password"],
      "email",
      [col("userRole.role.role_name"), "role"],
      [col("userRole.role.id"), "role_id"],
      [col("userRole.role.role_name"), "role_name"],
      ["avatar", "user_image"],
      "created_at",
    ];

    const includeQuery = [
      {
        model: model.userRole,
        attributes: [],
        where: { status: "active" },
        required: true,
        include: [
          { model: model.role, attributes: [], where: { status: "active" }, required: true },
        ],
      },
    ];

    resultData = await model.user.findOne({
      attributes: attributes,
      include: includeQuery,
      where: condition,
    });

    if (resultData && resultData.dataValues) {
      resultData.dataValues.role = res.__(resultData.dataValues.role);
    }

    res.ok(resultData ? resultData : {});
  } catch (error) {
    next(error);
  }
};
