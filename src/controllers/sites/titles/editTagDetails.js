import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { titleRequestService } from "../../../services/index.js";
/**
 * editTagDetails
 * @param req
 * @param res
 */
export const editTagDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let titleId = req.body.title_id ? req.body.title_id : "";
    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const tagId = req.body.draft_tag_id;
    const siteLanguage = req.body.site_language;
    const titleType = req.body.title_type;
    // find request id is present or not
    // Check for request ID
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    let newRequestId = [];
    if (!findRequestId && titleType == "movie") {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForMovie(
        titleId,
        userId,
        siteLanguage,
        titleType,
        requestId,
      );
    } else if (!findRequestId && titleType == "tv") {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForTv(
        titleId,
        userId,
        siteLanguage,
        titleType,
        requestId,
      );
    } else if (!findRequestId && titleType == "webtoons") {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForWebtoons(
        titleId,
        userId,
        siteLanguage,
        titleType,
        requestId,
      );
    }

    if (newRequestId.length > 0) {
      for (const value of newRequestId) {
        if (value && value.draft_site_language == siteLanguage) {
          data.request_id = value.draft_request_id;
        }
      }
    } else {
      data.request_id = requestId;
    }

    // user genre_list
    let genreList = [];
    const genreListId = [];
    for (const genre of req.body.genre_details) {
      const findGenreTagType = await model.tag.findOne({
        where: { id: genre.tag_id, status: "active" },
      });
      if (
        findGenreTagType &&
        findGenreTagType.type == "genre" &&
        (genreListId.length === 0 || genreListId.indexOf(genre.tag_id) === -1)
      ) {
        genreListId.push(genre.tag_id);
        const element = {
          id: genre.id,
          tag_id: genre.tag_id,
          tag_name: genre.title,
          taggable_id: titleId,
          taggable_type: "title",
          site_language: siteLanguage,
          user_id: userId,
          score: genre.score,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        genreList.push(element);
      }
    }
    data.genre_details = { list: genreList };

    // user tag_list
    let tagList = [];
    for (const tag of req.body.tag_details) {
      const findTagType = await model.tag.findOne({ where: { id: tag.tag_id, status: "active" } });
      if (findTagType.type != "genre") {
        const element = {
          id: tag.id,
          tag_id: tag.tag_id,
          tag_name: tag.title,
          taggable_id: titleId,
          taggable_type: "title",
          site_language: siteLanguage,
          user_id: userId,
          score: tag.score,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        tagList.push(element);
      }
    }
    data.tag_details = { list: tagList };

    // checking whether tagId is already present for that request id
    let findtagId = await model.titleRequestTag.findOne({
      where: { request_id: data.request_id, status: "active" },
    });
    // Credit Id is not present for that request_id create the data else update the data
    if (!findtagId) {
      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = userId;
      // creating tag ID for the first time
      await model.titleRequestTag.create(data);
      // creating response
      const [tagData, getRelationData] = await Promise.all([
        model.titleRequestTag.findOne({
          attributes: ["id", "request_id"],
          where: { request_id: data.request_id },
        }),
        model.titleRequestPrimaryDetails.findOne({
          where: {
            id: data.request_id,
            site_language: siteLanguage,
            request_status: "draft",
          },
        }),
      ]);
      let responseDetails = [];
      let requiredFormat = {
        draft_relation_id:
          getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
        draft_request_id: tagData.request_id,
        draft_tag_id: tagData.id,
      };
      responseDetails.push(requiredFormat);
      res.ok({ data: responseDetails });
    } else {
      //  finding credit ID and then adding videos to its existing list
      if (tagId === findtagId.id) {
        data.updated_at = await customDateTimeHelper.getCurrentDateTime();
        data.updated_by = userId;
        // // updating the tag list and
        await model.titleRequestTag.update(data, {
          where: { id: tagId, request_id: data.request_id, status: "active" },
        });
        // creating response
        const [updatedTag, getRelationData] = await Promise.all([
          model.titleRequestTag.findOne({
            where: { id: tagId, status: "active" },
          }),
          model.titleRequestPrimaryDetails.findOne({
            where: {
              id: data.request_id,
              site_language: siteLanguage,
              request_status: "draft",
            },
          }),
        ]);
        let responseDetails = [];
        let requiredFormat = {
          draft_relation_id:
            getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
          draft_request_id: updatedTag.request_id,
          draft_tag_id: updatedTag.id,
        };
        responseDetails.push(requiredFormat);
        res.ok({ data: responseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Tag ID"));
      }
    }
  } catch (error) {
    next(error);
  }
};
