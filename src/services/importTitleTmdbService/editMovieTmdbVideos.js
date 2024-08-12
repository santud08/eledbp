import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { YOUTUBE_URL, VIMEO_URL } from "../../utils/constants.js";
import { titleService, schedulerJobService } from "../../services/index.js";

export const editMovieTmdbVideos = async (data, titleId, createdBy, siteLanguage = "en") => {
  try {
    if (data && data != null && data.length > 0) {
      let actionDate = "";
      let recordId = "";
      let payloadList = [];
      for (const tmdbVideo of data) {
        let videoName = "";
        let videoUrl = "";
        let isOffTrailer = "";
        let videoSource = "";
        if (tmdbVideo.site === "YouTube") {
          videoSource = "youtube";
          videoName = tmdbVideo.name ? tmdbVideo.name : "";
          isOffTrailer =
            tmdbVideo.official === true ? "y" : tmdbVideo.official === false ? "n" : null;
          videoUrl = tmdbVideo.key ? YOUTUBE_URL.concat(tmdbVideo.key) : "";
        }
        if (tmdbVideo.site === "Vimeo") {
          videoSource = "vimeo";
          videoName = tmdbVideo.name ? tmdbVideo.name : "";
          isOffTrailer =
            tmdbVideo.official === true ? "y" : tmdbVideo.official === false ? "n" : null;
          videoUrl = tmdbVideo.key ? VIMEO_URL.concat(tmdbVideo.key) : "";
        }
        const getVideoFile = await model.video.findOne({
          attributes: ["id", "name", "url"],
          where: {
            title_id: titleId,
            url: videoUrl,
            type: "external",
            source: "tmdb",
            is_official_trailer: isOffTrailer,
            site_language: siteLanguage,
            video_for: "title",
          },
        });
        if (!getVideoFile) {
          //Insert title video into edb_videos table
          const createData = {
            name: videoName,
            url: videoUrl,
            title_id: titleId,
            type: "external",
            source: "tmdb",
            approved: 1,
            is_official_trailer: isOffTrailer,
            site_language: siteLanguage,
            created_by: createdBy,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            video_for: "title",
            no_of_view: 0,
            ele_no_of_view: 0,
            video_source: videoSource,
          };
          const createVideo = await model.video.create(createData);
          actionDate = createData.created_at;
          recordId = titleId;
          if (createVideo.id)
            payloadList.push({ record_id: createVideo.id, type: "video", action: "add" });
        }
      }
      if (recordId) {
        if (payloadList.length > 0) {
          const payload = {
            list: payloadList,
          };
          schedulerJobService.addJobInScheduler(
            "add video data to search db",
            JSON.stringify(payload),
            "search_db",
            `add title video from edit movie tmdb video`,
            createdBy,
          );
        }
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
