import model from "../../../models/index.js";
import { Op } from "sequelize";

/**
 * checkTitleEditor
 * @param req
 * @param res
 */
export const checkTitleEditor = async (req, res, next) => {
  try {
    //const userId = req.userDetails.userId;
    const reqBody = req.body;
    const editId = reqBody.edit_id ? reqBody.edit_id : "";

    // check editor assign for particular title
    let allocateEditorArr = [];
    if (editId.length > 0) {
      for (const id of editId) {
        const isExistEditor = await model.edit.findOne({
          attributes: [],
          include: [
            {
              model: model.editor,
              attributes: ["user_id", "editable_id"],
              left: true,
              where: {
                current_status: "allocate",
                status: { [Op.ne]: "deleted" },
              },
              required: true,
            },
          ],
          where: { id: id, status: { [Op.ne]: "deleted" } },
        });

        if (isExistEditor) {
          const getUserId = isExistEditor.dataValues.editor.user_id;
          let getDetails = await model.user.findOne({
            attributes: [["id", "user_id"], "first_name", "last_name"],
            where: { id: getUserId, status: "active" },
          });
          const getUserName = getDetails && getDetails.first_name ? getDetails.first_name : "";
          if (getUserName && !allocateEditorArr.includes(getUserName)) {
            allocateEditorArr.push(getUserName);
          }
        }
      }
    }

    res.ok({
      editor: allocateEditorArr,
    });
  } catch (error) {
    next(error);
  }
};
