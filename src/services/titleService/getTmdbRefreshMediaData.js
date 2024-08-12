import model from "../../models/index.js";
import { tmdbService, youtubeService, vimeoService } from "../../services/index.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * getTmdbRefreshMediaData
 * @param tmdbId
 * @param mediaType // video,image,poster
 * @param titleId
 * @param titleType
 * @param siteLanguage
 * @param seasonNumber // needed for the tv media details
 * @param seasonId // For the tv media details
 */
export const getTmdbRefreshMediaData = async (
  tmdbId,
  mediaType,
  titleId,
  titleType,
  language = "en",
  seasonNumber = null,
  seasonId = null,
) => {
  try {
    // image list
    let imageResponseDetails = [];
    let backgroundImageResponseDetails = [];
    let posterResponseDetails = [];
    let videoResponseDetails = [];

    if (titleType === "movie") {
      const mediaTypeChange = mediaType === "image" ? "bg_image" : "poster";
      const [tmdbImageData, tmdbEnVideoData, tmdbKoVideoData] = await Promise.all([
        tmdbService.fetchMovieImages(tmdbId, mediaTypeChange, null),
        tmdbService.fetchMovieVideos(tmdbId, "en"),
        tmdbService.fetchMovieVideos(tmdbId, "ko"),
      ]);
      if (mediaType === "image" && tmdbImageData && tmdbImageData.results) {
        if (tmdbImageData.results.bg_image && tmdbImageData.results.bg_image.length > 0) {
          //1. NOTE : We have only backdrops from tmdb
          let bgData = {
            image_category: "bg_image",
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
          const bgId = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              image_category: "bg_image",
              path: tmdbImageData.results.bg_image[0].path,
              original_name: tmdbImageData.results.bg_image[0].originalname,
              status: "active",
            },
          });
          bgData.id = bgId && bgId.id ? bgId.id : "";
          backgroundImageResponseDetails.push(bgData);
          // storing all the backdrops as images
          for (const value of tmdbImageData.results.bg_image) {
            let data = {
              image_category: "image",
              image_file_name: value.filename,
              image_original_name: value.originalname,
              image_path: value.path,
              size: value.size ? value.size : "",
              file_extension: value.file_extension ? value.file_extension : "",
              mime_type: value.mime_type ? value.mime_type : "",
            };

            const imageId = await model.titleImage.findOne({
              attributes: ["id"],
              where: {
                title_id: titleId,
                image_category: "image",
                path: value.path,
                original_name: value.originalname,
                status: "active",
              },
            });
            data.id = imageId && imageId.id ? imageId.id : "";
            imageResponseDetails.push(data);
          }
        }
      }
      if (mediaType === "poster" && tmdbImageData && tmdbImageData.results) {
        if (tmdbImageData.results.poster && tmdbImageData.results.poster.length > 0) {
          let posterData = {
            image_category: "poster_image",
            poster_file_name: tmdbImageData.results.poster[0].filename,
            poster_original_name: tmdbImageData.results.poster[0].originalname,
            poster_path: tmdbImageData.results.poster[0].path,
            is_main_poster: "y",
            size: tmdbImageData.results.poster[0].size ? tmdbImageData.results.poster[0].size : "",
            file_extension: tmdbImageData.results.poster[0].file_extension
              ? tmdbImageData.results.poster[0].file_extension
              : "",
            mime_type: tmdbImageData.results.poster[0].mime_type
              ? tmdbImageData.results.poster[0].mime_type
              : "",
          };
          const mainPosterId = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              image_category: "poster_image",
              path: tmdbImageData.results.poster[0].path,
              original_name: tmdbImageData.results.poster[0].originalname,
              status: "active",
            },
          });
          posterData.id = mainPosterId && mainPosterId.id ? mainPosterId.id : "";
          posterResponseDetails.push(posterData);
          // remove the first element of an array
          for (const value of tmdbImageData.results.poster) {
            if (value.originalname != posterData.poster_original_name) {
              let data = {
                image_category: "poster_image",
                poster_file_name: value.filename,
                poster_original_name: value.originalname,
                poster_path: value.path,
                is_main_poster: "n",
                // is_main_poster: value.is_main_poster ? value.is_main_poster : "n",
                size: value.size ? value.size : "",
                file_extension: value.file_extension ? value.file_extension : "",
                mime_type: value.mime_type ? value.mime_type : "",
              };
              const posterId = await model.titleImage.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  image_category: "poster_image",
                  path: value.path,
                  original_name: value.originalname,
                  status: "active",
                },
              });
              data.id = posterId && posterId.id ? posterId.id : "";
              posterResponseDetails.push(data);
            }
          }
        }
      }
      if (mediaType === "video") {
        if (tmdbEnVideoData && tmdbEnVideoData.results) {
          if (tmdbEnVideoData.results.length > 0) {
            for (const videoDetails of tmdbEnVideoData.results) {
              let data = {
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
              const videoId = await model.video.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  url: videoDetails.video_url,
                  status: "active",
                  video_for: "title",
                },
              });
              data.id = videoId && videoId.id ? videoId.id : "";
              videoResponseDetails.push(data);
            }
          }
        }
        if (tmdbKoVideoData && tmdbKoVideoData.results) {
          if (tmdbKoVideoData.results.length > 0) {
            for (const videoDetails of tmdbKoVideoData.results) {
              let koData = {
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
                  koData.view_count = getYouTubeVideoDetails.view_count
                    ? getYouTubeVideoDetails.view_count
                    : 0;
                  koData.thumbnail = getYouTubeVideoDetails.video_thumb
                    ? getYouTubeVideoDetails.video_thumb
                    : null;
                  koData.video_duration = getYouTubeVideoDetails.video_duration
                    ? getYouTubeVideoDetails.video_duration
                    : null;
                }
              }
              if (videoSource && videoSource == "vimeo") {
                const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(
                  videoDetails.video_url,
                );
                if (geVimeoVideoDetails) {
                  koData.view_count = geVimeoVideoDetails.stats_number_of_plays
                    ? geVimeoVideoDetails.stats_number_of_plays
                    : 0;
                  koData.thumbnail = geVimeoVideoDetails.thumbnail_large
                    ? geVimeoVideoDetails.thumbnail_large
                    : null;
                  koData.video_duration = geVimeoVideoDetails.duration
                    ? geVimeoVideoDetails.duration
                    : null;
                }
              }
              const videoId = await model.video.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  url: videoDetails.video_url,
                  status: "active",
                  video_for: "title",
                },
              });
              koData.id = videoId && videoId.id ? videoId.id : "";
              videoResponseDetails.push(koData);
            }
          }
        }
      }
    }

    // For TV related videos
    if (titleType === "tv" && seasonNumber) {
      const mediaTypeChange = mediaType === "image" ? "bg_image" : "poster";
      const [tmdbImageData, tmdbEnVideoData, tmdbKoVideoData, titleImage] = await Promise.all([
        tmdbService.fetchTvSeasonImages(tmdbId, seasonNumber, mediaTypeChange, null),
        tmdbService.fetchTvSeasonVideos(tmdbId, seasonNumber, "en"),
        tmdbService.fetchTvSeasonVideos(tmdbId, seasonNumber, "ko"),
        tmdbService.fetchFormatTitleImages("tv", tmdbId, mediaTypeChange, null),
      ]);
      if (mediaType === "image" && titleImage && titleImage.results) {
        if (titleImage.results.bg_image && titleImage.results.bg_image.length > 0) {
          let bgData = {
            image_category: "bg_image",
            image_file_name: titleImage.results.bg_image[0].filename,
            image_original_name: titleImage.results.bg_image[0].originalname,
            image_path: titleImage.results.bg_image[0].path,
            size: titleImage.results.bg_image[0].size ? titleImage.results.bg_image[0].size : "",
            file_extension: titleImage.results.bg_image[0].file_extension
              ? titleImage.results.bg_image[0].file_extension
              : "",
            mime_type: titleImage.results.bg_image[0].mime_type
              ? titleImage.results.bg_image[0].mime_type
              : "",
          };
          const bgId = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              season_id: seasonId,
              image_category: "bg_image",
              path: titleImage.results.bg_image[0].path,
              original_name: titleImage.results.bg_image[0].originalname,
              status: "active",
            },
          });
          bgData.id = bgId && bgId.id ? bgId.id : "";
          backgroundImageResponseDetails.push(bgData);

          // storing all the backdrops as images
          for (const value of titleImage.results.bg_image) {
            let data = {
              image_category: "image",
              image_file_name: value.filename,
              image_original_name: value.originalname,
              image_path: value.path,
              size: value.size ? value.size : "",
              file_extension: value.file_extension ? value.file_extension : "",
              mime_type: value.mime_type ? value.mime_type : "",
            };
            const imageId = await model.titleImage.findOne({
              attributes: ["id"],
              where: {
                title_id: titleId,
                season_id: seasonId,
                image_category: "image",
                path: value.path,
                original_name: value.originalname,
                status: "active",
              },
            });
            data.id = imageId && imageId.id ? imageId.id : "";
            imageResponseDetails.push(data);
          }
        }
      }
      if (mediaType === "poster" && tmdbImageData && tmdbImageData.results) {
        if (tmdbImageData.results.poster && tmdbImageData.results.poster.length > 0) {
          let posterData = {
            image_category: "poster_image",
            poster_file_name: tmdbImageData.results.poster[0].filename,
            poster_original_name: tmdbImageData.results.poster[0].originalname,
            poster_path: tmdbImageData.results.poster[0].path,
            is_main_poster: "y",
            size: tmdbImageData.results.poster[0].size ? tmdbImageData.results.poster[0].size : "",
            file_extension: tmdbImageData.results.poster[0].file_extension
              ? tmdbImageData.results.poster[0].file_extension
              : "",
            mime_type: tmdbImageData.results.poster[0].mime_type
              ? tmdbImageData.results.poster[0].mime_type
              : "",
          };
          const mainPosterId = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              title_id: titleId,
              season_id: seasonId,
              image_category: "poster_image",
              path: tmdbImageData.results.poster[0].path,
              original_name: tmdbImageData.results.poster[0].originalname,
              status: "active",
            },
          });
          posterData.id = mainPosterId && mainPosterId.id ? mainPosterId.id : "";
          posterResponseDetails.push(posterData);

          for (const value of tmdbImageData.results.poster) {
            if (value.originalname != posterData.poster_original_name) {
              let data = {
                image_category: "poster_image",
                poster_file_name: value.filename,
                poster_original_name: value.originalname,
                poster_path: value.path,
                is_main_poster: "n",
                size: value.size ? value.size : "",
                file_extension: value.file_extension ? value.file_extension : "",
                mime_type: value.mime_type ? value.mime_type : "",
              };
              const posterId = await model.titleImage.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  season_id: seasonId,
                  image_category: "poster_image",
                  path: value.path,
                  original_name: value.originalname,
                  status: "active",
                },
              });
              data.id = posterId && posterId.id ? posterId.id : "";
              posterResponseDetails.push(data);
            }
          }
        }
      }
      if (mediaType === "video") {
        if (tmdbEnVideoData && tmdbEnVideoData.results) {
          if (tmdbEnVideoData.results.length > 0) {
            for (const videoDetails of tmdbEnVideoData.results) {
              let data = {
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
              const videoId = await model.video.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  url: videoDetails.video_url,
                  season: seasonId,
                  status: "active",
                  video_for: "title",
                },
              });
              data.id = videoId && videoId.id ? videoId.id : "";
              videoResponseDetails.push(data);
            }
          }
        }
        if (tmdbKoVideoData && tmdbKoVideoData.results) {
          if (tmdbKoVideoData.results.length > 0) {
            for (const videoDetails of tmdbKoVideoData.results) {
              let koData = {
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
                  koData.view_count = getYouTubeVideoDetails.view_count
                    ? getYouTubeVideoDetails.view_count
                    : 0;
                  koData.thumbnail = getYouTubeVideoDetails.video_thumb
                    ? getYouTubeVideoDetails.video_thumb
                    : null;
                  koData.video_duration = getYouTubeVideoDetails.video_duration
                    ? getYouTubeVideoDetails.video_duration
                    : null;
                }
              }
              if (videoSource && videoSource == "vimeo") {
                const geVimeoVideoDetails = await vimeoService.fetchVimeoDetails(
                  videoDetails.video_url,
                );
                if (geVimeoVideoDetails) {
                  koData.view_count = geVimeoVideoDetails.stats_number_of_plays
                    ? geVimeoVideoDetails.stats_number_of_plays
                    : 0;
                  koData.thumbnail = geVimeoVideoDetails.thumbnail_large
                    ? geVimeoVideoDetails.thumbnail_large
                    : null;
                  koData.video_duration = geVimeoVideoDetails.duration
                    ? geVimeoVideoDetails.duration
                    : null;
                }
              }
              const videoId = await model.video.findOne({
                attributes: ["id"],
                where: {
                  title_id: titleId,
                  url: videoDetails.video_url,
                  season: seasonId,
                  status: "active",
                  video_for: "title",
                },
              });
              koData.id = videoId && videoId.id ? videoId.id : "";
              videoResponseDetails.push(koData);
            }
          }
        }
      }
    }

    return {
      video_details: videoResponseDetails,
      image_details: imageResponseDetails,
      bg_image_details: backgroundImageResponseDetails,
      poster_details: posterResponseDetails,
    };
  } catch (error) {
    console.log(error);
    return {};
  }
};
