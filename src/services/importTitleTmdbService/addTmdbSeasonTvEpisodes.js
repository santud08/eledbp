import model from "../../models/index.js";
import { customDateTimeHelper, customFileHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, titleService } from "../../services/index.js";

export const addTmdbSeasonTvEpisodes = async (
  titleId,
  tmdbId,
  seasonId,
  seasonNumber,
  createdBy,
  siteLanguage = "en",
) => {
  try {
    const swipSiteLanguage = await generalHelper.swipeLanguage(siteLanguage);
    const [getSeasonEpisodeData, getSeasonSwipEpisodeData] = await Promise.all([
      tmdbService.fetchTvSeasonEpisodes(tmdbId, seasonNumber, siteLanguage),
      tmdbService.fetchTvSeasonEpisodes(tmdbId, seasonNumber, swipSiteLanguage),
    ]);
    if (
      getSeasonEpisodeData &&
      getSeasonEpisodeData.results != null &&
      getSeasonEpisodeData.results != "undefined" &&
      getSeasonEpisodeData.results.length > 0
    ) {
      let actionDate = "";
      let recordId = "";
      for (const episode of getSeasonEpisodeData.results) {
        if (episode) {
          const createSeasonEpisode = {
            poster: episode.poster_image ? episode.poster_image : null,
            release_date: episode.release_date ? episode.release_date : null,
            title_id: titleId,
            season_id: seasonId,
            season_number: episode.season_number,
            episode_number: episode.episode_number,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            site_language: siteLanguage,
            created_by: createdBy,
          };
          const getSeasonEpisode = await model.episode.findOne({
            attributes: ["id"],
            where: {
              season_number: createSeasonEpisode.season_number,
              episode_number: createSeasonEpisode.episode_number,
              title_id: titleId,
              season_id: seasonId,
            },
          });
          if (!getSeasonEpisode) {
            const createdEpisode = await model.episode.create(createSeasonEpisode);
            actionDate = createSeasonEpisode.created_at;
            recordId = titleId;
            if (createdEpisode && createdEpisode.id) {
              const createSeasonEpisodeTranslation = {
                name: episode.episode_name ? episode.episode_name.trim() : "",
                description: episode.overview ? episode.overview : null,
                episode_id: createdEpisode.id,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                site_language: siteLanguage,
                created_by: createdBy,
              };
              let createSeasonSwipEpisodeTranslation = null;
              if (
                getSeasonSwipEpisodeData &&
                getSeasonSwipEpisodeData.results != null &&
                getSeasonSwipEpisodeData.results != "undefined" &&
                getSeasonSwipEpisodeData.results.length > 0
              ) {
                for (const episodeSwip of getSeasonSwipEpisodeData.results) {
                  if (episodeSwip) {
                    if (
                      episode.season_number == episodeSwip.season_number &&
                      episode.episode_number == episodeSwip.episode_number
                    ) {
                      createSeasonSwipEpisodeTranslation = {
                        name: episodeSwip.episode_name ? episodeSwip.episode_name.trim() : "",
                        description: episodeSwip.overview ? episodeSwip.overview : null,
                        episode_id: createdEpisode.id,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        site_language: swipSiteLanguage,
                        created_by: createdBy,
                      };
                    }
                  }
                }
              }
              if (
                createSeasonSwipEpisodeTranslation &&
                createSeasonSwipEpisodeTranslation != null
              ) {
                await Promise.all([
                  model.episodeTranslation.create(createSeasonEpisodeTranslation),
                  model.episodeTranslation.create(createSeasonSwipEpisodeTranslation),
                ]);
                actionDate = createSeasonEpisodeTranslation.created_at;
                actionDate = createSeasonSwipEpisodeTranslation.created_at;
              } else {
                model.episodeTranslation.create(createSeasonEpisodeTranslation);
                actionDate = createSeasonEpisodeTranslation.created_at;
              }
            }
            // create poster image of eposides form data
            if (
              createdEpisode &&
              createdEpisode.id &&
              episode.poster_image &&
              episode.poster_image != null &&
              episode.poster_image != ""
            ) {
              const fileName = episode.poster_image.substring(
                episode.poster_image.lastIndexOf("/") + 1,
              );
              const fileExtension = await customFileHelper.getFileExtByFileName(
                episode.poster_image,
              );
              const posterImageData = {
                original_name: fileName ? fileName : null,
                file_name: fileName ? fileName : null,
                path: episode.poster_image,
                file_extension: fileExtension ? fileExtension : null,
                title_id: titleId,
                season_id: seasonId,
                episode_id: createdEpisode.id,
                list_order: 1,
                image_category: "poster_image",
                is_main_poster: "y",
                site_language: siteLanguage,
                source: "tmdb",
                approved: 1,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
              };
              await model.titleImage.create(posterImageData);
              actionDate = posterImageData.created_at;
            }
          }
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
