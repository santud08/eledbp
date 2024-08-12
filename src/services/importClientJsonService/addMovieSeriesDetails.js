import model from "../../models/index.js";
import { customDateTimeHelper, customFileHelper, generalHelper } from "../../helpers/index.js";
import { tmdbService, importTitleTmdbService, titleService } from "../../services/index.js";

export const addMovieSeriesDetails = async (seriesData, titleId, createdBy) => {
  try {
    for (const eachData of seriesData) {
      if (eachData) {
        // check for series title_id with tmdb_id if present in local - then add the series data to the related series table
        if (eachData.tmdb_id) {
          const siteLanguage = "en";
          const findTitleId = await model.title.findOne({
            where: {
              tmdb_id: eachData.tmdb_id,
              record_status: "active",
            },
          });
          if (findTitleId) {
            const seriesTitleId = findTitleId.id;

            const seriesData = {
              title_id: titleId,
              related_series_title_id: seriesTitleId,
              site_language: siteLanguage,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: createdBy,
            };
            await model.relatedSeriesTitle.create(seriesData);
          } else {
            const langEn = "en";
            const langKo = "ko";
            const getType = "movie";
            const getTmbdId = eachData.tmdb_id;
            let seriesTitleId = 0;
            // create basic details using tmdb_id and add the title_id to related series table
            const [
              tmdbEnData,
              tmdbKoData,
              tmdbEnImageData,
              // tmdbKoImageData,
              tmdbEnVideoData,
              // tmdbKoVideoData,
              // tmdbEnKeywordData,
              // tmdbKoKeywordData,
              tmdbEnDataAka,
              tmdbKoDataAka,
              tmdbEnCreditsData,
              tmdbEnCertificationData,
              tmdbKoCertificationData,
              tmdbKoWatchData,
            ] = await Promise.all([
              tmdbService.fetchTitleDetails(getType, getTmbdId, langEn),
              tmdbService.fetchTitleDetails(getType, getTmbdId, langKo),
              tmdbService.fetchMovieImages(getTmbdId, "", null),
              //tmdbService.fetchMovieImages(getTmbdId, "", langKo),
              tmdbService.fetchTitleVideos(getType, getTmbdId, langEn),
              tmdbService.fetchTitleVideos(getType, getTmbdId, langKo),
              // tmdbService.fetchTitleKeywords(getType, getTmbdId, langEn),
              // tmdbService.fetchTitleKeywords(getType, getTmbdId, langKo),
              tmdbService.fetchTitleAka(getType, getTmbdId, langEn),
              tmdbService.fetchTitleAka(getType, getTmbdId, langKo),
              tmdbService.fetchTitleCredits(getType, getTmbdId, null, langEn),
              tmdbService.fetchTitleCertification(getType, getTmbdId, langEn),
              tmdbService.fetchTitleCertification(getType, getTmbdId, langKo),
              tmdbService.fetchTitleWatch(getType, getTmbdId, null, langKo),
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
                titleData.runtime = tmdbEnData.results.runtime ? tmdbEnData.results.runtime : null;
                titleData.budget = tmdbEnData.results.budget ? tmdbEnData.results.budget : null;
                titleData.revenue = tmdbEnData.results.revenue ? tmdbEnData.results.revenue : null;
                titleData.popularity = tmdbEnData.results.popularity
                  ? tmdbEnData.results.popularity
                  : null;
                titleData.imdb_id = tmdbEnData.results.imdb_id ? tmdbEnData.results.imdb_id : null;
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
                titleData.certification =
                  tmdbEnCertificationData &&
                  tmdbEnCertificationData.results &&
                  tmdbEnCertificationData.results.certification_key
                    ? tmdbEnCertificationData.results.certification_key
                    : null;
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
                //titleTranslationData.synopsis = null;
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
                if (!titleData.certification)
                  titleData.certification =
                    tmdbKoCertificationData.results &&
                    tmdbKoCertificationData.results.certification_key
                      ? tmdbKoCertificationData.results.certification_key
                      : null;

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

                let fileName = tmdbEnData.results.poster_image
                  ? tmdbEnData.results.poster_image.substring(
                      tmdbEnData.results.poster_image.lastIndexOf("/") + 1,
                    )
                  : null;
                let path = tmdbEnData.results.poster_image ? tmdbEnData.results.poster_image : null;
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

                // Media, Watch Section Update for movie

                // Get background image for english language
                if (
                  tmdbEnImageData &&
                  tmdbEnImageData.results &&
                  tmdbEnImageData.results.bg_image &&
                  tmdbEnImageData.results.bg_image.length > 0
                ) {
                  await Promise.all([
                    importTitleTmdbService.addMovieTmdbImages(
                      tmdbEnImageData.results.bg_image,
                      seriesTitleId,
                      "bg_image",
                      createdBy,
                      langEn,
                    ),
                    importTitleTmdbService.addMovieTmdbImages(
                      tmdbEnImageData.results.bg_image,
                      seriesTitleId,
                      "image",
                      createdBy,
                      langEn,
                    ),
                  ]);
                }

                // Get Poster image for english language
                if (
                  tmdbEnImageData &&
                  tmdbEnImageData.results &&
                  tmdbEnImageData.results.poster_image &&
                  tmdbEnImageData.results.poster_image.length > 0
                ) {
                  await importTitleTmdbService.addMovieTmdbImages(
                    tmdbEnImageData.results.poster_image,
                    seriesTitleId,
                    "poster_image",
                    createdBy,
                    langEn,
                  );
                }

                //Insert title video into title video table for english language
                if (
                  tmdbEnVideoData &&
                  tmdbEnVideoData.results &&
                  tmdbEnVideoData.results.length > 0
                ) {
                  await importTitleTmdbService.addMovieTmdbVideos(
                    tmdbEnVideoData.results,
                    seriesTitleId,
                    createdBy,
                    langEn,
                  );
                }
                // credit data cast & crew
                if (
                  tmdbEnCreditsData &&
                  tmdbEnCreditsData.results &&
                  tmdbEnCreditsData.results.cast.length > 0 &&
                  seriesTitleId
                ) {
                  await Promise.all([
                    importTitleTmdbService.addMovieTmdbCast(
                      tmdbEnCreditsData.results.cast,
                      seriesTitleId,
                      createdBy,
                      langEn,
                    ),
                    // importTitleTmdbService.addMovieTmdbCast(
                    //   tmdbEnCreditsData.results.cast,
                    //   titleId,
                    //   createdBy,
                    //   langKo,
                    // ),
                  ]);
                }
                if (
                  tmdbEnCreditsData &&
                  tmdbEnCreditsData.results &&
                  tmdbEnCreditsData.results.crew.length > 0 &&
                  seriesTitleId
                ) {
                  await Promise.all([
                    importTitleTmdbService.addMovieTmdbCrew(
                      tmdbEnCreditsData.results.crew,
                      seriesTitleId,
                      createdBy,
                      langEn,
                    ),
                    // importTitleTmdbService.addMovieTmdbCrew(
                    //   tmdbEnCreditsData.results.crew,
                    //   titleId,
                    //   createdBy,
                    //   langKo,
                    // ),
                  ]);
                }
                if (tmdbKoWatchData && tmdbKoWatchData.results && titleId) {
                  await Promise.all([
                    importTitleTmdbService.addMovieWatch(
                      tmdbKoWatchData.results.rent,
                      seriesTitleId,
                      "rent",
                      createdBy,
                      langKo,
                    ),
                    importTitleTmdbService.addMovieWatch(
                      tmdbKoWatchData.results.buy,
                      seriesTitleId,
                      "buy",
                      createdBy,
                      langKo,
                    ),
                    importTitleTmdbService.addMovieWatch(
                      tmdbKoWatchData.results.stream,
                      seriesTitleId,
                      "stream",
                      createdBy,
                      langKo,
                    ),
                  ]);
                }
              }
            }
            if (seriesTitleId > 0 && titleId) {
              const checkSeries = await model.relatedSeriesTitle.findOne({
                where: {
                  title_id: titleId,
                  related_series_title_id: seriesTitleId,
                  status: "active",
                },
              });
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
            }
          }
        }
      }
    }
  } catch (error) {
    console.log("add Series- import client JSON", error);
    return { results: {} };
  }
};
