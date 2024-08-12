import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * saveUserTheme
 * @param req
 * @param res
 */
export const saveUserTheme = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const theme = req.body.theme;

    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    // check for stored user theme :
    const userTheme = await model.cssTheme.findOne({
      where: {
        user_id: userId,
        status: "active",
      },
    });
    // If User Id not present in the table- Inserting a new row for the user else update the user theme
    if (!userTheme) {
      const createData = {
        name: theme,
        is_dark: theme == "dark" ? 1 : 0,
        default_light: theme == "light" ? 1 : 0,
        default_dark: theme == "dark" ? 1 : 0,
        user_id: userId,
        colors: "",
        status: "active",
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.cssTheme.create(createData);
    } else {
      const updateData = {
        name: theme,
        is_dark: theme == "dark" ? 1 : 0,
        default_light: theme == "light" ? 1 : 0,
        default_dark: theme === "dark" ? 1 : 0,
        user_id: userId,
        status: "active",
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.cssTheme.update(updateData, { where: { id: userTheme.id } });
    }
    res.ok({
      message: res.__("theme saved successfully"),
    });
  } catch (error) {
    next(error);
  }
};
