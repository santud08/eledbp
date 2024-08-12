import { esService } from "../../../services/index.js";

/**
 * esGetIndexNames
 * @param req
 * @param res
 */

export const esGetIndexNames = async (req, res, next) => {
  try {
    const raw = !req.query.raw ? "false" : req.query.raw;
    const indexNames = await esService.getIndices({ raw: raw });
    res.ok({ results: indexNames });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
