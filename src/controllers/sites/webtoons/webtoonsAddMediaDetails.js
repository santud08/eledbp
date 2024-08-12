import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, customFileHelper } from "../../../helpers/index.js";

/**
 * webtoonsAddMediaDetails
 * @param req
 * @param res
 */
export const webtoonsAddMediaDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    data.request_id = req.body.draft_request_id;
    const mediaId = req.body.draft_media_id;
    const titleType = "webtoons";
    const siteLanguage = req.body.site_language;
    const seasonId = req.body.season_id;

    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        type: titleType,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));
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

    // ----------------------for title type webtoons
    if (titleType === "webtoons") {
      let videoList = [];
      let backgroundImageList = [];
      let imageIist = [];
      let posterImageList = [];
      // check for season ID in draft season table:
      const findSeasonRequest = await model.titleRequestSeasonDetails.findOne({
        where: {
          id: seasonId,
          request_id: data.request_id,
          status: "active",
        },
      });

      if (!findSeasonRequest) throw StatusError.badRequest(res.__("Invalid Season ID"));
      const seasonNo =
        findSeasonRequest && findSeasonRequest.season_no
          ? findSeasonRequest.season_no
          : findSeasonRequest.season_no == 0
          ? 0
          : false;
      const findOtherLangSeasonRequest = await model.titleRequestSeasonDetails.findOne({
        where: {
          season_no: seasonNo,
          request_id: otherLangRequestId,
          status: "active",
        },
      });
      const otherLangSeasonReqId =
        findOtherLangSeasonRequest && findOtherLangSeasonRequest.id
          ? findOtherLangSeasonRequest.id
          : "";

      // checking whether mediaId is already present
      let findMediaId = await model.titleRequestMedia.findOne({
        where: { request_id: data.request_id, request_season_id: seasonId, status: "active" },
      });

      if (!findMediaId) {
        //video List
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
            title_id: "",
            season: seasonId,
            episode: "",
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
            site_language: video.video_language ? video.video_language : siteLanguage,
            status: "",
            created_by: userId,
            updated_by: "",
          };
          videoList.push(element);
        }
        data.video_details = { list: videoList };

        //Background image
        for (const backgroundImage of req.body.background_image) {
          const element = {
            id: "",
            original_name: backgroundImage.originalname,
            file_name: backgroundImage.filename,
            url: "",
            path: backgroundImage.path,
            file_size: backgroundImage.size,
            mime_type: backgroundImage.mime_type,
            file_extension: backgroundImage.path
              ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
              : "",
            title_id: "",
            season_id: seasonId,
            episode_id: "",
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
        data.background_image_details = { list: backgroundImageList };

        //image_list:
        for (const image of req.body.image_list) {
          const element = {
            id: "",
            original_name: image.originalname,
            file_name: image.filename,
            url: "",
            path: image.path,
            file_size: image.size,
            mime_type: image.mime_type,
            file_extension: image.path
              ? await customFileHelper.getFileExtByFileName(image.path)
              : "",
            title_id: "",
            season_id: seasonId,
            episode_id: "",
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
          imageIist.push(element);
        }
        data.image_details = { list: imageIist };

        //Poster Image
        for (const posterImage of req.body.poster_image_list) {
          const element = {
            id: "",
            original_name: posterImage.originalname,
            file_name: posterImage.filename,
            url: "",
            path: posterImage.path,
            file_size: posterImage.size,
            mime_type: posterImage.mime_type,
            file_extension: posterImage.path
              ? await customFileHelper.getFileExtByFileName(posterImage.path)
              : "",
            title_id: "",
            season_id: seasonId,
            episode_id: "",
            source: "local",
            approved: "",
            list_order: "",
            image_category: "poster_image",
            is_main_poster: posterImage.is_main_poster ? posterImage.is_main_poster : "n",
            site_language: siteLanguage,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          posterImageList.push(element);
        }
        data.poster_image_details = { list: posterImageList };

        data.request_season_id = seasonId;
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;

        // creating ID for the first time
        const createdMediaId = await model.titleRequestMedia.create(data);

        // creating data for other language:
        if (otherLangRequestId && otherLangSeasonReqId) {
          let videoOtherLangList = [],
            backgroundotherLangImageList = [],
            imageotherLangIist = [],
            posterImageotherLangList = [];
          data.request_season_id = otherLangSeasonReqId;
          data.request_id = otherLangRequestId;
          //video List
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
              title_id: "",
              season: otherLangSeasonReqId,
              episode: "",
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
              site_language: video.video_language ? video.video_language : otherLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
            videoOtherLangList.push(element);
          }
          data.video_details = { list: videoOtherLangList };

          //Background image
          for (const backgroundImage of req.body.background_image) {
            const element = {
              id: "",
              original_name: backgroundImage.originalname,
              file_name: backgroundImage.filename,
              url: "",
              path: backgroundImage.path,
              file_size: backgroundImage.size,
              mime_type: backgroundImage.mime_type,
              file_extension: backgroundImage.path
                ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
                : "",
              title_id: "",
              season_id: otherLangSeasonReqId,
              episode_id: "",
              source: "local",
              approved: "",
              list_order: "",
              image_category: "bg_image",
              is_main_poster: "",
              site_language: otherLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
            };
            backgroundotherLangImageList.push(element);
          }
          data.background_image_details = { list: backgroundotherLangImageList };

          //image_list:
          for (const image of req.body.image_list) {
            const element = {
              id: "",
              original_name: image.originalname,
              file_name: image.filename,
              url: "",
              path: image.path,
              file_size: image.size,
              mime_type: image.mime_type,
              file_extension: image.path
                ? await customFileHelper.getFileExtByFileName(image.path)
                : "",
              title_id: "",
              season_id: otherLangSeasonReqId,
              episode_id: "",
              source: "local",
              approved: "",
              list_order: "",
              image_category: "image",
              is_main_poster: "",
              site_language: otherLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
            };
            imageotherLangIist.push(element);
          }
          data.image_details = { list: imageotherLangIist };

          //Poster Image
          for (const posterImage of req.body.poster_image_list) {
            const element = {
              id: "",
              original_name: posterImage.originalname,
              file_name: posterImage.filename,
              url: "",
              path: posterImage.path,
              file_size: posterImage.size,
              mime_type: posterImage.mime_type,
              file_extension: posterImage.path
                ? await customFileHelper.getFileExtByFileName(posterImage.path)
                : "",
              title_id: "",
              season_id: otherLangSeasonReqId,
              episode_id: "",
              source: "local",
              approved: "",
              list_order: "",
              image_category: "poster_image",
              is_main_poster: posterImage.is_main_poster ? posterImage.is_main_poster : "n",
              site_language: otherLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
            };
            posterImageotherLangList.push(element);
          }
          data.poster_image_details = { list: posterImageotherLangList };
          // other language records
          await model.titleRequestMedia.create(data);
        }
        // creating response
        const mediaData = await model.titleRequestMedia.findAll({
          attributes: ["id", "request_id", "request_season_id"],
          where: { id: createdMediaId.id },
        });
        let responseDetails = [];
        for (let element of mediaData) {
          let requiredFormat = {
            draft_request_id: element.request_id,
            draft_media_id: element.id,
            draft_season_id: element.request_season_id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        // Update the current list
        //  finding media and then adding videos to its existing list
        if (mediaId === findMediaId.id) {
          data.updated_at = await customDateTimeHelper.getCurrentDateTime();
          data.updated_by = userId;
          //  getting the Mddia details that are already saved and update the data with respect to action_type
          //---------Video List
          const parsedVideoDetails =
            findMediaId.video_details != null && findMediaId.video_details
              ? JSON.parse(findMediaId.video_details)
              : null;
          videoList = parsedVideoDetails != null ? parsedVideoDetails.list : [];

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
              title_id: "",
              season: seasonId,
              episode: "",
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
              site_language: video.video_language ? video.video_language : siteLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
            // Action = Append
            if (video.action_type === "a" && parsedVideoDetails != null) {
              videoList.push(element);
            }
            // Action = Edit
            if (video.action_type === "e" && parsedVideoDetails != null) {
              const foundIndex = videoList.findIndex(
                (e) => e.name != null && e.name === video.video_title && e.url === video.video_url,
              );
              videoList[foundIndex] = element;
            }
            // Action = Delete
            if (video.action_type === "d" && parsedVideoDetails != null) {
              const foundIndex = videoList.findIndex(
                (d) => d.name != null && d.name === video.video_title && d.url === video.video_url,
              );
              videoList.splice(foundIndex, 1);
            }
          }
          data.video_details = { list: videoList };

          //-------------backgroundImageList
          const parsedBgDetails =
            findMediaId.background_image_details != null && findMediaId.background_image_details
              ? JSON.parse(findMediaId.background_image_details)
              : null;
          backgroundImageList = parsedBgDetails != null ? parsedBgDetails.list : [];
          for (const backgroundImage of req.body.background_image) {
            const element = {
              id: "",
              original_name: backgroundImage.originalname,
              file_name: backgroundImage.filename,
              url: "",
              path: backgroundImage.path,
              file_size: backgroundImage.size,
              mime_type: backgroundImage.mime_type,
              file_extension: backgroundImage.path
                ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
                : "",
              title_id: "",
              season_id: seasonId,
              episode_id: "",
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
            // Action = Append
            if (backgroundImage.action_type === "a" && parsedBgDetails != null) {
              backgroundImageList.push(element);
            }

            // Action = Delete
            if (backgroundImage.action_type === "d" && parsedBgDetails != null) {
              const foundIndex = backgroundImageList.findIndex(
                (d) => d.file_name != null && d.file_name === backgroundImage.filename,
              );
              backgroundImageList.splice(foundIndex, 1);
            }
          }
          data.background_image_details = { list: backgroundImageList };

          //--------------image list
          const parsedImageDetails =
            findMediaId.image_details != null && findMediaId.image_details
              ? JSON.parse(findMediaId.image_details)
              : null;
          imageIist = parsedImageDetails != null ? parsedImageDetails.list : [];
          for (const image of req.body.image_list) {
            const element = {
              id: "",
              original_name: image.originalname,
              file_name: image.filename,
              url: "",
              path: image.path,
              file_size: image.size,
              mime_type: image.mime_type,
              file_extension: image.path
                ? await customFileHelper.getFileExtByFileName(image.path)
                : "",
              title_id: "",
              season_id: seasonId,
              episode_id: "",
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
            // Action = Append
            if (image.action_type === "a" && parsedImageDetails != null) {
              imageIist.push(element);
            }
            // Action = Delete
            if (image.action_type === "d" && parsedImageDetails != null) {
              const foundIndex = imageIist.findIndex((d) => d.file_name === image.filename);
              imageIist.splice(foundIndex, 1);
            }
          }
          data.image_details = { list: imageIist };

          //---------------------poster image
          const parsedPosterImageDetails =
            findMediaId.poster_image_details != null && findMediaId.poster_image_details
              ? JSON.parse(findMediaId.poster_image_details)
              : null;
          posterImageList = parsedPosterImageDetails != null ? parsedPosterImageDetails.list : [];
          for (const posterImage of req.body.poster_image_list) {
            const element = {
              id: "",
              original_name: posterImage.originalname,
              file_name: posterImage.filename,
              url: "",
              path: posterImage.path,
              file_size: posterImage.size,
              mime_type: posterImage.mime_type,
              file_extension: posterImage.path
                ? await customFileHelper.getFileExtByFileName(posterImage.path)
                : "",
              title_id: "",
              season_id: seasonId,
              episode_id: "",
              source: "local",
              approved: "",
              list_order: "",
              image_category: "poster_image",
              is_main_poster: posterImage.is_main_poster ? posterImage.is_main_poster : "n",
              site_language: siteLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
            };
            // Action = Append
            if (posterImage.action_type === "a" && parsedPosterImageDetails != null) {
              posterImageList.push(element);
            }
            // // Action = Edit
            if (posterImage.action_type === "e" && parsedPosterImageDetails != null) {
              const foundIndex = posterImageList.findIndex(
                (e) => e.file_name != null && e.file_name === posterImage.filename,
              );
              posterImageList[foundIndex] = element;
            }
            // Action = Delete
            if (posterImage.action_type === "d" && parsedPosterImageDetails != null) {
              const foundIndex = posterImageList.findIndex(
                (d) => d.file_name != null && d.file_name === posterImage.filename,
              );
              posterImageList.splice(foundIndex, 1);
            }
          }
          data.poster_image_details = { list: posterImageList };

          await model.titleRequestMedia.update(data, {
            where: {
              id: mediaId,
              request_id: data.request_id,
              request_season_id: seasonId,
              status: "active",
            },
          });
          // creating response
          const updatedMedia = await model.titleRequestMedia.findAll({
            where: { id: mediaId, status: "active" },
          });
          let responseDetails = [];
          for (let element of updatedMedia) {
            let requiredFormat = {
              draft_request_id: element.request_id,
              draft_media_id: element.id,
              draft_season_id: element.request_season_id,
            };
            responseDetails.push(requiredFormat);
          }
          res.ok({ data: responseDetails });
        } else {
          throw StatusError.badRequest(res.__("Invalid Media ID"));
        }
      }
    }
  } catch (error) {
    next(error);
  }
};
