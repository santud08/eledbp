import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, customFileHelper } from "../../../helpers/index.js";
import { peopleRequestService } from "../../../services/index.js";

/**
 * editPeopleMediaDetails
 * @param req
 * @param res
 */
export const editPeopleMediaDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    let peopleId = req.body.people_id ? req.body.people_id : null;
    const mediaId = req.body.draft_media_id;
    const siteLanguage = req.body.site_language;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const peopleDetails = await model.people.findOne({
      where: { id: peopleId, status: "active" },
    });

    if (!peopleDetails) throw StatusError.badRequest(res.__("Invalid People Id"));

    let primaryResponseDetails = [];
    if (!req.body.draft_request_id) {
      //create request id
      data.request_id = await peopleRequestService.createPeopleRequestId(
        peopleId,
        userId,
        siteLanguage,
      );
      if (data.request_id) {
        const findAllRequestIds = await model.peopleRequestPrimaryDetails.findAll({
          attributes: ["id", "relation_id", "site_language"],
          where: { id: data.request_id, status: "active", site_language: siteLanguage },
        });
        if (findAllRequestIds && findAllRequestIds.length > 0) {
          for (const element of findAllRequestIds) {
            const requiredFormat = {
              user_id: userId,
              draft_request_id: element.id,
              draft_relation_id: element.relation_id,
              draft_site_language: element.site_language,
            };
            primaryResponseDetails.push(requiredFormat);
          }
        }
      }
    } else {
      const relationId = req.body.draft_request_id;
      const peopleRequest = await model.peopleRequestPrimaryDetails.findOne({
        where: {
          relation_id: relationId,
          status: "active",
          request_status: "draft",
          site_language: siteLanguage,
        },
      });
      if (!peopleRequest) {
        data.request_id = await peopleRequestService.createPeopleRequestId(
          peopleId,
          userId,
          siteLanguage,
          relationId,
        );
        // generating the response data
        const findRequestRelationIds = await model.peopleRequestPrimaryDetails.findAll({
          attributes: ["id", "relation_id", "site_language"],
          where: { relation_id: relationId, status: "active", site_language: siteLanguage },
        });
        if (findRequestRelationIds && findRequestRelationIds.length > 0) {
          for (const element of findRequestRelationIds) {
            const requiredFormat = {
              user_id: element.user_id,
              draft_request_id: element.id,
              draft_relation_id: element.relation_id,
              draft_site_language: element.site_language,
            };
            primaryResponseDetails.push(requiredFormat);
          }
        }
      } else {
        if (peopleRequest.site_language === siteLanguage) {
          data.request_id = req.body.draft_request_id;
          // creating response
          const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
            attributes: ["id", "relation_id", "site_language"],
            where: {
              relation_id: peopleRequest.relation_id,
              status: "active",
              site_language: siteLanguage,
            },
          });
          for (const element of findRequestId) {
            const requiredFormat = {
              user_id: userId,
              draft_request_id: element.id,
              draft_relation_id: element.relation_id,
              draft_site_language: element.site_language,
            };
            primaryResponseDetails.push(requiredFormat);
          }
        } else {
          throw StatusError.badRequest(res.__("languageDoesnotMatched"));
        }
      }
    }

    const findRequestId = await model.peopleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    if (peopleId == null) {
      peopleId = findRequestId && findRequestId.people_id ? findRequestId.people_id : "";
    }

    // user video_list
    let videoList = [];
    if (req.body.video_list) {
      for (const video of req.body.video_list) {
        const element = {
          id: video.id,
          name: video.video_title,
          thumbnail: video.thumbnail ? video.thumbnail : null,
          no_of_view: video.view_count ? video.view_count : 0,
          video_duration: video.video_duration ? video.video_duration : null,
          url: video.video_url,
          type: "external",
          quality: "",
          people_id: peopleId,
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
          id: backgroundImage.id ? backgroundImage.id : "",
          original_name: backgroundImage.originalname ? backgroundImage.originalname : "",
          file_name: backgroundImage.filename ? backgroundImage.filename : "",
          url: "",
          path: backgroundImage.path,
          file_size: backgroundImage.size ? backgroundImage.size : "",
          mime_type: backgroundImage.mime_type ? backgroundImage.mime_type : "",
          file_extension: backgroundImage.path
            ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
            : "",
          people_id: peopleId,
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
          id: image.id,
          original_name: image.originalname,
          file_name: image.filename,
          url: "",
          path: image.path,
          file_size: image.size,
          mime_type: image.mime_type,
          file_extension: image.path ? await customFileHelper.getFileExtByFileName(image.path) : "",
          people_id: peopleId,
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
      res.ok({ data: responseDetails, primary_details: primaryResponseDetails });
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
        res.ok({ data: responseDetails, primary_details: primaryResponseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Media ID"));
      }
    }
  } catch (error) {
    next(error);
  }
};
