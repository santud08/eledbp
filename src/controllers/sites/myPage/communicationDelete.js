import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * communicationDelete
 * @param req
 * @param res
 */
export const communicationDelete = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId, status: "active" } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const reqBody = req.body;
    const communicationId = reqBody.id; // to delete the communication
    const communicationType = reqBody.communication_type;

    // checking for particular Community comment,goofs,trivia or famous_line
    const communicationExist = await model.community.findOne({
      where: {
        id: communicationId,
        status: "active",
        community_type: communicationType,
      },
    });

    if (!communicationExist) throw StatusError.badRequest(res.__("Invalid communication id"));

    if (communicationExist) {
      // Deleting the Communication records
      const communicationDel = await model.community.update(
        {
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
          status: "deleted",
        },
        {
          where: {
            id: communicationId,
            status: "active",
            community_type: communicationType,
          },
        },
      );

      // Deleting the Communication reply records
      if (communicationDel) {
        await model.community.update(
          {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          },
          {
            where: {
              parent_id: communicationId,
              status: "active",
              community_type: communicationType,
            },
          },
        );
      }

      // Deleting the Community likes records
      const communicationLike = await model.communityLikes.findOne({
        where: {
          community_id: communicationId,
          status: "active",
          user_id: userId,
        },
      });
      if (communicationLike) {
        await model.communityLikes.update(
          {
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
            status: "deleted",
          },
          {
            where: {
              community_id: communicationId,
              status: "active",
              user_id: userId,
            },
          },
        );
      }
      res.ok({ message: res.__("Data deleted successfully") });
    }
  } catch (error) {
    next(error);
  }
};
