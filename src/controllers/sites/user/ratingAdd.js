import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { titleService, schedulerJobService, awardService } from "../../../services/index.js";

/**
 * ratingAdd
 * @param req
 * @param res
 */
export const ratingAdd = async (req, res, next) => {
  try {
    const reqBody = req.body;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid id"));
    }
    const ratingableId = reqBody.id; //It will be ratingable id
    const userId = req.userDetails.userId; //It will login user id
    const rating = reqBody.rating; //number of rating
    const ratingableType = reqBody.type; // value will be title/people/award
    const language = req.accept_language;
    let getInformations = {};
    if (ratingableType == "award") {
      getInformations = await model.awards.findOne({
        attributes: ["id"],
        where: { id: ratingableId, status: "active" },
      });
    }
    if (ratingableType == "title") {
      getInformations = await model.title.findOne({
        attributes: ["id", "type"],
        where: { id: ratingableId, record_status: "active" },
      });
    }

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid id"));

    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    // check ratings is given or not by user id & movie id
    const checkFavourite = await model.ratings.findOne({
      where: {
        user_id: userId,
        ratingable_id: ratingableId,
        ratingable_type: ratingableType,
        status: "active",
      },
    });
    // If User Id & movie id not present in the table- Inserting a new row for the user else update
    if (!checkFavourite) {
      const createData = {
        rating: rating,
        ratingable_id: ratingableId,
        user_id: userId,
        site_language: language,
        ratingable_type: ratingableType,
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.ratings.create(createData);
    } else {
      const updateData = {
        rating: rating,
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.ratings.update(updateData, {
        where: { ratingable_id: ratingableId, ratingable_type: ratingableType, user_id: userId },
      });
    }
    if (ratingableType == "title") {
      await titleService.updateTitleAvgRating(ratingableId);
      //add scheudle to update search db
      if (ratingableId && getInformations && getInformations.type) {
        const payload = {
          list: [{ record_id: ratingableId, type: getInformations.type, action: "edit" }],
        };
        schedulerJobService.addJobInScheduler(
          "update title data to search db",
          JSON.stringify(payload),
          "search_db",
          `title rating ${getInformations.type} Details`,
          userId,
        );
      }
    }
    if (ratingableType == "award") {
      await awardService.updateAwardAvgRating(ratingableId);
    }
    //
    res.ok({
      message: res.__("rating saved successfully"),
    });
  } catch (error) {
    next(error);
  }
};
