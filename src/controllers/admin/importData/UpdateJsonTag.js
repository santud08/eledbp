import model from "../../../models/index.js";
import { importClientJsonService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";
import fs from "fs";

/**
 * UpdateJsonTag
 * used for developer purpose to update the data
 * only run when its required with proper information
 * @param req
 * @param res
 */
export const UpdateJsonTag = async (req, res, next) => {
  try {
    const reqBody = req.body;
    let jsonData = [];
    const userId = req.userDetails.userId;
    const fileName = reqBody.file_name ? reqBody.file_name : "";
    const offset = reqBody.offset ? parseInt(reqBody.offset) : 0;
    const limit = reqBody.limit ? parseInt(reqBody.limit) : 10;
    if (fileName) {
      const jsonFileData = `public/uploads/bulks/import/client-sample-files/${fileName}`;
      const readData = fs.readFileSync(jsonFileData, { encoding: "utf8" });
      jsonData = JSON.parse(readData);
      const totalRecords = jsonData.length > 0 ? jsonData.length : 0;
      jsonData = jsonData.slice(offset, offset + limit);
      if (jsonData.length > 0) {
        for (let getValue of jsonData) {
          let titleId = "";
          const getType = getValue["tmdb_type"] ? getValue["tmdb_type"].toLowerCase() : "";
          const tmdbId = getValue["tmdb_id"];

          const getGenres = getValue["genres"] ? getValue["genres"] : [];
          const getThemes = getValue["themes"] ? getValue["themes"] : []; // Subject
          const getMaterials = getValue["materials"] ? getValue["materials"] : [];
          const getMood = getValue["mood"] ? getValue["mood"] : [];
          const getPurposes = getValue["purposes"] ? getValue["purposes"] : [];
          const getCountryTag = getValue["locations"]["country"];
          const getPlace = getValue["locations"]["place"];
          const getEra = getValue["times"]["era"];
          const getYear = getValue["times"]["year"];
          const getCharacteristics = getValue["characteristics"] ? getValue["characteristics"] : [];

          const tivingId = getValue["content_id"] ? getValue["content_id"] : null; //tiving_id
          if (tmdbId && getType) {
            const getTitleInformations = await model.title.findOne({
              attributes: ["id", "type", "tiving_id"],
              where: {
                type: getType,
                tmdb_id: tmdbId,
                record_status: "active",
              },
            });

            titleId =
              getTitleInformations && getTitleInformations.id ? getTitleInformations.id : "";
            const dbTivingId =
              getTitleInformations && getTitleInformations.tiving_id
                ? getTitleInformations.tiving_id
                : "";
            // credit details and series title are taken from JSON
            if (titleId) {
              let tagData = [];
              // Store Genre Tag data
              if (getGenres !== undefined && getGenres.length > 0) {
                tagData = [...tagData, ...getGenres];
              }
              // Store Themes Tag data
              if (getThemes !== undefined && getThemes.length > 0) {
                tagData = [...tagData, ...getThemes];
              }
              // Store Materials Tag data
              if (getMaterials !== undefined && getMaterials.length > 0) {
                tagData = [...tagData, ...getMaterials];
              }
              // Store Mood Tag data
              if (getMood !== undefined && getMood.length > 0) {
                tagData = [...tagData, ...getMood];
              }
              // Store Purposes Tag data
              if (getPurposes !== undefined && getPurposes.length > 0) {
                tagData = [...tagData, ...getPurposes];
              }
              // Store Characteristics Tag data
              if (getCharacteristics !== undefined && getCharacteristics.length > 0) {
                tagData = [...tagData, ...getCharacteristics];
              }
              // Store CountryTag Tag data
              if (getCountryTag !== undefined && getCountryTag.length > 0) {
                tagData = [...tagData, ...getCountryTag];
              }
              // Store Place Tag data
              if (getPlace !== undefined && getPlace.length > 0) {
                tagData = [...tagData, ...getPlace];
              }
              // Store Era Tag data
              if (getEra !== undefined && getEra.length > 0) {
                tagData = [...tagData, ...getEra];
              }
              // Store Year Tag data
              if (getYear !== undefined && getYear.length > 0) {
                tagData = [...tagData, ...getYear];
              }
              if (tagData.length > 0) {
                await importClientJsonService.addTagDetails(titleId, tagData, userId);
              }

              // update content ID -- tvying id
              if (!dbTivingId && tivingId) {
                await model.title.update({ tiving_id: tivingId }, { where: { id: titleId } });
              }
            }
          }
        }
      }
      res.ok({
        message: res.__("success"),
        offset: offset,
        limit: limit,
        total_records: totalRecords,
        total_pages: totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0,
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
