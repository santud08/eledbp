import model from "../../models/index.js";
import { customDateTimeHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, titleService, schedulerJobService } from "../../services/index.js";

export const addTmdbSeasonTvVideos = async (
  titleId,
  tmdbId,
  seasonId,
  seasonNumber,
  createdBy,
  siteLanguage = "en",
) => {
  try {
    const getSeasonVideoData = await tmdbService.fetchTvSeasonVideos(tmdbId, seasonNumber, null);
    if (
      getSeasonVideoData &&
      getSeasonVideoData.results != null &&
      getSeasonVideoData.results != "undefined" &&
      getSeasonVideoData.results.length > 0
    ) {
      let actionDate = "";
      let recordId = "";
      let payloadList = [];
      for (const tmdbVideo of getSeasonVideoData.results) {
        const getVideoFile = await model.video.findOne({
          attributes: ["id", "name", "url"],
          where: {
            title_id: titleId,
            name: tmdbVideo.video_title,
            season: seasonId,
            url: tmdbVideo.video_url,
            type: "external",
            source: "tmdb",
            is_official_trailer: tmdbVideo.is_official_trailer,
            site_language: siteLanguage,
            video_for: "title",
          },
        });
        if (!getVideoFile) {
          //Insert title video into edb_videos table
          const createData = {
            name: tmdbVideo.video_title,
            url: tmdbVideo.video_url,
            title_id: titleId,
            type: "external",
            source: "tmdb",
            approved: 1,
            season: seasonId,
            is_official_trailer: tmdbVideo.is_official_trailer,
            site_language: siteLanguage,
            created_by: createdBy,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            video_for: "title",
            no_of_view: 0,
            ele_no_of_view: 0,
            video_source: tmdbVideo.video_url
              ? await generalHelper.checkUrlSource(tmdbVideo.video_url)
              : "youtube",
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
            `add title video from season tv tmdb video`,
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
