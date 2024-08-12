import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { schedulerJobService } from "../../../services/index.js";

/**
 * favouriteAdd
 * @param req
 * @param res
 */
export const favouriteAdd = async (req, res, next) => {
  try {
    const reqBody = req.body;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid id"));
    }
    const id = reqBody.id; //It will be title id
    const userId = req.userDetails.userId; //It will login user id
    const favourableType = reqBody.type; // value will be title/people/award
    const language = req.accept_language;
    let titleType = "";

    // check id is exist when type is title
    if (favourableType == "title") {
      const checkId = await model.title.findOne({
        where: { id: id, record_status: "active" },
      });
      if (!checkId) throw StatusError.badRequest(res.__("Invalid title id"));
      titleType = checkId.type;
    }
    if (favourableType == "people") {
      const checkId = await model.people.findOne({
        where: { id: id, status: "active" },
      });
      if (!checkId) throw StatusError.badRequest(res.__("Invalid People Id"));
      titleType = "people";
    }

    if (favourableType == "award") {
      const checkId = await model.awards.findOne({
        where: { id: id, status: "active" },
      });
      if (!checkId) throw StatusError.badRequest(res.__("Invalid award Id"));
    }

    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    // check favourite is given or not by user id & movie id
    const checkFavourite = await model.favourites.findOne({
      where: {
        user_id: userId,
        favourable_id: id,
        favourable_type: favourableType,
        status: "active",
      },
    });
    // If User Id & movie id not present in the table- Inserting a new row for the user else update
    if (!checkFavourite) {
      const createData = {
        favourable_id: id,
        user_id: userId,
        site_language: language,
        favourable_type: favourableType,
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.favourites.create(createData);
      if (titleType && id) {
        const payload = { list: [{ record_id: id, type: titleType, action: "edit" }] };
        schedulerJobService.addJobInScheduler(
          `edit ${favourableType} data to search db`,
          JSON.stringify(payload),
          "search_db",
          `update search db for ${titleType} Details from favourite`,
          userId,
        );
      }
    } else {
      const updateData = {
        status: "deleted",
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.favourites.update(updateData, {
        where: { favourable_id: id, favourable_type: favourableType, user_id: userId },
      });
      if (titleType && id) {
        const payload = { list: [{ record_id: id, type: titleType, action: "delete" }] };
        schedulerJobService.addJobInScheduler(
          `edit ${favourableType} data to search db`,
          JSON.stringify(payload),
          "search_db",
          `update search db for ${titleType} Details from favourite`,
          userId,
        );
      }
    }
    res.ok({
      message: res.__("favourite saved successfully"),
    });
  } catch (error) {
    next(error);
  }
};
