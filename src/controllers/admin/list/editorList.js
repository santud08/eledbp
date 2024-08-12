import model from "../../../models/index.js";
import { Op } from "sequelize";
import { userRoleService } from "../../../services/index.js";

/**
 * editorList
 * @param req
 * @param res
 */
export const editorList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const searchText = reqBody.search_text ? reqBody.search_text : "";

    let getEditorList = [];
    const roleId = await userRoleService.getRoleIdByRoleName("editor", "active");
    if (roleId) {
      let condition = {
        status: "active",
      };
      if (searchText) {
        condition.first_name = { [Op.like]: `%${searchText}%` };
      }
      getEditorList = await model.user.findAll({
        attributes: ["id", ["first_name", "name"]],
        where: condition,
        include: [
          {
            model: model.userRole,
            attributes: [],
            left: true,
            where: { role_id: roleId, status: "active" },
            required: true,
          },
        ],
        limit: 50,
      });
    }

    res.ok({
      results: getEditorList,
    });
  } catch (error) {
    next(error);
  }
};
