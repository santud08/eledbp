import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { tmdbService, titleService } from "../../services/index.js";

export const addTmdbSeasonTvImages = async (
  titleId,
  tmdbId,
  seasonId,
  seasonNumber,
  createdBy,
  siteLanguage = "en",
) => {
  try {
    const getSeasonImageData = await tmdbService.fetchTvSeasonImages(
      tmdbId,
      seasonNumber,
      "",
      null,
    );
    let actionDate = "";
    let recordId = "";
    if (
      getSeasonImageData &&
      getSeasonImageData.results != null &&
      getSeasonImageData.results != "undefined" &&
      getSeasonImageData.results.bg_image != "undefined" &&
      getSeasonImageData.results.bg_image.length > 0
    ) {
      for (const image of getSeasonImageData.results.bg_image) {
        if (image) {
          const getLastOrder = await model.titleImage.max("list_order", {
            where: {
              title_id: titleId,
              season_id: seasonId,
              site_language: siteLanguage,
              image_category: "bg_image",
            },
          });
          const posterImageData = {
            original_name: image.originalname,
            file_name: image.filename,
            path: image.path ? image.path : null,
            file_extension: image.file_extension ? image.file_extension : null,
            title_id: titleId,
            season_id: seasonId,
            list_order: getLastOrder ? getLastOrder + 1 : 1,
            image_category: "bg_image",
            is_main_poster: "n",
            site_language: siteLanguage,
            source: "tmdb",
            approved: 1,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: createdBy,
          };
          const getSeasonImage = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              image_category: "bg_image",
              file_name: image.filename,
              title_id: titleId,
              season_id: seasonId,
              site_language: siteLanguage,
            },
          });
          if (!getSeasonImage) {
            await model.titleImage.create(posterImageData);
            actionDate = posterImageData.created_at;
            recordId = titleId;
          }
        }
      }
    }
    if (
      getSeasonImageData &&
      getSeasonImageData.results != null &&
      getSeasonImageData.results != "undefined" &&
      getSeasonImageData.results.bg_image != "undefined" &&
      getSeasonImageData.results.bg_image.length > 0
    ) {
      for (const image of getSeasonImageData.results.bg_image) {
        if (image) {
          const getLastOrder = await model.titleImage.max("list_order", {
            where: {
              title_id: titleId,
              season_id: seasonId,
              site_language: siteLanguage,
              image_category: "image",
            },
          });
          const posterImageData = {
            original_name: image.originalname,
            file_name: image.filename,
            path: image.path ? image.path : null,
            file_extension: image.file_extension ? image.file_extension : null,
            title_id: titleId,
            season_id: seasonId,
            list_order: getLastOrder ? getLastOrder + 1 : 1,
            image_category: "image",
            is_main_poster: "n",
            site_language: siteLanguage,
            source: "tmdb",
            approved: 1,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: createdBy,
          };
          const getSeasonImage = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              image_category: "image",
              file_name: image.filename,
              title_id: titleId,
              season_id: seasonId,
              site_language: siteLanguage,
            },
          });
          if (!getSeasonImage) {
            await model.titleImage.create(posterImageData);
            actionDate = posterImageData.created_at;
            recordId = titleId;
          }
        }
      }
    }
    if (
      getSeasonImageData &&
      getSeasonImageData.results != null &&
      getSeasonImageData.results != "undefined" &&
      getSeasonImageData.results.poster_image != "undefined" &&
      getSeasonImageData.results.poster_image.length > 0
    ) {
      for (const image of getSeasonImageData.results.poster_image) {
        if (image) {
          const getLastOrder = await model.titleImage.max("list_order", {
            where: {
              title_id: titleId,
              season_id: seasonId,
              site_language: siteLanguage,
              image_category: "poster_image",
            },
          });
          const posterImageData = {
            original_name: image.originalname,
            file_name: image.filename,
            path: image.path ? image.path : null,
            file_extension: image.file_extension ? image.file_extension : null,
            title_id: titleId,
            season_id: seasonId,
            list_order: getLastOrder ? getLastOrder + 1 : 1,
            image_category: "poster_image",
            is_main_poster: "n",
            site_language: siteLanguage,
            source: "tmdb",
            approved: 1,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: createdBy,
          };
          const getSeasonImage = await model.titleImage.findOne({
            attributes: ["id"],
            where: {
              image_category: "poster_image",
              file_name: image.filename,
              title_id: titleId,
              season_id: seasonId,
              site_language: siteLanguage,
            },
          });
          if (!getSeasonImage) {
            await model.titleImage.create(posterImageData);
            actionDate = posterImageData.created_at;
            recordId = titleId;
          }
        }
      }
    }

    if (recordId)
      await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
  } catch (error) {
    console.log(error);
  }
};
