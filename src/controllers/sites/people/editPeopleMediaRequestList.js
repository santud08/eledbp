import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { paginationService } from "../../../services/index.js";
import { fn, col } from "sequelize";

/**
 * editPeopleMediaRequestList
 * @param req
 * @param res
 */
export const editPeopleMediaRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const peopleId = req.body.people_id;
    let tmdbId = "";
    const peopleDetails = await model.people.findOne({
      where: { id: peopleId, status: "active" },
    });

    if (!peopleDetails) throw StatusError.badRequest(res.__("Invalid People Id"));
    tmdbId = peopleDetails && peopleDetails.tmdb_id ? peopleDetails.tmdb_id : "";
    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const mediaType = req.body.media_type;
    let findMediaDetails = null;

    // find request id is present or not
    if (requestId) {
      // find requestId is present in request table
      findMediaDetails = await model.peopleRequestMedia.findOne({
        where: {
          request_id: requestId,
          status: "active",
        },
      });
    }

    // Fetching the list of media details
    let videoResponseDetails = [];
    let imageResponseDetails = [];
    let backgroundImageResponseDetails = [];
    let posterResponseDetails = [];
    if (findMediaDetails) {
      const videoList =
        findMediaDetails.video_details != null ? JSON.parse(findMediaDetails.video_details) : null;
      const imageList =
        findMediaDetails.image_details != null ? JSON.parse(findMediaDetails.image_details) : null;
      const backgroundImageList =
        findMediaDetails.background_image_details != null
          ? JSON.parse(findMediaDetails.background_image_details)
          : null;
      const posterList =
        findMediaDetails.poster_image_details != null
          ? JSON.parse(findMediaDetails.poster_image_details)
          : null;
      //media type video
      if (mediaType === "video") {
        // video list
        if (videoList && videoList.list.length > 0) {
          for (const videoDetails of videoList.list) {
            const data = {
              id: videoDetails.id,
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
                id: imageDetails.id,
                image_original_name: imageDetails.original_name,
                image_path: imageDetails.path,
              };
              imageResponseDetails.push(data);
            }
          }
          if (backgroundImageList != null && backgroundImageList.list.length > 0) {
            for (const backgroundImageDetails of backgroundImageList.list) {
              const data = {
                id: backgroundImageDetails.id,
                image_original_name: backgroundImageDetails.original_name,
                image_path: backgroundImageDetails.path,
              };
              backgroundImageResponseDetails.push(data);
            }
          }
        }
      } else if (mediaType === "poster") {
        //poster list
        if (posterList && posterList.list.length > 0) {
          for (const posterDetails of posterList.list) {
            const data = {
              id: posterDetails.id,
              poster_original_name: posterDetails.original_name,
              poster_path: posterDetails.path,
              is_main_poster: posterDetails.is_main_poster,
            };
            posterResponseDetails.push(data);
          }
        }
      }
    } else if (peopleId) {
      // if there is no request id is present - fetch the media details related to people ID for the first time
      let imageIncludeQuery = [],
        videoIncludeQuery = [];

      const imageAttributes = [
        "id",
        "original_name",
        "file_name",
        "url",
        "is_main_poster",
        "image_category",
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
      ];
      // Media for videos
      const videoAttributes = [
        "id",
        "name",
        "is_official_trailer",
        "url",
        "thumbnail",
        "no_of_view",
        "video_duration",
      ];

      const imageCondition = {
        people_id: peopleId,
        status: "active",
      };

      const videoCondition = {
        title_id: peopleId,
        status: "active",
        video_for: "people",
      };
      const searchParams = {
        distinct: true,
        raw: false,
      };
      const imageResultData = await paginationService.pagination(
        searchParams,
        model.peopleImages,
        imageIncludeQuery,
        imageCondition,
        imageAttributes,
      );

      const videoResultData = await paginationService.pagination(
        searchParams,
        model.video,
        videoIncludeQuery,
        videoCondition,
        videoAttributes,
      );

      if (mediaType == "image" && imageResultData && imageResultData.rows.length > 0) {
        for (const value of imageResultData.rows) {
          if (value) {
            if (value.image_category == "image") {
              const data = {
                id: value.id ? value.id : "",
                image_category: value.image_category ? value.image_category : "",
                image_original_name: value.original_name ? value.original_name : "",
                image_path: value.path ? value.path : "",
              };
              imageResponseDetails.push(data);
            }
            if (value.image_category == "bg_image") {
              const data = {
                id: value.id ? value.id : "",
                image_category: value.image_category ? value.image_category : "",
                image_original_name: value.original_name ? value.original_name : "",
                image_path: value.path ? value.path : "",
              };
              backgroundImageResponseDetails.push(data);
            }
          }
        }
      }
      if (mediaType == "video" && videoResultData && videoResultData.rows.length > 0) {
        for (const value of videoResultData.rows) {
          if (value) {
            const data = {
              id: value.id ? value.id : "",
              video_title: value.name ? value.name : "",
              video_url: value.url ? value.url : "",
              is_official_trailer: value.is_official_trailer ? value.is_official_trailer : "",
              thumbnail: value.thumbnail,
              view_count: value.no_of_view,
              video_duration: value.video_duration,
            };
            videoResponseDetails.push(data);
          }
        }
      }
    }

    res.ok({
      tmdb_id: tmdbId,
      draft_request_id: requestId,
      draft_media_id: findMediaDetails && findMediaDetails.id,
      video_details: videoResponseDetails,
      image_details: imageResponseDetails,
      bg_image_details: backgroundImageResponseDetails,
    });
  } catch (error) {
    next(error);
  }
};
