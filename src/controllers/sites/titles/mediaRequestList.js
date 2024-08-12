import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { tmdbService, youtubeService, vimeoService } from "../../../services/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * mediaRequestList
 * @param req
 * @param res
 */
export const mediaRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language;
    const titleType = req.body.title_type;
    const seasonId = titleType == "tv" ? req.body.season_id : null;
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
    // Getting TMDB ID from Request Details
    const tmdbId = findRequestId.tmdb_id ? findRequestId.tmdb_id : "";

    // find requestId and creditId is present in request table
    let findMediaDetails = {};
    if (titleType === "movie") {
      findMediaDetails = await model.titleRequestMedia.findOne({
        where: {
          request_id: requestId,
          status: "active",
        },
      });
    }

    if (titleType === "tv") {
      findMediaDetails = await model.titleRequestMedia.findOne({
        where: {
          request_season_id: seasonId,
          request_id: requestId,
          status: "active",
        },
      });
    }
    // const mediaLength = Object.keys(findMediaDetails).length;
    // Fetching the list of Media
    if (findMediaDetails) {
      // media type video and and title_type movie
      if (mediaType === "video" && titleType === "movie") {
        // video list
        let videoResponseDetails = [];
        const videoList =
          findMediaDetails.video_details != null
            ? JSON.parse(findMediaDetails.video_details)
            : null;
        if (videoList && videoList.list.length > 0) {
          for (const videoDetails of videoList.list) {
            let data = {
              draft_request_id: requestId,
              draft_media_id: findMediaDetails.id,
              video_title: videoDetails.name,
              video_url: videoDetails.url,
              is_official_trailer: videoDetails.is_official_trailer,
              video_language: videoDetails.site_language,
              thumbnail: videoDetails.thumbnail,
              view_count: videoDetails.no_of_view,
              video_duration: videoDetails.video_duration,
            };
            videoResponseDetails.push(data);
          }
        }
        res.ok({ video_details: videoResponseDetails });
      } else if (mediaType === "video" && titleType === "tv") {
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
      } else if (mediaType === "image" && titleType === "movie") {
        // image list
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
              let data = {
                draft_request_id: requestId,
                draft_media_id: findMediaDetails.id,
                image_file_name: imageDetails.file_name,
                image_original_name: imageDetails.original_name,
                image_path: imageDetails.path,
                size: imageDetails.file_size ? imageDetails.file_size : "",
                file_extension: imageDetails.file_extension ? imageDetails.file_extension : "",
                mime_type: imageDetails.mime_type ? imageDetails.mime_type : "",
              };
              imageResponseDetails.push(data);
            }
          }
          if (backgroundImageList != null && backgroundImageList.list.length > 0) {
            for (const backgroundImageDetails of backgroundImageList.list) {
              let data = {
                draft_request_id: requestId,
                draft_media_id: findMediaDetails.id,
                image_file_name: backgroundImageDetails.file_name,
                image_original_name: backgroundImageDetails.original_name,
                image_path: backgroundImageDetails.path,
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
        res.ok({
          image_details: imageResponseDetails,
          bg_image_details: backgroundImageResponseDetails,
        });
      } else if (mediaType === "image" && titleType === "tv") {
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
      } else if (mediaType === "poster" && titleType === "movie") {
        //poster list
        let posterResponseDetails = [];
        const posterList =
          findMediaDetails.poster_image_details != null
            ? JSON.parse(findMediaDetails.poster_image_details)
            : null;
        if (posterList && posterList.list.length > 0) {
          for (const posterDetails of posterList.list) {
            let data = {
              draft_request_id: requestId,
              draft_media_id: findMediaDetails.id,
              poster_file_name: posterDetails.file_name,
              poster_original_name: posterDetails.original_name,
              poster_path: posterDetails.path,
              is_main_poster: posterDetails.is_main_poster,
              size: posterDetails.file_size ? posterDetails.file_size : "",
              file_extension: posterDetails.file_extension ? posterDetails.file_extension : "",
              mime_type: posterDetails.mime_type ? posterDetails.mime_type : "",
            };
            posterResponseDetails.push(data);
          }
        }
        res.ok({ poster_details: posterResponseDetails });
      } else if (mediaType === "poster" && titleType === "tv") {
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
    } else if (tmdbId) {
      // image list
      let imageResponseDetails = [];
      let backgroundImageResponseDetails = [];
      let posterResponseDetails = [];
      let videoResponseDetails = [];

      if (titleType === "tv" && seasonId) {
        // Fetch all the data from season table with respect to request ID
        const findAllSeasonRequest = await model.titleRequestSeasonDetails.findOne({
          where: {
            request_id: requestId,
            status: "active",
            id: seasonId,
          },
        });
        if (!findAllSeasonRequest) throw StatusError.badRequest(res.__("Invalid season ID "));

        const parsedSeasonDetails =
          findAllSeasonRequest &&
          findAllSeasonRequest.dataValues &&
          findAllSeasonRequest.dataValues.season_details
            ? JSON.parse(findAllSeasonRequest.dataValues.season_details)
            : "";
        const seasonRequestNumber =
          parsedSeasonDetails && parsedSeasonDetails.number
            ? parsedSeasonDetails.number
            : parsedSeasonDetails.number == 0
            ? 0
            : null;
        const mediaTypeChange = mediaType === "image" ? "bg_image" : "poster";
        if (seasonRequestNumber != null) {
          const [tmdbImageData, tmdbEnVideoData, tmdbKoVideoData, titleImage] = await Promise.all([
            tmdbService.fetchTvSeasonImages(tmdbId, seasonRequestNumber, mediaTypeChange, null),
            tmdbService.fetchTvSeasonVideos(tmdbId, seasonRequestNumber, "en"),
            tmdbService.fetchTvSeasonVideos(tmdbId, seasonRequestNumber, "ko"),
            tmdbService.fetchFormatTitleImages("tv", tmdbId, mediaTypeChange, null),
          ]);

          if (mediaType === "image" && titleImage && titleImage.results) {
            if (titleImage.results.bg_image && titleImage.results.bg_image.length > 0) {
              let bgData = {
                draft_request_id: requestId,
                draft_media_id: "",
                season_id: seasonId,
                image_file_name: titleImage.results.bg_image[0].filename,
                image_original_name: titleImage.results.bg_image[0].originalname,
                image_path: titleImage.results.bg_image[0].path,
                size: titleImage.results.bg_image[0].size
                  ? titleImage.results.bg_image[0].size
                  : "",
                file_extension: titleImage.results.bg_image[0].file_extension
                  ? titleImage.results.bg_image[0].file_extension
                  : "",
                mime_type: titleImage.results.bg_image[0].mime_type
                  ? titleImage.results.bg_image[0].mime_type
                  : "",
              };
              backgroundImageResponseDetails.push(bgData);
              for (const value of titleImage.results.bg_image) {
                let data = {
                  draft_request_id: requestId,
                  draft_media_id: "",
                  season_id: seasonId,
                  image_file_name: value.filename,
                  image_original_name: value.originalname,
                  image_path: value.path,
                  size: value.size ? value.size : "",
                  file_extension: value.file_extension ? value.file_extension : "",
                  mime_type: value.mime_type ? value.mime_type : "",
                };
                imageResponseDetails.push(data);
              }
            }

            res.ok({
              image_details: imageResponseDetails,
              bg_image_details: backgroundImageResponseDetails,
            });
          }
          if (mediaType === "poster" && tmdbImageData && tmdbImageData.results) {
            if (tmdbImageData.results.poster && tmdbImageData.results.poster.length > 0) {
              let posterData = {
                draft_request_id: requestId,
                draft_media_id: "",
                season_id: seasonId,
                poster_file_name: tmdbImageData.results.poster[0].filename,
                poster_original_name: tmdbImageData.results.poster[0].originalname,
                poster_path: tmdbImageData.results.poster[0].path,
                is_main_poster: "y",
                size: tmdbImageData.results.poster[0].size
                  ? tmdbImageData.results.poster[0].size
                  : "",
                file_extension: tmdbImageData.results.poster[0].file_extension
                  ? tmdbImageData.results.poster[0].file_extension
                  : "",
                mime_type: tmdbImageData.results.poster[0].mime_type
                  ? tmdbImageData.results.poster[0].mime_type
                  : "",
              };
              posterResponseDetails.push(posterData);
              for (const value of tmdbImageData.results.poster) {
                if (value.originalname != posterData.poster_original_name) {
                  let data = {
                    draft_request_id: requestId,
                    draft_media_id: "",
                    season_id: seasonId,
                    poster_file_name: value.filename,
                    poster_original_name: value.originalname,
                    poster_path: value.path,
                    is_main_poster: "n",
                    size: value.size ? value.size : "",
                    file_extension: value.file_extension ? value.file_extension : "",
                    mime_type: value.mime_type ? value.mime_type : "",
                  };
                  posterResponseDetails.push(data);
                }
              }
            }
            res.ok({ poster_details: posterResponseDetails });
          }
          if (mediaType === "video") {
            if (tmdbEnVideoData && tmdbEnVideoData.results) {
              if (tmdbEnVideoData.results.length > 0) {
                for (const videoDetails of tmdbEnVideoData.results) {
                  let data = {
                    draft_request_id: requestId,
                    draft_media_id: "",
                    video_title: videoDetails.video_title,
                    video_url: videoDetails.video_url,
                    is_official_trailer: videoDetails.is_official_trailer,
                    video_language: "en",
                    thumbnail: null,
                    view_count: 0,
                    video_duration: null,
                  };
                  // Check the domain :
                  const videoSource = videoDetails.video_url
                    ? await generalHelper.checkUrlSource(videoDetails.video_url)
                    : null;
                  if (videoSource && videoSource == "youtube") {
                    const getYouTubeVideoDetails = await youtubeService.getFormatedYoutubeDetails(
                      videoDetails.video_url,
                    );
                    if (getYouTubeVideoDetails) {
                      data.view_count = getYouTubeVideoDetails.view_count
                        ? getYouTubeVideoDetails.view_count
                        : 0;
                      data.thumbnail = getYouTubeVideoDetails.video_thumb
                        ? getYouTubeVideoDetails.video_thumb
                        : null;
                      data.video_duration = getYouTubeVideoDetails.video_duration
                        ? getYouTubeVideoDetails.video_duration
                        : null;
                    }
                  }
                  if (videoSource && videoSource == "vimeo") {
                    const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(
                      videoDetails.video_url,
                    );
                    if (geVimeoVideoDetails) {
                      data.view_count = geVimeoVideoDetails.stats_number_of_plays
                        ? geVimeoVideoDetails.stats_number_of_plays
                        : 0;
                      data.thumbnail = geVimeoVideoDetails.thumbnail_large
                        ? geVimeoVideoDetails.thumbnail_large
                        : null;
                      data.video_duration = geVimeoVideoDetails.duration
                        ? geVimeoVideoDetails.duration
                        : null;
                    }
                  }
                  videoResponseDetails.push(data);
                }
              }
            }
            if (tmdbKoVideoData && tmdbKoVideoData.results) {
              if (tmdbKoVideoData.results.length > 0) {
                for (const videoDetails of tmdbKoVideoData.results) {
                  let data = {
                    draft_request_id: requestId,
                    draft_media_id: "",
                    video_title: videoDetails.video_title,
                    video_url: videoDetails.video_url,
                    is_official_trailer: videoDetails.is_official_trailer,
                    video_language: "ko",
                    thumbnail: null,
                    view_count: 0,
                    video_duration: null,
                  };
                  // Check the domain :
                  const videoSource = videoDetails.video_url
                    ? await generalHelper.checkUrlSource(videoDetails.video_url)
                    : null;
                  if (videoSource && videoSource == "youtube") {
                    const getYouTubeVideoDetails = await youtubeService.getFormatedYoutubeDetails(
                      videoDetails.video_url,
                    );
                    if (getYouTubeVideoDetails) {
                      data.view_count = getYouTubeVideoDetails.view_count
                        ? getYouTubeVideoDetails.view_count
                        : 0;
                      data.thumbnail = getYouTubeVideoDetails.video_thumb
                        ? getYouTubeVideoDetails.video_thumb
                        : null;
                      data.video_duration = getYouTubeVideoDetails.video_duration
                        ? getYouTubeVideoDetails.video_duration
                        : null;
                    }
                  }
                  if (videoSource && videoSource == "vimeo") {
                    const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(
                      videoDetails.video_url,
                    );
                    if (geVimeoVideoDetails) {
                      data.view_count = geVimeoVideoDetails.stats_number_of_plays
                        ? geVimeoVideoDetails.stats_number_of_plays
                        : 0;
                      data.thumbnail = geVimeoVideoDetails.thumbnail_large
                        ? geVimeoVideoDetails.thumbnail_large
                        : null;
                      data.video_duration = geVimeoVideoDetails.duration
                        ? geVimeoVideoDetails.duration
                        : null;
                    }
                  }
                  videoResponseDetails.push(data);
                }
              }
            }
            res.ok({ video_details: videoResponseDetails });
          }
        }
      } else if (titleType === "movie") {
        const mediaTypeChange = mediaType === "image" ? "bg_image" : "poster";
        const [tmdbImageData, tmdbEnVideoData, tmdbKoVideoData] = await Promise.all([
          tmdbService.fetchMovieImages(tmdbId, mediaTypeChange, null),
          tmdbService.fetchMovieVideos(tmdbId, "en"),
          tmdbService.fetchMovieVideos(tmdbId, "ko"),
        ]);
        if (mediaType === "image" && tmdbImageData && tmdbImageData.results) {
          if (tmdbImageData.results.bg_image && tmdbImageData.results.bg_image.length > 0) {
            //1. NOTE : We have only backdrops from tmdb
            let data = {
              draft_request_id: requestId,
              draft_media_id: "",
              image_file_name: tmdbImageData.results.bg_image[0].filename,
              image_original_name: tmdbImageData.results.bg_image[0].originalname,
              image_path: tmdbImageData.results.bg_image[0].path,
              size: tmdbImageData.results.bg_image[0].size
                ? tmdbImageData.results.bg_image[0].size
                : "",
              file_extension: tmdbImageData.results.bg_image[0].file_extension
                ? tmdbImageData.results.bg_image[0].file_extension
                : "",
              mime_type: tmdbImageData.results.bg_image[0].mime_type
                ? tmdbImageData.results.bg_image[0].mime_type
                : "",
            };
            backgroundImageResponseDetails.push(data);
            // storing all the backdrops as images
            for (const value of tmdbImageData.results.bg_image) {
              let data = {
                draft_request_id: requestId,
                draft_media_id: "",
                image_file_name: value.filename,
                image_original_name: value.originalname,
                image_path: value.path,
                size: value.size ? value.size : "",
                file_extension: value.file_extension ? value.file_extension : "",
                mime_type: value.mime_type ? value.mime_type : "",
              };
              imageResponseDetails.push(data);
            }
          }
          res.ok({
            image_details: imageResponseDetails,
            bg_image_details: backgroundImageResponseDetails,
          });
        }
        if (mediaType === "poster" && tmdbImageData && tmdbImageData.results) {
          if (tmdbImageData.results.poster && tmdbImageData.results.poster.length > 0) {
            let posterData = {
              draft_request_id: requestId,
              draft_media_id: "",
              poster_file_name: tmdbImageData.results.poster[0].filename,
              poster_original_name: tmdbImageData.results.poster[0].originalname,
              poster_path: tmdbImageData.results.poster[0].path,
              is_main_poster: "y",
              size: tmdbImageData.results.poster[0].size
                ? tmdbImageData.results.poster[0].size
                : "",
              file_extension: tmdbImageData.results.poster[0].file_extension
                ? tmdbImageData.results.poster[0].file_extension
                : "",
              mime_type: tmdbImageData.results.poster[0].mime_type
                ? tmdbImageData.results.poster[0].mime_type
                : "",
            };
            posterResponseDetails.push(posterData);
            for (const value of tmdbImageData.results.poster) {
              if (value.originalname != posterData.poster_original_name) {
                let data = {
                  draft_request_id: requestId,
                  draft_media_id: "",
                  poster_file_name: value.filename,
                  poster_original_name: value.originalname,
                  poster_path: value.path,
                  is_main_poster: "n",
                  size: value.size ? value.size : "",
                  file_extension: value.file_extension ? value.file_extension : "",
                  mime_type: value.mime_type ? value.mime_type : "",
                };
                posterResponseDetails.push(data);
              }
            }
          }
          res.ok({ poster_details: posterResponseDetails });
        }
        if (mediaType === "video") {
          if (tmdbEnVideoData && tmdbEnVideoData.results) {
            if (tmdbEnVideoData.results.length > 0) {
              for (const videoDetails of tmdbEnVideoData.results) {
                let data = {
                  draft_request_id: requestId,
                  draft_media_id: "",
                  video_title: videoDetails.video_title,
                  video_url: videoDetails.video_url,
                  is_official_trailer: videoDetails.is_official_trailer,
                  video_language: "en",
                  thumbnail: null,
                  view_count: 0,
                  video_duration: null,
                };
                // Check the domain :
                const videoSource = videoDetails.video_url
                  ? await generalHelper.checkUrlSource(videoDetails.video_url)
                  : null;
                if (videoSource && videoSource == "youtube") {
                  const getYouTubeVideoDetails = await youtubeService.getFormatedYoutubeDetails(
                    videoDetails.video_url,
                  );
                  if (getYouTubeVideoDetails) {
                    data.view_count = getYouTubeVideoDetails.view_count
                      ? getYouTubeVideoDetails.view_count
                      : 0;
                    data.thumbnail = getYouTubeVideoDetails.video_thumb
                      ? getYouTubeVideoDetails.video_thumb
                      : null;
                    data.video_duration = getYouTubeVideoDetails.video_duration
                      ? getYouTubeVideoDetails.video_duration
                      : null;
                  }
                }
                if (videoSource && videoSource == "vimeo") {
                  const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(
                    videoDetails.video_url,
                  );
                  if (geVimeoVideoDetails) {
                    data.view_count = geVimeoVideoDetails.stats_number_of_plays
                      ? geVimeoVideoDetails.stats_number_of_plays
                      : 0;
                    data.thumbnail = geVimeoVideoDetails.thumbnail_large
                      ? geVimeoVideoDetails.thumbnail_large
                      : null;
                    data.video_duration = geVimeoVideoDetails.duration
                      ? geVimeoVideoDetails.duration
                      : null;
                  }
                }
                videoResponseDetails.push(data);
              }
            }
          }
          if (tmdbKoVideoData && tmdbKoVideoData.results) {
            if (tmdbKoVideoData.results.length > 0) {
              for (const videoDetails of tmdbKoVideoData.results) {
                let data = {
                  draft_request_id: requestId,
                  draft_media_id: "",
                  video_title: videoDetails.video_title,
                  video_url: videoDetails.video_url,
                  is_official_trailer: videoDetails.is_official_trailer,
                  video_language: "ko",
                  thumbnail: null,
                  view_count: 0,
                  video_duration: null,
                };
                // Check the domain :
                const videoSource = videoDetails.video_url
                  ? await generalHelper.checkUrlSource(videoDetails.video_url)
                  : null;
                if (videoSource && videoSource == "youtube") {
                  const getYouTubeVideoDetails = await youtubeService.getFormatedYoutubeDetails(
                    videoDetails.video_url,
                  );
                  if (getYouTubeVideoDetails) {
                    data.view_count = getYouTubeVideoDetails.view_count
                      ? getYouTubeVideoDetails.view_count
                      : 0;
                    data.thumbnail = getYouTubeVideoDetails.video_thumb
                      ? getYouTubeVideoDetails.video_thumb
                      : null;
                    data.video_duration = getYouTubeVideoDetails.video_duration
                      ? getYouTubeVideoDetails.video_duration
                      : null;
                  }
                }
                if (videoSource && videoSource == "vimeo") {
                  const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(
                    videoDetails.video_url,
                  );
                  if (geVimeoVideoDetails) {
                    data.view_count = geVimeoVideoDetails.stats_number_of_plays
                      ? geVimeoVideoDetails.stats_number_of_plays
                      : 0;
                    data.thumbnail = geVimeoVideoDetails.thumbnail_large
                      ? geVimeoVideoDetails.thumbnail_large
                      : null;
                    data.video_duration = geVimeoVideoDetails.duration
                      ? geVimeoVideoDetails.duration
                      : null;
                  }
                }
                videoResponseDetails.push(data);
              }
            }
          }
          res.ok({ video_details: videoResponseDetails });
        }
      }
    } else {
      res.ok({ result: [] });
    }
  } catch (error) {
    next(error);
  }
};
