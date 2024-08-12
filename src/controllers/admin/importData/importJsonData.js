import model from "../../../models/index.js";
import { awsService, titleService } from "../../../services/index.js";
import { Op } from "sequelize";
import { envs } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * importJsonData
 * @param req
 * @param res
 */
export const importJsonData = async (req, res, next) => {
  try {
    const s3 = new awsService.AWS.S3();
    const bucketName = envs.s3.BUCKET_NAME;
    let jsonData = [];
    const userId = req.userDetails.userId;

    if (req.file) {
      const fileDetails = req.file;
      let isFailed = false;

      //Insert Json file details in imported_files table
      const originalname = fileDetails.originalname ? fileDetails.originalname : "";
      const filename = fileDetails.key ? fileDetails.key : "";
      const insertJsonFile = {
        file_original_name: originalname,
        file_name: filename,
        upload_status: "completed",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      const importFileData = await model.importFiles.create(insertJsonFile);
      const importedFileId = importFileData.id;

      //Read Json sheet
      const params = {
        Bucket: bucketName + "/uploads/bulks/import",
        Key: fileDetails.key,
      };
      const stream = await s3.getObject(params).promise();
      jsonData = JSON.parse(stream.Body.toString("utf8")).data;

      if (jsonData.length > 0) {
        for (let getValue of jsonData) {
          const getType = getValue["type"] ? getValue["type"] : "";
          const getDefaultLanguage = getValue["default_language"];
          const getTmdbId =
            getValue["tmdb_id"] !== null &&
            getValue["tmdb_id"] !== "" &&
            getValue["tmdb_id"] !== undefined
              ? getValue["tmdb_id"]
              : "";
          const getKobisId =
            getValue["kobis_id"] !== null &&
            getValue["kobis_id"] !== "" &&
            getValue["kobis_id"] !== undefined
              ? getValue["kobis_id"]
              : "";
          const getImdbId =
            getValue["imdb_id"] !== null &&
            getValue["imdb_id"] !== "" &&
            getValue["imdb_id"] !== undefined
              ? getValue["imdb_id"]
              : "";
          const getTivingId =
            getValue["tiving_id"] !== null &&
            getValue["tiving_id"] !== "" &&
            getValue["tiving_id"] !== undefined
              ? getValue["tiving_id"]
              : "";
          const getTitle =
            getValue["title_name"] !== null &&
            getValue["title_name"] !== "" &&
            getValue["title_name"] !== undefined
              ? getValue["title_name"]
              : "";
          const getAka =
            getValue["aka"] !== null && getValue["aka"] !== "" && getValue["aka"] !== undefined
              ? getValue["aka"]
              : "";
          const getSummery =
            getValue["summary"] !== null &&
            getValue["summary"] !== "" &&
            getValue["summary"] !== undefined
              ? getValue["summary"]
              : "";
          // Generate Unik Code
          const whl = true;
          let generatedCode = "";
          while (whl) {
            generatedCode = await generalHelper.generateBulkImportCode(getType);
            const isExists = await model.importData.findOne({
              where: { uuid: generatedCode },
            });
            if (!isExists) {
              break;
            }
          }

          // Check if type is not(movie,tv,people)
          if (getType != "movie" && getType != "tv" && getType != "people") {
            const insertData = {
              imported_file_id: importedFileId,
              type: getType,
              uuid: generatedCode,
              tmdb_id: getTmdbId,
              kobis_id: getKobisId,
              imdb_id: getImdbId,
              tiving_id: getTivingId,
              title_name: getTitle,
              aka: getAka,
              description: getSummery,
              message: "Type must be movie/tv/people",
              import_status: "failure",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.importData.create(insertData);
            isFailed = true;
          } else {
            const getPlot =
              getValue["plot"] !== null && getValue["plot"] !== "" && getValue["plot"] !== undefined
                ? getValue["plot"]
                : "";
            const getOfficialSite =
              getValue["official_site"] !== null &&
              getValue["official_site"] !== "" &&
              getValue["official_site"] !== undefined
                ? getValue["official_site"]
                : "";
            const getSearchKeyword = getValue["search_keyword"];
            const getNewsSearchKeyword = getValue["news_search_keyword"];
            const getStatus = getValue["status"];
            const releaseDate =
              getValue["release_date"] !== null &&
              getValue["release_date"] !== "" &&
              getValue["release_date"] !== undefined
                ? await customDateTimeHelper.checkDateFormat(getValue["release_date"])
                : null;
            const getReReleaseDateValue =
              getValue["re_release_date"] !== null &&
              getValue["re_release_date"] !== "" &&
              getValue["re_release_date"] !== undefined
                ? getValue["re_release_date"]
                : null;
            const getFootfalls =
              getValue["footfalls"] !== null &&
              getValue["footfalls"] !== "" &&
              getValue["footfalls"] !== undefined
                ? Number.isInteger(Number(getValue["footfalls"])) == true
                  ? getValue["footfalls"]
                  : null
                : null;
            const getRuntime =
              getValue["runtime"] !== null &&
              getValue["runtime"] !== "" &&
              getValue["runtime"] !== undefined
                ? Number.isInteger(Number(getValue["runtime"])) == true
                  ? getValue["runtime"]
                  : null
                : null;
            //const getCertification = 8;
            const getCertification =
              getValue["certification"] !== null &&
              getValue["certification"] !== "" &&
              getValue["certification"] !== undefined
                ? Number.isInteger(Number(getValue["certification"])) == true
                  ? getValue["certification"]
                  : getValue["certification"]
                : "";
            const getLanguage =
              getValue["language"] !== null &&
              getValue["language"] !== "" &&
              getValue["language"] !== undefined
                ? getValue["language"]
                : "";
            const getCountry =
              getValue["country"] !== null &&
              getValue["country"] !== "" &&
              getValue["country"] !== undefined
                ? getValue["country"]
                : "";
            const getTagGenre =
              getValue["tags"] !== null && getValue["tags"] !== "" && getValue["tags"] !== undefined
                ? getValue["tags"]
                : "";
            const getBiography =
              getValue["biography"] !== null &&
              getValue["biography"] !== "" &&
              getValue["biography"] !== undefined
                ? getValue["biography"]
                : "";
            const getFacebookLink =
              getValue["social_media"]["facebook_link"] !== null &&
              getValue["social_media"]["facebook_link"] !== "" &&
              getValue["social_media"]["facebook_link"] !== undefined
                ? getValue["social_media"]["facebook_link"]
                : "";
            const getTwitterLink =
              getValue["social_media"]["twitter_link"] !== null &&
              getValue["social_media"]["twitter_link"] !== "" &&
              getValue["social_media"]["twitter_link"] !== undefined
                ? getValue["social_media"]["twitter_link"]
                : "";
            const getInstagramLink =
              getValue["social_media"]["instagram_link"] !== null &&
              getValue["social_media"]["instagram_link"] !== "" &&
              getValue["social_media"]["instagram_link"] !== undefined
                ? getValue["social_media"]["instagram_link"]
                : "";
            const getGender =
              getValue["gender"] !== null &&
              getValue["gender"] !== "" &&
              getValue["gender"] !== undefined
                ? getValue["gender"]
                : "";
            const birthDate =
              getValue["birth_date"] !== null &&
              getValue["birth_date"] !== "" &&
              getValue["birth_date"] !== undefined
                ? await customDateTimeHelper.checkDateFormat(getValue["birth_date"])
                : "";
            const deathDate =
              getValue["death_date"] !== null &&
              getValue["death_date"] !== "" &&
              getValue["death_date"] !== undefined
                ? await customDateTimeHelper.checkDateFormat(getValue["death_date"])
                : true;

            // Store json country comma separator value in an array
            let getCountryArray = [];
            if (getCountry !== null && getCountry !== "" && getCountry !== undefined) {
              getCountryArray = getCountry.split(",");
            }
            // Store json Genre tag comma separator value in an array
            let getTagGenreArray = [];
            if (getTagGenre !== null && getTagGenre !== "" && getTagGenre !== undefined) {
              getTagGenreArray = getTagGenre.split(",");
            }

            // Store json Re-release date comma separator value in an array
            let getReReleaseArray = [];
            if (
              getReReleaseDateValue !== null &&
              getReReleaseDateValue !== "" &&
              getReReleaseDateValue !== undefined
            ) {
              getReReleaseArray = getReReleaseDateValue.split(",");
            }

            // Store json Search keyword comma separator value in an array
            let getSearchKeywordArray = [];
            if (
              getSearchKeyword !== null &&
              getSearchKeyword !== "" &&
              getSearchKeyword !== undefined
            ) {
              getSearchKeywordArray = getSearchKeyword.split(",");
            }

            // Store json News Search keyword comma separator value in an array
            let getNewsSearchKeywordArray = [];
            if (
              getNewsSearchKeyword !== null &&
              getNewsSearchKeyword !== "" &&
              getNewsSearchKeyword !== undefined
            ) {
              getNewsSearchKeywordArray = getNewsSearchKeyword.split(",");
            }

            let errorMessage = [];
            let errorText = "";
            let getCountryList = [];
            let getGenreList = [];
            let setLanguage = ["en", "ko"];

            let certificationValue = "";
            let checkStatusValue = "";
            let checkGenderValue = "";
            let checkPeopleName = "";
            if (getType == "movie" || getType == "tv") {
              certificationValue = await generalHelper.titleCertificationList(
                getType,
                getCertification,
              );

              checkStatusValue = await generalHelper.titleStatus(getType, getStatus);
            }
            if (getType == "people") {
              checkGenderValue = await generalHelper.genderList(getGender);
              checkPeopleName = await generalHelper.checkStringForNumbers(getTitle);
            }

            // Get Country
            const countryList = await model.country.findAll({
              attributes: ["id", "country_name"],
              where: { status: "active" },
              include: [
                {
                  model: model.countryTranslation,
                  attributes: [
                    "country_id",
                    ["country_name", "country_translation_name"],
                    "site_language",
                  ],
                  left: true,
                  where: { status: "active" },
                  required: true,
                },
              ],
            });

            if (countryList) {
              let list = [];
              for (const eachRow of countryList) {
                if (eachRow) {
                  const record = {
                    country_id:
                      eachRow.countryTranslations[0] &&
                      eachRow.countryTranslations[0].dataValues.country_id
                        ? eachRow.countryTranslations[0].dataValues.country_id
                        : "",
                    country_name:
                      eachRow.countryTranslations[0] &&
                      eachRow.countryTranslations[0].dataValues.country_translation_name
                        ? eachRow.countryTranslations[0].dataValues.country_translation_name
                        : "",
                  };
                  list.push(record);
                }
              }
              getCountryList = list;
            }

            // get genre list
            let getGenre = await model.tag.findAll({
              attributes: ["id", "type"],
              where: {
                type: "genre",
                status: "active",
              },
              include: [
                {
                  model: model.tagTranslation,
                  attributes: ["tag_id", "display_name", "site_language"],
                  left: true,
                  where: { status: "active" },
                  required: true,
                },
              ],
            });

            if (getGenre) {
              let list = [];
              for (const eachRow of getGenre) {
                if (eachRow) {
                  const record = {
                    tag_id: eachRow.tagTranslations[0].tag_id
                      ? eachRow.tagTranslations[0].tag_id
                      : "",
                    genre_name: eachRow.tagTranslations[0].display_name
                      ? eachRow.tagTranslations[0].display_name
                      : "",
                  };
                  list.push(record);
                }
              }
              getGenreList = list;
            }

            // When type is movie
            if (getType === "movie") {
              // TMBD & KOBIS, Tiving checking
              let includeWhere = { tmdb_id: getTmdbId, record_status: "active" };
              let getInformations = {};
              if (getTmdbId && getKobisId) {
                includeWhere = {
                  [Op.or]: [{ tmdb_id: getTmdbId }, { kobis_id: getKobisId }],
                  record_status: "active",
                };
              }
              if (getTmdbId && getKobisId && getTivingId) {
                includeWhere = {
                  [Op.or]: [
                    { tmdb_id: getTmdbId },
                    { kobis_id: getKobisId },
                    { tiving_id: getTivingId },
                  ],
                  record_status: "active",
                };
              }
              getInformations = await model.title.findOne({
                attributes: ["id", "type", "release_date"],
                where: includeWhere,
              });
              // Insert data into 'import data logs' table
              if (getInformations) {
                const insertData = {
                  imported_file_id: importedFileId,
                  item_id: getInformations.id,
                  type: getType,
                  uuid: generatedCode,
                  tmdb_id: getTmdbId,
                  kobis_id: getKobisId,
                  imdb_id: getImdbId,
                  tiving_id: getTivingId,
                  title_name: getTitle,
                  aka: getAka,
                  description: getSummery,
                  message: "Already exist!",
                  import_status: "duplicate",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.importData.create(insertData);
              } else {
                let failureValue = "";
                // check Status
                if (
                  checkStatusValue == "" &&
                  getStatus !== null &&
                  getStatus !== "" &&
                  getStatus !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Movie status is not match with default status.";
                  errorMessage.push(errorText);
                }

                // check language
                if (
                  !setLanguage.includes(getDefaultLanguage) &&
                  getDefaultLanguage !== null &&
                  getDefaultLanguage !== "" &&
                  getDefaultLanguage !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Default language will be (en/ko).";
                  errorMessage.push(errorText);
                }

                // check Certification
                if (
                  certificationValue == "" &&
                  getCertification !== null &&
                  getCertification !== "" &&
                  getCertification !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Movie certification is not match with default certification.";
                  errorMessage.push(errorText);
                }

                //check release date
                const getReleaseDate =
                  getValue["release_date"] !== null &&
                  getValue["release_date"] !== "" &&
                  getValue["release_date"] !== undefined
                    ? await customDateTimeHelper.changeDateFormat(
                        getValue["release_date"],
                        "YYYY-MM-DD",
                      )
                    : null;
                if (releaseDate == false && releaseDate !== "") {
                  failureValue = 1;
                  errorText = "Release date format will be(YYYY-MM-DD)";
                  errorMessage.push(errorText);
                }

                // check re-release date
                if (getReReleaseArray.length > 0) {
                  for (const element of getReReleaseArray) {
                    const checkReReleaseDate = await customDateTimeHelper.checkDateFormat(element);
                    if (checkReReleaseDate == false && checkReReleaseDate !== "") {
                      failureValue = 1;
                      errorText = "Re-release date format will be(YYYY-MM-DD)";
                      errorMessage.push(errorText);
                    }
                  }
                }

                // Insert error message
                if (failureValue == 1) {
                  const insertData = {
                    imported_file_id: importedFileId,
                    item_id: null,
                    type: getType,
                    uuid: generatedCode,
                    tmdb_id: getTmdbId,
                    kobis_id: getKobisId,
                    imdb_id: getImdbId,
                    tiving_id: getTivingId,
                    title_name: getTitle,
                    aka: getAka,
                    description: getSummery,
                    message: errorMessage.length > 0 ? JSON.stringify(errorMessage) : "",
                    import_status: "failure",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  await model.importData.create(insertData);
                  isFailed = true;
                }

                // Insert movie details
                if (failureValue == "") {
                  // Insert data into title table
                  const titleData = {
                    type: getType,
                    release_date: getReleaseDate,
                    imdb_id: getImdbId,
                    tmdb_id: getTmdbId ? getTmdbId : null,
                    kobis_id: getKobisId,
                    tiving_id: getTivingId,
                    affiliate_link: getOfficialSite,
                    certification: getCertification,
                    footfalls: getFootfalls,
                    runtime: getRuntime,
                    //country: getCountry,
                    language: getLanguage,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  const titleTblInsert = await model.title.create(titleData);
                  const titleId = titleTblInsert.id;
                  // service add for update data in edb_edits table
                  const actionDate = await customDateTimeHelper.getCurrentDateTime();
                  await titleService.titleDataAddEditInEditTbl(
                    titleId,
                    getType,
                    userId,
                    actionDate,
                  );

                  // Insert data into titleTranslations table
                  const titleTranslationData = {
                    title_id: titleId,
                    site_language: getDefaultLanguage,
                    name: getTitle,
                    aka: getAka,
                    description: getSummery,
                    plot_summary: getPlot,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  await model.titleTranslation.create(titleTranslationData);

                  // Insert search keyword
                  if (getSearchKeywordArray.length > 0) {
                    for (const element of getSearchKeywordArray) {
                      if (element) {
                        const searchKeyword = {
                          title_id: titleId,
                          site_language: getDefaultLanguage,
                          keyword: element,
                          keyword_type: "search",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleKeyword.create(searchKeyword);
                      }
                    }
                  }

                  // Insert news search keyword
                  if (getNewsSearchKeywordArray.length > 0) {
                    for (const element of getNewsSearchKeywordArray) {
                      if (element) {
                        const newsSearchKeyword = {
                          title_id: titleId,
                          site_language: getDefaultLanguage,
                          keyword: element,
                          keyword_type: "news",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleKeyword.create(newsSearchKeyword);
                      }
                    }
                  }

                  // Insert Genre Tag
                  if (getTagGenreArray.length > 0) {
                    getGenreList.forEach(async (genre) => {
                      if (getTagGenreArray.includes(genre["genre_name"])) {
                        const getTagGenreVal = {
                          tag_id: genre["tag_id"],
                          taggable_id: titleId,
                          taggable_type: "title",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.tagGable.create(getTagGenreVal);
                      }
                    });
                  }

                  // Insert Country
                  if (getCountryArray.length > 0) {
                    getCountryList.forEach(async (country) => {
                      if (getCountryArray.includes(country["country_name"])) {
                        const getCountryVal = {
                          country_id: country["country_id"],
                          title_id: titleId,
                          site_language: getDefaultLanguage,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleCountries.create(getCountryVal);
                      }
                    });
                  }

                  // Insert re-release date
                  if (getReReleaseArray.length > 0) {
                    for (const element of getReReleaseArray) {
                      if (element) {
                        const getReReleaseDate = await customDateTimeHelper.changeDateFormat(
                          element,
                          "YYYY-MM-DD",
                        );
                        const reReleaseDateList = {
                          title_id: titleId,
                          re_release_date: getReReleaseDate,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleReRelease.create(reReleaseDateList);
                      }
                    }
                  }

                  // Complete message insert into import_data_logs table
                  if (titleId) {
                    const successMessage = "Success: " + getTitle;
                    const insertData = {
                      imported_file_id: importedFileId,
                      item_id: titleId,
                      type: getType,
                      uuid: generatedCode,
                      tmdb_id: getTmdbId,
                      kobis_id: getKobisId,
                      imdb_id: getImdbId,
                      tiving_id: getTivingId,
                      title_name: getTitle,
                      aka: getAka,
                      description: getSummery,
                      message: successMessage,
                      import_status: "complete",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    await model.importData.create(insertData);
                  }
                }
              }
            }

            // When type is tv
            if (getType == "tv") {
              // TMBD & KOBIS, Tiving checking
              let includeWhere = { tmdb_id: getTmdbId, record_status: "active" };
              let getInformations = {};
              if (getTmdbId && getKobisId) {
                includeWhere = {
                  [Op.or]: [{ tmdb_id: getTmdbId }, { kobis_id: getKobisId }],
                  record_status: "active",
                };
              }
              if (getTmdbId && getKobisId && getTivingId) {
                includeWhere = {
                  [Op.or]: [
                    { tmdb_id: getTmdbId },
                    { kobis_id: getKobisId },
                    { tiving_id: getTivingId },
                  ],
                  record_status: "active",
                };
              }
              getInformations = await model.title.findOne({
                attributes: ["id", "type", "release_date"],
                where: includeWhere,
              });
              // Insert data into 'import data logs' table
              if (getInformations) {
                const insertData = {
                  imported_file_id: importedFileId,
                  item_id: getInformations.id,
                  type: getType,
                  uuid: generatedCode,
                  tmdb_id: getTmdbId,
                  kobis_id: getKobisId,
                  imdb_id: getImdbId,
                  tiving_id: getTivingId,
                  title_name: getTitle,
                  aka: getAka,
                  description: getSummery,
                  message: "Already exist!",
                  import_status: "duplicate",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.importData.create(insertData);
              } else {
                let failureValue = "";
                // check Status
                if (
                  checkStatusValue == "" &&
                  getStatus !== null &&
                  getStatus !== "" &&
                  getStatus !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Tv status is not match with default status.";
                  errorMessage.push(errorText);
                }

                // check language
                if (
                  !setLanguage.includes(getDefaultLanguage) &&
                  getDefaultLanguage !== null &&
                  getDefaultLanguage !== "" &&
                  getDefaultLanguage !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Default language will be (en/ko).";
                  errorMessage.push(errorText);
                }

                // check Certification
                if (
                  certificationValue == "" &&
                  getCertification !== null &&
                  getCertification !== "" &&
                  getCertification !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Tv certification is not match with default certification.";
                  errorMessage.push(errorText);
                }

                //check release
                const getReleaseDate =
                  getValue["release_date"] !== null &&
                  getValue["release_date"] !== "" &&
                  getValue["release_date"] !== undefined
                    ? await customDateTimeHelper.changeDateFormat(
                        getValue["release_date"],
                        "YYYY-MM-DD",
                      )
                    : null;
                if (releaseDate == false && releaseDate !== "") {
                  failureValue = 1;
                  errorText = "Release date format will be(YYYY-MM-DD)";
                  errorMessage.push(errorText);
                }

                // Insert error message
                if (failureValue == 1) {
                  const insertData = {
                    imported_file_id: importedFileId,
                    item_id: null,
                    type: getType,
                    uuid: generatedCode,
                    tmdb_id: getTmdbId,
                    kobis_id: getKobisId,
                    imdb_id: getImdbId,
                    tiving_id: getTivingId,
                    title_name: getTitle,
                    aka: getAka,
                    description: getSummery,
                    message: errorMessage.length > 0 ? JSON.stringify(errorMessage) : "",
                    import_status: "failure",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  await model.importData.create(insertData);
                  isFailed = true;
                }

                // Insert movie details
                if (failureValue == "") {
                  // Insert data into title table
                  const titleData = {
                    type: getType,
                    release_date: getReleaseDate,
                    imdb_id: getImdbId,
                    tmdb_id: getTmdbId,
                    kobis_id: getKobisId,
                    tiving_id: getTivingId,
                    affiliate_link: getOfficialSite,
                    certification: getCertification,
                    footfalls: getFootfalls,
                    runtime: getRuntime,
                    //country: getCountry,
                    language: getLanguage,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  const titleTblInsert = await model.title.create(titleData);
                  const titleId = titleTblInsert.id;
                  // service add for update data in edb_edits table
                  const actionDate = await customDateTimeHelper.getCurrentDateTime();
                  await titleService.titleDataAddEditInEditTbl(
                    titleId,
                    getType,
                    userId,
                    actionDate,
                  );

                  // Insert data into titleTranslations table
                  const titleTranslationData = {
                    title_id: titleId,
                    site_language: getDefaultLanguage,
                    name: getTitle,
                    aka: getAka,
                    description: getSummery,
                    plot_summary: getPlot,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  await model.titleTranslation.create(titleTranslationData);

                  // Insert search keyword
                  if (getSearchKeywordArray.length > 0) {
                    for (const element of getSearchKeywordArray) {
                      if (element) {
                        const searchKeyword = {
                          title_id: titleId,
                          site_language: getDefaultLanguage,
                          keyword: element,
                          keyword_type: "search",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleKeyword.create(searchKeyword);
                      }
                    }
                  }

                  // Insert news search keyword
                  if (getNewsSearchKeywordArray.length > 0) {
                    for (const element of getNewsSearchKeywordArray) {
                      if (element) {
                        const newsSearchKeyword = {
                          title_id: titleId,
                          site_language: getDefaultLanguage,
                          keyword: element,
                          keyword_type: "news",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleKeyword.create(newsSearchKeyword);
                      }
                    }
                  }

                  // Insert Genre Tag
                  if (getTagGenreArray.length > 0) {
                    getGenreList.forEach(async (genre) => {
                      if (getTagGenreArray.includes(genre["genre_name"])) {
                        const getTagGenreVal = {
                          tag_id: genre["tag_id"],
                          taggable_id: titleId,
                          taggable_type: "title",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.tagGable.create(getTagGenreVal);
                      }
                    });
                  }

                  // Insert Country
                  if (getCountryArray.length > 0) {
                    getCountryList.forEach(async (country) => {
                      if (getCountryArray.includes(country["country_name"])) {
                        const getCountryVal = {
                          country_id: country["country_id"],
                          title_id: titleId,
                          site_language: getDefaultLanguage,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.titleCountries.create(getCountryVal);
                      }
                    });
                  }

                  // Complete message insert into import_data_logs table
                  if (titleId) {
                    const successMessage = "Success: " + getTitle;
                    const insertData = {
                      imported_file_id: importedFileId,
                      item_id: titleId,
                      type: getType,
                      uuid: generatedCode,
                      tmdb_id: getTmdbId,
                      kobis_id: getKobisId,
                      imdb_id: getImdbId,
                      tiving_id: getTivingId,
                      title_name: getTitle,
                      aka: getAka,
                      description: getSummery,
                      message: successMessage,
                      import_status: "complete",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    await model.importData.create(insertData);
                  }
                }
              }
            }

            // When type is people
            if (getType === "people") {
              // TMBD & KOBIS, Tiving checking
              let includeWhere = { tmdb_id: getTmdbId, status: "active" };
              let getInformations = {};
              if (getTmdbId && getKobisId) {
                includeWhere = {
                  [Op.or]: [{ tmdb_id: getTmdbId }, { kobis_id: getKobisId }],
                  status: "active",
                };
              }
              if (getTmdbId && getKobisId && getTivingId) {
                includeWhere = {
                  [Op.or]: [
                    { tmdb_id: getTmdbId },
                    { kobis_id: getKobisId },
                    { tiving_id: getTivingId },
                  ],
                  status: "active",
                };
              }
              getInformations = await model.people.findOne({
                attributes: ["id", "gender", "birth_date"],
                where: includeWhere,
              });
              // Insert data into 'import data logs' table
              if (getInformations) {
                const insertData = {
                  imported_file_id: importedFileId,
                  item_id: getInformations.id,
                  type: getType,
                  uuid: generatedCode,
                  tmdb_id: getTmdbId,
                  kobis_id: getKobisId,
                  imdb_id: getImdbId,
                  tiving_id: getTivingId,
                  title_name: getTitle,
                  aka: getAka,
                  description: getSummery,
                  message: "Already exist!",
                  import_status: "duplicate",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.importData.create(insertData);
              } else {
                let failureValue = "";

                // check language
                if (
                  !setLanguage.includes(getDefaultLanguage) &&
                  getDefaultLanguage !== null &&
                  getDefaultLanguage !== "" &&
                  getDefaultLanguage !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Default language will be (en/ko).";
                  errorMessage.push(errorText);
                }

                //check Birth & Death date
                const getBirthDate =
                  getValue["birth_date"] !== null &&
                  getValue["birth_date"] !== "" &&
                  getValue["birth_date"] !== undefined
                    ? await customDateTimeHelper.changeDateFormat(
                        getValue["birth_date"],
                        "YYYY-MM-DD",
                      )
                    : "";
                const getDeathDate =
                  getValue["death_date"] !== null &&
                  getValue["death_date"] !== "" &&
                  getValue["death_date"] !== undefined
                    ? await customDateTimeHelper.changeDateFormat(
                        getValue["death_date"],
                        "YYYY-MM-DD",
                      )
                    : null;
                if (birthDate == false && birthDate !== "") {
                  failureValue = 1;
                  errorText = "Birth date format will be(YYYY-MM-DD)";
                  errorMessage.push(errorText);
                }

                if (deathDate == false && deathDate !== "") {
                  failureValue = 1;
                  errorText = "Death date format will be(YYYY-MM-DD)";
                  errorMessage.push(errorText);
                }

                if (checkPeopleName == true) {
                  failureValue = 1;
                  errorText = "In the people's name number is not allowed";
                  errorMessage.push(errorText);
                }

                if (
                  getBirthDate > getDeathDate &&
                  getValue["death_date"] !== null &&
                  getValue["death_date"] !== "" &&
                  getValue["death_date"] !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Birth date must be greater than death date";
                  errorMessage.push(errorText);
                }

                // check gender
                if (
                  checkGenderValue == "" &&
                  getGender !== null &&
                  getGender !== "" &&
                  getGender !== undefined
                ) {
                  failureValue = 1;
                  errorText = "Gender value will be (male/female).";
                  errorMessage.push(errorText);
                }

                // Insert error message
                if (failureValue == 1) {
                  const insertData = {
                    imported_file_id: importedFileId,
                    item_id: null,
                    type: getType,
                    uuid: generatedCode,
                    tmdb_id: getTmdbId,
                    kobis_id: getKobisId,
                    imdb_id: getImdbId,
                    tiving_id: getTivingId,
                    title_name: getTitle,
                    aka: getAka,
                    description: getSummery,
                    message: errorMessage.length > 0 ? JSON.stringify(errorMessage) : "",
                    import_status: "failure",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  await model.importData.create(insertData);
                  isFailed = true;
                }

                // Insert people details
                if (failureValue == "") {
                  // Insert data into people table
                  const peopleData = {
                    gender: getGender,
                    birth_date: getBirthDate ? getBirthDate : null,
                    kobis_id: getKobisId ? getKobisId : null,
                    imdb_id: getImdbId,
                    tmdb_id: getTmdbId,
                    tiving_id: getTivingId,
                    official_site: getOfficialSite,
                    facebook_link: getFacebookLink,
                    instagram_link: getInstagramLink,
                    twitter_link: getTwitterLink,
                    death_date: getDeathDate ? getDeathDate : null,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };

                  const peopleTblInsert = await model.people.create(peopleData);
                  const peopleId = peopleTblInsert.id;
                  // service add for update data in edb_edits table
                  const actionDate = await customDateTimeHelper.getCurrentDateTime();
                  await titleService.titleDataAddEditInEditTbl(
                    peopleId,
                    "people",
                    userId,
                    actionDate,
                  );

                  // Insert data into peopleTranslations table
                  const peopleTranslationData = {
                    people_id: peopleId,
                    name: getTitle,
                    description: getBiography,
                    site_language: getDefaultLanguage,
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  };
                  if (
                    !(await model.peopleTranslation.findOne({
                      where: { people_id: peopleId, site_language: getDefaultLanguage },
                    }))
                  ) {
                    await model.peopleTranslation.create(peopleTranslationData);
                  }
                  // Insert search keyword
                  if (getSearchKeywordArray.length > 0) {
                    for (const element of getSearchKeywordArray) {
                      if (element) {
                        const searchKeyword = {
                          people_id: peopleId,
                          site_language: getDefaultLanguage,
                          keyword: element,
                          keyword_type: "search",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleKeywords.create(searchKeyword);
                      }
                    }
                  }

                  // Insert news search keyword
                  if (getNewsSearchKeywordArray.length > 0) {
                    for (const element of getNewsSearchKeywordArray) {
                      if (element) {
                        const newsSearchKeyword = {
                          people_id: peopleId,
                          site_language: getDefaultLanguage,
                          keyword: element,
                          keyword_type: "news",
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleKeywords.create(newsSearchKeyword);
                      }
                    }
                  }

                  // Insert Country
                  if (getCountryArray.length > 0) {
                    getCountryList.forEach(async (country) => {
                      if (getCountryArray.includes(country["country_name"])) {
                        const getCountryVal = {
                          country_id: country["country_id"],
                          people_id: peopleId,
                          site_language: getDefaultLanguage,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        await model.peopleCountries.create(getCountryVal);
                      }
                    });
                  }

                  // Complete message insert into import_data_logs table
                  if (peopleId) {
                    const successMessage = "Success: " + getTitle;
                    const insertData = {
                      imported_file_id: importedFileId,
                      item_id: peopleId,
                      type: getType,
                      uuid: generatedCode,
                      tmdb_id: getTmdbId,
                      kobis_id: getKobisId,
                      imdb_id: getImdbId,
                      tiving_id: getTivingId,
                      title_name: getTitle,
                      aka: getAka,
                      description: getSummery,
                      message: successMessage,
                      import_status: "complete",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                      created_by: userId,
                    };
                    await model.importData.create(insertData);
                  }
                }
              }
            }
          }
        }

        // For loop end

        if (isFailed) {
          //update status
          const updateimportFiles = {
            upload_status: "failed",
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
          };
          await model.importFiles.update(updateimportFiles, {
            where: { id: importedFileId },
          });
        }
      } else {
        //update status
        const updateimportFiles = {
          upload_status: "failed",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.importFiles.update(updateimportFiles, {
          where: { id: importedFileId },
        });
      }

      res.ok({ message: res.__("success") });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
