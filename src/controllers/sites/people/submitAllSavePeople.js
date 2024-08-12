import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { peopleService, titleService, schedulerJobService } from "../../../services/index.js";

/**
 * submitAllSavePeople
 * @param req
 * @param res
 */
export const submitAllSavePeople = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    let actionDate = "";
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const relationId = req.body.draft_relation_id;
    let isVideoAdded = false;

    //save people primary details
    const findRequestId = await model.peopleRequestPrimaryDetails.findAll({
      where: {
        relation_id: relationId,
        status: "active",
        request_status: "draft",
      },
      order: [
        ["updated_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    if (findRequestId.length > 0) {
      const uniqueId = uuidv4();
      const peopleData = {
        uuid: uniqueId ? uniqueId : null,
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
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      if (findRequestId[0].tmdb_id) {
        const isExist = await model.people.findOne({
          where: {
            tmdb_id: findRequestId[0].tmdb_id,
            status: "active",
          },
        });
        if (isExist) throw StatusError.badRequest(res.__("TMDB ID already exist"));
      }
      if (findRequestId[0].kobis_id) {
        const isExist = await model.people.findOne({
          where: {
            kobis_id: findRequestId[0].kobis_id,
            status: "active",
          },
        });
        if (isExist) throw StatusError.badRequest(res.__("KOBIS ID already exist"));
      }
      const newPeople = await model.people.create(peopleData);

      // language independent changes
      if (newPeople.id) {
        actionDate = peopleData.created_at;
        // ----------------------------Language Dependent Fields-------------------
        // Finding all the request with respect to language- inserting data into People Translation
        for (const peopleDetails of findRequestId) {
          const peopleTranslationData = {
            people_id: newPeople.id,
            site_language: peopleDetails.site_language,
            name: peopleDetails.name ? peopleDetails.name : null,
            known_for: findRequestId[0].known_for ? findRequestId[0].known_for : null,
            description: peopleDetails.description ? peopleDetails.description : null,
            created_by: userId,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          if (
            !(await model.peopleTranslation.findOne({
              where: { people_id: newPeople.id, site_language: peopleDetails.site_language },
            }))
          ) {
            await model.peopleTranslation.create(peopleTranslationData);
            actionDate = peopleTranslationData.created_at;
          }
        }

        let peopleJobListOrder = 1;
        //   create the data in the People countries table
        const peopleCountryDetails =
          findRequestId[0].country_details != null
            ? JSON.parse(findRequestId[0].country_details)
            : null;
        if (peopleCountryDetails != null && peopleCountryDetails.list.length > 0) {
          for (const value of peopleCountryDetails.list) {
            const peopleCountries = {
              people_id: newPeople.id,
              country_id: value.country_id ? value.country_id : null,
              birth_place: value.birth_place ? value.birth_place : null,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.peopleCountries.create(peopleCountries);
            actionDate = peopleCountries.created_at;
          }
          await peopleService.updatePeopleKoreanBirthPlace(newPeople.id);
        }

        // create a data for people_keywords :
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
            const searchKeywordData = {
              people_id: newPeople.id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              keyword: value.keyword ? value.keyword : null,
              keyword_type: value.keyword_type ? value.keyword_type : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.peopleKeywords.create(searchKeywordData);
            actionDate = searchKeywordData.created_at;
          }
        }
        if (newsKeywordDetails != null && newsKeywordDetails.list.length > 0) {
          for (const value of newsKeywordDetails.list) {
            const newsKeywordData = {
              people_id: newPeople.id,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              keyword: value.keyword ? value.keyword : null,
              keyword_type: value.keyword_type ? value.keyword_type : null,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.peopleKeywords.create(newsKeywordData);
            actionDate = newsKeywordData.created_at;
          }
        }

        //   create the data in the People countries table
        const peopleJobDetails =
          findRequestId[0].job_details != null ? JSON.parse(findRequestId[0].job_details) : null;
        if (peopleJobDetails != null && peopleJobDetails.list.length > 0) {
          for (const value of peopleJobDetails.list) {
            const peopleJobs = {
              people_id: newPeople.id,
              job_id: value.job_id,
              list_order: peopleJobListOrder,
              site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.peopleJobs.create(peopleJobs);
            actionDate = peopleJobs.created_at;
            peopleJobListOrder += 1;
          }
        }

        // poster image from the add people form data:
        if (findRequestId[0].poster != null && findRequestId[0].poster != "") {
          const getLastOrder = await model.peopleImages.max("list_order", {
            where: {
              people_id: newPeople.id,
              image_category: "image",
            },
          });
          const fileName = findRequestId[0].poster
            ? findRequestId[0].poster.substring(findRequestId[0].poster.lastIndexOf("/") + 1)
            : null;
          const posterImageData = {
            file_name: fileName ? fileName : null,
            path: findRequestId[0].poster ? findRequestId[0].poster : null,
            people_id: newPeople.id,
            source: findRequestId[0].source ? findRequestId[0].source : "local",
            list_order: getLastOrder ? getLastOrder + 1 : 1,
            image_category: "poster_image",
            is_main_poster: "y",
            site_language: findRequestId[0].site_language ? findRequestId[0].site_language : "en",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: userId,
          };
          await model.peopleImages.create(posterImageData);
          actionDate = posterImageData.created_at;
        }

        //----------------------------------Media Section-----------------------------------
        // List Ordet People ID wise
        let videoListOrder = 1;
        let mediaImageListOrder = 1;
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
          const parsedVideoDetails =
            foundMediaData[0].video_details != null
              ? JSON.parse(foundMediaData[0].video_details)
              : null;
          const parsedImageDetails =
            foundMediaData[0].image_details != null
              ? JSON.parse(foundMediaData[0].image_details)
              : null;

          const parsedBackgroundImageDetails =
            foundMediaData[0].background_image_details != null
              ? JSON.parse(foundMediaData[0].background_image_details)
              : null;
          if (parsedVideoDetails != null && parsedVideoDetails.list.length > 0) {
            for (const value of parsedVideoDetails.list) {
              const videoData = {
                name: value.name,
                thumbnail: value.thumbnail ? value.thumbnail : null,
                url: value.url ? value.url : null,
                type: value.type,
                quality: value.quality ? value.quality : null,
                title_id: newPeople.id,
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
              isVideoAdded = true;
              videoListOrder += 1;
            }
          }
          if (parsedImageDetails != null && parsedImageDetails.list.length > 0) {
            for (const value of parsedImageDetails.list) {
              const imageData = {
                original_name: value.original_name ? value.original_name : null,
                file_name: value.file_name ? value.file_name : null,
                url: value.url ? value.url : null,
                path: value.path ? value.path : null,
                file_size: value.file_size ? value.file_size : null,
                mime_type: value.mime_type ? value.mime_type : null,
                file_extension: value.file_extension ? value.file_extension : null,
                people_id: newPeople.id,
                source: value.source ? value.source : "local",
                approved: value.approved ? value.approved : 1,
                list_order: mediaImageListOrder,
                image_category: value.image_category ? value.image_category : "image",
                is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                site_language: value.site_language ? value.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.peopleImages.create(imageData);
              actionDate = imageData.created_at;
              mediaImageListOrder += 1;
            }
          }

          if (
            parsedBackgroundImageDetails != null &&
            parsedBackgroundImageDetails.list.length > 0
          ) {
            for (const value of parsedBackgroundImageDetails.list) {
              const backgroundImageData = {
                original_name: value.original_name ? value.original_name : null,
                file_name: value.file_name ? value.file_name : null,
                url: value.url ? value.url : null,
                path: value.path ? value.path : null,
                file_size: value.file_size ? value.file_size : null,
                mime_type: value.mime_type ? value.mime_type : null,
                file_extension: value.file_extension ? value.file_extension : null,
                people_id: newPeople.id,
                source: value.source ? value.source : "local",
                approved: value.approved ? value.approved : 1,
                list_order: mediaImageListOrder,
                image_category: value.image_category ? value.image_category : "image",
                is_main_poster: value.is_main_poster ? value.is_main_poster : null,
                site_language: value.site_language ? value.site_language : "en",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.peopleImages.create(backgroundImageData);
              actionDate = backgroundImageData.created_at;
              mediaImageListOrder += 1;
            }
          }
        }
      }

      //add scheudle to update search db
      if (newPeople.id) {
        const payload = {
          list: [{ record_id: newPeople.id, type: "people", action: "add" }],
        };
        schedulerJobService.addJobInScheduler(
          "add people data to search db",
          JSON.stringify(payload),
          "search_db",
          `Sumbit all people Details`,
          userId,
        );
        //
        //add related search db video
        if (isVideoAdded) {
          schedulerJobService.addJobInScheduler(
            "video add in search db",
            JSON.stringify({
              list: [{ item_id: newPeople.id, item_type: "people", type: "people" }],
            }),
            "update_video_search_data_by_item_id",
            "people video add in search db when people data add in submit all",
            userId,
          );
        }
        // service add for update data in edb_edits table
        await titleService.titleDataAddEditInEditTbl(newPeople.id, "people", userId, actionDate);
      }

      await model.peopleRequestPrimaryDetails.update(
        { request_status: "accept" },
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
