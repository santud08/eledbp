import model from "../../../models/index.js";
import { awsService, titleService } from "../../../services/index.js";
import { Op } from "sequelize";
import xlsx from "xlsx";
import { envs } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * importXlsData
 * @param req
 * @param res
 */
export const importXlsData = async (req, res, next) => {
  try {
    const s3 = new awsService.AWS.S3();
    const bucketName = envs.s3.BUCKET_NAME;
    let excelData = [];
    const userId = req.userDetails.userId;

    if (req.file) {
      const fileDetails = req.file;

      //Insert XL file details in imported_files table
      const originalname = fileDetails.originalname ? fileDetails.originalname : "";
      const filename = fileDetails.key ? fileDetails.key : "";
      const insertXlFile = {
        file_original_name: originalname,
        file_name: filename,
        upload_status: "completed",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: userId,
      };
      const importFileData = await model.importFiles.create(insertXlFile);
      const importedFileId = importFileData.id;

      //Read XL sheet
      // Reading our test file
      const params = {
        Bucket: `${bucketName}/uploads/bulks/import`,
        Key: fileDetails.key,
      };
      const stream = s3.getObject(params).createReadStream();

      let buffers = [];

      stream.on("data", function (data) {
        buffers.push(data);
      });

      let isFailed = false;
      stream.on("end", async () => {
        const buffer = Buffer.concat(buffers);
        const file = xlsx.read(buffer, { cellDates: true, cellText: false });
        const sheets = file.SheetNames;
        if (sheets.length > 0) {
          for (let i = 0; i < sheets.length; i++) {
            excelData = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {
              header: "A",
              //blankrows: true,
              raw: false,
              dateNF: 'yyyy"-"mm"-"dd',
            });
          }
        }
        if (excelData.length > 0) {
          //validate data of type number or string
          let i = 0;
          for (let checkEachRow of excelData) {
            if (i > 0) {
              const getType = checkEachRow["A"];
              const getDefaultLanguage = checkEachRow["B"];
              const getTmdbId =
                checkEachRow["C"] !== null &&
                checkEachRow["C"] !== "" &&
                checkEachRow["C"] !== undefined
                  ? checkEachRow["C"]
                  : "";
              const getKobisId =
                checkEachRow["D"] !== null &&
                checkEachRow["D"] !== "" &&
                checkEachRow["D"] !== undefined
                  ? checkEachRow["D"]
                  : "";
              const getImdbId =
                checkEachRow["E"] !== null &&
                checkEachRow["E"] !== "" &&
                checkEachRow["E"] !== undefined
                  ? checkEachRow["E"]
                  : "";
              const getTivingId =
                checkEachRow["F"] !== null &&
                checkEachRow["F"] !== "" &&
                checkEachRow["F"] !== undefined
                  ? checkEachRow["F"]
                  : "";
              const getTitle =
                checkEachRow["G"] !== null &&
                checkEachRow["G"] !== "" &&
                checkEachRow["G"] !== undefined
                  ? checkEachRow["G"]
                  : "";
              const getAka =
                checkEachRow["H"] !== null &&
                checkEachRow["H"] !== "" &&
                checkEachRow["H"] !== undefined
                  ? checkEachRow["H"]
                  : "";
              const getSummery =
                checkEachRow["I"] !== null &&
                checkEachRow["I"] !== "" &&
                checkEachRow["I"] !== undefined
                  ? checkEachRow["I"]
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
                  checkEachRow["J"] != null &&
                  checkEachRow["J"] != "" &&
                  checkEachRow["J"] != "undefined"
                    ? checkEachRow["J"]
                    : "";
                const getOfficialSite =
                  checkEachRow["K"] != null &&
                  checkEachRow["K"] != "" &&
                  checkEachRow["K"] != "undefined"
                    ? checkEachRow["K"]
                    : "";
                const getSearchKeyword = checkEachRow["L"];
                const getNewsSearchKeyword = checkEachRow["M"];
                const getStatus = checkEachRow["N"];
                const releaseDate =
                  checkEachRow["O"] != null &&
                  checkEachRow["O"] != "" &&
                  checkEachRow["O"] != "undefined"
                    ? await customDateTimeHelper.checkDateFormat(checkEachRow["O"])
                    : null;
                const getReReleaseDateValue =
                  checkEachRow["P"] != null &&
                  checkEachRow["P"] != "" &&
                  checkEachRow["P"] != "undefined"
                    ? checkEachRow["P"]
                    : null;
                const getFootfalls =
                  checkEachRow["Q"] != null &&
                  checkEachRow["Q"] != "" &&
                  checkEachRow["Q"] != "undefined"
                    ? Number.isInteger(Number(checkEachRow["Q"])) == true
                      ? checkEachRow["Q"]
                      : null
                    : null;
                const getRuntime =
                  checkEachRow["R"] != null &&
                  checkEachRow["R"] != "" &&
                  checkEachRow["R"] != "undefined"
                    ? Number.isInteger(Number(checkEachRow["R"])) == true
                      ? checkEachRow["R"]
                      : null
                    : null;
                //const getCertification = 8;
                const getCertification =
                  checkEachRow["S"] != null &&
                  checkEachRow["S"] != "" &&
                  checkEachRow["S"] != "undefined"
                    ? Number.isInteger(Number(checkEachRow["S"])) == true
                      ? checkEachRow["S"]
                      : checkEachRow["S"]
                    : "";
                const getLanguage =
                  checkEachRow["T"] != null &&
                  checkEachRow["T"] != "" &&
                  checkEachRow["T"] != "undefined"
                    ? checkEachRow["T"]
                    : "";
                const getCountry =
                  checkEachRow["U"] != null &&
                  checkEachRow["U"] != "" &&
                  checkEachRow["U"] != "undefined"
                    ? checkEachRow["U"]
                    : "";
                //const getCountry = "ARtu";
                // const getOriginalWork =
                //   checkEachRow["V"] !== null &&
                //   checkEachRow["V"] !== "" &&
                //   checkEachRow["V"] !== undefined
                //     ? checkEachRow["V"]
                //     : "";
                const getTagGenre =
                  checkEachRow["W"] != null &&
                  checkEachRow["W"] != "" &&
                  checkEachRow["W"] != "undefined"
                    ? checkEachRow["W"]
                    : "";
                const getBiography =
                  checkEachRow["X"] != null &&
                  checkEachRow["X"] != "" &&
                  checkEachRow["X"] != "undefined"
                    ? checkEachRow["X"]
                    : "";
                const getFacebookLink =
                  checkEachRow["Y"] != null &&
                  checkEachRow["Y"] != "" &&
                  checkEachRow["Y"] != "undefined"
                    ? checkEachRow["Y"]
                    : "";
                const getTwitterLink =
                  checkEachRow["Z"] != null &&
                  checkEachRow["Z"] != "" &&
                  checkEachRow["Z"] != "undefined"
                    ? checkEachRow["Z"]
                    : "";
                const getInstagramLink =
                  checkEachRow["AA"] != null &&
                  checkEachRow["AA"] != "" &&
                  checkEachRow["AA"] != "undefined"
                    ? checkEachRow["AA"]
                    : "";
                const getGender =
                  checkEachRow["AB"] != null &&
                  checkEachRow["AB"] != "" &&
                  checkEachRow["AB"] != "undefined"
                    ? checkEachRow["AB"]
                    : "";
                const birthDate =
                  checkEachRow["AC"] != null &&
                  checkEachRow["AC"] != "" &&
                  checkEachRow["AC"] != "undefined"
                    ? await customDateTimeHelper.checkDateFormat(checkEachRow["AC"])
                    : "";
                const deathDate =
                  checkEachRow["AD"] != null &&
                  checkEachRow["AD"] != "" &&
                  checkEachRow["AD"] != "undefined"
                    ? await customDateTimeHelper.checkDateFormat(checkEachRow["AD"])
                    : true;

                // Store XL country comma separator value in an array
                let getCountryArray = [];
                if (getCountry != null && getCountry != "" && getCountry != "undefined") {
                  getCountryArray = getCountry.split(",");
                }
                // Store XL Genre tag comma separator value in an array
                let getTagGenreArray = [];
                if (getTagGenre != null && getTagGenre != "" && getTagGenre != "undefined") {
                  getTagGenreArray = getTagGenre.split(",");
                }

                // Store XL Re-release date comma separator value in an array
                let getReReleaseArray = [];
                if (
                  getReReleaseDateValue != null &&
                  getReReleaseDateValue != "" &&
                  getReReleaseDateValue != "undefined"
                ) {
                  getReReleaseArray = getReReleaseDateValue.split(",");
                }

                // Store XL Search keyword comma separator value in an array
                let getSearchKeywordArray = [];
                if (
                  getSearchKeyword != null &&
                  getSearchKeyword != "" &&
                  getSearchKeyword != "undefined"
                ) {
                  getSearchKeywordArray = getSearchKeyword.split(",");
                }

                // Store XL News Search keyword comma separator value in an array
                let getNewsSearchKeywordArray = [];
                if (
                  getNewsSearchKeyword != null &&
                  getNewsSearchKeyword != "" &&
                  getNewsSearchKeyword != "undefined"
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
                      getDefaultLanguage != null &&
                      getDefaultLanguage != "" &&
                      getDefaultLanguage != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Default language will be (en/ko).";
                      errorMessage.push(errorText);
                    }

                    // check Certification
                    if (
                      certificationValue == "" &&
                      getCertification != null &&
                      getCertification != "" &&
                      getCertification != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Movie certification is not match with default certification.";
                      errorMessage.push(errorText);
                    }

                    //check release date
                    const getReleaseDate =
                      checkEachRow["O"] != null &&
                      checkEachRow["O"] != "" &&
                      checkEachRow["O"] != "undefined"
                        ? await customDateTimeHelper.changeDateFormat(
                            checkEachRow["O"],
                            "YYYY-MM-DD",
                          )
                        : null;
                    if (releaseDate == false && releaseDate != "") {
                      failureValue = 1;
                      errorText = "Release date format will be(YYYY-MM-DD)";
                      errorMessage.push(errorText);
                    }

                    // check re-release date
                    if (getReReleaseArray.length > 0) {
                      for (const element of getReReleaseArray) {
                        const checkReReleaseDate = await customDateTimeHelper.checkDateFormat(
                          element,
                        );
                        if (checkReReleaseDate == false && checkReReleaseDate != "") {
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
                      getStatus != null &&
                      getStatus != "" &&
                      getStatus != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Tv status is not match with default status.";
                      errorMessage.push(errorText);
                    }

                    // check language
                    if (
                      !setLanguage.includes(getDefaultLanguage) &&
                      getDefaultLanguage != null &&
                      getDefaultLanguage != "" &&
                      getDefaultLanguage != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Default language will be (en/ko).";
                      errorMessage.push(errorText);
                    }

                    // check Certification
                    if (
                      certificationValue == "" &&
                      getCertification != null &&
                      getCertification != "" &&
                      getCertification != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Tv certification is not match with default certification.";
                      errorMessage.push(errorText);
                    }

                    //check release
                    const getReleaseDate =
                      checkEachRow["O"] != null &&
                      checkEachRow["O"] != "" &&
                      checkEachRow["O"] != "undefined"
                        ? await customDateTimeHelper.changeDateFormat(
                            checkEachRow["O"],
                            "YYYY-MM-DD",
                          )
                        : null;

                    if (releaseDate == false && releaseDate != "") {
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
                      getDefaultLanguage != null &&
                      getDefaultLanguage != "" &&
                      getDefaultLanguage != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Default language will be (en/ko).";
                      errorMessage.push(errorText);
                    }

                    //check Birth & Death date
                    const getBirthDate =
                      checkEachRow["AC"] != null &&
                      checkEachRow["AC"] != "" &&
                      checkEachRow["AC"] != "undefined"
                        ? await customDateTimeHelper.changeDateFormat(
                            checkEachRow["AC"],
                            "YYYY-MM-DD",
                          )
                        : null;
                    const getDeathDate =
                      checkEachRow["AD"] != null &&
                      checkEachRow["AD"] != "" &&
                      checkEachRow["AD"] != "undefined"
                        ? await customDateTimeHelper.changeDateFormat(
                            checkEachRow["AD"],
                            "YYYY-MM-DD",
                          )
                        : null;
                    if (birthDate == false && birthDate != "") {
                      failureValue = 1;
                      errorText = "Birth date format will be(YYYY-MM-DD)";
                      errorMessage.push(errorText);
                    }

                    if (deathDate == false && deathDate != "") {
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
                      checkEachRow["AD"] != null &&
                      checkEachRow["AD"] != "" &&
                      checkEachRow["AD"] != "undefined"
                    ) {
                      failureValue = 1;
                      errorText = "Birth date must be greater than death date";
                      errorMessage.push(errorText);
                    }

                    // check gender
                    if (
                      checkGenderValue == "" &&
                      getGender != null &&
                      getGender != "" &&
                      getGender != "undefined"
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
            i++;
          }
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
      });

      res.ok({ message: res.__("success") });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
