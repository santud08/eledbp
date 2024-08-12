import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

export const addMovieTmdbImages = async (
  data,
  titleId,
  imageType,
  createdBy,
  siteLanguage = "en",
) => {
  try {
    if (data && data != null && data.length > 0) {
      let im = 1;
      let actionDate = "";
      let recordId = "";
      for (const tmdbImgData of data) {
        //Insert title image into title image table for english language
        const createEnData = {
          original_name: tmdbImgData.originalname,
          file_name: tmdbImgData.filename,
          path: tmdbImgData.path,
          file_extension: tmdbImgData.file_extension,
          title_id: titleId,
          source: "tmdb",
          image_category: imageType,
          site_language: siteLanguage,
          created_by: createdBy,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        if ((imageType == "poster_image" || imageType == "bg_image") && im == 1) {
          createEnData.is_main_poster = "y";
        } else {
          createEnData.is_main_poster = "n";
        }
        await model.titleImage.create(createEnData);
        actionDate = createEnData.created_at;
        recordId = titleId;
        im++;
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "title", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
