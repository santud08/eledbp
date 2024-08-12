import model from "../../models/index.js";
import { customDateTimeHelper, customFileHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, titleService } from "../../services/index.js";

export const addTvTmdbSeason = async (
  titleId,
  tmdbId,
  seasonNumber,
  createdBy,
  tvAka,
  siteLanguage = "en",
) => {
  try {
    let seasonId = null;
    const swipSiteLanguage = await generalHelper.swipeLanguage(siteLanguage);
    const [getSeasonData, getSeasonSwipData] = await Promise.all([
      tmdbService.fetchTvSeasonDetails(tmdbId, seasonNumber, siteLanguage),
      tmdbService.fetchTvSeasonDetails(tmdbId, seasonNumber, swipSiteLanguage),
    ]);
    let actionDate = "";
    let recordId = "";
    if (
      getSeasonData &&
      getSeasonData.results &&
      getSeasonData.results != null &&
      getSeasonData.results != "undefined"
    ) {
      const createSeason = {
        release_date: getSeasonData.results.release_date
          ? getSeasonData.results.release_date
          : null,
        poster: getSeasonData.results.poster_image ? getSeasonData.results.poster_image : null,
        number: getSeasonData.results.season_number
          ? getSeasonData.results.season_number
          : seasonNumber,
        title_id: titleId,
        title_tmdb_id: tmdbId,
        aka: tvAka.results && tvAka.results.all_aka ? tvAka.results.all_aka : null,
        episode_count: getSeasonData.results.no_of_episode
          ? getSeasonData.results.no_of_episode
          : 0,
        site_language: siteLanguage,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: createdBy,
      };

      const getSeason = await model.season.findOne({
        attributes: ["id"],
        where: {
          number: createSeason.number,
          title_id: titleId,
          title_tmdb_id: tmdbId,
        },
      });
      if (!getSeason) {
        const createSeasonData = await model.season.create(createSeason);
        if (createSeasonData) {
          seasonId = createSeasonData.id ? createSeasonData.id : null;
          actionDate = createSeason.created_at;
          recordId = titleId;
          if (seasonId) {
            const createSeasonTranslation = {
              season_name: getSeasonData.results.season_name
                ? getSeasonData.results.season_name.trim()
                : null,
              season_id: seasonId,
              summary: getSeasonData.results.overview ? getSeasonData.results.overview : null,
              aka: tvAka.results && tvAka.results.all_aka ? tvAka.results.all_aka : null,
              site_language: siteLanguage,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: createdBy,
            };
            let createSwipSeasonTranslation = null;
            if (
              getSeasonSwipData &&
              getSeasonSwipData.results &&
              getSeasonSwipData.results != null &&
              getSeasonSwipData.results != "undefined"
            ) {
              createSwipSeasonTranslation = {
                season_name: getSeasonSwipData.results.season_name
                  ? getSeasonSwipData.results.season_name.trim()
                  : null,
                season_id: seasonId,
                summary: getSeasonSwipData.results.overview
                  ? getSeasonSwipData.results.overview
                  : null,
                aka: tvAka.results && tvAka.results.all_aka ? tvAka.results.all_aka : null,
                site_language: swipSiteLanguage,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
              };
            }
            if (createSwipSeasonTranslation && createSwipSeasonTranslation != null) {
              await Promise.all([
                model.seasonTranslation.create(createSeasonTranslation),
                model.seasonTranslation.create(createSwipSeasonTranslation),
              ]);
              actionDate = createSeasonTranslation.created_at;
              actionDate = createSwipSeasonTranslation.created_at;
            } else {
              model.seasonTranslation.create(createSeasonTranslation);
              actionDate = createSeasonTranslation.created_at;
            }
          }
          if (createSeason.poster != null && createSeason.poster != "" && seasonId != null) {
            const fileName = createSeason.poster
              ? createSeason.poster.substring(createSeason.poster.lastIndexOf("/") + 1)
              : null;
            const fileExtension = createSeason.poster
              ? await customFileHelper.getFileExtByFileName(createSeason.poster)
              : null;
            const posterImageData = {
              original_name: fileName,
              file_name: fileName,
              path: createSeason.poster ? createSeason.poster : null,
              file_extension: fileExtension,
              title_id: titleId,
              season_id: seasonId,
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
      } else {
        seasonId = getSeason.id ? getSeason.id : null;
      }

      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
    }
    return seasonId;
  } catch (error) {
    console.log(error);
    return null;
  }
};
