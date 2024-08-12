import model from "../../models/index.js";
import { customDateTimeHelper, customFileHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, schedulerJobService, titleService } from "../../services/index.js";

export const addMovieSeriesData = async (collectionId, titleId, createdBy, siteLanguage = "en") => {
  try {
    const tmdbMovieSeries = await tmdbService.fetchMovieSeries(collectionId, "full", siteLanguage);
    let payload = null,
      combinationSeries = [];
    if (
      tmdbMovieSeries &&
      tmdbMovieSeries.results != null &&
      tmdbMovieSeries.results != "undefined" &&
      tmdbMovieSeries.results.length > 0
    ) {
      for (const eachData of tmdbMovieSeries.results) {
        if (eachData) {
          let seriesTitleId = 0;
          if (
            eachData.title_id &&
            eachData.title_id != "" &&
            eachData.title_id != "undefined" &&
            eachData.title_id != null
          ) {
            seriesTitleId = eachData.title_id;
          } else {
            if (
              eachData.tmdb_id &&
              eachData.tmdb_id != "" &&
              eachData.tmdb_id != "undefined" &&
              eachData.tmdb_id != null
            ) {
              const [tmdbEnData, tmdbKoData, tmdbEnDataAka, tmdbKoDataAka] = await Promise.all([
                tmdbService.fetchTitleDetails("movie", eachData.tmdb_id, "en"),
                tmdbService.fetchTitleDetails("movie", eachData.tmdb_id, "ko"),
                tmdbService.fetchTitleAka("movie", eachData.tmdb_id, "en"),
                tmdbService.fetchTitleAka("movie", eachData.tmdb_id, "ko"),
              ]);
              if (
                (tmdbEnData &&
                  tmdbEnData.results &&
                  tmdbEnData.results != "undefined" &&
                  tmdbEnData.results != null) ||
                (tmdbKoData &&
                  tmdbKoData.results &&
                  tmdbKoData.results != "undefined" &&
                  tmdbKoData.results != null)
              ) {
                const titleData = {
                  uuid: await generalHelper.uuidv4(),
                  type: "movie",
                  record_status: "active",
                  created_by: createdBy,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  kobis_id: null,
                  tiving_id: null,
                  odk_id: null,
                };
                const titleTranslationData = {
                  site_language: "en",
                  created_by: createdBy,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                };
                const titleTranslationDataKo = {
                  site_language: "ko",
                  created_by: createdBy,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                };
                if (
                  tmdbEnData &&
                  tmdbEnData.results &&
                  tmdbEnData.results != "undefined" &&
                  tmdbEnData.results != null
                ) {
                  const releaseDate = tmdbEnData.results.release_date
                    ? tmdbEnData.results.release_date
                    : null;
                  const releaseYear = releaseDate ? new Date(releaseDate) : null;
                  const year = releaseYear != null ? releaseYear.getFullYear() : null;
                  const getStatus = tmdbEnData.results.status ? tmdbEnData.results.status : null;
                  const statusList = await generalHelper.titleStatus("movie");
                  const seriesTitleStatus =
                    statusList && getStatus
                      ? Object.keys(statusList).find((key) => statusList[key] === getStatus)
                      : "";
                  titleData.tmdb_vote_average = tmdbEnData.results.vote_average
                    ? tmdbEnData.results.vote_average
                    : null;
                  titleData.release_date = releaseDate;
                  titleData.year = year;
                  titleData.runtime = tmdbEnData.results.runtime
                    ? tmdbEnData.results.runtime
                    : null;
                  titleData.budget = tmdbEnData.results.budget ? tmdbEnData.results.budget : null;
                  titleData.revenue = tmdbEnData.results.revenue
                    ? tmdbEnData.results.revenue
                    : null;
                  titleData.popularity = tmdbEnData.results.popularity
                    ? tmdbEnData.results.popularity
                    : null;
                  titleData.imdb_id = tmdbEnData.results.imdb_id
                    ? tmdbEnData.results.imdb_id
                    : null;
                  titleData.tmdb_id = eachData.tmdb_id;
                  titleData.language = tmdbEnData.results.original_language
                    ? tmdbEnData.results.original_language
                    : null;
                  titleData.original_title = tmdbEnData.results.original_title
                    ? tmdbEnData.results.original_title
                    : null;
                  titleData.affiliate_link = tmdbEnData.results.homepage
                    ? tmdbEnData.results.homepage
                    : null;
                  titleData.tmdb_vote_count = tmdbEnData.results.vote_count
                    ? tmdbEnData.results.vote_count
                    : null;
                  titleData.title_status = seriesTitleStatus ? seriesTitleStatus : null;

                  let tmdbAka =
                    tmdbEnDataAka.results && tmdbEnDataAka.results.all_aka
                      ? tmdbEnDataAka.results.all_aka
                      : "";
                  if (!tmdbAka) {
                    tmdbAka =
                      tmdbKoDataAka.results && tmdbKoDataAka.results.all_aka
                        ? tmdbKoDataAka.results.all_aka
                        : "";
                  }

                  titleTranslationData.name = tmdbEnData.results.title
                    ? tmdbEnData.results.title
                    : "";
                  titleTranslationData.aka = tmdbAka;
                  titleTranslationData.description = tmdbEnData.results.overview
                    ? tmdbEnData.results.overview
                    : null;
                  titleTranslationData.tagline = tmdbEnData.results.tagline
                    ? tmdbEnData.results.tagline
                    : null;
                  titleTranslationData.plot_summary = tmdbEnData.results.tmdb_plot_summery
                    ? tmdbEnData.results.tmdb_plot_summery
                    : "";
                }

                if (
                  tmdbKoData &&
                  tmdbKoData.results &&
                  tmdbKoData.results != "undefined" &&
                  tmdbKoData.results != null
                ) {
                  const releaseDate = tmdbKoData.results.release_date
                    ? tmdbKoData.results.release_date
                    : null;
                  const releaseYear = releaseDate ? new Date(releaseDate) : null;
                  const year = releaseYear != null ? releaseYear.getFullYear() : null;
                  const getStatus = tmdbKoData.results.status ? tmdbKoData.results.status : null;
                  const statusList = await generalHelper.titleStatus("movie");
                  const seriesTitleStatus =
                    statusList && getStatus
                      ? Object.keys(statusList).find((key) => statusList[key] === getStatus)
                      : "";
                  if (!titleData.tmdb_vote_average)
                    titleData.tmdb_vote_average = tmdbKoData.results.vote_average
                      ? tmdbKoData.results.vote_average
                      : null;
                  if (!titleData.release_date) titleData.release_date = releaseDate;
                  if (!titleData.year) titleData.year = year;
                  if (!titleData.runtime)
                    titleData.runtime = tmdbKoData.results.runtime
                      ? tmdbKoData.results.runtime
                      : null;
                  if (!titleData.budget)
                    titleData.budget = tmdbKoData.results.budget ? tmdbKoData.results.budget : null;
                  if (!titleData.revenue)
                    titleData.revenue = tmdbKoData.results.revenue
                      ? tmdbKoData.results.revenue
                      : null;
                  if (!titleData.popularity)
                    titleData.popularity = tmdbKoData.results.popularity
                      ? tmdbKoData.results.popularity
                      : null;
                  if (!titleData.imdb_id)
                    titleData.imdb_id = tmdbKoData.results.imdb_id
                      ? tmdbKoData.results.imdb_id
                      : null;
                  if (!titleData.tmdb_id) titleData.tmdb_id = eachData.tmdb_id;
                  if (!titleData.language)
                    titleData.language = tmdbKoData.results.original_language
                      ? tmdbKoData.results.original_language
                      : null;
                  if (!titleData.original_title)
                    titleData.original_title = tmdbKoData.results.original_title
                      ? tmdbKoData.results.original_title
                      : null;
                  if (!titleData.affiliate_link)
                    titleData.affiliate_link = tmdbKoData.results.homepage
                      ? tmdbKoData.results.homepage
                      : null;
                  if (!titleData.tmdb_vote_count)
                    titleData.tmdb_vote_count = tmdbKoData.results.vote_count
                      ? tmdbKoData.results.vote_count
                      : null;
                  if (!titleData.title_status)
                    titleData.title_status = seriesTitleStatus ? seriesTitleStatus : null;

                  let tmdbAka =
                    tmdbEnDataAka.results && tmdbEnDataAka.results.all_aka
                      ? tmdbEnDataAka.results.all_aka
                      : "";
                  if (!tmdbAka) {
                    tmdbAka =
                      tmdbKoDataAka.results && tmdbKoDataAka.results.all_aka
                        ? tmdbKoDataAka.results.all_aka
                        : "";
                  }

                  titleTranslationDataKo.name = tmdbKoData.results.title
                    ? tmdbKoData.results.title
                    : "";
                  titleTranslationDataKo.aka = tmdbAka;
                  titleTranslationDataKo.description = tmdbKoData.results.overview
                    ? tmdbKoData.results.overview
                    : null;
                  titleTranslationDataKo.tagline = tmdbKoData.results.tagline
                    ? tmdbKoData.results.tagline
                    : null;
                  titleTranslationDataKo.plot_summary = tmdbKoData.results.tmdb_plot_summery
                    ? tmdbKoData.results.tmdb_plot_summery
                    : "";
                }
                const newSeriesTitle = await model.title.create(titleData);
                if (newSeriesTitle && newSeriesTitle.id) {
                  seriesTitleId = newSeriesTitle.id;
                  // service add for update data in edb_edits table
                  const actionDate = titleData.created_at;
                  await titleService.titleDataAddEditInEditTbl(
                    seriesTitleId,
                    "movie",
                    createdBy,
                    actionDate,
                  );

                  titleTranslationData.title_id = newSeriesTitle.id;
                  titleTranslationDataKo.title_id = newSeriesTitle.id;
                  await model.titleTranslation.bulkCreate([
                    titleTranslationData,
                    titleTranslationDataKo,
                  ]);

                  // create schedular data
                  if (payload == null) {
                    payload = { list: [] };
                  }
                  payload.list.push({
                    type: "movie",
                    tmdb_id: eachData.tmdb_id,
                    site_language: "en",
                    title_id: newSeriesTitle.id,
                    created_by: createdBy,
                  });

                  let fileName = tmdbEnData.results.poster_image
                    ? tmdbEnData.results.poster_image.substring(
                        tmdbEnData.results.poster_image.lastIndexOf("/") + 1,
                      )
                    : null;
                  let path = tmdbEnData.results.poster_image
                    ? tmdbEnData.results.poster_image
                    : null;
                  if (!tmdbEnData.results.poster_image) {
                    fileName = tmdbKoData.results.poster_image
                      ? tmdbKoData.results.poster_image.substring(
                          tmdbKoData.results.poster_image.lastIndexOf("/") + 1,
                        )
                      : null;
                    path = tmdbKoData.results.poster_image ? tmdbKoData.results.poster_image : null;
                  }

                  let fileNameBg = tmdbEnData.results.backdrop_path
                    ? tmdbEnData.results.backdrop_path.substring(
                        tmdbEnData.results.backdrop_path.lastIndexOf("/") + 1,
                      )
                    : null;
                  let pathBg = tmdbEnData.results.backdrop_path
                    ? tmdbEnData.results.backdrop_path
                    : null;
                  if (!tmdbEnData.results.backdrop_path) {
                    fileNameBg = tmdbKoData.results.backdrop_path
                      ? tmdbKoData.results.backdrop_path.substring(
                          tmdbKoData.results.backdrop_path.lastIndexOf("/") + 1,
                        )
                      : null;
                    pathBg = tmdbKoData.results.backdrop_path
                      ? tmdbKoData.results.backdrop_path
                      : null;
                  }
                  const posterImageData = {
                    original_name: fileName,
                    file_name: fileName,
                    path: path,
                    file_extension: fileName
                      ? await customFileHelper.getFileExtByFileName(fileName)
                      : null,
                    title_id: newSeriesTitle.id,
                    list_order: 1,
                    image_category: "poster_image",
                    is_main_poster: "y",
                    site_language: "en",
                    source: "tmdb",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: createdBy,
                  };
                  const bgImageData = {
                    original_name: fileNameBg,
                    file_name: fileNameBg,
                    path: pathBg,
                    file_extension: fileNameBg
                      ? await customFileHelper.getFileExtByFileName(fileNameBg)
                      : null,
                    title_id: newSeriesTitle.id,
                    list_order: 1,
                    image_category: "bg_image",
                    is_main_poster: "y",
                    site_language: "en",
                    source: "tmdb",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: createdBy,
                  };
                  const imageData = {
                    original_name: fileNameBg,
                    file_name: fileNameBg,
                    path: pathBg,
                    file_extension: fileNameBg
                      ? await customFileHelper.getFileExtByFileName(fileNameBg)
                      : null,
                    title_id: newSeriesTitle.id,
                    list_order: 1,
                    image_category: "image",
                    is_main_poster: "n",
                    site_language: "en",
                    source: "tmdb",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: createdBy,
                  };
                  const newImage = [];
                  if (fileName && path) {
                    newImage.push(posterImageData);
                  }
                  if (fileNameBg && pathBg) {
                    newImage.push(bgImageData);
                    newImage.push(imageData);
                  }
                  if (newImage && newImage.length > 0) await model.titleImage.bulkCreate(newImage);
                }
              }
            }
          }
          if (seriesTitleId > 0 && titleId && seriesTitleId != titleId) {
            combinationSeries.push(seriesTitleId);
            const [checkSeries, checkOtherSeries] = await Promise.all([
              model.relatedSeriesTitle.findOne({
                where: {
                  title_id: titleId,
                  related_series_title_id: seriesTitleId,
                  status: "active",
                },
              }),
              model.relatedSeriesTitle.findOne({
                where: {
                  title_id: seriesTitleId,
                  related_series_title_id: titleId,
                  status: "active",
                },
              }),
            ]);

            if (!checkSeries) {
              const seriesData = {
                title_id: titleId,
                related_series_title_id: seriesTitleId,
                site_language: siteLanguage,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
              };
              await model.relatedSeriesTitle.create(seriesData);
            }
            if (!checkOtherSeries) {
              const seriesData = {
                title_id: seriesTitleId,
                related_series_title_id: titleId,
                site_language: siteLanguage,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: createdBy,
              };
              await model.relatedSeriesTitle.create(seriesData);
            }
          }
        }
      }
      // insert other combinationSeries
      if (combinationSeries.length > 1) {
        const reverseCombinationSeries = combinationSeries.reverse();
        for (const combination of combinationSeries) {
          for (const revCombination of reverseCombinationSeries) {
            if (combination > 0 && revCombination > 0 && combination != revCombination) {
              const findRelatedData = await model.relatedSeriesTitle.findOne({
                where: {
                  title_id: combination,
                  related_series_title_id: revCombination,
                  status: "active",
                },
              });
              if (!findRelatedData) {
                const seriesData = {
                  title_id: combination,
                  related_series_title_id: revCombination,
                  site_language: siteLanguage,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: createdBy,
                };
                await model.relatedSeriesTitle.create(seriesData);
              }
            }
          }
        }
      }

      //add in schedular - media
      if (payload && payload.list && payload.list.length > 0) {
        await schedulerJobService.addJobInScheduler(
          "add series title data from import",
          JSON.stringify(payload),
          "title_series_data_import",
          "Add movie series data service",
          createdBy,
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};
