import model from "../../models/index.js";
import { tmdbService } from "../../services/index.js";

/**
 * getTmdbRefreshMediaData
 * @param tmdbId
 * @param mediaType
 * @param peopleId
 * @param siteLanguage
 */
export const getTmdbRefreshMediaData = async (tmdbId, mediaType, peopleId, siteLanguage) => {
  try {
    let videoResponseDetails = [];
    let imageResponseDetails = [];
    let backgroundImageResponseDetails = [];

    const peopleTmdbImage = await tmdbService.fetchPeopleImages(tmdbId, siteLanguage);
    if (mediaType === "image" && peopleTmdbImage && peopleTmdbImage.results) {
      if (peopleTmdbImage.results.images && peopleTmdbImage.results.images.length > 0) {
        for (const imageDetails of peopleTmdbImage.results.images) {
          const data = {
            image_category: "image",
            image_file_name: imageDetails.filename ? imageDetails.filename : "",
            image_original_name: imageDetails.originalname ? imageDetails.originalname : "",
            image_path: imageDetails.path ? imageDetails.path : "",
            size: imageDetails.size ? imageDetails.size : "",
            file_extension: imageDetails.file_extension ? imageDetails.file_extension : "",
            mime_type: imageDetails.mime_type ? imageDetails.mime_type : "",
          };
          const imageData = await model.peopleImages.findOne({
            attributes: ["id"],
            where: {
              people_id: peopleId,
              image_category: "image",
              status: "active",
              path: imageDetails.path,
            },
          });
          data.id = imageData && imageData.id ? imageData.id : "";
          imageResponseDetails.push(data);
        }
      }
    }

    return {
      video_details: videoResponseDetails,
      image_details: imageResponseDetails,
      bg_image_details: backgroundImageResponseDetails,
    };
  } catch (error) {
    console.log("error", error);
    return {
      video_details: [],
      image_details: [],
      bg_image_details: [],
    };
  }
};
