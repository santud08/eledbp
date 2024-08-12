import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, customFileHelper } from "../../../helpers/index.js";
import { titleRequestService } from "../../../services/index.js";

/**
 * editMediaDetails
 * @param req
 * @param res
 */
export const editMediaDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    let titleId = req.body.title_id ? req.body.title_id : "";
    const mediaId = req.body.draft_media_id ? req.body.draft_media_id : "";
    const titleType = req.body.title_type;
    const siteLanguage = req.body.site_language;
    const seasonPkId = titleType == "tv" && req.body.season_id ? req.body.season_id : "";

    // check for existence of title ID
    const titleData = await model.title.findOne({
      where: { id: titleId, record_status: "active" },
    });

    if (!titleData) throw StatusError.badRequest(res.__("Invalid Title Id"));

    // Check for request ID
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });
    // Creating Request ID from media details
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

    // mediaId is not present for that request_id create the data else update the data
    // ----------------------for title type = movie
    if (titleType === "movie") {
      //video List
      let videoList = [];
      let imageIist = [];
      let backgroundImageList = [];
      let posterImageList = [];
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
            title_id: titleId,
            season: "",
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
      }
      data.video_details = { list: videoList };
      //Background image
      if (req.body.background_image) {
        for (const backgroundImage of req.body.background_image) {
          const element = {
            id: backgroundImage.id,
            original_name: backgroundImage.originalname,
            file_name: backgroundImage.filename,
            url: "",
            path: backgroundImage.path,
            file_size: backgroundImage.size,
            mime_type: backgroundImage.mime_type,
            file_extension: backgroundImage.path
              ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
              : "",
            title_id: titleId,
            season_id: "",
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
      }
      data.background_image_details = { list: backgroundImageList };
      //image_list:
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
            file_extension: image.path
              ? await customFileHelper.getFileExtByFileName(image.path)
              : "",
            title_id: titleId,
            season_id: "",
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
      }
      data.image_details = { list: imageIist };
      //Poster Image
      if (req.body.poster_image_list) {
        for (const posterImage of req.body.poster_image_list) {
          const element = {
            id: posterImage.id,
            original_name: posterImage.originalname,
            file_name: posterImage.filename,
            url: "",
            path: posterImage.path,
            file_size: posterImage.size,
            mime_type: posterImage.mime_type,
            file_extension: posterImage.path
              ? await customFileHelper.getFileExtByFileName(posterImage.path)
              : "",
            title_id: titleId,
            season_id: "",
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
      }
      data.poster_image_details = { list: posterImageList };
      // checking whether mediaId is already present
      let findMediaId = await model.titleRequestMedia.findOne({
        where: { request_id: data.request_id, status: "active" },
      });
      if (!findMediaId) {
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;
        // creating ID for the first time
        const createdMediaId = await model.titleRequestMedia.create(data);
        // creating response
        const [mediaData, getRelationData] = await Promise.all([
          model.titleRequestMedia.findAll({
            attributes: ["id", "request_id"],
            where: { id: createdMediaId.id },
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
        for (let element of mediaData) {
          let requiredFormat = {
            draft_relation_id:
              getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
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
          await model.titleRequestMedia.update(data, {
            where: { id: mediaId, request_id: data.request_id, status: "active" },
          });
          // creating response

          const [updatedMedia, getRelationData] = await Promise.all([
            model.titleRequestMedia.findAll({
              where: { id: mediaId, status: "active" },
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
          for (let element of updatedMedia) {
            let requiredFormat = {
              draft_relation_id:
                getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
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
    }

    // ----------------------for title type TV
    if (titleType === "tv") {
      let videoList = [];
      let backgroundImageList = [];
      let imageIist = [];
      let posterImageList = [];

      let findMediaId = {};
      let seasonId = "";
      if (draftSeasonId) {
        findMediaId = await model.titleRequestMedia.findOne({
          where: {
            request_id: data.request_id,
            request_season_id: draftSeasonId,
            status: "active",
          },
        });
        seasonId = draftSeasonId;
      } else if (seasonPkId) {
        findMediaId = await model.titleRequestMedia.findOne({
          where: {
            request_id: data.request_id,
            season_id: seasonPkId,
            status: "active",
          },
        });
        seasonId = seasonPkId;
      }
      const mediaObjectLength = findMediaId ? Object.keys(findMediaId).length : 0;
      if (seasonId != "" && mediaObjectLength == 0) {
        data.request_season_id = draftSeasonId ? draftSeasonId : null;
        data.season_id = seasonPkId ? seasonPkId : null;
        //video List
        if (req.body.video_list) {
          for (const video of req.body.video_list) {
            if (video.action_type != "d") {
              const element = {
                id: video.id,
                name: video.video_title,
                thumbnail: video.thumbnail ? video.thumbnail : null,
                no_of_view: video.view_count ? video.view_count : 0,
                video_duration: video.video_duration ? video.video_duration : null,
                url: video.video_url,
                type: "external",
                quality: "",
                title_id: titleId,
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
          }
        }
        data.video_details = { list: videoList };
        //Background image
        if (req.body.background_image) {
          for (const backgroundImage of req.body.background_image) {
            if (backgroundImage.action_type != "d") {
              const element = {
                id: backgroundImage.id,
                original_name: backgroundImage.originalname,
                file_name: backgroundImage.filename,
                url: "",
                path: backgroundImage.path,
                file_size: backgroundImage.size,
                mime_type: backgroundImage.mime_type,
                file_extension: backgroundImage.path
                  ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
                  : "",
                title_id: titleId,
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
          }
        }
        data.background_image_details = { list: backgroundImageList };
        //image_list:
        if (req.body.image_list) {
          for (const image of req.body.image_list) {
            if (image.action_type != "d") {
              const element = {
                id: image.id,
                original_name: image.originalname,
                file_name: image.filename,
                url: "",
                path: image.path,
                file_size: image.size,
                mime_type: image.mime_type,
                file_extension: image.path
                  ? await customFileHelper.getFileExtByFileName(image.path)
                  : "",
                title_id: titleId,
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
          }
        }
        data.image_details = { list: imageIist };
        //Poster Image
        if (req.body.poster_image_list) {
          for (const posterImage of req.body.poster_image_list) {
            if (posterImage.action_type != "d") {
              const element = {
                id: posterImage.id,
                original_name: posterImage.originalname,
                file_name: posterImage.filename,
                url: "",
                path: posterImage.path,
                file_size: posterImage.size,
                mime_type: posterImage.mime_type,
                file_extension: posterImage.path
                  ? await customFileHelper.getFileExtByFileName(posterImage.path)
                  : "",
                title_id: titleId,
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
          }
        }
        data.poster_image_details = { list: posterImageList };

        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;

        // creating ID for the first time
        const createdMediaId = await model.titleRequestMedia.create(data);
        // creating response
        const [mediaData, getRelationData] = await Promise.all([
          model.titleRequestMedia.findAll({
            attributes: ["id", "request_id", "request_season_id", "season_id"],
            where: { id: createdMediaId.id, status: "active" },
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
        for (let element of mediaData) {
          let requiredFormat = {
            draft_relation_id:
              getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
            draft_request_id: element.request_id,
            draft_media_id: element.id,
            draft_season_id: element.request_season_id,
            season_id: element.season_id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else if (mediaObjectLength > 0) {
        // Update the current list
        //  finding media and then adding videos to its existing list
        if (mediaId === findMediaId.id) {
          data.request_season_id = draftSeasonId ? draftSeasonId : null;
          data.season_id = seasonPkId ? seasonPkId : null;
          data.updated_at = await customDateTimeHelper.getCurrentDateTime();
          data.updated_by = userId;
          //  getting the Mddia details that are already saved and update the data with respect to action_type
          //---------Video List
          const parsedVideoDetails =
            findMediaId.video_details != null && findMediaId.video_details
              ? JSON.parse(findMediaId.video_details)
              : null;
          videoList = parsedVideoDetails != null ? parsedVideoDetails.list : [];
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
                title_id: titleId,
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
                  (e) =>
                    e.name != null && e.name === video.video_title && e.url === video.video_url,
                );
                videoList[foundIndex] = element;
              }
              // Action = Delete
              if (video.action_type === "d" && parsedVideoDetails != null) {
                const foundIndex = videoList.findIndex(
                  (d) =>
                    d.name != null && d.name === video.video_title && d.url === video.video_url,
                );
                videoList.splice(foundIndex, 1);
              }
            }
          }
          data.video_details = { list: videoList };

          //-------------backgroundImageList
          const parsedBgDetails =
            findMediaId.background_image_details != null && findMediaId.background_image_details
              ? JSON.parse(findMediaId.background_image_details)
              : null;
          backgroundImageList = parsedBgDetails != null ? parsedBgDetails.list : [];
          if (req.body.background_image) {
            for (const backgroundImage of req.body.background_image) {
              const element = {
                id: backgroundImage.id,
                original_name: backgroundImage.originalname,
                file_name: backgroundImage.filename,
                url: "",
                path: backgroundImage.path,
                file_size: backgroundImage.size,
                mime_type: backgroundImage.mime_type,
                file_extension: backgroundImage.path
                  ? await customFileHelper.getFileExtByFileName(backgroundImage.path)
                  : "",
                title_id: titleId,
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
          }
          data.background_image_details = { list: backgroundImageList };

          //--------------image list
          const parsedImageDetails =
            findMediaId.image_details != null && findMediaId.image_details
              ? JSON.parse(findMediaId.image_details)
              : null;
          imageIist = parsedImageDetails != null ? parsedImageDetails.list : [];
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
                file_extension: image.path
                  ? await customFileHelper.getFileExtByFileName(image.path)
                  : "",
                title_id: titleId,
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
          }
          data.image_details = { list: imageIist };

          //---------------------poster image
          const parsedPosterImageDetails =
            findMediaId.poster_image_details != null && findMediaId.poster_image_details
              ? JSON.parse(findMediaId.poster_image_details)
              : null;
          posterImageList = parsedPosterImageDetails != null ? parsedPosterImageDetails.list : [];
          if (req.body.poster_image_list) {
            for (const posterImage of req.body.poster_image_list) {
              const element = {
                id: posterImage.id,
                original_name: posterImage.originalname,
                file_name: posterImage.filename,
                url: "",
                path: posterImage.path,
                file_size: posterImage.size,
                mime_type: posterImage.mime_type,
                file_extension: posterImage.path
                  ? await customFileHelper.getFileExtByFileName(posterImage.path)
                  : "",
                title_id: titleId,
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
          }
          data.poster_image_details = { list: posterImageList };

          await model.titleRequestMedia.update(data, {
            where: {
              id: mediaId,
              request_id: data.request_id,
              // request_season_id: seasonId,
              status: "active",
            },
          });
          // creating response
          const [updatedMedia, getRelationData] = await Promise.all([
            model.titleRequestMedia.findAll({
              where: { id: mediaId, status: "active" },
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
          for (let element of updatedMedia) {
            let requiredFormat = {
              draft_relation_id:
                getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
              draft_request_id: element.request_id,
              draft_media_id: element.id,
              draft_season_id: element.request_season_id,
              season_id: element.season_id,
            };
            responseDetails.push(requiredFormat);
          }
          res.ok({ data: responseDetails });
        } else {
          throw StatusError.badRequest(res.__("Invalid Media ID"));
        }
      } else {
        throw StatusError.badRequest(res.__("Invalid inputs"));
      }
    }
  } catch (error) {
    next(error);
  }
};
