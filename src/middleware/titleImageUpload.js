import multer from "multer";
import multerS3 from "multer-s3";
import { awsService } from "../services/index.js";
import { envs } from "../config/index.js";

const s3 = new awsService.AWS.S3();
const bucketName = envs.s3.BUCKET_NAME;

const storage = multerS3({
  s3: s3,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  bucket: function (req, file, cb) {
    let directory = `${bucketName}/uploads/temp/title`;
    if (typeof req.body.draft_request_id != "undefined" && req.body.draft_request_id) {
      directory = `${bucketName}/uploads/temp/${req.body.draft_request_id}/images/original`;
    } else if (typeof req.body.title_id != "undefined" && req.body.title_id) {
      directory = `${bucketName}/uploads/title/${req.body.title_id}/images/original`;
    }
    cb(null, directory);
  },
  key: function (req, file, cb) {
    const fileName = file.originalname.split(".").shift();
    const timestamp = Date.now();
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    const originalName = file.originalname;
    const extension = originalName.slice(originalName.lastIndexOf("."));
    const newFileName = `${fileName}-${randomNumbers}-${timestamp}${extension}`;
    cb(null, newFileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    return cb({ code: "LIMIT_FILE_TYPE" });
  }
};

const titleImageUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 25 },
  fileFilter: fileFilter,
});
export { titleImageUpload };
