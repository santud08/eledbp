/* eslint-disable no-unused-vars */
export const handleError = (err, req, res, next) => {
  // Handel multer error
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).send({ error: res.__("fileSizeNotMatch") });
  } else if (err.code === "LIMIT_FILE_TYPE") {
    res.status(400).send({ error: res.__("invalidFile") });
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).send({ error: res.__("maximumFileLimit") });
  } else {
    if (typeof err.message === "object") {
      res.status(err.statusCode).send({ error: err.message });
    } else {
      let message;
      let status;

      if (err.statusCode) {
        message = err.message || res.__("serverError");
        status = err.statusCode;
      } else {
        message = res.__("serverError");
        status = 500;
      }

      res.locals.error = res.__(message);

      res.status(status).send({ error: res.__(message) });
    }
  }
};
