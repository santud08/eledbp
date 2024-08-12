import model from "../../../models/index.js";
import { paginationService, awsService, bulkExportService } from "../../../services/index.js";
import { customDateTimeHelper, customFileHelper } from "../../../helpers/index.js";
import { Sequelize, Op } from "sequelize";
import excel from "exceljs";
import admZip from "adm-zip";
import { envs, StatusError } from "../../../config/index.js";
import Stream from "stream";
import fs from "fs";

/**
 * downloadWorkList
 * @param req
 * @param res
 */
export const downloadWorkList = async (req, res, next) => {
  try {
    const reqBody = req.body;

    const selectedId = reqBody.selected_id ? reqBody.selected_id : [];
    const searchType = reqBody.search_type ? reqBody.search_type : "";
    const searchTitleName = reqBody.search_title_name ? reqBody.search_title_name : "";
    const searchIdType = reqBody.search_id_type ? reqBody.search_id_type : "";
    const searchId = reqBody.search_id ? reqBody.search_id : "";
    const searchDate = reqBody.search_date ? reqBody.search_date : "";
    const tivingId = reqBody.tiving_id ? reqBody.tiving_id : "";
    const exportType = reqBody.export_type ? reqBody.export_type : "xls";
    const languageFliter = req.accept_language ? req.accept_language : "";

    const userId = req.userDetails.userId;

    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";

    let resultData = [];

    const searchParams = {
      distinct: false,
      raw: false,
      defaultOrder: false,
    };

    const options = {
      encoding: "UTF-8",
    };

    const condition = {};
    const attributes = [
      "primary_id",
      "type",
      "type",
      "title",
      "unique_id",
      [
        Sequelize.fn("date_format", Sequelize.col("modified_date"), "%Y-%m-%d %H:%i:%s"),
        "modified_date",
      ],
      "tiving_id",
      "worker",
    ];

    if (sortOrder && sortBy == "type") {
      searchParams.sortOrderObj = [[Sequelize.literal("type"), sortOrder]];
    } else if (sortOrder && sortBy == "title") {
      searchParams.sortOrderObj = [[Sequelize.literal("title"), sortOrder]];
    } else if (sortOrder && sortBy == "unique_id") {
      searchParams.sortOrderObj = [[Sequelize.literal("unique_id"), sortOrder]];
    } else if (sortOrder && sortBy == "modified_date") {
      searchParams.sortOrderObj = [[Sequelize.literal("modified_date"), sortOrder]];
    } else if (sortOrder && sortBy == "tiving_id") {
      searchParams.sortOrderObj = [[Sequelize.literal("tiving_id"), sortOrder]];
    } else if (sortOrder && sortBy == "worker") {
      searchParams.sortOrderObj = [[Sequelize.literal("worker"), sortOrder]];
    }

    const includeQuery = [];
    if (searchType) {
      condition.type = searchType;
    }
    if (searchTitleName) {
      condition.title = { [Op.like]: `%${searchTitleName}%` };
    }
    if (searchIdType == "id") {
      condition.unique_id = searchId;
    } else if (searchIdType == "tiving_id") {
      condition.tiving_id = searchId;
    }
    if (searchDate) {
      condition[Sequelize.col("date(modified_date)")] = Sequelize.where(
        Sequelize.fn("date", Sequelize.col("modified_date")),
        searchDate,
      );
    }
    if (tivingId === "exist") {
      condition.tiving_id = { [Op.ne]: null };
    } else if (tivingId === "not_exist") {
      condition.tiving_id = { [Op.eq]: null };
    }

    if (selectedId.length > 0) {
      condition.unique_id = {
        [Op.in]: selectedId,
      };
    }
    if (languageFliter) {
      condition.language = languageFliter;
    }

    resultData = await paginationService.pagination(
      searchParams,
      model.worklistView,
      includeQuery,
      condition,
      attributes,
    );

    let totalCount = resultData.count;
    const s3 = new awsService.AWS.S3();
    const bucketName = envs.s3.BUCKET_NAME;

    if (exportType == "xls") {
      const stream = new Stream.PassThrough();
      const workbookPeople = new excel.Workbook();
      const workbookTV = new excel.Workbook();
      const workbookMovie = new excel.Workbook();
      /*** Used sheet header for Movie ***/
      // For Basic Sheet
      const worksheetBasicMovie = workbookMovie.addWorksheet("Basic");
      worksheetBasicMovie.columns = [
        { header: res.__("Type"), key: "type", width: 25 },
        { header: res.__("TITLE ID"), key: "id", width: 25 },
        { header: res.__("IMDB ID"), key: "imdb_id", width: 25 },
        { header: res.__("TVING ID"), key: "tiving_id", width: 25 },
        { header: res.__("TMDB ID"), key: "tmdb_id", width: 25 },
        { header: res.__("KOBIS ID"), key: "kobis_id", width: 25 },
        { header: res.__("ODK ID"), key: "kobis_id", width: 25 },
        { header: res.__("Title En"), key: "title_en", width: 25 },
        { header: res.__("Title Ko"), key: "title_ko", width: 25 },
        { header: res.__("AKA"), key: "aka", width: 25 },
        { header: res.__("Summary En"), key: "summary_en", width: 25 },
        { header: res.__("Summary Ko"), key: "summary_ko", width: 25 },
        { header: res.__("Plot Summary En"), key: "plot_summary_en", width: 25 },
        { header: res.__("Plot Summary Ko"), key: "plot_summary_ko", width: 25 },
        { header: res.__("Official Site"), key: "official_site", width: 25 },
        { header: res.__("Status"), key: "status", width: 25 },
        { header: res.__("Release Date"), key: "release_date", width: 25 },
        { header: res.__("Release Date To"), key: "release_date_to", width: 25 },
        { header: res.__("Is Rerelease"), key: "is_rerelease", width: 25 },
        { header: res.__("Re-release Date"), key: "rerelease_details", width: 25 },
        { header: res.__("Rating"), key: "rating", width: 25 },
        { header: res.__("Runtime"), key: "runtime", width: 25 },
        { header: res.__("Footfalls"), key: "footfalls", width: 25 },
        { header: res.__("Certification"), key: "certification", width: 25 },
        { header: res.__("Language"), key: "language", width: 25 },
        { header: res.__("Country"), key: "country", width: 25 },
        { header: res.__("Search Keyword"), key: "search_keywords", width: 25 },
        { header: res.__("News Search Keyword"), key: "news_search_keywords", width: 25 },
      ];

      worksheetBasicMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Original work Sheet
      const worksheetOriginalWorkMovie = workbookMovie.addWorksheet("Original Work");
      worksheetOriginalWorkMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("Type"), key: "ow_type", width: 25 },
        { header: res.__("Original Title"), key: "ow_title", width: 25 },
        { header: res.__("Original Artist"), key: "ow_original_artis", width: 25 },
        { header: res.__("Language"), key: "site_language", width: 25 },
      ];

      worksheetOriginalWorkMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Connection Sheet
      const worksheetForConnectionMovie = workbookMovie.addWorksheet("Connection");
      worksheetForConnectionMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("CONNECTION TITLE ID"), key: "related_title_id", width: 25 },
        { header: res.__("Name"), key: "name", width: 25 },
        { header: res.__("Image"), key: "image", width: 25 },
      ];

      worksheetForConnectionMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Series Sheet
      const worksheetForSeriesMovie = workbookMovie.addWorksheet("Series");
      worksheetForSeriesMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SERIES TITLE ID"), key: "related_series_title_id", width: 25 },
        { header: res.__("Name"), key: "name", width: 25 },
        { header: res.__("Image"), key: "image", width: 25 },
      ];

      worksheetForSeriesMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Watch Sheet
      const worksheetForWatchMovie = workbookMovie.addWorksheet("Watch");
      worksheetForWatchMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("PROVIDER ID"), key: "provider_id", width: 25 },
        { header: res.__("MOVIE ID"), key: "movie_id", width: 25 },
        { header: res.__("Provider Name"), key: "privider_name", width: 25 },
        { header: res.__("Icon"), key: "icon", width: 25 },
        { header: res.__("URL"), key: "url", width: 25 },
        { header: res.__("Watch Type"), key: "watch_type", width: 25 },
      ];

      worksheetForWatchMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Video Sheet
      const worksheetForVideoMovie = workbookMovie.addWorksheet("Media video");
      worksheetForVideoMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("Video Title"), key: "video_title", width: 25 },
        { header: res.__("Video URL"), key: "video_url", width: 25 },
        { header: res.__("Is Official Trailer"), key: "is_official_trailer", width: 25 },
      ];

      worksheetForVideoMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Movie Image Sheet
      const worksheetForImageMovie = workbookMovie.addWorksheet("Media image");
      worksheetForImageMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("Original File Name"), key: "original_name", width: 25 },
        { header: res.__("File Name"), key: "file_name", width: 25 },
        { header: res.__("Path"), key: "path", width: 25 },
        { header: res.__("Size"), key: "file_size", width: 25 },
        { header: res.__("Mime Type"), key: "mime_type", width: 25 },
        { header: res.__("Image Type"), key: "image_category", width: 25 },
      ];

      worksheetForImageMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Movie Credit Sheet
      const worksheetForCreditMovie = workbookMovie.addWorksheet("Credit");
      worksheetForCreditMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("Credit Type"), key: "department", width: 25 },
        { header: res.__("PEOPLE ID"), key: "people_id", width: 25 },
        { header: res.__("Cast/Crew Name"), key: "people_name", width: 25 },
        { header: res.__("Character Name"), key: "character_name", width: 25 },
        { header: res.__("Job"), key: "job", width: 25 },
        { header: res.__("Is Guest"), key: "is_guest", width: 25 },
        { header: res.__("Poster Image"), key: "poster", width: 25 },
      ];

      worksheetForCreditMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Movie Tag Sheet
      const worksheetForTagsMovie = workbookMovie.addWorksheet("Tag");
      worksheetForTagsMovie.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("CATEGORY ID"), key: "category_id", width: 25 },
        { header: res.__("Category Name"), key: "category_name", width: 25 },
        { header: res.__("Type"), key: "type", width: 25 },
        { header: res.__("TAG ID"), key: "tag_id", width: 25 },
        { header: res.__("Tag Name"), key: "display_name", width: 25 },
        { header: res.__("Score"), key: "score", width: 25 },
      ];

      worksheetForTagsMovie.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      /*** For People sheet header ***/
      // for People
      const worksheetPeopleBasic = workbookPeople.addWorksheet("Basic");
      worksheetPeopleBasic.columns = [
        { header: res.__("Type"), key: "type", width: 25 },
        { header: res.__("PEOPLE ID"), key: "id", width: 25 },
        { header: res.__("IMDB ID"), key: "imdb_id", width: 25 },
        { header: res.__("TVING ID"), key: "tiving_id", width: 25 },
        { header: res.__("TMDB ID"), key: "tmdb_id", width: 25 },
        { header: res.__("KOBIS ID"), key: "kobis_id", width: 25 },
        { header: res.__("ODK ID"), key: "odk_id", width: 25 },
        { header: res.__("Name En"), key: "name_en", width: 25 },
        { header: res.__("Name Ko"), key: "name_ko", width: 25 },
        { header: res.__("AKA"), key: "aka", width: 25 },
        { header: res.__("Summary En"), key: "summary_en", width: 25 },
        { header: res.__("Summary Ko"), key: "summary_ko", width: 25 },
        { header: res.__("Official Site"), key: "official_site", width: 25 },
        { header: res.__("Facebook Social Link"), key: "facebook_link", width: 25 },
        { header: res.__("Twitter Social Link"), key: "twitter_link", width: 25 },
        { header: res.__("Instagram Social Link"), key: "instagram_link", width: 25 },
        { header: res.__("Gender"), key: "gender", width: 25 },
        { header: res.__("Birth Date"), key: "birth_date", width: 25 },
        { header: res.__("Death Date"), key: "death_date", width: 25 },
        { header: res.__("Job"), key: "job", width: 25 },
        { header: res.__("Country"), key: "country", width: 25 },
        { header: res.__("Search Keyword"), key: "search_keywords", width: 25 },
        { header: res.__("News Search Keyword"), key: "news_search_keywords", width: 25 },
      ];

      worksheetPeopleBasic.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      const worksheetPeopleVideo = workbookPeople.addWorksheet("Media video");
      worksheetPeopleVideo.columns = [
        { header: res.__("PEOPLE ID"), key: "id", width: 25 },
        { header: res.__("Video Title"), key: "video_title", width: 25 },
        { header: res.__("Video URL"), key: "video_url", width: 25 },
        { header: res.__("Is Official Trailer"), key: "is_official_trailer", width: 25 },
      ];

      worksheetPeopleVideo.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      const worksheetPeopleImage = workbookPeople.addWorksheet("Media image");
      worksheetPeopleImage.columns = [
        { header: res.__("PEOPLE ID"), key: "id", width: 25 },
        { header: res.__("Original File Name"), key: "original_name", width: 25 },
        { header: res.__("File Name"), key: "file_name", width: 25 },
        { header: res.__("Path"), key: "path", width: 25 },
        { header: res.__("Size"), key: "file_size", width: 25 },
        { header: res.__("Mime Type"), key: "mime_type", width: 25 },
        { header: res.__("Image Type"), key: "image_category", width: 25 },
      ];

      worksheetPeopleImage.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      /*** For Tv sheet header ***/
      // for TV Section
      const worksheetTVBasic = workbookTV.addWorksheet("Basic");
      worksheetTVBasic.columns = [
        { header: res.__("Type"), key: "type", width: 25 },
        { header: res.__("TITLE ID"), key: "id", width: 25 },
        { header: res.__("IMDB ID"), key: "imdb_id", width: 25 },
        { header: res.__("TVING ID"), key: "tiving_id", width: 25 },
        { header: res.__("TMDB ID"), key: "tmdb_id", width: 25 },
        { header: res.__("KOBIS ID"), key: "kobis_id", width: 25 },
        { header: res.__("ODK ID"), key: "odk_id", width: 25 },
        { header: res.__("Title En"), key: "name_en", width: 25 },
        { header: res.__("Title Ko"), key: "name_ko", width: 25 },
        { header: res.__("AKA"), key: "aka", width: 25 },
        { header: res.__("Summary En"), key: "summary_en", width: 25 },
        { header: res.__("Summary Ko"), key: "summary_ko", width: 25 },
        { header: res.__("Official Site"), key: "official_site", width: 25 },
        { header: res.__("Status"), key: "status", width: 25 },
        { header: res.__("Release Date"), key: "release_date", width: 25 },
        { header: res.__("Release Date To"), key: "release_date_to", width: 25 },
        { header: res.__("Rating"), key: "rating", width: 25 },
        { header: res.__("Runtime"), key: "runtime", width: 25 },
        { header: res.__("Footfalls"), key: "footfalls", width: 25 },
        { header: res.__("Certification"), key: "certification", width: 25 },
        { header: res.__("Language"), key: "language", width: 25 },
        { header: res.__("Country"), key: "country", width: 25 },
        { header: res.__("Search Keyword"), key: "search_keywords", width: 25 },
      ];
      worksheetTVBasic.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      const worksheetTVOriginalWork = workbookTV.addWorksheet("Original work");
      worksheetTVOriginalWork.columns = [
        { header: res.__("TITLE ID"), key: "id", width: 25 },
        { header: res.__("Type"), key: "type", width: 25 },
        { header: res.__("Original Title"), key: "original_title", width: 25 },
        { header: res.__("Original Artist"), key: "original_artist", width: 25 },
        { header: res.__("Language"), key: "site_language", width: 25 },
      ];
      worksheetTVOriginalWork.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      const worksheetTVConnection = workbookTV.addWorksheet("Connection");
      worksheetTVConnection.columns = [
        { header: res.__("TITLE ID"), key: "id", width: 25 },
        { header: res.__("CONNECTION TITLE ID"), key: "connection_title_id", width: 25 },
        { header: res.__("Name"), key: "name", width: 25 },
        { header: res.__("Image"), key: "image", width: 25 },
      ];
      worksheetTVConnection.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      const worksheetTVSeason = workbookTV.addWorksheet("Season");
      worksheetTVSeason.columns = [
        { header: res.__("TITLE ID"), key: "id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("Season Number"), key: "season_number", width: 25 },
        { header: res.__("Season Name En"), key: "season_name_en", width: 25 },
        { header: res.__("Season Name Ko"), key: "season_name_ko", width: 25 },
        { header: res.__("Aka"), key: "aka", width: 25 },
        { header: res.__("Summary En"), key: "summary_en", width: 25 },
        { header: res.__("Summary Ko"), key: "summary_ko", width: 25 },
        { header: res.__("Release date"), key: "release_date", width: 25 },
        { header: res.__("Episode Count"), key: "episode_count", width: 25 },
        { header: res.__("Search Keyword"), key: "season_keyword", width: 25 },
        { header: res.__("News Search Keyword"), key: "news_season_keyword", width: 25 },
        { header: res.__("Poster Image"), key: "poster_image", width: 25 },
        { header: res.__("Channel"), key: "channels", width: 25 },
      ];
      worksheetTVSeason.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Watch Sheet for Tv
      const worksheetForWatchTv = workbookTV.addWorksheet("Watch");
      worksheetForWatchTv.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("PROVIDER ID"), key: "provider_id", width: 25 },
        { header: res.__("MOVIE ID"), key: "movie_id", width: 25 },
        { header: res.__("Provider Name"), key: "privider_name", width: 25 },
        { header: res.__("Icon"), key: "icon", width: 25 },
        { header: res.__("URL"), key: "url", width: 25 },
        { header: res.__("Watch Type"), key: "watch_type", width: 25 },
      ];

      worksheetForWatchTv.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Episode Sheet for Tv
      const worksheetForEpisodeTv = workbookTV.addWorksheet("Episode");
      worksheetForEpisodeTv.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("EPISODE ID"), key: "id", width: 25 },
        { header: res.__("Episode Number"), key: "episode_number", width: 25 },
        { header: res.__("Episode Title En"), key: "episode_title_en", width: 25 },
        { header: res.__("Episode Title Ko"), key: "episode_title_ko", width: 25 },
        { header: res.__("Episode Summary En"), key: "episode_summary_en", width: 25 },
        { header: res.__("Episode Summary Ko"), key: "koEpisodeDescription", width: 25 },
        { header: res.__("Episode Date"), key: "episode_date", width: 25 },
        { header: res.__("Poster Image"), key: "episode_image", width: 25 },
      ];

      worksheetForEpisodeTv.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Video Sheet
      const worksheetForVideoTv = workbookTV.addWorksheet("Media video");
      worksheetForVideoTv.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("Video Title"), key: "video_title", width: 25 },
        { header: res.__("Video URL"), key: "video_url", width: 25 },
        { header: res.__("Is Official Trailer"), key: "is_official_trailer", width: 25 },
      ];

      worksheetForVideoTv.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Tv Image Sheet
      const worksheetForImageTv = workbookTV.addWorksheet("Media image");
      worksheetForImageTv.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("Original File Name"), key: "original_name", width: 25 },
        { header: res.__("File Name"), key: "file_name", width: 25 },
        { header: res.__("Path"), key: "path", width: 25 },
        { header: res.__("Size"), key: "file_size", width: 25 },
        { header: res.__("Mime Type"), key: "mime_type", width: 25 },
        { header: res.__("Image Type"), key: "image_category", width: 25 },
      ];

      worksheetForImageTv.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Tv Credit Sheet
      const worksheetForCreditTv = workbookTV.addWorksheet("Credit");
      worksheetForCreditTv.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("Credit Type"), key: "department", width: 25 },
        { header: res.__("PEOPLE ID"), key: "people_id", width: 25 },
        { header: res.__("Cast/Crew Name"), key: "people_name", width: 25 },
        { header: res.__("Character Name"), key: "character_name", width: 25 },
        { header: res.__("Job"), key: "job", width: 25 },
        { header: res.__("Is Guest"), key: "is_guest", width: 25 },
        { header: res.__("Poster Image"), key: "poster", width: 25 },
      ];

      worksheetForCreditTv.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      // For Tv Tag Sheet
      const worksheetForTagsTv = workbookTV.addWorksheet("Tag");
      worksheetForTagsTv.columns = [
        { header: res.__("TITLE ID"), key: "title_id", width: 25 },
        { header: res.__("SEASON ID"), key: "season_id", width: 25 },
        { header: res.__("CATEGORY ID"), key: "category_id", width: 25 },
        { header: res.__("Category Name"), key: "category_name", width: 25 },
        { header: res.__("Type"), key: "type", width: 25 },
        { header: res.__("TAG ID"), key: "tag_id", width: 25 },
        { header: res.__("Tag Name"), key: "display_name", width: 25 },
        { header: res.__("Score"), key: "score", width: 25 },
      ];

      worksheetForTagsTv.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      let tvCnt = 0;
      let movieCnt = 0;
      let peopleCnt = 0;
      if (resultData && resultData.rows.length > 0) {
        for (const row of resultData.rows) {
          if (row) {
            const getType = row.dataValues.type ? row.dataValues.type : "";
            const getId = row.dataValues.primary_id;
            if (getType === "tv") {
              let getTVBasicData = {};
              let getTVOriginalWorkData = [];
              let getTVConnectionData = [];
              let getTVSeasonData = [];
              let getTvWatchData = {};
              let getTvEpisodeData = {};
              let getTvVideoData = {};
              let getTvImageData = {};
              let getTvCreditData = {};
              let getTvTagData = {};
              [
                getTVBasicData,
                getTVOriginalWorkData,
                getTVConnectionData,
                getTVSeasonData,
                getTvWatchData,
                getTvEpisodeData,
                getTvVideoData,
                getTvImageData,
                getTvCreditData,
                getTvTagData,
              ] = await Promise.all([
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "basic"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "original_work"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "connection"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "season"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "watch"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "episode"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "video"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "image"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "credit"),
                bulkExportService.getTvXlsBulkExportData(getId, languageFliter, "tag"),
              ]);
              worksheetTVBasic.addRow(getTVBasicData);
              if (getTVOriginalWorkData && getTVOriginalWorkData.length > 0) {
                for (const data of getTVOriginalWorkData) {
                  worksheetTVOriginalWork.addRow(data);
                }
              }
              if (getTVConnectionData && getTVConnectionData.length > 0) {
                for (const data of getTVConnectionData) {
                  worksheetTVConnection.addRow(data);
                }
              }
              if (getTVSeasonData && getTVSeasonData.length > 0) {
                for (const data of getTVSeasonData) {
                  worksheetTVSeason.addRow(data);
                }
              }
              // For Tv watch list
              if (getTvWatchData && getTvWatchData.length > 0) {
                for (const data of getTvWatchData) {
                  worksheetForWatchTv.addRow(data);
                }
              }

              // For Tv Episode list
              if (getTvEpisodeData && getTvEpisodeData.length > 0) {
                for (const data of getTvEpisodeData) {
                  worksheetForEpisodeTv.addRow(data);
                }
              }

              // For Tv video list
              if (getTvVideoData && getTvVideoData.length > 0) {
                for (const data of getTvVideoData) {
                  worksheetForVideoTv.addRow(data);
                }
              }

              // For Tv image list
              if (getTvImageData && getTvImageData.length > 0) {
                for (const data of getTvImageData) {
                  worksheetForImageTv.addRow(data);
                }
              }

              // For Tv credit list
              if (getTvCreditData && getTvCreditData.length > 0) {
                for (const data of getTvCreditData) {
                  worksheetForCreditTv.addRow(data);
                }
              }

              // For Tv Tags list
              if (getTvTagData && getTvTagData.length > 0) {
                for (const data of getTvTagData) {
                  worksheetForTagsTv.addRow(data);
                }
              }
              tvCnt = tvCnt + 1;
            }
            if (getType == "movie") {
              let getMovieBasicData = {};
              let getMovieOriginalData = {};
              let getMovieConnectionData = {};
              let getMovieSeriesData = {};
              let getMovieWatchData = {};
              let getMovieVideoData = {};
              let getMovieImageData = {};
              let getMovieCreditData = {};
              let getMovieTagData = {};
              // Promise All
              [
                getMovieBasicData,
                getMovieOriginalData,
                getMovieConnectionData,
                getMovieSeriesData,
                getMovieWatchData,
                getMovieVideoData,
                getMovieImageData,
                getMovieCreditData,
                getMovieTagData,
              ] = await Promise.all([
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "basic"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "original-work"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "connection"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "series"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "watch"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "video"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "image"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "credit"),
                bulkExportService.getMovieXlsBulkExportData(getId, languageFliter, "tag"),
              ]);

              worksheetBasicMovie.addRow(getMovieBasicData);
              // For Movie Original work list
              if (getMovieOriginalData && getMovieOriginalData.length > 0) {
                for (const data of getMovieOriginalData) {
                  worksheetOriginalWorkMovie.addRow(data);
                }
              }

              // For Movie connection list
              if (getMovieConnectionData && getMovieConnectionData.length > 0) {
                for (const data of getMovieConnectionData) {
                  worksheetForConnectionMovie.addRow(data);
                }
              }

              // For Movie series list
              if (getMovieSeriesData && getMovieSeriesData.length > 0) {
                for (const data of getMovieSeriesData) {
                  worksheetForSeriesMovie.addRow(data);
                }
              }

              // For Movie watch list
              if (getMovieWatchData && getMovieWatchData.length > 0) {
                for (const data of getMovieWatchData) {
                  worksheetForWatchMovie.addRow(data);
                }
              }

              // For Movie video list
              if (getMovieVideoData && getMovieVideoData.length > 0) {
                for (const data of getMovieVideoData) {
                  worksheetForVideoMovie.addRow(data);
                }
              }

              // For Movie image list
              if (getMovieImageData && getMovieImageData.length > 0) {
                for (const data of getMovieImageData) {
                  worksheetForImageMovie.addRow(data);
                }
              }

              // For Movie credit list
              if (getMovieCreditData && getMovieCreditData.length > 0) {
                for (const data of getMovieCreditData) {
                  worksheetForCreditMovie.addRow(data);
                }
              }

              // For Movie Tags list
              if (getMovieTagData && getMovieTagData.length > 0) {
                for (const data of getMovieTagData) {
                  worksheetForTagsMovie.addRow(data);
                }
              }
              movieCnt = movieCnt + 1;
            }

            if (getType == "people") {
              let getPeopleBasicData = {};
              let getPeopleVideoData = [];
              let getPeopleImageData = [];
              [getPeopleBasicData, getPeopleVideoData, getPeopleImageData] = await Promise.all([
                bulkExportService.getPeopleXlsBulkExportData(getId, languageFliter, "basic"),
                bulkExportService.getPeopleXlsBulkExportData(getId, languageFliter, "media_video"),
                bulkExportService.getPeopleXlsBulkExportData(getId, languageFliter, "media_image"),
              ]);
              worksheetPeopleBasic.addRow(getPeopleBasicData);
              if (getPeopleVideoData && getPeopleVideoData.length > 0) {
                for (const data of getPeopleVideoData) {
                  worksheetPeopleVideo.addRow(data);
                }
              }
              if (getPeopleImageData && getPeopleImageData.length > 0) {
                for (const dt of getPeopleImageData) {
                  worksheetPeopleImage.addRow(dt);
                }
              }
              peopleCnt = peopleCnt + 1;
            }

            // worksheet.addRow(row);
          }
        }
      } else {
        throw StatusError.badRequest(res.__("no records to export"));
      }

      if (
        (peopleCnt > 0 && tvCnt > 0) ||
        (movieCnt > 0 && tvCnt > 0) ||
        (movieCnt > 0 && peopleCnt > 0)
      ) {
        const zip = new admZip();
        const downloadPath = "public/download_file/";

        const curDate = await customDateTimeHelper.changeDateFormat(Date.now(), "YYYYMMDD_HHmmss");
        if (movieCnt > 0) {
          // Add movie xls file in Zip folder
          const movieFilename = `movie_${curDate}.xlsx`;
          await workbookMovie.xlsx.writeFile(`${downloadPath}/${movieFilename}`, options);
          zip.addLocalFile(downloadPath + movieFilename);
          customFileHelper.customFileUnlink(fs, downloadPath + movieFilename);
        }

        if (peopleCnt > 0) {
          // Add people xls file in Zip folder
          const peopleFilename = `people_${curDate}.xlsx`;
          await workbookPeople.xlsx.writeFile(`${downloadPath}/${peopleFilename}`, options);
          zip.addLocalFile(downloadPath + peopleFilename);
          customFileHelper.customFileUnlink(fs, downloadPath + peopleFilename);
        }

        if (tvCnt > 0) {
          // Add Tv xls file in Zip folder
          const tvFilename = `tv_${curDate}.xlsx`;
          await workbookTV.xlsx.writeFile(`${downloadPath}/${tvFilename}`, options);
          zip.addLocalFile(downloadPath + tvFilename);
          customFileHelper.customFileUnlink(fs, downloadPath + tvFilename);
        }
        const path = `${bucketName}/downloads/exports/work-list`;
        const downloadName = `export_data_${curDate}.zip`;
        zip.writeZip(`${downloadPath}${downloadName}`);

        s3.upload({
          Bucket: path,
          Key: downloadName,
          Body: zip.toBuffer(),
          ACL: "public-read",
        })
          .promise()
          .then(async (data) => {
            const successFile = {
              file_name: downloadName,
              file_path: data.Location,
              remarks: `Finished Exporting ${totalCount} xls Works`,
              export_status: "success",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.exportData.create(successFile);
            res.ok({
              path: Buffer.from(`${downloadPath}${downloadName}`).toString("hex"),
            });
          })
          .catch(async (err) => {
            const failedFile = {
              file_name: downloadName,
              file_path: "",
              remarks: "error in export",
              export_status: "failed",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.exportData.create(failedFile);
            throw StatusError.badRequest(res.__("error in export"));
          });
      } else {
        const curDate = await customDateTimeHelper.changeDateFormat(Date.now(), "YYYYMMDD_HHmmss");

        const path = `${bucketName}/downloads/exports/work-list`;
        const downloadPath = "public/download_file/";
        if (movieCnt > 0) {
          const filename = `movie_${curDate}.xlsx`;
          await workbookMovie.xlsx.writeFile(`${downloadPath}/${filename}`, options);
          workbookMovie.xlsx.write(stream).then(async () => {
            return s3
              .upload({
                Bucket: path,
                Key: filename,
                Body: stream,
                ACL: "public-read",
              })
              .promise()
              .then(async (data) => {
                const successFile = {
                  file_name: filename,
                  file_path: data.Location,
                  remarks: `Finished Exporting ${totalCount} xls Works`,
                  export_status: "success",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.exportData.create(successFile);
                res.ok({
                  path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
                });
              })
              .catch(async (err) => {
                const failedFile = {
                  file_name: filename,
                  file_path: "",
                  remarks: "error in export",
                  export_status: "failed",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.exportData.create(failedFile);
                throw StatusError.badRequest(res.__("error in export"));
              });
          });
        } else if (tvCnt > 0) {
          const filename = `tv_${curDate}.xlsx`;
          await workbookTV.xlsx.writeFile(`${downloadPath}/${filename}`, options);
          workbookTV.xlsx.write(stream).then(async () => {
            return s3
              .upload({
                Bucket: path,
                Key: filename,
                Body: stream,
                ACL: "public-read",
              })
              .promise()
              .then(async (data) => {
                const successFile = {
                  file_name: filename,
                  file_path: data.Location,
                  remarks: `Finished Exporting ${totalCount} xls Works`,
                  export_status: "success",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.exportData.create(successFile);
                res.ok({
                  path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
                });
              })
              .catch(async (err) => {
                const failedFile = {
                  file_name: filename,
                  file_path: "",
                  remarks: "error in export",
                  export_status: "failed",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.exportData.create(failedFile);
                throw StatusError.badRequest(res.__("error in export"));
              });
          });
        } else if (peopleCnt > 0) {
          const filename = `people_${curDate}.xlsx`;
          await workbookPeople.xlsx.writeFile(`${downloadPath}/${filename}`, options);
          workbookPeople.xlsx.write(stream).then(async () => {
            return s3
              .upload({
                Bucket: path,
                Key: filename,
                Body: stream,
                ACL: "public-read",
              })
              .promise()
              .then(async (data) => {
                const successFile = {
                  file_name: filename,
                  file_path: data.Location,
                  remarks: `Finished Exporting ${totalCount} xls Works`,
                  export_status: "success",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.exportData.create(successFile);
                res.ok({
                  path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
                });
              })
              .catch(async (err) => {
                const failedFile = {
                  file_name: filename,
                  file_path: "",
                  remarks: "error in export",
                  export_status: "failed",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.exportData.create(failedFile);
                throw StatusError.badRequest(res.__("error in export"));
              });
          });
        } else {
          throw StatusError.badRequest(res.__("no records to export"));
        }
      }
    } else if (exportType == "json") {
      const jsonData = {};
      const totalData = [];
      if (resultData && resultData.rows.length > 0) {
        for (const eachRow of resultData.rows) {
          let getData = {};
          if (eachRow) {
            const getType = eachRow.dataValues.type ? eachRow.dataValues.type : "";
            const getId = eachRow.dataValues.primary_id;
            if (getType == "tv") {
              // Tv service come here
              getData = await bulkExportService.getTvBulkExportData(getId, languageFliter);
            }
            if (getType == "movie") {
              // Movie service come here
              getData = await bulkExportService.getMovieBulkExportData(getId, languageFliter);
            }
            if (getType == "people") {
              // People service come here
              getData = await bulkExportService.peopleBulkExportData(getId, languageFliter);
            }

            totalData.push(getData);
          }
        }
        //jsonData.data = resultData.rows;
        jsonData.data = totalData;
      } else {
        throw StatusError.badRequest(res.__("no records to export"));
      }
      const filename = `worklist_${Date.now()}.json`;
      const path = `${bucketName}/downloads/exports/work-list`;
      const downloadPath = "public/download_file/";
      var buf = Buffer.from(JSON.stringify(jsonData));
      fs.writeFileSync(`${downloadPath}/${filename}`, JSON.stringify(jsonData), "utf8");
      s3.upload({
        Bucket: path,
        Key: filename,
        Body: buf,
        ACL: "public-read",
      })
        .promise()
        .then(async (data) => {
          const successFile = {
            file_name: filename,
            file_path: data.Location,
            remarks: `Finished Exporting ${totalCount} xls Works`,
            export_status: "success",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: userId,
          };
          await model.exportData.create(successFile);
          res.ok({
            path: Buffer.from(`${downloadPath}${filename}`).toString("hex"),
          });
        })
        .catch(async (err) => {
          const failedFile = {
            file_name: filename,
            file_path: "",
            remarks: "error in export",
            export_status: "failed",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: userId,
          };
          await model.exportData.create(failedFile);
          throw StatusError.badRequest(res.__("error in export"));
        });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
