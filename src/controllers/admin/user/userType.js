import model from "../../../models/index.js";

/**
 * userType
 * @param req
 * @param res
 */
export const userType = async (req, res, next) => {
  try {
    let roles = await model.role.findAll({
      attributes: ["id", "role_name"],
      where: { status: "active", guests: 0 },
    });
    if (roles && roles.length > 0) {
      roles = roles.map((role) => {
        role.dataValues.display_name = res.__(role.role_name);
        return role;
      });
    }
    res.ok({
      results: roles,
    });
  } catch (error) {
    next(error);
  }
};
