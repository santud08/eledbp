import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * saveTagDetails
 * @param req
 * @param res
 */
export const saveTagDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const tagId = req.body.draft_tag_id;
    const siteLanguage = req.body.site_language;
    data.request_id = req.body.draft_request_id;

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });
    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    // find other request ID - using relation ID
    const relationId = findRequestId && findRequestId.relation_id ? findRequestId.relation_id : "";
    const otherLanguage = siteLanguage === "en" ? "ko" : "en";
    const findOtherLangRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        relation_id: relationId,
        status: "active",
        request_status: "draft",
        site_language: otherLanguage,
      },
    });
    const otherLangRequestId =
      findOtherLangRequestId && findOtherLangRequestId.id ? findOtherLangRequestId.id : "";

    // user genre_list
    let genreList = [];
    const genreListId = [];
    for (const genre of req.body.genre_details) {
      const findGenreTagType = await model.tag.findOne({
        where: { id: genre.id, status: "active" },
      });
      if (
        findGenreTagType &&
        findGenreTagType.type == "genre" &&
        (genreListId.length === 0 || genreListId.indexOf(genre.id) === -1)
      ) {
        genreListId.push(genre.id);
        const element = {
          id: "",
          tag_id: genre.id,
          tag_name: genre.title,
          taggable_id: "",
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
      const findTagType = await model.tag.findOne({ where: { id: tag.id, status: "active" } });
      if (findTagType && findTagType.type != "genre") {
        const element = {
          id: "",
          tag_id: tag.id,
          tag_name: tag.title,
          taggable_id: "",
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
      const tagIdData = await model.titleRequestTag.create(data);

      // creating request for other language:
      if (otherLangRequestId) {
        data.request_id = otherLangRequestId;
        await model.titleRequestTag.create(data);
      }
      // creating response
      const tagData = await model.titleRequestTag.findAll({
        attributes: ["id", "request_id"],
        where: { id: tagIdData.id },
      });
      let responseDetails = [];
      for (let element of tagData) {
        let requiredFormat = {
          draft_request_id: element.request_id,
          draft_tag_id: element.id,
        };
        responseDetails.push(requiredFormat);
      }
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
        const updatedTag = await model.titleRequestTag.findAll({
          where: { id: tagId, status: "active" },
        });
        let responseDetails = [];
        for (let element of updatedTag) {
          let requiredFormat = {
            draft_request_id: element.request_id,
            draft_tag_id: element.id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Tag ID"));
      }
    }
  } catch (error) {
    next(error);
  }
};
