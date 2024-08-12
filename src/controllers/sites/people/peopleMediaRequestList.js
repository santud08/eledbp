import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { tmdbService } from "../../../services/index.js";

/**
 * peopleMediaRequestList
 * @param req
 * @param res
 */
export const peopleMediaRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;
    const mediaType = req.body.media_type;

    // find request id is present or not
    const findRequestId = await model.peopleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
      },
    });

    // find requestId is present in request table
    const findMediaDetails = await model.peopleRequestMedia.findOne({
      where: {
        request_id: requestId,
        status: "active",
      },
    });

    // Getting TMDB ID from Request Details
    const tmdbId = findRequestId.tmdb_id ? findRequestId.tmdb_id : "";

    let videoResponseDetails = [];
    let imageResponseDetails = [];
    let backgroundImageResponseDetails = [];
    let posterResponseDetails = [];
    if (findMediaDetails) {
      // Fetching the list of cast and crew details
      const videoList =
        findMediaDetails && findMediaDetails.video_details != null
          ? JSON.parse(findMediaDetails.video_details)
          : null;
      const imageList =
        findMediaDetails && findMediaDetails.image_details != null
          ? JSON.parse(findMediaDetails.image_details)
          : null;
      const backgroundImageList =
        findMediaDetails && findMediaDetails.background_image_details != null
          ? JSON.parse(findMediaDetails.background_image_details)
          : null;
      const posterList =
        findMediaDetails && findMediaDetails.poster_image_details != null
          ? JSON.parse(findMediaDetails.poster_image_details)
          : null;
      //media type video
      if (mediaType === "video") {
        // video list
        if (videoList && videoList.list.length > 0) {
          for (const videoDetails of videoList.list) {
            const data = {
              video_title: videoDetails.name,
              video_url: videoDetails.url,
              is_official_trailer: videoDetails.is_official_trailer,
              thumbnail: videoDetails.thumbnail,
              view_count: videoDetails.no_of_view,
              video_duration: videoDetails.video_duration,
            };
            videoResponseDetails.push(data);
          }
        }
      } else if (mediaType === "image") {
        // image list
        if (imageList || backgroundImageList) {
          if (imageList != null && imageList.list.length > 0) {
            for (const imageDetails of imageList.list) {
              const data = {
                image_file_name: imageDetails.file_name ? imageDetails.file_name : "",
                image_original_name: imageDetails.original_name ? imageDetails.original_name : "",
                image_path: imageDetails.path ? imageDetails.path : "",
                size: imageDetails.file_size ? imageDetails.file_size : "",
                file_extension: imageDetails.file_extension ? imageDetails.file_extension : "",
                mime_type: imageDetails.mime_type ? imageDetails.mime_type : "",
              };
              imageResponseDetails.push(data);
            }
          }
          if (backgroundImageList != null && backgroundImageList.list.length > 0) {
            for (const backgroundImageDetails of backgroundImageList.list) {
              const data = {
                image_file_name: backgroundImageDetails.file_name
                  ? backgroundImageDetails.file_name
                  : "",
                image_original_name: backgroundImageDetails.original_name
                  ? backgroundImageDetails.original_name
                  : "",
                image_path: backgroundImageDetails.path ? backgroundImageDetails.path : "",
                size: backgroundImageDetails.file_size ? backgroundImageDetails.file_size : "",
                file_extension: backgroundImageDetails.file_extension
                  ? backgroundImageDetails.file_extension
                  : "",
                mime_type: backgroundImageDetails.mime_type ? backgroundImageDetails.mime_type : "",
              };
              backgroundImageResponseDetails.push(data);
            }
          }
        }
      } else if (mediaType === "poster") {
        //poster list -- not in use
        if (posterList && posterList.list.length > 0) {
          for (const posterDetails of posterList.list) {
            const data = {
              poster_original_name: posterDetails.original_name,
              poster_path: posterDetails.path,
              is_main_poster: posterDetails.is_main_poster,
            };
            posterResponseDetails.push(data);
          }
        }
      }
    } else if (tmdbId) {
      const peopleTmdbImage = await tmdbService.fetchPeopleImages(tmdbId, siteLanguage);

      if (mediaType === "image" && peopleTmdbImage && peopleTmdbImage.results) {
        if (peopleTmdbImage.results.images && peopleTmdbImage.results.images.length > 0) {
          for (const imageDetails of peopleTmdbImage.results.images) {
            const data = {
              image_file_name: imageDetails.filename ? imageDetails.filename : "",
              image_original_name: imageDetails.originalname ? imageDetails.originalname : "",
              image_path: imageDetails.path ? imageDetails.path : "",
              size: imageDetails.size ? imageDetails.size : "",
              file_extension: imageDetails.file_extension ? imageDetails.file_extension : "",
              mime_type: imageDetails.mime_type ? imageDetails.mime_type : "",
            };
            imageResponseDetails.push(data);
          }
        }
      }
    }

    res.ok({
      draft_request_id: requestId,
      draft_media_id: findMediaDetails ? findMediaDetails.id : "",
      video_details: videoResponseDetails,
      image_details: imageResponseDetails,
      bg_image_details: backgroundImageResponseDetails,
    });
  } catch (error) {
    next(error);
  }
};
