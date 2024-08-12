import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * webtoonsMediaRequestList
 * @param req
 * @param res
 */
export const webtoonsMediaRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;
    const titleType = "webtoons";
    const seasonId = req.body.season_id;
    const mediaType = req.body.media_type;

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: titleType,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    // find requestId and mediaId is present in request table
    const findMediaDetails = await model.titleRequestMedia.findOne({
      where: {
        request_season_id: seasonId,
        request_id: requestId,
        status: "active",
      },
    });
    // Fetching the list of Media
    if (findMediaDetails) {
      // media type video and and title_type movie
      if (mediaType === "video") {
        let videoResponseDetails = [];
        const videoList =
          findMediaDetails.video_details != null
            ? JSON.parse(findMediaDetails.video_details)
            : null;
        if (videoList && videoList.list.length > 0) {
          for (const videoDetails of videoList.list) {
            if (videoDetails.season === seasonId) {
              let data = {
                draft_request_id: requestId,
                draft_media_id: findMediaDetails.id,
                video_title: videoDetails.name,
                video_url: videoDetails.url,
                season_id: videoDetails.season,
                is_official_trailer: videoDetails.is_official_trailer,
                video_language: videoDetails.site_language,
                thumbnail: videoDetails.thumbnail,
                view_count: videoDetails.no_of_view,
                video_duration: videoDetails.video_duration,
              };
              videoResponseDetails.push(data);
            }
          }
        }
        res.ok({ video_details: videoResponseDetails });
      } else if (mediaType === "image") {
        let imageResponseDetails = [];
        let backgroundImageResponseDetails = [];
        const imageList =
          findMediaDetails.image_details != null
            ? JSON.parse(findMediaDetails.image_details)
            : null;
        const backgroundImageList =
          findMediaDetails.background_image_details != null
            ? JSON.parse(findMediaDetails.background_image_details)
            : null;
        if (imageList || backgroundImageList) {
          if (imageList != null && imageList.list.length > 0) {
            for (const imageDetails of imageList.list) {
              if (imageDetails.season_id === seasonId) {
                let data = {
                  draft_request_id: requestId,
                  draft_media_id: findMediaDetails.id,
                  image_file_name: imageDetails.file_name,
                  image_original_name: imageDetails.original_name,
                  image_path: imageDetails.path,
                  season_id: imageDetails.season_id,
                  size: imageDetails.file_size ? imageDetails.file_size : "",
                  file_extension: imageDetails.file_extension ? imageDetails.file_extension : "",
                  mime_type: imageDetails.mime_type ? imageDetails.mime_type : "",
                };
                imageResponseDetails.push(data);
              }
            }
          }
          if (backgroundImageList != null && backgroundImageList.list.length > 0) {
            for (const backgroundImageDetails of backgroundImageList.list) {
              if (backgroundImageDetails.season_id === seasonId) {
                let data = {
                  draft_request_id: requestId,
                  draft_media_id: findMediaDetails.id,
                  image_file_name: backgroundImageDetails.file_name,
                  image_original_name: backgroundImageDetails.original_name,
                  image_path: backgroundImageDetails.path,
                  season_id: backgroundImageDetails.season_id,
                  size: backgroundImageDetails.file_size ? backgroundImageDetails.file_size : "",
                  file_extension: backgroundImageDetails.file_extension
                    ? backgroundImageDetails.file_extension
                    : "",
                  mime_type: backgroundImageDetails.mime_type
                    ? backgroundImageDetails.mime_type
                    : "",
                };
                backgroundImageResponseDetails.push(data);
              }
            }
          }
        }
        res.ok({
          image_details: imageResponseDetails,
          bg_image_details: backgroundImageResponseDetails,
        });
      } else if (mediaType === "poster") {
        let posterResponseDetails = [];
        const posterList =
          findMediaDetails.poster_image_details != null
            ? JSON.parse(findMediaDetails.poster_image_details)
            : null;
        if (posterList && posterList.list.length > 0) {
          for (const posterDetails of posterList.list) {
            if (posterDetails.season_id === seasonId) {
              let data = {
                draft_request_id: requestId,
                draft_media_id: findMediaDetails.id,
                poster_file_name: posterDetails.file_name,
                poster_original_name: posterDetails.original_name,
                poster_path: posterDetails.path,
                season_id: posterDetails.season_id,
                is_main_poster: posterDetails.is_main_poster,
                size: posterDetails.file_size ? posterDetails.file_size : "",
                file_extension: posterDetails.file_extension ? posterDetails.file_extension : "",
                mime_type: posterDetails.mime_type ? posterDetails.mime_type : "",
              };
              posterResponseDetails.push(data);
            }
          }
        }
        res.ok({ poster_details: posterResponseDetails });
      }
    } else {
      res.ok({ result: [] });
    }
  } catch (error) {
    next(error);
  }
};
