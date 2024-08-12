import model from "../../models/index.js";

/*
 * checkUserRecordPermission
 * check the user permission by user role for editor has permission to edit or not
 * return boolean
 */
export const checkUserRecordPermission = async (recordId, type, userId) => {
  let returnStr = false;
  if (recordId > 0 && ["movie", "tv", "webtoons", "people"].includes(type) && userId > 0) {
    const getEditor = await model.edit.findOne({
      attributes: ["id"],
      raw: true,
      include: [
        {
          model: model.editor,
          attributes: ["id"],
          where: {
            user_id: userId,
            editable_id: recordId,
            editable_type: type,
            current_status: "allocate",
            status: "active",
          },
          required: true,
        },
      ],
      where: { type: type, editable_id: recordId, status: "active" },
    });

    if (getEditor && getEditor != null && getEditor != "undefined") {
      returnStr = true;
    }
  }
  return returnStr;
};
