import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";

/**
 * editWtMediaRequestList
 * @param req
 * @param res
 */
export const editWtMediaRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const titleId = req.body.title_id ? req.body.title_id : "";
    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const seasonPkId = req.body.season_id ? req.body.season_id : "";
    const mediaType = req.body.media_type;

    let videoResponseDetails = [],
      imageResponseDetails = [],
      backgroundImageResponseDetails = [],
      posterResponseDetails = [];

    // find requestId and creditId is present in request table
    let findMediaDetails = {};
    let seasonId = "";
    // get relationID from Request Table
    let getRelationData = {};
    if (requestId) {
      getRelationData = await model.titleRequestPrimaryDetails.findOne({
        where: {
          id: requestId,
          record_status: "active",
        },
      });
    }
    const relationId =
      getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "";

    let condition = {};
    if (draftSeasonId) {
      condition = {
        request_id: requestId,
        request_season_id: draftSeasonId,
        status: "active",
      };
      seasonId = draftSeasonId;
    } else if (seasonPkId) {
      condition = {
        request_id: requestId,
        season_id: seasonPkId,
        status: "active",
      };
      seasonId = seasonPkId;
    }
    if (Object.keys(condition).length > 0) {
      findMediaDetails = await model.titleRequestMedia.findOne({
        where: condition,
        status: "active",
      });
    }
    // Fetching the list of Media
    const foundMedia = findMediaDetails != null ? Object.keys(findMediaDetails).length : null;

    const findRequestSeasonId = await model.titleRequestSeasonDetails.findOne({
      where: {
        id: draftSeasonId,
        request_id: requestId,
        status: "active",
      },
    });

    // 1. Media from Draft table
    // 2. Media from Main table using Season Id - season req is created but not media request
    // 3. Directly to media tab - all data from main table
    if (foundMedia != null && foundMedia > 0) {
      if (mediaType === "video") {
        const videoList =
          findMediaDetails.video_details != null
            ? JSON.parse(findMediaDetails.video_details)
            : null;
        if (videoList && videoList.list.length > 0) {
          for (const videoDetails of videoList.list) {
            if (videoDetails.season === seasonId) {
              let data = {
                id: videoDetails.id ? videoDetails.id : "",
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
      } else if (mediaType === "image") {
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
                  id: imageDetails.id ? imageDetails.id : "",
                  draft_request_id: requestId,
                  draft_media_id: findMediaDetails.id,
                  image_file_name: imageDetails.file_name,
                  image_original_name: imageDetails.original_name,
                  image_path: imageDetails.path,
                  season_id: imageDetails.season_id,
                };
                imageResponseDetails.push(data);
              }
            }
          }
          if (backgroundImageList != null && backgroundImageList.list.length > 0) {
            for (const backgroundImageDetails of backgroundImageList.list) {
              if (backgroundImageDetails.season_id === seasonId) {
                let data = {
                  id: backgroundImageDetails.id ? backgroundImageDetails.id : "",
                  draft_request_id: requestId,
                  draft_media_id: findMediaDetails.id,
                  image_file_name: backgroundImageDetails.file_name,
                  image_original_name: backgroundImageDetails.original_name,
                  image_path: backgroundImageDetails.path,
                  season_id: backgroundImageDetails.season_id,
                };
                backgroundImageResponseDetails.push(data);
              }
            }
          }
        }
      } else if (mediaType === "poster") {
        const posterList =
          findMediaDetails.poster_image_details != null
            ? JSON.parse(findMediaDetails.poster_image_details)
            : null;
        if (posterList && posterList.list.length > 0) {
          for (const posterDetails of posterList.list) {
            if (posterDetails.season_id === seasonId) {
              let data = {
                id: posterDetails.id ? posterDetails.id : "",
                draft_request_id: requestId,
                draft_media_id: findMediaDetails.id,
                poster_file_name: posterDetails.file_name,
                poster_original_name: posterDetails.original_name,
                poster_path: posterDetails.path,
                season_id: posterDetails.season_id,
                is_main_poster: posterDetails.is_main_poster,
              };
              posterResponseDetails.push(data);
            }
          }
        }
      }
    } else if (findRequestSeasonId) {
      let imageIncludeQuery = [],
        videoIncludeQuery = [];
      if (findRequestSeasonId && findRequestSeasonId.season_id) {
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
          "site_language",
          "thumbnail",
          "no_of_view",
          "video_duration",
        ];

        const seasonIdCheck = findRequestSeasonId.season_id ? findRequestSeasonId.season_id : "";
        const imageCategory =
          mediaType === "poster"
            ? { image_category: "poster_image" }
            : mediaType === "image"
            ? [{ image_category: "image" }, { image_category: "bg_image" }]
            : "";

        const imageCondition = {
          title_id: titleId,
          season_id: seasonIdCheck,
          file_name: {
            [Op.ne]: null,
          },
          original_name: {
            [Op.ne]: null,
          },
          [Op.or]: imageCategory,
          status: "active",
          episode_id: null,
        };

        const videoCondition = {
          title_id: titleId,
          season: seasonIdCheck,
          status: "active",
          video_for: "title",
        };
        const searchParams = {
          distinct: false,
        };

        let imageResultData = [];
        let videoResultData = [];
        if (mediaType == "image" || mediaType == "poster") {
          imageResultData = await paginationService.pagination(
            searchParams,
            model.titleImage,
            imageIncludeQuery,
            imageCondition,
            imageAttributes,
          );
        }
        if (mediaType == "video") {
          videoResultData = await paginationService.pagination(
            searchParams,
            model.video,
            videoIncludeQuery,
            videoCondition,
            videoAttributes,
          );
        }

        if (imageResultData && imageResultData.rows && imageResultData.rows.length > 0) {
          for (const value of imageResultData.rows) {
            if (value) {
              if (value.image_category == "image") {
                const data = {
                  id: value.id ? value.id : "",
                  image_category: value.image_category ? value.image_category : "",
                  image_file_name: value.file_name ? value.file_name : "",
                  image_original_name: value.original_name ? value.original_name : "",
                  image_path: value.path ? value.path : "",
                };
                imageResponseDetails.push(data);
              }
              if (value.image_category == "bg_image") {
                const data = {
                  id: value.id ? value.id : "",
                  image_category: value.image_category ? value.image_category : "",
                  image_file_name: value.file_name ? value.file_name : "",
                  image_original_name: value.original_name ? value.original_name : "",
                  image_path: value.path ? value.path : "",
                };
                backgroundImageResponseDetails.push(data);
              }
              if (value.image_category == "poster_image") {
                const data = {
                  id: value.id ? value.id : "",
                  image_category: value.image_category ? value.image_category : "",
                  poster_file_name: value.file_name ? value.file_name : "",
                  poster_original_name: value.original_name ? value.original_name : "",
                  poster_path: value.path ? value.path : "",
                  is_main_poster: value.is_main_poster ? value.is_main_poster : "n",
                };
                posterResponseDetails.push(data);
              }
            }
          }
        }

        if (
          mediaType == "video" &&
          videoResultData &&
          videoResultData.rows &&
          videoResultData.rows.length > 0
        ) {
          for (const value of videoResultData.rows) {
            if (value) {
              const data = {
                id: value.id ? value.id : "",
                video_title: value.name ? value.name : "",
                video_url: value.url ? value.url : "",
                is_official_trailer: value.is_official_trailer ? value.is_official_trailer : "",
                video_language: value.site_language ? value.site_language : "en",
                thumbnail: value.thumbnail,
                view_count: value.no_of_view,
                video_duration: value.video_duration,
              };
              videoResponseDetails.push(data);
            }
          }
        }
      }
    } else if (titleId) {
      // if there is no request id is present - fetch the media details related to title ID for the first time
      let imageIncludeQuery = [],
        videoIncludeQuery = [];

      if (seasonPkId) {
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
          "site_language",
          "thumbnail",
          "no_of_view",
          "video_duration",
        ];

        const seasonIdCheck = seasonPkId ? seasonPkId : "";
        const imageCategory =
          mediaType === "poster"
            ? { image_category: "poster_image" }
            : mediaType === "image"
            ? [{ image_category: "image" }, { image_category: "bg_image" }]
            : "";

        const imageCondition = {
          title_id: titleId,
          season_id: seasonIdCheck,
          file_name: {
            [Op.ne]: null,
          },
          original_name: {
            [Op.ne]: null,
          },
          [Op.or]: imageCategory,
          status: "active",
          episode_id: null,
        };

        const videoCondition = {
          title_id: titleId,
          season: seasonIdCheck,
          status: "active",
          video_for: "title",
        };
        const searchParams = {
          distinct: true,
          raw: false,
        };

        let imageResultData = [];
        let videoResultData = [];
        if (mediaType == "image" || mediaType == "poster") {
          imageResultData = await paginationService.pagination(
            searchParams,
            model.titleImage,
            imageIncludeQuery,
            imageCondition,
            imageAttributes,
          );
        }
        if (mediaType == "video") {
          videoResultData = await paginationService.pagination(
            searchParams,
            model.video,
            videoIncludeQuery,
            videoCondition,
            videoAttributes,
          );
        }

        if (imageResultData && imageResultData.rows && imageResultData.rows.length > 0) {
          for (const value of imageResultData.rows) {
            if (value) {
              if (value.image_category == "image") {
                const data = {
                  id: value.id ? value.id : "",
                  image_category: value.image_category ? value.image_category : "",
                  image_file_name: value.file_name ? value.file_name : "",
                  image_original_name: value.original_name ? value.original_name : "",
                  image_path: value.path ? value.path : "",
                };
                imageResponseDetails.push(data);
              }
              if (value.image_category == "bg_image") {
                const data = {
                  id: value.id ? value.id : "",
                  image_category: value.image_category ? value.image_category : "",
                  image_file_name: value.file_name ? value.file_name : "",
                  image_original_name: value.original_name ? value.original_name : "",
                  image_path: value.path ? value.path : "",
                };
                backgroundImageResponseDetails.push(data);
              }
              if (value.image_category == "poster_image") {
                const data = {
                  id: value.id ? value.id : "",
                  poster_file_name: value.file_name ? value.file_name : "",
                  poster_original_name: value.original_name ? value.original_name : "",
                  poster_path: value.path ? value.path : "",
                  is_main_poster: value.is_main_poster ? value.is_main_poster : "n",
                };
                posterResponseDetails.push(data);
              }
            }
          }
        }

        if (
          mediaType == "video" &&
          videoResultData &&
          videoResultData.rows &&
          videoResultData.rows.length > 0
        ) {
          for (const value of videoResultData.rows) {
            if (value) {
              const data = {
                id: value.id ? value.id : "",
                video_title: value.name ? value.name : "",
                video_url: value.url ? value.url : "",
                is_official_trailer: value.is_official_trailer ? value.is_official_trailer : "",
                video_language: value.site_language ? value.site_language : "en",
                thumbnail: value.thumbnail,
                view_count: value.no_of_view,
                video_duration: value.video_duration,
              };
              videoResponseDetails.push(data);
            }
          }
        }
      }
    }

    res.ok({
      draft_relation_id: relationId,
      draft_request_id: requestId,
      draft_season_id: draftSeasonId,
      season_id: seasonPkId,
      draft_media_id: findMediaDetails && findMediaDetails.id,
      video_details: videoResponseDetails,
      image_details: imageResponseDetails,
      bg_image_details: backgroundImageResponseDetails,
      poster_details: posterResponseDetails,
    });
  } catch (error) {
    next(error);
  }
};
