import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, customFileHelper } from "../../../helpers/index.js";

/**
 * addPeopleMediaDetails
 * @param req
 * @param res
 */
export const addPeopleMediaDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    data.request_id = req.body.draft_request_id;
    const mediaId = req.body.draft_media_id;
    const siteLanguage = req.body.site_language;

    const findRequestId = await model.peopleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    const relationId = findRequestId && findRequestId.relation_id ? findRequestId.relation_id : "";
    const otherLanguage = siteLanguage === "en" ? "ko" : "en";
    const findOtherLangRequestId = await model.peopleRequestPrimaryDetails.findOne({
      where: {
        relation_id: relationId,
        status: "active",
        request_status: "draft",
        site_language: otherLanguage,
      },
    });
    const otherLangRequestId =
      findOtherLangRequestId && findOtherLangRequestId.id ? findOtherLangRequestId.id : "";

    // user video_list
    let videoList = [];
    if (req.body.video_list) {
      for (const video of req.body.video_list) {
        const element = {
          id: "",
          name: video.video_title,
          thumbnail: video.thumbnail ? video.thumbnail : null,
          no_of_view: video.view_count ? video.view_count : 0,
          video_duration: video.video_duration ? video.video_duration : null,
          url: video.video_url,
          type: "external",
          quality: "",
          people_id: "",
          source: "local",
          negative_votes: "",
          positive_votes: "",
          reports: "",
          approved: "",
          list_order: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          user_id: userId,
          category: "",
          is_official_trailer: video.is_official_trailer,
          site_language: siteLanguage,
          status: "",
          created_by: userId,
          updated_by: "",
        };
        videoList.push(element);
      }
    }
    data.video_details = { list: videoList };

    // user background image list
    let backgroundImageList = [];
    if (req.body.background_image) {
      for (const backgroundImage of req.body.background_image) {
        const element = {
          id: "",
          original_name: backgroundImage.originalname ? backgroundImage.originalname : "",
          file_name: backgroundImage.filename ? backgroundImage.filename : "",
          url: "",
          path: backgroundImage.path,
          file_size: backgroundImage.size ? backgroundImage.size : "",
          mime_type: backgroundImage.mime_type ? backgroundImage.mime_type : "",
          file_extension: backgroundImage.path
            ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
            : "",
          people_id: "",
          source: "local",
          approved: "",
          list_order: "",
          image_category: "bg_image",
          is_main_poster: "",
          site_language: siteLanguage,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        backgroundImageList.push(element);
      }
    }
    data.background_image_details = { list: backgroundImageList };

    //image_list:
    let imageList = [];
    if (req.body.image_list) {
      for (const image of req.body.image_list) {
        const element = {
          id: "",
          original_name: image.originalname ? image.originalname : "",
          file_name: image.filename ? image.filename : "",
          url: "",
          path: image.path,
          file_size: image.size ? image.size : "",
          mime_type: image.mime_type ? image.mime_type : "",
          file_extension: image.path ? await customFileHelper.getFileExtByFileName(image.path) : "",
          people_id: "",
          source: "local",
          approved: "",
          list_order: "",
          image_category: "image",
          is_main_poster: "",
          site_language: siteLanguage,
          status: "",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_at: "",
          created_by: userId,
          updated_by: "",
        };
        imageList.push(element);
      }
    }
    data.image_details = { list: imageList };

    // checking whether mediaId is already present
    let findMediaId = await model.peopleRequestMedia.findOne({
      where: { request_id: data.request_id, status: "active" },
    });
    // mediaId is not present for that request_id create the data else update the data

    if (!findMediaId) {
      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = userId;
      // creating ID for the first time
      const createdMediaId = await model.peopleRequestMedia.create(data);
      // creating req for other language:
      if (otherLangRequestId) {
        data.request_id = otherLangRequestId;
        await model.peopleRequestMedia.create(data);
      }
      // creating response
      const mediaData = await model.peopleRequestMedia.findAll({
        attributes: ["id", "request_id"],
        where: { id: createdMediaId.id },
      });
      let responseDetails = [];
      for (let element of mediaData) {
        let requiredFormat = {
          draft_request_id: element.request_id,
          draft_media_id: element.id,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    } else {
      //  finding media and then adding videos to its existing list
      if (mediaId === findMediaId.id) {
        data.updated_at = await customDateTimeHelper.getCurrentDateTime();
        data.updated_by = userId;
        // // updating the video list and

        await model.peopleRequestMedia.update(data, {
          where: { id: mediaId, request_id: data.request_id, status: "active" },
        });
        // creating response
        const updatedMedia = await model.peopleRequestMedia.findAll({
          where: { id: mediaId, status: "active" },
        });
        let responseDetails = [];
        for (let element of updatedMedia) {
          let requiredFormat = {
            draft_request_id: element.request_id,
            draft_media_id: element.id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Media ID"));
      }
    }
  } catch (error) {
    next(error);
  }
};
