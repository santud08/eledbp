import model from "../../../models/index.js";
import { SIDEBAR_MENU } from "../../../utils/constants.js";
import { userRoleService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * userMenu
 * @param req
 * @param res
 * @param next
 */
export const userMenu = async (req, res, next) => {
  try {
    let menuList = [];
    const userId = req.userDetails.userId; //It will login user id
    const getRole = await userRoleService.getUserRole(userId);
    if (getRole) {
      if (getRole.role_name == "guests" || getRole.role_name == "users")
        throw StatusError.unauthorized("");
      const getPermission = await model.userRolePermission.findAll({
        attributes: ["permission.group_name", "permission.sub_group_name"],
        raw: true,
        include: [
          { model: model.permission, attributes: [], where: { status: "active" }, required: true },
        ],
        where: { user_role_id: getRole.role_id, status: "active" },
        order: [["id"]],
        group: ["permission.sub_group_name"],
      });
      if (SIDEBAR_MENU.length > 0) {
        for (const eachMenu of SIDEBAR_MENU) {
          if (eachMenu) {
            if (getPermission.some((obj) => obj.group_name == eachMenu.u_key)) {
              let subCategory = [];
              if (eachMenu.subCategory && eachMenu.subCategory.length > 0) {
                for (const eachSubMenu of eachMenu.subCategory) {
                  if (eachSubMenu) {
                    if (
                      getPermission.some(
                        (obj) =>
                          obj.group_name == eachMenu.u_key &&
                          obj.sub_group_name == eachSubMenu.u_key,
                      )
                    ) {
                      let subMenu = {
                        label: eachSubMenu.label,
                        key: eachSubMenu.key,
                        icon: eachSubMenu.icon,
                        redirectionLink: eachSubMenu.redirectionLink,
                      };
                      subCategory.push(subMenu);
                    }
                  }
                }
              }
              let menu = { label: eachMenu.label, icon: eachMenu.icon };
              menu.subCategory = subCategory;
              menuList.push(menu);
            }
          }
        }
      }
    }
    res.ok({
      results: menuList ? menuList : [],
    });
  } catch (error) {
    next(error);
  }
};
