import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { peopleService, titleService, schedulerJobService } from "../../../services/index.js";

/**
 * editSubmitAllSavePeople
 * @param req
 * @param res
 */
export const editSubmitAllSavePeople = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    let actionDate = "";
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.draft_relation_id;
    const peopleId = req.body.people_id;
    let isVideoModified = false;

    //save people primary details
    const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
      where: {
        relation_id: relationId,
        people_id: peopleId,
        status: "active",
        request_status: "draft",
      },
      order: [
        ["updated_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    const findPeople = await model.people.findOne({
      where: {
        id: peopleId,
        status: "active",
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    if (findRequestId.length > 0 && findPeople) {
      const peopleData = {
        gender: findRequestId[0].gender ? findRequestId[0].gender : null,
        birth_date: findRequestId[0].birth_date ? findRequestId[0].birth_date : null,
        poster: findRequestId[0].poster ? findRequestId[0].poster : null,
        imdb_id: findRequestId[0].imdb_id ? findRequestId[0].imdb_id : null,
        tmdb_id: findRequestId[0].tmdb_id ? findRequestId[0].tmdb_id : null,
        kobis_id: findRequestId[0].kobis_id ? findRequestId[0].kobis_id : null,
        tiving_id: findRequestId[0].tiving_id ? findRequestId[0].tiving_id : null,
        odk_id: findRequestId[0].odk_id ? findRequestId[0].odk_id : null,
        official_site: findRequestId[0].official_site ? findRequestId[0].official_site : null,
        facebook_link: findRequestId[0].facebook_link ? findRequestId[0].facebook_link : null,
        instagram_link: findRequestId[0].instagram_link ? findRequestId[0].instagram_link : null,
        twitter_link: findRequestId[0].twitter_link ? findRequestId[0].twitter_link : null,
        death_date: findRequestId[0].death_date ? findRequestId[0].death_date : null,
        updated_by: userId,
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      await model.people.update(peopleData, {
        where: { id: peopleId, status: "active" },
      });
      actionDate = peopleData.updated_at;

      // ---------------------language dependent fields----------------------
      // Finding all the request with respect to language- inserting data into People Translation
      let birthPlace = {};
      for (const peopleDetails of findRequestId) {
        // People Translation - below country because of country details - birthplace details
        const findTranslationRecord = await model.peopleTranslation.findAll({
          where: {
            people_id: peopleId,
            status: "active",
            site_language: peopleDetails.site_language,
          },
        });
        if (findTranslationRecord.length > 0) {
          const peopleTranslationData = {
            name: peopleDetails.name ? peopleDetails.name : null,
            known_for: findRequestId[0].known_for ? findRequestId[0].known_for : null,
            birth_place: birthPlace.country_name ? birthPlace.country_name : null,
            description: peopleDetails.description ? peopleDetails.description : null,
            updated_by: userId,
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };

          await model.peopleTranslation.update(peopleTranslationData, {
            where: {
              people_id: peopleId,
              status: "active",
              site_language: peopleDetails.site_language,
            },
          });
          actionDate = peopleTranslationData.updated_at;
        } else {
          const peopleTranslationData = {
            people_id: peopleId,
            site_language: peopleDetails.site_language,
            name: peopleDetails.name ? peopleDetails.name : null,
            known_for: peopleDetails.known_for ? peopleDetails.known_for : null,
            description: peopleDetails.description ? peopleDetails.description : null,
            created_by: userId,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          if (
            !(await model.peopleTranslation.findOne({
              where: { people_id: peopleId, site_language: peopleDetails.site_language },
            }))
          ) {
            await model.peopleTranslation.create(peopleTranslationData);
          }
          // update the language independent values:
          const languageIndependent = {
            known_for: findRequestId[0].known_for ? findRequestId[0].known_for : null,
            birth_place: birthPlace.country_name ? birthPlace.country_name : null,
          };
          languageIndependent.updated_by = userId;
          languageIndependent.updated_at = await customDateTimeHelper.getCurrentDateTime();

          await model.peopleTranslation.update(languageIndependent, {
            where: {
              people_id: peopleId,
              status: "active",
            },
          });
          actionDate = peopleTranslationData.created_at;
        }
      }
      //-------------------------Birth Place Details----------------
      const peopleCountryDetails =
        findRequestId[0].country_details != null
          ? JSON.parse(findRequestId[0].country_details)
          : null;
      if (peopleCountryDetails != null && peopleCountryDetails.list.length > 0) {
        for (const value of peopleCountryDetails.list) {
          const findPeopleCoutry = await model.peopleCountries.findOne({
            attributes: ["id"],
            where: {
              people_id: peopleId,
              status: "active",
            },
            order: [["id", "DESC"]],
          });
          if (findPeopleCoutry) {
            const puData = {
              country_id: value.country_id ? value.country_id : null,
              birth_place: value.birth_place ? value.birth_place : null,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_by: userId,
            };
            await model.peopleCountries.update(puData, {
              where: {
                people_id: peopleId,
                status: "active",
              },
            });
            actionDate = puData.updated_at;
          } else {
            const peopleCountries = {
              people_id: peopleId,
              country_id: value.country_id ? value.country_id : null,
              birth_place: value.birth_place ? value.birth_place : null,
              site_language: findRequestId[0].site_language,
              created_by: userId,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.peopleCountries.create(peopleCountries);
            actionDate = peopleCountries.created_at;
          }
        }
      } else {
        const findPeopleCoutry = await model.peopleCountries.findAll({
          where: {
            people_id: peopleId,
            status: "active",
          },
        });
        if (findPeopleCoutry.length > 0) {
          const fpuData = {
            status: "deleted",
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_by: userId,
          };
          await model.peopleCountries.update(fpuData, {
            where: {
              people_id: peopleId,
            },
          });
          actionDate = fpuData.updated_at;
        }
      }
      await peopleService.updatePeopleKoreanBirthPlace(peopleId);
      // ------------------------Keyword Details----------------
      let originalSearchKeywordList = [];
      let originalNewsSearchKeywordList = [];
      let requestedSearchKeywordList = [];
      let requestedNewsSearchKeywordList = [];
      // 1.Get the Original keyword List
      const originalKeywordDetails = await model.peopleKeywords.findAll({
        where: {
          people_id: peopleId,
          status: "active",
        },
      });
      if (originalKeywordDetails.length > 0) {
        for (const searchValue of originalKeywordDetails) {
          if (searchValue && searchValue.keyword) {
            if (searchValue.keyword && searchValue.keyword_type == "search") {
              originalSearchKeywordList.push(searchValue.keyword);
            } else if (searchValue.keyword && searchValue.keyword_type == "news") {
              originalNewsSearchKeywordList.push(searchValue.keyword);
            }
          }
        }
      }
      //2. Get Requested Search and News Keyword
      const searchKeywordDetails =
        findRequestId[0].search_keyword_details != null
          ? JSON.parse(findRequestId[0].search_keyword_details)
          : null;
      const newsKeywordDetails =
        findRequestId[0].news_keyword_details != null
          ? JSON.parse(findRequestId[0].news_keyword_details)
          : null;

      if (searchKeywordDetails != null && searchKeywordDetails.list.length > 0) {
        for (const value of searchKeywordDetails.list) {
          if (value && value.keyword) {
            requestedSearchKeywordList.push(value.keyword);
          }
        }
      }
      if (newsKeywordDetails != null && newsKeywordDetails.list.length > 0) {
        for (const value of newsKeywordDetails.list) {
          if (value && value.keyword) {
            requestedNewsSearchKeywordList.push(value.keyword);
          }
        }
      }
      //3. Finding the Keywords that is not changed:
      let unchangedSearchKeyword = originalSearchKeywordList.filter((x) =>
        requestedSearchKeywordList.includes(x),
      );
      let unchangedNewsSearchKeyword = originalNewsSearchKeywordList.filter((x) =>
        requestedNewsSearchKeywordList.includes(x),
      );
      //4. Finding the Keywords that is Added:
      let newlyAddedSearchKeyword = requestedSearchKeywordList.filter(
        (x) => !originalSearchKeywordList.includes(x),
      );
      let newlyAddedNewsSearchKeyword = requestedNewsSearchKeywordList.filter(
        (x) => !originalNewsSearchKeywordList.includes(x),
      );
      //5. Deleting all the Search-keywords except unchanged:
      const pskData = {
        status: "deleted",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.peopleKeywords.update(pskData, {
        where: {
          people_id: peopleId,
          keyword: { [Op.notIn]: unchangedSearchKeyword },
          keyword_type: "search",
        },
      });
      actionDate = pskData.updated_at;
      //5. Deleting all the News-keywords except unchanged:
      const pdskData = {
        status: "deleted",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.peopleKeywords.update(pdskData, {
        where: {
          people_id: peopleId,
          keyword: { [Op.notIn]: unchangedNewsSearchKeyword },
          keyword_type: "news",
        },
      });
      actionDate = pdskData.updated_at;
      if (newlyAddedSearchKeyword.length > 0) {
        for (const value of newlyAddedSearchKeyword) {
          if (value) {
            const searchKeywordData = {
              people_id: peopleId,
              site_language: findRequestId[0].site_language,
              keyword: value,
              keyword_type: "search",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.peopleKeywords.create(searchKeywordData);
            actionDate = searchKeywordData.created_at;
          }
        }
      }
      if (newlyAddedNewsSearchKeyword.length > 0) {
        for (const value of newlyAddedNewsSearchKeyword) {
          const newsKeywordData = {
            people_id: peopleId,
            site_language: findRequestId[0].site_language,
            keyword: value,
            keyword_type: "news",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: userId,
          };
          await model.peopleKeywords.create(newsKeywordData);
          actionDate = newsKeywordData.created_at;
        }
      }
      // ----------------------------Job Details
      let originalJobList = [];
      let requestedJobList = [];

      // 1.Get the Original Job List
      const originalJobDetails = await model.peopleJobs.findAll({
        where: {
          people_id: peopleId,
          status: "active",
        },
        order: [["id", "DESC"]],
      });
      if (originalJobDetails.length > 0) {
        for (const jobValue of originalJobDetails) {
          if (jobValue && jobValue.job_id) {
            originalJobList.push(jobValue.job_id);
          }
        }
      }
      let peopleJobListOrder =
        originalJobDetails.length > 0 && originalJobDetails[0].list_order
          ? originalJobDetails[0].list_order + 1
          : 1;
      //2. Get Requested Job Details
      const peopleJobDetails =
        findRequestId[0].job_details != null ? JSON.parse(findRequestId[0].job_details) : null;
      if (peopleJobDetails != null && peopleJobDetails.list.length > 0) {
        for (const value of peopleJobDetails.list) {
          if (value && value.job_id) {
            if (typeof value.job_id == "string") {
              requestedJobList.push(parseInt(value.job_id));
            } else {
              requestedJobList.push(value.job_id);
            }
          }
        }
      }
      //3. Finding the Job that is not changed:
      let unchangedJob = originalJobList.filter((x) => requestedJobList.includes(x));
      //4. Finding the Job that is Newly Added:
      let newlyAddedJob = requestedJobList.filter((x) => !originalJobList.includes(x));
      //5. Deleting all the Job except unchanged:
      const pjData = {
        status: "deleted",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.peopleJobs.update(pjData, {
        where: {
          people_id: peopleId,
          job_id: { [Op.notIn]: unchangedJob },
        },
      });
      actionDate = pjData.updated_at;

      //6. Creating new Job which is not in the original list
      if (newlyAddedJob.length > 0) {
        for (const value of newlyAddedJob) {
          if (value) {
            const peopleJobs = {
              people_id: peopleId,
              job_id: value,
              list_order: peopleJobListOrder,
              site_language: findRequestId[0].site_language,
              created_by: userId,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.peopleJobs.create(peopleJobs);
            actionDate = peopleJobs.created_at;
            peopleJobListOrder += 1;
          }
        }
      }
      // Adding poster image from the people request Table
      // 1.Get the Poster Image Details
      const posterDetails = await model.peopleImages.findAll({
        where: {
          people_id: peopleId,
          status: "active",
          image_category: "poster_image",
        },
        order: [["id", "DESC"]],
      });
      let posterImageListOrder =
        posterDetails.length > 0 && posterDetails[0].list_order
          ? posterDetails[0].list_order + 1
          : 1;
      if (findRequestId[0].poster != null && findRequestId[0].poster != "") {
        const posterImageData = {
          path: findRequestId[0].poster ? findRequestId[0].poster : null,
          people_id: peopleId,
          source: findRequestId[0].source ? findRequestId[0].source : "local",
          list_order: posterImageListOrder,
          image_category: "poster_image",
          is_main_poster: "y",
          site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        };
        await model.peopleImages.create(posterImageData);
        actionDate = posterImageData.created_at;
      }

      // ---------------------Media Details-----------------------
      // storing the people media details ::
      let requestId = [];
      let foundMediaData = [];
      for (const value of findRequestId) {
        if (value.id) requestId.push(value.id);
        foundMediaData = await model.peopleRequestMedia.findAll({
          where: {
            request_id: {
              [Op.in]: requestId,
            },
            status: "active",
          },
          order: [
            ["updated_at", "DESC"],
            ["id", "DESC"],
          ],
        });
      }

      if (foundMediaData.length > 0) {
        // --------------------1.Video Details
        let originalVideoList = [];
        let requestedVideoList = [];
        let requestedEditedVideoList = [];
        let requestNewVideoList = [];
        // 1.Get the Original Video List
        const originalVideoDetails = await model.video.findAll({
          where: {
            title_id: peopleId,
            video_for: "people",
            status: "active",
          },
          order: [["id", "DESC"]],
        });
        if (originalVideoDetails.length > 0) {
          for (const videoValue of originalVideoDetails) {
            if (videoValue && videoValue.id) {
              originalVideoList.push(videoValue.id);
            }
          }
        }
        let videoListOrder =
          originalVideoDetails.length > 0 && originalVideoDetails[0].list_order
            ? originalVideoDetails[0].list_order + 1
            : 1;
        //2. Get Requested Country
        const parsedVideoDetails =
          foundMediaData[0].video_details != null
            ? JSON.parse(foundMediaData[0].video_details)
            : null;
        if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
          for (const value of parsedVideoDetails.list) {
            if (value && value.id) {
              requestedVideoList.push(value.id);
              requestedEditedVideoList.push(value);
            } else if (value && value.id == "") {
              requestNewVideoList.push(value);
            }
          }
        }
        //3. Finding the Video that is not changed:
        let unchangedVideo = originalVideoList.filter((x) => requestedVideoList.includes(x));
        let editedVideo = requestedEditedVideoList.filter((x) => unchangedVideo.includes(x.id));
        //4. Finding the Video that is Newly Added:

        // 5. Deleting all the Job except unchanged:
        const uvData = {
          status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.video.update(uvData, {
          where: {
            title_id: peopleId,
            id: { [Op.notIn]: unchangedVideo },
            video_for: "people",
          },
        });
        isVideoModified = true;
        actionDate = uvData.updated_at;

        // 6. Creating new Video which is not in the original list
        if (requestNewVideoList.length > 0) {
          for (const value of requestNewVideoList) {
            if (value && value.id == "") {
              const videoData = {
                name: value.name,
                thumbnail: value.thumbnail ? value.thumbnail : null,
                url: value.url ? value.url : null,
                type: value.type,
                quality: value.quality ? value.quality : null,
                title_id: peopleId,
                source: value.source ? value.source : "local",
                negative_votes: value.negative_votes ? value.negative_votes : 0,
                positive_votes: value.positive_votes ? value.positive_votes : 0,
                reports: value.reports ? value.reports : 0,
                approved: value.approved ? value.approved : 1,
                list_order: videoListOrder,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                user_id: userId,
                category: value.category ? value.category : "trailer",
                is_official_trailer: value.is_official_trailer ? value.is_official_trailer : null,
                site_language: value.site_language ? value.site_language : "en",
                created_by: userId,
                video_source: value.url ? await generalHelper.checkUrlSource(value.url) : "",
                video_for: "people",
                no_of_view: value.no_of_view ? value.no_of_view : 0,
                video_duration: value.video_duration ? value.video_duration : null,
                ele_no_of_view: 0,
              };
              await model.video.create(videoData);
              actionDate = videoData.created_at;
              isVideoModified = true;
              videoListOrder += 1;
            }
          }
        }

        // 7. Editing the existing video: only official trailer change
        if (editedVideo.length > 0) {
          for (const value of editedVideo) {
            if (value && value.id) {
              const edvData = {
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                user_id: userId,
                thumbnail: value.thumbnail ? value.thumbnail : null,
                no_of_view: value.no_of_view ? value.no_of_view : 0,
                video_duration: value.video_duration ? value.video_duration : null,
                is_official_trailer: value.is_official_trailer ? value.is_official_trailer : null,
                updated_by: userId,
              };
              await model.video.update(edvData, {
                where: {
                  title_id: peopleId,
                  id: value.id,
                  video_for: "people",
                },
              });
              actionDate = edvData.updated_at;
              isVideoModified = true;
            }
          }
        }
        // --------------------2.Image Details
        let originalImageIdList = [];
        let originalBgIdList = [];
        let requestedImageIdList = [];
        let requestedBgIdList = [];
        let requestNewImageList = [];
        let requestNewBgList = [];
        // 1.Get the Original Image List
        const originalImageDetails = await model.peopleImages.findAll({
          where: {
            people_id: peopleId,
            status: "active",
          },
          order: [["id", "DESC"]],
        });
        if (originalImageDetails.length > 0) {
          for (const imageValue of originalImageDetails) {
            if (imageValue && imageValue.id && imageValue.image_category == "image") {
              originalImageIdList.push(imageValue.id);
            } else if (imageValue && imageValue.id && imageValue.image_category == "bg_image") {
              originalBgIdList.push(imageValue.id);
            }
          }
        }
        let imageListOrder =
          originalImageDetails.length > 0 && originalImageDetails[0].list_order
            ? originalImageDetails[0].list_order + 1
            : 1;
        //2. Get Requested Search and News Keyword
        const parsedImageDetails =
          foundMediaData[0].image_details != null
            ? JSON.parse(foundMediaData[0].image_details)
            : null;

        const parsedBackgroundImageDetails =
          foundMediaData[0].background_image_details != null
            ? JSON.parse(foundMediaData[0].background_image_details)
            : null;

        if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
          for (const value of parsedImageDetails.list) {
            if (value && value.id) {
              requestedImageIdList.push(value.id);
            } else if (value && value.id == "") {
              requestNewImageList.push(value);
            }
          }
        }
        if (parsedBackgroundImageDetails != null && parsedBackgroundImageDetails.list.length > 0) {
          for (const value of parsedBackgroundImageDetails.list) {
            if (value && value.id) {
              requestedBgIdList.push(value.id);
            } else if (value && value.id == "") {
              requestNewBgList.push(value);
            }
          }
        }
        //3. Finding the Image and Bg Image that is not changed:
        let unchangedImage = originalImageIdList.filter((x) => requestedImageIdList.includes(x));
        let unchangedBgImage = originalBgIdList.filter((x) => requestedBgIdList.includes(x));
        const allUnchangedMedia = [...unchangedImage, ...unchangedBgImage];
        //4. Finding the Image and Bg that is Newly Added:

        // 5. Deleting all the Media except unchanged:
        const piuData = {
          status: "deleted",
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: userId,
        };
        await model.peopleImages.update(piuData, {
          where: {
            people_id: peopleId,
            id: { [Op.notIn]: allUnchangedMedia },
            image_category: ["image", "bg_image"],
          },
        });
        actionDate = piuData.updated_at;

        // // 6. Creating new Image which is not in the original list
        if (requestNewImageList.length > 0) {
          for (const value of requestNewImageList) {
            if (value && value.id == "") {
              const imageData = {
                original_name: value.original_name ? value.original_name : null,
                file_name: value.file_name ? value.file_name : null,
                url: value.url ? value.url : null,
                path: value.path ? value.path : null,
                file_size: value.file_size ? value.file_size : null,
                mime_type: value.mime_type ? value.mime_type : null,
                file_extension: value.file_extension ? value.file_extension : null,
                people_id: peopleId,
                source: value.source ? value.source : "local",
                approved: value.approved ? value.approved : 1,
                list_order: imageListOrder,
                image_category: value.image_category ? value.image_category : "image",
                is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                site_language: value.site_language ? value.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.peopleImages.create(imageData);
              actionDate = imageData.created_at;
              imageListOrder += 1;
            }
          }
        }
        // // 7. Creating new Bg_image which is not in the original list
        if (requestNewBgList.length > 0) {
          for (const value of requestNewBgList) {
            if (value && value.id == "") {
              const backgroundImageData = {
                original_name: value.original_name ? value.original_name : null,
                file_name: value.file_name ? value.file_name : null,
                url: value.url ? value.url : null,
                path: value.path ? value.path : null,
                file_size: value.file_size ? value.file_size : null,
                mime_type: value.mime_type ? value.mime_type : null,
                file_extension: value.file_extension ? value.file_extension : null,
                people_id: peopleId,
                source: value.source ? value.source : "local",
                approved: value.approved ? value.approved : 1,
                list_order: imageListOrder,
                image_category: value.image_category ? value.image_category : "bg_image",
                is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                site_language: value.site_language ? value.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.peopleImages.create(backgroundImageData);
              actionDate = backgroundImageData.created_at;
              imageListOrder += 1;
            }
          }
        }
      }

      //add scheudle to update search db
      if (peopleId) {
        const payload = {
          list: [{ record_id: peopleId, type: "people", action: "edit" }],
        };
        schedulerJobService.addJobInScheduler(
          "edit people data to search db",
          JSON.stringify(payload),
          "search_db",
          `Sumbit all people Details`,
          userId,
        );

        //
        // service add for update data in edb_edits table
        await titleService.titleDataAddEditInEditTbl(peopleId, "people", userId, actionDate);
        //update related search db video
        if (isVideoModified) {
          schedulerJobService.addJobInScheduler(
            "video add in search db",
            JSON.stringify({
              list: [{ item_id: peopleId, item_type: "people", type: "people" }],
            }),
            "update_video_search_data_by_item_id",
            "people video add in search db when people data update in edit submit all",
            userId,
          );
        }
      }
      await model.peopleRequestPrimaryDetails.update(
        { request_status: "accept", updated_at: await customDateTimeHelper.getCurrentDateTime() },
        { where: { relation_id: relationId } },
      );
      res.ok({ message: res.__("Data has been successfully submitted") });
    } else {
      throw StatusError.badRequest(res.__("No data found for the requestId"));
    }
  } catch (error) {
    next(error);
  }
};
