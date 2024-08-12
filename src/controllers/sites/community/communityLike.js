import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/* *
 * communityLike
 * for all type of search global
 * @param req
 * @param res
 * @param next
 */
export const communityLike = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const userId = req.userDetails.userId;
    const communityId = reqBody.community_id;
    const siteLanguage = req.accept_language;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));
    // check for communityId existance in community table
    const isExistsCommunityId = await model.community.findOne({
      where: { id: communityId, status: "active" },
    });
    if (!isExistsCommunityId) throw StatusError.badRequest(res.__("Invalid community id"));

    // check for communityId & userId existance in community likes table
    const isExistsAlreadyLike = await model.communityLikes.findOne({
      where: { community_id: communityId, user_id: userId, status: "active" },
    });
    let addData;
    let message;
    if (!isExistsAlreadyLike) {
      const dataObj = {
        community_id: communityId,
        user_id: userId,
        site_language: siteLanguage,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      addData = await model.communityLikes.create(dataObj);
      message = res.__("Liked");
    } else {
      const updateData = {
        status: "deleted",
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      addData = await model.communityLikes.update(updateData, {
        where: { community_id: communityId, user_id: userId },
      });
      message = res.__("Unliked");
    }

    if (addData) {
      // Like count
      const likeCount = await model.communityLikes.count({
        where: { community_id: communityId, user_id: userId, status: "active" },
      });
      res.ok({
        likeCount: likeCount,
        message: message,
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
