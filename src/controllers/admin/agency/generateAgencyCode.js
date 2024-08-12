import { generalHelper } from "../../../helpers/index.js";

/**
 * generateAgencyCode
 * @param req
 * @param res
 */
export const generateAgencyCode = async (req, res, next) => {
  try {
    const generatedCode = await generalHelper.generateAgencyCode();

    res.ok({
      generated_agency_code: generatedCode,
    });
  } catch (error) {
    next(error);
  }
};
